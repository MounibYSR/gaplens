"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { logIn } from "@/lib/actions/auth";
import { ConsoleLabel } from "@/components/ui/console-label";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { LanguageToggle } from "@/components/entry/language-toggle";
import { GoogleSignInButton } from "@/components/entry/google-signin-button";
import { useEntryLang } from "@/hooks/use-entry-lang";

function LoginForm() {
  const [state, formAction] = useActionState(logIn, undefined);
  const { lang, toggle, t } = useEntryLang();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="mb-4 flex w-full max-w-sm justify-end">
        <LanguageToggle lang={lang} onToggle={toggle} />
      </div>
      <div
        className="w-full max-w-sm rounded-2xl border p-8"
        style={{ background: "var(--glass)", borderColor: "var(--border-g)" }}
      >
        <ConsoleLabel>{t.login.badge}</ConsoleLabel>
        <h1 className="mt-2 mb-6 text-xl font-extrabold text-ink">
          {t.login.title}
        </h1>

        <GoogleSignInButton label={t.auth.continueWithGoogle} errorFallback={t.auth.oauthError} />

        {oauthError && (
          <p className="mt-2 text-sm text-gap">{t.auth.oauthError}</p>
        )}

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: "var(--border-g)" }} />
          <span className="text-xs text-muted">{t.auth.orDivider}</span>
          <div className="h-px flex-1" style={{ background: "var(--border-g)" }} />
        </div>

        <form action={formAction}>
          <div className="flex flex-col gap-4">
            <Field label={t.login.email} name="email" type="email" autoComplete="email" />
            <Field
              label={t.login.password}
              name="password"
              type="password"
              autoComplete="current-password"
            />
          </div>

          {state?.error && (
            <p className="mt-4 text-sm text-gap">{state.error}</p>
          )}

          <div className="mt-6">
            <SubmitButton>{t.login.submit}</SubmitButton>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          {t.login.switchPrompt}{" "}
          <Link href="/signup" className="text-teal-2">
            {t.login.switchCta}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
