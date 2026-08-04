# Stellaroid Earn MCP Server — Design

**Date:** 2026-07-20 · **Status:** Approved (user: proceed e2e autonomously)

## Goal

Ship a public, **read-only** remote MCP (Model Context Protocol) server so AI
agents can verify credentials, inspect issuers, and browse escrowed paid trials
on the Stellaroid Earn testnet contract — the machine-access capstone to the
existing `llms.txt` + public read APIs.

Value is demo/portfolio/differentiation (domain-curated credential tools), not
organic usage. Everything stays on Stellar **testnet**.

## Hard constraints (user-set)

- **First-party dependencies only.** No community Stellar MCP repos
  (`syronlabs/stellar-mcp`, `kalepail/*`, `@mseep/*` are all unofficial —
  verified 2026-07-20). Allowed: Vercel's `mcp-handler`, the official
  `@modelcontextprotocol/sdk` (pin ≥1.26.0 — DNS-rebinding advisory below),
  `zod` (already the SDK's validation layer), and the already-trusted
  `@stellar/stellar-sdk` via our existing read layer.
- **Read-only, no auth, no secrets.** MCP auth is spec-OPTIONAL; adding OAuth
  to a public-data server would introduce the very token-audience/confused-
  deputy attack surface read-only avoids. No signing keys reachable from any
  tool handler.
- **Stateless.** No Redis (only needed for SSE resumability). Streamable HTTP
  transport only.

## Architecture

- Route: `frontend/src/app/api/[transport]/route.ts` via `createMcpHandler`
  (basePath `/api`) → endpoint **`https://stellaroid.tech/api/mcp`**.
  An explicit `HEAD /api/mcp` handler returns `204` without entering the
  streamable transport, keeping platform and uptime probes fast.
  Static `/api/*` routes (events, health, fee-bump, pilot-lead, client-error)
  take precedence over the dynamic segment, so nothing is shadowed.
- Tool handlers call the **existing server read layer**
  (`lib/contract-read-server.ts`, `lib/events.ts`, `lib/issuer-registry.ts`) —
  no new chain-access code.
- Middleware/CSP applies as-is (harmless for JSON-RPC); robots already
  disallows `/api/`.

## Tools (all read-only, zod-validated inputs)

| Tool | Input | Backed by |
|---|---|---|
| `verify_credential` | `hash` (64-hex) | `getCertificateServer` + issuer lookup; returns status, issuer, timestamps, proof URL, stellar.expert link |
| `get_issuer` | `address` (G... 56) | `getIssuerServer` + local trust registry |
| `list_opportunities` | `limit` (1–25, default 10) | `listOpportunitiesServer`; amount in XLM + stroops |
| `get_opportunity` | `id` (u64 string/number) | `getOpportunityServer` |
| `recent_events` | `limit` (1–20, default 5) | `getRecentEventsCached` (shared TTL cache) |
| `get_contract_info` | — | static config: contract id, network, explorer/docs/repo links |

## Security posture

- **Prompt-injection via tool output is the #1 residual risk**: on-chain
  strings (titles, cohorts, issuer names, metadata URIs) are third-party
  content. Mitigation: every string field passes a sanitizer (strip control
  chars, truncate to 300 chars) and every tool response carries a
  `note` marking on-chain strings as untrusted data, not instructions.
- **Abuse/cost**: in-memory fixed-window rate limit per IP inside the route
  (defense-in-depth) + an additive Vercel WAF rate-limit rule for
  `/api/mcp` (hard global cap), mirroring the existing events/fee-bump/
  pilot-lead rules. TLS is platform-automatic.
- **SDK advisory**: `@modelcontextprotocol/sdk` pinned ≥1.26.0
  (CVE-2026-11624 family: DNS-rebinding/Origin validation — low impact for a
  remote server, pinned anyway).

## Error handling

- Invalid input → zod rejection (protocol-level error, no RPC call made).
- Well-formed but unknown hash/address/id → structured `found: false` result
  (mirrors the proof page's "no record" behavior), never a throw.
- RPC failure → JSON-RPC tool error with a generic message (no internals).

## Verification plan

1. Dev server: raw Streamable-HTTP JSON-RPC — `initialize`, `tools/list`,
   `tools/call verify_credential` with the seeded verified hash
   (`c02ce160…aea3`) against the live testnet contract; expect
   `status: verified`, correct issuer.
2. Negative: junk hash → zod error; unknown-but-valid hash → `found: false`.
3. `npm run lint` + `npm run test:unit` green; existing routes unaffected.
4. Post-deploy: same JSON-RPC probe against `https://stellaroid.tech/api/mcp`.

## Out of scope

Writes/signing, OAuth, SSE/Redis, MCP registry publication (may follow later),
mainnet anything.
