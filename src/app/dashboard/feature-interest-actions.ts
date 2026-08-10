"use server";

import { createClient } from "@/lib/supabase/server";
import type { PriceBand } from "@/lib/supabase/types";

async function requireOwnCompany(companyId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase.from("users").select("company_id").eq("id", user.id).single();
  if (!profile?.company_id || profile.company_id !== companyId) {
    throw new Error("Not authorized for this company");
  }

  return supabase;
}

/** Fired the moment the "I'm interested" CTA is clicked, before the form even opens. */
export async function logInterestClick(companyId: string) {
  const supabase = await requireOwnCompany(companyId);
  const { error } = await supabase
    .from("feature_interest_signals")
    .insert({ company_id: companyId, event_type: "click" });
  if (error) throw error;
}

export async function submitInterestSignal(params: {
  companyId: string;
  priceBand: PriceBand;
  platforms: string[];
}) {
  const supabase = await requireOwnCompany(params.companyId);
  const { error } = await supabase.from("feature_interest_signals").insert({
    company_id: params.companyId,
    event_type: "submit",
    price_band: params.priceBand,
    platforms: params.platforms,
  });
  if (error) throw error;
}
