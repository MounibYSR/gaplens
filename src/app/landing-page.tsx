"use client";

import Image from "next/image";
import Link from "next/link";
import { useEntryLang } from "@/hooks/use-entry-lang";
import { LanguageToggle } from "@/components/entry/language-toggle";
import { ParticleExplainer } from "@/components/landing/particle-explainer";
import { CredibilitySection } from "@/components/landing/credibility-section";
import { CompanyLogosStrip } from "@/components/landing/company-logos-strip";

export function LandingPage() {
  const { lang, toggle, t } = useEntryLang();

  return (
    <div className="flex flex-1 flex-col">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-lg font-extrabold text-ink">
          <Image src="/gaplens-icon.png" alt="" width={28} height={28} className="h-7 w-7" />
          GapLens
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle lang={lang} onToggle={toggle} />
          <Link href="/pricing" className="text-sm font-bold text-ink">
            {t.nav.pricing}
          </Link>
          <Link href="/login" className="text-sm font-bold text-ink">
            {t.nav.login}
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-teal-2 px-4 py-2 text-sm font-bold text-navy"
          >
            {t.nav.signUp}
          </Link>
        </div>
      </nav>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <span
          className="ltr-num mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs text-muted"
          style={{ borderColor: "var(--border-g)" }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ background: "var(--healthy)" }}
          />
          {t.hero.badge}
        </span>

        <h1 className="text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
          {t.hero.titleLine1}
          <br />
          <span style={{ color: "var(--teal-2)" }}>{t.hero.titleLine2}</span>
        </h1>

        <p className="mt-6 max-w-xl text-base text-muted sm:text-lg">
          {t.hero.subtitle}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-teal-2 px-6 py-3 font-bold text-navy"
          >
            {t.hero.ctaPrimary}
          </Link>
          <a
            href="#how"
            className="rounded-lg border px-6 py-3 font-bold text-ink"
            style={{ borderColor: "var(--border-g)" }}
          >
            {t.hero.ctaSecondary}
          </a>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {t.hero.trust.map((chip) => (
            <span
              key={chip}
              className="rounded-full border px-3 py-1.5 text-xs text-muted"
              style={{ background: "var(--glass)", borderColor: "var(--border-g)" }}
            >
              {chip}
            </span>
          ))}
        </div>
      </section>

      <CredibilitySection lang={lang} />
      <CompanyLogosStrip lang={lang} />

      <section id="how" className="mx-auto w-full max-w-5xl px-6 py-20">
        <div className="mb-12 text-center">
          <span
            className="text-xs font-bold tracking-widest"
            style={{ color: "var(--teal-2)" }}
          >
            {t.how.badge}
          </span>
          <h2 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">
            {t.how.title}
          </h2>
          <p className="mt-2 text-sm text-muted">{t.how.subtitle}</p>
        </div>

        <ParticleExplainer lang={lang} />
      </section>

      <footer className="py-8 text-center text-xs text-muted">{t.footer}</footer>
    </div>
  );
}
