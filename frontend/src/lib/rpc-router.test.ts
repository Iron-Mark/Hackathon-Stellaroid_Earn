import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  createRpcRouter,
  resolveRpcProviders,
  routeRpcJsonRpc,
} from "./rpc-router.ts";

function transientStatus(status: number) {
  return Object.assign(new Error(`HTTP ${status}`), { status });
}

function axiosStatus(status: number) {
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status },
  });
}

async function flushTasks() {
  await Promise.resolve();
  await Promise.resolve();
}

test("fails over from a timed out primary provider to the next provider in order", async (t) => {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 0 });

  const calls: string[] = [];
  const router = createRpcRouter({
    providers: [
      { name: "primary", url: "https://primary.test" },
      { name: "fallback", url: "https://fallback.test" },
    ],
    jitter: () => 0,
    serverFactory: (provider) => ({ provider }),
  });

  const routed = router.request(async (server) => {
    const providerName = server.provider.name;
    calls.push(providerName);
    if (providerName === "primary") {
      return new Promise<string>(() => {});
    }
    return "fallback-ok";
  });

  await flushTasks();
  assert.deepEqual(calls, ["primary"]);

  t.mock.timers.tick(5_000);
  await flushTasks();
  assert.deepEqual(calls, ["primary"]);

  t.mock.timers.tick(250);
  await flushTasks();

  assert.equal(await routed, "fallback-ok");
  assert.deepEqual(calls, ["primary", "fallback"]);
  assert.equal(router.getActiveProvider().name, "fallback");
});

test("backs off exponentially between transient provider failures", async (t) => {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 0 });

  const calls: Array<{ name: string; at: number }> = [];
  const router = createRpcRouter({
    providers: [
      { name: "primary", url: "https://primary.test" },
      { name: "secondary", url: "https://secondary.test" },
      { name: "tertiary", url: "https://tertiary.test" },
    ],
    jitter: () => 0,
    serverFactory: (provider) => ({ provider }),
  });

  const routed = router.request(async (server) => {
    calls.push({ name: server.provider.name, at: Date.now() });
    if (server.provider.name !== "tertiary") {
      throw transientStatus(503);
    }
    return "healthy";
  });

  await flushTasks();
  assert.deepEqual(calls, [{ name: "primary", at: 0 }]);

  t.mock.timers.tick(249);
  await flushTasks();
  assert.deepEqual(calls, [{ name: "primary", at: 0 }]);

  t.mock.timers.tick(1);
  await flushTasks();
  assert.deepEqual(calls, [
    { name: "primary", at: 0 },
    { name: "secondary", at: 250 },
  ]);

  t.mock.timers.tick(499);
  await flushTasks();
  assert.deepEqual(calls, [
    { name: "primary", at: 0 },
    { name: "secondary", at: 250 },
  ]);

  t.mock.timers.tick(1);
  await flushTasks();

  assert.equal(await routed, "healthy");
  assert.deepEqual(calls, [
    { name: "primary", at: 0 },
    { name: "secondary", at: 250 },
    { name: "tertiary", at: 750 },
  ]);
});

test("pins the successful provider for sixty seconds", async (t) => {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 0 });

  const calls: string[] = [];
  let primaryHealthy = false;
  const router = createRpcRouter({
    providers: [
      { name: "primary", url: "https://primary.test" },
      { name: "fallback", url: "https://fallback.test" },
    ],
    jitter: () => 0,
    serverFactory: (provider) => ({ provider }),
  });

  const operation = async (server: { provider: { name: string } }) => {
    calls.push(server.provider.name);
    if (server.provider.name === "primary" && !primaryHealthy) {
      throw transientStatus(503);
    }
    return `${server.provider.name}-ok`;
  };

  const first = router.request(operation);
  await flushTasks();
  t.mock.timers.tick(250);
  await flushTasks();
  assert.equal(await first, "fallback-ok");

  assert.equal(await router.request(operation), "fallback-ok");
  assert.deepEqual(calls, ["primary", "fallback", "fallback"]);

  primaryHealthy = true;
  t.mock.timers.tick(60_001);

  assert.equal(await router.request(operation), "primary-ok");
  assert.deepEqual(calls, ["primary", "fallback", "fallback", "primary"]);
});

test("single healthy provider short-circuits without touching fallbacks", async () => {
  const calls: string[] = [];
  const router = createRpcRouter({
    providers: [
      { name: "primary", url: "https://primary.test" },
      { name: "fallback", url: "https://fallback.test" },
    ],
    serverFactory: (provider) => ({ provider }),
  });

  const result = await router.request(async (server) => {
    calls.push(server.provider.name);
    return "primary-ok";
  });

  assert.equal(result, "primary-ok");
  assert.deepEqual(calls, ["primary"]);
  assert.equal(router.getActiveProvider().name, "primary");
});

test("does not fail over on non-transient contract or parser errors", async () => {
  const calls: string[] = [];
  const router = createRpcRouter({
    providers: [
      { name: "primary", url: "https://primary.test" },
      { name: "fallback", url: "https://fallback.test" },
    ],
    serverFactory: (provider) => ({ provider }),
  });

  await assert.rejects(
    router.request(async (server) => {
      calls.push(server.provider.name);
      throw new Error("Contract returned no value.");
    }),
    /Contract returned no value/,
  );

  assert.deepEqual(calls, ["primary"]);
  assert.equal(router.getActiveProvider().name, "primary");
});

test("treats Stellar SDK HTTP response statuses as transient", async (t) => {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 0 });

  const calls: string[] = [];
  const router = createRpcRouter({
    providers: [
      { name: "primary", url: "https://primary.test" },
      { name: "fallback", url: "https://fallback.test" },
    ],
    jitter: () => 0,
    serverFactory: (provider) => ({ provider }),
  });

  const routed = router.request(async (server) => {
    calls.push(server.provider.name);
    if (server.provider.name === "primary") {
      throw axiosStatus(429);
    }
    return "fallback-ok";
  });

  await flushTasks();
  t.mock.timers.tick(250);
  await flushTasks();

  assert.equal(await routed, "fallback-ok");
  assert.deepEqual(calls, ["primary", "fallback"]);
});

test("fails over on transient JSON-RPC error bodies", async (t) => {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 0 });

  const calls: string[] = [];
  const router = createRpcRouter({
    providers: [
      { name: "primary", url: "https://primary.test" },
      { name: "fallback", url: "https://fallback.test" },
    ],
    jitter: () => 0,
    serverFactory: (provider) => ({ provider }),
  });

  const routed = router.request(async (_server, provider) => {
    calls.push(provider.name);
    if (provider.name === "primary") {
      throw { error: { code: 429, message: "rate limited" } };
    }
    return "fallback-ok";
  });

  await flushTasks();
  t.mock.timers.tick(250);
  await flushTasks();

  assert.equal(await routed, "fallback-ok");
  assert.deepEqual(calls, ["primary", "fallback"]);
  assert.equal(router.getActiveProvider().name, "fallback");
});

test("routeRpcJsonRpc preserves Headers input and rejects JSON-RPC errors", async (t) => {
  let observedHeaders = new Headers();
  t.mock.method(globalThis, "fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
    observedHeaders = new Headers(init?.headers);
    return new Response(
      JSON.stringify({ error: { code: 429, message: "rate limited" } }),
      { status: 200 },
    );
  });

  await assert.rejects(
    () =>
      routeRpcJsonRpc(
        { jsonrpc: "2.0", id: "test", method: "getHealth", params: {} },
        { headers: new Headers([["Authorization", "Bearer test-token"]]) },
      ),
    /rate limited/,
  );

  assert.equal(observedHeaders.get("Authorization"), "Bearer test-token");
  assert.equal(observedHeaders.get("Content-Type"), "application/json");
});

test("unpins a provider after it fails transiently", async (t) => {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 0 });

  const calls: string[] = [];
  let fallbackHealthy = true;
  const router = createRpcRouter({
    providers: [
      { name: "primary", url: "https://primary.test" },
      { name: "fallback", url: "https://fallback.test" },
    ],
    jitter: () => 0,
    serverFactory: (provider) => ({ provider }),
  });

  const operation = async (server: { provider: { name: string } }) => {
    calls.push(server.provider.name);
    if (server.provider.name === "primary") return "primary-ok";
    if (fallbackHealthy) return "fallback-ok";
    throw transientStatus(503);
  };

  const first = router.request(async (server: { provider: { name: string } }) => {
    calls.push(server.provider.name);
    if (server.provider.name === "primary") throw transientStatus(503);
    return "fallback-ok";
  });
  await flushTasks();
  t.mock.timers.tick(250);
  await flushTasks();
  assert.equal(await first, "fallback-ok");
  assert.equal(router.getActiveProvider().name, "fallback");

  fallbackHealthy = false;
  const second = router.request(operation);
  await flushTasks();
  t.mock.timers.tick(250);
  await flushTasks();

  assert.equal(await second, "primary-ok");
  assert.deepEqual(calls, ["primary", "fallback", "fallback", "primary"]);
  assert.equal(router.getActiveProvider().name, "primary");
});

test("resolves RPC_PROVIDERS-compatible env strings in the server router layer", () => {
  assert.deepEqual(
    resolveRpcProviders({
      providerEnv:
        "sdf=https://soroban-testnet.stellar.org, fallback|https://rpc.example.test",
      fallbackUrl: "https://unused.example.test",
    }),
    [
      { name: "sdf", url: "https://soroban-testnet.stellar.org" },
      { name: "fallback", url: "https://rpc.example.test" },
    ],
  );

  assert.deepEqual(
    resolveRpcProviders({
      providerEnv: undefined,
      fallbackUrl: "https://primary.example.test",
    }),
    [{ name: "primary", url: "https://primary.example.test" }],
  );
});

test("browser contract client stays separated from the server RPC router", async () => {
  const source = await readFile(new URL("./contract-client.ts", import.meta.url), "utf8");

  assert.doesNotMatch(source, /rpc-router/);
  assert.doesNotMatch(source, /RPC_PROVIDERS/);
});

test("fails over when the primary connection is refused (dead provider)", async (t) => {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 0 });

  // Node's undici fetch surfaces a dead host as TypeError("fetch failed")
  // with the syscall error in `cause` — exactly what "kill the primary RPC
  // live" produces in the demo.
  const connectionRefused = new TypeError("fetch failed", {
    cause: Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:9999"), {
      code: "ECONNREFUSED",
    }),
  });

  const calls: string[] = [];
  const router = createRpcRouter({
    providers: [
      { name: "dead", url: "http://127.0.0.1:9999" },
      { name: "fallback", url: "https://fallback.test" },
    ],
    jitter: () => 0,
    serverFactory: (provider) => ({ provider }),
  });

  const routed = router.request(async (server) => {
    const providerName = (server as { provider: { name: string } }).provider.name;
    calls.push(providerName);
    if (providerName === "dead") {
      throw connectionRefused;
    }
    return "fallback-ok";
  });

  await flushTasks();
  t.mock.timers.tick(250);
  await flushTasks();

  assert.equal(await routed, "fallback-ok");
  assert.deepEqual(calls, ["dead", "fallback"]);
  assert.equal(router.getActiveProvider().name, "fallback");
});

test("DNS failures and socket resets are transient too", async (t) => {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 0 });

  for (const cause of [
    { code: "ENOTFOUND", message: "getaddrinfo ENOTFOUND rpc.example" },
    { code: "ECONNRESET", message: "socket hang up" },
    { code: "EAI_AGAIN", message: "getaddrinfo EAI_AGAIN rpc.example" },
  ]) {
    const error = new TypeError("fetch failed", {
      cause: Object.assign(new Error(cause.message), { code: cause.code }),
    });
    const calls: string[] = [];
    const router = createRpcRouter({
      providers: [
        { name: "dead", url: "https://dead.test" },
        { name: "fallback", url: "https://fallback.test" },
      ],
      jitter: () => 0,
      serverFactory: (provider) => ({ provider }),
    });
    const routed = router.request(async (server) => {
      const providerName = (server as { provider: { name: string } }).provider.name;
      calls.push(providerName);
      if (providerName === "dead") throw error;
      return "ok";
    });
    await flushTasks();
    t.mock.timers.tick(250);
    await flushTasks();
    assert.equal(await routed, "ok", cause.code);
    assert.deepEqual(calls, ["dead", "fallback"], cause.code);
  }
});
