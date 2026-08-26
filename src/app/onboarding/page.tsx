import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionLang } from "@/lib/i18n/get-lang";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const lang = await getSessionLang();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <OnboardingForm lang={lang} />
    </div>
  );
}
