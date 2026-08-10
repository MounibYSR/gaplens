export const QUIZ_QUESTION_COUNT = 4;

export function bucketGap(gap: number): "strong" | "needsWork" {
  return gap >= 40 ? "needsWork" : "strong";
}

export type TeaserTool = "whatsapp" | "instagram" | "sheets" | "crm" | "accounting";

export const TEASER_TOOLS: TeaserTool[] = ["whatsapp", "instagram", "sheets", "crm", "accounting"];
export const MAX_TEASER_TOOLS = 5;

export type DataAnswer = "one" | "few" | "unsure";
export type CustomerAnswer = "never" | "sometimes" | "often";
export type PaceAnswer = "keeping" | "behind" | "unsure";

export type ToolSummary = { count: number; isolatedRatio: number };

export type TeaserAnswers = {
  toolSummary: ToolSummary;
  data: DataAnswer | null;
  customer: CustomerAnswer | null;
  pace: PaceAnswer | null;
};

export function pairKey(a: TeaserTool, b: TeaserTool) {
  return [a, b].sort().join("|");
}

export function allPairs(tools: TeaserTool[]) {
  const pairs: string[] = [];
  for (let i = 0; i < tools.length; i++) {
    for (let j = i + 1; j < tools.length; j++) {
      pairs.push(pairKey(tools[i], tools[j]));
    }
  }
  return pairs;
}

export function toolSummaryFromPairs(tools: TeaserTool[], connections: string[]): ToolSummary {
  const pairs = allPairs(tools);
  // Isolation is a relationship between tools — with 0 or 1 tool there are no
  // possible pairs to connect, so there's nothing to be "isolated" from.
  // Defaulting that case to 1 (previously) meant a single-tool business
  // scored as 100% disconnected, which isn't a real signal about anything.
  const isolatedRatio = pairs.length > 0 ? 1 - connections.length / pairs.length : 0;
  return { count: tools.length, isolatedRatio };
}

const DATA_SCORE: Record<DataAnswer, number> = { one: 10, few: 45, unsure: 90 };
const CUSTOMER_SCORE: Record<CustomerAnswer, number> = { never: 10, sometimes: 45, often: 90 };
const PACE_SCORE: Record<PaceAnswer, number> = { keeping: 10, behind: 90, unsure: 55 };

// No digital tooling at all is itself a real, sizable gap (not a "perfect
// score") — fixed rather than derived, since there's no connection ratio to
// compute from zero tools.
const NO_TOOLS_SCORE = 70;

/**
 * The gap here is disconnection, not tool count — a business running 6
 * well-integrated tools is in better shape than one running 2 tools that
 * don't talk to each other. So `isolatedRatio` (the real problem) drives
 * most of the score, and `count` only adds a small "more moving parts to
 * eventually connect" bump on top — it never dominates on its own.
 */
function toolScore(summary: ToolSummary): number {
  if (summary.count === 0) return NO_TOOLS_SCORE;
  const isolationPenalty = summary.isolatedRatio * 85;
  const sprawlBonus = Math.min(15, summary.count * 2);
  return Math.min(100, Math.round(isolationPenalty + sprawlBonus));
}

/**
 * Overall Gap Score: an equal-weighted average of four independent signals,
 * each already expressed 0-100 on the same "higher = bigger gap" scale —
 * tool fragmentation, sales-data visibility, customer responsiveness, and
 * pace versus industry. Equal weighting keeps the result auditable: no
 * single answer can swing the score more than its fair quarter.
 */
export function computeTeaserGap(answers: TeaserAnswers) {
  const t = toolScore(answers.toolSummary);
  const d = answers.data ? DATA_SCORE[answers.data] : 0;
  const c = answers.customer ? CUSTOMER_SCORE[answers.customer] : 0;
  const p = answers.pace ? PACE_SCORE[answers.pace] : 0;
  return Math.round((t + d + c + p) / 4);
}

export function computeSharpenFlags(answers: TeaserAnswers) {
  return {
    money: answers.toolSummary.count >= 4 && answers.toolSummary.isolatedRatio >= 0.5,
    customers: answers.customer === "often",
    time: answers.data === "unsure" || answers.pace === "behind",
  };
}

export function pickHeadlineInsightKey(answers: TeaserAnswers): {
  category: "money" | "customers" | "time";
  sharp: boolean;
} {
  const sharpen = computeSharpenFlags(answers);
  if (sharpen.money) return { category: "money", sharp: true };
  if (sharpen.customers) return { category: "customers", sharp: true };
  if (sharpen.time) return { category: "time", sharp: true };
  return { category: "money", sharp: false };
}

const EMPTY_ANSWERS: TeaserAnswers = {
  toolSummary: { count: 0, isolatedRatio: 0 },
  data: null,
  customer: null,
  pace: null,
};

export function parseScanAnswers(raw: unknown): TeaserAnswers {
  if (!raw || typeof raw !== "object") return EMPTY_ANSWERS;
  const r = raw as Partial<TeaserAnswers>;
  return {
    toolSummary:
      r.toolSummary && typeof r.toolSummary === "object"
        ? {
            count: Number(r.toolSummary.count) || 0,
            isolatedRatio: Number(r.toolSummary.isolatedRatio) || 0,
          }
        : { count: 0, isolatedRatio: 0 },
    data: r.data ?? null,
    customer: r.customer ?? null,
    pace: r.pace ?? null,
  };
}
