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
    <nav className="mx-auto grid w-full max-w-5xl grid-cols-2 items-center gap-y-4 px-6 py-6 sm:grid-cols-3">
      <Link
        href="/"
        className="col-start-1 row-start-1 flex items-center gap-2 text-lg font-extrabold text-ink"
      >
        <Image src="/gaplens-icon.png" alt="" width={28} height={28} className="h-7 w-7" />
        GapLens
      </Link>

      <div className="col-span-2 col-start-1 row-start-2 flex flex-wrap items-center justify-center gap-6 sm:col-span-1 sm:col-start-2 sm:row-start-1">
        {links.map((link) => {
          const isActive = active === link.key;
          return (
            <Link
              key={link.key}
              href={link.href}
              className="border-b-2 pb-0.5 text-sm font-bold transition-colors"
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

      <div className="col-start-2 row-start-1 flex items-center justify-end gap-3 sm:col-start-3">
        <LanguageToggle lang={lang} onToggle={toggle} />
        <Link href="/login" className="text-sm font-bold text-ink">
          {t.nav.login}
        </Link>
        <Link href="/signup" className="rounded-lg bg-teal-2 px-4 py-2 text-sm font-bold text-navy">
          {t.nav.signUp}
        </Link>
      </div>
    </nav>
  );
}
