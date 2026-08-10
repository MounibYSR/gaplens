import { cookies } from "next/headers";
import type { EntryLang } from "./entry-dictionary";

export async function getSessionLang(): Promise<EntryLang> {
  const cookieStore = await cookies();
  const value = cookieStore.get("gl_lang")?.value;
  return value === "ar" ? "ar" : "en";
}
