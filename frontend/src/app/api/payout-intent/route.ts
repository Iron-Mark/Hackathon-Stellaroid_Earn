import { NextResponse } from "next/server";
import { getCertificateServer } from "@/lib/contract-read-server";
import {
  encodePayoutIntent,
  getPayoutIntentSecret,
} from "@/lib/payout-intent";
import { createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

const AMOUNT_INPUT_RE = /^\d+(\.\d{1,7})?$/;

function normalizeAmount(input: string): string | null {
  const trimmed = input.trim();
  if (!AMOUNT_INPUT_RE.test(trimmed) || Number(trimmed) <= 0) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  return `${whole}.${fraction.padEnd(7, "0")}`;
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  if (!limiter.check(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let body: {
    credentialHash?: unknown;
    recipientAddress?: unknown;
    amountXlm?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const credentialHash =
    typeof body.credentialHash === "string"
      ? body.credentialHash.trim().replace(/^0x/i, "").toLowerCase()
      : "";
  const recipientAddress =
    typeof body.recipientAddress === "string" ? body.recipientAddress.trim() : "";
  const amountXlm =
    typeof body.amountXlm === "string" ? normalizeAmount(body.amountXlm) : null;

  if (!amountXlm) {
    return NextResponse.json(
      { error: "Amount must be a positive XLM value with up to 7 decimals." },
      { status: 400 },
    );
  }

  // The credential must exist on-chain before a gated link makes sense.
  let cert;
  try {
    cert = await getCertificateServer(credentialHash);
  } catch {
    return NextResponse.json(
      { error: "Credential lookup is temporarily unavailable. Try again." },
      { status: 503 },
    );
  }
  if (!cert) {
    return NextResponse.json(
      { error: "No on-chain credential found for that hash." },
      { status: 404 },
    );
  }

  let token: string;
  try {
    token = encodePayoutIntent(
      {
        credentialHash,
        recipientAddress,
        amountXlm,
        createdAt: new Date().toISOString(),
      },
      getPayoutIntentSecret(),
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid payout details. Check the hash, address, and amount." },
      { status: 400 },
    );
  }

  return NextResponse.json({ url: `/payout/${encodeURIComponent(token)}` });
}
