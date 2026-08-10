import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { FreeformChatMessage } from "./types";
import { askOpenAI } from "@/lib/ai/azure-openai";

// Same cost-control shape as the deep-dive/roadmap summarization: keep full
// detail for a bounded recent window, fold everything older into one rolling
// summary instead of resending the whole history on every turn.
export const RECENT_MESSAGE_WINDOW = 12;
const SUMMARIZE_BATCH = 12;

export function splitContext(messages: FreeformChatMessage[], summarizedCount: number) {
  const total = messages.length;
  const recentCount = Math.min(RECENT_MESSAGE_WINDOW, total);
  const recentMessages = messages.slice(total - recentCount);
  const olderUnsummarized = messages.slice(summarizedCount, total - recentCount);
  return { recentMessages, olderUnsummarized };
}

/**
 * If enough older messages have piled up outside the recent window and
 * haven't been folded into the summary yet, summarize them into (and
 * replace) the company's rolling `freeform_chat_summary`, and advance
 * `freeform_chat_summarized_count` so they aren't summarized again. A no-op
 * most turns — only fires once a full batch has accumulated.
 */
export async function maybeSummarizeFreeformChat(
  supabase: SupabaseClient<Database>,
  companyId: string,
): Promise<void> {
  const { data: company } = await supabase
    .from("companies")
    .select("freeform_chat_summary, freeform_chat_summarized_count")
    .eq("id", companyId)
    .single();
  if (!company) return;

  const { data: messages } = await supabase
    .from("freeform_chat_messages")
    .select("role, content, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  const { olderUnsummarized } = splitContext(messages ?? [], company.freeform_chat_summarized_count);
  if (olderUnsummarized.length < SUMMARIZE_BATCH) return;

  const transcript = olderUnsummarized
    .map((m) => `${m.role === "user" ? "Owner" : "Advisor"}: ${m.content}`)
    .join("\n");
  const priorSummaryBlock = company.freeform_chat_summary
    ? `Existing summary so far:\n${company.freeform_chat_summary}\n\n`
    : "";

  try {
    const summary = await askOpenAI({
      system:
        "You compress an ongoing business-advisory conversation's history into a short, dense factual summary for reuse as context in later turns. No commentary or filler — just the facts: what was discussed, what was recommended or decided, and what's still open. Keep it under 200 words, plain prose.",
      messages: [
        { role: "user", content: `${priorSummaryBlock}New messages to fold in:\n${transcript}` },
      ],
      maxTokens: 400,
    });

    await supabase
      .from("companies")
      .update({
        freeform_chat_summary: summary.trim(),
        freeform_chat_summarized_count: company.freeform_chat_summarized_count + olderUnsummarized.length,
      })
      .eq("id", companyId);
  } catch {
    // Summarization is a cost-control optimization, not a correctness
    // requirement — if it fails, just leave it for the next turn to retry.
  }
}
