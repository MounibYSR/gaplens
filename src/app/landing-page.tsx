"use client";

import Link from "next/link";
import { useEntryLang } from "@/hooks/use-entry-lang";
import { SiteNav } from "@/components/entry/site-nav";
import { ParticleExplainer } from "@/components/landing/particle-explainer";
import { CompanyLogosStrip } from "@/components/landing/company-logos-strip";

export function LandingPage() {
  const { lang, toggle, t } = useEntryLang();

  return (
    <div className="flex flex-1 flex-col">
      <SiteNav lang={lang} toggle={toggle} t={t} />

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <span
          className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold"
          style={{ borderColor: "var(--gold)", background: "rgba(232, 160, 32, 0.1)", color: "var(--gold)" }}
        >
          {t.hero.badge}
        </span>

        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
          {(() => {
            const idx = t.hero.title.indexOf(t.hero.titleEmphasis);
            if (idx === -1) return t.hero.title;
            const before = t.hero.title.slice(0, idx);
            const after = t.hero.title.slice(idx + t.hero.titleEmphasis.length);
            return (
              <>
                {before}
                <span className="grad-text">{t.hero.titleEmphasis}</span>
                {after}
              </>
            );
          })()}
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
