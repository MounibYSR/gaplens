"use client";

import { useEffect, useRef, useState } from "react";
import { ConsoleLabel } from "@/components/ui/console-label";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { RoadmapGap } from "@/lib/roadmap/build-prompt";
import type { FreeformChatMessage } from "@/lib/freeform-chat/types";
import { suggestedTopics } from "@/lib/freeform-chat/topics";
import { sendFreeformMessage, requestAiInitiative } from "@/app/dashboard/freeform-chat-actions";

type Message = { role: "user" | "assistant"; content: string };

export function FreeformChat({
  sessionId,
  lang,
  gaps,
  initialMessages,
}: {
  sessionId: string;
  lang: EntryLang;
  gaps: RoadmapGap[];
  initialMessages: FreeformChatMessage[];
}) {
  const t = appDictionary[lang].freeformChat;
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map((m) => ({ role: m.role, content: m.content })),
  );
  const [draft, setDraft] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [topicOffset, setTopicOffset] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isPending]);

  const topics = suggestedTopics(gaps, lang, topicOffset, 3);

  function errorText(kind: "rate_limited" | "ai_failed") {
    return kind === "rate_limited" ? t.rateLimited : t.sendError;
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    setDraft("");
    setErrorMsg(null);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setIsPending(true);

    try {
      const result = await sendFreeformMessage({ sessionId, text: trimmed, lang });
      if ("error" in result) {
        setErrorMsg(errorText(result.error));
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
      setTopicOffset((o) => o + 1);
    } catch {
      setErrorMsg(t.sendError);
    } finally {
      setIsPending(false);
    }
  }

  async function askMeSomething() {
    if (isPending) return;
    setErrorMsg(null);
    setIsPending(true);

    try {
      const result = await requestAiInitiative({ sessionId, lang });
      if ("error" in result) {
        setErrorMsg(errorText(result.error));
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
      setTopicOffset((o) => o + 1);
    } catch {
      setErrorMsg(t.sendError);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="w-full max-w-md xl:max-w-3xl">
      <div className="rounded-2xl border p-6 xl:p-8" style={{ background: "var(--glass)", borderColor: "var(--border-g)" }}>
        <div className="flex items-center justify-between">
          <ConsoleLabel>{t.badge}</ConsoleLabel>
          <span className="text-xs font-extrabold" style={{ color: "var(--teal-2)" }}>
            {t.title}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted">{t.subtitle}</p>

        <div className="mt-4 flex flex-col gap-3">
          {messages.length === 0 && <p className="text-xs text-muted">{t.emptyState}</p>}
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
              {m.content}
            </div>
          ))}
          {isPending && (
            <div
              className="max-w-[85%] self-start rounded-xl px-3 py-2 text-sm"
              style={{ background: "var(--glass-2)", color: "var(--muted)" }}
            >
              {t.thinking}
            </div>
          )}
          <div ref={bottomRef} style={{ scrollMarginBottom: "180px" }} />
        </div>

        {topics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {topics.map((topic, i) => (
              <button
                key={i}
                type="button"
                disabled={isPending}
                onClick={() => send(topic)}
                className="rounded-full border px-3 py-1 text-xs font-bold disabled:opacity-60"
                style={{ borderColor: "var(--border-g)", color: "var(--ink)", background: "var(--glass-2)" }}
              >
                {topic}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => textareaRef.current?.focus()}
            className="flex-1 rounded-lg border py-2 text-xs font-bold text-ink"
            style={{ borderColor: "var(--border-g)" }}
          >
            {t.youAskMe}
          </button>
          <button
            type="button"
            onClick={askMeSomething}
            disabled={isPending}
            className="flex-1 rounded-lg border py-2 text-xs font-bold text-ink disabled:opacity-60"
            style={{ borderColor: "var(--border-g)" }}
          >
            {t.askMeSomething}
          </button>
        </div>

        <div
          className="sticky bottom-3 z-10 mt-2 flex flex-col gap-2 rounded-xl border p-3 backdrop-blur-md"
          style={{ background: "var(--modal-bg)", borderColor: "var(--border-g)" }}
        >
          {errorMsg && (
            <p className="text-xs font-bold" style={{ color: "var(--gap)" }}>
              {errorMsg}
            </p>
          )}
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(draft);
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
            onClick={() => send(draft)}
            className="rounded-lg bg-teal-2 py-2.5 text-sm font-bold text-navy disabled:opacity-60"
          >
            {t.send}
          </button>
        </div>
      </div>
    </div>
  );
}
