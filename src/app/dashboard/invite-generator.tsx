"use client";

import { useState, useTransition } from "react";
import { DEPARTMENTS } from "@/lib/assessment/departments";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { Department } from "@/lib/supabase/types";
import { createInviteLink } from "./actions";

type ExistingInvite = {
  id: string;
  department: Department;
  token: string;
  invitee_name: string | null;
  status: string;
};

function StatusPill({ status, t }: { status: string; t: (typeof appDictionary)[EntryLang]["dashboard"] }) {
  const isAnswered = status === "accepted";
  return (
    <span
      className="text-[11px] font-bold"
      style={{ color: isAnswered ? "var(--teal-2)" : "var(--gold)" }}
    >
      {isAnswered ? t.inviteStatusAnswered : t.inviteStatusPending}
    </span>
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
              className="w-full rounded-lg border px-3 py-2 text-sm text-ink outline-none"
              style={{ background: "var(--navy)", borderColor: "var(--border-g)" }}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.key} value={d.key} style={{ backgroundColor: "var(--navy)", color: "var(--ink)" }}>
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
            className="rounded-lg bg-teal-2 py-2.5 text-sm font-bold text-navy disabled:opacity-60"
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
              {existingInvites.map((invite) => {
                const dept = DEPARTMENTS.find((d) => d.key === invite.department);
                return (
                  <li key={invite.id} className="flex items-center justify-between text-xs">
                    <span className="text-ink">
                      {dept?.title[lang]}
                      {invite.invitee_name ? ` — ${invite.invitee_name}` : ""}
                    </span>
                    <button type="button" onClick={() => copy(invite.token)} className="text-teal-2">
                      {t.inviteCopy}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="hidden xl:flex xl:flex-col xl:gap-2">
              <div
                className="grid gap-3 px-1 text-[10.5px] text-muted"
                style={{ gridTemplateColumns: "1fr 1fr 90px 70px" }}
              >
                <span>{t.inviteAreaLabel}</span>
                <span>{t.inviteSentToLabel}</span>
                <span>{t.inviteStatusLabel}</span>
                <span />
              </div>
              {existingInvites.map((invite) => {
                const dept = DEPARTMENTS.find((d) => d.key === invite.department);
                return (
                  <div
                    key={invite.id}
                    className="grid items-center gap-3 rounded-lg px-3 py-2.5"
                    style={{ gridTemplateColumns: "1fr 1fr 90px 70px", background: "var(--glass-2)" }}
                  >
                    <span className="truncate text-xs font-bold text-ink">{dept?.title[lang]}</span>
                    <span className="truncate text-xs text-muted">{invite.invitee_name || "—"}</span>
                    <StatusPill status={invite.status} t={t} />
                    <button type="button" onClick={() => copy(invite.token)} className="text-xs font-bold text-teal-2">
                      {t.inviteCopy}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
