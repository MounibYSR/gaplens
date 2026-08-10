"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/lib/actions/auth";
import { ConsoleLabel } from "@/components/ui/console-label";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { LanguageToggle } from "@/components/entry/language-toggle";
import { GoogleSignInButton } from "@/components/entry/google-signin-button";
import { useEntryLang } from "@/hooks/use-entry-lang";

export default function SignupPage() {
  const [state, formAction] = useActionState(signUp, undefined);
  const { lang, toggle, t } = useEntryLang();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="mb-4 flex w-full max-w-sm justify-end">
        <LanguageToggle lang={lang} onToggle={toggle} />
      </div>
      <div
        className="w-full max-w-sm rounded-2xl border p-8"
        style={{ background: "var(--glass)", borderColor: "var(--border-g)" }}
      >
        <ConsoleLabel>{t.signup.badge}</ConsoleLabel>
        <h1 className="mt-2 mb-6 text-xl font-extrabold text-ink">
          {t.signup.title}
        </h1>

        <GoogleSignInButton label={t.auth.continueWithGoogle} errorFallback={t.auth.oauthError} />

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: "var(--border-g)" }} />
          <span className="text-xs text-muted">{t.auth.orDivider}</span>
          <div className="h-px flex-1" style={{ background: "var(--border-g)" }} />
        </div>

        <form action={formAction}>
        <div className="flex flex-col gap-4">
          <Field label={t.signup.fullName} name="fullName" autoComplete="name" />
          <Field label={t.signup.companyName} name="companyName" />
          <Field label={t.signup.email} name="email" type="email" autoComplete="email" />
          <Field
            label={t.signup.password}
            name="password"
            type="password"
            autoComplete="new-password"
          />
        </div>

        {state?.error && (
          <p className="mt-4 text-sm text-gap">{state.error}</p>
        )}

        <div className="mt-6">
          <SubmitButton>{t.signup.submit}</SubmitButton>
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          {t.signup.switchPrompt}{" "}
          <Link href="/login" className="text-teal-2">
            {t.signup.switchCta}
          </Link>
        </p>
        </form>
      </div>
    </div>
  );
}
