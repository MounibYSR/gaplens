import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Single source of truth for "should this authenticated user go to the
 * start of onboarding or straight to the dashboard" — always reads the
 * flag fresh from the DB for the record tied to this exact user id, never
 * from a cached/local value. Used by every post-auth entry point (password
 * login, OAuth callback, email confirmation/magic link) so none of them can
 * drift out of sync with each other.
 */
export async function getPostAuthDestination(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<"/onboarding" | "/dashboard"> {
  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.company_id) return "/onboarding";

  const { data: company } = await supabase
    .from("companies")
    .select("onboarding_completed_at")
    .eq("id", profile.company_id)
    .maybeSingle();

  return company?.onboarding_completed_at ? "/dashboard" : "/onboarding";
}
