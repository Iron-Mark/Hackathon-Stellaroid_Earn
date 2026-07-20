import { expect, test } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";

// E2E coverage for the public read-only MCP server at /api/mcp (Streamable
// HTTP). Runs in NEXT_PUBLIC_E2E_MODE=1, so the read layer serves the
// deterministic fixtures (sample proof hash, opportunity #1, issuer record)
// instead of live RPC.
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
};

// Streamable HTTP frames JSON-RPC responses as SSE `data:` lines.
async function mcpCall(
  request: APIRequestContext,
  method: string,
  params: Record<string, unknown>,
  id: number,
): Promise<JsonRpcResult> {
  const response = await request.post("/api/mcp", {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    data: { jsonrpc: "2.0", id, method, params },
  });
  expect(response.status()).toBe(200);
  const body = await response.text();
  const dataLine = body
    .split("\n")
    .find((line) => line.startsWith("data: "));
  expect(dataLine, `no SSE data frame in response: ${body.slice(0, 200)}`).toBeTruthy();
  return JSON.parse((dataLine as string).slice(6)) as JsonRpcResult;
}

function toolPayload(rpc: JsonRpcResult): {
  note: string;
  data: Record<string, never> & Record<string, unknown>;
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
  expect(rpc.result?.content?.[0]?.text).toContain("Input validation error");
});

test("get_opportunity returns hex certHash and a consistent proof link", async ({ request }) => {
  const rpc = await mcpCall(
    request,
    "tools/call",
    { name: "get_opportunity", arguments: { id: 1 } },
    5,
  );
  const payload = toolPayload(rpc);
  expect(payload.data.found).toBe(true);
  expect(String(payload.data.certHash)).toMatch(/^[0-9a-f]{64}$/);
  expect(payload.data.proofUrl).toBe(
    `https://stellaroid.tech/proof/${payload.data.certHash}`,
  );
  expect(String(payload.data.amountStroops)).toMatch(/^\d+$/);
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
    6,
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
    7,
  );
  const payload = toolPayload(rpc);
  expect(payload.data.readOnly).toBe(true);
  expect(payload.data.testnetOnly).toBe(true);
  expect(String(payload.data.docsUrl)).toContain("/docs/contract");
});
