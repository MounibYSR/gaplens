import { DEPARTMENTS } from "@/lib/assessment/departments";
import type { Department, DeepDiveDepartmentKey } from "@/lib/supabase/types";

export type DeepDiveResponseRow = {
  department: DeepDiveDepartmentKey;
  question_key?: string;
  answer_text?: string;
  response_length: number;
  started_at: string;
  answered_at: string;
  attempt?: number;
};

/**
 * A department can be redone without erasing the old attempt (see
 * deep_dive_responses.attempt) — for scoring, coverage, and roadmap context,
 * only the latest attempt per department should count as "current"; older
 * attempts stay in the database purely for history/comparison. Business
 * Context rows just form their own attempt-tracking group here — no
 * special-casing needed, this only groups by whatever `department` holds.
 */
export function filterToLatestAttempt<T extends { department: DeepDiveDepartmentKey; attempt?: number }>(
  responses: T[],
): T[] {
  const maxAttemptByDept = new Map<DeepDiveDepartmentKey, number>();
  for (const r of responses) {
    const attempt = r.attempt ?? 1;
    const current = maxAttemptByDept.get(r.department) ?? 0;
    if (attempt > current) maxAttemptByDept.set(r.department, attempt);
  }
  return responses.filter((r) => (r.attempt ?? 1) === maxAttemptByDept.get(r.department));
}

// Just the Tool-Map-aware opener now — manual-tasks / change-attitude /
// data-centralization moved to Open Discussion (see question-bank.ts).
const EXPECTED_RESPONSES_PER_DEPARTMENT = 1;

// How much of "full credit" each non-deep-dive source contributes at — e.g.
// 3 mapped tools, or 6 freeform-chat messages (3 exchanges), already counts
// as fully covering that source; more than that doesn't add further credit.
const TOOL_MAP_FULL_CREDIT = 3;
const FREEFORM_CHAT_FULL_CREDIT = 6;
const VISUAL_IDENTITY_FULL_CREDIT = 1;

/**
 * Data completeness across every source GapLens collects — not just the
 * structured deep-dive. A business with rich freeform-chat history and a
 * completed Visual Identity review, but only 2/5 deep-dive departments
 * answered, should read as meaningfully more complete than one with just
 * those 2 departments and nothing else.
 */
export function computeConfidence(params: {
  deepDiveResponses: DeepDiveResponseRow[];
  toolCount: number;
  freeformMessageCount: number;
  visualConsultationCount: number;
}) {
  // Business Context answers are real, useful data but not a department —
  // excluded here so they can't inflate "deep-dive completeness" or show up
  // as a phantom 6th covered area before any real department is touched.
  const responses = params.deepDiveResponses.filter(
    (r): r is DeepDiveResponseRow & { department: Department } => r.department !== "business_context",
  );
  const totalExpected = DEPARTMENTS.length * EXPECTED_RESPONSES_PER_DEPARTMENT;
  const deepDiveRatio = Math.min(1, responses.length / totalExpected);
  const toolMapRatio = Math.min(1, params.toolCount / TOOL_MAP_FULL_CREDIT);
  const freeformChatRatio = Math.min(1, params.freeformMessageCount / FREEFORM_CHAT_FULL_CREDIT);
  const visualIdentityRatio = Math.min(1, params.visualConsultationCount / VISUAL_IDENTITY_FULL_CREDIT);

  const completionRatio =
    deepDiveRatio * 0.4 + toolMapRatio * 0.2 + freeformChatRatio * 0.2 + visualIdentityRatio * 0.2;

  const coveredDepartments = Array.from(new Set(responses.map((r) => r.department)));

  return {
    overall: Math.round(completionRatio * 100),
    responsesCount: responses.length,
    areasCovered: coveredDepartments.length,
    completionRatio,
    // The deep-dive is now fully tap-to-answer (multiple-choice/slider), so
    // there's no meaningful "rushed" or "shallow" signal left to flag per
    // department — every recorded answer is a complete, deliberate pick.
    lowConfidenceDepartments: [] as Department[],
    coveredDepartments,
  };
}

export function bucketConfidence(overall: number): "low" | "medium" | "high" {
  if (overall < 45) return "low";
  if (overall < 75) return "medium";
  return "high";
}

export function computeDepartmentCoverage(
  responses: DeepDiveResponseRow[],
): { key: Department; pct: number }[] {
  return DEPARTMENTS.map((d) => {
    const count = responses.filter((r) => r.department === d.key).length;
    return { key: d.key, pct: Math.min(100, Math.round((count / EXPECTED_RESPONSES_PER_DEPARTMENT) * 100)) };
  });
}
