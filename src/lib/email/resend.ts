import { Resend } from "resend";

export const GAPLENS_TEAM_EMAILS = ["yousra@gaplens.co", "sonia@gaplens.co"];

/** Escapes user-provided text before interpolating it into an email's HTML body. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Notifies the GapLens team of a new provider/support request. Never throws
 * — a Resend outage must not block storing the request itself, which is the
 * source of truth (see /admin/requests). Failures are logged, not surfaced.
 */
export async function sendTeamNotification(params: { subject: string; html: string }): Promise<void> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping send:", params.subject);
    return;
  }
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@gaplens.co",
      to: GAPLENS_TEAM_EMAILS,
      subject: params.subject,
      html: params.html,
    });
  } catch (err) {
    console.error("[email] failed to send:", err);
  }
}
