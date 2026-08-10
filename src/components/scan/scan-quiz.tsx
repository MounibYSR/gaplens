"use client";

import { useEffect, useRef, useState } from "react";
import { ScanResultCard } from "@/components/results/gauge";
import { ConsoleLabel } from "@/components/ui/console-label";
import { ProgressDotsRow } from "@/components/scan/progress-dots";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import {
  TEASER_TOOLS,
  MAX_TEASER_TOOLS,
  allPairs,
  pairKey,
  computeTeaserGap,
  toolSummaryFromPairs,
  type TeaserTool,
  type TeaserAnswers,
  type ToolSummary,
  type DataAnswer,
  type CustomerAnswer,
  type PaceAnswer,
} from "@/lib/scan/scoring";

type Step = "tools" | "connections" | "data" | "customer" | "pace" | "reveal";

const STEP_ORDER: Step[] = ["tools", "connections", "data", "customer", "pace", "reveal"];
export const SCAN_STEP_COUNT = STEP_ORDER.length - 1;

function ChoiceCard({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border px-4 py-3 text-start text-sm font-bold transition-colors"
      style={{
        background: active ? "var(--teal-2)" : "var(--glass-2)",
        borderColor: active ? "var(--teal-2)" : "var(--border-g)",
        color: active ? "var(--navy)" : "var(--ink)",
      }}
    >
      {label}
    </button>
  );
}

export function ScanQuiz({
  lang,
  onFinish,
  continueHref,
  continueLabel,
  renderToolsStep,
}: {
  lang: EntryLang;
  onFinish?: (answers: TeaserAnswers, gap: number) => void;
  continueHref: string;
  continueLabel?: string;
  renderToolsStep?: (onComplete: (summary: ToolSummary) => void, progressIndex: number) => React.ReactNode;
}) {
  const t = appDictionary[lang].teaser;
  const [step, setStep] = useState<Step>("tools");
  const [presetTools, setPresetTools] = useState<TeaserTool[]>([]);
  const [presetConnections, setPresetConnections] = useState<string[]>([]);
  const [answers, setAnswers] = useState<TeaserAnswers>({
    toolSummary: { count: 0, isolatedRatio: 0 },
    data: null,
    customer: null,
    pace: null,
  });
  const finished = useRef(false);

  const progressIndex = STEP_ORDER.indexOf(step);

  useEffect(() => {
    if (step === "reveal" && !finished.current) {
      finished.current = true;
      onFinish?.(answers, computeTeaserGap(answers));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function handleToolsComplete(summary: ToolSummary) {
    setAnswers((prev) => ({ ...prev, toolSummary: summary }));
    setStep("data");
  }

  function goNextFromPresetTools() {
    setStep(presetTools.length >= 2 ? "connections" : "data");
    if (presetTools.length < 2) {
      setAnswers((prev) => ({ ...prev, toolSummary: toolSummaryFromPairs(presetTools, presetConnections) }));
    }
  }

  function finishPresetConnections() {
    setAnswers((prev) => ({ ...prev, toolSummary: toolSummaryFromPairs(presetTools, presetConnections) }));
    setStep("data");
  }

  function togglePresetTool(tool: TeaserTool) {
    setPresetTools((prev) => {
      const has = prev.includes(tool);
      if (has) return prev.filter((x) => x !== tool);
      if (prev.length >= MAX_TEASER_TOOLS) return prev;
      return [...prev, tool];
    });
  }

  function togglePresetConnection(key: string) {
    setPresetConnections((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function pickData(value: DataAnswer) {
    setAnswers((prev) => ({ ...prev, data: value }));
    setStep("customer");
  }

  function pickCustomer(value: CustomerAnswer) {
    setAnswers((prev) => ({ ...prev, customer: value }));
    setStep("pace");
  }

  function pickPace(value: PaceAnswer) {
    setAnswers((prev) => ({ ...prev, pace: value }));
    setStep("reveal");
  }

  if (step === "reveal") {
    const gap = computeTeaserGap(answers);

    return (
      <div className="w-full max-w-md">
        <ConsoleLabel>{t.revealBadge}</ConsoleLabel>
        <h1 className="mt-2 mb-4 text-xl font-extrabold text-ink">{t.revealTitle}</h1>

        <ScanResultCard gap={gap} lang={lang} continueHref={continueHref} continueLabel={continueLabel} />
      </div>
    );
  }

  if (step === "tools" && renderToolsStep) {
    return <div className="w-full">{renderToolsStep(handleToolsComplete, progressIndex)}</div>;
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-4 flex justify-center">
        <ProgressDotsRow progressIndex={progressIndex} total={SCAN_STEP_COUNT} />
      </div>

      <div
        className="rounded-2xl border p-8"
        style={{ background: "var(--glass)", borderColor: "var(--border-g)" }}
      >
        <ConsoleLabel>{t.badge}</ConsoleLabel>

        {step === "tools" && (
          <>
            <h1 className="mt-2 mb-1 text-lg font-extrabold text-ink">{t.toolsTitle}</h1>
            <p className="mb-4 text-xs text-muted">{t.toolsSubtitle}</p>
            <div className="flex flex-col gap-2">
              {TEASER_TOOLS.map((tool) => (
                <ChoiceCard
                  key={tool}
                  label={t.tools[tool]}
                  active={presetTools.includes(tool)}
                  onClick={() => togglePresetTool(tool)}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={presetTools.length === 0}
              onClick={goNextFromPresetTools}
              className="mt-6 w-full rounded-lg bg-teal-2 py-2.5 text-sm font-bold text-navy disabled:opacity-40"
            >
              {t.next}
            </button>
          </>
        )}

        {step === "connections" && (
          <>
            <h1 className="mt-2 mb-1 text-lg font-extrabold text-ink">{t.connectionsTitle}</h1>
            <p className="mb-4 text-xs text-muted">{t.connectionsSubtitle}</p>
            <div className="flex flex-col gap-2">
              {allPairs(presetTools).map((key) => {
                const [a, b] = key.split("|") as [TeaserTool, TeaserTool];
                const active = presetConnections.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePresetConnection(pairKey(a, b))}
                    className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-bold transition-colors"
                    style={{
                      background: active ? "var(--teal-2)" : "var(--glass-2)",
                      borderColor: active ? "var(--teal-2)" : "var(--border-g)",
                      color: active ? "var(--navy)" : "var(--ink)",
                    }}
                  >
                    <span>
                      {t.tools[a]} × {t.tools[b]}
                    </span>
                    <span className="text-xs font-normal opacity-80">
                      {active ? t.connected : t.isolated}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={finishPresetConnections}
              className="mt-6 w-full rounded-lg bg-teal-2 py-2.5 text-sm font-bold text-navy"
            >
              {t.next}
            </button>
          </>
        )}

        {step === "data" && (
          <>
            <h1 className="mt-2 mb-4 text-lg font-extrabold text-ink">{t.dataTitle}</h1>
            <div className="flex flex-col gap-2">
              <ChoiceCard label={t.dataOptions.one} active={false} onClick={() => pickData("one")} />
              <ChoiceCard label={t.dataOptions.few} active={false} onClick={() => pickData("few")} />
              <ChoiceCard label={t.dataOptions.unsure} active={false} onClick={() => pickData("unsure")} />
            </div>
          </>
        )}

        {step === "customer" && (
          <>
            <h1 className="mt-2 mb-4 text-lg font-extrabold text-ink">{t.customerTitle}</h1>
            <div className="flex flex-col gap-2">
              <ChoiceCard label={t.customerOptions.never} active={false} onClick={() => pickCustomer("never")} />
              <ChoiceCard
                label={t.customerOptions.sometimes}
                active={false}
                onClick={() => pickCustomer("sometimes")}
              />
              <ChoiceCard label={t.customerOptions.often} active={false} onClick={() => pickCustomer("often")} />
            </div>
          </>
        )}

        {step === "pace" && (
          <>
            <h1 className="mt-2 mb-4 text-lg font-extrabold text-ink">{t.paceTitle}</h1>
            <div className="flex flex-col gap-2">
              <ChoiceCard label={t.paceOptions.keeping} active={false} onClick={() => pickPace("keeping")} />
              <ChoiceCard label={t.paceOptions.behind} active={false} onClick={() => pickPace("behind")} />
              <ChoiceCard label={t.paceOptions.unsure} active={false} onClick={() => pickPace("unsure")} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
