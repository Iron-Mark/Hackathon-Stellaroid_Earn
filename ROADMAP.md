# Stellaroid Earn Roadmap

Stellaroid Earn is no longer just a bootcamp submission. The project should stay alive as a small, credible credential verification product on Stellar testnet first, with a path to real issuer pilots later.

## Current Position

- Canonical live demo: https://stellaroid.tech/
- Fallback demo: https://stellaroid-earn-demo.vercel.app/
- Current verified contract: `CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV`
- Domain state: `stellaroid.tech` is the canonical host; `www` and `earn` should redirect to the apex.
- Product wedge: public credential proof pages plus issuer trust and employer-to-graduate payment flow.
- Pro-research intake: `docs/planning/research-intake-status.md`

## Phase 1 - Keep It Reliable

- Keep the fallback Vercel demo healthy until `stellaroid.tech` is DNS-ready.
- Run the weekly maintenance checks in `MAINTENANCE.md`.
- Keep Playwright E2E green for register, approve, pay, and public proof.
- Keep docs clear that all examples run on Stellar testnet.
- Avoid adding mainnet, NFT, marketplace, or backend scope until the core proof loop is stable.

## Phase 2 - Make It Useful After The Event

- Keep issuer onboarding explicit: profile registration starts trust review, admin approval unlocks writes, and suspended issuers remain visible but blocked.
- Keep the proof-to-employer handoff clean: proof pages carry hash and candidate context into an employer review checklist before escrow creation.
- Keep the proof export route healthy: `/proof/<hash>/export`, including the recruiter-safe summary and unsigned standards-alignment preview.
- Use `/pilot` as the visible capture path for issuer pilots and employer integration requests, with guardrails that keep the first rollout to 5-10 testnet credentials.
- Turn candidate pages into honest talent passports: linked proof pages can attach one known proof, but wallet-wide credential discovery still waits for an indexer.
- Keep `/status` current for demo health, contract ID, proof links, and domain state.
- Document a pilot workflow for one real issuer and a small batch of graduates.

## Phase 3 - Pilot With Real Users

- Pick one issuer: bootcamp, student org, campus group, or small training provider.
- Issue 5-10 real testnet credentials with stable metadata URLs.
- Collect feedback from one employer/recruiter persona on proof clarity and trust.
- Decide whether the next real milestone is a better testnet pilot or a mainnet feasibility study.

## Phase 4 - Product Decisions

- Mainnet: only after issuer workflow, key custody, privacy, support, and revocation policy are written down.
- Metadata hosting: use stable HTTPS JSON first; add pinning/storage only when the issuer workflow needs it.
- Standards export: keep the current VC/Open Badges mapping as an unsigned preview until issuer signing, holder consent, verification methods, and revocation/status policy are designed.
- Indexing: add only when candidate passports must list credentials automatically.
- NFT badge layer: optional presentation layer only. The credential source of truth should remain the Stellar proof record.
- Payments: keep XLM on testnet for the demo; treat USDC or production payment rails as a separate compliance decision.

## Not Now

- No marketplace mechanics.
- No broad learning platform rebuild.
- No mainnet deploy from examples.
- No claim that talent pages automatically discover every wallet credential until an indexer exists.
- No NFT badge layer before issuer proof, export, admin, and analytics demand is validated.
