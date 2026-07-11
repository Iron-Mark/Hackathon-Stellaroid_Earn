import assert from "node:assert/strict";
import test from "node:test";
import { mergeRecentEvents, type MergeableEvent } from "./event-merge.ts";

function rpcEvent(overrides: Partial<MergeableEvent> = {}): MergeableEvent {
  return {
    kind: "opp_fund",
    detail: "Opportunity #1 funded — escrow locked",
    hashHex: null,
    opportunityId: "1",
    // stellar-rpc formats ledgerClosedAt as seconds-precision RFC3339
    ledgerClosedAt: "2026-07-10T12:34:20Z",
    source: "rpc",
    ...overrides,
  };
}

test("same escrow event from RPC and Stellar Expert merges to one row, preferring RPC", () => {
  const merged = mergeRecentEvents(
    [
      rpcEvent(),
      // Stellar Expert path builds millisecond ISO strings from unix ts
      rpcEvent({ ledgerClosedAt: "2026-07-10T12:34:20.000Z", source: "stellar_expert" }),
    ],
    10,
  );

  assert.equal(merged.length, 1);
  assert.equal(merged[0].source, "rpc");
});

test("stellar_expert copy is replaced when the rpc copy arrives second", () => {
  const merged = mergeRecentEvents(
    [
      rpcEvent({ ledgerClosedAt: "2026-07-10T12:34:20.000Z", source: "stellar_expert" }),
      rpcEvent(),
    ],
    10,
  );

  assert.equal(merged.length, 1);
  assert.equal(merged[0].source, "rpc");
});

test("distinct opportunities and kinds do not merge", () => {
  const merged = mergeRecentEvents(
    [
      rpcEvent(),
      rpcEvent({ opportunityId: "2", detail: "Opportunity #2 funded — escrow locked" }),
      rpcEvent({ kind: "pay_rel", detail: "Opportunity #1 escrow released to candidate" }),
    ],
    10,
  );

  assert.equal(merged.length, 3);
});

test("cert events keep their hash-based identity across sources", () => {
  const hash = "c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3";
  const merged = mergeRecentEvents(
    [
      rpcEvent({ kind: "cert_ver", detail: "Proof c02ce1602d… verified", hashHex: hash, opportunityId: null }),
      rpcEvent({
        kind: "cert_ver",
        detail: "Proof c02ce1602d… verified",
        hashHex: hash,
        opportunityId: null,
        ledgerClosedAt: "2026-07-10T12:34:20.000Z",
        source: "stellar_expert",
      }),
    ],
    10,
  );

  assert.equal(merged.length, 1);
});

test("sorts newest-first and respects the limit", () => {
  const merged = mergeRecentEvents(
    [
      rpcEvent({ opportunityId: "1", ledgerClosedAt: "2026-07-10T10:00:00Z" }),
      rpcEvent({ opportunityId: "2", detail: "#2", ledgerClosedAt: "2026-07-10T12:00:00Z" }),
      rpcEvent({ opportunityId: "3", detail: "#3", ledgerClosedAt: "2026-07-10T11:00:00Z" }),
    ],
    2,
  );

  assert.deepEqual(
    merged.map((event) => event.opportunityId),
    ["2", "3"],
  );
});
