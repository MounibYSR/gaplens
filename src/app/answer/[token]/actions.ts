"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { checkSessionRateLimit } from "@/lib/rate-limit";

export async function submitInviteResponse(params: {
  token: string;
  questionKey: "opening" | "followup";
  answerText: string;
  startedAt: string;
}) {
  const admin = createAdminClient();

  const { data: invite, error: inviteError } = await admin
    .from("team_invites")
    .select("id, session_id, department, status")
    .eq("token", params.token)
    .single();

  if (inviteError || !invite) throw inviteError ?? new Error("Invite not found");

  // This endpoint is public (no authenticated user) — pass the admin client
  // through so the rate-limit check can actually see the session's data
  // instead of being blocked by RLS the moment it's used without a cookie.
  const rateLimit = await checkSessionRateLimit({
    sessionId: invite.session_id,
    table: "deep_dive_responses",
    windowMinutes: 60,
    maxCount: 60,
    supabase: admin,
  });
  if (!rateLimit.allowed) throw new Error("Too many submissions — please try again later.");

  const { error: insertError } = await admin.from("deep_dive_responses").insert({
    session_id: invite.session_id,
    invite_id: invite.id,
    department: invite.department,
    question_key: params.questionKey,
    answer_text: params.answerText,
    started_at: params.startedAt,
    answered_at: new Date().toISOString(),
  });

  if (insertError) throw insertError;

  if (invite.status === "pending") {
    await admin.from("team_invites").update({ status: "accepted" }).eq("id", invite.id);
  }
}
