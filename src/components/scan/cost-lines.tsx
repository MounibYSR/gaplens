import { computeSharpenFlags, type TeaserAnswers } from "@/lib/scan/scoring";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";

export function ScanCostLines({ answers, lang }: { answers: TeaserAnswers; lang: EntryLang }) {
  const t = appDictionary[lang].teaser;
  const sharpen = computeSharpenFlags(answers);

  return (
    <div className="glass-card mt-4 rounded-2xl p-6" style={{ borderColor: "var(--border-g)" }}>
      <h2 className="text-sm font-extrabold text-ink">{t.costsTitle}</h2>
      <ul className="mt-3 flex flex-col gap-3 text-sm text-muted">
        <li>{sharpen.money ? t.costMoneySharp : t.costMoneyBase}</li>
        <li>{sharpen.customers ? t.costCustomersSharp : t.costCustomersBase}</li>
        <li>{sharpen.time ? t.costTimeSharp : t.costTimeBase}</li>
      </ul>
      <p className="mt-4 text-sm text-ink">{t.closingLine}</p>
    </div>
  );
}
