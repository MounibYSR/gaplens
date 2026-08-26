"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LanguageToggle } from "@/components/entry/language-toggle";
import { ConstellationIcon } from "@/components/ui/constellation-icon";
import type { entryDictionary, EntryLang } from "@/lib/i18n/entry-dictionary";

type NavKey = "about" | "pricing";

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function SiteNav({
  lang,
  toggle,
  t,
  active,
}: {
  lang: EntryLang;
  toggle: () => void;
  t: (typeof entryDictionary)[EntryLang];
  active?: NavKey;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links: { key: NavKey; href: string; label: string }[] = [
    { key: "about", href: "/about", label: t.nav.about },
    { key: "pricing", href: "/pricing", label: t.nav.pricing },
  ];

  return (
    <nav className="mx-auto w-full max-w-5xl px-6 py-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-ink">
            <Image src="/gaplens-icon.png" alt="" width={28} height={28} className="h-7 w-7" />
            GapLens
          </Link>
          <span
            className="hidden shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-xs font-bold md:flex"
            style={{ borderColor: "var(--teal-2)", color: "var(--teal-2)", background: "rgba(21, 201, 154, 0.1)" }}
          >
            <ConstellationIcon size={10} />
            {t.nav.aiPowered}
          </span>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => {
            const isActive = active === link.key;
            return (
              <Link
                key={link.key}
                href={link.href}
                className="border-b-2 pb-1 text-sm font-bold transition-colors"
                style={{
                  color: isActive ? "var(--teal-2)" : "var(--ink)",
                  borderColor: isActive ? "var(--teal-2)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageToggle lang={lang} onToggle={toggle} />
          <Link href="/login" className="text-sm font-bold text-ink">
            {t.nav.login}
          </Link>
          <Link href="/signup" className="rounded-lg bg-teal-2 px-4 py-2 text-sm font-bold text-navy">
            {t.nav.signUp}
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Link href="/signup" className="rounded-lg bg-teal-2 px-3 py-2 text-xs font-bold text-navy">
            {t.nav.signUp}
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-ink"
            style={{ borderColor: "var(--border-g)" }}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="mt-4 flex flex-col gap-1 rounded-xl border p-3 md:hidden"
          style={{ borderColor: "var(--border-g)", background: "var(--modal-bg)" }}
        >
          {links.map((link) => {
            const isActive = active === link.key;
            return (
              <Link
                key={link.key}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-bold"
                style={{ color: isActive ? "var(--teal-2)" : "var(--ink)" }}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg px-3 py-3 text-sm font-bold text-ink"
          >
            {t.nav.login}
          </Link>

          <div className="mt-1 flex items-center justify-between border-t px-3 pt-3" style={{ borderColor: "var(--border-g)" }}>
            <span
              className="flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-xs font-bold"
              style={{ borderColor: "var(--teal-2)", color: "var(--teal-2)", background: "rgba(21, 201, 154, 0.1)" }}
            >
              <ConstellationIcon size={10} />
              {t.nav.aiPowered}
            </span>
            <LanguageToggle lang={lang} onToggle={toggle} />
          </div>
        </div>
      )}
    </nav>
  );
}
