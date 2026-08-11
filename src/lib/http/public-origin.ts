import type { NextRequest } from "next/server";

/**
 * The request's own URL reflects whatever host the app's process sees
 * internally — behind a reverse proxy (Render, etc.) that's often an
 * internal address like `localhost:10000`, not the public-facing domain.
 * Reverse proxies set X-Forwarded-Host/-Proto to the real client-facing
 * host, so prefer those when present; falls back to the request's own
 * origin for local dev, where there's no proxy in front.
 */
export function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    return `${forwardedProto ?? "https"}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}
