import { Gauge } from "@/components/results/gauge";
import { ScanCostLines } from "@/components/scan/cost-lines";
import { ConsoleLabel } from "@/components/ui/console-label";
import { DepartmentRadar } from "@/components/dashboard/department-radar";
import { DEPARTMENTS } from "@/lib/assessment/departments";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { Department } from "@/lib/supabase/types";
import type { RoadmapGap } from "@/lib/roadmap/build-prompt";
import { computeSharpenFlags, type TeaserAnswers } from "@/lib/scan/scoring";

const PRIORITY_RANK: Record<RoadmapGap["priority"], number> = { high: 0, medium: 1, low: 2 };
const PRIORITY_COLOR: Record<RoadmapGap["priority"], string> = {
  high: "var(--gap)",
  medium: "var(--gold)",
  low: "var(--healthy)",
};

function topGapForDepartment(gaps: RoadmapGap[], deptTitleEn: string): RoadmapGap | null {
  const matches = gaps.filter((g) => g.category === deptTitleEn);
  if (matches.length === 0) return null;
  return [...matches].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])[0];
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

function CostRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-full px-4 py-2.5 text-xs font-bold text-ink" style={{ background: "var(--glass-2)" }}>
      <span className="shrink-0" style={{ color: "var(--teal-2)" }}>
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}

export function OverviewSection({
  lang,
  overallGap,
  answers,
  completenessPct,
  trendDelta,
  roundProgressDelta,
  departmentCoverage,
  gaps,
  onSwitchToChat,
}: {
  lang: EntryLang;
  overallGap: number;
  answers: TeaserAnswers;
  completenessPct: number;
  trendDelta: number | null;
  roundProgressDelta: number | null;
  departmentCoverage: { key: Department; pct: number }[];
  gaps: RoadmapGap[];
  onSwitchToChat: () => void;
}) {
  const t = appDictionary[lang].results;
  const d = appDictionary[lang].dashboard;
  const tt = appDictionary[lang].teaser;
  const sharpen = computeSharpenFlags(answers);

  const trendText =
    trendDelta == null ? null : trendDelta > 0 ? d.trendUp(trendDelta) : trendDelta < 0 ? d.trendDown(trendDelta) : d.trendFlat;

  const roundProgressText =
    roundProgressDelta == null
      ? null
      : roundProgressDelta > 0
        ? d.roundProgressUp(roundProgressDelta)
        : roundProgressDelta < 0
          ? d.roundProgressDown(roundProgressDelta)
          : d.roundProgressFlat;

  return (
    <div className="w-full max-w-md xl:max-w-5xl">
      <ConsoleLabel>{t.badge}</ConsoleLabel>
      <h1 className="mt-2 mb-4 text-xl font-extrabold text-ink">{t.title}</h1>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr] xl:items-start">
        <div className="flex flex-col gap-4">
          <Gauge gap={overallGap} lang={lang} />

          {roundProgressText && (
            <p
              className="text-center text-xs font-bold"
              style={{ color: roundProgressDelta && roundProgressDelta > 0 ? "var(--teal-2)" : "var(--muted)" }}
            >
              {roundProgressText}
            </p>
          )}

          <div className="glass-card rounded-2xl p-4" style={{ borderColor: "var(--border-g)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted">{d.dataCompleteness}</span>
              <span className="ltr-num text-xs font-bold text-ink" dir="ltr">
                {completenessPct}%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--glass-2)" }}>
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${completenessPct}%`,
                  background: "linear-gradient(90deg, var(--teal-2), var(--gold))",
                }}
              />
            </div>
            {trendText && (
              <p
                className="mt-2 text-xs font-bold"
                style={{ color: trendDelta && trendDelta > 0 ? "var(--teal-2)" : "var(--muted)" }}
              >
                {trendText}
              </p>
            )}
            <button
              type="button"
              onClick={onSwitchToChat}
              className="mt-3 w-fit rounded-lg bg-teal-2 px-4 py-2 text-xs font-bold text-navy"
            >
              {d.deepenAssessment}
            </button>
          </div>
        </div>

        <div>
          <div className="hidden xl:flex xl:flex-col xl:gap-3">
            <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "var(--teal-2)" }}>
              {tt.costsTitle}
            </p>
            <CostRow icon={<ClockIcon />} text={sharpen.money ? tt.costMoneySharp : tt.costMoneyBase} />
            <CostRow icon={<PersonIcon />} text={sharpen.customers ? tt.costCustomersSharp : tt.costCustomersBase} />
            <CostRow icon={<InfoIcon />} text={sharpen.time ? tt.costTimeSharp : tt.costTimeBase} />
            <p className="mt-1 text-xs text-muted">{tt.closingLine}</p>
          </div>

          <div className="xl:hidden">
            <ScanCostLines answers={answers} lang={lang} />
          </div>
        </div>
      </div>

      <div className="mt-6 hidden glass-card rounded-2xl p-6 xl:block" style={{ borderColor: "var(--border-g)" }}>
        <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "var(--teal-2)" }}>
          {d.vectorAnalysisTitle}
        </p>
        <DepartmentRadar coverage={departmentCoverage} lang={lang} />
        <p className="mt-2 text-center text-xs text-muted">{d.vectorAnalysisNote}</p>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs font-extrabold uppercase tracking-widest" style={{ color: "var(--teal-2)" }}>
          {d.departmentBreakdownTitle}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DEPARTMENTS.map((dept) => {
            const coverage = departmentCoverage.find((c) => c.key === dept.key)?.pct ?? 0;
            const gap = topGapForDepartment(gaps, dept.title.en);
            const started = coverage > 0;

            let calloutText: string;
            let calloutColor: string;
            let calloutLabel: string;
            if (gap) {
              calloutLabel = gap.priority === "high" ? d.deptCriticalGap : d.deptGapIdentified;
              calloutColor = PRIORITY_COLOR[gap.priority];
              calloutText = gap.gap_title;
            } else if (started) {
              calloutLabel = "";
              calloutColor = "var(--healthy)";
              calloutText = d.deptNoGaps;
            } else {
              calloutLabel = "";
              calloutColor = "var(--border-g)";
              calloutText = d.deptNotStarted;
            }

            return (
              <div
                key={dept.key}
                className="glass-card flex flex-col gap-3 rounded-2xl p-4"
                style={{ borderColor: "var(--border-g)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-widest"
                    style={{ borderColor: dept.accent, color: dept.accent }}
                  >
                    {dept.title[lang]}
                  </span>
                  <span className="ltr-num text-xs font-bold text-muted" dir="ltr">
                    {coverage}%
                  </span>
                </div>

                <div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--glass-2)" }}>
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${coverage}%`, background: dept.accent }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-muted">{d.deptCoverageLabel}</p>
                </div>

                <div
                  className="rounded-lg border px-3 py-2 text-xs"
                  style={{ borderColor: calloutColor, background: "var(--glass-2)" }}
                >
                  {calloutLabel && (
                    <p className="font-extrabold" style={{ color: calloutColor }}>
                      {calloutLabel}
                    </p>
                  )}
                  <p className="text-ink">{calloutText}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
