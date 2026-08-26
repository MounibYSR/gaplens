"use server";

import { createClient } from "@/lib/supabase/server";
import type { TeaserAnswers } from "@/lib/scan/scoring";
import type { SavedTool } from "@/components/assessment/tool-relationship-map";

export async function saveOverallScan(sessionId: string, answers: TeaserAnswers, gap: number) {
  const supabase = await createClient();

  const { data: session, error: sessionError } = await supabase
    .from("assessment_sessions")
    .select("company_id")
    .eq("id", sessionId)
    .single();
  if (sessionError || !session) throw sessionError ?? new Error("Session not found");

  const { error } = await supabase
    .from("assessment_sessions")
    .update({
      overall_gap: gap,
      scan_answers: answers,
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) throw error;

  // First-ever completion of the core scan marks onboarding done for the
  // company — guarded so it only ever fires once, regardless of how many
  // times the scan is later redone via "start a new round".
  const { error: onboardingError } = await supabase
    .from("companies")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", session.company_id)
    .is("onboarding_completed_at", null);
  if (onboardingError) throw onboardingError;
}

/**
 * Replaces the session's saved Tool Map with the current list — the map can
 * be redone, so this is a full delete-then-insert rather than an upsert.
 */
export async function saveSessionTools(sessionId: string, tools: SavedTool[]) {
  const supabase = await createClient();

  const { error: deleteError } = await supabase.from("tools").delete().eq("session_id", sessionId);
  if (deleteError) throw deleteError;

  if (tools.length === 0) return;

  let currency: string | null = null;
  if (tools.some((t) => t.monthlyCost != null)) {
    const { data: session } = await supabase.from("assessment_sessions").select("company_id").eq("id", sessionId).single();
    if (session) {
      const { data: company } = await supabase.from("companies").select("currency").eq("id", session.company_id).single();
      currency = company?.currency ?? "USD";
    }
  }

  const { error: insertError } = await supabase.from("tools").insert(
    tools.map((tool) => ({
      session_id: sessionId,
      name: tool.name,
      catalog_id: tool.catalogId,
      importance: tool.importance,
      is_connected: tool.isConnected,
      monthly_cost: tool.monthlyCost,
      currency: tool.monthlyCost != null ? currency : null,
    })),
  );
  if (insertError) throw insertError;
}
