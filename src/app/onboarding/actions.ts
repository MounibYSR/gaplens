"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { TeamSize } from "@/lib/supabase/types";

const VALID_SIZES: TeamSize[] = ["1-5", "6-15", "16-50", "50+"];

export async function startAssessment(_prevState: unknown, formData: FormData) {
  const teamSize = String(formData.get("teamSize") ?? "");
  const lang: EntryLang = formData.get("lang") === "ar" ? "ar" : "en";
  const t = appDictionary[lang].onboarding;

  if (!VALID_SIZES.includes(teamSize as TeamSize)) {
    return { error: t.error };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    return { error: lang === "ar" ? "تعذر العثور على شركتك" : "Couldn't find your company" };
  }

  const { data: session, error } = await supabase
    .from("assessment_sessions")
    .insert({ company_id: profile.company_id, team_size: teamSize as TeamSize })
    .select("id")
    .single();

  if (error || !session) {
    return { error: lang === "ar" ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, please try again" };
  }

  redirect(`/assessment/${session.id}`);
}
