"use server";

import { createClient } from "@/lib/supabase/server";
import { sendTeamNotification, escapeHtml } from "@/lib/email/resend";

export type SupportRequestParams = {
  companyId: string;
  topic: string;
  message: string;
};

/** Generic, gap-independent contact channel — stored for tracking in
 * /admin/requests and emailed to the GapLens team, with the account's own
 * login email as the reply address (no separate contact field to collect). */
export async function submitSupportRequest(params: SupportRequestParams) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("support_requests").insert({
    company_id: params.companyId,
    topic: params.topic,
    message: params.message,
  });
  if (error) throw error;

  const { data: company } = await supabase.from("companies").select("name").eq("id", params.companyId).single();

  await sendTeamNotification({
    subject: `New support message: ${params.topic}`,
    html: `
      <p><strong>Company:</strong> ${escapeHtml(company?.name ?? "Unknown")}</p>
      <p><strong>Reply to:</strong> ${escapeHtml(user.email ?? "unknown")}</p>
      <p><strong>Topic:</strong> ${escapeHtml(params.topic)}</p>
      <p><strong>Message:</strong> ${escapeHtml(params.message)}</p>
    `,
  });
}
