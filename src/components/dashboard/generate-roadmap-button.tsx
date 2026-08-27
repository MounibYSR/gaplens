"use client";

import { useEffect, useState, useTransition } from "react";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import { generateRoadmapAction } from "@/app/roadmap/[sessionId]/actions";

export function GenerateRoadmapButton({ sessionId, lang }: { sessionId: string; lang: EntryLang }) {
  const t = appDictionary[lang].dashboard;
  const [isPending, startTransition] = useTransition();
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!isPending) return;
    const interval = setInterval(() => {
      setStepIndex((i) => (i + 1) % t.generatingSteps.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isPending, t.generatingSteps.length]);

  const pdfUrl = `/roadmap/${sessionId}/pdf`;

  function generate() {
    setError(null);
    setIsDone(false);
    setStepIndex(0);
    startTransition(async () => {
      try {
        const result = await generateRoadmapAction(sessionId);
        if (!result.ok) {
          setError(t.generateRoadmapError);
          return;
        }
        // /pdf is a file-download route, not a navigable page, so a real
        // navigation (which triggers the download) is used here instead of
        // router.push — a client-side transition to a download response
        // never completes, since there's no new page for it to land on.
        setIsDone(true);
        window.location.href = pdfUrl;
      } catch {
        setError(t.generateRoadmapError);
      }
    });
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border py-6" style={{ borderColor: "var(--border-g)" }}>
        <span className="h-3 w-3 animate-pulse rounded-full" style={{ background: "var(--teal-2)" }} />
        <p className="text-sm font-bold text-ink">{t.generatingSteps[stepIndex]}</p>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border py-6 text-center" style={{ borderColor: "var(--border-g)" }}>
        <p className="text-sm font-bold text-ink">{t.roadmapReadyMessage}</p>
        <a href={pdfUrl} className="text-sm font-bold" style={{ color: "var(--teal-2)" }}>
          {t.downloadRoadmapPdf}
        </a>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p
          className="mb-3 rounded-lg border px-3 py-2 text-xs font-bold"
          style={{ color: "var(--gap)", borderColor: "var(--gap)", background: "rgba(229, 72, 77, 0.1)" }}
        >
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={generate}
        className="block w-full rounded-lg bg-teal-2 py-3 text-center font-bold text-navy"
      >
        {t.generateRoadmap}
      </button>
    </div>
  );
}
