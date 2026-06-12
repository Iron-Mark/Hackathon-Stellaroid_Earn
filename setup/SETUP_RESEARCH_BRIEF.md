# Stellaroid Earn — Setup Audit & Improvement Research Brief

> **How to use this file:** Paste this entire document into **Claude.ai (Max plan)** with
> **Deep Research** (and Extended Thinking) turned on. It is fully self-contained — Claude.ai
> cannot see my repo, so everything it needs is described below. Your job, Claude, is to read the
> "current setup" sections, then produce a **prioritized, evidence-backed improvement plan**
> focused on the four themes in Section 5 (offline architecture, PWA, AI automation, headless CLI)
> plus anything else worth doing. Cite current (2025–2026) sources.

---

## 0. Instructions to the researcher (read first)

- **Your role:** Act as a senior staff engineer + product technical advisor doing an architecture
  audit of a small, live, single-maintainer Stellar dApp. Be blunt and specific, not generic.
- **Bias to action:** Every recommendation must be something a solo maintainer could ship in
  hours/days, with a clear "why now" and a trade-off. No hand-wavy "consider adding observability."
- **Hard constraints (do not violate):**
  - **Testnet only.** Never recommend a mainnet deploy, custody of real funds, or anything that
    implies handling real money. All payments are XLM on **Stellar testnet**.
  - **Keep the core proof loop sacred:** issue credential → bind hash on-chain → public verify URL
    (no login) → employer pays graduate. Don't recommend rewrites that endanger this.
  - **No scope creep into:** marketplaces, a general LMS/learning platform, NFT layers as the
    source of truth, or a heavy custom backend. (See Section 4 "Non-goals.")
  - **Hosting is Vercel** with a custom domain. Recommendations should fit a Vercel + edge model
    unless you make an explicit case to change it.
- **Output:** Follow the format in **Section 6**. Lead with a one-screen executive summary, then a
  prioritized backlog table (P0/P1/P2), then per-theme deep dives with code-level specifics and
  cited sources. Flag any recommendation that conflicts with the constraints above.
- **Currency:** It is mid-2026. Prefer current library versions and current platform docs. If a
  best practice changed recently (e.g., Next.js PWA story, service-worker tooling, Soroban SDK),
  say so and cite it.

---

## 1. What the product is (30-second version)

**Stellaroid Earn** is on-chain credential trust on Stellar. Bootcamp/issuer certificates are
normally PDFs that anyone can fake and no one can independently verify. Stellaroid anchors a
**credential hash on a Soroban smart contract**: approved issuers register and verify certificates,
**anyone** can check a credential at a **public proof URL with no wallet and no login**, and
**employers can pay graduates in XLM** — all on one chain.

- **Live site:** a custom apex domain on Vercel (canonical), with a fallback `*.vercel.app` demo.
- **Result context:** Originally a Stellar PH Bootcamp 2026 submission (placed Top 5 / 105); now
  maintained as a small living credential product, testnet-first, with a documented path to real
  issuer pilots later.
- **Why Stellar:** sub-cent fees + ~5s finality make issuing cheap enough to never skip;
  `simulateTransaction` lets anyone verify read-only with zero wallet setup; native XLM via the
  Stellar Asset Contract closes the loop from proof → payout on one chain.

---

## 2. Current architecture — ground truth (this is what actually exists today)

### 2.1 Frontend stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 15** (App Router), **React 19** |
| Styling | **Tailwind CSS v4** (`@theme` design tokens in `globals.css`), `tw-animate-css`, `tailwind-merge`, `clsx`, `class-variance-authority` |
| UI primitives | `@base-ui/react`, **shadcn**-style components, `lucide-react` icons, `sonner` (toasts) |
| Motion | `framer-motion` (with a local `lib/motion.ts` reduced-motion wrapper) |
| Stellar | `@stellar/stellar-sdk` ^13, `@stellar/freighter-api` ^4 |
| Misc | `qrcode` (proof QR cards), `@vercel/analytics` |
| Language/tooling | TypeScript 5.7, ESLint 9 (flat config), PostCSS pinned to 8.5.15 |

**This is a client-heavy dApp.** Wallet/signing components are `"use client"` because Freighter is
a browser-only API. There is **no traditional backend/database** — state of record is the Soroban
contract; read-only verification uses `simulateTransaction` from a server read address.

### 2.2 Smart contract

- **Soroban (Rust)**, soroban-sdk **22.x**, deployed to **Stellar testnet**.
- Lives in `contract/` (`src/lib.rs`, `src/test.rs`, `Cargo.toml`). Functions cover init, issuer
  register/approve, verify, and pay flows. Has unit tests; deployed WASM hash is recorded in the
  README with explorer tx evidence (init / register / verify).
- Source of truth for the **current contract ID** is the README badge + the in-app `/status` route.

### 2.3 Frontend `src/lib/` modules (the real architecture)

- `config.ts` — reads `NEXT_PUBLIC_*` env (RPC URL, network passphrase, contract ID, read address).
  Network passphrase **must** match the deployed network.
- `contract-client.ts` — builds txns with stellar-sdk; **reads via `simulateTransaction`** (read
  address, no wallet), **writes signed via Freighter** then submitted via Soroban RPC. Handles
  ScVal arg serialization, return-value decoding, error normalization.
- `contract-read-server.ts` — server-side read path for proof pages (no wallet).
- `freighter.ts` — wallet wrapper (connect, public key, network check, sign).
- `fee-bump.ts` + `fee-bump-policy.ts` — fee-bump support so the app can sponsor/relay fees under a
  policy (there is an API route for this; see 2.5).
- `events.ts` — event/activity feed plumbing (paired with `/api/events`).
- `proof-metadata.ts`, `proof-claims.ts`, `proof-preview.ts` — proof/credential metadata model,
  claim handling, and preview/OG state.
- `issuer-registry.ts` — issuer directory / approval-state model.
- `opportunity-id.ts` — opportunity/job identifier helpers (employer → graduate flow).
- `security.ts`, `json-ld-safe.ts`, `schema.ts`, `seo.ts` — security helpers, safe JSON-LD
  structured data, schema + SEO.
- `validators.ts`, `format.ts`, `with-timeout.ts`, `errors.ts`, `i18n.ts`, `health-report.ts`,
  `demo-data.ts`, `types.ts`, `utils.ts`.
- **Unit tests exist** as colocated `*.test.ts` run by the **Node built-in test runner**
  (`node --experimental-strip-types --test`), e.g. `format`, `security`, `schema`, `seo`,
  `proof-metadata`, `proof-claims`, `proof-preview`, `fee-bump-policy`, `opportunity-id`,
  `json-ld-safe`.

### 2.4 Routes (App Router)

`/` (landing) · `/about` · `/app` (dual-role issuer+employer dashboard) · `/issuer` +
`/issuer/register` · `/employer` · `/talent` + `/talent/[address]` (candidate passport) ·
`/opportunity` + `/opportunity/[id]` · `/proof/[hash]` + `/proof/[hash]/embed` (public verify,
embeddable) · `/metrics` · `/status` (ops/health) · `/slides`. Plus `manifest.ts`, `robots.ts`,
`sitemap.xml`, `opengraph-image.tsx`, `not-found.tsx`, `error.tsx`.

### 2.5 API routes (thin, edge/serverless)

- `/api/health` — health/uptime report (feeds `/status`).
- `/api/fee-bump` — fee-bump endpoint governed by `fee-bump-policy.ts`.
- `/api/events` — activity/event feed.

### 2.6 Security posture (already implemented)

- **CSP is nonce-based**, generated per-request in `src/middleware.ts` (random nonce → `x-nonce`
  header + `Content-Security-Policy`). `connect-src` is locked to `'self' https://*.stellar.org`;
  `frame-ancestors` is `'none'` **except** the `/proof/[hash]/embed` route, which is intentionally
  embeddable (`frame-ancestors *`).
- **Static security headers** in `next.config.ts`: `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and **HSTS** (2-year, preload).
- **Proof routes validate the hash format** (`^[0-9a-f]{64}$`) **before any RPC call**, and use
  CDN caching (`revalidate=60`). `robots.ts` blocks crawlers from spidering dynamic proof routes.
- `serverExternalPackages` marks `sodium-native` / stellar-sdk as external so webpack doesn't try
  to bundle native `.node` binaries.

### 2.7 Testing, CI, hosting

- **Unit:** Node test runner over `src/lib/*.test.ts`. **E2E:** Playwright (`test:e2e`) covering
  register → approve → pay → public proof.
- **CI:** GitHub Actions — `frontend-ci.yml` (lint/build/test) and `release.yml`.
- **Hosting:** Vercel; canonical custom domain with apex + `www`/`earn` subdomain redirects;
  fallback `*.vercel.app` demo. `@vercel/analytics` is wired in.
- **Existing PWA seed:** `manifest.ts` already declares `display: standalone`, theme/background
  colors, and 192/512 icons — **but there is no service worker yet** (so it's installable-ish but
  not offline-capable).
- **Docs:** `README.md`, `ROADMAP.md`, `MAINTENANCE.md` (weekly checks), `docs/` runbooks
  (domain cutover, demo checklist), and a `setup/` folder of integration guides + prompt templates.

---

## 3. What's already known to be weak / open (so you don't "discover" these as new)

- No service worker → manifest exists but the app is **not offline-capable** and not truly
  installable-grade.
- All freshness depends on **live Soroban RPC**; testnet RPC latency/flakiness directly degrades
  verify/issue/pay UX. There's `with-timeout.ts` but no documented RPC fallback/retry provider.
- **No indexer** — talent/candidate pages cannot automatically discover every credential for a
  wallet; this is a deliberate honesty constraint, not a bug.
- Maintenance is **manual** (weekly `MAINTENANCE.md` checklist): health checks, E2E green, domain
  state, contract ID accuracy.
- Single maintainer; limited time budget.

---

## 4. Non-goals / guardrails (recommendations must respect these)

From the project roadmap's "Not Now":
- No mainnet deploy from examples; no real-fund custody.
- No marketplace mechanics; no broad learning-platform rebuild.
- No NFT layer as the **source of truth** (a badge layer is at most a presentation skin).
- No heavy custom backend/database unless a flow genuinely requires it (the contract is the DB).
- Don't claim talent pages auto-discover all wallet credentials until a real indexer exists.

---

## 5. What I want you to research and recommend (the four themes)

For **each** theme: give a concrete recommendation, the specific libraries/APIs/versions to use in a
**Next.js 15 + React 19 + Vercel** context, a minimal implementation sketch, the trade-offs, and how
it interacts with the **testnet-only, no-backend, proof-loop-sacred** constraints. Cite current docs.

### Theme A — Offline-first architecture
- Which parts of this app **can and should** work offline, given that issuing/verifying/paying need
  live RPC? (Likely candidates: already-verified proof pages, the landing/about/slides content, a
  user's previously viewed proofs, QR cards, the embed view.)
- What's the right **caching strategy per route type**: static marketing pages vs. dynamic
  `/proof/[hash]` (currently `revalidate=60`) vs. wallet-gated dashboards?
- How to design an **offline/stale-data UX** that never lies about on-chain truth — e.g. clearly
  badging a cached proof as "last verified at <time>, reconnect to re-verify" rather than showing a
  stale green "Verified."
- Should proof metadata/claims be cached in **IndexedDB / Cache Storage**? What's the integrity
  story (hashes are deterministic — can we verify cached data locally against the on-chain hash)?

### Theme B — Progressive Web App (PWA)
- Concrete plan to go from "manifest only" → **installable, offline-capable PWA** on Next.js 15 App
  Router in 2026. Evaluate current options: `@serwist/next` (Workbox successor), `next-pwa` status,
  or hand-rolled service worker. Recommend one and justify it.
- Service-worker strategy that **respects the nonce-based CSP** already in `middleware.ts` (don't
  break CSP; SW registration must work with the nonce model).
- Caching strategies per asset class (precache app shell; stale-while-revalidate for proof pages;
  network-first for RPC reads; never cache wallet/signing state).
- Install prompts, iOS/Safari limitations, update flow (skipWaiting vs. user-prompted refresh), and
  how to keep the **Lighthouse PWA + performance** scores high. What's the realistic mobile win
  here (proof cards are already QR-shared to phones)?
- Push notifications: is there a legitimate, non-spammy use (e.g. "your credential was verified" or
  "you received a payment")? Web Push on iOS/Android in 2026 — feasible without a backend, or does
  it force one (conflict with the no-backend guardrail)?

### Theme C — AI automation (this is a priority for me)
- **Maintenance automation:** turn the manual `MAINTENANCE.md` weekly checklist into automation.
  Which checks can become a scheduled GitHub Action / Vercel Cron (health endpoint, contract-ID
  drift vs. on-chain, broken proof links, domain/HTTPS state, Playwright smoke) and which genuinely
  need a human?
- **Claude / agentic automation:** realistic, current (2026) patterns for using **Claude Code**, the
  **Claude Agent SDK**, scheduled agents, and MCP to run recurring repo chores: dependency triage,
  changelog/release notes, README/`/status` accuracy, security-header regression checks, "is the
  live contract ID still the one in the docs" audits, screenshot refresh. Distinguish
  **CI-grade deterministic checks** (should be plain scripts, not an LLM) from tasks where an LLM
  actually adds value.
- **AI-in-the-product (optional, only if it respects guardrails):** would an AI helper add real
  value for issuers (e.g. drafting credential metadata, explaining a proof to a non-technical
  employer) — and what's the cost/abuse/trust risk? Keep the on-chain record as the source of truth.
- For each AI suggestion: where it runs (CI vs. local dev vs. Vercel function vs. scheduled agent),
  what it costs, what could go wrong, and what guardrails keep it from making false claims about
  on-chain state.

### Theme D — Headless / CLI automation
- A set of **headless CLI scripts** (Node/TS, runnable in CI and locally) that codify the ops
  runbooks: e.g. `verify-deployment` (hit `/status` + assert contract ID matches on-chain),
  `check-proof <hash>` (simulate the contract read and print verified/issued), `refresh-screenshots`
  (already have `scripts/capture-readme-screenshots.ts` — extend it), `health` (wrap `/api/health`),
  `seed-demo-credentials` for testnet.
- Best practices for **headless Stellar/Soroban automation** with the `stellar` CLI v26+ and
  `@stellar/stellar-sdk` in scripts (key handling for testnet, `--source`, deterministic builds,
  funding test keys, idempotency).
- Headless **Playwright** in CI for the full register→approve→pay→proof loop, plus headless
  Lighthouse/PWA scoring as a CI gate.
- How to package these as `npm` scripts / a tiny CLI so both a human and an AI agent can invoke them.

### Theme E — Anything else worth doing
- Performance (Core Web Vitals, bundle size — stellar-sdk is heavy; can reads be moved fully
  server-side or code-split?), accessibility, RPC resilience (fallback providers, retry/backoff),
  i18n completeness, SEO/structured-data, and DX. Surface the **highest-leverage** items I haven't
  asked about.

---

## 6. Output format I want back

1. **Executive summary** (≤1 screen): the 3–5 highest-leverage moves, each one sentence.
2. **Prioritized backlog table:**

   | Priority | Theme | Work item | Why now | Effort (S/M/L) | Impact | Risk | Respects guardrails? |
   |---|---|---|---|---|---|---|---|

   Use **P0** (reliability/correctness, do first), **P1** (clear wins), **P2** (nice-to-have).
3. **Per-theme deep dives** (A–E): for each, the recommended approach, specific libs/versions/APIs
   for Next.js 15 + React 19 + Vercel + Soroban, a minimal code/config sketch, trade-offs, and
   **cited current sources**.
4. **A "do NOT do this" list:** tempting ideas that violate the testnet-only / no-backend /
   proof-loop / no-scope-creep guardrails, and why.
5. **A 1-week and a 1-month plan** a solo maintainer could actually execute.

> Be concrete and current. Where you're inferring rather than certain, say so. Prefer official docs
> (Next.js, Vercel, Stellar/Soroban, Workbox/Serwist, web.dev PWA, Anthropic Claude Code / Agent SDK
> / MCP) and cite them.
