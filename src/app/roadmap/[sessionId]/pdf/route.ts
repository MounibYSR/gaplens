import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeConfidence, filterToLatestAttempt } from "@/lib/deep-dive/confidence";
import { mergeGapOverrides } from "@/lib/roadmap/gap-status";
import { renderRoadmapHtml } from "@/lib/roadmap/render-html";
import { renderHtmlToPdf } from "@/lib/roadmap/generate-pdf";
import type { RoadmapGap, CostOfInaction } from "@/lib/roadmap/build-prompt";
import { getPublicOrigin } from "@/lib/http/public-origin";

export const dynamic = "force-dynamic";

/**
 * The PDF is rendered from a fully self-contained HTML string (no network
 * fetches at render time), so a company logo has to be inlined as a base64
 * data URI ahead of time. Best-effort: if the fetch fails for any reason,
 * the PDF still renders — just without the logo.
 */
async function fetchLogoAsDataUri(logoUrl: string | null): Promise<string | null> {
  if (!logoUrl) return null;
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/png";
    const buffer = Buffer.from(await res.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", getPublicOrigin(request)));

  const { data: session } = await supabase
    .from("assessment_sessions")
    .select("id, company_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) return new NextResponse("Not found", { status: 404 });

  const { data: company } = await supabase
    .from("companies")
    .select("name, logo_url")
    .eq("id", session.company_id)
    .single();

  const companyLogoDataUri = await fetchLogoAsDataUri(company?.logo_url ?? null);

  const { data: latestVersion, error: versionError } = await supabase
    .from("roadmap_versions")
    .select("version, generated_at, based_on_departments, roadmap_json")
    .eq("session_id", sessionId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionError) {
    return new NextResponse(`Failed to load roadmap version: ${versionError.message}`, { status: 500 });
  }
  if (!latestVersion) {
    return new NextResponse(
      "No roadmap has been generated for this session yet — generate one first.",
      { status: 404 },
    );
  }

  const { data: overrides, error: overridesError } = await supabase
    .from("gap_status_overrides")
    .select("gap_title, status")
    .eq("session_id", sessionId);

  if (overridesError) {
    return new NextResponse(`Failed to load gap status overrides: ${overridesError.message}`, { status: 500 });
  }

  const { data: deepDiveResponsesRaw, error: deepDiveError } = await supabase
    .from("deep_dive_responses")
    .select("department, response_length, started_at, answered_at, attempt")
    .eq("session_id", sessionId);

  if (deepDiveError) {
    return new NextResponse(`Failed to load deep-dive responses: ${deepDiveError.message}`, { status: 500 });
  }

  const deepDiveResponses = filterToLatestAttempt(deepDiveResponsesRaw ?? []);

  // The Tool Map is company-wide (editable anytime from its own dashboard
  // page), not tied to a single assessment round.
  const { data: companySessions } = await supabase
    .from("assessment_sessions")
    .select("id")
    .eq("company_id", session.company_id);
  const companySessionIds = (companySessions ?? []).map((s) => s.id);

  const { count: toolCount } = await supabase
    .from("tools")
    .select("id", { count: "exact", head: true })
    .in("session_id", companySessionIds);

  const { count: freeformMessageCount } = await supabase
    .from("freeform_chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("company_id", session.company_id);

  const { count: visualConsultationCount } = await supabase
    .from("visual_consultations")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  const confidence = computeConfidence({
    deepDiveResponses,
    toolCount: toolCount ?? 0,
    freeformMessageCount: freeformMessageCount ?? 0,
    visualConsultationCount: visualConsultationCount ?? 0,
  });
  const rawGaps = ((latestVersion.roadmap_json as { gaps?: RoadmapGap[] } | null)?.gaps ?? []) as RoadmapGap[];
  const gaps = mergeGapOverrides(rawGaps, overrides ?? []);
  const costOfInaction =
    (latestVersion.roadmap_json as { cost_of_inaction?: CostOfInaction } | null)?.cost_of_inaction ?? null;

  const html = renderRoadmapHtml({
    roadmap_version: latestVersion.version,
    generated_at: latestVersion.generated_at,
    company_name: company?.name ?? "Your Company",
    company_logo_data_uri: companyLogoDataUri,
    confidence_percent: confidence.overall,
    based_on_departments: latestVersion.based_on_departments ?? [],
    gaps,
    cost_of_inaction: costOfInaction,
  });

  let pdf: Buffer;
  try {
    pdf = await renderHtmlToPdf(html);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new NextResponse(`PDF generation failed: ${message}`, { status: 502 });
  }

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="GapLens-Roadmap-v${latestVersion.version}.pdf"`,
    },
  });
}
