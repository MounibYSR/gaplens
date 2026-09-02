import { CONFIDENT_TONE_DIRECTIVE } from "@/lib/ai/tone";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";

export type VisualSourceTag = "website" | "instagram" | "logo" | "other";

function languageName(lang: EntryLang): string {
  return lang === "ar" ? "Modern Standard Arabic (الفصحى)" : "English";
}

const CHANNEL_LABEL: Record<VisualSourceTag, string> = {
  website: "website",
  instagram: "Instagram",
  logo: "logo",
  other: "brand material",
};

const CHANNEL_FOCUS: Record<VisualSourceTag, string> = {
  website:
    "navigation clarity, visual hierarchy, call-to-action placement and effectiveness, mobile-responsiveness cues visible in the screenshot, and overall trust/credibility signals (contact info, reviews, professional polish)",
  instagram:
    "visual consistency and branding, caption and content quality signals, posting-cadence patterns if visible in the grid, and engagement-oriented recommendations (specific content pillars worth trying, formats worth testing, profile/bio optimization)",
  logo: "clarity and legibility at different sizes, consistency of usage (color variants, spacing, obvious don't-do violations if visible), file/image quality, whether multiple inconsistent versions of the logo are evident, and overall appropriateness for the brand",
  other:
    "overall visual consistency with the business's apparent brand (colors, typography, tone), professionalism and production quality, and clarity of the material's purpose",
};

const SINGLE_CHANNEL_OUTPUT_RULES = `Report findings as structured gaps, one per distinct issue — only issues you can actually see evidence of, never invented; if there is genuinely nothing wrong, return an empty gaps array rather than manufacturing a problem. category is always exactly "Visual Identity". sub_category is always "single_channel" for this review. gapfix_path is "diy" for something the owner can fix themselves quickly, "vetted_provider" for something needing a designer/developer, "gaplens_executes" only for a narrow, well-defined change GapLens could realistically implement directly. status is always "open". Order by priority, most urgent first.`;

/** Layer 1 — one focused call per present channel (website / instagram / logo / other). */
export function buildChannelSystemPrompt(source: VisualSourceTag, companyName: string, lang: EntryLang): string {
  return `${CONFIDENT_TONE_DIRECTIVE}

You are a senior brand and digital-presence consultant reviewing ${CHANNEL_LABEL[source]} image(s) for "${companyName}", a Qatar/GCC SME. Give a confident, specific, actionable review covering: ${CHANNEL_FOCUS[source]}.

${SINGLE_CHANNEL_OUTPUT_RULES}

Respond in ${languageName(lang)}.`;
}

const CROSS_CHANNEL_OUTPUT_RULES = `Report findings as structured gaps. category is always exactly "Visual Identity" and sub_category is always "cross_channel" for every gap here. Only report a mismatch you can actually see evidence of across the images — name the specific channels involved and the specific mismatch (e.g. "the logo shown on the website differs from the one used on Instagram" or "the color palette on Instagram doesn't match the website's primary colors"), never a generic statement like "ensure consistency across channels". If everything you can see is genuinely well-aligned, return an empty gaps array rather than inventing a mismatch — a clean cross-channel comparison is a valid, common outcome. gapfix_path is "diy" if the owner can reconcile it themselves (e.g. re-uploading the correct logo file), "vetted_provider" if it needs a designer to establish real brand guidelines, "gaplens_executes" only for a narrow, well-defined fix. status is always "open".`;

/** Layer 2 — a single comparison call across every present channel, run only when 2+ channels are present. */
export function buildCrossChannelSystemPrompt(
  companyName: string,
  presentChannels: VisualSourceTag[],
  lang: EntryLang,
): string {
  const channelList = presentChannels.map((c) => CHANNEL_LABEL[c]).join(", ");
  return `${CONFIDENT_TONE_DIRECTIVE}

You are a senior brand consultant comparing "${companyName}"'s visual presence across multiple channels: ${channelList}. The images below are each labeled with their channel. Compare them specifically for: color palette matching, logo version/usage consistency, tone/messaging alignment, and overall brand cohesion across channels.

${CROSS_CHANNEL_OUTPUT_RULES}

Respond in ${languageName(lang)}.`;
}
