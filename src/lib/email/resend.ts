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
 *
 * `from` deliberately isn't a recipient's own address: Resend's SDK resolves
 * even API-level rejections (unverified domain, bad key, rate limit) as
 * `{ error }` rather than a thrown exception, and a from/to address that's
 * identical (mail "from yousra@ to yousra@") reads as spoofing to most
 * providers and gets silently dropped to spam even on a successful send —
 * both failure modes previously produced zero log output and no email.
 */
export async function sendTeamNotification(params: { subject: string; html: string; to?: string[] }): Promise<void> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured — skipping send:", params.subject);
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? '"GapLens" <noreply@gaplens.co>',
      to: params.to ?? GAPLENS_TEAM_EMAILS,
      replyTo: "yousra@gaplens.co",
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      console.error("[email] Resend API rejected the send:", params.subject, error);
    }
  } catch (err) {
    console.error("[email] failed to send:", params.subject, err);
  }
}
