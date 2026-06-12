import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveIntentState,
  fetchRecentPayments,
  matchPayment,
  type HorizonPaymentRecord,
} from "./payment-detect.ts";
import type { PayoutIntent } from "./payout-intent.ts";

const RECIPIENT = "GBS7TPSDSRSG57VGSRUGGHBSHIQVO4VPJBDPG2XLYTXN5FBGYVFXKFDN";
const SENDER = "GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D";

const INTENT: PayoutIntent = {
  credentialHash:
    "c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3",
  recipientAddress: RECIPIENT,
  amountXlm: "25.0000000",
  createdAt: "2026-06-12T08:00:00.000Z",
};

function payment(overrides: Partial<HorizonPaymentRecord> = {}): HorizonPaymentRecord {
  return {
    id: "12345",
    type: "payment",
    asset_type: "native",
    from: SENDER,
    to: RECIPIENT,
    amount: "25.0000000",
    transaction_hash: "ab".repeat(32),
    created_at: "2026-06-12T08:05:00.000Z",
    ...overrides,
  };
}

test("matches an exact payment newer than the intent", () => {
  const match = matchPayment([payment()], INTENT);
  assert.ok(match);
  assert.equal(match.transaction_hash, "ab".repeat(32));
});

test("any sender counts — employers pay from their own wallets", () => {
  const match = matchPayment([payment({ from: "GBOTHER" })], INTENT);
  assert.ok(match);
});

test("overpayment matches; underpayment does not", () => {
  assert.ok(matchPayment([payment({ amount: "26.0000000" })], INTENT));
  assert.equal(matchPayment([payment({ amount: "24.9999999" })], INTENT), null);
});

test("payments older than the intent are ignored", () => {
  const old = payment({ created_at: "2026-06-12T07:59:59.000Z" });
  assert.equal(matchPayment([old], INTENT), null);
});

test("wrong recipient, non-native assets, and non-payments are ignored", () => {
  assert.equal(matchPayment([payment({ to: SENDER })], INTENT), null);
  assert.equal(
    matchPayment([payment({ asset_type: "credit_alphanum4" })], INTENT),
    null,
  );
  assert.equal(
    matchPayment([payment({ type: "create_account" })], INTENT),
    null,
  );
});

test("first matching record wins from a mixed list", () => {
  const records = [
    payment({ id: "1", amount: "1.0000000" }),
    payment({ id: "2" }),
    payment({ id: "3" }),
  ];
  const match = matchPayment(records, INTENT);
  assert.equal(match?.id, "2");
});

test("deriveIntentState ladders through the steps", () => {
  assert.equal(
    deriveIntentState({ credentialVerified: false, payment: null }),
    "intent_created",
  );
  assert.equal(
    deriveIntentState({ credentialVerified: true, payment: null }),
    "credential_verified",
  );
  assert.equal(
    deriveIntentState({ credentialVerified: true, payment: payment() }),
    "payment_detected",
  );
  // A payment without a verified credential does not unlock anything.
  assert.equal(
    deriveIntentState({ credentialVerified: false, payment: payment() }),
    "intent_created",
  );
});

test("fetchRecentPayments returns [] for unfunded accounts (404)", async () => {
  const records = await fetchRecentPayments(RECIPIENT, {
    horizonUrl: "https://horizon.example",
    fetchImpl: async () => new Response("not found", { status: 404 }),
  });
  assert.deepEqual(records, []);
});

test("fetchRecentPayments unwraps the Horizon embedded envelope", async () => {
  const records = await fetchRecentPayments(RECIPIENT, {
    horizonUrl: "https://horizon.example",
    fetchImpl: async (input) => {
      const url = String(input);
      assert.ok(url.startsWith(`https://horizon.example/accounts/${RECIPIENT}/payments`));
      assert.match(url, /order=desc/);
      return new Response(
        JSON.stringify({ _embedded: { records: [payment()] } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    },
  });
  assert.equal(records.length, 1);
  assert.equal(records[0].to, RECIPIENT);
});
