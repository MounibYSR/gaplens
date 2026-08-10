"use client";

import { useEffect, useState } from "react";
import { entryDictionary, type EntryLang } from "@/lib/i18n/entry-dictionary";

const STORAGE_KEY = "gl_entry_lang";
const COOKIE_KEY = "gl_lang";

function readStoredLang(): EntryLang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "ar" ? "ar" : "en";
}

export function useEntryLang() {
  const [lang, setLang] = useState<EntryLang>(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.cookie = `${COOKIE_KEY}=${lang}; path=/; max-age=31536000`;
  }, [lang]);

  const toggle = () => setLang((l) => (l === "en" ? "ar" : "en"));

  return { lang, toggle, t: entryDictionary[lang] };
}
