"use server";

import { createClient } from "@/lib/supabase/server";
import { askOpenAIStructured } from "@/lib/ai/azure-openai";
import { buildDiyGuidePrompt, DIY_GUIDE_SCHEMA, type DiyGuide } from "@/lib/roadmap/diy-guide";
import type { RoadmapGap } from "@/lib/roadmap/build-prompt";
import type { CompanyTool } from "@/app/dashboard/tool-map-actions";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";

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

/** Fake Door Test: no real vetted-provider network exists yet — this only
 * records which gaps/categories draw interest, to prioritize what to build
 * once one does. */
export async function logProviderMatchInterest(
  companyId: string,
  sessionId: string,
  gapTitle: string,
  category: string,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("provider_match_interest").insert({
    company_id: companyId,
    session_id: sessionId,
    gap_title: gapTitle,
    category,
  });
  if (error) throw error;
}
