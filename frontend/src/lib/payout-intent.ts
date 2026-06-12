import { createHmac, timingSafeEqual } from "node:crypto";

if (typeof window !== "undefined") {
  throw new Error(
    "payout-intent is server-only and must not be imported in a client bundle",
  );
}

/**
 * Stateless, HMAC-signed payout intent. The token IS the storage — no DB,
 * consistent with "the contract is the database". Anyone holding the URL can
 * view the payout checklist, but nobody can forge or alter one without the
 * server secret.
 */
export type PayoutIntent = {
  /** 64-hex on-chain certificate hash that gates the payout. */
  credentialHash: string;
  /** Graduate's own Stellar account that must receive the payment. */
  recipientAddress: string;
  /** Display-unit XLM amount with exactly 7 decimal places. */
  amountXlm: string;
  /** ISO timestamp; only payments newer than this count. */
  createdAt: string;
};

const HASH_RE = /^[0-9a-f]{64}$/i;
const ADDRESS_RE = /^G[A-Z2-7]{55}$/;
const AMOUNT_RE = /^\d+\.\d{7}$/;

const DEV_FALLBACK_SECRET = "stellaroid-dev-payout-intent-secret";

export function getPayoutIntentSecret(): string {
  const configured = process.env.PAYOUT_INTENT_SECRET?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "PAYOUT_INTENT_SECRET must be set in production environments.",
    );
  }
  return DEV_FALLBACK_SECRET;
}

/** True when intents are signed with the well-known dev fallback secret. */
export function isDevSecret(): boolean {
  return getPayoutIntentSecret() === DEV_FALLBACK_SECRET;
}

function validateIntent(value: unknown): PayoutIntent | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const { credentialHash, recipientAddress, amountXlm, createdAt } = record;

  if (typeof credentialHash !== "string" || !HASH_RE.test(credentialHash)) {
    return null;
  }
  if (typeof recipientAddress !== "string" || !ADDRESS_RE.test(recipientAddress)) {
    return null;
  }
  if (
    typeof amountXlm !== "string" ||
    !AMOUNT_RE.test(amountXlm) ||
    Number(amountXlm) <= 0
  ) {
    return null;
  }
  if (typeof createdAt !== "string" || Number.isNaN(Date.parse(createdAt))) {
    return null;
  }

  return {
    credentialHash: credentialHash.toLowerCase(),
    recipientAddress,
    amountXlm,
    createdAt,
  };
}

function sign(payloadJson: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadJson).digest("base64url");
}

/** Exposed only so tests can construct deliberately malformed signed tokens. */
export const signPayloadForTests = sign;

export function encodePayoutIntent(intent: PayoutIntent, secret: string): string {
  const valid = validateIntent(intent);
  if (!valid) {
    throw new Error("Invalid payout intent payload.");
  }
  const json = JSON.stringify(valid);
  const payload = Buffer.from(json, "utf8").toString("base64url");
  return `${payload}.${sign(json, secret)}`;
}

export function decodePayoutIntent(
  token: string,
  secret: string,
): PayoutIntent | null {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  let json: string;
  try {
    json = Buffer.from(parts[0], "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expected = Buffer.from(sign(json, secret), "utf8");
  const provided = Buffer.from(parts[1], "utf8");
  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    return null;
  }

  try {
    return validateIntent(JSON.parse(json));
  } catch {
    return null;
  }
}
