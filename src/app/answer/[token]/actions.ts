"use server";

import { createAdminClient } from "@/lib/supabase/admin";

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
