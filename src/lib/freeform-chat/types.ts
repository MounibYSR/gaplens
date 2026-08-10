import type { FreeformChatRole } from "@/lib/supabase/types";

export type FreeformChatMessage = {
  role: FreeformChatRole;
  content: string;
  created_at: string;
};
