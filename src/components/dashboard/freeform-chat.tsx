"use client";

import { useEffect, useRef, useState } from "react";
import { ConsoleLabel } from "@/components/ui/console-label";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { RoadmapGap } from "@/lib/roadmap/build-prompt";
import type { FreeformChatMessage } from "@/lib/freeform-chat/types";
import { suggestedTopics } from "@/lib/freeform-chat/topics";
import { sendFreeformMessage, requestAiInitiative } from "@/app/dashboard/freeform-chat-actions";
import { MonitorIcon, InfoIcon } from "@/components/ui/stat-icons";

function topicIcon(label: string) {
  return /tech|tool/i.test(label) ? <MonitorIcon size={14} /> : <InfoIcon size={14} />;
}

// Not parsed out of the AI's reply text (fragile) — a reliable client-side
// signal instead: no Visual Identity data yet, plus either a real mention
// of their online presence or the conversation running long enough that
// it's worth surfacing on its own.
const VISUAL_IDENTITY_KEYWORDS = /website|instagram|social media|انستقرام|انستغرام|موقع/i;

type Message = { role: "user" | "assistant"; content: string };

export function FreeformChat({
  sessionId,
  lang,
  gaps,
  initialMessages,
  hasVisualIdentityData,
  onSwitchToVisualIdentity,
}: {
  sessionId: string;
  lang: EntryLang;
  gaps: RoadmapGap[];
  initialMessages: FreeformChatMessage[];
  hasVisualIdentityData: boolean;
  onSwitchToVisualIdentity: () => void;
}) {
  const t = appDictionary[lang].freeformChat;
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map((m) => ({ role: m.role, content: m.content })),
  );
  const [draft, setDraft] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [topicOffset, setTopicOffset] = useState(0);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isPending]);

  const topics = suggestedTopics(gaps, lang, topicOffset, 3);
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const showVisualIdentityNudge =
    !hasVisualIdentityData &&
    !nudgeDismissed &&
    (messages.length >= 4 || VISUAL_IDENTITY_KEYWORDS.test(lastUserMessage));

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

        {topics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {topics.map((topic, i) => (
              <button
                key={i}
                type="button"
                disabled={isPending}
                onClick={() => send(topic.message)}
                className="flex items-center gap-2 rounded-full border px-3 py-2 text-xs disabled:opacity-60"
                style={{ borderColor: "var(--border-g)", color: "var(--muted)", background: "var(--glass)" }}
              >
                <span style={{ color: "var(--teal-2)" }}>{topicIcon(topic.label)}</span>
                <span className="max-w-40 truncate">{topic.label}</span>
              </button>
            ))}
          </div>
        )}

        {showVisualIdentityNudge && (
          <div
            className="mt-3 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs"
            style={{ borderColor: "var(--border-elevated)", background: "var(--glass-2)" }}
          >
            <span className="text-muted">{t.visualIdentityNudgeText}</span>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={onSwitchToVisualIdentity}
                className="rounded-lg px-3 py-2 text-xs font-bold text-navy"
                style={{ background: "var(--teal-2)" }}
              >
                {t.goToVisualIdentity}
              </button>
              <button
                type="button"
                onClick={() => setNudgeDismissed(true)}
                aria-label={t.dismissNudge}
                className="text-muted"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div
          className="sticky bottom-3 z-10 mt-4 flex flex-col gap-3 rounded-2xl border p-6 backdrop-blur-md"
          style={{ background: "var(--modal-bg)", borderColor: "var(--border-g)" }}
        >
          {errorMsg && (
            <p
              className="rounded-lg border px-3 py-2 text-xs font-bold"
              style={{ color: "var(--gap)", borderColor: "var(--gap)", background: "rgba(229, 72, 77, 0.1)" }}
            >
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
            className="rounded-lg bg-teal-2 py-3 text-sm font-bold text-navy disabled:opacity-60"
          >
            {t.send}
          </button>
        </div>
      </div>
    </div>
  );
}
