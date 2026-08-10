/**
 * Structured-output schema for the Visual Identity module — separate from
 * the main roadmap's GAP_SCHEMA (build-prompt.ts) because category is fixed
 * to "Visual Identity" (not one of the 5 department names) and every gap
 * also carries sub_category, which the main roadmap schema has no use for.
 */
export const VISUAL_IDENTITY_GAP_SCHEMA = {
  type: "object",
  properties: {
    gap_title: { type: "string" },
    category: { type: "string", enum: ["Visual Identity"] },
    sub_category: { type: "string", enum: ["single_channel", "cross_channel"] },
    priority: { type: "string", enum: ["high", "medium", "low"] },
    impact: { type: "string" },
    effort: { type: "string", enum: ["low", "medium", "high"] },
    recommended_fix: { type: "string" },
    gapfix_path: { type: "string", enum: ["diy", "vetted_provider", "gaplens_executes"] },
    status: { type: "string", enum: ["open", "in_progress", "resolved"] },
  },
  required: [
    "gap_title",
    "category",
    "sub_category",
    "priority",
    "impact",
    "effort",
    "recommended_fix",
    "gapfix_path",
    "status",
  ],
  additionalProperties: false,
} as const;

export const VISUAL_IDENTITY_GAPS_ARRAY_SCHEMA = {
  type: "object",
  properties: {
    gaps: { type: "array", items: VISUAL_IDENTITY_GAP_SCHEMA },
  },
  required: ["gaps"],
  additionalProperties: false,
} as const;
