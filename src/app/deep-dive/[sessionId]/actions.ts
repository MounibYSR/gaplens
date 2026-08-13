"use server";

import { createClient } from "@/lib/supabase/server";
import { askOpenAI } from "@/lib/ai/azure-openai";
import { checkSessionRateLimit } from "@/lib/rate-limit";
import { DEPARTMENTS } from "@/lib/assessment/departments";
import { DEEP_DIVE_FALLBACK_FOLLOWUPS } from "@/lib/deep-dive/questions";
import { CONFIDENT_TONE_DIRECTIVE } from "@/lib/ai/tone";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { Department, DeepDiveSource } from "@/lib/supabase/types";

/**
 * A department can be redone without erasing the old answers — each redo's
 * "opening" bumps to a new attempt number (auto-detected from the highest
 * attempt already on record for that department), and the paired "followup"
 * that immediately follows reuses that same attempt. Callers never need to
 * track or pass an attempt number themselves.
 */
async function currentMaxAttempt(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string,
  department: Department,
): Promise<number> {
  const { data } = await supabase
    .from("deep_dive_responses")
    .select("attempt")
    .eq("session_id", sessionId)
    .eq("department", department)
    .order("attempt", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.attempt ?? 0;
}

export async function submitDeepDiveAnswer(params: {
  sessionId: string;
  department: Department;
  questionKey: string;
  answerText: string;
  startedAt: string;
  isFirstQuestionOfRound: boolean;
}) {
  const supabase = await createClient();
  const source: DeepDiveSource = "seed";

  const existingMax = await currentMaxAttempt(supabase, params.sessionId, params.department);
  const attempt = params.isFirstQuestionOfRound ? existingMax + 1 : Math.max(existingMax, 1);

  const { error } = await supabase.from("deep_dive_responses").insert({
    session_id: params.sessionId,
    department: params.department,
    question_key: params.questionKey,
    answer_text: params.answerText,
    source,
    attempt,
    started_at: params.startedAt,
    answered_at: new Date().toISOString(),
  });

  if (error) throw error;
}

const CHAT_GUARDRAIL = `You only conduct business digital-diagnostic interviews for Qatar/GCC SMEs — covering departments, tools/systems, workflows, and operational pain points. If the owner's message drifts into unrelated general conversation, do not follow it: acknowledge briefly and steer back to a concrete follow-up question about their business area. Never engage in open-ended chit-chat, jokes, general knowledge Q&A, or topics unrelated to their business operations.`;

export async function getFollowUpQuestion(
  sessionId: string | null,
  department: Department,
  openingAnswer: string,
  lang: EntryLang,
  previousQuestions: string[] = [],
) {
  const dept = DEPARTMENTS.find((d) => d.key === department)!;
  const languageName = lang === "ar" ? "Gulf-friendly conversational Arabic" : "English";

  const fallback = () => DEEP_DIVE_FALLBACK_FOLLOWUPS[department][lang];

  if (sessionId) {
    const rateLimit = await checkSessionRateLimit({
      sessionId,
      table: "deep_dive_responses",
      windowMinutes: 60,
      maxCount: 60,
    });
    if (!rateLimit.allowed) return fallback();
  }

  const avoidRepeatsBlock = previousQuestions.length
    ? `\n\nQuestions already asked earlier in this conversation, for other business areas — do not reuse this exact wording or sentence pattern, and make sure your question is clearly distinct from all of these:\n${previousQuestions.map((q) => `- "${q}"`).join("\n")}`
    : "";

  const system = `${CONFIDENT_TONE_DIRECTIVE}\n\n${CHAT_GUARDRAIL}\n\nYou are conducting a short, focused business diagnostic interview for a Qatar/GCC SME, covering the area "${dept.title.en}". The owner just answered an opening question about this area. Ask exactly one natural, specific follow-up question that digs one level deeper into what they said — short, conversational, no pleasantries, no commentary, no preamble, no hedging. Phrase it using language and concrete details specific to "${dept.title.en}" (its actual subject matter — tools, workflows, customers, data, or team, whichever this area is about), never a generic template that could apply to any department.${avoidRepeatsBlock} Respond in ${languageName} only, with nothing but the question itself.`;

  try {
    const followUp = await askOpenAI({
      system,
      messages: [{ role: "user", content: openingAnswer }],
      maxTokens: 120,
    });
    return followUp.trim();
  } catch {
    return fallback();
  }
}
