import type { Metadata } from "next";
import { Cairo, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { getSessionLang } from "@/lib/i18n/get-lang";
import { AmbientBackground } from "@/components/ambient/ambient-background";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "GapLens",
  description: "AI-powered digital gap diagnosis for Qatar/GCC SMEs",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getSessionLang();

  return (
    <html
      lang={lang}
      dir={lang === "ar" ? "rtl" : "ltr"}
      className={`${cairo.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-navy text-ink">
        <AmbientBackground />
        {children}
      </body>
    </html>
  );
}
