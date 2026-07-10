import { NextResponse } from "next/server";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

// First-party error sink: client errors land in the Vercel function logs
// (searchable under [client-error]) instead of vanishing in users' consoles.
// Deliberately dependency-free — no third-party telemetry processor.

const MAX_BODY_BYTES = 8_192;
const RATE_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;

const ALLOWED_SOURCES = new Set([
  "error-boundary",
  "window-error",
  "unhandled-rejection",
]);

// Strip CR/LF and ANSI escapes so a crafted report cannot forge extra log
// lines or restyle the terminal. The stack keeps real newlines (multi-line by
// nature) but loses ANSI, and each of its lines is visibly indented below.
const ANSI_RE = /\x1b\[[0-9;]*[A-Za-z]/g;

function field(value: unknown, max = 600) {
  if (typeof value !== "string") return "";
  return value.slice(0, max).replace(ANSI_RE, "").replace(/[\r\n]+/g, " ");
}

function stackField(value: unknown, max = 600) {
  if (typeof value !== "string") return "";
  return value
    .slice(0, max)
    .replace(ANSI_RE, "")
    .split(/\r?\n/)
    .map((line) => `    ${line}`)
    .join("\n");
}

export async function POST(request: Request) {
  const rate = checkRateLimit(
    "client-error",
    getClientId(request.headers),
    MAX_REQUESTS_PER_WINDOW,
    RATE_WINDOW_MS,
  );
  // Rate-limited or malformed reports are dropped silently — the reporter is
  // fire-and-forget and there is nothing useful a client could do with an
  // error from the error sink.
  if (!rate.ok) {
    return new NextResponse(null, { status: 204 });
  }

  const raw = await request.text();
  if (!raw || raw.length > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 204 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return new NextResponse(null, { status: 204 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const source = field(body.source, 40);
  const message = field(body.message);
  if (!message || !ALLOWED_SOURCES.has(source)) {
    return new NextResponse(null, { status: 204 });
  }

  const digest = field(body.digest, 80);
  const url = field(body.url, 200);
  const stack = stackField(body.stack);

  console.error(
    `[client-error] source=${source} url=${url}${digest ? ` digest=${digest}` : ""} message=${message}${stack ? `\n${stack}` : ""}`,
  );

  return new NextResponse(null, { status: 204 });
}
