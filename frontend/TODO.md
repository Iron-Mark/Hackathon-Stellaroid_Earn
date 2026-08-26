# Frontend TODO

Status snapshot for the Stellaroid Earn frontend. Product-level tracker lives at `../docs/planning/research-intake-status.md`.

## Done

- [x] `npm install` — all packages installed
- [x] `.env.local` populated with testnet RPC, contract ID, SAC asset, read address
- [x] Dashboard composition: AppShell + RpcStatusPill + NextActionCard + MilestoneRail + RegisterForm / VerifyForm / PayForm + ProofBlockPreview
- [x] Public `/proof/[hash]` route (shareable, no wallet required)
- [x] Dark theme design tokens in `src/styles/globals.css` (IBM Plex Sans/Mono, amber primary, violet accent)
- [x] Human-readable error mapping (`src/lib/errors.ts`) — no raw ScVal / HostError surfaces
- [x] RPC timeout helper (`src/lib/with-timeout.ts`)
- [x] Contract client (`src/lib/contract-client.ts`) maps all 5 public fns + 6 error variants
- [x] `next build` compiles; Vercel live at https://stellaroid.tech/
- [x] Security hardening (2026-04-18):
  - HTTP security headers on all routes: CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS (`next.config.ts`)
  - `/proof/[hash]` and `/proof/[hash]/embed`: hex-format guard (`notFound()` for invalid input) + `revalidate=60` replacing `force-dynamic`
  - `robots.ts`: disallow `/proof/` to block crawlers from spidering dynamic hash routes
  - `npm audit`: 0 vulnerabilities confirmed

## To run locally

```bash
cd frontend && npm run dev
```

Open http://localhost:3000 with [Freighter](https://www.freighter.app/) installed and set to **Testnet**.

## Opportunity Layer (2026-04-24)

- [x] `OpportunityStatus` + `OpportunityRecord` types in `types.ts`
- [x] Opportunity error mappings (#13–#17) in `errors.ts`
- [x] Opportunity client bindings in `contract-client.ts` (create/fund/submit/approve/release/refund/get)
- [x] `getOpportunityServer` in `contract-read-server.ts`
- [x] Proof subcomponents: `issuer-trust-card.tsx`, `credential-status-timeline.tsx`, `recruiter-cta-panel.tsx`
- [x] `/employer` route with credential lookup + opportunity creation/funding
- [x] `/opportunity/[id]` route with milestone stepper + role-based action controls
- [x] `/talent/[address]` passport shell route
- [x] Navigation links added (site-nav + site-footer)
- [x] `issuer-registry.ts` marked as deprecated display-only fallback
- [x] Pro-research intake summarized under `../docs/planning/research-intake-status.md` and archived under `../docs/archive/pro-research-2026-06`
- [x] `/proof/[hash]/export` employer verification summary route
- [x] `/pilot` issuer/employer pilot capture route
- [x] Persona-first public entry: primary nav and landing cards now route visitors to Issue, Verify, Hire, Pilot, and Status
- [x] Employer proof pack now includes an unsigned W3C VC 2.0 / Open Badges 3.0 alignment preview with explicit non-conformance warning
- [x] Proof-to-employer handoff: `/employer?hash=...&candidate=...` auto-loads verified proofs, shows a review checklist, and blocks candidate wallet mismatches before escrow creation
- [x] Employer / issuer / proof polish: proof pages, `/employer`, `/issuer`, and the proof pack now share the same confirm proof -> match wallet -> fund escrow review path
- [x] Proof-to-passport handoff: `/talent/[address]?proof=...` shows a known proof only when the proof owner matches the wallet, while keeping wallet-wide discovery marked as indexer-dependent
- [x] Issuer onboarding clarity: registration shows approval readiness, and `/issuer` explains the profile -> approval -> issue credentials trust-state ladder
- [x] Pilot scope guardrails: `/pilot` keeps the first rollout bounded to 5-10 testnet credentials with no mainnet or production payroll claims

## Pro-Research Backlog (2026-06-11)

- [ ] Batch issuance: CSV preview, validation, duplicate/hash checks, and signing queue
- [x] Expiration/renewal workflow: issuer refresh dates, optional validity window after `register_certificate`, proof-page overlay for elapsed `expires_at`, and renew/set writes. Live `v3.0.0` WASM still omits the new methods until a new contract ID is deployed. Reminder emails / reissue UX remain later work.
- [ ] Admin trust model: org admin, reviewer, viewer, support roles, and audit logs
- [ ] Branded proof pages: issuer logo, policy links, custom OG variants, optional issuer domain mapping
- [x] Privacy-safe custom events: proof share, proof pack, employer handoff, shortlist save, and escrow-start actions without raw wallet/proof identifiers
- [ ] Durable analytics read model: proof history, verification requests, issuer conversion, funnel reporting, and audit-grade action history
- [ ] Standards export: signed VC 2.0 / Open Badges 3.0 compatible JSON after pilot demand is proven

## Nice-to-haves (out of scope for bootcamp submission)

- [ ] Per-event detail modal on the Proof page (currently links to stellar.expert)
- [ ] Optional server-side cert hash registry index for discovery UX
- [ ] Playwright e2e driving Freighter via a mock
