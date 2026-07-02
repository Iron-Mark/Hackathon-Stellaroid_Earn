# Global Hackathon Upgrade Spec

Date: 2026-07-02
Branch: `codex/global-hackathon-upgrade`
Base: `june-monthly-builder`

## Goal

Make Stellaroid Earn more competitive for a global hackathon by tightening the proof story around real, inspectable evidence:

1. public credential proof,
2. issuer trust boundary,
3. employer handoff,
4. on-chain event evidence,
5. standards-alignment honesty.

The project should feel like a working trust product, not a prototype padded with unverifiable traction claims.

## Research Evidence

| Source | Lesson | Implication for Stellaroid Earn |
| --- | --- | --- |
| ETHGlobal judging guidance: technicality, originality, practicality, usability, and wow factor; demo videos should show the project in action and avoid unnecessary waiting. https://ethglobal.com/events/scaling/info/details | A strong submission needs a crisp live demo, functional product path, and memorable differentiator. | The demo should start from `/status`, move to a walletless proof, then employer handoff. Metrics must be accurate enough to survive judge scrutiny. |
| Rise In APAC Stellar Hackathon page asks for user-facing financial applications, payment apps people can use, local utility, and composability with existing Stellar building blocks. https://www.risein.com/programs/apac-stellar-hackathon | Stellar submissions should show real financial utility, not just generic blockchain storage. | The strongest thesis is "verified proof unlocks paid trial / payout" using Stellar testnet assets, not a broad credential marketplace. |
| Stellar RPC `getEvents` docs say RPC event queries are limited to recent ledgers, with default retention around 24 hours and maximum recent-ledger windows. https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/getEvents | RPC event polling alone is not a durable analytics/history layer. | `/status#metrics` must either use a durable public indexer fallback or clearly label metrics as a recent window. |
| Stellar event-ingestion guide models persisting contract events into a database for reuse. https://developers.stellar.org/docs/build/guides/events/ingest | Production-grade event analytics normally needs ingestion, persistence, or an indexer. | A serverless demo can use Stellar Expert as a public indexer fallback, while documenting that a first-party read model is future work. |
| W3C VC Data Model 2.0 describes issuer / holder / verifier roles, credential status, privacy, and security concerns. https://www.w3.org/TR/vc-data-model-2.0/ | Standards alignment requires more than a JSON shape; status and proof semantics matter. | Keep proof-pack output as an unsigned standards-alignment preview until issuer signatures, verification methods, and status-list policy exist. |
| W3C Bitstring Status List warns that one-to-one status URLs can create correlation risk. https://www.w3.org/TR/vc-bitstring-status-list/ | Revocation/status design has privacy tradeoffs. | Do not claim VC-grade revocation; present current contract status as product evidence and list privacy-aware status lists as future work. |
| Open Badges 3.0 aligns with VC 2.0 and requires proof/signature material for a credential to be verifiable. https://www.imsglobal.org/spec/ob/v3p0 | An unsigned Open Badges mapping is not a conformant OpenBadgeCredential. | Existing proof export wording is correct; keep it explicit across docs and demo copy. |
| OpenCerts verifier UX is simple: drag/select a certificate, then view/check/verify it. https://www.opencerts.io/ | Certificate verification products win trust by making the verification action obvious and low-friction. | Stellaroid's walletless `/proof` and public proof URL should stay the hero, with employer actions attached only after status is verified. |
| OpenCerts CLI warns users to verify blockchain issuance separately after signature checks. https://github.com/OpenCerts/certificate-cli | Mature credential systems separate document integrity, issuer identity, and blockchain anchoring. | The proof pack should distinguish file hash, issuer trust, contract status, and employer decision readiness. |
| Stellar Community Fund criteria include product-market fit, submission quality, use of Stellar, and integration plan. https://communityfund.stellar.org/awards | Strong Stellar projects explain why Stellar is necessary and how they will keep shipping. | Docs and status surfaces should make the Stellar-specific payment/proof value and next pilot path explicit. |

## Current Strengths

- Contract has issuer registration/approval/suspension, credential lifecycle, reward/payment events, and opportunity escrow states.
- Public proof pages are walletless and cacheable.
- Employer handoff exists from a verified proof into `/employer` with hash/candidate context.
- Proof export includes recruiter-safe JSON and correctly labels W3C VC / Open Badges output as an unsigned preview.
- `/pilot` keeps scope bounded to a small testnet issuer/employer rollout instead of premature marketplace/mainnet scope.
- CI is scoped to `main` and `staging`, has path filters, and has concurrency cancellation.
- Existing E2E tests cover proof metadata, employer handoff, issuer onboarding, pilot/export, status, and register/verify/pay flow.

## Critical Gaps

1. **Event metrics undercount real history before this upgrade.** `/status#metrics` used only Soroban RPC `getEvents` over a recent window. That can show zero or partial events even when the contract has older activity.
2. **Judge evidence is scattered.** The proof page, status page, demo docs, roadmap, and security docs each carry part of the story; no single repo spec maps research to build choices.
3. **Pitch docs still contain broad market claims.** Some are cited, but the competitive plan should not rely on hard-to-verify market-size numbers when product evidence is stronger.
4. **Standards support is a preview, not conformance.** The code is careful, but judging/demo docs must keep repeating that line.
5. **Batch issuance and issuer admin depth are still backlog.** These are likely high-impact for real pilots, but they are bigger than the first trust/evidence slice.
6. **Browser polish can regress at tablet/mobile widths.** Recent footer/nav fixes helped; final work still needs screenshot QA across key routes after changes.

## Key Differentiator

Stellaroid Earn should be framed as **a shareable proof-to-payment receipt on Stellar**:

- issuer anchors a certificate hash,
- public proof verifies status without a wallet,
- employer can act on the proof,
- payment/escrow events are visible on-chain,
- proof export says exactly what is verified and what is only standards-aligned preview.

This is more memorable than "a blockchain certificate app" because it ties credential trust to a real financial action.

## High-Impact Features To Build Now

### Slice 1 - Durable Public Event Evidence

Implement a status/event layer that:

- decodes recent RPC events when they are still in the RPC retention window,
- uses Stellar Expert public contract event/index stats as a fallback/supplement,
- deduplicates events,
- displays source/reference per event,
- exposes source counts in `/api/events`,
- changes status copy from "recent RPC window" to "public indexed events where available",
- keeps degraded-state copy honest.

Acceptance criteria:

- `/status#metrics` does not imply RPC polling is full history.
- If RPC has no old events but Stellar Expert has indexed events, metrics still show useful public evidence.
- Event links open the best available explorer target.
- `/api/events` includes `bySource` and unique event refs.
- Tests/build pass.

### Slice 2 - Evidence-First Demo Readiness

Add or update docs so judges can see:

- research-to-build mapping,
- what is live/testnet,
- what is unsigned preview,
- what requires pilot evidence,
- what not to claim.

Acceptance criteria:

- New spec exists in `docs/planning/`.
- README and demo docs do not contradict current status/event behavior.
- Broad market claims are not required to understand the product.

### Slice 3 - UI/QA Polish On Affected Routes

After code changes:

- smoke `/`, `/proof`, `/issuer`, `/employer`, `/pilot`, `/status`,
- verify mobile/tablet footer/status layout,
- capture screenshots for important changes.

Acceptance criteria:

- No obvious overlap, horizontal scroll, or broken status cards.
- No console errors on affected routes.

## Lower-Priority Enhancements

- CSV batch issuance preview and signing queue.
- Issuer domain verification / DNS or website proof.
- Revocation reason taxonomy.
- First-party event read model/database.
- Signed VC 2.0 / Open Badges 3.0 export.
- Proof analytics and employer action tracking.
- Branded issuer proof pages.
- Stablecoin / local anchor payout routes.

## Non-Goals

- No mainnet launch.
- No marketplace/job board expansion.
- No fake usage metrics or fake partners.
- No claim of W3C VC/Open Badges conformance.
- No large contract rewrite unless a specific security issue is proven.
- No CI trigger expansion that burns GitHub Actions without need.

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Public indexer API changes or rate limits | Treat Stellar Expert as a best-effort supplement; keep RPC path and degraded state. |
| Metrics still cannot prove total unique users or proof views | Label metrics as contract/event evidence, not user analytics. |
| Standards preview is mistaken for compliance | Repeat unsigned-preview warning in export, docs, and demo notes. |
| Overbuilding batch/admin before pilot demand | Keep batch/admin as backlog until one issuer pilot validates it. |
| UI changes regress small screens | Run focused Playwright/browser QA at desktop and mobile widths. |

## Implementation Order

1. Add this spec.
2. Bring in the durable event/indexing slice and adjust status/API copy.
3. Update README/demo docs where event indexing or standards wording is stale.
4. Add/adjust tests for `/api/events` source summary and `/status#metrics` copy where practical.
5. Run focused checks: lint, unit, build, targeted E2E/browser QA.
6. Commit and push feature branch.

## QA Plan

- `npm run lint`
- `npm run test:unit`
- `npm run build`
- Targeted E2E for status/proof/export/employer if code changes affect those areas.
- Browser smoke routes:
  - `/`
  - `/proof`
  - `/proof/<sample-hash>`
  - `/issuer`
  - `/employer`
  - `/pilot`
  - `/status#metrics`
- Inspect `/api/events?limit=20` response shape.
- Final `git diff --check` and diff review.

## Demo Script Impact

The demo should open with `/status#metrics` only after the event layer is honest:

1. "Here is the maintained testnet contract and the public event evidence."
2. "Here is one verified proof, walletless."
3. "Here is the employer handoff from that proof."
4. "Here is exactly what the export proves, and what remains an unsigned standards preview."

## Research-To-Build Mapping

| Research finding | Repo gap | Build action | Judge/user value |
| --- | --- | --- | --- |
| Hackathon rubrics reward practicality and usability | Product evidence is split across pages/docs | Status/proof/employer flow becomes the canonical demo path | Judges understand the app in under a minute |
| Rise In asks for real user-facing financial utility | Credential story can sound generic | Frame proof-to-payment as the differentiator | Shows Stellar-specific utility |
| Stellar RPC has short event retention | Metrics can undercount old real events | Add indexer fallback/source labeling | Metrics become credible |
| VC/Open Badges require proof/status semantics | Unsigned preview can be overread | Preserve explicit preview warnings | Avoids standards overclaiming |
| OpenCerts separates view/check/verify | Proof trust dimensions are scattered | Keep proof pack/status copy explicit | Recruiters know what to trust |
