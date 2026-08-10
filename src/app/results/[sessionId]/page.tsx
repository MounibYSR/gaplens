import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScanResultCard } from "@/components/results/gauge";
import { ConsoleLabel } from "@/components/ui/console-label";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import { getSessionLang } from "@/lib/i18n/get-lang";

export default async function ResultsPage({
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
  const t = appDictionary[lang].results;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <ConsoleLabel>{t.badge}</ConsoleLabel>
        <h1 className="mt-2 mb-4 text-xl font-extrabold text-ink">{t.title}</h1>

        <ScanResultCard gap={session.overall_gap} lang={lang} continueHref="/dashboard" />
      </div>
    </div>
  );
}
