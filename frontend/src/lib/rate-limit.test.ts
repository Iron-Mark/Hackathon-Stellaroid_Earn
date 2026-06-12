import assert from "node:assert/strict";
import test from "node:test";
import { createRateLimiter } from "./rate-limit.ts";

const NOW = Date.parse("2026-06-12T08:00:00.000Z");

test("allows up to the limit within a window, then blocks", () => {
  let nowMs = NOW;
  const limiter = createRateLimiter({ limit: 3, windowMs: 60_000, now: () => nowMs });

  assert.equal(limiter.check("1.2.3.4"), true);
  assert.equal(limiter.check("1.2.3.4"), true);
  assert.equal(limiter.check("1.2.3.4"), true);
  assert.equal(limiter.check("1.2.3.4"), false);

  nowMs += 60_001;
  assert.equal(limiter.check("1.2.3.4"), true, "window reset re-admits the key");
});

test("keys are isolated from each other", () => {
  const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, now: () => NOW });
  assert.equal(limiter.check("a"), true);
  assert.equal(limiter.check("b"), true);
  assert.equal(limiter.check("a"), false);
});

test("evicts expired windows so the map cannot grow unbounded", () => {
  let nowMs = NOW;
  const limiter = createRateLimiter({ limit: 1, windowMs: 1_000, now: () => nowMs });
  for (let i = 0; i < 100; i++) limiter.check(`key-${i}`);
  nowMs += 5_000;
  limiter.check("fresh");
  assert.ok(limiter.size() <= 2, `expected expired entries evicted, size=${limiter.size()}`);
});
