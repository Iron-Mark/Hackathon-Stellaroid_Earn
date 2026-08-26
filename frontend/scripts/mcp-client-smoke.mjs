// Smoke-test the MCP server with the OFFICIAL MCP client (real handshake +
// Streamable HTTP transport), not raw curl. Usage:
//   node scripts/mcp-client-smoke.mjs [endpoint-url]
// Defaults to production. Exits non-zero on any failure.
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

const ENDPOINT = process.argv[2] ?? "https://stellaroid.tech/api/mcp";
const SAMPLE_HASH =
  "c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3";

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

const client = new Client({ name: "stellaroid-smoke", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(new URL(ENDPOINT));

await client.connect(transport);
console.log("connected:", ENDPOINT);

const { tools } = await client.listTools();
const names = tools.map((t) => t.name).sort();
console.log("tools:", names.join(", "));
if (names.length !== 6) fail(`expected 6 tools, got ${names.length}`);

// Bare call with NO arguments key — the spec-legal form real clients send.
const info = await client.callTool({ name: "get_contract_info" });
const infoData = JSON.parse(info.content[0].text).data;
if (!infoData.readOnly || !infoData.testnetOnly) {
  fail("get_contract_info posture flags missing");
}
console.log("get_contract_info (bare call): ok — contract", infoData.contractId.slice(0, 8) + "…");

const verify = await client.callTool({
  name: "verify_credential",
  arguments: { hash: SAMPLE_HASH },
});
const verifyData = JSON.parse(verify.content[0].text).data;
if (verifyData.verified !== true) fail("sample credential not verified");
console.log("verify_credential: ok —", verifyData.status, "|", verifyData.proofUrl);

await client.close();
console.log("SMOKE PASS");
