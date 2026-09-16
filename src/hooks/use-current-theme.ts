"use client";

import { useSyncExternalStore } from "react";
import type { Theme } from "@/lib/theme/get-session-theme";

function subscribe(callback: () => void) {
  const root = document.documentElement;
  const observer = new MutationObserver(callback);
  observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

// Matches the root layout's cookie-based default so the very first client
// render agrees with what the server rendered for this subtree — the actual
// value syncs in immediately after mount via the subscription above.
function getServerSnapshot(): Theme {
  return "dark";
}

/**
 * Read-only, live view of the document's current theme — for client
 * components (canvas animations) that need to react to the toggle without
 * owning any persistence logic themselves. Both toggle paths (the public
 * useEntryTheme hook and the dashboard's own handler) keep
 * document.documentElement's data-theme in sync, so watching it here covers
 * every toggle site.
 */
export function useCurrentTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
