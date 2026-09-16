"use server";

import { createClient } from "@/lib/supabase/server";
import type { Theme } from "@/lib/theme/get-session-theme";

export async function updateThemePreference(theme: Theme) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("users").update({ theme_preference: theme }).eq("id", user.id);
  if (error) throw error;
}
