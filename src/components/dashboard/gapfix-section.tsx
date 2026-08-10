import { AdvisorPanel } from "@/app/advisor/[sessionId]/advisor-panel";
import { FeatureInterestCard } from "@/components/dashboard/feature-interest-card";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { ResolutionPath } from "@/lib/supabase/types";

export function GapFixSection({
  sessionId,
  companyId,
  gapTitle,
  gap,
  insight,
  alreadyChosen,
  lang,
}: {
  sessionId: string;
  companyId: string;
  gapTitle: string;
  gap: number;
  insight: string;
  alreadyChosen: ResolutionPath | null;
  lang: EntryLang;
}) {
  return (
    <div className="w-full max-w-md">
      <AdvisorPanel
        sessionId={sessionId}
        gapTitle={gapTitle}
        gap={gap}
        insight={insight}
        alreadyChosen={alreadyChosen}
        lang={lang}
        embedded
      />

      <FeatureInterestCard lang={lang} companyId={companyId} />
    </div>
  );
}
