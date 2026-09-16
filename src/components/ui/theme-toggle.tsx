"use client";

import { useSyncExternalStore } from "react";
import type { Theme } from "@/lib/theme/get-session-theme";

function subscribeNoop() {
  return () => {};
}
function getMountedSnapshot() {
  return true;
}
function getServerSnapshot() {
  return false;
}

function SunIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2v2M10 16v2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M2 10h2M16 10h2M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 11.5a7 7 0 1 1-8.5-8.5 5.5 5.5 0 0 0 8.5 8.5Z" />
    </svg>
  );
}

/** Shows the icon for the mode a click switches TO (sun while dark, moon while light). */
export function ThemeToggle({
  theme,
  onToggle,
  label,
}: {
  theme: Theme;
  onToggle: () => void;
  label?: string;
}) {
  // `theme` on public pages comes from useEntryTheme(), which seeds its
  // initial state from localStorage — a client-only source the server can't
  // see. Rendering the icon straight off that value would mismatch the
  // server's render on any visitor whose stored preference differs from the
  // default, so the icon choice is deferred until after mount (the same
  // "dark" icon renders both server-side and on the client's first paint,
  // then swaps in a normal post-hydration update).
  const mounted = useSyncExternalStore(subscribeNoop, getMountedSnapshot, getServerSnapshot);
  const showMoon = mounted && theme === "light";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-ink transition-opacity hover:opacity-80"
      style={{ borderColor: "var(--border-g)" }}
    >
      {showMoon ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
