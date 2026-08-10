import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionLang } from "@/lib/i18n/get-lang";
import { AssessmentFlow } from "./assessment-flow";

export default async function AssessmentPage({
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
    .select("id, overall_gap")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) notFound();
  if (session.overall_gap != null) redirect(`/results/${sessionId}`);

  const lang = await getSessionLang();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <AssessmentFlow sessionId={sessionId} lang={lang} />
    </div>
  );
}
