"use client";

import { ToolRelationshipMap } from "@/components/assessment/tool-relationship-map";
import { ConsoleLabel } from "@/components/ui/console-label";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import { addCompanyTool, updateCompanyTool, deleteCompanyTool, type CompanyTool } from "@/app/dashboard/tool-map-actions";

export function ToolMapSection({
  lang,
  companyId,
  initialTools,
}: {
  lang: EntryLang;
  companyId: string;
  initialTools: CompanyTool[];
}) {
  const t = appDictionary[lang].toolMap;

  return (
    <div className="w-full max-w-md xl:max-w-6xl">
      <ConsoleLabel>{t.badge}</ConsoleLabel>
      <h1 className="mt-2 mb-1 text-xl font-extrabold text-ink">{t.dashboardTitle}</h1>
      <p className="mb-6 text-sm text-muted">{t.dashboardSubtitle}</p>

      <ToolRelationshipMap
        lang={lang}
        persistent
        initialTools={initialTools.map((tool) => ({
          id: tool.id,
          name: tool.name,
          catalogId: tool.catalogId,
          importance: tool.importance,
          isConnected: tool.isConnected,
          monthlyCost: tool.monthlyCost,
        }))}
        onAddTool={(tool) => addCompanyTool({ companyId, ...tool })}
        onUpdateTool={(toolId, updates) => updateCompanyTool({ companyId, toolId, ...updates })}
        onRemoveTool={(toolId) => deleteCompanyTool({ companyId, toolId })}
      />
    </div>
  );
}
