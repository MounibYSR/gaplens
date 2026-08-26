import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionLang } from "@/lib/i18n/get-lang";
import { DeepDiveChat } from "./deep-dive-chat";
import type { CompanyTool } from "@/app/dashboard/tool-map-actions";

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
    .select("id, company_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) notFound();

  const { data: companySessions } = await supabase
    .from("assessment_sessions")
    .select("id")
    .eq("company_id", session.company_id);
  const companySessionIds = (companySessions ?? []).map((s) => s.id);

  const { data: companyToolRows } = await supabase
    .from("tools")
    .select("id, name, catalog_id, importance, is_connected, monthly_cost, currency")
    .in("session_id", companySessionIds);

  const companyTools: CompanyTool[] = (companyToolRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    catalogId: row.catalog_id,
    importance: row.importance,
    isConnected: row.is_connected,
    monthlyCost: row.monthly_cost,
    currency: row.currency,
  }));

  const lang = await getSessionLang();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <DeepDiveChat sessionId={sessionId} lang={lang} companyTools={companyTools} />
    </div>
  );
}
