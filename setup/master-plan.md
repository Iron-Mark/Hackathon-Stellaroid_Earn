# Stellaroid Earn — Feature Spec (v2, June 2026) — testnet build + gated mainnet track

> **How to use:** Drop this file into the repo (suggested: `docs/PORTFOLIO_TRACK_SPEC.md`) and point
> Claude Code at it: *"Implement the next unchecked P0 item in docs/PORTFOLIO_TRACK_SPEC.md,
> following the Working Agreement and Acceptance Criteria exactly."* Work items are ordered;
> each is independently shippable.

---

## 0. Working Agreement (rules for any agent or human touching this repo)

These override everything else in this file. If a task seems to require breaking one, STOP and ask.

1. **Build for both networks; activation is human-keyed.** Agents may write, test, and merge ALL
   code in this spec — including every Section 8 mainnet item — at any time. Activation is a
   separate, maintainer-only act: `STELLAR_NETWORK=mainnet`, the mainnet contract ID, and PDAX
   production credentials exist ONLY in maintainer-held Vercel encrypted env. Agents never set,
   commit, default, or fabricate mainnet/production values; CI and local dev run testnet/mock.
2. **Non-custodial, always.** Stellaroid never holds, routes, or takes custody of any user's
   funds or keys. We verify credentials and orchestrate between users' OWN wallets/accounts.
   (Layman's: we are the GPS, never the taxi.)
3. **The proof loop is sacred.** issue → hash on-chain → public verify URL (no login) → employer
   pays graduate. No feature may add login, wallet requirements, or payment dependencies to the
   public `/proof/[hash]` route. Payment features may degrade; proofs never do.
4. **Secrets are server-only.** `PDAX_ACCESS_KEY`, `PDAX_SECRET`, and any signing material live in
   Vercel encrypted env vars and are used ONLY inside API routes / server modules. Never in
   `NEXT_PUBLIC_*`, never in a `"use client"` file, never logged.
5. **Mock-first PDAX.** All PDAX features must run fully in `PDAX_MODE=mock` (no keys, no network)
   so the demo never depends on third-party access. `staging` activates when staging keys exist;
   `production` only per §8.5 (G3).
6. **Match repo conventions.** TypeScript strict; colocated `*.test.ts` run by the Node built-in
   test runner; thin edge/serverless API routes; nonce-based CSP in `src/middleware.ts` must not
   break; security headers in `next.config.ts` unchanged unless a task says otherwise.
7. **Honest UX.** Never show a live-looking "Verified" or a price without a freshness timestamp.
   Stale data is always badged as stale.
8. **Run checks before declaring done:** `npm run lint && npm test && npm run build`. E2E
   (`npm run test:e2e`) for any task touching routes.

---

## 1. Environment & config additions

Add to `src/lib/config.ts` (server-side reads; do NOT prefix secrets with NEXT_PUBLIC):

```
PDAX_MODE=mock | staging | production    # default: mock; `production` set only by maintainer (§8)
PDAX_BASE_URL=https://services-stage.pdax.ph   # staging; production URL only in maintainer env
PDAX_ACCESS_KEY=                    # server-only, empty in mock
PDAX_SECRET=                        # server-only, empty in mock
QUOTE_TTL_SECONDS=60
QUOTE_FALLBACK=coingecko            # provider id used when PDAX unavailable
RPC_PROVIDERS=<comma-separated Soroban RPC URLs, primary first>
STELLAR_NETWORK=testnet | mainnet   # default: testnet; mainnet set only by maintainer (§8)
CONTRACT_ID_TESTNET=                # committed-safe
CONTRACT_ID_MAINNET=                # exists only in maintainer-held env, never committed
ENABLE_MAINNET_PAYMENTS=false       # feature flag, default false (§8.4)
```

---

## 2. P0 features (build in this order)

### P0-1 · RPC fallback router — `src/lib/rpc-router.ts`
**Goal:** Verify/issue/pay UX must survive testnet RPC flakiness (the app's #1 real failure mode).
**What:** A router over `rpc.Server` holding an ordered provider list from `RPC_PROVIDERS`.
Exponential backoff (250ms → 4s, jitter), per-provider timeout via existing `with-timeout.ts`
(5s), circuit-breaker: pin a provider for 60s after success; fail over on timeout/429/5xx.
Expose `getActiveProvider()` for `/status`.
**Wire into:** `contract-read-server.ts` and `contract-client.ts` (replace direct server
construction; public API of those modules unchanged).
**Tests:** unit-test failover order, backoff timing (fake timers), circuit-breaker pinning,
and that a single healthy provider short-circuits.
**Acceptance:** kill the primary URL locally → reads still succeed via fallback; `/status`
shows the active provider name.

### P0-2 · PHP quote module — `src/lib/quote.ts` + `app/api/quote/route.ts`
**Goal:** Show graduates/employers the real-peso value of XLM amounts. (Layman's: a currency
ticker with a freshness label.)
**What:** `getQuote(asset: "XLM", fiat: "PHP")` returns
`{ price, asOf, source: "pdax-staging" | "coingecko" | "cache", stale: boolean }`.
Provider chain: PDAX (only when `PDAX_MODE=staging`) → CoinGecko simple-price → last-good cached
value flagged `stale: true`. Cache in-module with `QUOTE_TTL_SECONDS`; the API route sets
`Cache-Control: s-maxage=60, stale-while-revalidate=300` and basic rate limiting (reuse the
fee-bump policy pattern).
**UI:** small `<FiatValue amount={xlm} />` client component rendering `≈ ₱X,XXX` + "as of HH:mm"
+ a stale badge when `stale`. Use on `/proof/[hash]` (payment section) and `/payout/[id]`.
**Tests:** provider fallback order; TTL expiry; stale flag; never throws to the page (returns
`null` quote on total failure — UI hides the peso line rather than erroring).
**Acceptance:** with network blocked, proof page still renders fully (peso line hidden or stale-badged).

### P0-3 · PDAX client (mock-first) — `src/lib/pdax-client.ts` + `src/lib/pdax-sign.ts`
**Goal:** Real exchange-integration code (HMAC request signing, typed endpoints) that runs today
without keys. (Layman's: build the plug now; the socket arrives later.)
**What:**
- `pdax-sign.ts`: pure function `signRequest(secret, method, path, body, timestamp)` →
  Access-Signature header value (HMAC-SHA256, per doc.restapi.pdax.ph conventions; document the
  exact canonical-string format in JSDoc and verify against staging when keys arrive — flag any
  mismatch in a `// TODO(verify-staging)` comment).
- `pdax-client.ts`: server-only. Typed wrappers: `getBalances()`, `getTicker(pair)`,
  `getTransactions()`, `cryptoOutDryRun(params)`. In `mock` mode, return deterministic fixtures
  from `src/lib/pdax-fixtures.ts` (realistic shapes, fixed timestamps) — NO network calls.
  In `staging` mode, call `PDAX_BASE_URL` with signed headers, 5s timeout, normalized errors
  via existing `errors.ts`.
- Guard: module throws at import time if evaluated in a client bundle (check `typeof window`).
**Tests:** signature function golden-vectors; mock fixtures shape; mode switching; the
client-bundle guard.
**Acceptance:** `PDAX_MODE=mock` end-to-end with zero env secrets; no PDAX code in any client chunk
(verify with bundle analyzer).

### P0-4 · Credential-gated payout intents — `src/lib/payout-intent.ts` + `app/payout/[id]/page.tsx`
**Goal:** THE differentiator: a payout that unlocks only on on-chain proof of skill
("proof-of-skill to peso"). This is the hackathon demo centerpiece.
**What:** A pure state machine (no DB — state derived from on-chain reads + URL params, consistent
with "the contract is the DB"):
`intent_created → credential_verified → payment_detected → offramp_guided → settled`.
- Intent = signed, stateless token in the URL (reuse `opportunity-id.ts` patterns): encodes
  `{credentialHash, recipientAddress, amountXlm, createdAt}` + HMAC (server secret) so intents
  can't be forged. No storage required.
- `/payout/[id]`: server component. Steps rendered as a checklist:
  1. Verify `credentialHash` via `contract-read-server.ts` (through P0-1 router). Fail → clear
     "credential not verified" state; nothing else unlocks.
  2. Poll/read testnet for a payment of `amountXlm` to `recipientAddress` newer than `createdAt`
     (Horizon/RPC read; no webhook, no backend). Show tx link when detected.
  3. Show `<FiatValue>` peso equivalent (P0-2).
  4. Off-ramp guidance step (P1-1 content; placeholder copy until then).
- Employer view: existing pay flow gains a "create payout link" action producing the intent URL +
  QR (reuse `qrcode`).
**Tests:** intent encode/decode/forgery-rejection; state derivation for each step; payment-match
logic (amount tolerance, time window, wrong-sender handling).
**Acceptance:** full loop demoable on testnet in mock PDAX mode: create intent → open link →
verified badge → send testnet XLM from a second wallet → page flips to payment_detected with tx
evidence → peso value displayed.

### P0-5 · Standards-aligned credential JSON — `app/proof/[hash]/credential.json/route.ts`
**Goal:** Emit an Open Badges 3.0 / W3C VC Data Model 2.0 shaped payload alongside the existing
proof page. (Layman's: publish the certificate in the universal language every verifier reads,
not just our dialect.)
**What:** Map existing `proof-metadata.ts` fields into an `OpenBadgeCredential` JSON-LD document:
contexts `https://www.w3.org/ns/credentials/v2` + the 1EdTech OB 3.0 context; `issuer` from
`issuer-registry.ts`; `credentialSubject.achievement` from proof metadata; `validFrom`; omit
`proof` block in v1 (document as roadmap: Data Integrity / eddsa cryptosuite). Set
`Content-Type: application/vc+ld+json`. Validate hash format before any read (same regex gate as
the page). `revalidate=60`.
**Tests:** golden snapshot of output for demo data; hash-format rejection; required-fields presence.
**Acceptance:** `curl /proof/<demo-hash>/credential.json` returns valid JSON-LD; existing proof
page and embed untouched.

---

## 3. P1 features

### P1-1 · Off-ramp guide — `app/payout/[id]/offramp` section/component
Plain-language, PH-localized steps for a graduate to cash out XLM to pesos **on their own PDAX
account**: account/KYC requirements, deposit address flow, fees, the PHPT pairing quirk
(verify current pairing before finalizing copy), realistic timelines. Explicit banner: "Stellaroid
never holds your funds — this guide walks you through YOUR exchange account." Testnet demo shows
the guide with a "demo mode — testnet XLM has no cash value" notice.

### P1-2 · Reconciliation script — `scripts/reconcile.ts` + `npm run ops:reconcile`
Idempotent: given an intent URL/token, re-derive its full state from chain reads and print a
machine-readable report. Safe to run repeatedly; exit non-zero on inconsistency. (Layman's:
the auditor that re-checks the checklist from scratch.)

### P1-3 · Bundle split
Dynamic-import every Freighter-touching component so wallet code loads only on
`/app`, `/issuer`, `/employer`. Move remaining reads on `/about`, `/metrics`, `/status` to
server components. Add `@next/bundle-analyzer`; record before/after first-load JS in the PR.
**Acceptance:** landing + proof routes contain zero `@stellar/freighter-api` and zero PDAX code.

### P1-4 · `/status` additions
Active RPC provider (P0-1), quote freshness + source (P0-2), PDAX mode + last staging latency
(P0-3), last reconcile result timestamp (P1-2).

---

## 4. P2 features (post-demo polish)

- **P2-1 Serwist PWA:** `@serwist/next`, precache shell, stale-while-revalidate for `/proof/*`,
  offline page; offline proofs re-hash cached JSON via `crypto.subtle.digest` and badge
  "verified offline at ledger N — reconnect to re-verify". `reloadOnOnline: false`; prompted
  refresh via Sonner. Must not break nonce CSP (register SW from a tiny client component).
- **P2-2 Revocation:** `revoked` flag in contract + W3C Bitstring Status List endpoint
  `app/api/status-list/[id]/route.ts`; `credentialStatus` block added to P0-5 output.
- **P2-3 Schema.org:** `EducationalOccupationalCredential` JSON-LD on `/proof/[hash]` via existing
  `json-ld-safe.ts`.

---

## 5. Hackathon demo script (3 minutes, judge-facing)

1. (20s) Problem: fake PDF certificates; verification needs a middleman.
2. (40s) Open a public proof URL — no login, no wallet — live on-chain verification. Show
   `credential.json` in a second tab: "speaks the W3C/Open Badges standard."
3. (60s) Employer creates a **credential-gated payout link**; open it: credential auto-verifies,
   employer sends testnet XLM from their own wallet, page detects the payment live, shows tx
   evidence + **real-time peso value** (PDAX/CoinGecko rail).
4. (40s) Graduate's off-ramp guide: "money never touches us — non-custodial by design, which is
   why this works under PH's 2025 CASP rules without a ₱100M license."
5. (20s) Pull the plug moment: kill primary RPC live; page fails over and stays green.
   "Single maintainer, production discipline."

---

## 6. Definition of done (every work item)

- [ ] Unit tests colocated, green via Node test runner
- [ ] `npm run lint && npm run build` clean
- [ ] No secrets in client bundles (analyzer check for P0-3/P1-3)
- [ ] CSP + security headers unchanged (or task explicitly updated them)
- [ ] `/status` reflects any new operational surface
- [ ] README feature table row added; screenshots refreshed if UI changed
- [ ] Works fully in `PDAX_MODE=mock`

---

## 7. Explicitly out of scope (do not let any agent talk you into these)

Custody of funds or keys (never unlocks, on any network) · committing or defaulting
mainnet/production env values · automated `crypto_out` against real accounts (manual confirm +
allowlist + spend cap only, §8.5) · marketplace/LMS features · NFTs as source of truth · a
database (state derives from chain + signed tokens) · login on public proof routes.

---

## 8. Mainnet track — agent builds now, maintainer activates

Everything below is implementable by the agent TODAY, fully tested via testnet/mock + config
injection. It ships inert: real-money behavior turns on only when the maintainer supplies env
values no agent can produce.

### 8.1 Activation gates (human-only by nature)
- **G1 — Independent contract audit.** Review by the implementing agent is not an audit.
  Artifact: report in `docs/audit/`.
- **G2 — Legal read** on CASP "facilitation" scope for non-custodial orchestration (one consult,
  PH fintech counsel). Artifact: memo summary in `docs/legal/`.
- **G3 — PDAX production access** via Platform Solutions (their team issues credentials).
- **G4 — Ops readiness:** mainnet runbook, alerting, spend caps, kill-switch flag tested.
Maintainer sets mainnet/production env values only when G1–G4 artifacts exist.

### 8.2 M-1 · Dual-network architecture — **build now**
`src/lib/network.ts`: resolve network from `STELLAR_NETWORK` → per-network contract ID, RPC
provider list, passphrase, explorer base URLs. Persistent UI network badge; `/proof/[hash]` and
`credential.json` state their network explicitly. Default testnet everywhere. Tests cover the
mainnet path via injected config — no live mainnet calls in CI.

### 8.3 M-2 · Mainnet credential anchoring — **build now**, activates on G1+G4
`scripts/deploy.ts --network mainnet` for maintainer use; the script refuses to run if
`docs/audit/` is empty (a tripwire, not a substitute for judgment). Issue/verify only; payment UI
stays hidden on mainnet until M-3 is active.

### 8.4 M-3 · Wallet-to-wallet mainnet payments — **build now**, activates on G1+G2+G4
Reuses the P0-4 intent machine unchanged; detection reads the active network. The app never signs
or holds funds on either network. Gated by `ENABLE_MAINNET_PAYMENTS` (default false).

### 8.5 M-4 · PDAX production mode — **build now**, activates on G3
`pdax-client.ts` gains `production` mode: same signer, prod base URL from maintainer env.
Own-account reads (balances/ticker) first. `crypto_out` requires interactive confirmation, an
address allowlist, and a per-tx cap from env. No automated movement of third-party funds — the
graduate off-ramp remains guidance to their OWN accounts.

### 8.6 Why activation stays human (for any future agent reading this)
Code errors are caught at review time; money errors happen at runtime and are irreversible.
Review-after-implementation covers the former, never the latter — so implementation is agent
work, activation is maintainer work. That split is exactly what allows every line in this
section to be written today.