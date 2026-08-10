import type { RoadmapGap } from "@/lib/roadmap/build-prompt";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";

const GENERIC_EN = ["What should I prioritize first?", "Show me quick wins I could tackle now"];
const GENERIC_AR = ["وش الأولوية اللي أبدأ فيها؟", "وريني مكاسب سريعة أقدر أبدأ فيها الحين"];

/**
 * Builds a rotating set of topic chips derived from the company's real,
 * currently-open roadmap gaps (not a static list) — one chip per open gap,
 * plus a couple of general strategy prompts. `offset` rotates the window so
 * chips refresh as the conversation progresses instead of staying static.
 */
export function suggestedTopics(
  gaps: RoadmapGap[],
  lang: EntryLang,
  offset: number,
  count = 3,
): string[] {
  const openGaps = gaps.filter((g) => g.status !== "resolved");
  const dynamic = openGaps.map((g) =>
    lang === "ar"
      ? `اسأليني عن فجوة ${g.category}: ${g.gap_title}`
      : `Ask about your ${g.category} gap: ${g.gap_title}`,
  );
  const generic = lang === "ar" ? GENERIC_AR : GENERIC_EN;
  const pool = [...dynamic, ...generic];
  if (pool.length === 0) return [];

  const start = offset % pool.length;
  const rotated = [...pool.slice(start), ...pool.slice(0, start)];
  return rotated.slice(0, count);
}
