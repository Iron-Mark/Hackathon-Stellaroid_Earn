# Stellaroid Spec-Driven Development Plan

> Source-backed implementation plan generated from the approved source files preserved in `ref/original/`. Intermediate PDF text extracts were pruned because they duplicated the PDFs.

## Goal
Complete the credential proof loop before expanding marketplace scope: issue, verify, revoke/suspend, export, and share trusted proof pages quickly.

## Source Inputs
| Source | Type | Title | Words/Pages | SHA-256 |
| --- | --- | --- | --- | --- |
| Markdown/Deep Research Reports/Stellaroid Earn - Deep Audit.md | deep-audit | Stellaroid Earn Deep Audit | 6426 words | 4fa70f902684 |
| PDFs/Web Audits and SEO/Stellaroid.tech - Performance and SEO Review.pdf | seo-performance-audit | Stellaroid.tech performance & SEO review Overview | 1562 words, 5 pages | 8b3bf8f51042 |
| PDFs/Web Audits and SEO/Stellaroid.tech - SEO Performance and Roadmap Audit.pdf | roadmap | Stellaroid.tech Audit - SEO, Performance & Roadmap | 1709 words, 5 pages | 8fdf44c00514 |

## Non-Negotiable Rules
- Do not start implementation from this archived spec without checking the active planning docs in `../../planning/` and the preserved source evidence in `ref/`.
- Every implemented recommendation must have evidence: command output, browser check, live URL check, screenshot, test, log, or repo diff.
- Do not treat source recommendations as complete until they are mapped to acceptance criteria in the target repo.
- Preserve the current source archive; source docs are references, not files to mutate during product implementation.

## Workstreams
### 1. Product and UX
- Use `product-context.md` to lock the user, problem, positioning, and workflow.
- Implement only the highest-value loop first: Complete the credential proof loop before expanding marketplace scope: issue, verify, revoke/suspend, export, and share trusted proof pages quickly.
- Avoid broad additions that conflict with the source risks.

### 2. Execution Roadmap
- Follow `execution-roadmap.md` phase order.
- Each phase must produce verifiable evidence before the next phase expands scope.
- Blocked external proof must be recorded as blocked, not skipped.

### 3. SEO and Performance
- Use `seo-performance.md` as a required workstream before claiming public readiness.

### 4. Documentation and Evidence
- Keep an implementation log in the target repo or project workspace when execution begins.
- Update public docs/runbooks only when behavior, commands, env requirements, public workflow, or deployment flow changes.

## Acceptance Criteria
- All relevant source suggestions must have one of these statuses in the active implementation tracker: implemented, intentionally deferred, blocked, not applicable.
- Product direction and scope conflicts in `conflicts-and-gaps.md` are resolved before code execution.
- Any SEO/performance claims are backed by current measurement, not source assumptions.
- Any external proof requirement has concrete evidence or a clearly named blocker.

## Suggested First Pass
1. Prioritize the credential proof loop over premature marketplace/NFT/mainnet expansion.
2. Add batch issuance, revocation/suspension UX, expiry/renewal, branded proof pages, and role-based admin/audit logs.
3. Create employer/recruiter export packs and pilot request flows for real B2B traction.
4. Optimize Soroban proof page rendering with caching/API boundaries so first visits do not block on RPC unnecessarily.
5. Trim heavy client components, animated backgrounds, snackbars, and Framer Motion where they hurt Web Vitals.
