"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { DEPARTMENTS } from "@/lib/assessment/departments";
import type { DepartmentDef } from "@/lib/assessment/departments";
import { DEEP_DIVE_OPENERS } from "@/lib/deep-dive/questions";
import { ProgressDots } from "@/components/assessment/progress-dots";
import { ConsoleLabel } from "@/components/ui/console-label";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { Department } from "@/lib/supabase/types";
import { submitDeepDiveAnswer, getFollowUpQuestion } from "./actions";
import { startNewRound } from "@/app/dashboard/round-actions";

type ChatMessage = { role: "assistant" | "user"; text: string };

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
      className="block w-full rounded-lg border py-2.5 text-center text-sm font-bold text-ink disabled:opacity-60"
      style={{ borderColor: "var(--border-g)" }}
    >
      {pending ? "…" : label}
    </button>
  );
}

export function DeepDiveChat({
  sessionId,
  lang,
  onComplete,
  onDepartmentAnswered,
  answeredDepartments = [],
}: {
  sessionId: string;
  lang: EntryLang;
  onComplete?: () => void;
  onDepartmentAnswered?: (department: Department) => void;
  answeredDepartments?: Department[];
}) {
  const t = appDictionary[lang].deepDive;
  const [deptIndex, setDeptIndex] = useState(() => firstUnansweredIndex(answeredDepartments));
  const [turn, setTurn] = useState<"opening" | "followup">("opening");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const startIndex = firstUnansweredIndex(answeredDepartments);
    return startIndex < DEPARTMENTS.length
      ? [{ role: "assistant", text: DEEP_DIVE_OPENERS[DEPARTMENTS[startIndex].key][lang] }]
      : [];
  });
  const [questionStartedAt, setQuestionStartedAt] = useState(() => new Date().toISOString());
  const [draft, setDraft] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transitionDept, setTransitionDept] = useState<DepartmentDef | null>(null);
  const [showRedoPicker, setShowRedoPicker] = useState(false);
  const [isRedo, setIsRedo] = useState(false);
  const [justRedid, setJustRedid] = useState<DepartmentDef | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isPending]);

  const done = deptIndex >= DEPARTMENTS.length;
  const dept = !done ? DEPARTMENTS[deptIndex] : null;

  async function handleSend() {
    const answer = draft.trim();
    if (!answer || !dept || isPending) return;

    setDraft("");
    setErrorMsg(null);
    setMessages((prev) => [...prev, { role: "user", text: answer }]);
    setIsPending(true);

    try {
      await submitDeepDiveAnswer({
        sessionId,
        department: dept.key,
        questionKey: turn,
        answerText: answer,
        startedAt: questionStartedAt,
      });

      if (turn === "opening") {
        const previousQuestions = messages.filter((m) => m.role === "assistant").map((m) => m.text);
        const followUp = await getFollowUpQuestion(sessionId, dept.key, answer, lang, previousQuestions);
        setMessages((prev) => [...prev, { role: "assistant", text: followUp }]);
        setTurn("followup");
        setQuestionStartedAt(new Date().toISOString());
        return;
      }

      const nextIndex = deptIndex + 1;
      onDepartmentAnswered?.(dept.key);

      if (isRedo) {
        setIsRedo(false);
        setJustRedid(dept);
        setTurn("opening");
        setQuestionStartedAt(new Date().toISOString());
        setDeptIndex(DEPARTMENTS.length);
        return;
      }

      if (nextIndex < DEPARTMENTS.length) {
        const nextDept = DEPARTMENTS[nextIndex];
        setTransitionDept(nextDept);
        setTimeout(() => {
          setTurn("opening");
          setQuestionStartedAt(new Date().toISOString());
          setDeptIndex(nextIndex);
          setMessages((prev) => [...prev, { role: "assistant", text: DEEP_DIVE_OPENERS[nextDept.key][lang] }]);
          setTransitionDept(null);
        }, 1400);
      } else {
        setTurn("opening");
        setQuestionStartedAt(new Date().toISOString());
        setDeptIndex(nextIndex);
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
    setTurn("opening");
    setQuestionStartedAt(new Date().toISOString());
    setDeptIndex(idx);
    setMessages([{ role: "assistant", text: DEEP_DIVE_OPENERS[deptKey][lang] }]);
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
              className="mt-6 block w-full rounded-lg bg-teal-2 py-2.5 text-center font-bold text-navy"
            >
              {t.requestRoadmap}
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="mt-6 block w-full rounded-lg bg-teal-2 py-2.5 text-center font-bold text-navy"
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
                  className="block w-full rounded-lg border py-2.5 text-center text-sm font-bold text-ink"
                  style={{ borderColor: "var(--border-g)" }}
                >
                  {t.redoAreaCta}
                </button>
              </div>
            ) : (
              <div className="text-start">
                <p className="mb-2 text-xs text-muted">{t.redoAreaPrompt}</p>
                <div className="flex flex-col gap-1.5">
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

        <div className="mt-4 flex flex-col gap-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className="max-w-[85%] rounded-xl px-3 py-2 text-sm"
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? "var(--teal-2)" : "var(--glass-2)",
                color: m.role === "user" ? "var(--navy)" : "var(--ink)",
              }}
            >
              {m.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {errorMsg && (
            <p className="text-xs font-bold" style={{ color: "var(--gap)" }}>
              {errorMsg}
            </p>
          )}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder={t.placeholder}
            rows={3}
            disabled={isPending}
            className="w-full resize-none rounded-lg border px-3 py-2 text-sm text-ink outline-none disabled:opacity-60"
            style={{ background: "var(--glass-2)", borderColor: "var(--border-g)" }}
          />
          <button
            type="button"
            disabled={isPending || !draft.trim()}
            onClick={handleSend}
            className="rounded-lg bg-teal-2 py-2.5 text-sm font-bold text-navy disabled:opacity-60"
          >
            {t.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
