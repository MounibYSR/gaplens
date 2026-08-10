"use client";

import type { EntryLang } from "@/lib/i18n/entry-dictionary";

export function LanguageToggle({
  lang,
  onToggle,
}: {
  lang: EntryLang;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      suppressHydrationWarning
      className="rounded-full border px-3 py-1.5 text-xs font-bold text-ink"
      style={{ borderColor: "var(--border-g)" }}
    >
      {lang === "en" ? "عربي" : "EN"}
    </button>
  );
}
