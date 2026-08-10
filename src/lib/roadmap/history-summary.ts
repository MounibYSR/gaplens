import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Rolls up a company's OLDER assessment sessions into a short summary instead
 * of sending their full deep-dive Q&A verbatim on every roadmap generation —
 * keeps the prompt (and cost) bounded as a company accumulates history. Only
 * the current/latest session's deep-dive responses go in with full detail.
 */
export async function buildHistoricalSummary(
  supabase: SupabaseClient<Database>,
  companyId: string,
  currentSessionId: string,
): Promise<string | null> {
  const { data: pastSessions } = await supabase
    .from("assessment_sessions")
    .select("id, started_at, overall_gap")
    .eq("company_id", companyId)
    .neq("id", currentSessionId)
    .order("started_at", { ascending: false })
    .limit(10);

  if (!pastSessions || pastSessions.length === 0) return null;

  const sessionIds = pastSessions.map((s) => s.id);
  const { data: pastResponses } = await supabase
    .from("deep_dive_responses")
    .select("session_id, department")
    .in("session_id", sessionIds);

  const deptsBySession = new Map<string, Set<string>>();
  for (const r of pastResponses ?? []) {
    const set = deptsBySession.get(r.session_id) ?? new Set<string>();
    set.add(r.department);
    deptsBySession.set(r.session_id, set);
  }

  const lines = pastSessions.map((s) => {
    const depts = Array.from(deptsBySession.get(s.id) ?? []);
    const date = new Date(s.started_at).toISOString().slice(0, 10);
    return `- ${date}: overall gap score ${s.overall_gap ?? "n/a"}/100, deep-dive covered: ${
      depts.length ? depts.join(", ") : "none"
    }.`;
  });

  return lines.join("\n");
}
