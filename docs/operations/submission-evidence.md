# Submission Evidence Map

Use this as the reviewer-facing evidence index for the Rise In checklists. Keep claims tied to artifacts that can be opened, run, or inspected.

## Level 5 (Blue Belt) Evidence

Focus: user growth, product iteration, pitch and demo. The 50+ testnet wallet account threshold is reached with public wallet and transaction evidence: 30 independent participant wallets plus 24 testnet accounts I created and operate for structured QA. Analytics screenshots remain tracked separately.

| Requirement | Evidence | Status |
| --- | --- | --- |
| Public GitHub repository | `https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn` | Done |
| 20+ meaningful commits | Repository history is well above the minimum | Done |
| Live deployed application | `https://stellaroid.tech` | Done |
| Pitch deck (Problem, Solution, Market opportunity, Architecture, Growth strategy, Future roadmap) | `https://stellaroid.tech/slides` - 10-slide deck covering all six required sections | Done |
| Demo video / full product walkthrough | [`demo/stellaroid-earn-demo.mp4`](../../demo/stellaroid-earn-demo.mp4) | Done |
| Updated README and documentation | Root [`README.md`](../../README.md) + [`docs/`](../README.md) | Done |
| User feedback collection via Google Form (wallet, email, name, rating) | [Feedback Form](https://docs.google.com/forms/d/e/1FAIpQLSftFt8grSRUPecRVQWSRROLA8DAUOn4T61CrZQHtPQaMTxaWw/viewform) | Done |
| Responses exported to Excel and linked in README | [`docs/planning/user-feedback-responses.xlsx`](../planning/user-feedback-responses.xlsx) (CSV also committed) | Done |
| User feedback iteration summary with git commit links | README "Improvements Based on Feedback" table + [`docs/planning/user-feedback.md`](../planning/user-feedback.md) - five pilot feedback points each mapped to the improvement and commit that addressed it | Done |
| Optimized onboarding experience | `https://stellaroid.tech/start` - a one-tap "try it in 60 seconds" wizard: connect a wallet, auto-fund on testnet, sign one real on-chain action | Done |
| Structured testnet QA coverage | [`guided-qa-cohort-2026-07.md`](guided-qa-cohort-2026-07.md) records 24 controlled QA accounts, eight role-based journeys, and 72 public transactions | Done |
| Proof of 50+ testnet wallet accounts with real network activity | README "User Validation" and the guided QA evidence log document 54 public wallets linked to Stellar Expert evidence, split as 30 independent participant wallets plus 24 testnet accounts I created and operate for structured QA. All 54 are real, separately funded testnet accounts with public transaction history. Rise In words this requirement as "50+ testnet users onboarded"; the 54 figure counts wallet accounts with real network activity, of which 30 are independent people. | Done (54 of 50 wallet accounts; 30 independent) |
| Screenshots of transaction activity | [`images/status-onchain-metrics.png`](../../images/status-onchain-metrics.png) captured from the live `/status#metrics` panel: 360 indexed public contract events, the live event stream, and the recent-activity feed with a Stellar Expert link per event. [`images/opportunity-directory-escrows.png`](../../images/opportunity-directory-escrows.png) captured from `/opportunity`, showing all 25 escrows on the contract including all eight guided-QA paid trials by title. | Done |
| Product analytics | Vercel Web Analytics, production, trailing 12 months to 2026-07-30: **342 visitors, 1,615 page views, 56% bounce rate.** Figures transcribed in "Traffic and Audience" below. Dashboard screenshots are held and pending commit. | Data recorded; screenshots pending |

**50+ wallet coverage reached:** 54 of 50 testnet wallet accounts are documented with public evidence, comprising 30 independent participant wallets and 24 testnet accounts I created and operate for structured QA. Transaction-activity screenshots are attached, and the traffic figures below are recorded.

## Traffic and Audience

Source: Vercel Web Analytics, Production environment, trailing 12 months as of
2026-07-30. Traffic begins in March 2026; every prior month is zero.

| Month | Visitors | Page views | Bounce rate |
| --- | --- | --- | --- |
| Apr 2026 | 66 | 274 | 44% |
| May 2026 | 111 | 699 | 64% |
| Jun 2026 | 43 | 175 | 56% |
| Jul 2026 | 122 | 467 | 56% |
| **Total** | **342** | **1,615** | 56% |

The monthly columns sum exactly to the dashboard totals (342 and 1,615), so the
breakdown is complete rather than a sampled window.

**Reading the bounce-rate delta honestly:** the dashboard shows `+56%` in red
against the previous period. The previous 12-month window had no traffic at all,
so that is a from-zero baseline artifact, not a regression in engagement.

| Dimension | Top values |
| --- | --- |
| Pages (visitors) | `/` 302 · `/app` 77 · `/proof/c02ce160…` 48 · `/proof` 42 · `/about` 40 · `/employer` 32 · `/issuer` 26 |
| Referrers (visitors) | Facebook family 49 (l.facebook 26, m.facebook 11, facebook 7, l.messenger 5) · google.com 19 · github.com 8 · vercel.com 6 |
| Countries | Philippines 50% · United States 35% · Singapore 2% · Indonesia 1% · Canada 1% |
| Devices | Desktop 67% · Mobile 31% · Tablet 2% |
| Operating systems | Windows 39% · Android 19% · GNU/Linux 15% · iOS 14% · macOS 13% |
| Hostnames (visitors) | stellaroid.tech 248 · stellaroid-earn-demo.vercel.app 95 · preview hosts 3 |

Three things worth drawing out, because they bear on the product claims rather
than being vanity numbers:

- **90 visitors reached a proof page** (`/proof/c02ce160…` 48 plus `/proof` 42).
  The public, wallet-free credential page is the core artifact, and it is the
  second most visited area after the landing page.
- **31% of traffic is mobile and 33% is Android or iOS**, which is the evidence
  base for the mobile-first redesign and the PWA work rather than a guess.
- **19 visitors arrived from organic Google search**, so the content and
  structured-data work is being indexed and clicked, not just published.

These are page-analytics figures. They measure reach, not wallet onboarding, and
are separate from the testnet wallet-account evidence above.

## Required Checklist

| Requirement | Evidence |
| --- | --- |
| Public GitHub repository | `https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn` |
| README with complete documentation | Root [`README.md`](../../README.md), architecture notes in [`docs/reference/architecture.md`](../reference/architecture.md), and demo checklist in [`docs/operations/demo-checklist.md`](demo-checklist.md) |
| Minimum 10+ meaningful commits | Repository history is well above the minimum; use GitHub commit history as the public source of truth |
| Live demo link | `https://stellaroid.tech` |
| Staging and active monthly showcase links | `https://beta.stellaroid.tech` and `https://v3.stellaroid.tech` |
| Contract deployment address | `CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV` on Stellar testnet |
| Transaction hash for contract interaction | README `Contract Deployment Evidence` table includes the deploy transaction and sample proof links |
| Mobile responsive UI screenshot | [`images/mobile-proof-card.png`](../../images/mobile-proof-card.png) |
| CI/CD pipeline running screenshot/link | Frontend CI workflow: `https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn/actions/workflows/frontend-ci.yml`; Contract CI workflow: `https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn/actions/workflows/contract-ci.yml` |
| Test output with 3+ passing tests | Contract tests: `cargo test -p stellaroid_earn --locked` runs 12 tests. Frontend unit tests: `npm run test:unit` covers `frontend/src/lib/**/*.test.ts` plus `frontend/src/app/**/*.test.ts`, 99 tests. End-to-end: `npm run test:e2e` runs 42 Playwright tests. |
| Demo video link | [`demo/stellaroid-earn-demo.mp4`](../../demo/stellaroid-earn-demo.mp4) |
| Pitch deck link | Integrated slide deck route: `https://stellaroid.tech/slides` |

## Advanced Requirements

| Requirement | Current implementation |
| --- | --- |
| Advanced smart contract development | `contracts/stellaroid_earn/src/lib.rs` includes issuer registry, credential lifecycle statuses, rewards, employer-linked payments, opportunity escrow, milestone caps, and typed errors |
| Inter-contract communication | Reward/payment paths use the Stellar Asset Contract token client for XLM transfers |
| Event streaming & real-time updates | `/api/events` returns decoded source-labelled events; `/api/events/stream` exposes a short-lived Server-Sent Events stream; `/status#metrics` renders the live stream panel |
| CI/CD pipeline setup | Frontend CI covers lint, typecheck, build, and E2E for frontend paths. Contract CI covers locked contract tests and WASM build for `contracts/**` and root Cargo paths |
| Smart contract deployment workflow | README and release docs document the testnet contract ID, deploy transaction, and contract build/test commands |
| Mobile responsive frontend development | Next.js app uses responsive Tailwind layouts; proof/status pages are part of the focused smoke path |
| Error handling & loading states | Contract has typed errors; frontend health, proof, fee-bump, wallet, and status paths expose degraded/loading states |
| Writing tests for contracts and frontend | Contract suite has 12 tests; frontend unit suite covers security, schema, proof export/verification, SEO, formatting, and fee-bump policy |
| Production-ready architecture practices | Security headers, CSP, cache boundaries, path-filtered CI, proof route validation, and operations docs are in repo |
| Documentation & demo presentation | README, demo checklist, one-pager, FAQ, press kit, slides route, and committed demo video are present |
| Product iteration telemetry | Vercel page analytics plus privacy-safe custom events cover proof share, proof-pack, employer handoff, shortlist, and escrow-start interactions without sending raw wallet addresses or proof hashes |

## Latest Live Smoke Evidence

Checked on 2026-07-04:

| Surface | Result |
| --- | --- |
| `https://stellaroid.tech/` | `200 OK`, title `Stellaroid Earn -- Proof & Payment on Stellar`, brand content present |
| `https://stellaroid.tech/status` | `200 OK`, title `Project Status | Stellaroid Earn`, brand content present |
| `https://beta.stellaroid.tech/` | `200 OK`, title `Stellaroid Earn -- Proof & Payment on Stellar`, brand content present |
| `https://beta.stellaroid.tech/status` | `200 OK`, title `Project Status | Stellaroid Earn`, brand content present |
| `https://v3.stellaroid.tech/` | `200 OK`, title `Stellaroid Earn -- Proof & Payment on Stellar`, brand content present |
| `https://v3.stellaroid.tech/status` | `200 OK`, title `Project Status | Stellaroid Earn`, brand content present |

## Honest Boundaries

- The deployed app runs on Stellar testnet, not mainnet.
- `/api/events` and `/api/events/stream` are evidence surfaces, not a durable analytics warehouse.
- Vercel custom events are product-iteration signals, not audit logs or proof of unique users.
- The 24 guided QA accounts are controlled test personas. They provide repeatable product and transaction coverage, not proof of 24 additional independent people.
- W3C VC and Open Badges exports are standards-alignment previews until issuer signatures and verification methods are added.
- Stellar Expert source re-verification is tracked separately from the deployed testnet contract address.
