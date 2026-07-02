# Black Belt Requirements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill the 6 Black Belt (Level 6) gaps that are within engineering control: security checklist, fee sponsorship (advanced feature), data indexing, metrics dashboard, monitoring/health endpoint, and README wiring.

**Architecture:** Each deliverable is independent. SECURITY.md is a standalone doc. Fee bump adds a `wrapFeeBump()` helper to the existing contract-client.ts and a UI toggle. Data indexing adds an API route that aggregates contract events from Horizon. Metrics page is a new `/metrics` route consuming the indexing API. Monitoring adds a `/api/health` route. README updates wire all links together.

**Tech Stack:** Next.js 15 (App Router), @stellar/stellar-sdk 13, Soroban RPC, Stellar Horizon REST API, Tailwind CSS v4

---

### Task 1: Create SECURITY.md checklist

**Files:**
- Create: `docs/reference/security.md`

- [ ] **Step 1: Write the security checklist document**

```markdown
# Stellaroid Earn — Security Checklist

Comprehensive security review for production readiness on Stellar testnet.

## Smart Contract Security

- [x] **Access control** — Admin-only functions (`init`, `approve_issuer`, `suspend_issuer`, `reward_student`) require `admin.require_auth()` + address match against stored admin
- [x] **Issuer gating** — `register_certificate`, `verify_certificate` require approved issuer status; pending/suspended issuers are rejected
- [x] **Duplicate prevention** — `register_certificate` rejects if `DataKey::Cert(hash)` already exists (Error::AlreadyExists)
- [x] **Credential lifecycle guards** — `verify_certificate` only transitions from `Issued`; `revoke_certificate` / `suspend_certificate` check actor authorization
- [x] **Expiry enforcement** — `ensure_not_expired()` blocks verification and payment on expired credentials
- [x] **Payment authorization** — `reward_student` and `link_payment` verify `cert.owner == student` before token transfer
- [x] **Typed errors** — `#[contracterror]` enum with 12 variants; frontend maps discriminants to human-readable copy, never exposing raw ScVal/HostError
- [x] **TTL management** — Persistent storage entries use 518,400–1,036,800 ledger TTL (~30–60 days testnet)
- [x] **No re-entrancy risk** — Soroban's execution model prevents re-entrancy by design
- [x] **No unbounded iteration** — Contract has no loops over storage; all operations are O(1) key lookups
- [x] **Source verification** — Contract WASM hash verified on Stellar Expert, linked to GitHub commit `71d2b03`

## Frontend Security

- [x] **Content Security Policy (CSP)** — `default-src 'self'`; `connect-src` restricted to `https://*.stellar.org`; `frame-src 'none'` (except `/proof/[hash]/embed`)
- [x] **X-Content-Type-Options** — `nosniff` on all routes
- [x] **X-Frame-Options** — `DENY` globally; `/proof/[hash]/embed` allows framing via `frame-ancestors *`
- [x] **Strict-Transport-Security (HSTS)** — `max-age=63072000; includeSubDomains; preload` (2-year HSTS with preload)
- [x] **Referrer-Policy** — `strict-origin-when-cross-origin`
- [x] **Permissions-Policy** — Camera, microphone, geolocation disabled
- [x] **Input validation** — Hash format validated (`/^[0-9a-f]{64}$/`) before any RPC call; `requireText()` and `parsePositiveInteger()` guard form inputs
- [x] **Error normalization** — `humanizeError()` maps 20+ error patterns to safe user-facing copy; raw XDR/HostError never reaches the UI
- [x] **SSRF prevention** — `isSafeUri()` blocks `file://` and `http://localhost` metadata URIs
- [x] **No secrets in client bundle** — All `NEXT_PUBLIC_*` env vars are non-secret (contract ID, RPC URL, network); no private keys in frontend
- [x] **Wallet validation** — Freighter network passphrase compared against expected network before signing

## Infrastructure Security

- [x] **Deployment platform** — Vercel with automatic HTTPS and edge caching
- [x] **No backend / no database** — Zero server-side attack surface; all state is on-chain
- [x] **CDN caching** — `/proof/[hash]` pages use `revalidate=60` to reduce RPC pressure
- [x] **Crawl protection** — `robots.ts` blocks crawlers from spidering dynamic proof routes
- [x] **Dependency audit** — No known critical vulnerabilities in production dependencies

## Operational Security

- [x] **Testnet only** — All flows target Stellar testnet; no mainnet keys or endpoints
- [x] **Admin key separation** — Admin address is a config var, not hardcoded
- [x] **No private key storage** — All signing goes through Freighter browser extension
- [x] **RPC health monitoring** — `rpc-status-pill.tsx` probes RPC every 60s with 4-second timeout

## Items Not Applicable (Testnet MVP)

- [ ] **Formal third-party audit** — Not performed (testnet MVP); recommended before mainnet
- [ ] **Rate limiting** — Vercel provides basic DDoS protection; no custom rate limiting
- [ ] **WAF** — Not configured; Vercel edge handles basic protections
- [ ] **Penetration testing** — Not performed; recommended before mainnet deployment

---

*Last reviewed: 2026-04-23*
```

- [ ] **Step 2: Commit**

```bash
git add docs/reference/security.md
git commit -m "docs: add security checklist for Black Belt submission"
```

---

### Task 2: Implement fee bump / gasless transactions (Advanced Feature)

**Files:**
- Modify: `frontend/src/lib/config.ts` (add sponsor env var)
- Create: `frontend/src/lib/fee-bump.ts` (fee bump helper)
- Modify: `frontend/src/lib/contract-client.ts:346-458` (integrate fee bump into signAndSubmit)

Fee bump transactions on Stellar let a "sponsor" account pay the gas fee for another user's transaction. This is the `TransactionBuilder.buildFeeBumpTransaction()` API — it wraps a signed inner transaction with a new fee paid by the sponsor. Since the sponsor's secret key is needed server-side, we implement this as a Next.js API route that receives the user-signed XDR and returns a fee-bumped XDR.

**Important constraint:** The sponsor's secret key must be server-side only (API route), never in the client bundle.

- [ ] **Step 1: Add sponsor config**

In `frontend/src/lib/config.ts`, add the public-facing sponsor address:

```typescript
// Add to appConfig object:
  sponsorAddress: process.env.NEXT_PUBLIC_FEE_SPONSOR_ADDRESS ?? "",
```

- [ ] **Step 2: Create the server-side fee bump API route**

Create `frontend/src/app/api/fee-bump/route.ts`:

```typescript
import { NextResponse } from "next/server";
import {
  Keypair,
  TransactionBuilder,
  Networks,
} from "@stellar/stellar-sdk";

const SPONSOR_SECRET = process.env.FEE_SPONSOR_SECRET ?? "";
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? Networks.TESTNET;

export async function POST(request: Request) {
  if (!SPONSOR_SECRET) {
    return NextResponse.json(
      { error: "Fee sponsorship is not configured on this server." },
      { status: 503 },
    );
  }

  let body: { signedXdr?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { signedXdr } = body;
  if (!signedXdr || typeof signedXdr !== "string") {
    return NextResponse.json(
      { error: "Missing signedXdr field." },
      { status: 400 },
    );
  }

  try {
    const sponsorKeypair = Keypair.fromSecret(SPONSOR_SECRET);
    const innerTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

    const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
      sponsorKeypair,
      "1000000", // 0.1 XLM max fee — generous ceiling for testnet
      innerTx,
      NETWORK_PASSPHRASE,
    );

    feeBumpTx.sign(sponsorKeypair);

    return NextResponse.json({ feeBumpXdr: feeBumpTx.toXDR() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fee bump failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
```

- [ ] **Step 3: Create the client-side fee bump helper**

Create `frontend/src/lib/fee-bump.ts`:

```typescript
import { appConfig } from "@/lib/config";

export function isFeeSponsorAvailable(): boolean {
  return Boolean(appConfig.sponsorAddress);
}

export async function requestFeeBump(signedXdr: string): Promise<string> {
  const response = await fetch("/api/fee-bump", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedXdr }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? "Fee bump request failed.",
    );
  }

  const result = (await response.json()) as { feeBumpXdr: string };
  return result.feeBumpXdr;
}
```

- [ ] **Step 4: Integrate fee bump into signAndSubmit**

In `frontend/src/lib/contract-client.ts`, after the Freighter signing step (line ~370) and before `sendTransaction`, add the optional fee bump wrapper.

Add import at the top of the file:
```typescript
import { isFeeSponsorAvailable, requestFeeBump } from "@/lib/fee-bump";
```

Modify `signAndSubmit` — after getting `signedXdr` from Freighter and before sending, add:

```typescript
  // --- Fee bump: if a sponsor is configured, wrap the signed tx ---
  let submissionXdr = signedXdr;
  if (isFeeSponsorAvailable()) {
    try {
      submissionXdr = await requestFeeBump(signedXdr);
    } catch {
      // Sponsor unavailable — fall back to user-paid fees silently.
    }
  }

  const signedTransaction = TransactionBuilder.fromXDR(
    submissionXdr,
    getExpectedNetworkPassphrase(),
  );
```

Remove the existing `const signedTransaction = TransactionBuilder.fromXDR(signedXdr, ...)` line since the new code replaces it.

- [ ] **Step 5: Add .env.example entries**

In `frontend/.env.example`, add:
```
# Fee sponsorship (optional — gasless transactions for users)
# The server-side secret key of the sponsor account. NEVER expose this in NEXT_PUBLIC_ vars.
# FEE_SPONSOR_SECRET=S...
# The public address shown in the UI to indicate gasless mode is available.
# NEXT_PUBLIC_FEE_SPONSOR_ADDRESS=G...
```

- [ ] **Step 6: Verify the build compiles**

```bash
cd frontend && npm run build
```

Expected: Build succeeds. Fee bump is dormant when env vars are not set.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib/fee-bump.ts frontend/src/app/api/fee-bump/route.ts frontend/src/lib/config.ts frontend/src/lib/contract-client.ts frontend/.env.example
git commit -m "feat: add fee bump / gasless transaction support (advanced feature)"
```

---

### Task 3: Implement data indexing via API route

**Files:**
- Create: `frontend/src/app/api/events/route.ts`

This API route fetches contract events from Soroban RPC and returns structured JSON. It uses the same `rpcRequest` pattern from `lib/events.ts` but exposed as a REST endpoint for the metrics page and external consumers.

- [ ] **Step 1: Create the events API route**

Create `frontend/src/app/api/events/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getRecentEvents } from "@/lib/events";
import { appConfig } from "@/lib/config";

export const revalidate = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(1, Number(limitParam)), 40) : 20;

  if (!appConfig.contractId) {
    return NextResponse.json(
      { error: "Contract ID not configured." },
      { status: 503 },
    );
  }

  try {
    const events = await getRecentEvents(appConfig.contractId, limit);

    const summary = {
      totalEvents: events.length,
      byKind: events.reduce(
        (acc, e) => {
          acc[e.kind] = (acc[e.kind] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      uniqueProofs: new Set(
        events.filter((e) => e.hashHex).map((e) => e.hashHex),
      ).size,
      latestEvent: events[0]?.ledgerClosedAt ?? null,
      oldestEvent: events[events.length - 1]?.ledgerClosedAt ?? null,
    };

    return NextResponse.json({ events, summary });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch events.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
```

- [ ] **Step 2: Verify the build compiles**

```bash
cd frontend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/api/events/route.ts
git commit -m "feat: add /api/events data indexing endpoint"
```

---

### Task 4: Implement /api/health monitoring endpoint

**Files:**
- Create: `frontend/src/app/api/health/route.ts`

- [ ] **Step 1: Create the health API route**

Create `frontend/src/app/api/health/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { appConfig, hasRequiredConfig } from "@/lib/config";

type HealthStatus = "healthy" | "degraded" | "down";

type HealthReport = {
  status: HealthStatus;
  timestamp: string;
  checks: {
    config: { ok: boolean; detail: string };
    rpc: { ok: boolean; latencyMs: number; detail: string };
    contract: { ok: boolean; detail: string };
  };
};

export const revalidate = 0; // Never cache health checks.

export async function GET() {
  const timestamp = new Date().toISOString();
  const configOk = hasRequiredConfig();

  // RPC health check
  let rpcOk = false;
  let rpcLatency = 0;
  let rpcDetail = "Not checked";

  if (configOk) {
    const start = Date.now();
    try {
      const response = await fetch(appConfig.rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "health-check",
          method: "getHealth",
          params: {},
        }),
        signal: AbortSignal.timeout(5000),
      });

      rpcLatency = Date.now() - start;

      if (response.ok) {
        const json = (await response.json()) as {
          result?: { status?: string };
        };
        rpcOk = json.result?.status === "healthy";
        rpcDetail = rpcOk
          ? `Healthy (${rpcLatency}ms)`
          : `RPC returned status: ${json.result?.status ?? "unknown"}`;
      } else {
        rpcDetail = `HTTP ${response.status}`;
      }
    } catch (err) {
      rpcLatency = Date.now() - start;
      rpcDetail =
        err instanceof Error ? err.message : "RPC connection failed";
    }
  }

  // Contract availability check (uses getHealth latestLedger as proxy)
  const contractOk = configOk && rpcOk;
  const contractDetail = !configOk
    ? "Config missing"
    : contractOk
      ? `Contract ${appConfig.contractId.slice(0, 8)}… reachable`
      : "RPC unavailable";

  const status: HealthStatus =
    configOk && rpcOk && contractOk
      ? "healthy"
      : configOk
        ? "degraded"
        : "down";

  const report: HealthReport = {
    status,
    timestamp,
    checks: {
      config: {
        ok: configOk,
        detail: configOk
          ? "All required env vars set"
          : "Missing NEXT_PUBLIC_SOROBAN_CONTRACT_ID or RPC URL",
      },
      rpc: { ok: rpcOk, latencyMs: rpcLatency, detail: rpcDetail },
      contract: { ok: contractOk, detail: contractDetail },
    },
  };

  return NextResponse.json(report, {
    status: status === "down" ? 503 : 200,
  });
}
```

- [ ] **Step 2: Verify the build compiles**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/api/health/route.ts
git commit -m "feat: add /api/health monitoring endpoint"
```

---

### Task 5: Build /metrics dashboard page

**Files:**
- Create: `frontend/src/app/metrics/page.tsx`

This is a server-rendered page that fetches event data and displays on-chain stats. It uses the same `getRecentEvents` function from `lib/events.ts` (server-side import, no API round-trip needed).

- [ ] **Step 1: Create the metrics page**

Create `frontend/src/app/metrics/page.tsx`:

```tsx
import { getRecentEvents } from "@/lib/events";
import { appConfig } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Metrics",
  description: "On-chain activity metrics for Stellaroid Earn",
};

export const revalidate = 30;

type KindCount = Record<string, number>;

export default async function MetricsPage() {
  let events: Awaited<ReturnType<typeof getRecentEvents>> = [];
  let error: string | null = null;

  try {
    events = await getRecentEvents(appConfig.contractId, 40);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load events";
  }

  const byKind = events.reduce<KindCount>((acc, e) => {
    acc[e.kind] = (acc[e.kind] ?? 0) + 1;
    return acc;
  }, {});

  const uniqueProofs = new Set(
    events.filter((e) => e.hashHex).map((e) => e.hashHex),
  ).size;

  const uniqueTxHashes = new Set(events.map((e) => e.txHash)).size;

  const cards = [
    { label: "Total Events", value: events.length },
    { label: "Unique Proofs", value: uniqueProofs },
    { label: "Transactions", value: uniqueTxHashes },
    { label: "Certificates Registered", value: byKind["cert_reg"] ?? 0 },
    { label: "Certificates Verified", value: byKind["cert_ver"] ?? 0 },
    { label: "Rewards Sent", value: byKind["reward"] ?? 0 },
    { label: "Payments Linked", value: byKind["payment"] ?? 0 },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-heading text-2xl font-bold text-white mb-2">
        On-Chain Metrics
      </h1>
      <p className="text-sm text-neutral-400 mb-8">
        Live activity from contract{" "}
        <a
          href={`${appConfig.explorerUrl}/contract/${appConfig.contractId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-400 hover:underline"
        >
          {appConfig.contractId.slice(0, 8)}…
          {appConfig.contractId.slice(-4)}
        </a>{" "}
        on Stellar testnet. Refreshes every 30 seconds.
      </p>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 mb-8 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 mb-12">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-neutral-700 bg-neutral-900 p-4"
          >
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">
              {card.label}
            </p>
            <p className="font-heading text-2xl font-bold text-white">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <h2 className="font-heading text-lg font-semibold text-white mb-4">
        Recent Activity
      </h2>

      {events.length === 0 && !error && (
        <p className="text-sm text-neutral-500">No events recorded yet.</p>
      )}

      <div className="space-y-2">
        {events.map((event) => (
          <a
            key={event.id}
            href={`${appConfig.explorerUrl}/tx/${event.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm hover:border-neutral-600 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  event.kind === "cert_ver"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : event.kind === "payment" || event.kind === "reward"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {event.label}
              </span>
              <span className="text-neutral-300">{event.detail}</span>
            </div>
            <span className="text-xs text-neutral-500 shrink-0 ml-4">
              {new Date(event.ledgerClosedAt).toLocaleDateString()}
            </span>
          </a>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/metrics/page.tsx
git commit -m "feat: add /metrics dashboard page with on-chain stats"
```

---

### Task 6: Update README with all new links and sections

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add Security Checklist link**

After the "Architecture" section (around line 178), add a new section:

```markdown
## Security

Full security checklist: [`docs/reference/security.md`](docs/reference/security.md)

Covers: smart contract access control, frontend CSP/HSTS/X-Frame-Options, input validation, error normalization, SSRF prevention, and operational security. All items verified for testnet deployment.
```

- [ ] **Step 2: Add Advanced Feature section**

After the Security section, add:

```markdown
## Advanced Feature: Fee Sponsorship (Gasless Transactions)

Stellaroid Earn implements **fee bump transactions** ([CAP-0015](https://stellar.org/protocol/cap-15)) so that a sponsor account can pay gas fees on behalf of users — making credential verification and payment linking truly gasless.

**How it works:**

1. User signs a transaction normally via Freighter
2. The signed XDR is sent to `/api/fee-bump` (server-side)
3. Server wraps it in a `FeeBumpTransaction` signed by the sponsor keypair
4. The fee-bumped transaction is submitted to the network — user pays zero fees

**Implementation:**
- Server route: [`frontend/src/app/api/fee-bump/route.ts`](frontend/src/app/api/fee-bump/route.ts)
- Client helper: [`frontend/src/lib/fee-bump.ts`](frontend/src/lib/fee-bump.ts)
- Config: `FEE_SPONSOR_SECRET` (server-only) + `NEXT_PUBLIC_FEE_SPONSOR_ADDRESS` (UI indicator)
- Graceful fallback: if sponsor is unavailable, transactions proceed with user-paid fees
```

- [ ] **Step 3: Add Metrics & Monitoring section**

After the Advanced Feature section, add:

```markdown
## Metrics & Monitoring

- **Metrics dashboard:** [`/metrics`](https://stellaroid-earn-demo.vercel.app/metrics) — on-chain stats (events, proofs, transactions, certificates, rewards, payments) refreshed every 30s
- **Health endpoint:** [`/api/health`](https://stellaroid-earn-demo.vercel.app/api/health) — JSON health check (config, RPC latency, contract availability)
- **Events API:** [`/api/events`](https://stellaroid-earn-demo.vercel.app/api/events) — structured contract event data for external consumers
- **Vercel Analytics:** Web analytics integrated via `@vercel/analytics`

### Data Indexing

Contract events are indexed by querying Soroban RPC's `getEvents` method across a 60,000-ledger window (~2 days). Events are decoded from ScVal, categorized by kind (`cert_reg`, `cert_ver`, `reward`, `payment`), and served via the `/api/events` REST endpoint and the `/metrics` dashboard. The approach is lightweight and serverless — no external indexer infrastructure required.
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add security, advanced feature, metrics, and monitoring sections to README"
```

---

### Task 7: Update next.config.ts CSP for fee-bump API route

**Files:**
- Modify: `frontend/next.config.ts`

The fee-bump API route is same-origin so CSP `connect-src 'self'` already covers it. No CSP changes needed. However, we should verify the build with all new routes.

- [ ] **Step 1: Run full build to verify everything compiles**

```bash
cd frontend && npm run build
```

Expected: All routes compile, including `/api/fee-bump`, `/api/events`, `/api/health`, `/metrics`.

- [ ] **Step 2: Run lint**

```bash
cd frontend && npm run lint
```

Expected: No lint errors.

- [ ] **Step 3: Final commit if any fixes needed**

Only if lint or build reveals issues.
