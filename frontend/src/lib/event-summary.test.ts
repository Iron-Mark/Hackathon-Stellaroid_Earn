import assert from "node:assert/strict";
import test from "node:test";
import { buildEventsSummary } from "./event-summary.ts";
import type { RecentActivityItem } from "./events.ts";

const baseEvent: RecentActivityItem = {
  id: "event-1",
  kind: "cert_reg",
  label: "Registered",
  detail: "Proof registered",
  hashHex: "c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3",
  ledgerClosedAt: "2026-07-03T00:00:00.000Z",
  txHash: "tx-1",
  externalUrl: "https://stellar.expert/explorer/testnet/tx/tx-1",
  reference: "tx-1",
  source: "rpc",
};

test("buildEventsSummary counts events, proofs, refs, and sources", () => {
  const summary = buildEventsSummary([
    baseEvent,
    {
      ...baseEvent,
      id: "event-2",
      kind: "cert_ver",
      label: "Verified",
      ledgerClosedAt: "2026-07-02T00:00:00.000Z",
      txHash: null,
      source: "stellar_expert",
    },
    {
      ...baseEvent,
      id: "event-3",
      kind: "payment",
      label: "Payment",
      hashHex: null,
      ledgerClosedAt: "2026-07-01T00:00:00.000Z",
      txHash: "tx-3",
      source: "rpc",
    },
  ]);

  assert.equal(summary.totalEvents, 3);
  assert.deepEqual(summary.byKind, { cert_reg: 1, cert_ver: 1, payment: 1 });
  assert.deepEqual(summary.bySource, { rpc: 2, stellar_expert: 1 });
  assert.equal(summary.uniqueProofs, 1);
  assert.equal(summary.uniqueEventRefs, 3);
  assert.equal(summary.latestEvent, "2026-07-03T00:00:00.000Z");
  assert.equal(summary.oldestEvent, "2026-07-01T00:00:00.000Z");
});
