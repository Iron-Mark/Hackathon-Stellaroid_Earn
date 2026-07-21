// Dependency-free, in-memory abuse guards: fixed-window rate limiting, live
// stream concurrency slots, and a rolling spend budget.
//
// SCOPE / LIMITATION: state lives in module memory, so on serverless (Vercel
// Fluid Compute) it is per-warm-instance, not globally shared. This is
// defense-in-depth that bounds abuse per instance and — paired with the shared
// short-TTL event cache in events.ts — sharply cuts upstream RPC/indexer
// fan-out from connection floods. For a hard global guarantee, layer an edge
// rate limit in front (Vercel WAF / Firewall rules).

export function getClientId(headers: Headers): string {
  // Prefer x-real-ip: on Vercel it is the real connection IP and is NOT
  // client-forgeable. The leftmost x-forwarded-for entry, by contrast, is
  // attacker-controllable (a client can prepend a fake IP and Vercel appends
  // the real one after it), which would hand each forged request a fresh
  // limiter window. Fall back to XFF's leftmost only when x-real-ip is absent
  // (non-Vercel / local dev).
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || "unknown";
}

type WindowEntry = { count: number; resetAt: number };
const windows = new Map<string, Map<string, WindowEntry>>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

// Fixed-window counter. Returns ok=false once `limit` hits are seen inside a
// `windowMs` window for the given (bucket, key) pair.
export function checkRateLimit(
  bucket: string,
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  let buckets = windows.get(bucket);
  if (!buckets) {
    buckets = new Map();
    windows.set(bucket, buckets);
  }

  const entry = buckets.get(key);
  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // Opportunistically bound memory so a spray of unique keys can't grow the
    // map without limit.
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) {
        if (now >= v.resetAt) buckets.delete(k);
      }
    }
    return { ok: true, remaining: Math.max(0, limit - 1), retryAfterSec: 0 };
  }

  if (entry.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return { ok: true, remaining: Math.max(0, limit - entry.count), retryAfterSec: 0 };
}

// Concurrency slots for long-lived connections (SSE). Returns a release()
// callback, or null when either the per-key or global ceiling is already hit.
const streamCounts = new Map<string, number>();
let globalStreamCount = 0;

export function acquireStreamSlot(
  key: string,
  perKeyMax: number,
  globalMax: number,
): (() => void) | null {
  const current = streamCounts.get(key) ?? 0;
  if (globalStreamCount >= globalMax || current >= perKeyMax) {
    return null;
  }

  streamCounts.set(key, current + 1);
  globalStreamCount += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    globalStreamCount = Math.max(0, globalStreamCount - 1);
    const next = (streamCounts.get(key) ?? 1) - 1;
    if (next <= 0) streamCounts.delete(key);
    else streamCounts.set(key, next);
  };
}

// Rolling spend budget in abstract units (e.g. stroops). Denies a request when
// it would push total spend within the current window past `maxPerWindow`.
type BudgetEntry = { spent: number; resetAt: number };
const budgets = new Map<string, BudgetEntry>();

export function tryConsumeBudget(
  bucket: string,
  amount: number,
  maxPerWindow: number,
  windowMs: number,
  now: number = Date.now(),
): boolean {
  if (amount <= 0) return true;
  if (amount > maxPerWindow) return false;

  const entry = budgets.get(bucket);
  if (!entry || now >= entry.resetAt) {
    budgets.set(bucket, { spent: amount, resetAt: now + windowMs });
    return true;
  }
  if (entry.spent + amount > maxPerWindow) {
    return false;
  }
  entry.spent += amount;
  return true;
}

// Test-only: clear all in-memory state so unit tests stay independent.
export function __resetGuardsForTest() {
  windows.clear();
  streamCounts.clear();
  budgets.clear();
  globalStreamCount = 0;
}
