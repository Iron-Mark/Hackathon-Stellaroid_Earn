import { NextResponse } from "next/server";
import {
  MAX_PILOT_LEAD_BODY_BYTES,
  formatPilotLeadEmail,
  validatePilotLead,
} from "@/lib/pilot-lead";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

// Lead notifications are delivered by email via the Resend HTTP API (raw
// fetch — no SDK). Until the domain is verified with Resend, the from address
// must stay onboarding@resend.dev and the destination must be the Resend
// account owner's inbox.
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const LEAD_INBOX_EMAIL = process.env.LEAD_INBOX_EMAIL ?? "";
const LEAD_FROM_EMAIL = process.env.LEAD_FROM_EMAIL || "onboarding@resend.dev";

const RATE_WINDOW_MS = 600_000;
const MAX_REQUESTS_PER_WINDOW = 5;

export async function POST(request: Request) {
  if (!RESEND_API_KEY || !LEAD_INBOX_EMAIL) {
    return NextResponse.json(
      { error: "Pilot requests are not configured on this server." },
      { status: 503 },
    );
  }

  // Cheap per-IP flood control before any parsing work.
  const rate = checkRateLimit(
    "pilot-lead",
    getClientId(request.headers),
    MAX_REQUESTS_PER_WINDOW,
    RATE_WINDOW_MS,
  );
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many pilot requests from this address. Retry shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, rate.retryAfterSec)) },
      },
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_PILOT_LEAD_BODY_BYTES) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validatePilotLead(body);
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status },
    );
  }

  // Bot filled the honeypot: acknowledge and drop so it learns nothing.
  if (validation.honeypot) {
    return NextResponse.json({ ok: true });
  }

  const lead = validation.lead;
  const { subject, text } = formatPilotLeadEmail(lead);

  // Function-log breadcrumb only. No user-submitted content is logged: the
  // lead itself lives in the Resend email, and delivery failures are logged
  // below with the Resend status. Keeping the submitted name and email out of
  // the logs means the only copy is the one the sender intended, and it also
  // removes the last path by which typed text could reach a log line.
  console.log("[pilot-lead] accepted");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Stellaroid Earn <${LEAD_FROM_EMAIL}>`,
        to: [LEAD_INBOX_EMAIL],
        reply_to: lead.email,
        subject,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[pilot-lead] Resend ${response.status}: ${detail.slice(0, 300)}`);
      return NextResponse.json(
        { error: "Could not deliver your request. Email us directly instead." },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error(
      `[pilot-lead] delivery failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    return NextResponse.json(
      { error: "Could not deliver your request. Email us directly instead." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
