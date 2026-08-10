import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Server-only client using the service role key — bypasses RLS entirely.
 * Never import this from a Client Component or expose the key to the browser.
 * Reserved for bootstrap operations that must run before a user has a
 * company_id RLS can scope against (see ensureProfile).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
