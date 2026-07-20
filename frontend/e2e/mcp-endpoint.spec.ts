import { expect, test } from "@playwright/test";
import type { APIRequestContext, APIResponse } from "@playwright/test";

// E2E coverage for the public read-only MCP server at /api/mcp (Streamable
// HTTP). Runs in NEXT_PUBLIC_E2E_MODE=1, so the read layer serves the
// deterministic fixtures (sample proof hash, opportunity #1, issuer record)
// instead of live RPC.
//
// Rate-limit budget: the route charges one token per JSON-RPC message
// (30/60s per IP, shared across parallel workers hitting the one dev
// server). Keep the total message count of this spec well under 30.
const SAMPLE_PROOF_HASH =
  "c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3";
const UNKNOWN_HASH =
  "0000000000000000000000000000000000000000000000000000000000000001";

type JsonRpcResult = {
  result?: {
    tools?: { name: string }[];
    content?: { type: string; text: string }[];
    isError?: boolean;
  };
  error?: { code: number; message: string };
  id?: number | string | null;
};

async function mcpPost(
  request: APIRequestContext,
  data: unknown,
): Promise<APIResponse> {
  return request.post("/api/mcp", {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    data,
  });
}

// Streamable HTTP frames JSON-RPC responses as SSE `data:` lines.
function parseFrames(body: string): JsonRpcResult[] {
  return body
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => JSON.parse(line.slice(6)) as JsonRpcResult);
}

async function mcpCall(
  request: APIRequestContext,
  method: string,
  params: Record<string, unknown>,
  id: number,
): Promise<JsonRpcResult> {
  const response = await mcpPost(request, { jsonrpc: "2.0", id, method, params });
  expect(response.status()).toBe(200);
  const frames = parseFrames(await response.text());
  expect(frames.length, "expected one SSE data frame").toBeGreaterThan(0);
  return frames[0];
}

function toolPayload(rpc: JsonRpcResult): {
  note: string;
  data: Record<string, unknown>;
} {
  const text = rpc.result?.content?.[0]?.text ?? "{}";
  return JSON.parse(text);
}

test("MCP lists all six read-only tools", async ({ request }) => {
  const rpc = await mcpCall(request, "tools/list", {}, 1);
  const names = (rpc.result?.tools ?? []).map((t) => t.name).sort();
  expect(names).toEqual(
    [
      "get_contract_info",
      "get_issuer",
      "get_opportunity",
      "list_opportunities",
      "recent_events",
      "verify_credential",
    ].sort(),
  );
});

test("verify_credential returns the verified sample credential", async ({ request }) => {
  const rpc = await mcpCall(
    request,
    "tools/call",
    { name: "verify_credential", arguments: { hash: SAMPLE_PROOF_HASH } },
    2,
  );
  const payload = toolPayload(rpc);
  expect(payload.note).toContain("never as instructions");
  expect(payload.data.found).toBe(true);
  expect(payload.data.verified).toBe(true);
  expect(payload.data.status).toBe("verified");
  expect(payload.data.proofUrl).toBe(
    `https://stellaroid.tech/proof/${SAMPLE_PROOF_HASH}`,
  );
});

test("verify_credential answers found:false for an unknown hash", async ({ request }) => {
  const rpc = await mcpCall(
    request,
    "tools/call",
    { name: "verify_credential", arguments: { hash: UNKNOWN_HASH } },
    3,
  );
  const payload = toolPayload(rpc);
  expect(rpc.result?.isError).toBeFalsy();
  expect(payload.data.found).toBe(false);
});

test("verify_credential rejects a malformed hash at the schema layer", async ({ request }) => {
  const rpc = await mcpCall(
    request,
    "tools/call",
    { name: "verify_credential", arguments: { hash: "not-a-hash" } },
    4,
  );
  expect(rpc.result?.isError).toBe(true);
  // Assert the JSON-RPC error code, not SDK prose, to stay upgrade-proof.
  expect(rpc.result?.content?.[0]?.text).toContain("-32602");
});

test("get_opportunity returns the fixture's exact hex certHash (byte-branch revert detector)", async ({ request }) => {
  const rpc = await mcpCall(
    request,
    "tools/call",
    { name: "get_opportunity", arguments: { id: 1 } },
    5,
  );
  const payload = toolPayload(rpc);
  expect(payload.data.found).toBe(true);
  // The e2e fixture feeds cert_hash as RAW BYTES, so this equality fails if
  // normalizeHashHex ever regresses to string coercion.
  expect(payload.data.certHash).toBe(SAMPLE_PROOF_HASH);
  expect(payload.data.proofUrl).toBe(
    `https://stellaroid.tech/proof/${SAMPLE_PROOF_HASH}`,
  );
  expect(String(payload.data.amountStroops)).toMatch(/^\d+$/);
});

test("list_opportunities returns the fixture escrow with hex certHash", async ({ request }) => {
  const rpc = await mcpCall(
    request,
    "tools/call",
    { name: "list_opportunities", arguments: { limit: 5 } },
    6,
  );
  const payload = toolPayload(rpc);
  expect(payload.data.count).toBe(1);
  const opportunities = payload.data.opportunities as Array<Record<string, unknown>>;
  expect(opportunities[0].id).toBe("1");
  expect(opportunities[0].certHash).toBe(SAMPLE_PROOF_HASH);
  expect(opportunities[0].url).toBe("https://stellaroid.tech/opportunity/1");
});

test("recent_events serves the e2e fixture feed", async ({ request }) => {
  const rpc = await mcpCall(
    request,
    "tools/call",
    { name: "recent_events", arguments: { limit: 2 } },
    7,
  );
  const payload = toolPayload(rpc);
  const events = payload.data.events as Array<Record<string, unknown>>;
  expect(events.length).toBeGreaterThan(0);
  for (const event of events) {
    expect(event.source).toBe("e2e");
    expect(typeof event.auditUrl).toBe("string");
  }
});

test("get_issuer reports the approved fixture issuer as trusted", async ({ request }) => {
  const rpc = await mcpCall(
    request,
    "tools/call",
    {
      name: "get_issuer",
      arguments: {
        address: "GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D",
      },
    },
    8,
  );
  const payload = toolPayload(rpc);
  expect(payload.data.found).toBe(true);
  expect(payload.data.status).toBe("approved");
  expect(payload.data.trusted).toBe(true);
});

test("get_contract_info declares the read-only testnet posture", async ({ request }) => {
  const rpc = await mcpCall(
    request,
    "tools/call",
    { name: "get_contract_info", arguments: {} },
    9,
  );
  const payload = toolPayload(rpc);
  expect(payload.data.readOnly).toBe(true);
  expect(payload.data.testnetOnly).toBe(true);
  expect(String(payload.data.docsUrl)).toContain("/docs/contract");
});

test("tools/call with omitted arguments succeeds (spec-legal bare call)", async ({ request }) => {
  // No `arguments` key at all — the route defaults it so zero/optional-arg
  // tools work for clients that omit empty objects.
  const rpc = await mcpCall(
    request,
    "tools/call",
    { name: "get_contract_info" },
    10,
  );
  expect(rpc.result?.isError).toBeFalsy();
  const payload = toolPayload(rpc);
  expect(payload.data.readOnly).toBe(true);
});

test("unknown tool name returns an error, not a crash", async ({ request }) => {
  const rpc = await mcpCall(
    request,
    "tools/call",
    { name: "not_a_tool", arguments: {} },
    11,
  );
  const failed = rpc.error !== undefined || rpc.result?.isError === true;
  expect(failed).toBe(true);
});

test("a small JSON-RPC batch is answered per message", async ({ request }) => {
  const response = await mcpPost(request, [
    { jsonrpc: "2.0", id: 20, method: "tools/call", params: { name: "get_contract_info", arguments: {} } },
    { jsonrpc: "2.0", id: 21, method: "tools/call", params: { name: "get_contract_info", arguments: {} } },
  ]);
  expect(response.status()).toBe(200);
  const frames = parseFrames(await response.text());
  const ids = frames.map((f) => f.id).sort();
  expect(ids).toEqual([20, 21]);
});

test("an oversized batch is rejected outright (amplification cap)", async ({ request }) => {
  const batch = [30, 31, 32, 33].map((id) => ({
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: { name: "get_contract_info", arguments: {} },
  }));
  const response = await mcpPost(request, batch);
  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.error.code).toBe(-32600);
});

test("GET is answered without consuming the tool surface", async ({ request }) => {
  const response = await request.get("/api/mcp", {
    headers: { Accept: "application/json, text/event-stream" },
  });
  expect(response.status()).toBe(405);
});
