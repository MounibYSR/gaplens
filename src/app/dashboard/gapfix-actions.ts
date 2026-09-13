"use server";

import { createClient } from "@/lib/supabase/server";
import { askOpenAIStructured } from "@/lib/ai/azure-openai";
import { buildDiyGuidePrompt, DIY_GUIDE_SCHEMA, type DiyGuide } from "@/lib/roadmap/diy-guide";
import { sendTeamNotification, escapeHtml } from "@/lib/email/resend";
import type { RoadmapGap } from "@/lib/roadmap/build-prompt";
import type { CompanyTool } from "@/app/dashboard/tool-map-actions";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { ContactMethod } from "@/lib/supabase/types";

export type DiyGuideResult = { guide: DiyGuide } | { error: "ai_failed" };

/** What the cached guide was generated from — if either field changes (a
 * new roadmap version rewrote this gap's fix), the cache is stale. */
function guideSourceKey(gap: RoadmapGap): string {
  return gap.impact + " -- " + gap.recommended_fix;
}

export async function getOrGenerateDiyGuide(
  sessionId: string,
  gap: RoadmapGap,
  companyTools: CompanyTool[],
  lang: EntryLang,
): Promise<DiyGuideResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const sourceKey = guideSourceKey(gap);

  const { data: existing } = await supabase
    .from("gap_status_overrides")
    .select("diy_guide, diy_guide_source")
    .eq("session_id", sessionId)
    .eq("gap_title", gap.gap_title)
    .maybeSingle();

  if (existing?.diy_guide && existing.diy_guide_source === sourceKey) {
    return { guide: existing.diy_guide as unknown as DiyGuide };
  }

  try {
    const system = buildDiyGuidePrompt(gap, companyTools, lang);
    const response = await askOpenAIStructured<DiyGuide>({
      system,
      messages: [{ role: "user", content: "Generate the step-by-step guide now." }],
      toolName: "submit_diy_guide",
      toolDescription: "Submit the structured step-by-step DIY implementation guide for this gap.",
      inputSchema: DIY_GUIDE_SCHEMA,
      maxTokens: 2000,
    });
    if ("refusal" in response) return { error: "ai_failed" };

    const { error } = await supabase.from("gap_status_overrides").upsert(
      {
        session_id: sessionId,
        gap_title: gap.gap_title,
        status: gap.status,
        diy_guide: response.result as unknown as Record<string, unknown>,
        diy_guide_source: sourceKey,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id,gap_title" },
    );
    if (error) throw error;

    return { guide: response.result };
  } catch {
    return { error: "ai_failed" };
  }
}

export type ProviderRequestParams = {
  companyId: string;
  sessionId: string;
  gapTitle: string;
  gapCategory: string;
  note: string;
  contactMethod: ContactMethod;
  contactValue: string;
};

/** No automated provider-matching exists yet — this stores the request for
 * the GapLens team to manually action (tracked in /admin/requests) and
 * notifies them by email so a human follows up within 1-2 business days. */
export async function submitProviderRequest(params: ProviderRequestParams) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("provider_requests").insert({
    company_id: params.companyId,
    session_id: params.sessionId,
    gap_title: params.gapTitle,
    gap_category: params.gapCategory,
    note: params.note.trim() || null,
    contact_method: params.contactMethod,
    contact_value: params.contactValue,
  });
  if (error) throw error;

  const { data: company } = await supabase.from("companies").select("name").eq("id", params.companyId).single();

  const note = params.note.trim();
  await sendTeamNotification({
    subject: `New provider request: ${params.gapTitle}`,
    html: `
      <p><strong>Company:</strong> ${escapeHtml(company?.name ?? "Unknown")}</p>
      <p><strong>Gap:</strong> ${escapeHtml(params.gapTitle)} (${escapeHtml(params.gapCategory)})</p>
      <p><strong>Contact:</strong> ${escapeHtml(params.contactMethod)} — ${escapeHtml(params.contactValue)}</p>
      ${note ? `<p><strong>Note:</strong> ${escapeHtml(note)}</p>` : ""}
    `,
  });
}
