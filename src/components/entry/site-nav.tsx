import Image from "next/image";
import Link from "next/link";
import { LanguageToggle } from "@/components/entry/language-toggle";
import type { entryDictionary, EntryLang } from "@/lib/i18n/entry-dictionary";

type NavKey = "about" | "pricing";

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
  const links: { key: NavKey; href: string; label: string }[] = [
    { key: "about", href: "/about", label: t.nav.about },
    { key: "pricing", href: "/pricing", label: t.nav.pricing },
  ];

  return (
    <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-y-3 px-6 py-6">
      <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-ink">
        <Image src="/gaplens-icon.png" alt="" width={28} height={28} className="h-7 w-7" />
        GapLens
      </Link>

      <div className="flex flex-wrap items-center gap-5">
        {links.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            className="text-sm font-bold transition-colors"
            style={{ color: active === link.key ? "var(--teal-2)" : "var(--ink)" }}
          >
            {link.label}
          </Link>
        ))}

        <span className="hidden h-4 w-px sm:block" style={{ background: "var(--border-g)" }} />

        <div className="flex items-center gap-3">
          <LanguageToggle lang={lang} onToggle={toggle} />
          <Link href="/login" className="text-sm font-bold text-ink">
            {t.nav.login}
          </Link>
          <Link href="/signup" className="rounded-lg bg-teal-2 px-4 py-2 text-sm font-bold text-navy">
            {t.nav.signUp}
          </Link>
        </div>
      </div>
    </nav>
  );
}
