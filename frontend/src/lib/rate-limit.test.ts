import assert from "node:assert/strict";
import test from "node:test";
import {
  __resetGuardsForTest,
  acquireStreamSlot,
  checkRateLimit,
  getClientId,
  tryConsumeBudget,
} from "./rate-limit.ts";

test("getClientId prefers the first x-forwarded-for hop, then x-real-ip", () => {
  assert.equal(
    getClientId(new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" })),
    "203.0.113.9",
  );
  assert.equal(getClientId(new Headers({ "x-real-ip": "198.51.100.7" })), "198.51.100.7");
  assert.equal(getClientId(new Headers()), "unknown");
});

test("checkRateLimit blocks after the limit and resets after the window", () => {
  __resetGuardsForTest();
  const limit = 3;
  const windowMs = 1000;
  const start = 1_000_000;

  for (let i = 0; i < limit; i += 1) {
    assert.equal(checkRateLimit("b", "ip", limit, windowMs, start).ok, true);
  }
  const blocked = checkRateLimit("b", "ip", limit, windowMs, start);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfterSec >= 1);

  // A different key is tracked independently.
  assert.equal(checkRateLimit("b", "other-ip", limit, windowMs, start).ok, true);

  // After the window elapses the counter resets.
  assert.equal(checkRateLimit("b", "ip", limit, windowMs, start + windowMs).ok, true);
});

test("acquireStreamSlot enforces per-key and global ceilings and releases", () => {
  __resetGuardsForTest();
  const a1 = acquireStreamSlot("a", 2, 3);
  const a2 = acquireStreamSlot("a", 2, 3);
  assert.ok(a1 && a2);
  // Third connection from the same key is refused (per-key cap = 2).
  assert.equal(acquireStreamSlot("a", 2, 3), null);

  // A different key still gets a slot until the global cap (3) is reached.
  const b1 = acquireStreamSlot("b", 2, 3);
  assert.ok(b1);
  assert.equal(acquireStreamSlot("b", 2, 3), null); // global cap hit

  // Releasing frees capacity; double-release is a no-op.
  a1!();
  a1!();
  assert.ok(acquireStreamSlot("b", 2, 3));
});

test("tryConsumeBudget caps rolling spend and resets after the window", () => {
  __resetGuardsForTest();
  const max = 100;
  const windowMs = 60_000;
  const start = 5_000_000;

  assert.equal(tryConsumeBudget("fee", 60, max, windowMs, start), true);
  assert.equal(tryConsumeBudget("fee", 40, max, windowMs, start), true); // total 100
  assert.equal(tryConsumeBudget("fee", 1, max, windowMs, start), false); // would exceed
  // A single request larger than the whole window budget is always refused.
  assert.equal(tryConsumeBudget("fee", 101, max, windowMs, start), false);
  // New window resets the tally.
  assert.equal(tryConsumeBudget("fee", 60, max, windowMs, start + windowMs), true);
});
