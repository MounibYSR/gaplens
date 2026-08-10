"use server";

import { createClient } from "@/lib/supabase/server";
import { askOpenAIStructured, imageDataUri, type ChatContentPart } from "@/lib/ai/azure-openai";
import { checkSessionRateLimit } from "@/lib/rate-limit";
import {
  buildChannelSystemPrompt,
  buildCrossChannelSystemPrompt,
  type VisualSourceTag,
} from "@/lib/visual-identity/system-prompt";
import { VISUAL_IDENTITY_GAPS_ARRAY_SCHEMA } from "@/lib/visual-identity/schema";
import type { RoadmapGap } from "@/lib/roadmap/build-prompt";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const MAX_IMAGES = 10;
const VALID_SOURCES = new Set<VisualSourceTag>(["website", "instagram", "logo", "other"]);

export type VisualIdentityError =
  | "rate_limited"
  | "ai_failed"
  | "no_images"
  | "too_many_images"
  | "invalid_image"
  | "missing_source";

export type VisualIdentityResult = { gaps: RoadmapGap[] } | { error: VisualIdentityError };

async function fileToImagePart(file: File): Promise<ChatContentPart> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return { type: "image_url", image_url: { url: imageDataUri(buffer.toString("base64"), file.type) } };
}

export async function runVisualIdentityConsultation(formData: FormData): Promise<VisualIdentityResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const sessionId = formData.get("sessionId");
  const lang = (formData.get("lang") as EntryLang | null) ?? "en";
  if (typeof sessionId !== "string") throw new Error("Invalid request");

  const { data: session } = await supabase
    .from("assessment_sessions")
    .select("id, company_id")
    .eq("id", sessionId)
    .single();
  if (!session) throw new Error("Session not found");

  const { data: company } = await supabase.from("companies").select("name").eq("id", session.company_id).single();
  const companyName = company?.name ?? "Your Company";

  const rateLimit = await checkSessionRateLimit({
    sessionId,
    table: "visual_consultations",
    windowMinutes: 60,
    maxCount: 10,
    supabase,
  });
  if (!rateLimit.allowed) return { error: "rate_limited" };

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const sourceValues = formData.getAll("sources").map((s) => String(s));

  if (files.length === 0) return { error: "no_images" };
  if (files.length > MAX_IMAGES) return { error: "too_many_images" };
  if (sourceValues.length !== files.length) return { error: "missing_source" };
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) return { error: "invalid_image" };
  }
  for (const source of sourceValues) {
    if (!VALID_SOURCES.has(source as VisualSourceTag)) return { error: "missing_source" };
  }

  const byChannel = new Map<VisualSourceTag, File[]>();
  files.forEach((file, i) => {
    const tag = sourceValues[i] as VisualSourceTag;
    const list = byChannel.get(tag) ?? [];
    list.push(file);
    byChannel.set(tag, list);
  });
  const presentChannels = Array.from(byChannel.keys());

  // Layer 1 — one focused call per present channel, run in parallel.
  let layer1Results: RoadmapGap[][];
  try {
    layer1Results = await Promise.all(
      presentChannels.map(async (channel) => {
        const channelFiles = byChannel.get(channel)!;
        const imageParts = await Promise.all(channelFiles.map(fileToImagePart));
        const system = buildChannelSystemPrompt(channel, companyName, lang);
        const response = await askOpenAIStructured<{ gaps: RoadmapGap[] }>({
          system,
          messages: [
            {
              role: "user",
              content: [{ type: "text", text: `Review these ${channel} image(s) and report your findings now.` }, ...imageParts],
            },
          ],
          toolName: "submit_visual_identity_review",
          toolDescription: "Submit the structured findings from this channel review.",
          inputSchema: VISUAL_IDENTITY_GAPS_ARRAY_SCHEMA,
          maxTokens: 2000,
        });
        if ("refusal" in response) return [];
        return response.result.gaps;
      }),
    );
  } catch {
    return { error: "ai_failed" };
  }

  const layer1Gaps = layer1Results.flat();

  // Layer 2 — a single cross-channel comparison, only when there's something to compare.
  let layer2Gaps: RoadmapGap[] = [];
  if (presentChannels.length >= 2) {
    try {
      const labeledImageParts: ChatContentPart[] = [];
      for (const channel of presentChannels) {
        for (const file of byChannel.get(channel)!) {
          labeledImageParts.push({ type: "text", text: `[${channel}]` });
          labeledImageParts.push(await fileToImagePart(file));
        }
      }
      const system = buildCrossChannelSystemPrompt(companyName, presentChannels, lang);
      const response = await askOpenAIStructured<{ gaps: RoadmapGap[] }>({
        system,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: "Compare these labeled images across channels and report your findings now." }, ...labeledImageParts],
          },
        ],
        toolName: "submit_cross_channel_review",
        toolDescription: "Submit the structured cross-channel comparison findings.",
        inputSchema: VISUAL_IDENTITY_GAPS_ARRAY_SCHEMA,
        maxTokens: 1500,
      });
      if (!("refusal" in response)) layer2Gaps = response.result.gaps;
    } catch {
      // Layer 2 is additive on top of Layer 1 — a failure here shouldn't
      // discard the per-channel findings that already succeeded.
    }
  }

  const gaps = [...layer1Gaps, ...layer2Gaps];

  const { error: insertError } = await supabase.from("visual_consultations").insert({
    session_id: sessionId,
    type: "visual_identity",
    result_gaps: { gaps },
  });
  if (insertError) throw insertError;

  return { gaps };
}
