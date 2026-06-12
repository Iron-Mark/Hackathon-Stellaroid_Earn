import assert from "node:assert/strict";
import test from "node:test";
import {
  decodePayoutIntent,
  encodePayoutIntent,
  signPayloadForTests,
  type PayoutIntent,
} from "./payout-intent.ts";

const SECRET = "test_intent_secret";
const VALID: PayoutIntent = {
  credentialHash:
    "c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3",
  recipientAddress: "GBS7TPSDSRSG57VGSRUGGHBSHIQVO4VPJBDPG2XLYTXN5FBGYVFXKFDN",
  amountXlm: "25.0000000",
  createdAt: "2026-06-12T08:00:00.000Z",
};

test("round-trips a valid intent", () => {
  const token = encodePayoutIntent(VALID, SECRET);
  assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, "base64url payload.signature");
  assert.deepEqual(decodePayoutIntent(token, SECRET), VALID);
});

test("rejects a tampered payload", () => {
  const token = encodePayoutIntent(VALID, SECRET);
  const [, signature] = token.split(".");
  const forged = Buffer.from(
    JSON.stringify({ ...VALID, amountXlm: "9999.0000000" }),
  ).toString("base64url");
  assert.equal(decodePayoutIntent(`${forged}.${signature}`, SECRET), null);
});

test("rejects a token signed with the wrong secret", () => {
  const token = encodePayoutIntent(VALID, "other_secret");
  assert.equal(decodePayoutIntent(token, SECRET), null);
});

test("malformed tokens return null instead of throwing", () => {
  for (const bad of ["", "abc", "a.b.c", "!!!.???", "a.", ".b"]) {
    assert.equal(decodePayoutIntent(bad, SECRET), null, `token: ${bad}`);
  }
});

test("encode validates the payload shape", () => {
  assert.throws(() =>
    encodePayoutIntent({ ...VALID, credentialHash: "nope" }, SECRET),
  );
  assert.throws(() =>
    encodePayoutIntent({ ...VALID, recipientAddress: "not-an-address" }, SECRET),
  );
  assert.throws(() =>
    encodePayoutIntent({ ...VALID, amountXlm: "-5.0000000" }, SECRET),
  );
  assert.throws(() =>
    encodePayoutIntent({ ...VALID, amountXlm: "25" }, SECRET),
  );
  assert.throws(() =>
    encodePayoutIntent({ ...VALID, createdAt: "yesterday" }, SECRET),
  );
});

test("decode revalidates shape even when the signature matches", () => {
  const bad = { ...VALID, recipientAddress: "GSHORT" };
  // Bypass encode validation by signing the bad payload manually.
  const json = JSON.stringify(bad);
  const payload = Buffer.from(json).toString("base64url");
  const token = `${payload}.${signPayloadForTests(json, SECRET)}`;
  assert.equal(decodePayoutIntent(token, SECRET), null);
});
