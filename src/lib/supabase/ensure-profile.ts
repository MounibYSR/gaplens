import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "./admin";

/**
 * A signup only creates an auth user. The company + profile row are created
 * lazily on first authenticated request (immediately after signUp if email
 * confirmation is off, or from /auth/confirm or /auth/callback once it's on,
 * or on first Google OAuth sign-in). This bootstrap step runs before the
 * user has a company_id, so RLS can't scope it to "their" company yet — it
 * uses the service-role admin client instead, trusting the already-verified
 * `user` from a real Supabase auth session.
 *
 * Returns whether a new profile was created (`true`) vs. one already existed
 * (`false`) — callers use this to distinguish a first-time sign-in from a
 * returning user, e.g. to route Google OAuth sign-ins to onboarding vs. the
 * dashboard.
 */
export async function ensureProfile(user: User): Promise<boolean> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return false;

  const companyName =
    (user.user_metadata?.company_name as string | undefined) || "شركتي";
  const fullName = (user.user_metadata?.full_name as string | undefined) || "";

  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({ name: companyName })
    .select("id")
    .single();

  if (companyError || !company) {
    throw companyError ?? new Error("Failed to create company");
  }

  const { error: profileError } = await admin.from("users").insert({
    id: user.id,
    company_id: company.id,
    name: fullName,
    role: "owner",
    email: user.email ?? "",
  });

  if (profileError) throw profileError;

  return true;
}
