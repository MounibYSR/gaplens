import { MANUAL_HOURS_QUESTION, MANUAL_HEADCOUNT_QUESTION } from "@/lib/deep-dive/question-bank";
import type { DeepDiveResponseRow } from "@/lib/deep-dive/confidence";
import type { CostOfInaction, CostOfInactionLineItem, RoadmapGap, ToolInventoryEntry } from "./build-prompt";

// Every deep-dive answer is stored as its translated label text (whichever
// language it was answered in), not the option's stable `value` — so the
// lookup below is built from the question-bank's own option definitions
// (both languages) rather than a separately hand-maintained string list.
const HOURS_MIDPOINT_BY_VALUE: Record<string, number> = { under_5: 3, "5_10": 7.5, "10_20": 15, "20_plus": 25 };
const HEADCOUNT_MIDPOINT_BY_VALUE: Record<string, number> = { one: 1, two_three: 2.5, four_plus: 5 };
const WEEKS_PER_MONTH = 4.33;
const DEFAULT_REGIONAL_HOURLY_COST = 30; // QAR/hr — GapLens's Qatar/GCC target market, used only when no account setting is set.

function buildAnswerToMidpoint(
  options: { value: string; label: { en: string; ar: string } }[],
  midpointByValue: Record<string, number>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const opt of options) {
    const midpoint = midpointByValue[opt.value];
    if (midpoint == null) continue;
    map.set(opt.label.en, midpoint);
    map.set(opt.label.ar, midpoint);
  }
  return map;
}

const HOURS_ANSWER_MAP = buildAnswerToMidpoint(MANUAL_HOURS_QUESTION.type === "single_select" ? MANUAL_HOURS_QUESTION.options : [], HOURS_MIDPOINT_BY_VALUE);
const HEADCOUNT_ANSWER_MAP = buildAnswerToMidpoint(
  MANUAL_HEADCOUNT_QUESTION.type === "single_select" ? MANUAL_HEADCOUNT_QUESTION.options : [],
  HEADCOUNT_MIDPOINT_BY_VALUE,
);

/**
 * Deterministic, code-computed Cost of Inaction — deliberately never asks
 * the model to invent a dollar figure. Two sources, summed separately:
 * 1) tool-consolidation savings, from gaps the model flagged with two or
 *    more `related_tool_names` matched against real Tool Map monthly_cost.
 * 2) manual-labor cost, from real hours/headcount answers × an hourly rate
 *    (the account's own estimate if set, otherwise a labeled regional
 *    default) — always marked "estimated", never presented as fact.
 */
export function computeCostOfInaction(params: {
  gaps: RoadmapGap[];
  toolInventory: ToolInventoryEntry[];
  deepDiveResponses: DeepDiveResponseRow[];
  avgHourlyCost: number | null;
  currency: string;
}): CostOfInaction {
  const { gaps, toolInventory, deepDiveResponses, avgHourlyCost, currency } = params;
  const lineItems: CostOfInactionLineItem[] = [];

  const toolCostByName = new Map(
    toolInventory.filter((t) => t.monthlyCost != null).map((t) => [t.name.trim().toLowerCase(), t.monthlyCost as number]),
  );

  for (const gap of gaps) {
    const relatedNames = gap.related_tool_names ?? [];
    if (relatedNames.length < 2) continue;

    let sum = 0;
    let matchedCount = 0;
    let skippedCount = 0;
    for (const name of relatedNames) {
      const cost = toolCostByName.get(name.trim().toLowerCase());
      if (cost == null) {
        skippedCount++;
        continue;
      }
      sum += cost;
      matchedCount++;
    }
    if (matchedCount < 2) continue; // need at least 2 real costs to claim a consolidation figure

    lineItems.push({
      area: gap.gap_title,
      estimated_monthly_amount: sum,
      currency,
      estimated: true,
      note: skippedCount > 0 ? `Based on ${matchedCount} of ${relatedNames.length} named tools — the rest had no monthly cost on record.` : undefined,
    });
  }

  const hourlyRate = avgHourlyCost ?? DEFAULT_REGIONAL_HOURLY_COST;
  let totalManualHours = 0;
  let manualDataPoints = 0;

  const hoursByDept = new Map<string, number>();
  const headcountByDept = new Map<string, number>();
  for (const r of deepDiveResponses) {
    if (r.question_key === MANUAL_HOURS_QUESTION.key && r.answer_text) {
      const hours = HOURS_ANSWER_MAP.get(r.answer_text);
      if (hours != null) hoursByDept.set(r.department, hours);
    }
    if (r.question_key === MANUAL_HEADCOUNT_QUESTION.key && r.answer_text) {
      const headcount = HEADCOUNT_ANSWER_MAP.get(r.answer_text);
      if (headcount != null) headcountByDept.set(r.department, headcount);
    }
  }

  for (const [dept, hours] of hoursByDept) {
    const headcount = headcountByDept.get(dept);
    if (headcount == null) continue;
    totalManualHours += hours * headcount;
    manualDataPoints++;
  }

  if (manualDataPoints > 0) {
    const monthlyLaborCost = totalManualHours * WEEKS_PER_MONTH * hourlyRate;
    lineItems.push({
      area: "Manual work (staff time)",
      estimated_monthly_amount: Math.round(monthlyLaborCost),
      currency,
      estimated: true,
      note:
        avgHourlyCost != null
          ? undefined
          : `Uses a labeled regional default hourly rate (${DEFAULT_REGIONAL_HOURLY_COST} ${currency}/hr) — set your own in Account Settings for a more accurate estimate.`,
    });
  }

  const total = lineItems.reduce((sum, item) => sum + (item.estimated_monthly_amount ?? 0), 0);

  return {
    line_items: lineItems,
    total_estimated_recoverable: lineItems.length > 0 ? Math.round(total) : null,
    currency,
  };
}
