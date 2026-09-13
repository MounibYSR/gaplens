"use client";

import { useState } from "react";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import { submitSupportRequest } from "@/app/dashboard/support-actions";

const TOPICS = ["billing", "technical", "feedback", "other"] as const;
type Topic = (typeof TOPICS)[number];

export function ContactSupportModal({
  lang,
  companyId,
  userEmail,
  onClose,
}: {
  lang: EntryLang;
  companyId: string;
  userEmail: string;
  onClose: () => void;
}) {
  const t = appDictionary[lang].contactSupport;
  const topicLabel: Record<Topic, string> = {
    billing: t.topicBilling,
    technical: t.topicTechnical,
    feedback: t.topicFeedback,
    other: t.topicOther,
  };

  const [topic, setTopic] = useState<Topic | "">("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = topic !== "" && message.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(false);
    try {
      await submitSupportRequest({ companyId, topic: topicLabel[topic as Topic], message: message.trim() });
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
            <p className="mt-1 text-xs text-muted">{t.replyHint(userEmail)}</p>

            <label className="mt-4 block text-xs font-bold text-muted">
              {t.topicLabel}
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value as Topic)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-ink outline-none"
                style={{ background: "var(--navy)", borderColor: "var(--border-g)" }}
              >
                <option value="" style={{ backgroundColor: "var(--navy)", color: "var(--ink)" }}>
                  {t.topicPlaceholder}
                </option>
                {TOPICS.map((key) => (
                  <option key={key} value={key} style={{ backgroundColor: "var(--navy)", color: "var(--ink)" }}>
                    {topicLabel[key]}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block text-xs font-bold text-muted">
              {t.messageLabel}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.messagePlaceholder}
                rows={4}
                className="mt-1 w-full resize-none rounded-lg border px-3 py-2 text-sm text-ink outline-none"
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
                disabled={!canSubmit || submitting}
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
