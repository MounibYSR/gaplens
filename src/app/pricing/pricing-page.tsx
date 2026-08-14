"use client";

import Image from "next/image";
import Link from "next/link";
import { useEntryLang } from "@/hooks/use-entry-lang";
import { LanguageToggle } from "@/components/entry/language-toggle";

export function PricingPage() {
  const { lang, toggle, t } = useEntryLang();
  const p = t.pricing;

  return (
    <div className="flex flex-1 flex-col">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-ink">
          <Image src="/gaplens-icon.png" alt="" width={28} height={28} className="h-7 w-7" />
          GapLens
        </Link>
        <div className="flex items-center gap-3">
          <LanguageToggle lang={lang} onToggle={toggle} />
          <Link href="/login" className="text-sm font-bold text-ink">
            {t.nav.login}
          </Link>
          <Link href="/signup" className="rounded-lg bg-teal-2 px-4 py-2 text-sm font-bold text-navy">
            {t.nav.signUp}
          </Link>
        </div>
      </nav>

      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="mb-12 text-center">
          <span className="text-xs font-extrabold tracking-widest" style={{ color: "var(--gold)" }}>
            {p.badge}
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">
            {p.title} <span style={{ color: "var(--teal-2)" }}>{p.titleAccent}</span>
          </h1>
          <p className="mt-3 text-sm text-muted sm:text-base">{p.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
          {p.tiers.map((tier) => (
            <div
              key={tier.name}
              className="relative flex flex-col gap-5 rounded-2xl border p-6"
              style={{
                background: tier.recommended ? "var(--glass-2)" : "var(--glass)",
                borderColor: tier.recommended ? "var(--teal-2)" : "var(--border-g)",
                borderWidth: tier.recommended ? 2 : 1,
              }}
            >
              {tier.recommended && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-extrabold tracking-widest text-navy"
                  style={{ background: "var(--teal-2)" }}
                >
                  {p.recommendedBadge}
                </span>
              )}

              <div>
                <p className="text-xs font-extrabold tracking-widest text-muted">{tier.name}</p>
                <p className="ltr-num mt-2 text-3xl font-extrabold text-ink" dir="ltr">
                  {tier.price}
                  <span className="text-base font-bold text-muted">{tier.period}</span>
                </p>
              </div>

              <ul className="flex flex-1 flex-col gap-2.5 text-sm text-ink">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0" style={{ color: "var(--teal-2)" }}>
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={tier.href}
                className="block w-full rounded-lg py-2.5 text-center text-sm font-bold"
                style={
                  tier.recommended
                    ? { background: "var(--teal-2)", color: "var(--navy)" }
                    : { border: `1px solid var(--border-g)`, color: "var(--ink)" }
                }
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-extrabold text-ink">{p.comparisonTitle}</h2>
            <p className="mt-1 text-sm text-muted">{p.comparisonSubtitle}</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--border-g)" }}>
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr style={{ background: "var(--glass-2)" }}>
                  <th className="px-4 py-3 text-start text-xs font-extrabold tracking-widest text-muted">
                    {p.comparisonHeaders.feature}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-extrabold tracking-widest text-muted">
                    {p.comparisonHeaders.free}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-extrabold tracking-widest" style={{ color: "var(--teal-2)" }}>
                    {p.comparisonHeaders.growth}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-extrabold tracking-widest text-muted">
                    {p.comparisonHeaders.gapfix}
                  </th>
                </tr>
              </thead>
              <tbody>
                {p.comparisonRows.map((row, i) => (
                  <tr key={row.label} style={{ background: i % 2 === 0 ? "transparent" : "var(--glass)" }}>
                    <td className="px-4 py-3 font-bold text-ink">{row.label}</td>
                    <td className="px-4 py-3 text-muted">{row.free}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: "var(--teal-2)" }}>
                      {row.growth}
                    </td>
                    <td className="px-4 py-3 text-muted">{row.gapfix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-muted">{t.footer}</footer>
    </div>
  );
}
