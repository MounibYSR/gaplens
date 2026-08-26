import { entryDictionary, type EntryLang } from "@/lib/i18n/entry-dictionary";

const PLACEHOLDER_COUNT = 6;

function LogoPlaceholder({ index }: { index: number }) {
  return (
    <div
      className="flex h-10 w-24 shrink-0 items-center justify-center rounded-lg border text-xs font-bold tracking-widest text-muted opacity-70"
      style={{ borderColor: "var(--border-g)", background: "var(--glass)" }}
    >
      LOGO {index}
    </div>
  );
}

export function CompanyLogosStrip({ lang }: { lang: EntryLang }) {
  const t = entryDictionary[lang].companies;

  return (
    <section className="mx-auto w-full max-w-3xl px-6 pb-6">
      <p className="mb-4 text-center text-xs font-bold tracking-widest text-muted">{t.badge}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
          <LogoPlaceholder key={i} index={i + 1} />
        ))}
      </div>
    </section>
  );
}
