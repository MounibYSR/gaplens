import type { RoadmapGap } from "@/lib/roadmap/build-prompt";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";

export type Topic = { label: string; message: string };

const GENERIC_EN: Topic[] = [
  { label: "Prioritize first", message: "What should I prioritize first?" },
  { label: "Quick wins", message: "Show me quick wins I could tackle now" },
];
const GENERIC_AR: Topic[] = [
  { label: "أولويتك الأولى", message: "ما الأولوية التي يجب أن أبدأ بها؟" },
  { label: "مكاسب سريعة", message: "أرني مكاسب سريعة يمكنني البدء بها الآن" },
];

/**
 * Builds a rotating set of topic chips derived from the company's real,
 * currently-open roadmap gaps (not a static list) — one chip per open gap,
 * plus a couple of general strategy prompts. `offset` rotates the window so
 * chips refresh as the conversation progresses instead of staying static.
 *
 * `label` is a short, scannable chip caption; `message` is the full-context
 * sentence actually sent to the AI when the chip is tapped.
 */
export function suggestedTopics(
  gaps: RoadmapGap[],
  lang: EntryLang,
  offset: number,
  count = 3,
): Topic[] {
  const openGaps = gaps.filter((g) => g.status !== "resolved");
  const dynamic = openGaps.map((g) => ({
    label: g.gap_title,
    message:
      lang === "ar"
        ? `اسألني عن فجوة ${g.category}: ${g.gap_title}`
        : `Ask about your ${g.category} gap: ${g.gap_title}`,
  }));
  const generic = lang === "ar" ? GENERIC_AR : GENERIC_EN;
  const pool = [...dynamic, ...generic];
  if (pool.length === 0) return [];

  const start = offset % pool.length;
  const rotated = [...pool.slice(start), ...pool.slice(0, start)];
  return rotated.slice(0, count);
}
