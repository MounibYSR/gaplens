"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { computeConfidence } from "@/lib/deep-dive/confidence";
import { DEPARTMENTS, type DepartmentDef } from "@/lib/assessment/departments";
import { DepartmentIcon } from "@/components/ui/department-icon";
import type { Department, GapFixPath, GapStatus } from "@/lib/supabase/types";
import type { RoadmapGap, CostOfInaction } from "@/lib/roadmap/build-prompt";
import { setGapStatus, setGapfixPath } from "@/app/dashboard/actions";
import { TeamIcon, ClockIcon, MonitorIcon, IconBadge } from "@/components/ui/stat-icons";

const PRIORITY_COLOR: Record<RoadmapGap["priority"], string> = {
  high: "var(--gap)",
  medium: "var(--gold)",
  low: "var(--healthy)",
};

const STATUS_ORDER: GapStatus[] = ["open", "in_progress", "resolved"];

function departmentFor(category: string): DepartmentDef | undefined {
  return DEPARTMENTS.find((d) => d.title.en === category);
}

/** high+low = fast, high-impact fix; high+high = worth doing but the big lift. No badge otherwise. */
function quickWinBadge(gap: RoadmapGap): "quick" | "big" | null {
  if (gap.priority === "high" && gap.effort === "high") return "big";
  if ((gap.priority === "high" || gap.priority === "medium") && gap.effort === "low") return "quick";
  return null;
}

function GapCard({
  gap,
  sessionId,
  lang,
  onStatusChange,
  onGapfixChange,
}: {
  gap: RoadmapGap;
  sessionId: string;
  lang: EntryLang;
  onStatusChange: (status: GapStatus) => void;
  onGapfixChange: (path: GapFixPath) => void;
}) {
  const t = appDictionary[lang].dashboard;
  const vt = appDictionary[lang].visualIdentity;
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dept = departmentFor(gap.category);
  const badge = quickWinBadge(gap);
  const statusIndex = STATUS_ORDER.indexOf(gap.status);
  const isResolved = gap.status === "resolved";

  const GAPFIX_OPTIONS: { value: GapFixPath; label: string }[] = [
    { value: "diy", label: t.gapfixDoItMyself },
    { value: "vetted_provider", label: t.gapfixGetMatched },
    { value: "gaplens_executes", label: t.gapfixLetGaplensHandle },
  ];

  function moveStatus(dir: -1 | 1) {
    const next = STATUS_ORDER[statusIndex + dir];
    if (!next) return;
    onStatusChange(next);
    startTransition(async () => {
      await setGapStatus(sessionId, gap.gap_title, next);
    });
  }

  function pickGapfix(path: GapFixPath) {
    onGapfixChange(path);
    startTransition(async () => {
      await setGapfixPath(sessionId, gap.gap_title, path, gap.status);
    });
  }

  return (
    <li
      className="rounded-lg border p-3 text-xs transition-opacity"
      style={{ borderColor: "var(--border-g)", opacity: isResolved ? 0.65 : 1 }}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex flex-1 items-start gap-2 text-start"
        >
          {dept && (
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "var(--glass-2)", color: dept.accent }}
            >
              <DepartmentIcon department={dept} size={16} />
            </span>
          )}
          <span className="min-w-0 flex-1">
            {dept && <p className="text-xs text-muted">{dept.title[lang]}</p>}
            <p className={`font-bold text-ink ${isResolved ? "line-through" : ""}`}>{gap.gap_title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className="ltr-num rounded-full border px-2 py-1 text-xs font-bold"
                dir="ltr"
                style={{ borderColor: PRIORITY_COLOR[gap.priority], color: PRIORITY_COLOR[gap.priority] }}
              >
                {gap.priority.toUpperCase()}
              </span>
              {badge === "quick" && (
                <span className="rounded-full px-2 py-1 text-xs font-extrabold text-navy" style={{ background: "var(--gold)" }}>
                  {t.quickWinBadge}
                </span>
              )}
              {badge === "big" && (
                <span className="rounded-full px-2 py-1 text-xs font-extrabold text-navy" style={{ background: "var(--teal-2)" }}>
                  {t.bigWinBadge}
                </span>
              )}
              {gap.sub_category === "cross_channel" && (
                <span className="rounded-full px-2 py-1 text-xs font-extrabold text-navy" style={{ background: "var(--gold)" }}>
                  {vt.crossChannelBadge}
                </span>
              )}
            </div>
          </span>
        </button>

        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            disabled={isPending || statusIndex === 0}
            onClick={() => moveStatus(-1)}
            aria-label={t.gapStatusOpen}
            className="flex h-7 w-7 items-center justify-center rounded-lg border disabled:opacity-30"
            style={{ borderColor: "var(--border-g)", color: "var(--ink)" }}
          >
            ‹
          </button>
          <button
            type="button"
            disabled={isPending || statusIndex === STATUS_ORDER.length - 1}
            onClick={() => moveStatus(1)}
            aria-label={t.gapStatusResolved}
            className="flex h-7 w-7 items-center justify-center rounded-lg border disabled:opacity-30"
            style={{ borderColor: "var(--border-g)", color: "var(--ink)" }}
          >
            ›
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border-g)" }}>
          <p className="text-muted">{gap.impact}</p>
          <p className="mt-2 text-ink">{gap.recommended_fix}</p>

          <div className="mt-3 flex flex-col gap-2">
            {GAPFIX_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={isPending}
                onClick={() => pickGapfix(opt.value)}
                className="rounded-lg border py-2 text-xs font-bold transition-colors disabled:opacity-60"
                style={{
                  background: gap.gapfix_path === opt.value ? "var(--teal-2)" : "var(--glass-2)",
                  borderColor: gap.gapfix_path === opt.value ? "var(--teal-2)" : "var(--border-g)",
                  color: gap.gapfix_path === opt.value ? "var(--navy)" : "var(--ink)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

type BoardFilter = "all" | "quick_wins" | string;

function GapBoard({ gaps: initialGaps, sessionId, lang }: { gaps: RoadmapGap[]; sessionId: string; lang: EntryLang }) {
  const t = appDictionary[lang].dashboard;
  const [gaps, setGaps] = useState(initialGaps);
  const [filter, setFilter] = useState<BoardFilter>("all");

  function updateGap(title: string, patch: Partial<Pick<RoadmapGap, "status" | "gapfix_path">>) {
    setGaps((prev) => prev.map((g) => (g.gap_title === title ? { ...g, ...patch } : g)));
  }

  const resolvedCount = gaps.filter((g) => g.status === "resolved").length;
  const totalCount = gaps.length;
  const progressPct = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  const departmentsPresent = Array.from(new Set(gaps.map((g) => g.category)))
    .map((category) => departmentFor(category))
    .filter((d): d is DepartmentDef => Boolean(d));

  const filteredGaps = gaps.filter((g) => {
    if (filter === "all") return true;
    if (filter === "quick_wins") return quickWinBadge(g) === "quick";
    return g.category === filter;
  });

  const columns: { status: GapStatus; label: string }[] = [
    { status: "open", label: t.gapStatusOpen },
    { status: "in_progress", label: t.gapStatusInProgress },
    { status: "resolved", label: t.gapStatusResolved },
  ];

  function chipStyle(active: boolean) {
    return {
      borderColor: active ? "var(--teal-2)" : "var(--border-g)",
      background: active ? "var(--teal-2)" : "var(--glass-2)",
      color: active ? "var(--navy)" : "var(--ink)",
    };
  }

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-ink">{t.gapsResolvedProgress(resolvedCount, totalCount)}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--glass-2)" }}>
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${progressPct}%`, background: "var(--teal-2)" }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className="rounded-full border px-3 py-1 text-xs font-bold"
          style={chipStyle(filter === "all")}
        >
          {t.filterAll}
        </button>
        <button
          type="button"
          onClick={() => setFilter("quick_wins")}
          className="rounded-full border px-3 py-1 text-xs font-bold"
          style={chipStyle(filter === "quick_wins")}
        >
          {t.filterQuickWinsOnly}
        </button>
        {departmentsPresent.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setFilter(d.title.en)}
            className="rounded-full border px-3 py-1 text-xs font-bold"
            style={chipStyle(filter === d.title.en)}
          >
            {d.title[lang]}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {columns.map((col) => {
          const colGaps = filteredGaps.filter((g) => g.status === col.status);
          return (
            <div key={col.status}>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-muted">
                {col.label}{" "}
                <span className="ltr-num" dir="ltr">
                  ({colGaps.length})
                </span>
              </p>
              <ul className="flex flex-col gap-2">
                {colGaps.map((gap) => (
                  <GapCard
                    key={gap.gap_title}
                    gap={gap}
                    sessionId={sessionId}
                    lang={lang}
                    onStatusChange={(status) => updateGap(gap.gap_title, { status })}
                    onGapfixChange={(path) => updateGap(gap.gap_title, { gapfix_path: path })}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
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
    <div className="flex items-center gap-3 rounded-lg py-2 pe-3 ps-2" style={{ background: "var(--glass-2)" }}>
      <IconBadge icon={icon} sizeClass="h-8 w-8" />
      <span className="flex-1 text-xs font-bold text-ink">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="shrink-0 rounded-lg bg-teal-2 px-3 py-2 text-xs font-bold text-navy disabled:opacity-40"
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
  costOfInaction,
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
  costOfInaction: CostOfInaction | null;
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
              className="mt-4 block w-full rounded-lg bg-teal-2 py-3 text-center text-sm font-bold text-navy"
            >
              {t.deepDiveCta}
            </button>
            <p className="mt-2 text-xs text-muted">{t.deepDiveNote}</p>

            <button
              type="button"
              onClick={onSwitchToTeam}
              className="mt-3 block w-full rounded-lg border py-3 text-center text-sm font-bold text-ink"
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
                <ul className="mt-2 flex flex-wrap gap-2">
                  {missingDepartments.map((d) => (
                    <li
                      key={d.key}
                      className="rounded-full border px-3 py-1 text-xs font-bold"
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
          <div className="mt-3">
            <GapBoard gaps={gaps} sessionId={sessionId} lang={lang} />
          </div>
        )}
      </div>

      {costOfInaction && costOfInaction.line_items.length > 0 && (
        <div className="glass-card mt-4 rounded-2xl p-6" style={{ borderColor: "var(--border-g)" }}>
          <h2 className="text-sm font-extrabold text-ink">{t.costOfInactionTitle}</h2>
          <p className="mt-1 text-xs text-muted">{t.costOfInactionSubtitle}</p>

          <ul className="mt-4 flex flex-col gap-3">
            {costOfInaction.line_items.map((item) => (
              <li key={item.area} className="flex items-start justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="text-ink">{item.area}</p>
                  {item.note && <p className="mt-1 text-xs text-muted">{item.note}</p>}
                </div>
                <span className="ltr-num shrink-0 text-end font-bold" dir="ltr" style={{ color: "var(--teal-2)" }}>
                  {item.estimated_monthly_amount != null ? `~${item.estimated_monthly_amount} ${item.currency}` : "—"}
                  <span className="ms-1 rounded-full px-2 py-1 text-xs font-bold" style={{ background: "var(--glass-2)", color: "var(--muted)" }}>
                    {t.costOfInactionEstimatedTag}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {costOfInaction.total_estimated_recoverable != null && (
            <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--border-g)" }}>
              <span className="text-xs font-extrabold text-ink">{t.costOfInactionTotalLabel}</span>
              <span className="ltr-num text-sm font-extrabold" dir="ltr" style={{ color: "var(--teal-2)" }}>
                ~{costOfInaction.total_estimated_recoverable} {costOfInaction.currency}/mo
              </span>
            </div>
          )}
        </div>
      )}

      <div className="glass-card-elevated mt-4 rounded-2xl p-6 text-center">
        <h2 className="text-sm font-extrabold text-ink">{t.roadmapTitle}</h2>

        {confidence.responsesCount > 0 && (
          <p className="ltr-num mt-2 text-xs text-muted" dir="ltr">
            {t.confidenceLine(confidence.overall, confidence.responsesCount, confidence.areasCovered)}
          </p>
        )}

        <p className="mt-2 text-xs text-teal-2">{t.roadmapUnlocked}</p>
        <Link
          href={`/roadmap/${sessionId}`}
          className="mt-4 block w-full rounded-lg bg-teal-2 py-3 text-center text-sm font-bold text-navy xl:inline-block xl:w-auto xl:px-8"
        >
          {t.generateRoadmap}
        </Link>
        {version != null && (
          <a
            href={`/roadmap/${sessionId}/pdf`}
            className="mt-3 block w-full rounded-lg border py-3 text-center text-sm font-bold text-ink xl:ms-3 xl:inline-block xl:w-auto xl:px-8"
            style={{ borderColor: "var(--border-g)" }}
          >
            {t.downloadRoadmapPdf}
          </a>
        )}
      </div>
    </div>
  );
}
