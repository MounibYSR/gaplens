"use client";

import { useEffect, useState } from "react";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { RoadmapGap } from "@/lib/roadmap/build-prompt";
import type { CompanyTool } from "@/app/dashboard/tool-map-actions";
import type { DiyGuide } from "@/lib/roadmap/diy-guide";
import type { ContactMethod } from "@/lib/supabase/types";
import { getOrGenerateDiyGuide, submitProviderRequest } from "@/app/dashboard/gapfix-actions";
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
      style={{ background: "var(--overlay)" }}
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
              <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "var(--text-gold-light-mode)" }}>
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

export function ProviderRequestModal({
  sessionId,
  companyId,
  gap,
  userEmail,
  userPhone,
  lang,
  onClose,
}: {
  sessionId: string;
  companyId: string;
  gap: RoadmapGap;
  userEmail: string;
  userPhone: string | null;
  lang: EntryLang;
  onClose: () => void;
}) {
  const t = appDictionary[lang].providerRequest;
  const [note, setNote] = useState("");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("email");
  const [contactValue, setContactValue] = useState(userEmail);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function pickContactMethod(method: ContactMethod) {
    setContactMethod(method);
    setContactValue(method === "whatsapp" ? (userPhone ?? "") : userEmail);
  }

  async function handleSubmit() {
    if (submitting || !contactValue.trim()) return;
    setSubmitting(true);
    setError(false);
    try {
      await submitProviderRequest({
        companyId,
        sessionId,
        gapTitle: gap.gap_title,
        gapCategory: gap.category,
        note,
        contactMethod,
        contactValue: contactValue.trim(),
      });
      setSubmitted(true);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--overlay)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
        style={{ background: "var(--modal-bg)", borderColor: "var(--border-g)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="text-center">
            <h2 className="text-lg font-extrabold text-ink">{t.confirmationTitle}</h2>
            <p className="mt-2 text-sm text-muted">{t.confirmationBody}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-teal-2 py-3 text-sm font-bold text-navy"
            >
              {t.close}
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-extrabold text-ink">{t.modalTitle}</h2>

            <p className="mt-4 text-xs font-bold text-muted">{t.gapLabel}</p>
            <p className="mt-1 text-sm font-bold text-ink">{gap.gap_title}</p>

            <label className="mt-4 block text-xs font-bold text-muted">
              {t.noteLabel}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.notePlaceholder}
                rows={3}
                className="mt-1 w-full resize-none rounded-lg border px-3 py-2 text-sm text-ink outline-none"
                style={{ background: "var(--glass-2)", borderColor: "var(--border-g)" }}
              />
            </label>

            <p className="mt-4 text-xs font-bold text-muted">{t.contactMethodLabel}</p>
            <div className="mt-2 flex gap-2">
              {(["whatsapp", "email"] as ContactMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => pickContactMethod(method)}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition-colors"
                  style={{
                    background: contactMethod === method ? "var(--teal-2)" : "var(--glass-2)",
                    borderColor: contactMethod === method ? "var(--teal-2)" : "var(--border-g)",
                    color: contactMethod === method ? "var(--navy)" : "var(--ink)",
                  }}
                >
                  {method === "whatsapp" ? t.contactWhatsapp : t.contactEmail}
                </button>
              ))}
            </div>

            <label className="mt-3 block text-xs font-bold text-muted">
              {t.contactValueLabel}
              <input
                type="text"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={t.contactValuePlaceholder}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-ink outline-none"
                style={{ background: "var(--glass-2)", borderColor: "var(--border-g)" }}
              />
            </label>

            {error && (
              <p className="mt-3 text-xs font-bold" style={{ color: "var(--gap)" }}>
                {t.submitError}
              </p>
            )}

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border py-3 text-sm font-bold text-ink"
                style={{ borderColor: "var(--border-g)" }}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !contactValue.trim()}
                className="flex-1 rounded-lg bg-teal-2 py-3 text-sm font-bold text-navy disabled:opacity-60"
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
