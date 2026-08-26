import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { computeConfidence, filterToLatestAttempt } from "@/lib/deep-dive/confidence";
import { generateRoadmapGaps, type RoadmapGap, type ToolInventoryEntry } from "@/lib/roadmap/build-prompt";
import { buildHistoricalSummary } from "@/lib/roadmap/history-summary";
import { mergeGapOverrides } from "@/lib/roadmap/gap-status";
import { parseScanAnswers } from "@/lib/scan/scoring";
import { checkSessionRateLimit } from "@/lib/rate-limit";
import { findPlatformKbEntry, type PlatformKbEntry } from "@/lib/roadmap/platform-knowledge";
import { splitContext } from "@/lib/freeform-chat/context";
import { computeCostOfInaction } from "@/lib/roadmap/cost-of-inaction";

export type GenerateRoadmapResult =
  | { ok: true; version: number }
  | { ok: false; status: number; message: string };

/**
 * Generates a new roadmap version for a session and persists it — the same
 * logic that used to live inline in the old docx-download route. Grounded in
 * both the deep-dive responses (when present) and the account's initial
 * quick-scan answers (always present), so two businesses don't get
 * interchangeable roadmaps just because they skipped the deep-dive.
 */
export async function generateAndSaveRoadmap(
  supabase: SupabaseClient<Database>,
  sessionId: string,
): Promise<GenerateRoadmapResult> {
  const { data: session } = await supabase
    .from("assessment_sessions")
    .select("id, company_id, overall_gap, scan_answers")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) return { ok: false, status: 404, message: `Session not found: ${sessionId}` };

  const rateLimit = await checkSessionRateLimit({
    sessionId,
    table: "roadmap_versions",
    windowMinutes: 60,
    maxCount: 10,
    supabase,
  });
  if (!rateLimit.allowed) {
    return { ok: false, status: 429, message: "Too many roadmap generations in a short time — please try again later." };
  }

  const { data: company } = await supabase
    .from("companies")
    .select("name, currency, avg_hourly_cost")
    .eq("id", session.company_id)
    .single();

  // Roadmap history — and now the Tool Map too — is tracked per company, not
  // per session: starting a new assessment round (a new session_id) must not
  // reset version numbering, gap carry-forward, or the tool inventory back
  // to zero, or "progress since last round" would be meaningless.
  const { data: companySessions, error: companySessionsError } = await supabase
    .from("assessment_sessions")
    .select("id")
    .eq("company_id", session.company_id);

  if (companySessionsError) {
    return { ok: false, status: 500, message: `Failed to load company sessions: ${companySessionsError.message}` };
  }
  const companySessionIds = (companySessions ?? []).map((s) => s.id);

  const { data: deepDiveResponsesRaw, error: deepDiveError } = await supabase
    .from("deep_dive_responses")
    .select("department, question_key, answer_text, response_length, started_at, answered_at, attempt")
    .eq("session_id", sessionId);

  if (deepDiveError) {
    return { ok: false, status: 500, message: `Failed to load deep-dive responses: ${deepDiveError.message}` };
  }

  const deepDiveResponses = filterToLatestAttempt(deepDiveResponsesRaw ?? []);

  const { data: sessionTools, error: toolsError } = await supabase
    .from("tools")
    .select("name, catalog_id, importance, is_connected, monthly_cost, currency")
    .in("session_id", companySessionIds);

  if (toolsError) {
    return { ok: false, status: 500, message: `Failed to load tool map: ${toolsError.message}` };
  }

  const { data: companyRow } = await supabase
    .from("companies")
    .select("freeform_chat_summary, freeform_chat_summarized_count")
    .eq("id", session.company_id)
    .single();

  const { data: freeformMessages, error: freeformError } = await supabase
    .from("freeform_chat_messages")
    .select("role, content, created_at")
    .eq("company_id", session.company_id)
    .order("created_at", { ascending: true });

  if (freeformError) {
    return { ok: false, status: 500, message: `Failed to load freeform chat: ${freeformError.message}` };
  }

  const { recentMessages: recentFreeformMessages } = splitContext(
    freeformMessages ?? [],
    companyRow?.freeform_chat_summarized_count ?? 0,
  );

  const { data: visualConsultations, error: visualError } = await supabase
    .from("visual_consultations")
    .select("type, result_gaps, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  if (visualError) {
    return { ok: false, status: 500, message: `Failed to load visual consultations: ${visualError.message}` };
  }

  // Only the latest UI/UX review and the latest Instagram review — re-running
  // a review supersedes the last one rather than piling up duplicates.
  const latestVisualByType = new Map<string, RoadmapGap[]>();
  for (const row of visualConsultations ?? []) {
    if (latestVisualByType.has(row.type)) continue;
    const rowGaps = ((row.result_gaps as { gaps?: RoadmapGap[] } | null)?.gaps ?? []) as RoadmapGap[];
    latestVisualByType.set(row.type, rowGaps);
  }
  const existingVisualGaps = Array.from(latestVisualByType.values()).flat();

  const confidence = computeConfidence({
    deepDiveResponses,
    toolCount: sessionTools?.length ?? 0,
    freeformMessageCount: freeformMessages?.length ?? 0,
    visualConsultationCount: visualConsultations?.length ?? 0,
  });

  const { data: previousVersion, error: previousVersionError } = await supabase
    .from("roadmap_versions")
    .select("version, roadmap_json")
    .in("session_id", companySessionIds)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (previousVersionError) {
    return { ok: false, status: 500, message: `Failed to load previous roadmap version: ${previousVersionError.message}` };
  }

  const { data: overrideRows, error: overridesError } = await supabase
    .from("gap_status_overrides")
    .select("gap_title, status, updated_at")
    .in("session_id", companySessionIds)
    .order("updated_at", { ascending: true });

  if (overridesError) {
    return { ok: false, status: 500, message: `Failed to load gap status overrides: ${overridesError.message}` };
  }
  // Keep only the most recent override per gap title across the company's
  // whole history (ascending order above means later rows win the overwrite).
  const overrides = Array.from(
    new Map((overrideRows ?? []).map((o) => [o.gap_title, o])).values(),
  );

  const previousGapsRaw = ((previousVersion?.roadmap_json as { gaps?: RoadmapGap[] } | null)?.gaps ?? []) as RoadmapGap[];
  const previousGaps = mergeGapOverrides(previousGapsRaw, overrides);

  const historicalSummary = await buildHistoricalSummary(supabase, session.company_id, sessionId);

  const platformEntries = Array.from(
    new Map(
      (sessionTools ?? [])
        .map((t) => (t.catalog_id ? findPlatformKbEntry(t.catalog_id) : undefined))
        .filter((entry): entry is PlatformKbEntry => Boolean(entry))
        .map((entry) => [entry.catalogId, entry]),
    ).values(),
  );

  const toolInventory: ToolInventoryEntry[] = (sessionTools ?? []).map((t) => ({
    name: t.name,
    importance: t.importance,
    isConnected: t.is_connected,
    monthlyCost: t.monthly_cost,
    currency: t.currency,
  }));

  let result;
  try {
    result = await generateRoadmapGaps({
      companyName: company?.name ?? "Your Company",
      overallGap: session.overall_gap ?? 0,
      scanAnswers: parseScanAnswers(session.scan_answers),
      deepDiveResponses,
      lowConfidenceDepartments: confidence.lowConfidenceDepartments,
      previousGaps,
      historicalSummary,
      platformEntries,
      toolInventory,
      freeformChatContext: {
        summary: companyRow?.freeform_chat_summary ?? null,
        recentMessages: recentFreeformMessages.map((m) => ({ role: m.role, content: m.content })),
      },
      existingVisualGaps,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, status: 502, message: `Roadmap generation call failed: ${message}` };
  }

  if ("refusal" in result) {
    return { ok: false, status: 502, message: `Roadmap generation was refused by the model: ${result.refusal}` };
  }

  const existingTitles = new Set(result.gaps.map((g) => g.gap_title));
  const visualGaps: RoadmapGap[] = [];
  for (const gap of existingVisualGaps) {
    if (existingTitles.has(gap.gap_title)) continue;
    existingTitles.add(gap.gap_title);
    visualGaps.push(gap);
  }

  const allGaps = [...result.gaps, ...visualGaps];

  const costOfInaction = computeCostOfInaction({
    gaps: allGaps,
    toolInventory,
    deepDiveResponses,
    avgHourlyCost: company?.avg_hourly_cost ?? null,
    currency: company?.currency ?? "USD",
  });

  const nextVersion = (previousVersion?.version ?? 0) + 1;
  const generatedAt = new Date().toISOString();
  const roadmapJson = {
    roadmap_version: nextVersion,
    generated_at: generatedAt,
    based_on_departments: confidence.coveredDepartments,
    gaps: allGaps,
    cost_of_inaction: costOfInaction,
  };

  const { error: insertError } = await supabase.from("roadmap_versions").insert({
    session_id: sessionId,
    version: nextVersion,
    generated_at: generatedAt,
    based_on_departments: confidence.coveredDepartments,
    roadmap_json: roadmapJson,
  });
  if (insertError) {
    return { ok: false, status: 500, message: `Failed to save roadmap version: ${insertError.message}` };
  }

  return { ok: true, version: nextVersion };
}
