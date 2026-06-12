/**
 * Fixed-window in-memory rate limiter for single-instance API routes.
 * Follows the fee-bump-policy pattern: pure, dependency-injected, unit-testable.
 * Good enough for demo-scale abuse damping; not a distributed limiter.
 */
export type RateLimiterOptions = {
  limit: number;
  windowMs: number;
  now?: () => number;
};

export type RateLimiter = {
  check: (key: string) => boolean;
  size: () => number;
};

type WindowEntry = {
  windowStart: number;
  count: number;
};

export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
}: RateLimiterOptions): RateLimiter {
  const windows = new Map<string, WindowEntry>();

  function evictExpired(nowMs: number) {
    for (const [key, entry] of windows) {
      if (nowMs - entry.windowStart >= windowMs) {
        windows.delete(key);
      }
    }
  }

  return {
    check(key: string): boolean {
      const nowMs = now();
      const entry = windows.get(key);

      if (!entry || nowMs - entry.windowStart >= windowMs) {
        evictExpired(nowMs);
        windows.set(key, { windowStart: nowMs, count: 1 });
        return true;
      }

      if (entry.count >= limit) {
        return false;
      }

      entry.count += 1;
      return true;
    },
    size() {
      return windows.size;
    },
  };
}
