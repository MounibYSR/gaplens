"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sendTeamNotification, escapeHtml } from "@/lib/email/resend";
import type { RoadmapGap } from "@/lib/roadmap/build-prompt";

export type SupportRequestParams = {
  companyId: string;
  topic: string;
  message: string;
};

const GAP_PRIORITY_ORDER: Record<RoadmapGap["priority"], number> = { high: 0, medium: 1, low: 2 };

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

  const [{ data: company }, { data: profile }, { data: sessions }] = await Promise.all([
    supabase.from("companies").select("name").eq("id", params.companyId).single(),
    supabase.from("users").select("name").eq("id", user.id).single(),
    supabase
      .from("assessment_sessions")
      .select("id, overall_gap")
      .eq("company_id", params.companyId)
      .order("started_at", { ascending: false }),
  ]);

  const sessionIds = (sessions ?? []).map((s) => s.id);
  // Roadmap versions accumulate across a company's whole history (see
  // generate-and-save.ts), not just its latest assessment round, so the
  // current roadmap is whichever version is newest across every session.
  const { data: latestRoadmapVersion } = sessionIds.length
    ? await supabase
        .from("roadmap_versions")
        .select("session_id, roadmap_json")
        .in("session_id", sessionIds)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  let roadmapSectionHtml: string;
  if (latestRoadmapVersion) {
    const gaps = ((latestRoadmapVersion.roadmap_json as { gaps?: RoadmapGap[] } | null)?.gaps ?? []) as RoadmapGap[];
    const openGaps = gaps.filter((g) => g.status !== "resolved");
    const topGapTitles = [...openGaps]
      .sort((a, b) => GAP_PRIORITY_ORDER[a.priority] - GAP_PRIORITY_ORDER[b.priority])
      .slice(0, 2)
      .map((g) => g.gap_title);
    const roadmapUrl = `${origin}/admin/roadmap/${latestRoadmapVersion.session_id}`;
    const gapScore = sessions?.[0]?.overall_gap;

    roadmapSectionHtml = `
      <p><strong>Roadmap:</strong> <a href="${roadmapUrl}">${roadmapUrl}</a></p>
      <p>Gap Score: ${gapScore != null ? `${gapScore}/100` : "N/A"} — ${openGaps.length} open gap${openGaps.length === 1 ? "" : "s"}${
        topGapTitles.length ? ` (top: ${topGapTitles.map(escapeHtml).join(", ")})` : ""
      }</p>
    `;
  } else {
    roadmapSectionHtml = `<p><strong>Roadmap:</strong> No roadmap generated yet.</p>`;
  }

  // Contact Support notifications go to Yousra specifically, regardless of
  // who else is on the general GAPLENS_TEAM_EMAILS list used elsewhere.
  await sendTeamNotification({
    to: ["Yousra@gaplens.co"],
    subject: `New support message: ${params.topic}`,
    html: `
      <p><strong>Company:</strong> ${escapeHtml(company?.name ?? "Unknown")}</p>
      <p><strong>Name:</strong> ${escapeHtml(profile?.name || "Unknown")}</p>
      <p><strong>Reply to:</strong> ${escapeHtml(user.email ?? "unknown")}</p>
      <p><strong>Topic:</strong> ${escapeHtml(params.topic)}</p>
      <p><strong>Message:</strong> ${escapeHtml(params.message)}</p>
      ${roadmapSectionHtml}
    `,
  });
}
