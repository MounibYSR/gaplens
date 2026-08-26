"use client";

import { useState, useTransition } from "react";
import { DEPARTMENTS } from "@/lib/assessment/departments";
import { DEEP_DIVE_OPENERS } from "@/lib/deep-dive/questions";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { Department } from "@/lib/supabase/types";
import { DepartmentIcon } from "@/components/ui/department-icon";
import { createInviteLink, getInviteResponses } from "./actions";

type ExistingInvite = {
  id: string;
  department: Department;
  token: string;
  invitee_name: string | null;
  status: string;
};

type InviteResponse = { question_key: string; answer_text: string; answered_at: string };

function StatusPill({ status, t }: { status: string; t: (typeof appDictionary)[EntryLang]["dashboard"] }) {
  const isAnswered = status === "accepted";
  return (
    <span
      className="text-xs font-bold"
      style={{ color: isAnswered ? "var(--teal-2)" : "var(--gold)" }}
    >
      {isAnswered ? t.inviteStatusAnswered : t.inviteStatusPending}
    </span>
  );
}

function questionLabel(department: Department, questionKey: string, lang: EntryLang, t: (typeof appDictionary)[EntryLang]["dashboard"]) {
  if (questionKey === "opening") return DEEP_DIVE_OPENERS[department][lang];
  return t.inviteFollowUpLabel;
}

function DepartmentBadge({ department, lang }: { department: Department; lang: EntryLang }) {
  const dept = DEPARTMENTS.find((d) => d.key === department);
  if (!dept) return null;
  return (
    <span
      className="flex w-fit items-center gap-2 rounded-full border px-2 py-1 text-xs font-bold"
      style={{ borderColor: dept.accent, color: dept.accent }}
    >
      <DepartmentIcon department={dept} size={11} />
      {dept.title[lang]}
    </span>
  );
}

function AnswersPanel({
  invite,
  lang,
  t,
}: {
  invite: ExistingInvite;
  lang: EntryLang;
  t: (typeof appDictionary)[EntryLang]["dashboard"];
}) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<InviteResponse[] | null>(null);
  const [isPending, startTransition] = useTransition();

  if (invite.status !== "accepted") return null;

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (answers === null) {
      startTransition(async () => {
        const data = await getInviteResponses(invite.id);
        setAnswers(data);
      });
    }
  }

  return (
    <div className="col-span-full">
      <button type="button" onClick={toggle} className="text-xs font-bold underline" style={{ color: "var(--teal-2)" }}>
        {open ? t.hideAnswers : t.viewAnswers}
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-2 rounded-lg p-3" style={{ background: "var(--navy)" }}>
          {isPending || answers === null ? (
            <p className="text-xs text-muted">{t.loadingAnswers}</p>
          ) : answers.length === 0 ? (
            <p className="text-xs text-muted">{t.noLinks}</p>
          ) : (
            answers.map((a, i) => (
              <div key={i}>
                <p className="text-xs font-bold text-muted">{questionLabel(invite.department, a.question_key, lang, t)}</p>
                <p className="text-xs text-ink">{a.answer_text}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function InviteGenerator({
  sessionId,
  existingInvites,
  lang,
  origin,
}: {
  sessionId: string;
  existingInvites: ExistingInvite[];
  lang: EntryLang;
  origin: string;
}) {
  const t = appDictionary[lang].dashboard;
  const [department, setDepartment] = useState<Department>(DEPARTMENTS[0].key);
  const [name, setName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function generate() {
    startTransition(async () => {
      const token = await createInviteLink(sessionId, department, name);
      setNewToken(token);
      setName("");
      setCopied(false);
    });
  }

  function copy(token: string) {
    navigator.clipboard.writeText(`${origin}/answer/${token}`);
    setCopied(true);
  }

  return (
    <>
      <div
        className="glass-card rounded-2xl p-6"
        style={{ borderColor: "var(--border-g)" }}
      >
        <h3 className="text-sm font-extrabold text-ink">{t.inviteTitle}</h3>
        <p className="mt-1 text-xs text-muted">{t.inviteSubtitle}</p>

        <div className="mt-4 flex flex-col gap-3">
          <label className="block">
            <span className="mb-1 block text-xs text-muted">{t.inviteAreaLabel}</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as Department)}
              className="w-full rounded-lg border px-3 py-2 text-sm font-bold outline-none"
              style={{
                background: "var(--navy)",
                borderColor: "var(--border-g)",
                color: DEPARTMENTS.find((d) => d.key === department)?.accent,
              }}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.key} value={d.key} style={{ backgroundColor: "var(--navy)", color: d.accent }}>
                  {d.title[lang]}
                </option>
              ))}
            </select>
          </label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.inviteNamePlaceholder}
            className="w-full rounded-lg border px-3 py-2 text-sm text-ink outline-none"
            style={{ background: "var(--glass-2)", borderColor: "var(--border-g)" }}
          />

          <button
            type="button"
            disabled={isPending}
            onClick={generate}
            className="rounded-lg bg-teal-2 py-3 text-sm font-bold text-navy disabled:opacity-60"
          >
            {t.inviteGenerate}
          </button>

          {newToken && (
            <button
              type="button"
              onClick={() => copy(newToken)}
              className="rounded-lg border py-2 text-sm font-bold text-teal-2"
              style={{ borderColor: "var(--teal-2)" }}
            >
              {copied ? t.inviteCopied : t.inviteCopy}
            </button>
          )}
        </div>
      </div>

      <div
        className="glass-card mt-4 rounded-2xl p-6 xl:mt-0"
        style={{ borderColor: "var(--border-g)" }}
      >
        <p className="mb-3 text-xs font-bold text-muted xl:hidden">{t.existingLinks}</p>
        <p
          className="mb-3 hidden text-xs font-extrabold uppercase tracking-widest xl:block"
          style={{ color: "var(--teal-2)" }}
        >
          {t.existingLinksCount(existingInvites.length)}
        </p>

        {existingInvites.length === 0 ? (
          <p className="text-xs text-muted">{t.noLinks}</p>
        ) : (
          <>
            <ul className="flex flex-col gap-2 xl:hidden">
              {existingInvites.map((invite) => (
                <li key={invite.id} className="rounded-lg p-2" style={{ background: "var(--glass-2)" }}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      <DepartmentBadge department={invite.department} lang={lang} />
                      {invite.invitee_name && <span className="truncate text-ink">{invite.invitee_name}</span>}
                    </div>
                    <button type="button" onClick={() => copy(invite.token)} className="-m-2 shrink-0 p-2 text-teal-2">
                      {t.inviteCopy}
                    </button>
                  </div>
                  <div className="mt-1">
                    <AnswersPanel invite={invite} lang={lang} t={t} />
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden xl:flex xl:flex-col xl:gap-2">
              <div
                className="grid gap-3 px-1 text-xs text-muted"
                style={{ gridTemplateColumns: "1fr 1fr 90px 70px" }}
              >
                <span>{t.inviteAreaLabel}</span>
                <span>{t.inviteSentToLabel}</span>
                <span>{t.inviteStatusLabel}</span>
                <span />
              </div>
              {existingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="grid items-start gap-3 rounded-lg px-3 py-3"
                  style={{ gridTemplateColumns: "1fr 1fr 90px 70px", background: "var(--glass-2)" }}
                >
                  <DepartmentBadge department={invite.department} lang={lang} />
                  <span className="truncate text-xs text-muted">{invite.invitee_name || "—"}</span>
                  <StatusPill status={invite.status} t={t} />
                  <button type="button" onClick={() => copy(invite.token)} className="-m-2 p-2 text-xs font-bold text-teal-2">
                    {t.inviteCopy}
                  </button>
                  <AnswersPanel invite={invite} lang={lang} t={t} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
