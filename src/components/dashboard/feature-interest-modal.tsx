"use client";

import { useState } from "react";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { PriceBand } from "@/lib/supabase/types";
import { PLATFORM_KNOWLEDGE_BASE } from "@/lib/roadmap/platform-knowledge";
import { TOOL_CATALOG } from "@/lib/assessment/tool-catalog";
import { submitInterestSignal } from "@/app/dashboard/feature-interest-actions";

const PLATFORM_OPTIONS = PLATFORM_KNOWLEDGE_BASE.map((entry) => ({
  catalogId: entry.catalogId,
  label: TOOL_CATALOG.find((t) => t.id === entry.catalogId)?.label ?? { en: entry.displayName, ar: entry.displayName },
}));

const PRICE_BANDS: PriceBand[] = ["none", "low", "mid", "high"];

export function FeatureInterestModal({
  lang,
  companyId,
  onClose,
}: {
  lang: EntryLang;
  companyId: string;
  onClose: () => void;
}) {
  const t = appDictionary[lang].featureInterest;
  const priceLabel: Record<PriceBand, string> = {
    none: t.priceNone,
    low: t.priceLow,
    mid: t.priceMid,
    high: t.priceHigh,
  };

  const [priceBand, setPriceBand] = useState<PriceBand | null>(null);
  const [platform1, setPlatform1] = useState("");
  const [platform2, setPlatform2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = priceBand !== null && platform1 && platform2 && platform1 !== platform2;

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitInterestSignal({ companyId, priceBand: priceBand!, platforms: [platform1, platform2] });
      setSubmitted(true);
    } catch {
      setError(t.submitError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(6,10,20,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
        style={{ background: "var(--modal-bg)", borderColor: "var(--border-g)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="text-center">
            <h2 className="text-lg font-extrabold text-ink">{t.thankYouTitle}</h2>
            <p className="mt-2 text-sm text-muted">{t.thankYouBody}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-teal-2 py-2.5 text-sm font-bold text-navy"
            >
              {t.close}
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-extrabold text-ink">{t.modalTitle}</h2>

            <p className="mt-4 text-sm font-bold text-ink">{t.priceQuestion}</p>
            <div className="mt-2 flex flex-col gap-2">
              {PRICE_BANDS.map((band) => (
                <button
                  key={band}
                  type="button"
                  onClick={() => setPriceBand(band)}
                  className="rounded-lg border px-3 py-2 text-start text-sm font-bold transition-colors"
                  style={{
                    background: priceBand === band ? "var(--teal-2)" : "var(--glass-2)",
                    borderColor: priceBand === band ? "var(--teal-2)" : "var(--border-g)",
                    color: priceBand === band ? "var(--navy)" : "var(--ink)",
                  }}
                >
                  {priceLabel[band]}
                </button>
              ))}
            </div>

            <p className="mt-5 text-sm font-bold text-ink">{t.platformQuestion}</p>
            <div className="mt-2 flex flex-col gap-2">
              <label className="block">
                <span className="mb-1 block text-xs text-muted">{t.platform1Label}</span>
                <select
                  value={platform1}
                  onChange={(e) => setPlatform1(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-ink outline-none"
                  style={{ background: "var(--navy)", borderColor: "var(--border-g)" }}
                >
                  <option value="" style={{ backgroundColor: "var(--navy)", color: "var(--ink)" }}>
                    {t.platformPlaceholder}
                  </option>
                  {PLATFORM_OPTIONS.filter((p) => p.catalogId !== platform2).map((p) => (
                    <option
                      key={p.catalogId}
                      value={p.catalogId}
                      style={{ backgroundColor: "var(--navy)", color: "var(--ink)" }}
                    >
                      {p.label[lang]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted">{t.platform2Label}</span>
                <select
                  value={platform2}
                  onChange={(e) => setPlatform2(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-ink outline-none"
                  style={{ background: "var(--navy)", borderColor: "var(--border-g)" }}
                >
                  <option value="" style={{ backgroundColor: "var(--navy)", color: "var(--ink)" }}>
                    {t.platformPlaceholder}
                  </option>
                  {PLATFORM_OPTIONS.filter((p) => p.catalogId !== platform1).map((p) => (
                    <option
                      key={p.catalogId}
                      value={p.catalogId}
                      style={{ backgroundColor: "var(--navy)", color: "var(--ink)" }}
                    >
                      {p.label[lang]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error && (
              <p className="mt-3 text-xs font-bold" style={{ color: "var(--gap)" }}>
                {error}
              </p>
            )}

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border py-2.5 text-sm font-bold text-ink"
                style={{ borderColor: "var(--border-g)" }}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="flex-1 rounded-lg bg-teal-2 py-2.5 text-sm font-bold text-navy disabled:opacity-60"
              >
                {submitting ? "…" : t.submit}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
