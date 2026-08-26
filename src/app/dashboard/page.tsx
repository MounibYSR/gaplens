import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionLang } from "@/lib/i18n/get-lang";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import { ConsoleLabel } from "@/components/ui/console-label";
import { computeConfidence, computeDepartmentCoverage, filterToLatestAttempt } from "@/lib/deep-dive/confidence";
import { parseScanAnswers, pickHeadlineInsightKey } from "@/lib/scan/scoring";
import { mergeGapOverrides, computeGapTrend } from "@/lib/roadmap/gap-status";
import type { RoadmapGap, CostOfInaction } from "@/lib/roadmap/build-prompt";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { CompanyTool } from "@/app/dashboard/tool-map-actions";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("company_id, name")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) redirect("/onboarding");

  const { data: company } = await supabase
    .from("companies")
    .select("name, logo_url, currency, avg_hourly_cost")
    .eq("id", profile.company_id)
    .single();

  const { data: recentSessions } = await supabase
    .from("assessment_sessions")
    .select("id, overall_gap, scan_answers, started_at")
    .eq("company_id", profile.company_id)
    .order("started_at", { ascending: false })
    .limit(2);

  const session = recentSessions?.[0];
  const previousRoundSession = recentSessions?.[1];

  const lang = await getSessionLang();
  const t = appDictionary[lang].dashboard;

  if (!session) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <ConsoleLabel>{t.badge}</ConsoleLabel>
        <h1 className="mt-2 mb-4 text-xl font-extrabold text-ink">{t.title}</h1>
        <Link href="/onboarding" className="rounded-lg bg-teal-2 px-6 py-3 font-bold text-navy">
          {appDictionary[lang].onboarding.submit}
        </Link>
      </div>
    );
  }

  if (session.overall_gap == null) {
    redirect(`/assessment/${session.id}`);
  }

  const { data: invites } = await supabase
    .from("team_invites")
    .select("id, department, token, invitee_name, status")
    .eq("session_id", session.id)
    .order("invited_at", { ascending: false });

  const { data: deepDiveResponsesRaw } = await supabase
    .from("deep_dive_responses")
    .select("department, response_length, started_at, answered_at, attempt")
    .eq("session_id", session.id);

  const deepDiveResponses = filterToLatestAttempt(deepDiveResponsesRaw ?? []);
  const departmentCoverage = computeDepartmentCoverage(deepDiveResponses);
  const answers = parseScanAnswers(session.scan_answers);
  const dict = appDictionary[lang];
  const headline = pickHeadlineInsightKey(answers);
  const insight =
    headline.category === "money"
      ? headline.sharp
        ? dict.teaser.costMoneySharp
        : dict.teaser.costMoneyBase
      : headline.category === "customers"
        ? dict.teaser.costCustomersSharp
        : dict.teaser.costTimeSharp;
  const gapTitle = dict.advisor.genericGapTitle;

  const { data: existingRoadmap } = await supabase
    .from("roadmap_items")
    .select("resolution_path")
    .eq("session_id", session.id)
    .eq("gap_title", gapTitle)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Roadmap history is tracked per company, not per session, so starting a
  // new assessment round doesn't reset the trend/carry-forward back to zero.
  const { data: companySessions } = await supabase
    .from("assessment_sessions")
    .select("id")
    .eq("company_id", profile.company_id);
  const companySessionIds = (companySessions ?? []).map((s) => s.id);

  const { data: roadmapVersions } = await supabase
    .from("roadmap_versions")
    .select("version, roadmap_json")
    .in("session_id", companySessionIds)
    .order("version", { ascending: false })
    .limit(2);

  const { data: gapOverrideRows } = await supabase
    .from("gap_status_overrides")
    .select("gap_title, status, updated_at")
    .in("session_id", companySessionIds)
    .order("updated_at", { ascending: true });
  const gapOverrides = Array.from(
    new Map((gapOverrideRows ?? []).map((o) => [o.gap_title, o])).values(),
  );

  const { data: freeformMessages } = await supabase
    .from("freeform_chat_messages")
    .select("role, content, created_at")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: true })
    .limit(60);

  const { data: companyToolRows } = await supabase
    .from("tools")
    .select("id, name, catalog_id, importance, is_connected, monthly_cost")
    .in("session_id", companySessionIds)
    .order("created_at", { ascending: true });

  const companyTools: CompanyTool[] = (companyToolRows ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    catalogId: t.catalog_id,
    importance: t.importance,
    isConnected: t.is_connected,
    monthlyCost: t.monthly_cost,
  }));

  const toolCount = companyTools.length;

  const { count: visualConsultationCount } = await supabase
    .from("visual_consultations")
    .select("id", { count: "exact", head: true })
    .eq("session_id", session.id);

  const confidence = computeConfidence({
    deepDiveResponses,
    toolCount: toolCount ?? 0,
    freeformMessageCount: freeformMessages?.length ?? 0,
    visualConsultationCount: visualConsultationCount ?? 0,
  });

  const latestVersionRow = roadmapVersions?.[0];
  const previousVersionRow = roadmapVersions?.[1];
  const latestGapsRaw = ((latestVersionRow?.roadmap_json as { gaps?: RoadmapGap[] } | null)?.gaps ?? []) as RoadmapGap[];
  const latestGaps = mergeGapOverrides(latestGapsRaw, gapOverrides);
  const costOfInaction =
    (latestVersionRow?.roadmap_json as { cost_of_inaction?: CostOfInaction } | null)?.cost_of_inaction ?? null;
  const latestTrendStat = computeGapTrend(latestGaps);
  const previousGapsRaw = ((previousVersionRow?.roadmap_json as { gaps?: RoadmapGap[] } | null)?.gaps ?? []) as RoadmapGap[];
  const previousTrendStat = previousVersionRow ? computeGapTrend(previousGapsRaw) : null;
  const trendDelta = previousTrendStat ? latestTrendStat.healthScore - previousTrendStat.healthScore : null;

  // Gap Score comparison across assessment rounds (not roadmap versions) —
  // positive means the score improved (dropped) since the previous round.
  const roundProgressDelta =
    previousRoundSession?.overall_gap != null && session.overall_gap != null
      ? previousRoundSession.overall_gap - session.overall_gap
      : null;

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  return (
    <DashboardShell
      lang={lang}
      sessionId={session.id}
      companyId={profile.company_id}
      companyName={company?.name || appDictionary[lang].dashboardNav.companyFallback}
      logoUrl={company?.logo_url ?? null}
      currency={company?.currency ?? "USD"}
      avgHourlyCost={company?.avg_hourly_cost ?? null}
      userName={profile.name}
      userEmail={user.email ?? ""}
      avatarUrl={(user.user_metadata?.avatar_url as string | undefined) ?? null}
      overview={{
        overallGap: session.overall_gap,
        answers,
        completenessPct: Math.round(confidence.completionRatio * 100),
        trendDelta,
        roundProgressDelta,
      }}
      confidence={confidence}
      invites={invites ?? []}
      origin={origin}
      gapFix={{
        gapTitle,
        gap: session.overall_gap,
        insight,
        alreadyChosen: existingRoadmap?.resolution_path ?? null,
      }}
      roadmapGaps={{
        version: latestVersionRow?.version ?? null,
        gaps: latestGaps,
        trendDelta,
        costOfInaction,
      }}
      departmentCoverage={departmentCoverage}
      freeformChatHistory={freeformMessages ?? []}
      companyTools={companyTools}
    />
  );
}
