import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mergeGapOverrides } from "@/lib/roadmap/gap-status";
import { renderRoadmapHtml } from "@/lib/roadmap/render-html";
import { renderHtmlToPdf } from "@/lib/roadmap/generate-pdf";
import type { RoadmapGap, CostOfInaction, RoadmapPhase } from "@/lib/roadmap/build-prompt";
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
    .select("version, generated_at, roadmap_json")
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
  const companyName = company?.name ?? "Your Company";

  const html = renderRoadmapHtml({
    roadmap_version: latestVersion.version,
    generated_at: latestVersion.generated_at,
    company_name: companyName,
    company_logo_data_uri: companyLogoDataUri,
    gaps,
    cost_of_inaction: roadmapJson.cost_of_inaction ?? null,
    executive_summary: roadmapJson.executive_summary ?? null,
    what_we_observed: roadmapJson.what_we_observed ?? null,
    phased_roadmap: roadmapJson.phased_roadmap ?? null,
    approach_note: roadmapJson.approach_note ?? null,
  });

  const generatedMonthYear = new Date(latestVersion.generated_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  let pdf: Buffer;
  try {
    pdf = await renderHtmlToPdf(html, { companyName, generatedMonthYear });
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
