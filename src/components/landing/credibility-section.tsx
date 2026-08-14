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

function CohortIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
    </svg>
  );
}

function MinistryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 3 7v2h18V7l-9-5Z" />
      <path d="M5 10v9M9 10v9M15 10v9M19 10v9M3 21h18" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

const CARD_ICONS = [CohortIcon, MinistryIcon, LocationIcon, LockIcon];

function DocumentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

export function CredibilitySection({ lang }: { lang: EntryLang }) {
  const t = entryDictionary[lang].credibility;

  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-14">
      <div className="mb-8 text-center">
        <span className="text-xs font-extrabold tracking-widest" style={{ color: "var(--gold)" }}>
          {t.badge}
        </span>
        <h2 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">{t.title}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{t.body}</p>
      </div>

      <div className="mb-6 flex items-center justify-center gap-3">
        <LogoSlot label={t.dicLabel} />
        <LogoSlot label={t.mcitLabel} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {t.cards.map((card, i) => {
          const Icon = CARD_ICONS[i];
          return (
            <div
              key={card.title}
              className="glass-card flex items-start gap-3 rounded-xl p-4"
              style={{ borderColor: "var(--border-g)" }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "var(--glass-2)", color: "var(--teal-2)" }}
              >
                <Icon />
              </span>
              <div>
                <p className="text-sm font-extrabold text-ink">{card.title}</p>
                <p className="mt-0.5 text-xs text-muted">{card.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3"
        style={{ borderColor: "var(--border-g)", background: "var(--glass)" }}
      >
        <span className="flex items-center gap-2 text-sm font-bold text-muted">
          <DocumentIcon />
          {t.letterCta}
        </span>
        <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-widest text-muted" style={{ background: "var(--glass-2)" }}>
          {t.letterNote}
        </span>
      </div>
    </section>
  );
}
