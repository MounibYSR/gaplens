import { cookies } from "next/headers";

export type Theme = "light" | "dark";

export async function getSessionTheme(): Promise<Theme> {
  const cookieStore = await cookies();
  return cookieStore.get("gl_theme")?.value === "light" ? "light" : "dark";
}
