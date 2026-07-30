import assert from "node:assert/strict";
import test from "node:test";
import { friendbotUrl, fundTestnetAccount } from "./friendbot.ts";

test("friendbotUrl encodes the address", () => {
  assert.equal(
    friendbotUrl("GABC"),
    "https://friendbot.stellar.org/?addr=GABC",
  );
});

test("fundTestnetAccount returns ok on 200", async () => {
  const fakeFetch = async () => new Response("{}", { status: 200 });
  const r = await fundTestnetAccount("GALGZZRXRB5SIBGT62OZDA7BMPC4YUZDECHVHGWOAMXIMNLTZGFGTLMN", fakeFetch as typeof fetch);
  assert.deepEqual(r, { ok: true, alreadyFunded: false });
});

test("fundTestnetAccount treats op_already_exists as already funded", async () => {
  const body = JSON.stringify({ detail: "op_already_exists" });
  const fakeFetch = async () => new Response(body, { status: 400 });
  const r = await fundTestnetAccount("GALGZZRXRB5SIBGT62OZDA7BMPC4YUZDECHVHGWOAMXIMNLTZGFGTLMN", fakeFetch as typeof fetch);
  assert.deepEqual(r, { ok: true, alreadyFunded: true });
});

test("fundTestnetAccount reports rate-limit on 429", async () => {
  const fakeFetch = async () => new Response("", { status: 429 });
  const r = await fundTestnetAccount("GALGZZRXRB5SIBGT62OZDA7BMPC4YUZDECHVHGWOAMXIMNLTZGFGTLMN", fakeFetch as typeof fetch);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "rate-limited");
});

test("fundTestnetAccount reports network on throw", async () => {
  const fakeFetch = async () => {
    throw new Error("offline");
  };
  const r = await fundTestnetAccount("GALGZZRXRB5SIBGT62OZDA7BMPC4YUZDECHVHGWOAMXIMNLTZGFGTLMN", fakeFetch as typeof fetch);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "network");
});

test("fundTestnetAccount rejects a malformed address", async () => {
  const r = await fundTestnetAccount("not-an-address");
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "bad-address");
});

test("fundTestnetAccount reads op_already_exists from parsed result_codes", async () => {
  const body = JSON.stringify({
    extras: { result_codes: { transaction: "op_already_exists", operations: ["op_already_exists"] } },
  });
  const fakeFetch = async () => new Response(body, { status: 400 });
  const r = await fundTestnetAccount("GALGZZRXRB5SIBGT62OZDA7BMPC4YUZDECHVHGWOAMXIMNLTZGFGTLMN", fakeFetch as typeof fetch);
  assert.deepEqual(r, { ok: true, alreadyFunded: true });
});

test("fundTestnetAccount trusts result_codes over an incidental body mention", async () => {
  // The raw body mentions op_already_exists in prose while result_codes say the
  // real failure was something else. A substring scan called this already
  // funded and moved the user on with an unfunded account.
  const body = JSON.stringify({
    extras: { result_codes: { transaction: "tx_failed", operations: ["op_underfunded"] } },
    detail: "Not op_already_exists; see the op_already_exists docs for contrast.",
  });
  const fakeFetch = async () => new Response(body, { status: 400 });
  const r = await fundTestnetAccount("GALGZZRXRB5SIBGT62OZDA7BMPC4YUZDECHVHGWOAMXIMNLTZGFGTLMN", fakeFetch as typeof fetch);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "faucet-error");
});

test("fundTestnetAccount separates a refusing faucet from an unreachable one", async () => {
  const fakeFetch = async () => new Response("upstream unavailable", { status: 503 });
  const r = await fundTestnetAccount("GALGZZRXRB5SIBGT62OZDA7BMPC4YUZDECHVHGWOAMXIMNLTZGFGTLMN", fakeFetch as typeof fetch);
  assert.equal(r.ok, false);
  // The faucet answered, so this must not be labelled "network" and must not
  // tell the user to check a connection that plainly worked.
  if (!r.ok) {
    assert.equal(r.reason, "faucet-error");
    assert.doesNotMatch(r.message, /connection/i);
  }
});
