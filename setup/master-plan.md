# Stellaroid Earn Master Plan

**Created:** 2026-06-12
**Source input:** `setup/SETUP_RESEARCH_BRIEF.md` plus local repo audit
**Purpose:** Turn the setup research brief into a phased, PR-ready plan for offline proof access, PWA hardening, deterministic ops automation, AI-assisted maintenance, and headless CLI workflows.

## Active Goal

Finish the setup phase in a way that can become a clean fork PR for the presentation: `setup/master-plan.md` is the source of truth, `docs/superpowers/plans/2026-06-12-pwa-ops-automation.md` is the first execution plan, and implementation work is split across parallel agents with non-overlapping ownership.

## Executive Summary

1. Ship deterministic ops automation before product AI: convert `MAINTENANCE.md` into scripts and scheduled checks so the demo can prove health without a human clicking through every route.
2. Add PWA capability in two steps: first an install/offline shell, then cached proof snapshots with explicit stale labels. Never show cached data as freshly verified.
3. Use a service worker carefully because the app already has nonce-based CSP. The service worker route needs explicit headers and must never cache wallet state, Freighter calls, signed XDR, or RPC write requests.
4. Keep AI automation behind deterministic checks. LLMs can summarize failures, refresh docs, and prepare maintenance PRs, but scripts must own contract ID drift, health checks, and proof route assertions.
5. For UI, preserve the current dark trust surface: gold primary actions, purple technical accents, visible focus states, 44px touch targets, skeletons for waits over 300ms, and no stale green proof states.

## Current Repo Reality

- `setup/master-plan.md` was empty when this plan was created.
- `setup/SETUP_RESEARCH_BRIEF.md` already contains the product context and desired research themes.
- The app is a Next.js 15 / React 19 / Tailwind v4 dApp under `frontend/`.
- `frontend/src/app/manifest.ts` exists, but there is no service worker yet.
- Runtime status already exists through `frontend/src/app/status/page.tsx`, `frontend/src/app/api/health/route.ts`, and `frontend/src/lib/health-report.ts`.
- CI already runs build, lint, typecheck, and Playwright from `.github/workflows/frontend-ci.yml`, but it should add `npm run test:unit` as a required gate.
- Contract drift already exists: `README.md` points to `CDMUOHMARNVOJZM3IVOCJUPGBHDTHFBMZCCZXEZPQDVJGILH3NIKTTW3`, while `MAINTENANCE.md` still references an older `CA7P5...` contract in a manual Stellar Expert check. Phase 1 must make `ops:contract-drift` fail on this class of mismatch.
- The project guardrails remain testnet-only, no heavy backend, no mainnet examples, and no claims that stale or cached proof data is live on-chain truth.

## Prioritized Backlog

| Priority | Theme | Work item | Why now | Effort | Impact | Risk | Guardrails |
|---|---|---|---|---:|---|---|---|
| P0 | Ops | Add a headless `ops:health` script that checks `/`, `/status`, `/api/health`, sample proof, OG image, and configured contract URL. | Turns manual maintenance into evidence before tomorrow's demo. | S | High | Low | Yes |
| P0 | Ops | Add a contract ID drift script that compares README, `frontend` env/config expectations, and `/status` output. | Contract mismatch is the fastest way to lose demo trust. | S | High | Low | Yes |
| P0 | CI | Add a scheduled GitHub Action for deterministic maintenance checks. | The checks can run without a backend or AI. | S | High | Low | Yes |
| P1 | PWA | Add a minimal service worker and offline page using either Serwist or a hand-rolled worker. | Manifest exists, but installable/offline behavior is incomplete. | M | Medium | Medium | Yes |
| P1 | Offline | Cache static marketing routes and last-viewed proof HTML/assets with stale badges. | Proof links are the strongest mobile artifact. | M | High | Medium | Yes, if stale is explicit |
| P1 | UX | Add an offline/stale proof banner and `last verified at` copy. | Prevents cached proof data from lying about on-chain freshness. | M | High | Medium | Yes |
| P1 | DX | Package ops scripts as npm commands in `frontend/package.json`. | Makes human and agent workflows share the same commands. | S | Medium | Low | Yes |
| P1 | AI | Add a Claude/agent maintenance prompt and checklist for summarizing CI failures and doc drift. | Useful for a single maintainer, but not authoritative. | S | Medium | Low | Yes |
| P2 | PWA | Add Lighthouse PWA/performance audit as non-blocking CI artifact. | Good presentation signal after P0 reliability exists. | M | Medium | Low | Yes |
| P2 | Product AI | Add issuer metadata drafting helper as local/admin-only prototype. | Could improve issuer ergonomics, but trust and abuse risk are higher. | L | Medium | High | Only if clearly advisory |
| P2 | Push | Defer web push notifications. | Push requires subscription storage and a backend-like concern. | L | Low | High | Not now |

## Design System Guardrails

Use these when implementing any UI from this plan:

- Product shape: fintech/Web3 credential proof dashboard.
- Style: dark professional trust surface, not a marketing-heavy page.
- Colors: background `#0F172A`, primary gold `#F59E0B`, secondary gold `#FBBF24`, accent purple `#8B5CF6`, text `#F8FAFC`.
- Typography: preserve the current `next/font` setup in `frontend/src/app/layout.tsx` unless a dedicated typography migration task is approved. The UI skill recommends IBM Plex Sans for fintech trust, but the existing app uses Orbitron, Exo 2, JetBrains Mono, and Share Tech Mono; do not mix font systems casually.
- Accessibility: visible focus states, at least 44px touch targets, skeletons/spinners for async waits over 300ms, text labels paired with icons, and no color-only state.
- Offline proof rule: cached proof data must use amber/neutral copy such as `Last verified at {timestamp}; reconnect to re-verify`, never a fresh green `Verified` state.
- Freshness must gate every proof surface: `/proof/[hash]`, `/proof/[hash]/embed`, proof Open Graph image, JSON-LD, share copy, QR blocks, and `/status`.
- Touch-target work must be enforceable: audit all buttons, links, summaries, icon controls, nav controls, locale toggles, copy buttons, and toast actions at mobile width. Existing small controls in shared UI should be treated as remediation candidates, not ignored because they are already present.
- PWA/offline UI must reserve space for banners and skeletons, respect `prefers-reduced-motion`, use `aria-live="polite"` for connectivity/revalidation state, and avoid focus traps unless modal semantics are implemented.
- Icon rule: use lucide icons or existing SVG assets, not emoji-as-icons.

## Theme A: Offline-First Architecture

### Recommendation

Start with offline read surfaces, not wallet flows. Cache:

- Static content: `/`, `/about`, `/slides`, shared images, icons, CSS, and JS app shell.
- Public proof surfaces: previously visited `/proof/[hash]`, `/proof/[hash]/embed`, proof QR assets, and sample metadata.
- Status shell: last successful `/status` payload can be shown as stale, but a failed live refresh should be prominent.

Do not cache:

- Freighter connection state.
- Signed transactions or unsigned XDR waiting for a signature.
- POST requests to Stellar RPC.
- `/api/fee-bump` writes or any future transaction-relay endpoint.

### Implementation Shape

- Add `frontend/src/app/offline/page.tsx` for a branded offline fallback.
- Add `frontend/src/components/proof/offline-proof-banner.tsx` for stale proof disclosure.
- Add a small proof snapshot model in `frontend/src/lib/proof-cache.ts` only after the service worker shell exists.
- Use Cache Storage for HTML/assets. Use IndexedDB only if storing structured proof snapshots becomes necessary.
- Store `verifiedAt`, `sourceContractId`, `networkPassphrase`, and `hash` with every proof snapshot.
- Validate cached proof snapshots locally by confirming the stored credential hash still matches the URL hash. This validates integrity of the cached artifact, not current on-chain status.
- Prefer structured stale proof snapshots over direct cached live proof HTML. Cached server-rendered HTML can accidentally preserve a green verified state that is no longer fresh.
- Snapshot metadata must include `schemaVersion`, `cacheWrittenAt`, `lastLiveVerifiedAt`, `status`, issuer state, `sourceContractId`, `networkPassphrase`, `hash`, and app/build version.

### Trade-Off

Offline proof pages improve demo resilience, especially on mobile, but can create false trust if freshness is unclear. This project should choose a conservative stale-data UI over aggressive offline optimism.

### Route Caching Matrix

| Route / Surface | Strategy | Requirement |
|---|---|---|
| `/`, `/about`, `/slides`, static images/icons/assets | Precache or stale-while-revalidate | Safe offline shell content |
| `/proof` | Network-first | Offline fallback may show proof lookup shell only |
| `/proof/[hash]` | Network-first, stale fallback only on offline/network failure/timeout | Live invalid/revoked/not-found overrides cache |
| `/proof/[hash]/embed` | Network-first; no offline fallback unless stale label is visible in first viewport | Never embed a stale green badge |
| `/proof/[hash]/opengraph-image` | Network-first | Do not serve stale green social cards without freshness metadata |
| `/status` | Network-first with stale timestamp | Must show stale state if live check fails |
| `/metrics`, `/employer`, `/opportunity/[id]`, `/talent/[address]` | App shell only or network-first stale-labeled | No implied complete live data |
| `/app`, `/issuer`, `/issuer/register` | Network-only for live contract/wallet state; app shell may load offline | No wallet/session/transaction state caching |
| `/api/health`, `/api/events` | Network-first or network-only depending endpoint | Stale JSON must be labeled if displayed |
| `/api/fee-bump`, Stellar RPC, Freighter/signing flows | Network-only | Never cache writes, signatures, signed XDR, or sponsor payloads |

## Theme B: PWA

### Recommendation

Use a two-stage PWA plan:

1. Stage 1: Serwist install/offline shell with explicit CSP headers.
2. Stage 2: route-aware caching for proof pages once stale-data UI exists.

Use `@serwist/next` for the implementation path unless a branch explicitly chooses a no-new-dependency spike. Serwist gives a Next.js integration, generated precache support, and a typed service worker flow. Standardize on `frontend/src/app/sw.ts` as the source worker and `frontend/public/sw.js` as the generated output.

### Service Worker Strategy

- Add `public/sw.js` or `src/app/sw.ts` depending on the selected approach.
- Serve `/sw.js` with `Content-Type: application/javascript; charset=utf-8`, `Cache-Control: no-cache, no-store, must-revalidate`, and a strict service-worker CSP.
- Include `Service-Worker-Allowed: /` and ensure CSP allows the worker with `worker-src 'self'`.
- Register the service worker from a small client component that is rendered once in `frontend/src/app/layout.tsx`.
- Keep `middleware.ts` matcher exclusions updated so the service worker file is not forced through app-page nonce handling.
- Cache static assets with stale-while-revalidate.
- Use network-first for proof pages, falling back to cached proof only with stale disclosure.
- Use network-only for RPC, fee-bump, wallet, and transaction routes.
- Use user-prompted refresh for service worker updates. Do not force `skipWaiting` during a live demo unless the refresh UX is visible.

### Install Prompt

The app already has a manifest. Keep install UX modest:

- Show an install affordance only when the browser exposes it or when iOS manual instructions are needed.
- Do not rely on `beforeinstallprompt` as the only path because it is not cross-platform.
- Test locally over HTTPS when validating install and notification behavior.

### Push Notifications

Defer push notifications. A legitimate use exists, such as notifying that a credential was verified or a payment settled, but subscriptions require durable storage and event delivery. That pushes against the no-heavy-backend guardrail.

## Theme C: AI Automation

### Recommendation

Split AI work into deterministic checks and AI-assisted chores:

Deterministic scripts:

- Health endpoint checks.
- Contract ID drift checks.
- Proof sample availability.
- Security header regression checks.
- Build/lint/test/e2e.
- Screenshot refresh.

AI-assisted chores:

- Summarize failed CI logs into a maintenance issue.
- Draft release notes after a green release.
- Review docs for stale contract IDs after deterministic scripts identify the exact mismatch.
- Propose dependency update notes, but leave merges to CI and human review.

### Claude / Agent Pattern

- Use Claude Code locally or in a scheduled routine for weekly maintenance summaries.
- Use the Claude Agent SDK only when the workflow needs programmable orchestration, tool allowlists, cost tracking, or subagents.
- Use MCP for external context such as GitHub, Vercel, browser automation, or issue trackers.
- Give agents read-only defaults for audits. Allow edits only on maintenance branches.
- Require deterministic scripts to pass before an agent-generated PR is considered credible.

### Product AI

Possible later feature: issuer-side credential metadata drafting and employer-facing proof explanation. Constraints:

- AI copy must be labeled as explanatory, not authoritative.
- On-chain contract state and hash verification remain the source of truth.
- Do not generate new claims that are not present in issuer input, proof metadata, or contract state.
- Avoid public, unauthenticated AI endpoints unless abuse controls are in place.

## Theme D: Headless / CLI Automation

### Recommendation

Add a tiny Node/TypeScript ops command set under `frontend/scripts/ops/` and wire it into `frontend/package.json`.

Target scripts:

- `npm run ops:health` - hit canonical URLs and validate HTTP status, JSON shape, and key proof route availability.
- `npm run ops:contract-drift` - compare README contract ID, status route contract ID, configured env value, and Stellar Expert URL shape.
- `npm run ops:proof -- c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3` - perform a read-only proof check using the existing server-read code path where possible.
- `npm run ops:headers` - assert CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`, and proof embed frame behavior.
- `npm run ops:domain` - assert apex is live and `www`/`earn` redirect to the canonical domain.
- `npm run ops:testnet-guard` - scan workflow/scripts/docs for mainnet/public-network examples, private-key patterns, and secret usage in scheduled jobs.
- `npm run screenshots` - extend existing `scripts/capture-readme-screenshots.ts` into an explicit npm command.

### CI Packaging

Add `.github/workflows/maintenance.yml`:

- `workflow_dispatch` for manual demo-day checks.
- `schedule` once or twice weekly, off the top of the hour.
- Run `npm ci`, `npm run ops:health`, `npm run ops:contract-drift`, `npm run ops:headers`, and optionally Playwright smoke.
- Add `npm run test:unit` to `.github/workflows/frontend-ci.yml` so colocated `src/lib/*.test.ts` tests are a required gate.
- Expand CI path filters so README, `MAINTENANCE.md`, `docs/**`, and `setup/master-plan.md` can trigger drift/maintenance checks.
- Upload a JSON report artifact.

### Stellar Automation

- Continue using Stellar testnet only.
- Prefer `stellar keys generate my-key --network testnet --fund` for disposable demo identities.
- Use `stellar contract deploy --wasm target/wasm32v1-none/release/stellaroid_earn.wasm --source-account my-key --network testnet` in docs and scripts.
- Keep secrets out of repo and CI logs.
- Treat all deploy automation as opt-in, never part of scheduled jobs.

## Theme E: Highest-Leverage Extras

- RPC resilience: add configurable read RPC fallback providers and bounded retry/backoff around `simulateTransaction`. Keep write submission conservative.
- Performance: code-split Stellar SDK-heavy dashboard/wallet paths away from public proof and landing pages.
- SEO: keep proof pages crawl-controlled and structured data safe; do not let crawlers spider arbitrary proof hashes.
- Accessibility: add automated checks after PWA work, especially for offline banners, install prompts, focus order, and icon-only controls.
- Demo credibility: keep `README.md`, `/status`, and live contract links in lockstep via drift checks.

## Do Not Do This

- Do not deploy examples to mainnet.
- Do not add a database-backed marketplace, LMS, or NFT source-of-truth layer.
- Do not show cached proof data as freshly verified.
- Do not cache signed transactions, Freighter state, wallet addresses as identity state, or fee-bump payloads.
- Do not add push notifications until there is a justified storage/delivery model.
- Do not let an LLM decide whether a proof is valid. It may explain deterministic results only.
- Do not add a heavy backend just to make the PWA score look better.

## One-Week Plan

1. Day 1: Land this master plan PR and agree on P0 scope.
2. Day 2: Add `ops:health` and `ops:contract-drift` scripts with JSON output.
3. Day 3: Add a `maintenance.yml` GitHub Action with manual dispatch and weekly schedule.
4. Day 4: Add security header assertions and update `MAINTENANCE.md` to point to commands.
5. Day 5: Add offline UX copy/spec and service worker implementation plan for the next PR.
6. Day 6: Run the full demo script from a clean checkout and record any paper cuts.
7. Day 7: Present the maintenance evidence: green CI, health JSON, status route, sample proof, and contract links.

## One-Month Plan

1. Week 1: Deterministic maintenance automation and PR-ready evidence.
2. Week 2: PWA shell, offline page, and service worker registration.
3. Week 3: Proof snapshot caching with stale proof UI and e2e coverage.
4. Week 4: AI-assisted maintenance workflow, screenshot refresh command, Lighthouse artifact, and RPC fallback hardening.

## Presentation PR Scope

This branch should stay focused on planning and setup:

- Fill `setup/master-plan.md`.
- Add a Superpowers implementation plan for the phased work.
- Keep product code unchanged unless the PR explicitly moves into Phase 1.
- Validate with markdown/file checks and git diff review.

Suggested PR:

- Branch: `codex/pwa-ops-master-plan`
- Title: `[codex] add PWA and ops automation master plan`
- Base: `main`

## Parallel Multi-Agent Setup

Use this setup when moving from planning into implementation. The main agent owns coordination, final integration, and verification. Worker agents own bounded file sets and must not revert or rewrite another worker's changes.

### Agent Roster

| Agent | Type | Workstream | Owned files | Output |
|---|---|---|---|---|
| Agent 1 | Worker | Deterministic ops CLI | `frontend/scripts/ops/**`, `frontend/package.json` | Adds `ops:health`, `ops:contract-drift`, `ops:headers`, and `ops:all` |
| Agent 2 | Worker | Scheduled maintenance CI + runbook | `.github/workflows/maintenance.yml`, `MAINTENANCE.md` | Adds manual/scheduled workflow and script-first runbook |
| Agent 3 | Worker | PWA shell design spike | `docs/superpowers/plans/2026-06-13-pwa-shell.md` only | Produces the next implementation plan for service worker/offline shell |
| Agent 4 | Explorer | UI/UX verification | read-only over `frontend/src/app/**`, `frontend/src/components/**`, `frontend/src/styles/globals.css` | Reports accessibility, touch target, stale-proof, and responsive risks |
| Agent 5 | Explorer | Security/offline risk review | read-only over `frontend/src/middleware.ts`, `frontend/next.config.ts`, `frontend/src/app/proof/**` | Reports CSP, frame, caching, and proof freshness risks |

### Wave Matrix

| Wave | Owner | Scope | Output |
|---|---|---|---|
| 0 | Coordinator | Freeze constants: canonical URL, sample hash, current testnet contract ID, no-secret rule | Shared env/command contract |
| 1A | Ops Health/Proof worker | `ops:health`, `ops:proof`, JSON reports, live read-only proof simulation | Deterministic health/proof scripts |
| 1B | Drift/Testnet worker | Contract ID scan, testnet-only scan, no-secret CI scan | `ops:contract-drift`, `ops:testnet-guard` |
| 1C | Headers/Domain worker | CSP/HSTS/XFO checks, embed iframe smoke, apex/www/earn redirect/TLS checks | `ops:headers`, `ops:domain` |
| 1D | CI Packaging worker | `maintenance.yml`, artifact upload, add `test:unit`, broaden doc-triggered checks | Scheduled/manual CI |
| 1E | Runbook/AI worker | Update `MAINTENANCE.md`; AI prompt consumes JSON artifacts only | LLM summary workflow, non-authoritative |
| 2 | Coordinator | Run full deterministic suite, inspect artifacts, resolve overlaps | PR-ready evidence bundle |

### Dispatch Order

1. Start Agents 1, 2, 4, and 5 in parallel.
2. Main agent continues with branch hygiene, source review, and any docs that do not overlap with worker files.
3. Wait for Agent 1 and Agent 2 before integration because their changes affect CI commands.
4. Run `git diff --check`.
5. Run `cd frontend && npm run lint && npm run build && npm run test:unit`.
6. Run `cd frontend && OPS_CONTRACT_ID=CDMUOHMARNVOJZM3IVOCJUPGBHDTHFBMZCCZXEZPQDVJGILH3NIKTTW3 npm run ops:all`.
7. Start Agent 3 only after Phase 1 passes, so the PWA plan reflects the actual ops script names.

### Agent Prompts

Use these concrete prompts:

```md
You are working in `/Users/kuya/Documents/STELLAR/Hackathon-Stellaroid_Earn`.
You are not alone in the codebase. Do not revert others' edits.

Own only: `frontend/scripts/ops/common.ts`, `frontend/scripts/ops/health.ts`, `frontend/scripts/ops/contract-drift.ts`, `frontend/scripts/ops/headers.ts`, and `frontend/package.json`.
Goal: add deterministic ops CLI commands for health, contract drift, security headers, and an `ops:all` wrapper.
Constraints: testnet only, no backend, no secrets, no stale cached proof shown as live verified.
Verification: run `cd frontend && npm run ops:all` with `OPS_CONTRACT_ID=CDMUOHMARNVOJZM3IVOCJUPGBHDTHFBMZCCZXEZPQDVJGILH3NIKTTW3`.
Return: changed files, verification output, known risks.
```

```md
You are working in `/Users/kuya/Documents/STELLAR/Hackathon-Stellaroid_Earn`.
You are not alone in the codebase. Do not revert others' edits.

Own only: `.github/workflows/maintenance.yml` and `MAINTENANCE.md`.
Goal: add a manual/scheduled maintenance workflow and update the runbook so script-first checks are the default.
Constraints: testnet only, no secrets, no writes to production, deterministic scripts are authoritative.
Verification: run `ruby -e "require 'yaml'; YAML.load_file('.github/workflows/maintenance.yml'); puts 'workflow yaml ok'"` and `git diff --check`.
Return: changed files, verification output, known risks.
```

```md
You are working in `/Users/kuya/Documents/STELLAR/Hackathon-Stellaroid_Earn`.
You are not alone in the codebase. Do not revert others' edits.

Read only: `frontend/src/app/**`, `frontend/src/components/**`, `frontend/src/styles/globals.css`, `frontend/src/middleware.ts`, `frontend/next.config.ts`, and `frontend/src/app/proof/**`.
Goal: report UI, accessibility, CSP, frame, offline caching, and stale-proof risks before PWA implementation.
Constraints: no edits; no emoji icons; 44px touch targets; visible focus; no stale green proof state.
Verification: report exact file paths and line references for every finding.
Return: findings grouped by severity plus recommended owner agent.
```

### File Ownership Rules

- Agent 1 may edit only `frontend/scripts/ops/**` and `frontend/package.json`.
- Agent 2 may edit only `.github/workflows/maintenance.yml` and `MAINTENANCE.md`.
- Agent 3 may create only the PWA shell plan document.
- Explorer agents are read-only and return findings; the main agent integrates their findings.
- The main agent is the only one allowed to edit `setup/master-plan.md`, `frontend/src/app/layout.tsx`, `frontend/src/middleware.ts`, `frontend/next.config.ts`, and `frontend/playwright.config.ts` because those are cross-cutting integration files.

### Integration Checklist

- Confirm each worker reports exact file paths changed.
- Review `git diff --stat` and full diffs before accepting worker output.
- Reject any worker change that touches secrets, mainnet, wallet state caching, or broad unrelated files.
- Confirm `setup/master-plan.md` still matches the implementation plan.
- Keep commits small: first docs/setup, then deterministic ops, then PWA shell in a later PR.

## Phase Execution Checklist

### Phase 0: Planning PR

- [ ] Keep `setup/SETUP_RESEARCH_BRIEF.md` in scope as the source brief.
- [ ] Fill `setup/master-plan.md`.
- [ ] Add `docs/superpowers/plans/2026-06-12-pwa-ops-automation.md`.
- [ ] Run `git diff --check`.
- [ ] Run a red-flag/source scan over the new docs.
- [ ] Commit on `codex/pwa-ops-master-plan`.

### Phase 1: Deterministic Ops PR

- [ ] Add `frontend/scripts/ops/common.ts`.
- [ ] Add `frontend/scripts/ops/health.ts`.
- [ ] Add `frontend/scripts/ops/contract-drift.ts`.
- [ ] Add `frontend/scripts/ops/headers.ts`.
- [ ] Add `frontend/scripts/ops/proof.ts`.
- [ ] Add `frontend/scripts/ops/domain.ts`.
- [ ] Add `frontend/scripts/ops/testnet-guard.ts`.
- [ ] Add npm scripts: `ops:health`, `ops:proof`, `ops:contract-drift`, `ops:headers`, `ops:domain`, `ops:testnet-guard`, `ops:all`.
- [ ] Add `.github/workflows/maintenance.yml`.
- [ ] Update `MAINTENANCE.md` with script-first checks.
- [ ] Update `.github/workflows/frontend-ci.yml` to run `npm run test:unit`.
- [ ] Verify lint, build, unit tests, typecheck, e2e, and `ops:all`.

### Phase 2: PWA Shell PR

- [ ] Add `/offline` page.
- [ ] Add service worker registration client component.
- [ ] Add `/sw.js` or Serwist-generated worker.
- [ ] Update service worker headers and middleware exclusions.
- [ ] Add Playwright coverage for offline fallback.
- [ ] Verify installability and Lighthouse PWA signals without weakening CSP.
- [ ] Add Playwright projects or specs for 375x667, 768x1024, 1024x768, 1440x900, reduced-motion, and proof embed at 320x220 and 420x220.

### Phase 3: Offline Proof PR

- [ ] Add stale proof banner.
- [ ] Cache only previously viewed proof pages and assets.
- [ ] Store `lastVerifiedAt`, `hash`, `contractId`, and `networkPassphrase` with snapshots.
- [ ] Require live re-check before any green verified state.
- [ ] Add e2e coverage for offline proof fallback and online revalidation.
- [ ] Add proof freshness tests covering `/proof/[hash]`, embed, OG image, JSON-LD/share copy where applicable, and `/status`.

### Phase 4: AI-Assisted Maintenance PR

- [ ] Add a maintenance-agent prompt that consumes deterministic script output.
- [ ] Add issue/PR summary templates.
- [ ] Keep AI read-only by default.
- [ ] Require deterministic checks before AI-authored maintenance PRs.

## Required Verification Commands

Run these before claiming any implementation phase is complete:

```bash
git diff --check
cd frontend && npm run lint
cd frontend && npm run build
cd frontend && npm run test:unit
cd frontend && npx tsc --noEmit --incremental false --pretty false
cd frontend && npm run test:e2e
cd frontend && OPS_BASE_URL=https://stellaroid.tech OPS_CONTRACT_ID=CDMUOHMARNVOJZM3IVOCJUPGBHDTHFBMZCCZXEZPQDVJGILH3NIKTTW3 OPS_SAMPLE_HASH=c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3 npm run ops:all
cd frontend && npm run ops:proof -- c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3
rg -n '\bC[A-Z2-7]{55}\b' README.md MAINTENANCE.md docs frontend/public setup
rg -n 'secrets\.|FEE_SPONSOR_TOKEN|STELLAR_SECRET|PRIVATE_KEY|S[A-Z2-7]{55}' .github/workflows frontend/scripts
ruby -e "require 'yaml'; YAML.load_file('.github/workflows/maintenance.yml'); puts 'workflow yaml ok'"
```

Add these once the relevant specs exist:

```bash
cd frontend && npx playwright test e2e/a11y-responsive.spec.ts
cd frontend && npx playwright test e2e/pwa-offline.spec.ts
cd frontend && npx playwright test e2e/proof-freshness.spec.ts
cd frontend && npx lighthouse http://127.0.0.1:3008/proof/c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3 --only-categories=accessibility,performance,best-practices,pwa --form-factor=mobile --chrome-flags="--headless=new"
```

## Source Links

- Next.js PWA guide: https://nextjs.org/docs/app/guides/progressive-web-apps
- Serwist Next.js getting started: https://serwist.pages.dev/docs/next/getting-started
- Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
- GitHub Actions scheduled workflows: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
- Stellar CLI install: https://developers.stellar.org/docs/tools/cli/install-cli
- Stellar deploy to testnet: https://developers.stellar.org/docs/build/smart-contracts/getting-started/deploy-to-testnet
- Stellar RPC `simulateTransaction`: https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/simulateTransaction
- Claude Code overview: https://code.claude.com/docs/en/overview
- Claude Agent SDK overview: https://code.claude.com/docs/en/agent-sdk/overview
- Model Context Protocol overview: https://modelcontextprotocol.io/docs/getting-started/intro
