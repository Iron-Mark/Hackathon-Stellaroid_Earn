// Minimal first-party client error reporting: browser errors POST to
// /api/client-error, which writes them to the Vercel function logs. No
// third-party service, no new CSP surface, active in every production deploy.

const MAX_FIELD = 600;
const MAX_REPORTS_PER_PAGE = 5;

let reportsSent = 0;
const seen = new Set<string>();

export type ClientErrorReport = {
  message: string;
  stack?: string;
  digest?: string;
  source: "error-boundary" | "window-error" | "unhandled-rejection";
  url: string;
};

function truncate(value: string | undefined) {
  if (!value) return undefined;
  return value.length > MAX_FIELD ? `${value.slice(0, MAX_FIELD)}…` : value;
}

export function reportClientError(input: {
  error: unknown;
  source: ClientErrorReport["source"];
  digest?: string;
}) {
  if (typeof window === "undefined") return;
  if (reportsSent >= MAX_REPORTS_PER_PAGE) return;

  const error = input.error;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown client error";

  // Cross-origin scripts (extensions, injected content) surface as an opaque
  // "Script error." — pure noise we can't act on.
  if (!message || message === "Script error.") return;

  const key = `${input.source}:${message}`;
  if (seen.has(key)) return;
  seen.add(key);
  reportsSent += 1;

  const payload: ClientErrorReport = {
    message: truncate(message) ?? "Unknown client error",
    stack: truncate(error instanceof Error ? error.stack : undefined),
    digest: truncate(input.digest),
    source: input.source,
    url: truncate(window.location.pathname) ?? "/",
  };

  try {
    // keepalive lets the report survive page unloads (e.g. crash → reload).
    void fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Reporting must never throw into the app it is observing.
  }
}
