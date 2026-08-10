import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionLang } from "@/lib/i18n/get-lang";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import { parseScanAnswers, pickHeadlineInsightKey } from "@/lib/scan/scoring";
import { AdvisorPanel } from "./advisor-panel";

export default async function AdvisorPage({
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
    .select("id, overall_gap, scan_answers")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) notFound();
  if (session.overall_gap == null) redirect(`/assessment/${sessionId}`);

  const lang = await getSessionLang();
  const t = appDictionary[lang];
  const answers = parseScanAnswers(session.scan_answers);
  const headline = pickHeadlineInsightKey(answers);
  const insight =
    headline.category === "money"
      ? headline.sharp
        ? t.teaser.costMoneySharp
        : t.teaser.costMoneyBase
      : headline.category === "customers"
        ? t.teaser.costCustomersSharp
        : t.teaser.costTimeSharp;
  const gapTitle = t.advisor.genericGapTitle;

  const { data: existingRoadmap } = await supabase
    .from("roadmap_items")
    .select("resolution_path")
    .eq("session_id", sessionId)
    .eq("gap_title", gapTitle)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <AdvisorPanel
        sessionId={sessionId}
        gapTitle={gapTitle}
        gap={session.overall_gap}
        insight={insight}
        alreadyChosen={existingRoadmap?.resolution_path ?? null}
        lang={lang}
      />
    </div>
  );
}
