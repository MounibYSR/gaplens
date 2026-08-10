import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

/**
 * Basic per-company rate limit: counts rows in a timestamped table across
 * every session belonging to the same company within a rolling window.
 * Not a replacement for a real limiter (no distributed locking), but enough
 * to stop a runaway loop from burning API cost.
 *
 * Accepts an existing request-scoped Supabase client when the caller already
 * has one, rather than creating a second client for the same request.
 */
export async function checkSessionRateLimit(params: {
  sessionId: string;
  table: "deep_dive_responses" | "roadmap_versions" | "freeform_chat_messages" | "visual_consultations";
  windowMinutes: number;
  maxCount: number;
  supabase?: SupabaseClient<Database>;
}): Promise<{ allowed: boolean; count: number }> {
  const supabase = params.supabase ?? (await createClient());

  const { data: session } = await supabase
    .from("assessment_sessions")
    .select("company_id")
    .eq("id", params.sessionId)
    .maybeSingle();
  if (!session) return { allowed: true, count: 0 };

  const { data: companySessions } = await supabase
    .from("assessment_sessions")
    .select("id")
    .eq("company_id", session.company_id);
  const sessionIds = (companySessions ?? []).map((s) => s.id);
  if (sessionIds.length === 0) return { allowed: true, count: 0 };

  const since = new Date(Date.now() - params.windowMinutes * 60_000).toISOString();

  const { count } = await supabase
    .from(params.table)
    .select("id", { count: "exact", head: true })
    .in("session_id", sessionIds)
    .gte("created_at", since);

  return { allowed: (count ?? 0) < params.maxCount, count: count ?? 0 };
}
