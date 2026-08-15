"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Starts a fresh assessment round for the user's company: a brand-new
 * assessment_sessions row (old sessions and all their data stay untouched)
 * so progress can be compared round-over-round on the dashboard.
 *
 * The quick-scan answers/Gap Score carry over from the previous round rather
 * than being re-collected, so the new round lands straight on the Chat with
 * AI tab's deep-dive questions instead of re-routing through the scan quiz.
 */
export async function startNewRound() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) redirect("/onboarding");

  const { data: lastSession } = await supabase
    .from("assessment_sessions")
    .select("id, team_size, scan_answers, overall_gap")
    .eq("company_id", profile.company_id)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: session, error } = await supabase
    .from("assessment_sessions")
    .insert({
      company_id: profile.company_id,
      team_size: lastSession?.team_size ?? null,
      scan_answers: lastSession?.scan_answers ?? null,
      overall_gap: lastSession?.overall_gap ?? null,
    })
    .select("id")
    .single();

  if (error || !session) redirect("/dashboard");

  // Invites sent for the previous round that nobody has answered yet would
  // otherwise silently stop counting toward coverage the moment a new round
  // starts (the dashboard only reads the newest session's responses) — move
  // them forward so an answer submitted after this point still lands on the
  // round the owner is actually looking at.
  if (lastSession?.id) {
    await supabase
      .from("team_invites")
      .update({ session_id: session.id })
      .eq("session_id", lastSession.id)
      .eq("status", "pending");
  }

  redirect("/dashboard?section=chat");
}
