import { entryDictionary, type EntryLang } from "@/lib/i18n/entry-dictionary";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TeamSection({ lang }: { lang: EntryLang }) {
  const t = entryDictionary[lang].about;

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-14 text-center">
      <span className="text-xs font-extrabold tracking-widest" style={{ color: "var(--gold)" }}>
        {t.badge}
      </span>
      <h2 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">{t.title}</h2>
      <p className="mx-auto mt-2 mb-8 max-w-xl text-sm text-muted">{t.subtitle}</p>

      <div className="flex flex-wrap justify-center gap-5">
        {t.team.map((member) => (
          <div
            key={member.name}
            className="glass-card flex w-56 flex-col items-center gap-3 rounded-2xl p-6 text-center"
            style={{ borderColor: "var(--border-g)" }}
          >
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-extrabold"
              style={{ background: "var(--glass-2)", color: "var(--teal-2)" }}
            >
              {initials(member.name)}
            </span>
            <div>
              <p className="text-sm font-extrabold text-ink">{member.name}</p>
              <p className="mt-0.5 text-xs font-bold" style={{ color: "var(--gold)" }}>
                {member.role}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
