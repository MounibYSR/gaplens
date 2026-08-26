import { entryDictionary, type EntryLang } from "@/lib/i18n/entry-dictionary";
import { CohortIcon, MinistryIcon, LocationIcon, LockIcon, DocumentIcon, IconBadge } from "@/components/ui/stat-icons";

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

const CARD_ICONS = [CohortIcon, MinistryIcon, LocationIcon, LockIcon];

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
              className="glass-card flex items-start gap-3 rounded-2xl p-4"
              style={{ borderColor: "var(--border-g)" }}
            >
              <IconBadge icon={<Icon />} sizeClass="h-9 w-9" />
              <div>
                <p className="text-sm font-extrabold text-ink">{card.title}</p>
                <p className="mt-1 text-xs text-muted">{card.body}</p>
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
        <span className="shrink-0 rounded-full px-3 py-1 text-xs font-extrabold tracking-widest text-muted" style={{ background: "var(--glass-2)" }}>
          {t.letterNote}
        </span>
      </div>
    </section>
  );
}
