import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionLang } from "@/lib/i18n/get-lang";
import { DeepDiveChat } from "./deep-dive-chat";

export default async function DeepDivePage({
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
    .select("id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) notFound();

  const lang = await getSessionLang();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <DeepDiveChat sessionId={sessionId} lang={lang} />
    </div>
  );
}
