import { CONFIDENT_TONE_DIRECTIVE } from "@/lib/ai/tone";
import type { RoadmapGap } from "@/lib/roadmap/build-prompt";
import type { CompanyTool } from "@/app/dashboard/tool-map-actions";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";

export type DiyGuideStep = { step_number: number; instruction: string };
export type DiyGuide = { steps: DiyGuideStep[]; confirmation_check: string };

export const DIY_GUIDE_SCHEMA = {
  type: "object",
  properties: {
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          step_number: { type: "integer" },
          instruction: { type: "string" },
        },
        required: ["step_number", "instruction"],
        additionalProperties: false,
      },
    },
    confirmation_check: { type: "string" },
  },
  required: ["steps", "confirmation_check"],
  additionalProperties: false,
} as const;

function languageName(lang: EntryLang): string {
  return lang === "ar" ? "Modern Standard Arabic (الفصحى)" : "English";
}

function formatToolContext(tools: CompanyTool[]): string {
  if (tools.length === 0) {
    return "No specific tools are on record for this business — write generic but still concrete steps (describe common menu/setting patterns rather than naming a specific product) since you cannot reference a real tool by name.";
  }
  const lines = tools.map((t) => `- ${t.name}`).join("\n");
  return `The business's real tools on record — reference these by their exact name wherever the fix involves one of them, instead of a generic placeholder like "your email tool":\n${lines}`;
}

/**
 * `impact` + `recommended_fix` are the only gap fields the guide actually
 * depends on — this doubles as the cache-invalidation key the caller
 * compares against a stored guide (see getOrGenerateDiyGuide).
 */
export function buildDiyGuidePrompt(gap: RoadmapGap, tools: CompanyTool[], lang: EntryLang): string {
  const toolContext = formatToolContext(tools);

  return `${CONFIDENT_TONE_DIRECTIVE}

You are writing a step-by-step "do it yourself" implementation guide for a small business owner with NO technical background whatsoever — they may never have changed a software setting before. The guide is for closing this specific gap:

Gap: "${gap.gap_title}" (category: ${gap.category})
Why it matters: ${gap.impact}
Recommended fix: ${gap.recommended_fix}

${toolContext}

Write the guide as a numbered sequence of steps a complete beginner can follow without help:
- Use plain, everyday language — no jargon. Say "click the button that looks like a gear icon" instead of "access settings", "the three dots menu" instead of "the overflow menu".
- Break any action with more than one part into separate, smaller steps rather than packing several actions into a single dense step.
- When a step involves one of the tools listed above, name the exact menu, button, or setting to look for in that specific tool (e.g. "In Shopify, go to Settings, then tap Notifications") instead of a vague instruction.
- Never write "consult an expert", "you may want to hire someone", or any similar hedge — this guide assumes the owner is doing this themselves, right now.
- Do not include the confirmation check as one of the numbered steps — it goes in its own confirmation_check field: a short, concrete way to know the fix actually worked (what they should see, click, or check).

Respond in ${languageName(lang)} only, matching the required schema exactly.`;
}
