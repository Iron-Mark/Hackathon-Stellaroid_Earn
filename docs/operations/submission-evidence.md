# Submission Evidence Map

Use this as the reviewer-facing evidence index for the Rise In Level 3 checklist. Keep claims tied to artifacts that can be opened, run, or inspected.

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
| Test output with 3+ passing tests | Contract tests: `cargo test -p stellaroid_earn --locked` runs 12 tests. Frontend unit tests: `npm run test:unit` runs the `frontend/src/lib/*.test.ts` suite. |
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
- W3C VC and Open Badges exports are standards-alignment previews until issuer signatures and verification methods are added.
- Stellar Expert source re-verification is tracked separately from the deployed testnet contract address.
