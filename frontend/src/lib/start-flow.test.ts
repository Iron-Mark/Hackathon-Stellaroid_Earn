import assert from "node:assert/strict";
import test from "node:test";
import { xlmToStroops, explorerTxUrl, feedbackFormUrl, TIP_RECIPIENT } from "./start-flow.ts";

test("xlmToStroops converts to i128 stroops", () => {
  assert.equal(xlmToStroops(1), 10_000_000n);
  assert.equal(xlmToStroops(5), 50_000_000n);
});

test("explorerTxUrl builds a tx link", () => {
  assert.ok(explorerTxUrl("abc").endsWith("/tx/abc"));
});

test("feedbackFormUrl includes the wallet address", () => {
  const url = feedbackFormUrl("GALGZZRX");
  assert.ok(url.includes("docs.google.com/forms"));
  assert.ok(url.includes("GALGZZRX"));
});

test("TIP_RECIPIENT is the seeded graduate", () => {
  assert.equal(TIP_RECIPIENT, "GALGZZRXRB5SIBGT62OZDA7BMPC4YUZDECHVHGWOAMXIMNLTZGFGTLMN");
});
