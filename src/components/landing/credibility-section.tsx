import { entryDictionary, type EntryLang } from "@/lib/i18n/entry-dictionary";

function LogoSlot({ label }: { label: string }) {
  return (
    <div
      className="flex h-16 w-32 items-center justify-center rounded-xl border border-dashed text-sm font-extrabold tracking-widest text-muted"
      style={{ borderColor: "var(--border-g)", background: "var(--glass)" }}
    >
      {label}
    </div>
  );
}

export function CredibilitySection({ lang }: { lang: EntryLang }) {
  const t = entryDictionary[lang].credibility;

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-10">
      <div
        className="glass-card flex flex-col items-center gap-5 rounded-2xl px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-start"
        style={{ borderColor: "var(--border-g)" }}
      >
        <div className="flex-1">
          <span className="text-xs font-extrabold tracking-widest" style={{ color: "var(--gold)" }}>
            {t.badge}
          </span>
          <h2 className="mt-1 text-lg font-extrabold text-ink">{t.title}</h2>
          <p className="mt-1.5 max-w-md text-sm text-muted">{t.body}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <LogoSlot label={t.dicLabel} />
          <LogoSlot label={t.mcitLabel} />
        </div>
      </div>
    </section>
  );
}
