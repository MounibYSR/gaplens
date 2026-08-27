"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { DEPARTMENTS } from "@/lib/assessment/departments";
import type { DepartmentDef } from "@/lib/assessment/departments";
import { buildDeepDiveQuestions, MANUAL_HOURS_QUESTION, MANUAL_HEADCOUNT_QUESTION, NONE_OPTION } from "@/lib/deep-dive/question-bank";
import type { DeepDiveQuestion } from "@/lib/deep-dive/question-bank";
import { ProgressDots } from "@/components/assessment/progress-dots";
import { ConsoleLabel } from "@/components/ui/console-label";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { Department } from "@/lib/supabase/types";
import type { CompanyTool } from "@/app/dashboard/tool-map-actions";
import { submitDeepDiveAnswer } from "./actions";
import { startNewRound } from "@/app/dashboard/round-actions";
import { ConstellationIcon } from "@/components/ui/constellation-icon";

type AnsweredTurn = { question: string; answer: string };

function firstUnansweredIndex(answered: Department[]) {
  const idx = DEPARTMENTS.findIndex((d) => !answered.includes(d.key));
  return idx === -1 ? DEPARTMENTS.length : idx;
}

function StartNewRoundButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="block w-full rounded-lg border py-3 text-center text-sm font-bold text-ink disabled:opacity-60"
      style={{ borderColor: "var(--border-g)" }}
    >
      {pending ? "…" : label}
    </button>
  );
}

function HistoryRow({ question, answer }: AnsweredTurn) {
  const [expanded, setExpanded] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="w-full shrink-0 rounded-lg border px-3 py-2 text-start text-xs transition-colors"
      style={{ background: "var(--glass-2)", borderColor: "var(--border-g)" }}
    >
      <p className={expanded ? "text-muted" : "truncate text-muted"}>{question}</p>
      <p className={`font-bold ${expanded ? "" : "truncate"}`} style={{ color: "var(--teal-2)" }}>
        {answer}
      </p>
    </button>
  );
}

// Collapsed by default — showing rows by default is exactly what pushed the
// active question below the fold before. A single toggle chip costs almost
// no vertical space; the scrollable row list only appears once asked for.
function HistoryPanel({ turns, toggleLabel }: { turns: AnsweredTurn[]; toggleLabel: (n: number) => string }) {
  const [open, setOpen] = useState(false);
  if (turns.length === 0) return null;

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-start text-xs font-bold text-muted"
        style={{ background: "var(--glass-2)", borderColor: "var(--border-g)" }}
      >
        <span>{toggleLabel(turns.length)}</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-2 flex max-h-32 flex-col gap-2 overflow-y-auto pe-1">
          {turns.map((turn, i) => (
            <HistoryRow key={i} question={turn.question} answer={turn.answer} />
          ))}
        </div>
      )}
    </div>
  );
}

function AiAvatar() {
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
      style={{ background: "var(--teal-2)", color: "var(--navy)" }}
    >
      <ConstellationIcon size={14} />
    </span>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
    </svg>
  );
}

function CustomAnswerInput({
  isPending,
  onAnswer,
  placeholder,
}: {
  isPending: boolean;
  onAnswer: (text: string) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  function submit() {
    const trimmed = draft.trim();
    if (!trimmed || isPending) return;
    onAnswer(trimmed);
  }

  return (
    <div className="mt-1 flex items-center gap-2">
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        disabled={isPending}
        className="flex-1 rounded-lg border px-3 py-2 text-sm text-ink outline-none disabled:opacity-60"
        style={{ background: "var(--glass-2)", borderColor: "var(--border-g)" }}
      />
      <button
        type="button"
        disabled={isPending || !draft.trim()}
        onClick={submit}
        aria-label="Send"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-2 text-navy disabled:opacity-40"
      >
        <SendIcon />
      </button>
    </div>
  );
}

function QuestionControls({
  question,
  lang,
  isPending,
  onAnswer,
  continueLabel,
}: {
  question: DeepDiveQuestion;
  lang: EntryLang;
  isPending: boolean;
  onAnswer: (labels: string[]) => void;
  continueLabel: string;
}) {
  const [multiSelectDraft, setMultiSelectDraft] = useState<string[]>([]);

  if (question.type === "single_select") {
    return (
      <div className="flex flex-col gap-2">
        {question.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={isPending}
            onClick={() => onAnswer([opt.label[lang]])}
            className="w-full rounded-lg border px-4 py-3 text-start text-sm font-bold text-ink transition-colors disabled:opacity-60"
            style={{ background: "var(--glass-2)", borderColor: "var(--border-g)" }}
          >
            {opt.label[lang]}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "slider") {
    return (
      <div className="flex flex-col gap-2">
        {question.steps.map((step, i) => (
          <button
            key={step.value}
            type="button"
            disabled={isPending}
            onClick={() => onAnswer([step.label[lang]])}
            className="flex items-center gap-3 rounded-lg border px-4 py-3 text-start text-sm font-bold text-ink transition-colors disabled:opacity-60"
            style={{ background: "var(--glass-2)", borderColor: "var(--border-g)" }}
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-navy"
              style={{ background: "var(--gold)" }}
            >
              {i + 1}
            </span>
            {step.label[lang]}
          </button>
        ))}
      </div>
    );
  }

  const noneValue = question.noneValue;
  return (
    <div className="flex flex-col gap-2">
      {question.options.map((opt) => {
        const active = multiSelectDraft.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            disabled={isPending}
            onClick={() =>
              setMultiSelectDraft((prev) => {
                if (opt.value === noneValue) return prev.includes(opt.value) ? [] : [opt.value];
                const withoutNone = prev.filter((v) => v !== noneValue);
                return withoutNone.includes(opt.value)
                  ? withoutNone.filter((v) => v !== opt.value)
                  : [...withoutNone, opt.value];
              })
            }
            className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-start text-sm font-bold transition-colors disabled:opacity-60"
            style={{
              background: active ? "var(--teal-2)" : "var(--glass-2)",
              borderColor: active ? "var(--teal-2)" : "var(--border-g)",
              color: active ? "var(--navy)" : "var(--ink)",
            }}
          >
            {opt.label[lang]}
          </button>
        );
      })}
      <button
        type="button"
        disabled={isPending || multiSelectDraft.length === 0}
        onClick={() => {
          const labels = question.options
            .filter((opt) => multiSelectDraft.includes(opt.value))
            .map((opt) => opt.label[lang]);
          setMultiSelectDraft([]);
          onAnswer(labels);
        }}
        className="mt-1 rounded-lg bg-teal-2 py-3 text-sm font-bold text-navy disabled:opacity-40"
      >
        {continueLabel}
      </button>
    </div>
  );
}

export function DeepDiveChat({
  sessionId,
  lang,
  onComplete,
  onDepartmentAnswered,
  answeredDepartments = [],
  companyTools,
}: {
  sessionId: string;
  lang: EntryLang;
  onComplete?: () => void;
  onDepartmentAnswered?: (department: Department) => void;
  answeredDepartments?: Department[];
  companyTools: CompanyTool[];
}) {
  const t = appDictionary[lang].deepDive;
  const [deptIndex, setDeptIndex] = useState(() => firstUnansweredIndex(answeredDepartments));
  const [qIndex, setQIndex] = useState(0);
  // Only this department's already-answered questions — reset on every
  // department change so history never piles up across the whole session
  // and pushes the active question (the only thing the user must reach)
  // out of view.
  const [history, setHistory] = useState<AnsweredTurn[]>([]);
  const [questionStartedAt, setQuestionStartedAt] = useState(() => new Date().toISOString());
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transitionDept, setTransitionDept] = useState<DepartmentDef | null>(null);
  const [showRedoPicker, setShowRedoPicker] = useState(false);
  const [isRedo, setIsRedo] = useState(false);
  const [justRedid, setJustRedid] = useState<DepartmentDef | null>(null);

  const done = deptIndex >= DEPARTMENTS.length;
  const dept = !done ? DEPARTMENTS[deptIndex] : null;
  const [questions, setQuestions] = useState<DeepDiveQuestion[]>(() =>
    dept ? buildDeepDiveQuestions(dept.key, companyTools, lang) : [],
  );
  const currentQuestion = questions[qIndex] ?? null;

  async function handleAnswer(question: DeepDiveQuestion, selectedLabels: string[]) {
    if (!dept || isPending) return;
    const answerText = selectedLabels.join(", ");

    setErrorMsg(null);
    setIsPending(true);

    try {
      await submitDeepDiveAnswer({
        sessionId,
        department: dept.key,
        questionKey: question.key,
        answerText,
        startedAt: questionStartedAt,
        isFirstQuestionOfRound: qIndex === 0,
      });

      // Manual-work follow-up: only asked when real manual tasks were
      // flagged, so a department with nothing manual never gets asked
      // "how many hours on nothing."
      let activeQuestions = questions;
      if (question.key === "manual_tasks" && !(selectedLabels.length === 1 && selectedLabels[0] === NONE_OPTION.label[lang])) {
        const insertAt = qIndex + 1;
        activeQuestions = [
          ...questions.slice(0, insertAt),
          MANUAL_HOURS_QUESTION,
          MANUAL_HEADCOUNT_QUESTION,
          ...questions.slice(insertAt),
        ];
        setQuestions(activeQuestions);
      }

      const nextQIndex = qIndex + 1;
      if (nextQIndex < activeQuestions.length) {
        setHistory((prev) => [...prev, { question: question.prompt[lang], answer: answerText }]);
        setQIndex(nextQIndex);
        setQuestionStartedAt(new Date().toISOString());
        return;
      }

      const nextDeptIndex = deptIndex + 1;
      onDepartmentAnswered?.(dept.key);

      if (isRedo) {
        setIsRedo(false);
        setJustRedid(dept);
        setQIndex(0);
        setHistory([]);
        setQuestionStartedAt(new Date().toISOString());
        setDeptIndex(DEPARTMENTS.length);
        return;
      }

      if (nextDeptIndex < DEPARTMENTS.length) {
        const nextDept = DEPARTMENTS[nextDeptIndex];
        setTransitionDept(nextDept);
        setTimeout(() => {
          setQIndex(0);
          setHistory([]);
          setQuestionStartedAt(new Date().toISOString());
          setQuestions(buildDeepDiveQuestions(nextDept.key, companyTools, lang));
          setDeptIndex(nextDeptIndex);
          setTransitionDept(null);
        }, 1400);
      } else {
        setQIndex(0);
        setHistory([]);
        setQuestionStartedAt(new Date().toISOString());
        setDeptIndex(nextDeptIndex);
      }
    } catch {
      setErrorMsg(t.sendError);
    } finally {
      setIsPending(false);
    }
  }

  function startRedo(deptKey: Department) {
    const idx = DEPARTMENTS.findIndex((d) => d.key === deptKey);
    if (idx === -1) return;
    setJustRedid(null);
    setIsRedo(true);
    setShowRedoPicker(false);
    setQIndex(0);
    setHistory([]);
    setQuestionStartedAt(new Date().toISOString());
    setQuestions(buildDeepDiveQuestions(deptKey, companyTools, lang));
    setDeptIndex(idx);
  }

  if (done) {
    return (
      <div className="w-full max-w-md text-center xl:max-w-3xl">
        <ProgressDots currentIndex={DEPARTMENTS.length - 1} />
        <div
          className="glass-card rounded-2xl p-8"
          style={{ borderColor: "var(--border-g)" }}
        >
          <ConsoleLabel>{t.badge}</ConsoleLabel>
          <h1 className="mt-3 mb-2 text-xl font-extrabold text-ink">{t.doneTitle}</h1>
          <p className="text-sm text-muted">{t.doneBody}</p>
          {justRedid && (
            <p className="mt-2 text-xs font-bold" style={{ color: "var(--teal-2)" }}>
              {t.redoSavedNote(justRedid.title[lang])}
            </p>
          )}
          {onComplete ? (
            <button
              type="button"
              onClick={onComplete}
              className="mt-6 block w-full rounded-lg bg-teal-2 py-3 text-center font-bold text-navy"
            >
              {t.requestRoadmap}
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="mt-6 block w-full rounded-lg bg-teal-2 py-3 text-center font-bold text-navy"
            >
              {t.backToDashboard}
            </Link>
          )}

          <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--border-g)" }}>
            {!showRedoPicker ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted">{t.redoIntro}</p>
                <form action={startNewRound}>
                  <StartNewRoundButton label={t.startNewRoundCta} />
                </form>
                <button
                  type="button"
                  onClick={() => setShowRedoPicker(true)}
                  className="block w-full rounded-lg border py-3 text-center text-sm font-bold text-ink"
                  style={{ borderColor: "var(--border-g)" }}
                >
                  {t.redoAreaCta}
                </button>
              </div>
            ) : (
              <div className="text-start">
                <p className="mb-2 text-xs text-muted">{t.redoAreaPrompt}</p>
                <div className="flex flex-col gap-2">
                  {DEPARTMENTS.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => startRedo(d.key)}
                      className="rounded-lg border py-2 text-sm font-bold"
                      style={{ borderColor: d.accent, color: d.accent }}
                    >
                      {d.title[lang]}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowRedoPicker(false)}
                  className="mt-2 text-xs font-bold text-muted underline"
                >
                  {t.cancel}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (transitionDept) {
    return (
      <div className="w-full max-w-md text-center xl:max-w-3xl">
        <ProgressDots currentIndex={deptIndex} />
        <div
          className="glass-card flex flex-col items-center gap-3 rounded-2xl p-10"
          style={{ borderColor: transitionDept.accent, borderWidth: 2 }}
        >
          <span
            className="h-2.5 w-2.5 animate-pulse rounded-full"
            style={{ background: transitionDept.accent }}
          />
          <p className="text-xs font-bold uppercase tracking-widest text-muted">{t.movingToLabel}</p>
          <p className="text-lg font-extrabold" style={{ color: transitionDept.accent }}>
            {transitionDept.title[lang]}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md xl:max-w-3xl">
      {!isRedo && <ProgressDots currentIndex={deptIndex} />}
      <div
        className="rounded-2xl border p-6 xl:p-8"
        style={{
          background: "var(--glass)",
          borderRightColor: "var(--border-g)",
          borderBottomColor: "var(--border-g)",
          borderLeftColor: "var(--border-g)",
          borderTopWidth: "3px",
          borderTopStyle: "solid",
          borderTopColor: dept!.accent,
        }}
      >
        <div className="flex items-center justify-between">
          <ConsoleLabel>{isRedo ? t.redoAreaCta : t.badge}</ConsoleLabel>
          <span className="text-xs font-extrabold" style={{ color: dept!.accent }}>
            {dept!.title[lang]}
          </span>
        </div>

        <HistoryPanel turns={history} toggleLabel={t.previousAnswersToggle} />

        {/* Active question — always rendered in full below the (collapsed-by-default) history, never clipped or scrolled past. */}
        <div className="mt-4 flex flex-col gap-3">
          {currentQuestion && (
            <div className="flex max-w-[92%] items-start gap-2">
              <AiAvatar />
              <div
                className="rounded-xl px-3 py-2 text-sm"
                style={{ background: "var(--glass-2)", color: "var(--ink)" }}
              >
                {currentQuestion.prompt[lang]}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {errorMsg && (
            <p className="text-xs font-bold" style={{ color: "var(--gap)" }}>
              {errorMsg}
            </p>
          )}
          {currentQuestion && (
            <QuestionControls
              key={`${dept!.key}-${currentQuestion.key}`}
              question={currentQuestion}
              lang={lang}
              isPending={isPending}
              continueLabel={t.continueCta}
              onAnswer={(labels) => handleAnswer(currentQuestion, labels)}
            />
          )}
          {currentQuestion && (
            <CustomAnswerInput
              key={`custom-${dept!.key}-${currentQuestion.key}`}
              isPending={isPending}
              placeholder={t.customAnswerPlaceholder}
              onAnswer={(text) => handleAnswer(currentQuestion, [text])}
            />
          )}
        </div>
      </div>
    </div>
  );
}
