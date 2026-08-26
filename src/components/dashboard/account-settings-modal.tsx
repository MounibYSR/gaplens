"use client";

import { useRef, useState, useTransition } from "react";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import { updateAccountSettings } from "@/app/dashboard/account-actions";
import { logOut } from "@/lib/actions/auth";

export function AccountSettingsModal({
  lang,
  companyId,
  initialName,
  initialLogoUrl,
  initialCurrency,
  initialAvgHourlyCost,
  onClose,
  onSaved,
}: {
  lang: EntryLang;
  companyId: string;
  initialName: string;
  initialLogoUrl: string | null;
  initialCurrency: string;
  initialAvgHourlyCost: number | null;
  onClose: () => void;
  onSaved: (name: string, logoUrl: string | null) => void;
}) {
  const t = appDictionary[lang].accountSettings;
  const [name, setName] = useState(initialName);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialLogoUrl);
  const [currency, setCurrency] = useState(initialCurrency);
  const [avgHourlyCost, setAvgHourlyCost] = useState(initialAvgHourlyCost != null ? String(initialAvgHourlyCost) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loggingOut, startLogOut] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("companyId", companyId);
      formData.set("name", trimmed);
      formData.set("currency", currency.trim().toUpperCase() || "USD");
      formData.set("avgHourlyCost", avgHourlyCost.trim());
      if (file) formData.set("logo", file);
      const result = await updateAccountSettings(formData);
      onSaved(trimmed, result.logoUrl ?? initialLogoUrl);
      onClose();
    } catch {
      setError(t.saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(6,10,20,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
        style={{ background: "var(--modal-bg)", borderColor: "var(--border-g)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-extrabold text-ink">{t.title}</h2>

        <label className="mt-4 block text-xs font-bold text-muted">{t.nameLabel}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.namePlaceholder}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-ink outline-none"
          style={{ background: "var(--glass-2)", borderColor: "var(--border-g)" }}
        />

        <label className="mt-4 block text-xs font-bold text-muted">{t.logoLabel}</label>
        <div className="mt-2 flex items-center gap-3">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
          ) : (
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-navy"
              style={{ background: "var(--teal-2)" }}
            >
              {(name.trim() || "G").charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border px-3 py-1.5 text-xs font-bold text-ink"
              style={{ borderColor: "var(--border-g)" }}
            >
              {previewUrl ? t.changeCta : t.uploadCta}
            </button>
            <p className="mt-1 text-[11px] text-muted">{t.logoHint}</p>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <div className="w-24 shrink-0">
            <label className="block text-xs font-bold text-muted">{t.currencyLabel}</label>
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              maxLength={3}
              placeholder="USD"
              className="ltr-num mt-1 w-full rounded-lg border px-3 py-2 text-sm uppercase text-ink outline-none"
              dir="ltr"
              style={{ background: "var(--glass-2)", borderColor: "var(--border-g)" }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-muted">{t.avgHourlyCostLabel}</label>
            <input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={avgHourlyCost}
              onChange={(e) => setAvgHourlyCost(e.target.value)}
              placeholder={t.avgHourlyCostPlaceholder}
              className="ltr-num mt-1 w-full rounded-lg border px-3 py-2 text-sm text-ink outline-none"
              dir="ltr"
              style={{ background: "var(--glass-2)", borderColor: "var(--border-g)" }}
            />
          </div>
        </div>
        <p className="mt-1 text-[11px] text-muted">{t.avgHourlyCostHint}</p>

        {error && (
          <p className="mt-3 text-xs font-bold" style={{ color: "var(--gap)" }}>
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border py-2.5 text-sm font-bold text-ink"
            style={{ borderColor: "var(--border-g)" }}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 rounded-lg bg-teal-2 py-2.5 text-sm font-bold text-navy disabled:opacity-60"
          >
            {saving ? "…" : t.save}
          </button>
        </div>

        <button
          type="button"
          onClick={() => startLogOut(() => logOut())}
          disabled={loggingOut}
          className="mt-4 w-full border-t pt-4 text-center text-sm font-bold disabled:opacity-60"
          style={{ borderColor: "var(--border-g)", color: "var(--gap)" }}
        >
          {loggingOut ? "…" : t.logOut}
        </button>
      </div>
    </div>
  );
}
