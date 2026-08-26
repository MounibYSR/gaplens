"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { GapBadge } from "@/components/assessment/gap-badge";
import { Typewriter } from "@/components/assessment/typewriter";
import { ConsoleLabel } from "@/components/ui/console-label";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import { chooseResolutionPath } from "./actions";
import type { ResolutionPath } from "@/lib/supabase/types";

export function AdvisorPanel({
  sessionId,
  gapTitle,
  gap,
  insight,
  alreadyChosen,
  lang,
  embedded = false,
}: {
  sessionId: string;
  gapTitle: string;
  gap: number;
  insight: string;
  alreadyChosen: ResolutionPath | null;
  lang: EntryLang;
  embedded?: boolean;
}) {
  const t = appDictionary[lang].advisor;
  const PATHS: { path: ResolutionPath; label: string; color: string }[] = [
    { path: "diy", label: t.diy, color: "var(--diy)" },
    { path: "refer", label: t.refer, color: "var(--refer)" },
    { path: "auto", label: t.auto, color: "var(--auto)" },
  ];

  const [chosen, setChosen] = useState<ResolutionPath | null>(alreadyChosen);
  const [showStub, setShowStub] = useState(false);
  const [isPending, startTransition] = useTransition();

  function pick(path: ResolutionPath) {
    setChosen(path);
    startTransition(async () => {
      await chooseResolutionPath(sessionId, gapTitle, path);
    });
  }

  return (
    <div
      className="w-full max-w-md rounded-2xl border p-8"
      style={{ background: "var(--glass)", borderColor: "var(--border-g)" }}
    >
      <div className="flex items-center justify-between">
        <ConsoleLabel>{t.badge}</ConsoleLabel>
        <GapBadge gap={gap} />
      </div>

      <h1 className="mt-3 mb-3 text-lg font-extrabold text-ink">{gapTitle}</h1>

      <Typewriter text={insight} />

      <p className="mt-6 mb-3 text-sm text-muted">{t.howToFix}</p>

      <div className="flex flex-col gap-3">
        {PATHS.map((p) => (
          <button
            key={p.path}
            type="button"
            disabled={isPending}
            onClick={() => pick(p.path)}
            className="rounded-lg border px-4 py-3 text-start font-bold transition-colors disabled:opacity-60"
            style={{
              background: chosen === p.path ? p.color : "var(--glass-2)",
              borderColor: chosen === p.path ? p.color : "var(--border-g)",
              color: chosen === p.path ? "var(--navy)" : "var(--ink)",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {chosen && <p className="mt-3 text-xs text-muted">{t.chosenConfirm}</p>}

      {!embedded && (
        <div
          className="mt-8 flex flex-col gap-2 border-t pt-6"
          style={{ borderColor: "var(--border-g)" }}
        >
          <button
            type="button"
            onClick={() => setShowStub((v) => !v)}
            className="rounded-lg border py-3 text-sm text-muted"
            style={{ borderColor: "var(--border-g)" }}
          >
            {t.connectSystems}
          </button>
          {showStub && <p className="text-center text-xs text-muted">{t.comingSoon}</p>}

          <Link href="/dashboard" className="mt-2 text-center text-xs text-teal-2">
            {appDictionary[lang].dashboard.title}
          </Link>
        </div>
      )}
    </div>
  );
}
