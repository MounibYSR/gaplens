import { DEPARTMENTS } from "@/lib/assessment/departments";
import type { Department } from "@/lib/supabase/types";

export type DeepDiveResponseRow = {
  department: Department;
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
 * attempts stay in the database purely for history/comparison.
 */
export function filterToLatestAttempt<T extends { department: Department; attempt?: number }>(
  responses: T[],
): T[] {
  const maxAttemptByDept = new Map<Department, number>();
  for (const r of responses) {
    const attempt = r.attempt ?? 1;
    const current = maxAttemptByDept.get(r.department) ?? 0;
    if (attempt > current) maxAttemptByDept.set(r.department, attempt);
  }
  return responses.filter((r) => (r.attempt ?? 1) === maxAttemptByDept.get(r.department));
}

const EXPECTED_RESPONSES_PER_DEPARTMENT = 2; // opening + one follow-up
const RUSHED_SECONDS = 3;
const QUICK_SECONDS = 8;

function timeScore(startedAt: string, answeredAt: string) {
  const elapsedSec = (new Date(answeredAt).getTime() - new Date(startedAt).getTime()) / 1000;
  if (elapsedSec < RUSHED_SECONDS) return 20;
  if (elapsedSec < QUICK_SECONDS) return 60;
  return 100;
}

function depthScore(responseLength: number) {
  if (responseLength >= 60) return 100;
  if (responseLength >= 30) return 70;
  if (responseLength >= 15) return 40;
  return 10;
}

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
  const responses = params.deepDiveResponses;
  const totalExpected = DEPARTMENTS.length * EXPECTED_RESPONSES_PER_DEPARTMENT;
  const deepDiveRatio = Math.min(1, responses.length / totalExpected);
  const toolMapRatio = Math.min(1, params.toolCount / TOOL_MAP_FULL_CREDIT);
  const freeformChatRatio = Math.min(1, params.freeformMessageCount / FREEFORM_CHAT_FULL_CREDIT);
  const visualIdentityRatio = Math.min(1, params.visualConsultationCount / VISUAL_IDENTITY_FULL_CREDIT);

  const completionRatio =
    deepDiveRatio * 0.4 + toolMapRatio * 0.2 + freeformChatRatio * 0.2 + visualIdentityRatio * 0.2;

  const lowConfidenceDepartments = new Set<Department>();
  let engagementSum = 0;
  let depthSum = 0;

  for (const r of responses) {
    const tScore = timeScore(r.started_at, r.answered_at);
    const dScore = depthScore(r.response_length);
    engagementSum += tScore;
    depthSum += dScore;
    if ((tScore + dScore) / 2 < 50) lowConfidenceDepartments.add(r.department);
  }

  const engagementAvg = responses.length ? engagementSum / responses.length : 100;
  const depthAvg = responses.length ? depthSum / responses.length : 0;

  const overall = Math.round(
    completionRatio * 100 * 0.4 + engagementAvg * 0.3 + depthAvg * 0.3,
  );

  const coveredDepartments = Array.from(new Set(responses.map((r) => r.department)));

  return {
    overall,
    responsesCount: responses.length,
    areasCovered: coveredDepartments.length,
    completionRatio,
    lowConfidenceDepartments: Array.from(lowConfidenceDepartments),
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
