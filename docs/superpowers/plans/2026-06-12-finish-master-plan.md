# Finish Master Plan (P0-5 → P0-2 → P0-4 → P1 → M-1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete every remaining work item in `setup/master-plan.md` (P0-2, P0-4, P0-5, P1-1, P1-2, P1-3, P1-4, M-1) on top of the already-built P0-1 RPC router and P0-3 PDAX client.

**Architecture:** All logic lives in pure, injectable modules under `frontend/src/lib/` with colocated `*.test.ts` run by the Node built-in runner (`--experimental-strip-types`, so lib-internal imports use relative `./x.ts` paths). Routes and pages stay thin. No DB: payout state derives from on-chain reads + HMAC-signed stateless tokens. Everything works in `PDAX_MODE=mock` with zero secrets.

**Tech Stack:** Next.js 15 App Router, React 19, `@stellar/stellar-sdk` 13, Node test runner, Horizon testnet REST, CoinGecko simple-price API.

**Working Agreement reminders (from spec §0):** never set/commit mainnet or production env values; secrets server-only; public `/proof/[hash]` gains no login/wallet/payment dependencies; run `npm run lint && npm run test:unit && npm run build` before declaring any task done (`npm run test:e2e` for route-touching tasks).

**Existing interfaces this plan builds on (verified 2026-06-12):**
- `rpc-router.ts`: `routeRpcOperation(op)`, `routeRpcJsonRpc(body, init)`, `getActiveProvider()`
- `pdax-client.ts`: `getTicker(pair)` → `{ last, timestamp, ... }`, mode from `PDAX_MODE` (default `mock`), throws if imported in client bundle
- `contract-read-server.ts`: `getCertificateServer(hex)` → `CertificateRecord | null` (`{ owner, issuer, title, cohort, metadataUri, status, issuedAt, verifiedAt, expiresAt, verified }`)
- `proof-metadata.ts`: `getProofMetadataForCertificate(hash, cert)` → `ProofMetadata | null`
- `issuer-registry.ts`: `lookupIssuer(address)` → `{ name, category, url? } | null`
- `app/proof/[hash]/page.tsx`: `const HASH_RE = /^[0-9a-f]{64}$/i` gate; `revalidate = 60`
- `demo-data.ts`: `DEFAULT_SAMPLE_PROOF_HASH`
- Test command: `cd frontend && npm run test:unit` (or single file: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test src/lib/<file>.test.ts`)

---

### Task 0: Checkpoint commits (protect P0-1 + P0-3)

**Files:** none created; staging only.

- [ ] **Step 0.1: Commit P0-1**

```bash
cd /Users/kuya/Documents/STELLAR/Hackathon-Stellaroid_Earn
git add frontend/src/lib/rpc-router.ts frontend/src/lib/rpc-router.test.ts \
  frontend/src/lib/config.ts frontend/src/lib/contract-client.ts \
  frontend/src/lib/contract-read-server.ts frontend/src/lib/health-report.ts \
  frontend/src/app/status/page.tsx
git commit -m "feat(rpc): add RPC fallback router with failover and provider pinning (P0-1)"
```

- [ ] **Step 0.2: Commit P0-3**

```bash
git add frontend/src/lib/pdax-sign.ts frontend/src/lib/pdax-sign.test.ts \
  frontend/src/lib/pdax-client.ts frontend/src/lib/pdax-client.test.ts \
  frontend/src/lib/pdax-fixtures.ts
git commit -m "feat(pdax): add mock-first PDAX client with HMAC request signing (P0-3)"
```

- [ ] **Step 0.3: Commit spec swap + this plan**

```bash
git add setup/master-plan.md docs/superpowers/plans/2026-06-12-finish-master-plan.md
git commit -m "docs: adopt v2 feature spec and implementation plan"
```

No Claude co-author trailers on any commit (repo rule).

---

### Task 1: P0-5 — Open Badges 3.0 credential JSON

**Files:**
- Create: `frontend/src/lib/open-badge.ts`
- Test: `frontend/src/lib/open-badge.test.ts`
- Create: `frontend/src/app/proof/[hash]/credential.json/route.ts`

- [ ] **Step 1.1: Write failing tests** for a pure mapper `buildOpenBadgeCredential`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { buildOpenBadgeCredential } from "./open-badge.ts";

const input = {
  hash: "a".repeat(64),
  baseUrl: "https://stellaroid.example",
  network: "testnet" as const,
  cert: {
    owner: "GOWNER...", issuer: "GISSUER...",
    title: "Bootcamp Completion", cohort: "PH 2026",
    metadataUri: "", status: "verified" as const,
    issuedAt: 1767168000, verifiedAt: 1767168100, expiresAt: 0, verified: true,
  },
  metadata: { title: "Bootcamp Completion", description: "desc", skills: ["Soroban"], criteria: "crit", cohort: "PH 2026", evidence: [] },
  issuerInfo: { name: "Stellar PH UniTour", category: "bootcamp" as const, url: "https://stellaroid.tech" },
};

test("golden shape for demo data", () => {
  const vc = buildOpenBadgeCredential(input);
  assert.deepEqual(vc["@context"], [
    "https://www.w3.org/ns/credentials/v2",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
  ]);
  assert.deepEqual(vc.type, ["VerifiableCredential", "OpenBadgeCredential"]);
  assert.equal(vc.id, `${input.baseUrl}/proof/${input.hash}/credential.json`);
  assert.equal(vc.issuer.name, "Stellar PH UniTour");
  assert.equal(vc.credentialSubject.achievement.name, "Bootcamp Completion");
  assert.equal(typeof vc.validFrom, "string");
  assert.ok(!("proof" in vc)); // roadmap: Data Integrity proof
});
test("required fields always present even with null metadata/issuerInfo", () => {
  const vc = buildOpenBadgeCredential({ ...input, metadata: null, issuerInfo: null });
  assert.ok(vc.issuer.id && vc.credentialSubject.achievement.name);
});
```

- [ ] **Step 1.2: Run `node --experimental-strip-types --test src/lib/open-badge.test.ts`** — expect FAIL (module not found).
- [ ] **Step 1.3: Implement `open-badge.ts`** — pure mapper, JSDoc noting omitted `proof` block is roadmap (Data Integrity / eddsa cryptosuite). `issuer.id` = `did:web` style or the explorer account URL; achievement criteria/skills from metadata; `validFrom` from `issuedAt` (epoch seconds → ISO). Include `"network"` claim naming testnet/mainnet explicitly (spec §8.2).
- [ ] **Step 1.4: Run tests — expect PASS.**
- [ ] **Step 1.5: Implement the route** `app/proof/[hash]/credential.json/route.ts`: `export const revalidate = 60`; validate `/^[0-9a-f]{64}$/i` before any read (404 JSON on failure); `getCertificateServer` → 404 if null; respond `NextResponse.json(vc, { headers: { "Content-Type": "application/vc+ld+json" } })`.
- [ ] **Step 1.6: Gates:** `npm run lint && npm run test:unit && npm run build`. Manual: `curl localhost:3000/proof/<DEFAULT_SAMPLE_PROOF_HASH>/credential.json` with `NEXT_PUBLIC_E2E_MODE=1` dev server.
- [ ] **Step 1.7: Commit** `feat(proof): add Open Badges 3.0 credential.json route (P0-5)`

---

### Task 2: P0-2 — PHP quote module + API + FiatValue

**Files:**
- Create: `frontend/src/lib/quote.ts`; Test: `frontend/src/lib/quote.test.ts`
- Create: `frontend/src/app/api/quote/route.ts`
- Create: `frontend/src/components/ui/fiat-value.tsx`
- Modify: proof page payment section (mount `<FiatValue>`)

- [ ] **Step 2.1: Failing tests** for `getQuote` with injected `{ fetchImpl, now, pdaxTicker }`:
  - staging mode prefers PDAX ticker (`source: "pdax-staging"`)
  - mock mode skips PDAX, uses CoinGecko (`source: "coingecko"`)
  - CoinGecko failure → last-good cache (`source: "cache", stale: true`)
  - total failure with empty cache → `null` (never throws)
  - TTL: second call within `QUOTE_TTL_SECONDS` hits cache without fetch; after expiry refetches
- [ ] **Step 2.2: Run — FAIL.**
- [ ] **Step 2.3: Implement `quote.ts`** (server-only; `typeof window` guard like pdax-client):

```ts
export type Quote = { price: number; asOf: string; source: "pdax-staging" | "coingecko" | "cache"; stale: boolean };
export async function getQuote(asset: "XLM", fiat: "PHP", deps?: QuoteDeps): Promise<Quote | null>;
// chain: PDAX getTicker("XLM/PHP").last when PDAX_MODE==="staging" → CoinGecko
// https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=php (5s withTimeout)
// → module-level lastGood cache flagged stale → null. Cache TTL from QUOTE_TTL_SECONDS (default 60).
// export resetQuoteCacheForTests().
```

- [ ] **Step 2.4: Run — PASS.**
- [ ] **Step 2.5: API route** `app/api/quote/route.ts`: GET → `getQuote("XLM","PHP")`; headers `Cache-Control: s-maxage=60, stale-while-revalidate=300`; reuse the in-memory rate-limit pattern from `fee-bump-policy.ts` (read it first; mirror its window/limit approach); body `{ quote }` (quote may be null — 200 always, page never errors).
- [ ] **Step 2.6: `<FiatValue amount={xlm} />`** client component: fetches `/api/quote` once on mount, renders `≈ ₱X,XXX.XX` + `as of HH:mm` + amber "stale" badge when `quote.stale`; renders nothing when quote null. Use ui-ux-pro-max guidance + existing design tokens (`text-text-muted`, etc.). 44px touch targets not needed (non-interactive); add `aria-live="polite"`.
- [ ] **Step 2.7: Mount** in proof page payment section (and later payout page). Confirm `/proof/[hash]` still renders with network blocked (acceptance).
- [ ] **Step 2.8: Gates** incl. `npm run test:e2e`. **Commit** `feat(quote): add PHP quote chain with FiatValue display (P0-2)`

---

### Task 3: P0-4 — Credential-gated payout intents (demo centerpiece)

**Files:**
- Create: `frontend/src/lib/payout-intent.ts`; Test: `frontend/src/lib/payout-intent.test.ts`
- Create: `frontend/src/lib/payment-detect.ts`; Test: `frontend/src/lib/payment-detect.test.ts`
- Create: `frontend/src/app/payout/[id]/page.tsx`
- Create: `frontend/src/app/api/payout-intent/route.ts` (POST: create signed intent)
- Create: `frontend/src/components/actions/payout-link-form.tsx`; Modify: `frontend/src/app/employer/page.tsx`

- [ ] **Step 3.1: Failing tests — intent token.** `encodePayoutIntent(payload, secret)` → base64url `payload.signature`; `decodePayoutIntent(token, secret)` verifies HMAC-SHA256 (timing-safe), validates shape (`credentialHash` 64-hex, `recipientAddress` G-address via regex `^G[A-Z2-7]{55}$`, `amountXlm` positive 7-dp string, `createdAt` ISO). Tests: round-trip; tampered payload rejected; wrong secret rejected; malformed token → null not throw.
- [ ] **Step 3.2: Implement** with `node:crypto` `createHmac`/`timingSafeEqual`. Secret from `PAYOUT_INTENT_SECRET`; when unset and `NODE_ENV !== "production"`, derive a fixed dev secret and export `isDevSecret` so the UI can badge demo mode. Server-only guard.
- [ ] **Step 3.3: Failing tests — payment matching.** Pure `matchPayment(records, intent, { toleranceStroops = 0n, windowMs })`: finds first Horizon payment record with `to === recipientAddress`, `asset_type === "native"`, `amount` ≥ intent amount (string 7-dp compare via bigint stroops), `created_at > intent.createdAt`. Wrong-sender is fine (any sender counts — employer pays from their own wallet); wrong recipient/old/underpaid rejected. Also `deriveIntentState({ cert, payment })` → `"intent_created" | "credential_verified" | "payment_detected"` ladder (offramp_guided/settled are UI-only steps).
- [ ] **Step 3.4: Implement `payment-detect.ts`**: `fetchRecentPayments(address, { horizonUrl, fetchImpl })` GET `${horizonUrl}/accounts/${address}/payments?order=desc&limit=20` with 5s `withTimeout`; tolerate 404 (unfunded account) → `[]`. `HORIZON_URL` env default `https://horizon-testnet.stellar.org`. Pure matcher separated for tests.
- [ ] **Step 3.5: API route** `app/api/payout-intent/route.ts` POST `{ credentialHash, recipientAddress, amountXlm }` → validates, verifies credential exists on-chain (`getCertificateServer`), returns `{ url: "/payout/<token>" }`. Rate-limit like fee-bump.
- [ ] **Step 3.6: Payout page** `app/payout/[id]/page.tsx` server component, `dynamic = "force-dynamic"`:
  1. decode token (invalid → clear error state, nothing leaks)
  2. verify credential via `getCertificateServer` (through P0-1 router) → step 1 badge
  3. `fetchRecentPayments` + `matchPayment` → step 2 with tx hash link to explorer; auto-refresh via `<meta httpEquiv="refresh" content="15">` equivalent (small client poller component) while waiting
  4. `<FiatValue amount={amountXlm}>` → step 3
  5. off-ramp guidance placeholder section (Task 4 fills it) → step 4
  Use checklist UI consistent with existing components; ui-ux-pro-max for layout pass.
- [ ] **Step 3.7: Employer "create payout link"**: client form (cert hash, recipient, amount) → POST api → show link + QR (reuse `proof-qr.tsx` pattern / `qrcode` dep).
- [ ] **Step 3.8: Stellar CLI acceptance (testnet):**

```bash
stellar keys generate employer-demo --network testnet --fund
stellar tx new payment --source employer-demo --destination <recipientAddress> \
  --amount 250000000 --network testnet   # 25 XLM in stroops
```

Open the payout link before and after: page must flip to payment_detected with tx evidence.
- [ ] **Step 3.9: Gates** incl. e2e. **Commit** `feat(payout): credential-gated payout intents with live payment detection (P0-4)`

---

### Task 4: P1-1 — Off-ramp guide

**Files:** Create `frontend/src/components/payout/offramp-guide.tsx`; Modify payout page.

- [ ] Static, PH-localized plain-language steps (PDAX account + KYC, deposit XLM to own account, PHPT pairing note flagged "verify current pairing", fees, timelines). Mandatory banner: "Stellaroid never holds your funds — this guide walks you through YOUR exchange account." When network is testnet show "demo mode — testnet XLM has no cash value" notice. No tests needed beyond lint/build (pure presentational), but add a render smoke via e2e route check.
- [ ] **Commit** `feat(payout): add PH off-ramp guide (P1-1)`

---

### Task 5: P1-4 — /status additions

**Files:** Modify `frontend/src/lib/health-report.ts`, `frontend/src/app/status/page.tsx`.

- [ ] Extend `HealthReport.checks` with `quote: { ok, source, asOf, stale }` (call `getQuote`, null-safe) and `pdax: { mode }` (env read; never call PDAX network here in mock). Update status page cards. Reconcile timestamp added in Task 6.
- [ ] Tests: extend existing health-report expectations if present; run gates. **Commit** `feat(status): surface quote freshness and PDAX mode (P1-4)`

---

### Task 6: P1-2 — Reconciliation script

**Files:** Create `frontend/scripts/reconcile.ts`; Modify `frontend/package.json` (`"ops:reconcile": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types scripts/reconcile.ts"`).

- [ ] Accept intent URL or raw token argv; decode (PAYOUT_INTENT_SECRET env), re-derive full state via `getCertificateServer` + `fetchRecentPayments`/`matchPayment`; print JSON report `{ token, state, checks: [...], ok }`; `process.exit(ok ? 0 : 1)`. Idempotent — read-only. Unit-test the report builder as a pure function in `src/lib/` if any logic exceeds glue.
- [ ] Update `/status` to show "last reconcile" only if trivially derivable; otherwise document in README that ops runs it manually (don't add storage — no DB rule).
- [ ] **Commit** `feat(ops): add idempotent payout reconcile script (P1-2)`

---

### Task 7: M-1 — Dual-network architecture (build now, testnet default)

**Files:** Create `frontend/src/lib/network.ts` + test; Modify `config.ts` consumers minimally; Create `frontend/src/components/layout/network-badge.tsx`; Modify proof page + credential.json to state network.

- [ ] `resolveNetwork(env)` pure: `STELLAR_NETWORK` (`testnet` default | `mainnet`) → `{ name, passphrase, contractId (CONTRACT_ID_TESTNET | CONTRACT_ID_MAINNET), rpcProviders, horizonUrl, explorerBase }`. Tests inject env objects — mainnet path tested with fake values, zero live mainnet calls, never default mainnet. Existing `appConfig` stays authoritative for current behavior; `network.ts` wraps/feeds it without breaking the public API.
- [ ] Persistent `NetworkBadge` in layout (server component, reads resolved network). credential.json includes network claim (done in Task 1 — verify wiring).
- [ ] Gates. **Commit** `feat(network): dual-network resolution with testnet default (M-1)`

---

### Task 8: P1-3 — Bundle split

**Files:** Modify wallet-touching component imports to `next/dynamic`; Modify `next.config.ts` (wrap with `@next/bundle-analyzer`, dev-dep).

- [ ] Record before: `npm run build` first-load JS for `/`, `/proof/[hash]`.
- [ ] `next/dynamic(() => import(...), { ssr: false })` for Freighter-touching components so wallet code loads only on `/app`, `/issuer`, `/employer`. Verify landing + proof chunks contain no `freighter` or `pdax` (grep `.next/static/chunks`).
- [ ] Record after numbers in the commit message. Gates incl. e2e. **Commit** `perf(bundle): lazy-load wallet code off landing and proof routes (P1-3)`

---

### Task 9: Final verification + docs

- [ ] `npm run lint && npm run test:unit && npm run build && npm run test:e2e` all green.
- [ ] README feature table rows for each shipped item (spec §6).
- [ ] Demo script §5 dry-run: proof URL → credential.json tab → create payout link → CLI payment (`stellar tx new payment`) → page flips → peso value → off-ramp guide → kill primary RPC (set `RPC_PROVIDERS` with a dead primary) → still green via fallback.
- [ ] **Commit** `docs: update feature table and verify demo script end-to-end`

---

## Self-review notes

- Spec coverage: P0-2 (Task 2), P0-4 (Task 3), P0-5 (Task 1), P1-1 (4), P1-2 (6), P1-3 (8), P1-4 (5), M-1 (7). M-2/M-3/M-4 deferred: M-2 needs a deploy script tripwire (`docs/audit/` empty check) — add only if time remains after Task 9; M-3 reuses Task 3's machine unchanged behind `ENABLE_MAINNET_PAYMENTS=false` (flag read added in Task 7); M-4 is a mode string addition already supported by pdax-client. P2 items explicitly post-demo.
- Type consistency: `Quote`, `CertificateRecord`, `PayoutIntent` names used consistently across tasks.
- No mainnet/production values anywhere; `PAYOUT_INTENT_SECRET` dev fallback is explicitly badged.
