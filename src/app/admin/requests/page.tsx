import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GAPLENS_TEAM_EMAILS } from "@/lib/email/resend";

/**
 * Internal tracking view for provider-match and support requests — no admin
 * role system exists yet, so access is just an email allowlist check against
 * the GapLens team's own accounts (see gapfix-actions.ts / support-actions.ts,
 * which notify these same two addresses). Not linked from anywhere in the
 * customer-facing dashboard.
 */
export default async function AdminRequestsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!GAPLENS_TEAM_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const admin = createAdminClient();

  const [{ data: providerRequests }, { data: supportRequests }, { data: companies }] = await Promise.all([
    admin.from("provider_requests").select("*").order("created_at", { ascending: false }),
    admin.from("support_requests").select("*").order("created_at", { ascending: false }),
    admin.from("companies").select("id, name"),
  ]);

  const companyName = new Map((companies ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-xl font-extrabold text-ink">Provider &amp; Support Requests</h1>

      <section className="mt-8">
        <h2 className="text-sm font-extrabold uppercase tracking-widest" style={{ color: "var(--text-teal-light-mode)" }}>
          Provider Match Requests ({(providerRequests ?? []).length})
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {(providerRequests ?? []).length === 0 && <p className="text-sm text-muted">No requests yet.</p>}
          {(providerRequests ?? []).map((r) => (
            <div key={r.id} className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--border-g)", background: "var(--glass-2)" }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-ink">{companyName.get(r.company_id) ?? "Unknown company"}</span>
                <span className="rounded-full px-2 py-1 text-xs font-bold" style={{ background: "var(--glass-2)", color: "var(--muted)" }}>
                  {r.status}
                </span>
              </div>
              <p className="mt-1 text-ink">{r.gap_title} — {r.gap_category}</p>
              <p className="mt-1 text-muted">
                {r.contact_method}: {r.contact_value}
              </p>
              {r.note && <p className="mt-1 text-muted">Note: {r.note}</p>}
              <p className="mt-1 text-xs text-muted">{new Date(r.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-extrabold uppercase tracking-widest" style={{ color: "var(--text-teal-light-mode)" }}>
          Support Messages ({(supportRequests ?? []).length})
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {(supportRequests ?? []).length === 0 && <p className="text-sm text-muted">No messages yet.</p>}
          {(supportRequests ?? []).map((r) => (
            <div key={r.id} className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--border-g)", background: "var(--glass-2)" }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-ink">{companyName.get(r.company_id) ?? "Unknown company"}</span>
                <span className="rounded-full px-2 py-1 text-xs font-bold" style={{ background: "var(--glass-2)", color: "var(--muted)" }}>
                  {r.status}
                </span>
              </div>
              <p className="mt-1 text-ink">{r.topic}</p>
              <p className="mt-1 text-muted">{r.message}</p>
              <p className="mt-1 text-xs text-muted">{new Date(r.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
