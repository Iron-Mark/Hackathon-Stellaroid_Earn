import assert from "node:assert/strict";
import test from "node:test";
import { xlmToStroops, explorerTxUrl, feedbackFormUrl, TIP_RECIPIENT } from "./start-flow.ts";

test("xlmToStroops converts to i128 stroops", () => {
  assert.equal(xlmToStroops(1), 10_000_000n);
  assert.equal(xlmToStroops(5), 50_000_000n);
  assert.equal(xlmToStroops(10), 100_000_000n);
});

test("xlmToStroops is exact for fractional amounts", () => {
  // 0.1 and 0.29 are the classic cases where multiplying by 1e7 lands just
  // off the integer (1000000.0000000001 / 2899999.9999999995).
  assert.equal(xlmToStroops(0.1), 1_000_000n);
  assert.equal(xlmToStroops(0.29), 2_900_000n);
  assert.equal(xlmToStroops(1.2345678), 12_345_678n);
});

test("xlmToStroops stays exact where the float product leaves 2^53", () => {
  // 1e9 XLM is 1e16 stroops, past the 9.007e15 integer-exact ceiling of a
  // double, so the old Math.round(xlm * 1e7) path had no exactness guarantee.
  assert.equal(xlmToStroops(1_000_000_000), 10_000_000_000_000_000n);
});

test("xlmToStroops rounds at the stroop boundary", () => {
  assert.equal(xlmToStroops(0.00000004), 0n);
  assert.equal(xlmToStroops(0.00000006), 1n);
});

test("xlmToStroops rejects amounts it cannot represent", () => {
  assert.throws(() => xlmToStroops(-1), /non-negative finite/);
  assert.throws(() => xlmToStroops(Number.NaN), /non-negative finite/);
  assert.throws(() => xlmToStroops(Number.POSITIVE_INFINITY), /non-negative finite/);
});

test("explorerTxUrl builds a tx link", () => {
  assert.ok(explorerTxUrl("abc").endsWith("/tx/abc"));
});

test("feedbackFormUrl prefills the wallet when an entry id is configured", () => {
  const url = feedbackFormUrl("GALGZZRX", "entry.123");
  assert.ok(url.includes("docs.google.com/forms"));
  assert.ok(url.includes("entry.123=GALGZZRX"));
});

test("feedbackFormUrl falls back to a plain form link when no entry id", () => {
  const url = feedbackFormUrl("GALGZZRX", "");
  assert.ok(url.includes("docs.google.com/forms"));
  assert.ok(!url.includes("GALGZZRX"));
});

test("TIP_RECIPIENT is the seeded graduate", () => {
  assert.equal(TIP_RECIPIENT, "GALGZZRXRB5SIBGT62OZDA7BMPC4YUZDECHVHGWOAMXIMNLTZGFGTLMN");
});
