"use client";

import { useEffect, useRef, useState } from "react";
import { DEPARTMENTS } from "@/lib/assessment/departments";
import { DEEP_DIVE_OPENERS } from "@/lib/deep-dive/questions";
import { ConsoleLabel } from "@/components/ui/console-label";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { Department } from "@/lib/supabase/types";
import { submitInviteResponse } from "./actions";
import { getFollowUpQuestion } from "@/app/deep-dive/[sessionId]/actions";

type ChatMessage = { role: "assistant" | "user"; text: string };

export function InviteAnswerChat({
  token,
  department,
  inviteeName,
  lang,
}: {
  token: string;
  department: Department;
  inviteeName: string | null;
  lang: EntryLang;
}) {
  const t = appDictionary[lang].inviteAnswer;
  const dept = DEPARTMENTS.find((d) => d.key === department)!;

  const [turn, setTurn] = useState<"opening" | "followup">("opening");
  const [done, setDone] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: DEEP_DIVE_OPENERS[department][lang] },
  ]);
  const [questionStartedAt, setQuestionStartedAt] = useState(() => new Date().toISOString());
  const [draft, setDraft] = useState("");
  const [isPending, setIsPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isPending]);

  async function handleSend() {
    const answer = draft.trim();
    if (!answer || isPending) return;

    setDraft("");
    setMessages((prev) => [...prev, { role: "user", text: answer }]);
    setIsPending(true);

    await submitInviteResponse({
      token,
      questionKey: turn,
      answerText: answer,
      startedAt: questionStartedAt,
    });

    if (turn === "opening") {
      const followUp = await getFollowUpQuestion(null, department, answer, lang);
      setMessages((prev) => [...prev, { role: "assistant", text: followUp }]);
      setTurn("followup");
      setQuestionStartedAt(new Date().toISOString());
      setIsPending(false);
      return;
    }

    setIsPending(false);
    setDone(true);
  }

  if (done) {
    return (
      <div
        className="glass-card w-full max-w-md rounded-2xl p-8 text-center"
        style={{ borderColor: "var(--border-g)" }}
      >
        <ConsoleLabel>{t.badge}</ConsoleLabel>
        <h1 className="mt-3 mb-2 text-xl font-extrabold text-ink">{t.doneTitle}</h1>
        <p className="text-sm text-muted">{t.doneBody}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div
        className="rounded-2xl border p-6"
        style={{
          background: "var(--glass)",
          borderColor: "var(--border-g)",
          borderTopWidth: "3px",
          borderTopStyle: "solid",
          borderTopColor: dept.accent,
        }}
      >
        <div className="flex items-center justify-between">
          <ConsoleLabel>{t.badge}</ConsoleLabel>
          <span className="text-xs font-extrabold" style={{ color: dept.accent }}>
            {dept.title[lang]}
          </span>
        </div>

        <p className="mt-3 text-xs text-muted">{t.greeting(inviteeName)}</p>

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
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder={appDictionary[lang].deepDive.placeholder}
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
            {appDictionary[lang].deepDive.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
