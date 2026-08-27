import type { RoadmapGap } from "@/lib/roadmap/build-prompt";
import type { GapFixPath, GapStatus } from "@/lib/supabase/types";

/** Manual status/gapfix-path overrides win over whatever the AI last generated for that gap. */
export function mergeGapOverrides(
  gaps: RoadmapGap[],
  overrides: { gap_title: string; status: GapStatus; gapfix_path?: GapFixPath | null }[],
): RoadmapGap[] {
  const overrideByTitle = new Map(overrides.map((o) => [o.gap_title, o]));
  return gaps.map((gap) => {
    const override = overrideByTitle.get(gap.gap_title);
    if (!override) return gap;
    return {
      ...gap,
      status: override.status,
      gapfix_path: override.gapfix_path ?? gap.gapfix_path,
    };
  });
}

export function computeGapTrend(gaps: RoadmapGap[]) {
  const total = gaps.length;
  const resolved = gaps.filter((g) => g.status === "resolved").length;
  const open = gaps.filter((g) => g.status === "open").length;
  const healthScore = total > 0 ? Math.round((resolved / total) * 100) : 0;
  return { total, resolved, open, healthScore };
}
