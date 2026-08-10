"use server";

import { createClient } from "@/lib/supabase/server";
import { askOpenAI } from "@/lib/ai/azure-openai";
import { checkSessionRateLimit } from "@/lib/rate-limit";
import { splitContext, maybeSummarizeFreeformChat } from "@/lib/freeform-chat/context";
import { buildFreeformSystemPrompt, buildAiInitiativeSystemPrompt } from "@/lib/freeform-chat/system-prompt";
import type { RoadmapGap } from "@/lib/roadmap/build-prompt";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";

type ChatResult = { reply: string } | { error: "rate_limited" | "ai_failed" };

async function loadCompanyContext(sessionId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: session } = await supabase
    .from("assessment_sessions")
    .select("company_id")
    .eq("id", sessionId)
    .single();
  if (!session) throw new Error("Session not found");

  const { data: company } = await supabase
    .from("companies")
    .select("name, freeform_chat_summary, freeform_chat_summarized_count")
    .eq("id", session.company_id)
    .single();

  const { data: latestVersion } = await supabase
    .from("roadmap_versions")
    .select("roadmap_json")
    .eq("session_id", sessionId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const allGaps = ((latestVersion?.roadmap_json as { gaps?: RoadmapGap[] } | null)?.gaps ?? []) as RoadmapGap[];
  const openGaps = allGaps.filter((g) => g.status !== "resolved");

  return {
    supabase,
    companyId: session.company_id,
    companyName: company?.name ?? "Your Company",
    openGaps,
    summary: company?.freeform_chat_summary ?? null,
    summarizedCount: company?.freeform_chat_summarized_count ?? 0,
  };
}

export async function sendFreeformMessage(params: {
  sessionId: string;
  text: string;
  lang: EntryLang;
}): Promise<ChatResult> {
  const { supabase, companyId, companyName, openGaps, summary, summarizedCount } =
    await loadCompanyContext(params.sessionId);

  const rateLimit = await checkSessionRateLimit({
    sessionId: params.sessionId,
    table: "freeform_chat_messages",
    windowMinutes: 60,
    maxCount: 60,
    supabase,
  });
  if (!rateLimit.allowed) return { error: "rate_limited" };

  const { data: existing } = await supabase
    .from("freeform_chat_messages")
    .select("role, content, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  const { recentMessages } = splitContext(existing ?? [], summarizedCount);

  await supabase.from("freeform_chat_messages").insert({ company_id: companyId, role: "user", content: params.text });

  const system = buildFreeformSystemPrompt({ companyName, openGaps, summary, lang: params.lang });

  let reply: string;
  try {
    reply = await askOpenAI({
      system,
      messages: [...recentMessages.map((m) => ({ role: m.role, content: m.content })), { role: "user", content: params.text }],
      maxTokens: 400,
    });
  } catch {
    return { error: "ai_failed" };
  }

  await supabase.from("freeform_chat_messages").insert({ company_id: companyId, role: "assistant", content: reply });
  await maybeSummarizeFreeformChat(supabase, companyId);

  return { reply };
}

export async function requestAiInitiative(params: {
  sessionId: string;
  lang: EntryLang;
}): Promise<ChatResult> {
  const { supabase, companyId, companyName, openGaps, summary, summarizedCount } =
    await loadCompanyContext(params.sessionId);

  const rateLimit = await checkSessionRateLimit({
    sessionId: params.sessionId,
    table: "freeform_chat_messages",
    windowMinutes: 60,
    maxCount: 60,
    supabase,
  });
  if (!rateLimit.allowed) return { error: "rate_limited" };

  const { data: existing } = await supabase
    .from("freeform_chat_messages")
    .select("role, content, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  const { recentMessages } = splitContext(existing ?? [], summarizedCount);
  const system = buildAiInitiativeSystemPrompt({ companyName, openGaps, summary, lang: params.lang });

  let reply: string;
  try {
    reply = await askOpenAI({
      system,
      messages: [
        ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: "Go ahead and ask me something." },
      ],
      maxTokens: 150,
    });
  } catch {
    return { error: "ai_failed" };
  }

  await supabase.from("freeform_chat_messages").insert({ company_id: companyId, role: "assistant", content: reply });
  await maybeSummarizeFreeformChat(supabase, companyId);

  return { reply };
}
