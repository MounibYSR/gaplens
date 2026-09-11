"use client";

import { useEffect, useState } from "react";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { RoadmapGap } from "@/lib/roadmap/build-prompt";
import type { CompanyTool } from "@/app/dashboard/tool-map-actions";
import type { DiyGuide } from "@/lib/roadmap/diy-guide";
import { getOrGenerateDiyGuide } from "@/app/dashboard/gapfix-actions";
import { setGapStatus } from "@/app/dashboard/actions";

export function DiyGuideModal({
  sessionId,
  gap,
  companyTools,
  lang,
  onClose,
  onResolved,
}: {
  sessionId: string;
  gap: RoadmapGap;
  companyTools: CompanyTool[];
  lang: EntryLang;
  onClose: () => void;
  onResolved: () => void;
}) {
  const t = appDictionary[lang].dashboard;
  const [guide, setGuide] = useState<DiyGuide | null>(null);
  const [error, setError] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOrGenerateDiyGuide(sessionId, gap, companyTools, lang)
      .then((result) => {
        if (cancelled) return;
        if ("error" in result) setError(true);
        else setGuide(result.guide);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
    // Only the gap identity should retrigger generation — companyTools/lang
    // are stable for the life of this modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, gap.gap_title]);

  async function markResolved() {
    if (resolving) return;
    setResolving(true);
    try {
      await setGapStatus(sessionId, gap.gap_title, "resolved");
      onResolved();
      onClose();
    } finally {
      setResolving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(6,10,20,0.6)" }}
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-2xl"
        style={{ background: "var(--modal-bg)", borderColor: "var(--border-g)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-extrabold text-ink">{t.gapfixGuideTitle}</h2>
        <p className="mt-1 text-sm text-muted">{gap.gap_title}</p>

        {error && (
          <p className="mt-4 text-sm font-bold" style={{ color: "var(--gap)" }}>
            {t.gapfixGenerateGuideError}
          </p>
        )}

        {!guide && !error && (
          <div className="mt-6 flex flex-col items-center gap-3 py-6 text-sm text-muted">
            <span
              className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: "var(--teal-2)", borderTopColor: "transparent" }}
            />
            {t.gapfixGuideLoading}
          </div>
        )}

        {guide && (
          <>
            <ol className="mt-4 flex flex-col gap-3">
              {guide.steps.map((step) => (
                <li
                  key={step.step_number}
                  className="flex items-start gap-3 rounded-lg border p-3 text-sm"
                  style={{ borderColor: "var(--border-g)", background: "var(--glass-2)" }}
                >
                  <span
                    className="ltr-num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-navy"
                    style={{ background: "var(--teal-2)" }}
                    dir="ltr"
                  >
                    {step.step_number}
                  </span>
                  <span className="text-ink">{step.instruction}</span>
                </li>
              ))}
            </ol>

            <div className="mt-4 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--gold)", background: "var(--glass-2)" }}>
              <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "var(--gold)" }}>
                {t.gapfixConfirmationCheckLabel}
              </p>
              <p className="mt-1 text-ink">{guide.confirmation_check}</p>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border py-3 text-sm font-bold text-ink"
                style={{ borderColor: "var(--border-g)" }}
              >
                {t.gapfixClose}
              </button>
              <button
                type="button"
                onClick={markResolved}
                disabled={resolving || gap.status === "resolved"}
                className="flex-1 rounded-lg bg-teal-2 py-3 text-sm font-bold text-navy disabled:opacity-60"
              >
                {resolving ? "…" : t.gapfixMarkResolved}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ProviderComingSoonModal({ lang, onClose }: { lang: EntryLang; onClose: () => void }) {
  const t = appDictionary[lang].dashboard;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(6,10,20,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-6 text-center shadow-2xl"
        style={{ background: "var(--modal-bg)", borderColor: "var(--border-g)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-extrabold text-ink">{t.gapfixComingSoonProviderTitle}</h2>
        <p className="mt-2 text-sm text-muted">{t.gapfixComingSoonProviderBody}</p>
        <button type="button" onClick={onClose} className="mt-6 w-full rounded-lg bg-teal-2 py-3 text-sm font-bold text-navy">
          {t.gapfixClose}
        </button>
      </div>
    </div>
  );
}
