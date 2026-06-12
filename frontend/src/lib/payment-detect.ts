import type { PayoutIntent } from "./payout-intent.ts";
import { withTimeout } from "./with-timeout.ts";

if (typeof window !== "undefined") {
  throw new Error(
    "payment-detect is server-only and must not be imported in a client bundle",
  );
}

/** Subset of a Horizon payment-operation record that detection needs. */
export type HorizonPaymentRecord = {
  id: string;
  type: string;
  asset_type: string;
  from: string;
  to: string;
  amount: string;
  transaction_hash: string;
  created_at: string;
};

export type PayoutIntentState =
  | "intent_created"
  | "credential_verified"
  | "payment_detected";

export type FetchPaymentsOptions = {
  horizonUrl?: string;
  fetchImpl?: typeof fetch;
  limit?: number;
};

const DEFAULT_HORIZON_URL = "https://horizon-testnet.stellar.org";
const FETCH_TIMEOUT_MS = 5_000;
const DEFAULT_LIMIT = 20;

export function getHorizonUrl(): string {
  return process.env.HORIZON_URL?.trim() || DEFAULT_HORIZON_URL;
}

function toStroops(amount: string): bigint {
  const [whole = "0", fraction = ""] = amount.split(".");
  return BigInt(whole) * 10_000_000n + BigInt(fraction.padEnd(7, "0").slice(0, 7));
}

/**
 * Finds the first payment that satisfies the intent: native XLM, sent to the
 * intent's recipient, for at least the intent amount, created after the
 * intent. The sender is deliberately unconstrained — employers pay from
 * whichever of their own wallets they choose.
 */
export function matchPayment(
  records: HorizonPaymentRecord[],
  intent: PayoutIntent,
): HorizonPaymentRecord | null {
  const requiredStroops = toStroops(intent.amountXlm);
  const notBefore = Date.parse(intent.createdAt);

  for (const record of records) {
    if (record.type !== "payment") continue;
    if (record.asset_type !== "native") continue;
    if (record.to !== intent.recipientAddress) continue;
    if (Date.parse(record.created_at) <= notBefore) continue;
    let stroops: bigint;
    try {
      stroops = toStroops(record.amount);
    } catch {
      continue;
    }
    if (stroops < requiredStroops) continue;
    return record;
  }

  return null;
}

export function deriveIntentState({
  credentialVerified,
  payment,
}: {
  credentialVerified: boolean;
  payment: HorizonPaymentRecord | null;
}): PayoutIntentState {
  if (!credentialVerified) return "intent_created";
  if (!payment) return "credential_verified";
  return "payment_detected";
}

/**
 * Reads recent payment operations for an account straight from Horizon.
 * 404 means the account is not funded yet — that is a normal pre-payment
 * state, not an error.
 */
export async function fetchRecentPayments(
  address: string,
  options: FetchPaymentsOptions = {},
): Promise<HorizonPaymentRecord[]> {
  const horizonUrl = options.horizonUrl ?? getHorizonUrl();
  const fetchImpl = options.fetchImpl ?? fetch;
  const limit = options.limit ?? DEFAULT_LIMIT;
  const url = `${horizonUrl}/accounts/${address}/payments?order=desc&limit=${limit}`;

  const response = await withTimeout(
    fetchImpl(url, { headers: { Accept: "application/json" } }),
    FETCH_TIMEOUT_MS,
    "Horizon payments",
  );

  if (response.status === 404) return [];
  if (!response.ok) {
    throw new Error(`Horizon payments lookup failed with ${response.status}.`);
  }

  const payload = (await response.json()) as {
    _embedded?: { records?: HorizonPaymentRecord[] };
  };
  return payload._embedded?.records ?? [];
}
