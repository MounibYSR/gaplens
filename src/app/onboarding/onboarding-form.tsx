"use client";

import { useActionState, useState } from "react";
import { startAssessment } from "./actions";
import { ConsoleLabel } from "@/components/ui/console-label";
import { SubmitButton } from "@/components/ui/submit-button";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";

const SIZES = ["1-5", "6-15", "16-50", "50+"] as const;

export function OnboardingForm({ lang }: { lang: EntryLang }) {
  const t = appDictionary[lang].onboarding;
  const [state, formAction] = useActionState(startAssessment, undefined);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <form
      action={formAction}
      className="w-full max-w-sm rounded-2xl border p-8"
      style={{ background: "var(--glass)", borderColor: "var(--border-g)" }}
    >
      <ConsoleLabel>{t.badge}</ConsoleLabel>
      <h1 className="mt-2 mb-6 text-xl font-extrabold text-ink">{t.title}</h1>

      <input type="hidden" name="teamSize" value={selected ?? ""} />
      <input type="hidden" name="lang" value={lang} />

      <div className="grid grid-cols-2 gap-3">
        {SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => setSelected(size)}
            className="ltr-num rounded-lg border py-3 text-sm font-bold transition-colors"
            style={{
              background: selected === size ? "var(--teal-2)" : "var(--glass)",
              borderColor: selected === size ? "var(--teal-2)" : "var(--border-g)",
              color: selected === size ? "var(--navy)" : "var(--ink)",
            }}
          >
            {t.options[size]}
          </button>
        ))}
      </div>

      {state?.error && <p className="mt-4 text-sm text-gap">{state.error}</p>}

      <div className="mt-6">
        <SubmitButton>{t.submit}</SubmitButton>
      </div>
    </form>
  );
}
