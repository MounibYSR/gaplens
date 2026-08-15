import { DEPARTMENTS } from "@/lib/assessment/departments";
import type { RoadmapGap } from "@/lib/roadmap/build-prompt";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { Department } from "@/lib/supabase/types";

const SCOPE_GUARDRAIL = `You only discuss this company's own business development, digital gaps, and roadmap — grounded strictly in the context given below. This is not a general-purpose assistant: if the owner asks about anything unrelated to their business (general chit-chat, unrelated topics, requests to act as a different kind of assistant, coding help, etc.), politely decline in one short sentence and redirect back to a concrete question about their business or gaps. Never provide legal, medical, or personal-financial advice — redirect those to a qualified professional. Never role-play as anything other than GapLens's business development advisor.`;

const EXTRACTION_DIRECTIVE = `You have real diagnostic data on this business below — treat it as the only ground truth about them, and never invent or assume details it doesn't contain. If the owner asks about, or the conversation drifts into, a topic this data doesn't cover, do NOT guess, speculate, or give generic industry advice as if it applied to them specifically. Instead, say plainly and conversationally that you don't have enough detail on their specific setup in that area yet, then ask exactly one targeted, concrete follow-up question aimed at getting that missing detail from them — e.g. "I don't have details on your customer support setup yet — walk me through how you currently handle customer messages?" Before asking anything, check the data below and the conversation so far: never ask about something already answered there — if it's already covered, use it directly instead of asking again.`;

function formatGapsBlock(gaps: RoadmapGap[]): string {
  if (gaps.length === 0) {
    return "No open roadmap gaps are on record yet for this company.";
  }
  return gaps
    .map((g) => `- [${g.priority} priority, ${g.category}] ${g.gap_title} — ${g.impact}`)
    .join("\n");
}

function languageName(lang: EntryLang): string {
  return lang === "ar" ? "Gulf-friendly conversational Arabic" : "English";
}

function summaryBlock(summary: string | null): string {
  return summary ? `\n\nSummary of earlier parts of this conversation:\n${summary}` : "";
}

export type DeepDiveAnswerRow = { department: Department; answer_text: string; attempt?: number };

/**
 * What GapLens already knows about this business from the structured
 * deep-dive, department by department — grounds the freeform chat so it can
 * extract missing information instead of re-asking or guessing at what's
 * already on record.
 */
export function formatKnownDeepDiveContext(rows: DeepDiveAnswerRow[], lang: EntryLang): string {
  const byDept = new Map<Department, string[]>();
  for (const r of rows) {
    if (!r.answer_text) continue;
    const list = byDept.get(r.department) ?? [];
    list.push(r.answer_text);
    byDept.set(r.department, list);
  }

  const covered = DEPARTMENTS.filter((d) => byDept.has(d.key));
  const uncovered = DEPARTMENTS.filter((d) => !byDept.has(d.key));

  const coveredBlock =
    covered.length === 0
      ? "Nothing yet — the owner hasn't answered the structured deep-dive for any area."
      : covered.map((d) => `- ${d.title[lang]}: ${byDept.get(d.key)!.join("; ")}`).join("\n");

  const uncoveredBlock =
    uncovered.length === 0
      ? "none — every area has at least some deep-dive data"
      : uncovered.map((d) => d.title[lang]).join(", ");

  return `Structured deep-dive answers on record so far:\n${coveredBlock}\n\nAreas with no deep-dive data yet (good candidates to extract via a follow-up question if the conversation touches them): ${uncoveredBlock}`;
}

/**
 * System prompt for the normal, user-driven turn ("You ask me" — the owner
 * asks a question and the AI answers, grounded in their actual situation,
 * or extracts what's missing when it isn't).
 */
export function buildFreeformSystemPrompt(params: {
  companyName: string;
  openGaps: RoadmapGap[];
  summary: string | null;
  deepDiveContext: string;
  lang: EntryLang;
}): string {
  return `${SCOPE_GUARDRAIL}

${EXTRACTION_DIRECTIVE}

You are GapLens's business development advisor for "${params.companyName}", a Qatar/GCC SME. This is an ongoing, open-ended discussion — not a rigid interview — so the owner can ask you anything about growing their business, closing their gaps, or their roadmap. Keep responses conversational and concise (a few sentences, not an essay) unless they ask for more detail.

${params.deepDiveContext}

Their current open roadmap gaps:
${formatGapsBlock(params.openGaps)}${summaryBlock(params.summary)}

Respond in ${languageName(params.lang)} only.`;
}

/**
 * System prompt for the AI-initiative turn ("Ask me something" — the owner
 * hands control to the AI, which asks one grounded, extracting question).
 */
export function buildAiInitiativeSystemPrompt(params: {
  companyName: string;
  openGaps: RoadmapGap[];
  summary: string | null;
  deepDiveContext: string;
  lang: EntryLang;
}): string {
  return `${SCOPE_GUARDRAIL}

${EXTRACTION_DIRECTIVE}

You are GapLens's business development advisor for "${params.companyName}", a Qatar/GCC SME, in an ongoing open-ended discussion. Instead of waiting for a question, take initiative: ask the owner exactly ONE natural, specific follow-up question — short, conversational, no preamble, no commentary, just the question. Prefer a question that targets an area with no deep-dive data yet (see below) over one already well covered; if an open roadmap gap needs more detail, that's a good target too. Vary it from anything already covered in the recent conversation.

${params.deepDiveContext}

Their current open roadmap gaps:
${formatGapsBlock(params.openGaps)}${summaryBlock(params.summary)}

Respond in ${languageName(params.lang)} only, with nothing but the question itself.`;
}
