"use client";

import { useEntryLang } from "@/hooks/use-entry-lang";
import { useEntryTheme } from "@/hooks/use-entry-theme";
import { SiteNav } from "@/components/entry/site-nav";
import { CredibilitySection } from "@/components/landing/credibility-section";
import { TeamSection } from "@/components/landing/team-section";

export function AboutPage() {
  const { lang, toggle, t } = useEntryLang();
  const { theme, toggle: toggleTheme } = useEntryTheme();

  return (
    <div className="flex flex-1 flex-col">
      <SiteNav lang={lang} toggle={toggle} theme={theme} onToggleTheme={toggleTheme} t={t} active="about" />

      <div className="pt-6" />
      <CredibilitySection lang={lang} />
      <TeamSection lang={lang} />

      <footer className="py-8 text-center text-xs text-muted">{t.footer}</footer>
    </div>
  );
}
