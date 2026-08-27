import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { computeConfidence, filterToLatestAttempt } from "@/lib/deep-dive/confidence";
import { getSessionLang } from "@/lib/i18n/get-lang";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import { ConsoleLabel } from "@/components/ui/console-label";
import { GenerateRoadmapButton } from "@/components/dashboard/generate-roadmap-button";

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("assessment_sessions")
    .select("id, company_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) notFound();

  const { data: deepDiveResponsesRaw } = await supabase
    .from("deep_dive_responses")
    .select("department, response_length, started_at, answered_at, attempt")
    .eq("session_id", sessionId);

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

  // TODO: roadmap generation is no longer gated on deep-dive completion — see
  // roadmap-section.tsx for the corresponding note. confidence is still shown
  // as informational context below.
  const confidence = computeConfidence({
    deepDiveResponses,
    toolCount: toolCount ?? 0,
    freeformMessageCount: freeformMessageCount ?? 0,
    visualConsultationCount: visualConsultationCount ?? 0,
  });

  const lang = await getSessionLang();
  const t = appDictionary[lang].dashboard;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <div
        className="glass-card w-full max-w-md rounded-2xl p-8"
        style={{ borderColor: "var(--border-g)" }}
      >
        <ConsoleLabel>{t.badge}</ConsoleLabel>
        <h1 className="mt-3 mb-2 text-xl font-extrabold text-ink">{t.roadmapTitle}</h1>
        <p className="ltr-num mb-6 text-xs text-muted" dir="ltr">
          {t.confidenceLine(confidence.overall, confidence.responsesCount, confidence.areasCovered)}
        </p>
        <GenerateRoadmapButton sessionId={sessionId} lang={lang} />
        <Link
          href="/dashboard"
          className="mt-3 block w-full rounded-lg border py-3 text-center font-bold text-ink"
          style={{ borderColor: "var(--border-g)" }}
        >
          {appDictionary[lang].deepDive.backToDashboard}
        </Link>
      </div>
    </div>
  );
}
