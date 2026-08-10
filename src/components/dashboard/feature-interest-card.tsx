"use client";

import { useState } from "react";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import { logInterestClick } from "@/app/dashboard/feature-interest-actions";
import { FeatureInterestModal } from "@/components/dashboard/feature-interest-modal";

export function FeatureInterestCard({ lang, companyId }: { lang: EntryLang; companyId: string }) {
  const t = appDictionary[lang].featureInterest;
  const [showModal, setShowModal] = useState(false);

  function handleClick() {
    void logInterestClick(companyId);
    setShowModal(true);
  }

  return (
    <div
      className="mt-4 flex flex-col items-start gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between"
      style={{ borderColor: "var(--teal-2)", background: "var(--glass-2)" }}
    >
      <div className="min-w-0">
        <span
          className="inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-widest text-navy"
          style={{ background: "var(--gold)" }}
        >
          {t.bannerBadge}
        </span>
        <p className="mt-1.5 text-sm font-extrabold text-ink">{t.bannerTitle}</p>
        <p className="mt-1 text-xs text-muted">{t.bannerBody}</p>
      </div>
      <button
        type="button"
        onClick={handleClick}
        className="shrink-0 rounded-lg bg-teal-2 px-5 py-2.5 text-sm font-bold text-navy"
      >
        {t.bannerCta}
      </button>

      {showModal && <FeatureInterestModal lang={lang} companyId={companyId} onClose={() => setShowModal(false)} />}
    </div>
  );
}
