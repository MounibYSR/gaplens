"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

export type CompanyTool = {
  id: string;
  name: string;
  catalogId: string | null;
  importance: number;
  isConnected: boolean;
  monthlyCost: number | null;
  currency: string | null;
};

/**
 * Adds a tool to the company's persistent Tool Map. `tools.session_id` is a
 * NOT NULL foreign key, so the row is attached to whichever assessment
 * round is currently latest for this company — reads of the Tool Map are
 * company-wide (span every round's session_id), so which round a row is
 * physically attached to doesn't matter for display or roadmap generation.
 */
export async function addCompanyTool(params: {
  companyId: string;
  name: string;
  catalogId: string | null;
  importance: number;
  isConnected: boolean;
  monthlyCost: number | null;
  currency: string | null;
}) {
  const supabase = await requireOwnCompany(params.companyId);

  const { data: latestSession, error: sessionError } = await supabase
    .from("assessment_sessions")
    .select("id")
    .eq("company_id", params.companyId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessionError) throw sessionError;
  if (!latestSession) throw new Error("No assessment session found for this company");

  const { data, error } = await supabase
    .from("tools")
    .insert({
      session_id: latestSession.id,
      name: params.name,
      catalog_id: params.catalogId,
      importance: params.importance,
      is_connected: params.isConnected,
      monthly_cost: params.monthlyCost,
      currency: params.currency,
    })
    .select("id, name, catalog_id, importance, is_connected, monthly_cost, currency")
    .single();

  if (error || !data) throw error ?? new Error("Failed to add tool");

  revalidatePath("/dashboard");

  const tool: CompanyTool = {
    id: data.id,
    name: data.name,
    catalogId: data.catalog_id,
    importance: data.importance,
    isConnected: data.is_connected,
    monthlyCost: data.monthly_cost,
    currency: data.currency,
  };
  return tool;
}

export async function updateCompanyTool(params: {
  companyId: string;
  toolId: string;
  importance?: number;
  isConnected?: boolean;
}) {
  const supabase = await requireOwnCompany(params.companyId);

  const updates: { importance?: number; is_connected?: boolean } = {};
  if (params.importance !== undefined) updates.importance = params.importance;
  if (params.isConnected !== undefined) updates.is_connected = params.isConnected;

  const { error } = await supabase.from("tools").update(updates).eq("id", params.toolId);
  if (error) throw error;

  revalidatePath("/dashboard");
}

export async function deleteCompanyTool(params: { companyId: string; toolId: string }) {
  const supabase = await requireOwnCompany(params.companyId);

  const { error } = await supabase.from("tools").delete().eq("id", params.toolId);
  if (error) throw error;

  revalidatePath("/dashboard");
}
