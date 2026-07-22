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
