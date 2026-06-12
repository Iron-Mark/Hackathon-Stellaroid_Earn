import assert from "node:assert/strict";
import test from "node:test";
import {
  PDAX_FIXTURE_BALANCES,
  PDAX_FIXTURE_TICKERS,
  PDAX_FIXTURE_TRANSACTIONS,
} from "./pdax-fixtures.ts";
import { signRequest } from "./pdax-sign.ts";

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_WINDOW_DESCRIPTOR = Object.getOwnPropertyDescriptor(globalThis, "window");

function restoreRuntime() {
  process.env = { ...ORIGINAL_ENV };
  globalThis.fetch = ORIGINAL_FETCH;

  if (ORIGINAL_WINDOW_DESCRIPTOR) {
    Object.defineProperty(globalThis, "window", ORIGINAL_WINDOW_DESCRIPTOR);
  } else {
    Reflect.deleteProperty(globalThis, "window");
  }
}

async function importPdaxClient(label: string) {
  return import(`./pdax-client.ts?test=${label}-${Date.now()}-${Math.random()}`);
}

test.afterEach(restoreRuntime);

test("mock mode returns deterministic fixtures without secrets or network calls", async () => {
  process.env.PDAX_MODE = "mock";
  delete process.env.PDAX_ACCESS_KEY;
  delete process.env.PDAX_SECRET;
  delete process.env.PDAX_BASE_URL;

  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("mock mode must not call fetch");
  }) as typeof fetch;

  const client = await importPdaxClient("mock");

  assert.deepEqual(await client.getBalances(), PDAX_FIXTURE_BALANCES);
  assert.deepEqual(await client.getTicker("XLM/PHP"), PDAX_FIXTURE_TICKERS["XLM/PHP"]);
  assert.deepEqual(await client.getTransactions(), PDAX_FIXTURE_TRANSACTIONS);
  assert.deepEqual(
    await client.cryptoOutDryRun({
      asset: "XLM",
      amount: "12.2500000",
      address: "GCFXWBUR7H2M6P4LLQQY4M72PY3UQNQ5C3YV2SGH3VNKYZW3WTHX6Z2Q",
      network: "stellar-testnet",
    }),
    {
      asset: "XLM",
      amount: "12.2500000",
      address: "GCFXWBUR7H2M6P4LLQQY4M72PY3UQNQ5C3YV2SGH3VNKYZW3WTHX6Z2Q",
      network: "stellar-testnet",
      fee: "0.0200000",
      totalDebit: "12.2700000",
      estimatedArrival: "2026-01-15T08:35:00.000Z",
      referenceId: "dryrun_mock_20260115_083000",
      warnings: [],
    },
  );
  assert.equal(fetchCalls, 0);
});

test("mock fixtures expose realistic stable shapes", () => {
  assert.match(PDAX_FIXTURE_BALANCES[0]?.updatedAt ?? "", /^2026-01-15T08:30:00\.000Z$/);
  assert.equal(PDAX_FIXTURE_BALANCES[0]?.currency, "PHP");
  assert.equal(PDAX_FIXTURE_TICKERS["XLM/PHP"]?.pair, "XLM/PHP");
  assert.equal(PDAX_FIXTURE_TRANSACTIONS[0]?.status, "completed");
});

test("staging mode signs requests and calls PDAX_BASE_URL", async () => {
  process.env.PDAX_MODE = "staging";
  process.env.PDAX_BASE_URL = "https://pdax.staging.example";
  process.env.PDAX_ACCESS_KEY = "access_key";
  process.env.PDAX_SECRET = "secret_key";

  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;
  globalThis.fetch = (async (input, init) => {
    capturedUrl = String(input);
    capturedInit = init;
    return new Response(
      JSON.stringify({
        data: [
          {
            currency: "PHP",
            available: "1500.00",
            hold: "0.00",
            total: "1500.00",
            updatedAt: "2026-01-15T08:31:00.000Z",
          },
        ],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;

  const client = await importPdaxClient("staging");
  const balances = await client.getBalances();

  assert.deepEqual(balances, [
    {
      currency: "PHP",
      available: "1500.00",
      hold: "0.00",
      total: "1500.00",
      updatedAt: "2026-01-15T08:31:00.000Z",
    },
  ]);
  assert.equal(capturedUrl, "https://pdax.staging.example/v1/balances");
  assert.equal(capturedInit?.method, "GET");

  const headers = new Headers(capturedInit?.headers);
  const timestamp = headers.get("Access-Timestamp");
  assert.ok(timestamp);
  assert.equal(headers.get("Access-Key"), "access_key");
  assert.equal(
    headers.get("Access-Signature"),
    signRequest("secret_key", "GET", "/v1/balances", "", timestamp),
  );
});

test("staging mode requires server-side PDAX credentials", async () => {
  process.env.PDAX_MODE = "staging";
  process.env.PDAX_BASE_URL = "https://pdax.staging.example";
  delete process.env.PDAX_ACCESS_KEY;
  delete process.env.PDAX_SECRET;

  const client = await importPdaxClient("missing-credentials");

  await assert.rejects(() => client.getBalances(), /PDAX_ACCESS_KEY and PDAX_SECRET/);
});

test("pdax client throws if imported with a window global", async () => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {},
  });

  await assert.rejects(
    () => importPdaxClient("client-guard"),
    /PDAX client is server-only/,
  );
});
