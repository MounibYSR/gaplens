"use client";

import { useState } from "react";
import { ProgressDotsRow } from "@/components/scan/progress-dots";
import { SCAN_STEP_COUNT } from "@/components/scan/scan-quiz";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { ToolSummary } from "@/lib/scan/scoring";
import { TOOL_CATALOG, OTHER_TOOL_ID } from "@/lib/assessment/tool-catalog";

type Tool = {
  id: string;
  name: string;
  catalogId: string | null;
  importance: number; // 1-10, higher = closer to the hub
  isConnected: boolean;
  monthlyCost: number | null;
};

export type SavedTool = {
  name: string;
  catalogId: string | null;
  importance: number;
  isConnected: boolean;
  monthlyCost: number | null;
};

type ToolMapDict = (typeof appDictionary)[EntryLang]["toolMap"];

const CENTER = 150;
const HUB_R = 30;
const MAX_R = 130;
const MIN_R = 55;

function radiusFor(importance: number) {
  return MAX_R - ((importance - 1) / 9) * (MAX_R - MIN_R);
}

function nodeRadiusFor(importance: number) {
  return 10 + (importance / 10) * 10;
}

function importanceLabel(importance: number, t: ToolMapDict) {
  if (importance >= 8) return t.importanceHigh;
  if (importance >= 4) return t.importanceMedium;
  return t.importanceLow;
}

function StatusDot({ connected, onClick }: { connected: boolean; onClick?: () => void }) {
  const dot = connected ? (
    <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: "var(--teal-2)" }} />
  ) : (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ border: "2px dashed var(--gold)", background: "transparent" }}
    />
  );
  if (!onClick) return dot;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="toggle connected status"
      className="-m-[17px] shrink-0 p-[17px]"
    >
      {dot}
    </button>
  );
}

export function ToolRelationshipMap({
  lang,
  onComplete,
  onSaveTools,
  progressIndex,
  initialTools,
  onAddTool,
  onUpdateTool,
  onRemoveTool,
  persistent,
}: {
  lang: EntryLang;
  /** Quiz mode only: advances the assessment to the next step. */
  onComplete?: (summary: ToolSummary) => void;
  /** Quiz mode only: bulk-saves the whole list when the user hits Next. */
  onSaveTools?: (tools: SavedTool[]) => void;
  /** Quiz mode only: which step this is, for the progress dots. */
  progressIndex?: number;
  /** Persistent mode only: seeds the map with the company's already-saved tools. */
  initialTools?: Tool[];
  /** Persistent mode only: called immediately when a tool is added; must resolve with its real id. */
  onAddTool?: (tool: SavedTool) => Promise<{ id: string }>;
  /** Persistent mode only: called immediately when importance/connected status changes. */
  onUpdateTool?: (id: string, updates: { importance?: number; isConnected?: boolean }) => Promise<void>;
  /** Persistent mode only: called immediately when a tool is removed. */
  onRemoveTool?: (id: string) => Promise<void>;
  /** Hides the quiz-only progress dots / Next button and saves each action instantly instead. */
  persistent?: boolean;
}) {
  const t = appDictionary[lang].toolMap;
  const [tools, setTools] = useState<Tool[]>(initialTools ?? []);
  const [selectedId, setSelectedId] = useState("");
  const [customName, setCustomName] = useState("");
  const [draftImportance, setDraftImportance] = useState(5);
  const [draftConnected, setDraftConnected] = useState(true);
  const [draftMonthlyCost, setDraftMonthlyCost] = useState("");
  const [note, setNote] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const draftName =
    selectedId === OTHER_TOOL_ID
      ? customName.trim()
      : TOOL_CATALOG.find((tool) => tool.id === selectedId)?.label[lang] ?? "";

  async function addTool() {
    if (!draftName) return;
    setErrorMsg(null);

    const parsedCost = draftMonthlyCost.trim() === "" ? null : Number(draftMonthlyCost);
    const newTool: Tool = {
      id: `${Date.now()}-${tools.length}`,
      name: draftName,
      catalogId: selectedId === OTHER_TOOL_ID ? null : selectedId,
      importance: draftImportance,
      isConnected: draftConnected,
      monthlyCost: parsedCost != null && !Number.isNaN(parsedCost) ? parsedCost : null,
    };

    setTools((prev) => [...prev, newTool]);
    setSelectedId("");
    setCustomName("");
    setDraftImportance(5);
    setDraftConnected(true);
    setDraftMonthlyCost("");

    if (onAddTool) {
      try {
        const saved = await onAddTool({
          name: newTool.name,
          catalogId: newTool.catalogId,
          importance: newTool.importance,
          isConnected: newTool.isConnected,
          monthlyCost: newTool.monthlyCost,
        });
        setTools((prev) => prev.map((x) => (x.id === newTool.id ? { ...x, id: saved.id } : x)));
      } catch {
        setTools((prev) => prev.filter((x) => x.id !== newTool.id));
        setErrorMsg(t.saveError);
      }
    }
  }

  async function removeTool(id: string) {
    setErrorMsg(null);
    const removed = tools.find((x) => x.id === id);
    setTools((prev) => prev.filter((x) => x.id !== id));

    if (onRemoveTool && removed) {
      try {
        await onRemoveTool(id);
      } catch {
        setTools((prev) => [...prev, removed]);
        setErrorMsg(t.saveError);
      }
    }
  }

  async function adjustImportance(id: string, delta: number) {
    const target = tools.find((x) => x.id === id);
    if (!target) return;
    const nextImportance = Math.min(10, Math.max(1, target.importance + delta));
    if (nextImportance === target.importance) return;

    setErrorMsg(null);
    setTools((prev) => prev.map((x) => (x.id === id ? { ...x, importance: nextImportance } : x)));

    if (onUpdateTool) {
      setSavingId(id);
      try {
        await onUpdateTool(id, { importance: nextImportance });
      } catch {
        setTools((prev) => prev.map((x) => (x.id === id ? { ...x, importance: target.importance } : x)));
        setErrorMsg(t.saveError);
      } finally {
        setSavingId(null);
      }
    }
  }

  async function toggleConnected(id: string) {
    const target = tools.find((x) => x.id === id);
    if (!target) return;
    const nextConnected = !target.isConnected;

    setErrorMsg(null);
    setTools((prev) => prev.map((x) => (x.id === id ? { ...x, isConnected: nextConnected } : x)));

    if (onUpdateTool) {
      setSavingId(id);
      try {
        await onUpdateTool(id, { isConnected: nextConnected });
      } catch {
        setTools((prev) => prev.map((x) => (x.id === id ? { ...x, isConnected: target.isConnected } : x)));
        setErrorMsg(t.saveError);
      } finally {
        setSavingId(null);
      }
    }
  }

  function finish() {
    const count = tools.length;
    const isolatedCount = tools.filter((x) => !x.isConnected).length;
    onComplete?.({ count, isolatedRatio: count > 0 ? isolatedCount / count : 0 });
    onSaveTools?.(
      tools.map((x) => ({
        name: x.name,
        catalogId: x.catalogId,
        importance: x.importance,
        isConnected: x.isConnected,
        monthlyCost: x.monthlyCost,
      })),
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div
        className="rounded-2xl border p-6 lg:p-8"
        style={{ background: "var(--glass)", borderColor: "var(--border-g)" }}
      >
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--teal-2)" }}>
          {t.badge}
        </p>
        <h1 className="mt-2 mb-1 text-lg font-extrabold text-ink">{t.title}</h1>
        <p className="mb-6 text-xs text-muted">{t.subtitle}</p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.4fr_0.9fr]">
          {/* LEFT: Tools Added list */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">
              {t.toolsAddedLabel(tools.length)}
            </p>
            {tools.length === 0 ? (
              <p className="text-xs text-muted">{t.noToolsYet}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {tools.map((tool) => (
                  <li
                    key={tool.id}
                    className="rounded-lg border px-3 py-2.5"
                    style={{ borderColor: "var(--border-g)", opacity: savingId === tool.id ? 0.6 : 1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">{tool.name}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {importanceLabel(tool.importance, t)}
                          {tool.monthlyCost != null && (
                            <span className="ltr-num" dir="ltr">
                              {" "}
                              · {tool.monthlyCost}/mo
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 ps-2">
                        <StatusDot connected={tool.isConnected} onClick={persistent ? () => void toggleConnected(tool.id) : undefined} />
                        <button
                          type="button"
                          onClick={() => void removeTool(tool.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-sm font-bold text-muted hover:text-ink"
                          aria-label="remove"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    {persistent && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void adjustImportance(tool.id, -1)}
                          disabled={tool.importance <= 1}
                          className="flex h-6 w-6 items-center justify-center rounded-md border text-xs font-bold text-ink disabled:opacity-30"
                          style={{ borderColor: "var(--border-g)" }}
                          aria-label="decrease importance"
                        >
                          −
                        </button>
                        <span className="ltr-num min-w-8 text-center text-xs text-muted" dir="ltr">
                          {tool.importance}/10
                        </span>
                        <button
                          type="button"
                          onClick={() => void adjustImportance(tool.id, 1)}
                          disabled={tool.importance >= 10}
                          className="flex h-6 w-6 items-center justify-center rounded-md border text-xs font-bold text-ink disabled:opacity-30"
                          style={{ borderColor: "var(--border-g)" }}
                          aria-label="increase importance"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleConnected(tool.id)}
                          className="ms-1 text-xs font-bold underline"
                          style={{ color: tool.isConnected ? "var(--teal-2)" : "var(--gold)" }}
                        >
                          {tool.isConnected ? t.connected : t.disconnected}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {errorMsg && (
              <p className="mt-3 text-xs font-bold" style={{ color: "var(--gap)" }}>
                {errorMsg}
              </p>
            )}
          </div>

          {/* CENTER: node map */}
          <div>
            <svg viewBox="0 0 300 300" className="mx-auto block w-full max-w-sm lg:max-w-none">
              {tools.map((tool, i) => {
                const angle = (i / Math.max(tools.length, 1)) * 2 * Math.PI - Math.PI / 2;
                const r = radiusFor(tool.importance);
                const x = CENTER + r * Math.cos(angle);
                const y = CENTER + r * Math.sin(angle);
                return (
                  <line
                    key={`line-${tool.id}`}
                    x1={CENTER}
                    y1={CENTER}
                    x2={x}
                    y2={y}
                    style={{ stroke: tool.isConnected ? "var(--teal-2)" : "var(--gold)" }}
                    strokeWidth="1.5"
                    strokeDasharray={tool.isConnected ? undefined : "4 3"}
                    opacity="0.7"
                  />
                );
              })}

              {tools.map((tool, i) => {
                const angle = (i / Math.max(tools.length, 1)) * 2 * Math.PI - Math.PI / 2;
                const r = radiusFor(tool.importance);
                const x = CENTER + r * Math.cos(angle);
                const y = CENTER + r * Math.sin(angle);
                const nodeR = nodeRadiusFor(tool.importance);
                return (
                  <g key={tool.id}>
                    <circle
                      cx={x}
                      cy={y}
                      r={nodeR}
                      style={{ fill: "var(--glass-2)" }}
                      stroke={tool.isConnected ? "var(--teal-2)" : "var(--gold)"}
                      strokeWidth="2"
                      strokeDasharray={tool.isConnected ? undefined : "3 2"}
                    />
                    <text
                      x={x}
                      y={y + nodeR + 12}
                      textAnchor="middle"
                      style={{ fill: "var(--ink)", fontSize: "10px" }}
                    >
                      {tool.name.length > 14 ? `${tool.name.slice(0, 13)}…` : tool.name}
                    </text>
                  </g>
                );
              })}

              <circle cx={CENTER} cy={CENTER} r={HUB_R} style={{ fill: "var(--navy)" }} stroke="var(--teal-2)" strokeWidth="2" />
              <text x={CENTER} y={CENTER + 4} textAnchor="middle" style={{ fill: "#fff", fontSize: "11px", fontWeight: 800 }}>
                {t.businessNode}
              </text>
            </svg>

            <div className="mt-4 flex items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--teal-2)" }} />
                {t.connected}
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ border: "2px dashed var(--gold)", background: "transparent" }}
                />
                {t.disconnected}
              </span>
            </div>
          </div>

          {/* RIGHT: controls */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">{t.addToolLabel}</p>
            <div className="flex flex-col gap-3">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm text-ink outline-none"
                style={{ background: "var(--navy)", borderColor: "var(--border-g)" }}
              >
                <option value="" style={{ backgroundColor: "var(--navy)", color: "var(--ink)" }}>
                  {t.selectPlaceholder}
                </option>
                {TOOL_CATALOG.map((tool) => (
                  <option
                    key={tool.id}
                    value={tool.id}
                    style={{ backgroundColor: "var(--navy)", color: "var(--ink)" }}
                  >
                    {tool.label[lang]}
                  </option>
                ))}
                <option value={OTHER_TOOL_ID} style={{ backgroundColor: "var(--navy)", color: "var(--ink)" }}>
                  {t.otherOption}
                </option>
              </select>

              {selectedId === OTHER_TOOL_ID && (
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-ink outline-none"
                  style={{ background: "var(--glass-2)", borderColor: "var(--border-g)" }}
                />
              )}

              <label className="block">
                <span className="mb-1 flex items-center justify-between text-xs text-muted">
                  <span>{t.importance}</span>
                  <span className="ltr-num" dir="ltr">
                    {draftImportance}/10
                  </span>
                </span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={draftImportance}
                  onChange={(e) => setDraftImportance(Number(e.target.value))}
                  className="w-full"
                />
              </label>

              <label className="block">
                <span className="mb-1 flex items-center justify-between text-xs text-muted">
                  <span>{t.monthlyCostLabel}</span>
                  <span>{t.monthlyCostHint}</span>
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={draftMonthlyCost}
                  onChange={(e) => setDraftMonthlyCost(e.target.value)}
                  placeholder={t.monthlyCostPlaceholder}
                  className="ltr-num w-full rounded-lg border px-3 py-2 text-sm text-ink outline-none"
                  dir="ltr"
                  style={{ background: "var(--glass-2)", borderColor: "var(--border-g)" }}
                />
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDraftConnected(true)}
                  className="flex-1 rounded-lg border py-2 text-xs font-bold transition-colors"
                  style={{
                    background: draftConnected ? "var(--teal-2)" : "var(--glass-2)",
                    borderColor: draftConnected ? "var(--teal-2)" : "var(--border-g)",
                    color: draftConnected ? "var(--navy)" : "var(--ink)",
                  }}
                >
                  {t.connected}
                </button>
                <button
                  type="button"
                  onClick={() => setDraftConnected(false)}
                  className="flex-1 rounded-lg border py-2 text-xs font-bold transition-colors"
                  style={{
                    background: !draftConnected ? "var(--gold)" : "var(--glass-2)",
                    borderColor: !draftConnected ? "var(--gold)" : "var(--border-g)",
                    color: !draftConnected ? "var(--navy)" : "var(--ink)",
                  }}
                >
                  {t.disconnected}
                </button>
              </div>

              <button
                type="button"
                disabled={!draftName}
                onClick={() => void addTool()}
                className="w-full rounded-lg bg-teal-2 py-2.5 text-sm font-bold text-navy disabled:opacity-40"
              >
                {t.addTool}
              </button>

              {!persistent && (
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t.notePlaceholder}
                  rows={3}
                  className="w-full resize-none rounded-lg border px-3 py-2 text-sm text-ink outline-none"
                  style={{ background: "var(--glass-2)", borderColor: "var(--border-g)" }}
                />
              )}
            </div>
          </div>
        </div>

        <div
          className="mt-8 flex items-center justify-between gap-4 border-t pt-6"
          style={{ borderColor: "var(--border-g)" }}
        >
          {persistent ? (
            <p className="text-xs text-muted">{t.autosaveNote}</p>
          ) : (
            <>
              <ProgressDotsRow progressIndex={progressIndex ?? 0} total={SCAN_STEP_COUNT} />
              <button
                type="button"
                onClick={finish}
                className="shrink-0 rounded-lg bg-teal-2 px-6 py-2.5 text-sm font-bold text-navy"
              >
                {t.next}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
