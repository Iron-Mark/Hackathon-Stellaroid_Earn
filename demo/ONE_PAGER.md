# Stellaroid Earn — One-Pager

## The problem — the friction costs more than the fraud

**Maria graduated top of her bootcamp cohort in Quezon City.** She applies to a Singapore fintech on a Tuesday. The employer emails her school to confirm the certificate. Three weeks later, the role is filled — by a candidate who didn't need verifying.

- Verification takes **14–21 days**.
- **32%** of candidates misrepresent their education.
- Background checks cost **$30–$75** each.
- So employers default to the candidate they *can* vet cheaply — and Maria loses a job she earned.

The certificate is real. The problem is that proving it costs more than hiring around it.

**Stellaroid Earn makes proof cheaper than skipping it.**

## The approach — bind the hash, pay the wallet, prove the work

Maria's school hashes her diploma and anchors it on Stellar. The Singapore employer verifies in 5 seconds, pays 500 XLM directly to her wallet — no invoice, no platform, no wait. The whole cycle takes less time than reading this paragraph.

1. **Register** — Issuer anchors a SHA-256 hash of the deliverable on-chain.
2. **Verify** — Employer confirms the hash matches their copy.
3. **Pay** — Settlement happens in the same flow, in the same app, on the same ledger.
4. **Share** — The result is a public proof URL — a receipt anyone can open.
5. **Lookup** — Anyone can paste a hash at `/proof` and resolve a proof page **without a wallet**.

The canonical output isn't the UI — it's the **event stream on stellar.expert**. A reviewer with no frontend access still sees every issuance, verification, and payment. The proof is public by default.

No backend. No database. No middleman. Just a contract, a wallet, and a link.

## Why Stellar + Soroban

- **Sub-cent fees** → micro-payments for micro-work are viable.
- **5-second finality** → demo-friendly, employer-friendly.
- **Freighter wallet** → zero onboarding friction for Web2 users.
- **Native payment rails** → no bridging, no wrapped assets, no L2 handoff.

## Who it's for

| Segment | Use case |
|---|---|
| **Freelance platforms** | Escrow-free milestone payouts |
| **Bootcamps & cohorts** | Provable completion + stipend release |
| **Bounty programs** | Hash-anchored submissions tied to bounty payout |
| **Grant DAOs** | Milestone verification with on-chain disbursement |
| **Gig marketplaces** | Two-sided proof for reviews and reputation |

## Edge

- **Proof-first UX** — the artifact *is* the product, not a tab in a dashboard.
- **Shareable by default** — every completed flow produces a link, not a record.
- **Walletless verification** — any third party can resolve a proof page from a hash at `/proof` without installing Freighter or creating an account.
- **Payment is a step, not an afterthought** — most credentialing dApps stop at verification.
- **Production-grade polish** — 15s RPC timeouts, humanized errors, branded 404 / error boundary, WCAG AA, reduced-motion, 44×44 touch targets.

## Status

- ✅ Deployed on Stellar testnet (Contract ID above)
- ✅ Frontend live on Vercel
- ✅ Full register → verify → pay → proof flow working end-to-end
- 🚧 Mainnet readiness, demo-mode fallback, verified-events history feed

## Ask

We're looking for:
- **Design partners** — one freelance platform, one bootcamp, one bounty program.
- **Feedback** — from Stellar ecosystem judges on mainnet-readiness.
- **Distribution** — a slot in Stellar community showcases.
