"use client";

import { useRef, useState } from "react";
import { ConsoleLabel } from "@/components/ui/console-label";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { RoadmapGap } from "@/lib/roadmap/build-prompt";
import type { VisualSourceTag } from "@/lib/visual-identity/system-prompt";
import { runVisualIdentityConsultation, type VisualIdentityError } from "@/app/dashboard/visual-identity-actions";

const PRIORITY_COLOR: Record<RoadmapGap["priority"], string> = {
  high: "var(--gap)",
  medium: "var(--gold)",
  low: "var(--healthy)",
};

type StagedImage = {
  id: string;
  file: File;
  previewUrl: string;
  source: VisualSourceTag | "";
};

export function VisualIdentityPanel({ sessionId, lang }: { sessionId: string; lang: EntryLang }) {
  const t = appDictionary[lang].visualIdentity;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SOURCE_OPTIONS: { value: VisualSourceTag; label: string }[] = [
    { value: "website", label: t.sourceWebsite },
    { value: "instagram", label: t.sourceInstagram },
    { value: "logo", label: t.sourceLogo },
    { value: "other", label: t.sourceOther },
  ];

  const [images, setImages] = useState<StagedImage[]>([]);
  const [gaps, setGaps] = useState<RoadmapGap[] | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function errorText(kind: VisualIdentityError) {
    switch (kind) {
      case "rate_limited":
        return t.rateLimited;
      case "no_images":
        return t.noImages;
      case "too_many_images":
        return t.tooManyImages;
      case "invalid_image":
        return t.invalidImage;
      case "missing_source":
        return t.missingSource;
      default:
        return t.genericError;
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;
    setImages((prev) => [
      ...prev,
      ...picked.map((file, i) => ({
        id: `${Date.now()}-${i}`,
        file,
        previewUrl: URL.createObjectURL(file),
        source: "" as const,
      })),
    ]);
    setGaps(null);
    setErrorMsg(null);
    e.target.value = "";
  }

  function setImageSource(id: string, source: VisualSourceTag) {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, source } : img)));
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  const allTagged = images.length > 0 && images.every((img) => img.source !== "");

  async function run() {
    if (!allTagged || isPending) return;
    setIsPending(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.set("sessionId", sessionId);
      formData.set("lang", lang);
      for (const img of images) {
        formData.append("images", img.file);
        formData.append("sources", img.source);
      }

      const result = await runVisualIdentityConsultation(formData);
      if ("error" in result) {
        setErrorMsg(errorText(result.error));
        return;
      }
      setGaps(result.gaps);
    } catch {
      setErrorMsg(t.genericError);
    } finally {
      setIsPending(false);
    }
  }

  const layer1Gaps = gaps?.filter((g) => g.sub_category !== "cross_channel") ?? [];
  const layer2Gaps = gaps?.filter((g) => g.sub_category === "cross_channel") ?? [];

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

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mt-4 flex flex-col gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="flex items-center gap-3 rounded-lg border p-2"
              style={{ borderColor: "var(--border-g)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.previewUrl} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
              <select
                value={img.source}
                onChange={(e) => setImageSource(img.id, e.target.value as VisualSourceTag)}
                required
                className="flex-1 rounded-lg border px-2 py-1.5 text-xs text-ink outline-none"
                style={{
                  background: "var(--navy)",
                  borderColor: img.source ? "var(--border-g)" : "var(--gap)",
                }}
              >
                <option value="" style={{ backgroundColor: "var(--navy)", color: "var(--ink)" }}>
                  {t.sourcePlaceholder}
                </option>
                {SOURCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} style={{ backgroundColor: "var(--navy)", color: "var(--ink)" }}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="shrink-0 text-muted hover:text-ink"
                aria-label={t.removeImage}
              >
                ×
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border py-2.5 text-xs font-bold text-ink"
            style={{ borderColor: "var(--border-g)", background: "var(--glass-2)" }}
          >
            + {t.addImages}
          </button>
        </div>

        {images.length > 0 && !allTagged && <p className="mt-2 text-[11px] text-muted">{t.sourceRequiredHint}</p>}

        {errorMsg && (
          <p className="mt-3 text-xs font-bold" style={{ color: "var(--gap)" }}>
            {errorMsg}
          </p>
        )}

        <button
          type="button"
          disabled={!allTagged || isPending}
          onClick={run}
          className="mt-4 w-full rounded-lg bg-teal-2 py-2.5 text-sm font-bold text-navy disabled:opacity-60"
        >
          {isPending ? t.analyzing : t.runAnalysis}
        </button>

        {gaps && (
          <div className="mt-6">
            <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "var(--teal-2)" }}>
              {t.resultsLabel}
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {[...layer1Gaps, ...layer2Gaps].map((gap, i) => (
                <li
                  key={i}
                  className="rounded-lg border p-3 text-xs"
                  style={{
                    borderColor: gap.sub_category === "cross_channel" ? "var(--gold)" : "var(--border-g)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-1.5">
                      {gap.sub_category === "cross_channel" && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-navy"
                          style={{ background: "var(--gold)" }}
                        >
                          {t.crossChannelBadge}
                        </span>
                      )}
                      <span className="font-bold text-ink">{gap.gap_title}</span>
                    </span>
                    <span
                      className="ltr-num shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold"
                      dir="ltr"
                      style={{ borderColor: PRIORITY_COLOR[gap.priority], color: PRIORITY_COLOR[gap.priority] }}
                    >
                      {gap.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-1.5 text-muted">{gap.impact}</p>
                  <p className="mt-1.5 text-ink">{gap.recommended_fix}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-muted">{t.mergedNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}
