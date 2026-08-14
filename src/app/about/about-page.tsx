"use client";

import { useEntryLang } from "@/hooks/use-entry-lang";
import { SiteNav } from "@/components/entry/site-nav";
import { CredibilitySection } from "@/components/landing/credibility-section";
import { TeamSection } from "@/components/landing/team-section";

export function AboutPage() {
  const { lang, toggle, t } = useEntryLang();
  const a = t.about;

  return (
    <div className="flex flex-1 flex-col">
      <SiteNav lang={lang} toggle={toggle} t={t} active="about" />

      <section className="mx-auto w-full max-w-3xl px-6 pt-10 pb-4 text-center">
        <span className="text-xs font-extrabold tracking-widest" style={{ color: "var(--gold)" }}>
          {a.badge}
        </span>
        <h1 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">{a.title}</h1>
        <p className="mt-3 text-sm text-muted sm:text-base">{a.subtitle}</p>
      </section>

      <CredibilitySection lang={lang} />
      <TeamSection lang={lang} />

      <footer className="py-8 text-center text-xs text-muted">{t.footer}</footer>
    </div>
  );
}
