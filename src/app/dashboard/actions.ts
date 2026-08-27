"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Department, GapFixPath, GapStatus } from "@/lib/supabase/types";

export async function createInviteLink(
  sessionId: string,
  department: Department,
  invitee_name: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_invites")
    .insert({
      session_id: sessionId,
      department,
      invitee_name: invitee_name.trim() || null,
    })
    .select("token")
    .single();

  if (error || !data) throw error ?? new Error("Failed to create invite link");

  revalidatePath("/dashboard");
  return data.token;
}

export async function getInviteResponses(inviteId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("deep_dive_responses")
    .select("question_key, answer_text, answered_at")
    .eq("invite_id", inviteId)
    .order("answered_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function setGapStatus(sessionId: string, gapTitle: string, status: GapStatus) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("gap_status_overrides")
    .upsert(
      { session_id: sessionId, gap_title: gapTitle, status, updated_at: new Date().toISOString() },
      { onConflict: "session_id,gap_title" },
    );

  if (error) throw error;

  revalidatePath("/dashboard");
}

/**
 * `currentStatus` is only there to satisfy the NOT NULL `status` column on
 * a first-ever override row for this gap (no prior status override yet) —
 * on an existing row it's a no-op re-write of the same value, since this
 * call only ever intends to change gapfix_path.
 */
export async function setGapfixPath(
  sessionId: string,
  gapTitle: string,
  gapfixPath: GapFixPath,
  currentStatus: GapStatus,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("gap_status_overrides")
    .upsert(
      {
        session_id: sessionId,
        gap_title: gapTitle,
        status: currentStatus,
        gapfix_path: gapfixPath,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id,gap_title" },
    );

  if (error) throw error;

  revalidatePath("/dashboard");
}
