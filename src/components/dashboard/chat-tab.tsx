"use client";

import { useState } from "react";
import { DeepDiveChat } from "@/app/deep-dive/[sessionId]/deep-dive-chat";
import { FreeformChat } from "@/components/dashboard/freeform-chat";
import { VisualIdentityPanel } from "@/components/dashboard/visual-identity-panel";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { Department } from "@/lib/supabase/types";
import type { RoadmapGap } from "@/lib/roadmap/build-prompt";
import type { FreeformChatMessage } from "@/lib/freeform-chat/types";

type Mode = "structured" | "freeform" | "visual_identity";

export function ChatTab({
  sessionId,
  lang,
  answeredDepartments,
  onDepartmentAnswered,
  onComplete,
  gaps,
  initialFreeformMessages,
}: {
  sessionId: string;
  lang: EntryLang;
  answeredDepartments: Department[];
  onDepartmentAnswered: (department: Department) => void;
  onComplete: () => void;
  gaps: RoadmapGap[];
  initialFreeformMessages: FreeformChatMessage[];
}) {
  const [mode, setMode] = useState<Mode>("structured");
  const t = appDictionary[lang].chatTab;

  const MODES: { key: Mode; label: string }[] = [
    { key: "structured", label: t.structuredLabel },
    { key: "freeform", label: t.freeformLabel },
    { key: "visual_identity", label: t.visualIdentityLabel },
  ];

  return (
    <div className="w-full">
      <div className="mx-auto mb-4 w-full max-w-md xl:max-w-3xl">
        <div
          className="flex gap-1 overflow-x-auto rounded-full border p-1"
          style={{ borderColor: "var(--border-g)", background: "var(--glass-2)" }}
        >
          {MODES.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setMode(item.key)}
              className="shrink-0 rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors"
              style={{
                background: mode === item.key ? "var(--teal-2)" : "transparent",
                color: mode === item.key ? "var(--navy)" : "var(--ink)",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center">
        {mode === "structured" && (
          <DeepDiveChat
            sessionId={sessionId}
            lang={lang}
            answeredDepartments={answeredDepartments}
            onDepartmentAnswered={onDepartmentAnswered}
            onComplete={onComplete}
          />
        )}
        {mode === "freeform" && (
          <FreeformChat sessionId={sessionId} lang={lang} gaps={gaps} initialMessages={initialFreeformMessages} />
        )}
        {mode === "visual_identity" && <VisualIdentityPanel sessionId={sessionId} lang={lang} />}
      </div>
    </div>
  );
}
