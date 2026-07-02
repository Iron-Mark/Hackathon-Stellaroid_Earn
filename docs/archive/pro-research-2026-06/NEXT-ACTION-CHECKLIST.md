# Stellaroid Next Action Checklist

Status note: closed for pro-research intake on 2026-06-11. Checked items are either implemented, preserved in this repo, moved into repo-native backlog, or documented as external gates in `INTAKE-STATUS-2026-06-11.md`.

## Before Moving Into Repo
- [x] Move this whole folder into the target repo as `docs/archive/pro-research-2026-06` or `specs/stellaroid`.
- [x] Keep `ref/original` with the spec; prune duplicate extracted text after source verification.
- [x] Confirm the target repo is the Stellaroid/Soroban credential proof product.
- [x] Read `conflicts-and-gaps.md`; this archive has no standalone execution-plan Markdown.
- [x] Confirm all 3 source originals are present in `ref/original`.

## P0 Execution Plan
- [x] Keep the credential proof loop as the active scope.
- [x] Do not expand into marketplace, NFT, or premature mainnet scope before proof loop is strong.
- [x] Add batch credential issuance plan.
- [x] Add revocation and suspension UX with proof-page banners and reasons.
- [x] Add expiration and renewal flow.
- [x] Add employer export pack: issuer, proof status, timestamps, metadata, and shareable summary.
- [x] Add issuer pilot and employer integration request flows.

## Admin and Trust Work
- [x] Define role-based admin model: org admin, reviewer, viewer, support.
- [x] Add audit-log requirements.
- [x] Add branded proof-page requirements: issuer logo, policy links, custom OG image, optional domain mapping.
- [x] Add verification analytics: proof views, shares, verification requests, employer actions.

## SEO and Performance Work
- [x] Verify canonical apex domain and redirects.
- [x] Preserve strong metadata, hreflang, Open Graph, Twitter, and structured data.
- [x] Bound Soroban RPC/testnet calls with caching/API boundaries.
- [x] Reduce heavy client components, animated backgrounds, snackbars, and Framer Motion where they hurt Web Vitals.
- [x] Measure proof-page first visit and cached visit behavior.

## Evidence Gate
- [x] Proof issue, verify, revoke/suspend, and export flows are verified.
- [x] Proof-page performance is measured.
- [x] Pilot capture flow exists.
- [x] All accepted source items are tracked in the repo-native planning docs.
