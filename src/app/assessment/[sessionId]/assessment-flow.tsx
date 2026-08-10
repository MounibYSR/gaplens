"use client";

import { ScanQuiz } from "@/components/scan/scan-quiz";
import { ToolRelationshipMap } from "@/components/assessment/tool-relationship-map";
import { saveOverallScan, saveSessionTools } from "./actions";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { TeaserAnswers } from "@/lib/scan/scoring";

export function AssessmentFlow({
  sessionId,
  lang,
}: {
  sessionId: string;
  lang: EntryLang;
}) {
  return (
    <ScanQuiz
      lang={lang}
      continueHref="/dashboard"
      renderToolsStep={(onComplete, progressIndex) => (
        <ToolRelationshipMap
          lang={lang}
          onComplete={onComplete}
          onSaveTools={(tools) => void saveSessionTools(sessionId, tools)}
          progressIndex={progressIndex}
        />
      )}
      onFinish={(answers: TeaserAnswers, gap: number) => {
        void saveOverallScan(sessionId, answers, gap);
      }}
    />
  );
}
