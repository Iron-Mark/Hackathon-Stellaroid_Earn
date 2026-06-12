import assert from "node:assert/strict";
import test from "node:test";
import { getQuote, resetQuoteCacheForTests } from "./quote.ts";

const NOW = Date.parse("2026-06-12T08:00:00.000Z");

function coingeckoOk(price = 6.21) {
  return async () =>
    new Response(JSON.stringify({ stellar: { php: price } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
}

function coingeckoFail() {
  return async () => new Response("upstream down", { status: 503 });
}

test.beforeEach(() => {
  resetQuoteCacheForTests();
  delete process.env.PDAX_MODE;
});

test("staging mode prefers the PDAX ticker", async () => {
  process.env.PDAX_MODE = "staging";
  const quote = await getQuote("XLM", "PHP", {
    fetchImpl: coingeckoFail(),
    now: () => NOW,
    pdaxTicker: async () => ({ last: "6.4200", timestamp: "2026-06-12T07:59:00.000Z" }),
  });

  assert.ok(quote);
  assert.equal(quote.source, "pdax-staging");
  assert.equal(quote.price, 6.42);
  assert.equal(quote.stale, false);
});

test("mock mode skips PDAX and uses CoinGecko", async () => {
  let pdaxCalled = false;
  const quote = await getQuote("XLM", "PHP", {
    fetchImpl: coingeckoOk(6.21),
    now: () => NOW,
    pdaxTicker: async () => {
      pdaxCalled = true;
      return { last: "9.99", timestamp: "x" };
    },
  });

  assert.ok(quote);
  assert.equal(pdaxCalled, false);
  assert.equal(quote.source, "coingecko");
  assert.equal(quote.price, 6.21);
  assert.equal(quote.stale, false);
  assert.equal(quote.asOf, "2026-06-12T08:00:00.000Z");
});

test("provider failure falls back to last-good cache flagged stale", async () => {
  const first = await getQuote("XLM", "PHP", {
    fetchImpl: coingeckoOk(6.21),
    now: () => NOW,
  });
  assert.equal(first?.source, "coingecko");

  const second = await getQuote("XLM", "PHP", {
    fetchImpl: coingeckoFail(),
    now: () => NOW + 120_000, // past TTL, fetch fails
  });

  assert.ok(second);
  assert.equal(second.source, "cache");
  assert.equal(second.stale, true);
  assert.equal(second.price, 6.21);
  assert.equal(second.asOf, "2026-06-12T08:00:00.000Z");
});

test("total failure with empty cache returns null, never throws", async () => {
  const quote = await getQuote("XLM", "PHP", {
    fetchImpl: async () => {
      throw new Error("network blocked");
    },
    now: () => NOW,
  });
  assert.equal(quote, null);
});

test("second call within TTL serves the cache without refetching", async () => {
  let fetches = 0;
  const fetchImpl = async () => {
    fetches += 1;
    return coingeckoOk(6.21)();
  };

  await getQuote("XLM", "PHP", { fetchImpl, now: () => NOW });
  const cached = await getQuote("XLM", "PHP", { fetchImpl, now: () => NOW + 30_000 });

  assert.equal(fetches, 1);
  assert.equal(cached?.source, "cache");
  assert.equal(cached?.stale, false, "within TTL the cache is fresh, not stale");

  await getQuote("XLM", "PHP", { fetchImpl, now: () => NOW + 90_000 });
  assert.equal(fetches, 2, "after TTL expiry the provider is queried again");
});
