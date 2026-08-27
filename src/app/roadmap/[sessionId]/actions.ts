"use server";

import { createClient } from "@/lib/supabase/server";
import { generateAndSaveRoadmap, type GenerateRoadmapResult } from "@/lib/roadmap/generate-and-save";

export async function generateRoadmapAction(sessionId: string): Promise<GenerateRoadmapResult> {
  const supabase = await createClient();
  return generateAndSaveRoadmap(supabase, sessionId);
}
