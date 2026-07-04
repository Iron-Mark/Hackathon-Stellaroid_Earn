# Credential Opportunity Archive

This file consolidates the older Superpowers-generated roadmap, checklist, and production-readiness plans. It is historical reference only, not an active execution plan.

Use current sources first:

- [../../planning/research-intake-status.md](../../planning/research-intake-status.md)
- [../../planning/research-gaps.md](../../planning/research-gaps.md)
- [../../operations/release-and-deployment.md](../../operations/release-and-deployment.md)
- [../../operations/contract-verification.md](../../operations/contract-verification.md)
- [../../../frontend/TODO.md](../../../frontend/TODO.md)
- [../../../ROADMAP.md](../../../ROADMAP.md)

## Replaced Files

This summary replaces these archived generated files:

- `plans/2026-04-18-credential-opportunity-checklist.md`
- `specs/2026-04-18-credential-opportunity-roadmap.md`
- `plans/2026-04-19-production-readiness.md`
- `plans/2026-04-23-black-belt-requirements.md`
- `plans/2026-04-24-opportunity-layer-and-remaining-features.md`

## Implemented Core Outcomes

The current product has substantially covered the original hackathon-grade cut line:

- On-chain issuer registry with approval and suspension states.
- Role-gated credential verification and credential lifecycle reads.
- Credential revocation and suspension flows reflected in proof status UI.
- Public proof pages with issuer trust evidence, metadata details, status timeline, and recruiter-facing handoff.
- Employer flow for opportunity creation, funding intent, and proof-based verification handoff.
- Opportunity contract/client support for lifecycle actions and server-side reads.
- Issuer, employer, proof, talent, opportunity, status, and metrics surfaces in the frontend.
- Testnet deployment evidence, contract verification notes, release notes, and deployment runbook coverage.
- CI and local frontend checks sufficient for demo/testnet iteration.

## Still Open Backlog

Keep these items in active planning docs only when they become real near-term work:

- Formal metadata boundary and stable demo metadata examples.
- Batch issuance and CSV-style issuer workflows.
- Credential expiration and renewal.
- Richer admin or reviewer role separation.
- First-party event indexer/read model for wallet-wide credential discovery, analytics, and full talent passport history.
- Employer candidate search and shortlist UX.
- Opportunity history, timeline, and released-payment activity.
- Branded issuer proof pages.
- Signed standards export after issuer signatures and status policy are finalized.
- Source-verifiable redeploy or attestation path for the currently deployed testnet contract.

## Production Deferred

These are not required for the current testnet showcase, but they matter before a serious production or mainnet release:

- Multisig or managed custody for admin authority.
- Mainnet deployment workflow, rollback policy, and deployment approvals.
- RPC fallback strategy, observability alerts, and uptime monitoring.
- Abuse protection, rate limiting, and security review.
- Stable metadata storage policy, such as IPFS or a pinned equivalent.
- Mobile wallet coverage beyond the current browser/Freighter path.

## Archive Rule

Do not expand this archive back into many generated checklist files. If work becomes active again, move it into the active planning docs or a focused implementation issue, then keep this file as the compact historical summary.
