"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ResolutionPath } from "@/lib/supabase/types";

export async function chooseResolutionPath(
  sessionId: string,
  gapTitle: string,
  path: ResolutionPath,
) {
  const supabase = await createClient();

  const { error } = await supabase.from("roadmap_items").insert({
    session_id: sessionId,
    gap_title: gapTitle,
    priority: 1,
    resolution_path: path,
    status: "in_progress",
  });

  if (error) throw error;

  revalidatePath(`/advisor/${sessionId}`);
}
