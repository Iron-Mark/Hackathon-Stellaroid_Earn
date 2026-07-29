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

// Strip every line-break form (CR/LF, NEL, U+2028/2029) plus all C0/C1
// control characters so a crafted report can neither forge extra log lines
// nor smuggle terminal escapes — CSI, OSC, and RIS sequences all start with
// ESC (U+001B), which dies here. The stack is folded onto a single line with
// " | " frame separators rather than kept multi-line: one report is then
// exactly one log row, so no attacker-supplied byte can ever begin a row.
const LINE_BREAKS_RE = /[\r\n\u0085\u2028\u2029]+/g;
const CONTROL_RE = /[\u0000-\u001f\u007f-\u009f]/g;

function sanitizeForLog(value: string) {
  return value.replace(LINE_BREAKS_RE, " ").replace(CONTROL_RE, "");
}

function field(value: unknown, max = 600) {
  if (typeof value !== "string") return "";
  return sanitizeForLog(value.slice(0, max));
}

function stackField(value: unknown, max = 600) {
  if (typeof value !== "string") return "";
  return value
    .slice(0, max)
    .split(LINE_BREAKS_RE)
    .map((line) => sanitizeForLog(line).trim())
    .filter(Boolean)
    .join(" | ");
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

  const safeSource = sanitizeForLog(source);
  const safeUrl = sanitizeForLog(url);
  const safeDigest = sanitizeForLog(digest);
  const safeMessage = sanitizeForLog(message);
  const safeStack = sanitizeForLog(stack);

  console.error(
    `[client-error] source=${safeSource} url=${safeUrl}${safeDigest ? ` digest=${safeDigest}` : ""} message=${safeMessage}${safeStack ? ` stack=${safeStack}` : ""}`,
  );

  return new NextResponse(null, { status: 204 });
}
