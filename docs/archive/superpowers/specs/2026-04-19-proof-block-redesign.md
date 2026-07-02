# Proof Block Redesign — Trust Narrative Flow

**Date:** 2026-04-19
**Status:** Approved

## Goal

Improve first-impression credibility and the information trust chain across both Proof Block surfaces — the dashboard preview card (`proof-block-preview.tsx`) and the full public proof card (`proof-card.tsx` at `/proof/[hash]`).

**Audience:** Mixed — non-technical hiring managers, technical recruiters, peers, and Stellar/crypto-native viewers. The card must work for all without alienating any group.

**Primary outcomes:**
1. A non-technical viewer opening the link immediately understands "this is a real, verifiable credential" without needing blockchain context.
2. The card walks both audiences through a clear trust chain: *What they earned → Is it trustworthy → How to verify → Share it.*

---

## What changes (and what stays)

### Changes

| Surface | What changes |
|---|---|
| `proof-card.tsx` | Section order rewritten as Trust Narrative (see below) |
| `proof-card.tsx` | Pitch line removed — credential title becomes H1 |
| `proof-card.tsx` | Technical details (contract ID, hash, owner, issuer addresses) collapsed into a `<details>` disclosure |
| `proof-card.tsx` | Rubric ("Submission self-check") collapsed into a `<details>` disclosure, closed by default |
| `proof-card.tsx` | QR code moves up into the "How to verify" section |
| `proof-block-preview.tsx` | Shows credential title + verified status instead of generic copy |
| `proof-block-preview.tsx` | Locked state copy updated to explain *why* locked and what to expect |

### Does not change

- Design tokens, color system, font system — all existing variables stay.
- Share buttons (X, LinkedIn, copy link) — content and behavior unchanged.
- All on-chain data fetched and displayed — nothing is removed from the DOM, only reordered or collapsed.
- The rubric checklist items — content unchanged, only wrapped in a `<details>`.
- The embed route (`/proof/[hash]/embed`) — out of scope.
- Any backend or contract logic.

---

## Full Proof Card — new section order

The card at `/proof/[hash]` now reads top-to-bottom as a trust narrative:

### Header row (unchanged position)
- `[Stellar testnet]` badge + `[● Status]` badge

### ① What they earned
- Cohort badge (e.g. "Cohort 2026")
- **H1: Credential title** — e.g. "Smart Contract Development" (was the pitch line slot; "Smart Contract" stays prominent)
- Description paragraph from `proofMetadata.description`
- Skills badges from `proofMetadata.skills`

> If `proofMetadata` is null, this section shows a minimal fallback: the `[● Status]` badge and the status title from `statusMeta()`.

### ② Is it trustworthy?
- Status summary box (existing `statusMeta()` title + body), styled with green border/background when `tone === "verified"`
- Issuer row: "Issued by [issuer name] · [Approved issuer / Pending / Suspended badge]"
- The "Open trusted verification flow →" CTA remains here when `canVerify === true`

### ③ How to verify
- QR code block (moved up from near the footer) — size increased from 96px to 128px
- "View on Stellar Explorer ↗" link (contract events page)
- "Copy certificate hash" — copies the full hash

### ▾ Technical details (collapsible `<details>`, closed by default)
- Contract ID + copy button + explorer link
- Certificate hash + copy button
- Owner address + copy button
- Issuer address + copy button

### ▾ Submission self-check (collapsible `<details>`, closed by default)
- Existing 5-item rubric checklist, content unchanged

### ④ Share it
- Existing `<ShareButtons>` component (X, LinkedIn, copy link), unchanged

### Footer (unchanged)
- "Generated from bootcamp submission · Stellar PH Bootcamp 2026"

---

## Dashboard Preview Card — new design

`proof-block-preview.tsx` receives the credential title and status as props (sourced from `proofMetadata` and the cert status on the parent page).

### Unlocked state (hash present)
```
[Proof Block]                          ← existing badge

Smart Contract Development             ← proofMetadata.title (bold, ~1.05rem)
[● Verified]  Cohort 2026             ← status badge + cohort

Your on-chain credential — anyone     ← updated body copy
can verify it, no login needed.

View & share your proof →             ← link to /proof/[hash]
```

### Locked state (no hash)
```
[Proof Block]

Smart Contract Development             ← static fallback title from config
                                         or omitted if not configured

Your proof card unlocks after you      ← updated copy; explains why
complete registration. Once issued,      and what to expect
anyone can verify it — no login needed.

🔒 Awaiting registration              ← icon + label (replaces illustration)
```

### Props change
`ProofBlockPreview` gains one new optional prop:
- `certStatus?: CertificateStatus` — sourced from `milestones.credentialStatus` in `app-experience.tsx` (already available); used to derive the status badge tone.

The credential title is **not** a prop. The component calls `getProofMetadata(hash)` internally (synchronous, client-safe) to get the title when a hash is present. If that returns null, it falls back to the hardcoded constant `"Stellar Smart Contract Bootcamp Completion"` from `proof-metadata.ts`. No new fetch is required.

---

## Component changes

| File | Change type |
|---|---|
| `proof-card.tsx` | Reorder sections, add two `<details>` wrappers, move `<ProofQrBlock>` |
| `proof-block-preview.tsx` | Add `certStatus` prop, call `getProofMetadata(hash)` internally, update copy |
| `app-experience.tsx` | Pass `certStatus={milestones.credentialStatus}` to `<ProofBlockPreview>` |
| `proof-qr.tsx` | Increase default `size` prop from 96 to 128 |

No new dependencies. No new API calls. The `<details>`/`<summary>` elements are native HTML — no JS needed for the collapsible behavior.

---

## Edge cases

| State | Handling |
|---|---|
| `proofMetadata` is null | Section ① shows status badge + status title as fallback; credential title falls back to "Your credential" or is omitted |
| `cert` is null (not found / lookup failed) | Section ① is skipped; existing not-found state renders below the header |
| `cert.status === "revoked"` | Section ② status box styled with danger tone (existing behavior, unchanged) |
| `issuerLookupFailed` | Issuer row shows "Issuer lookup unavailable" (existing fallback, unchanged) |
| No `credentialTitle` prop on preview card | Heading is omitted; existing layout degrades gracefully |

---

## Out of scope

- Animation or transitions on the `<details>` elements
- Adding a "Download as PDF" button
- Certificate aesthetic / diploma layout (Approach C)
- Any changes to the embed route
- Mainnet support
