"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { computeConfidence } from "@/lib/deep-dive/confidence";
import { DEPARTMENTS } from "@/lib/assessment/departments";
import type { Department, GapStatus } from "@/lib/supabase/types";
import type { RoadmapGap } from "@/lib/roadmap/build-prompt";
import { setGapStatus } from "@/app/dashboard/actions";
import { TeamIcon, ClockIcon, MonitorIcon, IconBadge } from "@/components/ui/stat-icons";

const PRIORITY_COLOR: Record<RoadmapGap["priority"], string> = {
  high: "var(--gap)",
  medium: "var(--gold)",
  low: "var(--healthy)",
};

function GapCard({
  gap,
  index,
  sessionId,
  lang,
}: {
  gap: RoadmapGap;
  index: number;
  sessionId: string;
  lang: EntryLang;
}) {
  const t = appDictionary[lang].dashboard;
  const vt = appDictionary[lang].visualIdentity;
  const [status, setStatus] = useState<GapStatus>(gap.status);
  const [isPending, startTransition] = useTransition();

  const gapfixLabel =
    gap.gapfix_path === "diy" ? t.gapfixDiy : gap.gapfix_path === "vetted_provider" ? t.gapfixVettedProvider : t.gapfixGaplensExecutes;

  const STATUS_OPTIONS: { value: GapStatus; label: string }[] = [
    { value: "open", label: t.gapStatusOpen },
    { value: "in_progress", label: t.gapStatusInProgress },
    { value: "resolved", label: t.gapStatusResolved },
  ];

  function pick(value: GapStatus) {
    setStatus(value);
    startTransition(async () => {
      await setGapStatus(sessionId, gap.gap_title, value);
    });
  }

  return (
    <li
      className="rounded-lg border border-s-4 p-3 text-xs"
      style={{ borderColor: "var(--border-g)", borderInlineStartColor: PRIORITY_COLOR[gap.priority] }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="ltr-num shrink-0 text-[10px] font-bold text-muted" dir="ltr">
            GAP-{String(index + 1).padStart(2, "0")}
          </span>
          {gap.sub_category === "cross_channel" && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-navy"
              style={{ background: "var(--gold)" }}
            >
              {vt.crossChannelBadge}
            </span>
          )}
          <span className="font-bold text-ink">{gap.gap_title}</span>
        </span>
        <span
          className="ltr-num shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold"
          dir="ltr"
          style={{ borderColor: PRIORITY_COLOR[gap.priority], color: PRIORITY_COLOR[gap.priority] }}
        >
          {gap.priority.toUpperCase()}
        </span>
      </div>
      <p className="mt-1.5 text-muted">{gap.impact}</p>
      <p className="mt-1.5 text-ink">{gap.recommended_fix}</p>
      <p className="mt-1.5 text-teal-2">{gapfixLabel}</p>

      <div className="mt-2 flex gap-1.5">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={isPending}
            onClick={() => pick(opt.value)}
            className="flex-1 rounded-md border py-1 text-[10px] font-bold transition-colors disabled:opacity-60"
            style={{
              background: status === opt.value ? "var(--teal-2)" : "var(--glass-2)",
              borderColor: status === opt.value ? "var(--teal-2)" : "var(--border-g)",
              color: status === opt.value ? "var(--navy)" : "var(--ink)",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </li>
  );
}

function AccuracyActionRow({
  icon,
  label,
  actionLabel,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  actionLabel: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg py-1.5 pe-3 ps-1.5" style={{ background: "var(--glass-2)" }}>
      <IconBadge icon={icon} sizeClass="h-8 w-8" />
      <span className="flex-1 text-xs font-bold text-ink">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="shrink-0 rounded-lg bg-teal-2 px-3 py-1.5 text-[11px] font-bold text-navy disabled:opacity-40"
      >
        {actionLabel}
      </button>
    </div>
  );
}

export function RoadmapSection({
  lang,
  sessionId,
  confidence,
  answeredDepartments,
  version,
  gaps,
  trendDelta,
  departmentCoverage,
  onSwitchToChat,
  onSwitchToTeam,
}: {
  lang: EntryLang;
  sessionId: string;
  confidence: ReturnType<typeof computeConfidence>;
  answeredDepartments: Department[];
  version: number | null;
  gaps: RoadmapGap[];
  trendDelta: number | null;
  departmentCoverage: { key: Department; pct: number }[];
  onSwitchToChat: () => void;
  onSwitchToTeam: () => void;
}) {
  const t = appDictionary[lang].dashboard;
  const nav = appDictionary[lang].dashboardNav;
  const advisorT = appDictionary[lang].advisor;
  const missingDepartments = DEPARTMENTS.filter((d) => !answeredDepartments.includes(d.key));
  const completenessPct = Math.round(confidence.completionRatio * 100);
  const trendText =
    trendDelta == null ? null : trendDelta > 0 ? t.trendUp(trendDelta) : trendDelta < 0 ? t.trendDown(trendDelta) : t.trendFlat;

  return (
    <div className="w-full max-w-md xl:max-w-5xl">
      <h1 className="mb-6 text-xl font-extrabold text-ink">{nav.roadmap}</h1>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-start">
        <div
          className="glass-card rounded-2xl p-6"
          style={{ borderColor: "var(--border-g)" }}
        >
          <div className="xl:hidden">
            <h2 className="text-lg font-extrabold text-ink">{t.accuracyTitle}</h2>
            <p className="mt-1 text-sm text-muted">{t.accuracySubtitle}</p>

            <button
              type="button"
              onClick={onSwitchToChat}
              className="mt-4 block w-full rounded-lg bg-teal-2 py-2.5 text-center text-sm font-bold text-navy"
            >
              {t.deepDiveCta}
            </button>
            <p className="mt-2 text-xs text-muted">{t.deepDiveNote}</p>

            <button
              type="button"
              onClick={onSwitchToTeam}
              className="mt-3 block w-full rounded-lg border py-2.5 text-center text-sm font-bold text-ink"
              style={{ borderColor: "var(--border-g)" }}
            >
              {t.inviteTitle}
            </button>
          </div>

          <div className="hidden xl:block">
            <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "var(--teal-2)" }}>
              {t.accuracyTitle}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <AccuracyActionRow icon={<TeamIcon />} label={t.inviteTitle} actionLabel={t.inviteActionShort} onClick={onSwitchToTeam} />
              <AccuracyActionRow icon={<ClockIcon />} label={t.deepDiveCta} actionLabel={t.continueActionShort} onClick={onSwitchToChat} />
              <AccuracyActionRow icon={<MonitorIcon />} label={t.connectToolLabel} actionLabel={advisorT.comingSoon} disabled />
            </div>
          </div>
        </div>

        <div
          className="glass-card rounded-2xl p-6"
          style={{ borderColor: "var(--border-g)" }}
        >
          <div className="xl:hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-muted">{t.roadmapCompleteness}</h2>
              <span className="ltr-num text-xs font-bold text-ink" dir="ltr">
                {completenessPct}%
              </span>
            </div>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full"
              style={{ background: "var(--glass-2)" }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${completenessPct}%`,
                  background: "linear-gradient(90deg, var(--teal-2), var(--gold))",
                }}
              />
            </div>

            {missingDepartments.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs text-muted">{t.roadmapMissingLabel}</p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {missingDepartments.map((d) => (
                    <li
                      key={d.key}
                      className="rounded-full border px-2.5 py-1 text-xs font-bold"
                      style={{ borderColor: d.accent, color: d.accent }}
                    >
                      {d.title[lang]}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-3 text-xs text-teal-2">{t.roadmapAllCovered}</p>
            )}
          </div>

          <div className="hidden xl:flex xl:flex-col xl:gap-3">
            <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "var(--teal-2)" }}>
              {t.roadmapCompleteness}
            </p>
            <div className="flex flex-col gap-3">
              {departmentCoverage.map(({ key, pct }) => {
                const dept = DEPARTMENTS.find((d) => d.key === key)!;
                const color = pct >= 50 ? "var(--teal-2)" : "var(--gold)";
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs text-ink">
                      <span>{dept.title[lang]}</span>
                      <span className="ltr-num text-muted" dir="ltr">
                        {pct}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full" style={{ background: "var(--glass-2)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div
        className="glass-card mt-4 rounded-2xl p-6"
        style={{ borderColor: "var(--border-g)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-ink">{t.roadmapGapsTitle}</h2>
          {version != null && (
            <span className="ltr-num text-xs text-muted" dir="ltr">
              v{version}
            </span>
          )}
        </div>
        {trendText && (
          <p
            className="mt-1 text-xs font-bold"
            style={{ color: trendDelta && trendDelta > 0 ? "var(--teal-2)" : "var(--muted)" }}
          >
            {trendText}
          </p>
        )}

        {gaps.length === 0 ? (
          <p className="mt-3 text-xs text-muted">{t.roadmapNoGapsYet}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2 xl:grid xl:grid-cols-3 xl:gap-3">
            {gaps.map((gap, index) => (
              <GapCard key={gap.gap_title} gap={gap} index={index} sessionId={sessionId} lang={lang} />
            ))}
          </ul>
        )}
      </div>

      <div
        className="glass-card mt-4 rounded-2xl p-6 text-center"
        style={{ borderColor: "var(--border-g)" }}
      >
        <h2 className="text-sm font-extrabold text-ink">{t.roadmapTitle}</h2>

        {confidence.responsesCount > 0 && (
          <p className="ltr-num mt-2 text-xs text-muted" dir="ltr">
            {t.confidenceLine(confidence.overall, confidence.responsesCount, confidence.areasCovered)}
          </p>
        )}

        <p className="mt-2 text-xs text-teal-2">{t.roadmapUnlocked}</p>
        <Link
          href={`/roadmap/${sessionId}`}
          className="mt-4 block w-full rounded-lg bg-teal-2 py-2.5 text-center text-sm font-bold text-navy"
        >
          {t.generateRoadmap}
        </Link>
        {version != null && (
          <a
            href={`/roadmap/${sessionId}/pdf`}
            className="mt-3 block w-full rounded-lg border py-2.5 text-center text-sm font-bold text-ink"
            style={{ borderColor: "var(--border-g)" }}
          >
            {t.downloadRoadmapPdf}
          </a>
        )}
      </div>
    </div>
  );
}
