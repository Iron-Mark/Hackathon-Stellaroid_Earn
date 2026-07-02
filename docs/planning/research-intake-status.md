# Stellaroid Pro-Research Intake Status - 2026-06-11

This file turns the copied pro-research archive into Stellaroid-native status. The archive remains source evidence; this document and the root roadmap are the active tracking surfaces.

## Intake Rule

Keep the credential proof loop as the active scope:

1. approved issuer registers a certificate hash,
2. trusted verifier approves or rejects lifecycle state,
3. public proof page renders walletless verification,
4. employer can inspect proof and export a summary,
5. pilot demand decides whether heavier issuer admin, indexing, standards export, or mainnet work is worth building.

Do not expand into marketplace, NFT, broad AI, or mainnet payment scope before issuer/employer pilot evidence exists.

## Archive Preservation

| Item | Status | Evidence |
| --- | --- | --- |
| Full research pack copied into repo | Implemented | `docs/archive/pro-research-2026-06` |
| Original PDFs preserved | Implemented | `docs/archive/pro-research-2026-06/ref/original` |
| Duplicate extracted source text pruned | Implemented | Original PDFs remain in `docs/archive/pro-research-2026-06/ref/original` |
| Source evidence preserved | Implemented | `docs/archive/pro-research-2026-06/ref` |
| Known conflicts summarized | Implemented | `docs/planning/research-gaps.md` |

## Recommendation Status

| Research recommendation | Status | Repo outcome |
| --- | --- | --- |
| Keep credential proof loop as active scope | Implemented | Roadmap and this intake keep proof-loop-first scope. |
| Avoid marketplace, NFT, premature mainnet scope | Implemented | Roadmap keeps NFT/mainnet/marketplace out of active scope until pilot evidence exists. |
| Batch credential issuance | Accepted backlog | Track as issuer pilot requirement: CSV preview, validation, and signing queue after one issuer pilot. |
| Revocation and suspension UX | Implemented, needs richer reason taxonomy later | Contract supports revoke/suspend, dashboard action buttons exist, and proof pages render revoked/suspended status banners. Reason taxonomy remains backlog. |
| Expiration and renewal flow | Accepted backlog | Contract has `expires_at` and UI status handling. Actual issuer renewal workflow remains future work because current issuance sets `expires_at = 0`. |
| Employer export pack | Implemented | `/proof/[hash]/export` returns a recruiter-safe JSON proof pack with status, issuer, timestamps, metadata, proof URL, explorer links, verification breakdown checks, issuer-trust evidence, and an unsigned standards-alignment preview. |
| Issuer pilot and employer integration request flows | Implemented | `/pilot` provides issuer pilot and employer integration paths with explicit testnet boundary. |
| Role-based admin model | Accepted backlog | Future org admin, reviewer, viewer, and support roles are documented here and in roadmap; not implemented in testnet MVP. |
| Audit-log requirements | Accepted backlog | Future read-model/audit trail requirement; current on-chain events and `/metrics` provide only public chain activity. |
| Branded proof-page requirements | Accepted backlog | Current proof metadata, issuer trust card, OG image, and public proof route provide foundation; per-issuer logo/policy/domain mapping remains backlog. |
| Verification analytics | Partial | `/metrics`, `/api/events`, and Vercel Analytics exist. Proof views, shares, verification requests, and employer actions require a read model or analytics event plan. |
| Canonical apex domain and redirects | Verified externally | Live checks should keep confirming `https://stellaroid.tech` canonical behavior and `www`/`earn` redirects. |
| Metadata, hreflang, Open Graph, Twitter, structured data | Implemented | Shared metadata helpers, proof metadata tests, JSON-LD, OG image tests, sitemap, and robots route exist. |
| Bound Soroban RPC/testnet calls with caching/API boundaries | Implemented | Proof pages use server reads with `revalidate = 60`; status/events use cached routes; client writes use Freighter and timeouts. |
| Reduce heavy client components where they hurt Web Vitals | Implemented for public proof routes | `/proof/[hash]` now keeps the recruiter CTA server-rendered, defers the toast provider, lazy-loads QR generation, avoids the animated button bundle in share actions, and imports proof badges directly. Heavier wallet/app routes remain separate product surfaces. |
| Measure proof-page first and cached visit behavior | Implemented locally | `npm run build` reports `/proof/[hash]` at 127 kB first-load JS after the client-island trim, down from the previously observed 468 kB and then 364 kB intermediate build. Field Web Vitals require production traffic after deploy. |
| Proof issue, verify, revoke/suspend, export flows are verified | Implemented for automated scope | E2E covers register/verify/pay/proof and export. Revoke/suspend controls exist; wallet-authorized live execution remains manual because Freighter/testnet signer state is external. |
| Pilot capture flow exists | Implemented | `/pilot` route. |
| All accepted items are tracked in repo | Implemented | This intake file plus `ROADMAP.md` and `frontend/TODO.md`. |

## Active Backlog After Intake

These are accepted product backlog items, not open pro-research intake tasks:

- Batch issuance: CSV import, row validation, duplicate/hash checks, signing queue, preview before issue.
- Expiration and renewal: issuer-defined validity windows, renewal reminder state, reissue workflow, and proof-page copy for expired/renewed credentials.
- Admin and trust: org admin, reviewer, viewer, support roles, reviewer evidence, issuer domain verification, and audit-log surfaces.
- Analytics: proof views, share actions, verification requests, employer actions, and issuer conversion to pilot.
- Branded proof pages: issuer logos, policy links, custom OG variants, optional issuer domain mapping.
- Standards export: signed VC 2.0 / Open Badges 3.0 compatible JSON and issuer-signed envelopes after pilot demand is proven. Current proof packs include only an unsigned alignment preview and must not be treated as standards-conformant credentials.

## External Gates

- Real issuer pilot evidence.
- Employer/recruiter feedback on proof clarity.
- Live Freighter signer execution for revoke/suspend on a real testnet record.
- Production field Web Vitals if the project is promoted again.

## Verification Evidence

- `npm run lint` passed on 2026-06-11.
- `npm run build` passed on 2026-06-11; `/proof/[hash]` first-load JS is 127 kB, `/proof` is 125 kB, and `/pilot` is 124 kB.
- `npm run test:unit` passed 25/25 on 2026-06-11.
- `npm run test:e2e` passed 9/9 on Chromium on 2026-06-11.
- Live canonical checks showed `https://stellaroid.tech/` returning `200 OK`, with `www` and `earn` redirecting permanently to the apex.
- Live route checks on 2026-06-11 showed `/pilot`, `/proof/[hash]`, `/proof/[hash]/export`, and `/proof/[hash]/qr` returning `200 OK`.
- Live mobile Lighthouse proof refreshed on 2026-06-11 at 18:37 +08 after using Playwright Chromium with an isolated Chrome profile. `/pilot` scored Performance `99`, Accessibility `96`, Best Practices `100`, SEO `92`, CLS `0`; `/proof/[hash]` scored Performance `98`, Accessibility `96`, Best Practices `100`, SEO `92`, CLS `0`. Evidence JSON: `%TEMP%\stellaroid-live-mobile-lh-pilot-20260611-183728.json` and `%TEMP%\stellaroid-live-mobile-lh-proof-20260611-183728.json`.
- Live route proof was refreshed again on 2026-06-11 at 20:08 +08: apex returned `200 OK`; `www` and `earn` redirected permanently to `https://stellaroid.tech/`; `/pilot`, `/proof/[hash]`, `/proof/[hash]/export`, and `/proof/[hash]/qr` returned `200 OK` with expected HTML, JSON attachment, and SVG content types. Playwright Pixel 5 navigation loaded `/pilot` and `/proof/[hash]` with no failed requests and no horizontal overflow. A fresh Lighthouse retry at 20:07 +08 produced unusable `about:blank` reports with `net::ERR_ABORTED`, so the 18:37 Lighthouse JSON remains the latest valid mobile Lighthouse evidence.
