import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GAPLENS_TEAM_EMAILS } from "@/lib/email/resend";
import { mergeGapOverrides } from "@/lib/roadmap/gap-status";
import { renderRoadmapHtml } from "@/lib/roadmap/render-html";
import type { RoadmapGap, CostOfInaction, RoadmapPhase } from "@/lib/roadmap/build-prompt";

export const dynamic = "force-dynamic";

/**
 * Internal-only view of a customer's latest roadmap, linked from Contact
 * Support notification emails so the team has context without a separate
 * lookup. Gated the same way as /admin/requests (any logged-in GapLens team
 * account) — reads via the service-role client since the viewer isn't a
 * member of the customer's own company and RLS would otherwise block it.
 */
export async function GET(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  if (!GAPLENS_TEAM_EMAILS.includes(user.email ?? "")) return NextResponse.redirect(new URL("/dashboard", request.url));

  const admin = createAdminClient();

  const { data: session } = await admin.from("assessment_sessions").select("id, company_id").eq("id", sessionId).maybeSingle();
  if (!session) return new NextResponse("Not found", { status: 404 });

  const { data: company } = await admin.from("companies").select("name").eq("id", session.company_id).single();

  const { data: latestVersion, error: versionError } = await admin
    .from("roadmap_versions")
    .select("version, generated_at, roadmap_json")
    .eq("session_id", sessionId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionError) {
    return new NextResponse(`Failed to load roadmap version: ${versionError.message}`, { status: 500 });
  }
  if (!latestVersion) {
    return new NextResponse("No roadmap has been generated for this session yet.", { status: 404 });
  }

  const { data: overrides, error: overridesError } = await admin
    .from("gap_status_overrides")
    .select("gap_title, status, gapfix_path")
    .eq("session_id", sessionId);

  if (overridesError) {
    return new NextResponse(`Failed to load gap status overrides: ${overridesError.message}`, { status: 500 });
  }

  type RoadmapJson = {
    gaps?: RoadmapGap[];
    cost_of_inaction?: CostOfInaction;
    executive_summary?: string;
    what_we_observed?: string;
    phased_roadmap?: RoadmapPhase[];
    approach_note?: string[];
  };
  const roadmapJson = (latestVersion.roadmap_json ?? {}) as RoadmapJson;
  const rawGaps = (roadmapJson.gaps ?? []) as RoadmapGap[];
  const gaps = mergeGapOverrides(rawGaps, overrides ?? []);

  const html = renderRoadmapHtml({
    roadmap_version: latestVersion.version,
    generated_at: latestVersion.generated_at,
    company_name: company?.name ?? "Unknown company",
    company_logo_data_uri: null,
    gaps,
    cost_of_inaction: roadmapJson.cost_of_inaction ?? null,
    executive_summary: roadmapJson.executive_summary ?? null,
    what_we_observed: roadmapJson.what_we_observed ?? null,
    phased_roadmap: roadmapJson.phased_roadmap ?? null,
    approach_note: roadmapJson.approach_note ?? null,
  });

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
