/**
 * Idempotent payout-intent reconciliation. Given an intent URL or raw token,
 * re-derives the full payout state from chain reads and prints a
 * machine-readable report. Read-only — safe to run repeatedly.
 *
 * Usage:
 *   npm run ops:reconcile -- "<intent URL or token>"
 *
 * Exit codes: 0 = state is internally consistent (payment pending is a
 * consistent state); 1 = inconsistency (bad token, missing credential,
 * unreadable chain state).
 */
import { getCertificateServer } from "../src/lib/contract-read-server.ts";
import {
  deriveIntentState,
  fetchRecentPayments,
  matchPayment,
} from "../src/lib/payment-detect.ts";
import {
  decodePayoutIntent,
  getPayoutIntentSecret,
} from "../src/lib/payout-intent.ts";

type Check = { name: string; ok: boolean; detail: string };

function extractToken(input: string): string {
  const trimmed = input.trim();
  const marker = "/payout/";
  const index = trimmed.indexOf(marker);
  const raw = index === -1 ? trimmed : trimmed.slice(index + marker.length);
  return decodeURIComponent(raw.split(/[?#]/)[0]);
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: npm run ops:reconcile -- "<intent URL or token>"');
    process.exit(1);
  }

  const checks: Check[] = [];
  const token = extractToken(input);
  const intent = decodePayoutIntent(token, getPayoutIntentSecret());
  checks.push({
    name: "token_decodes",
    ok: intent !== null,
    detail: intent
      ? `intent for ${intent.amountXlm} XLM → ${intent.recipientAddress}`
      : "token failed signature or shape validation",
  });

  let ok = intent !== null;
  let state: string | null = null;

  if (intent) {
    let credentialVerified = false;
    try {
      const cert = await getCertificateServer(intent.credentialHash);
      checks.push({
        name: "credential_found",
        ok: cert !== null,
        detail: cert
          ? `${cert.title || "untitled"} (status: ${cert.status})`
          : "no on-chain certificate for the intent's hash",
      });
      credentialVerified = cert?.verified === true;
      checks.push({
        name: "credential_verified",
        ok: credentialVerified,
        detail: credentialVerified
          ? "certificate reads as verified"
          : "certificate exists but is not in verified status",
      });
      if (!cert) ok = false;
    } catch (error) {
      ok = false;
      checks.push({
        name: "credential_found",
        ok: false,
        detail: `chain read failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    let payment = null;
    try {
      const records = await fetchRecentPayments(intent.recipientAddress);
      payment = matchPayment(records, intent);
      checks.push({
        name: "payment_detected",
        ok: true,
        detail: payment
          ? `tx ${payment.transaction_hash} (${payment.amount} XLM at ${payment.created_at})`
          : "no matching payment yet (consistent pending state)",
      });
    } catch (error) {
      ok = false;
      checks.push({
        name: "payment_detected",
        ok: false,
        detail: `Horizon read failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    state = deriveIntentState({ credentialVerified, payment });
  }

  const report = {
    reconciledAt: new Date().toISOString(),
    token: `${token.slice(0, 24)}…`,
    state,
    ok,
    checks,
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(ok ? 0 : 1);
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, fatal: String(error) }));
  process.exit(1);
});
