"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import { computeConfidence, bucketConfidence } from "@/lib/deep-dive/confidence";
import { bucketGap } from "@/lib/scan/scoring";
import { ClockIcon, PersonIcon, InfoIcon, IconBadge } from "@/components/ui/stat-icons";

const RING_SIZE = 112;
const RING_STROKE = 12;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC = 2 * Math.PI * RING_R;

// Fixed baseline confidence right after the short quiz — reflects how little
// data the score is based on (zero deep-dive responses yet), not the Gap
// Score's severity. Uses the exact same formula the dashboard later
// recomputes with real deep-dive data, so the number stays consistent as it
// grows from this baseline instead of jumping between two different scales.
const BASELINE_CONFIDENCE = computeConfidence({
  deepDiveResponses: [],
  toolCount: 0,
  freeformMessageCount: 0,
  visualConsultationCount: 0,
}).overall;

function GapRing({ gap }: { gap: number }) {
  const pct = Math.min(100, Math.max(0, gap)) / 100;
  const offset = RING_CIRC * (1 - pct);
  return (
    <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_R}
          fill="none"
          style={{ stroke: "var(--glass-2)" }}
          strokeWidth={RING_STROKE}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_R}
          fill="none"
          style={{ stroke: "url(#gapRingGradient)" }}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRC}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="gapRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--teal-2)" />
            <stop offset="100%" stopColor="var(--gold)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="ltr-num text-2xl font-extrabold text-ink" dir="ltr">
          {gap}
        </span>
        <span className="ltr-num text-[10px] text-muted" dir="ltr">
          /100
        </span>
      </div>
    </div>
  );
}

function GapPill({ gap, lang }: { gap: number; lang: EntryLang }) {
  const t = appDictionary[lang].results;
  const isNeedsWork = bucketGap(gap) === "needsWork";
  return (
    <span
      className="inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold"
      style={{
        borderColor: isNeedsWork ? "var(--gold)" : "var(--teal-2)",
        color: isNeedsWork ? "var(--gold)" : "var(--teal-2)",
      }}
    >
      {isNeedsWork ? t.needsWork : t.strong}
    </span>
  );
}

function ConfidenceLine({ lang }: { lang: EntryLang }) {
  const t = appDictionary[lang].results;
  const bucket = bucketConfidence(BASELINE_CONFIDENCE);
  const bucketLabel = bucket === "low" ? t.confidenceLow : bucket === "medium" ? t.confidenceMedium : t.confidenceHigh;
  return (
    <p className="text-xs text-muted">
      {t.confidencePrefix}{" "}
      <span className="ltr-num font-bold" dir="ltr" style={{ color: "var(--gold)" }}>
        {bucketLabel} ({BASELINE_CONFIDENCE}%)
      </span>{" "}
      {t.confidenceSuffix}
    </p>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function CostRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-full py-1.5 pe-4 ps-1.5 text-xs font-bold text-ink" style={{ background: "var(--glass-2)" }}>
      <IconBadge icon={icon} sizeClass="h-7 w-7" />
      <span>{text}</span>
    </div>
  );
}

function ScanningCard({ lang }: { lang: EntryLang }) {
  return (
    <div className="glass-card relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl px-8 py-10">
      <div className="shine-sweep" />
      <div
        className="relative flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          background: "linear-gradient(135deg, var(--teal-2), var(--gold))",
          boxShadow: "0 0 24px rgba(21, 201, 154, 0.45)",
        }}
      >
        <span className="h-3 w-3 animate-pulse rounded-full bg-navy" />
      </div>
      <p className="text-sm font-bold text-ink">{appDictionary[lang].diagnosticScan.title}</p>
    </div>
  );
}

function useSettledPhase() {
  const [phase, setPhase] = useState<"scanning" | "result">("scanning");
  useEffect(() => {
    const timer = setTimeout(() => setPhase("result"), 1600);
    return () => clearTimeout(timer);
  }, []);
  return phase;
}

function RingOnlyCard({ gap, lang }: { gap: number; lang: EntryLang }) {
  const t = appDictionary[lang].results;
  return (
    <div className="glass-card flex w-full flex-col items-center gap-2 rounded-2xl px-8 py-6">
      <p className="text-xs font-bold uppercase tracking-widest text-muted">{t.scoreLabel}</p>
      <GapRing gap={gap} />
      <GapPill gap={gap} lang={lang} />
    </div>
  );
}

export function Gauge({ gap, lang }: { gap: number; lang: EntryLang }) {
  const phase = useSettledPhase();
  return phase === "scanning" ? <ScanningCard lang={lang} /> : <RingOnlyCard gap={gap} lang={lang} />;
}

export function ScanResultCard({
  gap,
  lang,
  continueHref,
  continueLabel,
}: {
  gap: number;
  lang: EntryLang;
  continueHref: string;
  continueLabel?: string;
}) {
  const phase = useSettledPhase();
  if (phase === "scanning") return <ScanningCard lang={lang} />;

  const t = appDictionary[lang].results;

  return (
    <div className="glass-card w-full rounded-2xl px-6 py-6 text-start sm:px-8 sm:py-8">
      <p className="text-xs font-bold uppercase tracking-widest text-muted">{t.scoreLabel}</p>

      <div className="mt-4 flex items-center gap-5">
        <GapRing gap={gap} />
        <div className="flex flex-1 flex-col items-start gap-2">
          <GapPill gap={gap} lang={lang} />
          <ConfidenceLine lang={lang} />
        </div>
      </div>

      <div className="my-6 h-px w-full" style={{ background: "var(--border-g)" }} />

      <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "var(--teal-2)" }}>
        {t.costsLabel}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <CostRow icon={<ClockIcon />} text={t.costRowHours} />
        <CostRow icon={<PersonIcon />} text={t.costRowCustomers} />
        <CostRow icon={<InfoIcon />} text={t.costRowTools} />
      </div>

      <p className="mt-4 text-xs text-muted">{t.closingLineShort}</p>

      <Link
        href={continueHref}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-2 py-2.5 text-sm font-bold text-navy"
      >
        {continueLabel ?? t.continueCta}
        <ArrowRightIcon />
      </Link>
    </div>
  );
}
