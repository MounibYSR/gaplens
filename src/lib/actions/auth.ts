"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import { getPostAuthDestination } from "@/lib/auth/post-login-destination";

export async function signUp(_prevState: unknown, formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !companyName || !email || !password) {
    return { error: "كل الحقول مطلوبة" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, company_name: companyName },
    },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "تعذر إنشاء الحساب" };

  if (data.session) {
    try {
      await ensureProfile(data.user);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "تعذر إعداد الحساب" };
    }
    redirect("/onboarding");
  }

  redirect("/signup/check-email");
}

export async function logIn(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "البريد الإلكتروني وكلمة المرور مطلوبة" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "لم يتم تأكيد البريد الإلكتروني بعد" };
    }
    return { error: "بيانات الدخول غير صحيحة" };
  }
  if (!data.user) {
    return { error: "بيانات الدخول غير صحيحة" };
  }

  await ensureProfile(data.user);
  const destination = await getPostAuthDestination(supabase, data.user.id);
  redirect(destination);
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Bust the whole cached route tree so a different account logging in
  // right after on the same browser never gets served a stale RSC payload
  // (dashboard data, sidebar name/logo, etc.) from this session.
  revalidatePath("/", "layout");
  redirect("/");
}
