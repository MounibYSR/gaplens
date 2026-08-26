"use server";

import { createClient } from "@/lib/supabase/server";

const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/svg+xml"]);

export async function updateAccountSettings(
  formData: FormData,
): Promise<{ logoUrl: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const companyId = formData.get("companyId");
  if (typeof companyId !== "string" || !companyId) throw new Error("Missing companyId");

  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();
  if (!profile?.company_id || profile.company_id !== companyId) {
    throw new Error("Not authorized for this company");
  }

  const nameRaw = formData.get("name");
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  const file = formData.get("logo");
  const currencyRaw = formData.get("currency");
  const avgHourlyCostRaw = formData.get("avgHourlyCost");

  const update: { name?: string; logo_url?: string; currency?: string; avg_hourly_cost?: number | null } = {};
  if (name) update.name = name;
  if (typeof currencyRaw === "string" && currencyRaw.trim()) update.currency = currencyRaw.trim().toUpperCase();
  if (typeof avgHourlyCostRaw === "string") {
    const parsed = avgHourlyCostRaw.trim() === "" ? null : Number(avgHourlyCostRaw);
    update.avg_hourly_cost = parsed != null && !Number.isNaN(parsed) ? parsed : null;
  }

  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_LOGO_TYPES.has(file.type)) {
      throw new Error("Logo must be a PNG, JPG, or SVG image");
    }
    const ext = file.type === "image/svg+xml" ? "svg" : file.type === "image/png" ? "png" : "jpg";
    const path = `${companyId}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("company-logos")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) throw uploadError;

    const { data: pub } = supabase.storage.from("company-logos").getPublicUrl(path);
    update.logo_url = `${pub.publicUrl}?v=${Date.now()}`;
  }

  if (Object.keys(update).length > 0) {
    const { error } = await supabase.from("companies").update(update).eq("id", companyId);
    if (error) throw error;
  }

  return { logoUrl: update.logo_url ?? null };
}
