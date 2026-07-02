# Issuer Trust Layer — Design Spec

**Date:** 2026-04-18
**Status:** Approved
**Approach:** Contract-first (Approach 1) — rebuild and redeploy contract, then build frontend surfaces

---

## Context

The deployed Soroban contract (`CBOM7L…`) was built from a stale WASM artifact and only exports 6 functions. The current `contract/src/lib.rs` (433 lines) already implements the full trust layer. The `contract/src/test.rs` already has 6 passing tests. The frontend `contract-client.ts` already has all trust layer calls implemented. The only gaps are:

1. A stale deployed WASM that needs a clean rebuild and redeploy
2. Missing frontend UI surfaces: `/issuer` page content and issuer card on the proof page

---

## Goals

- Multiple organizations can register their wallet as an issuer and be approved by a platform admin
- Only approved issuers can register and verify credentials
- The proof page shows a full issuer card (name, website, category, trust badge) for any verified credential
- The admin can approve or suspend issuers entirely within the dApp — no CLI required
- Credential lifecycle: Issued → Verified → (optionally) Revoked or Suspended. No expiry UI needed now.

---

## Contract

### Current state (lib.rs)
Already complete. No Rust changes required.

**Issuer struct:** `address`, `name`, `website`, `category`, `status` (Pending / Approved / Suspended)

**Credential struct:** `owner`, `issuer`, `title`, `cohort`, `metadata_uri`, `status` (Issued / Verified / Revoked / Suspended / Expired), `issued_at`, `verified_at`, `expires_at`

**Public functions:**
| Function | Auth | Notes |
|---|---|---|
| `init` | admin | One-shot bootstrap |
| `register_issuer` | issuer self | Sets status = Pending |
| `approve_issuer` | admin | Sets status = Approved |
| `suspend_issuer` | admin | Sets status = Suspended |
| `get_issuer` | none | Read-only |
| `register_certificate` | approved issuer | Stores title, cohort, metadata_uri |
| `verify_certificate` | admin or cert's own issuer | Requires issuer to be Approved |
| `revoke_certificate` | admin or cert's own issuer | Terminal — cannot be undone |
| `suspend_certificate` | admin or cert's own issuer | Temporary block |
| `get_certificate` | none | Read-only |
| `reward_student` | admin | Requires cert to be Verified |
| `link_payment` | employer | Requires cert to be Verified |

### Redeploy steps
1. `cargo clean && stellar contract build` — force rebuild from current source
2. `stellar contract deploy --wasm target/wasm32v1-none/release/stellaroid_earn.wasm --source my-key --network testnet`
3. `stellar contract invoke -- init --admin <ADMIN_G_ADDR> --token <ASSET_CONTRACT_ID>`
4. `stellar contract invoke -- register_issuer --issuer <ADMIN_G_ADDR> --name "Stellar PH Bootcamp" --website "stellaroid.dev" --category "bootcamp"`
5. `stellar contract invoke -- approve_issuer --admin <ADMIN_G_ADDR> --issuer <ADMIN_G_ADDR>`
6. Update `NEXT_PUBLIC_SOROBAN_CONTRACT_ID` in `frontend/.env.local`

---

## Frontend

### `/issuer` page

Three states based on connected wallet:

**Unconnected:** Prompt to connect Freighter.

**Connected, no issuer record:** Registration form with fields: name (text), website (text), category (select: bootcamp / university / company / other). Submit calls `registerIssuer`. After submit: shows "Pending approval" status card.

**Connected, issuer record exists:** Status card showing name, website, category, and current status badge (Pending / Approved / Suspended).

**Connected wallet === `NEXT_PUBLIC_STELLAR_ADMIN_ADDRESS`:** Admin panel rendered below the issuer status card (or standalone if admin has no issuer record). Admin panel has:
- Address input + "Look up" button → calls `getIssuer(address)` → shows issuer record
- "Approve" button → calls `approveIssuer(admin, issuer)`
- "Suspend" button → calls `suspendIssuer(admin, issuer)`

Note: no issuer enumeration. Admin pastes the issuer's G… address manually. A `list_issuers` on-chain function and/or event indexer is out of scope for this iteration.

### Proof page — issuer card

**Server-side data fetch** (`proof/[hash]/page.tsx`):
- `getCertificateServer(hash)` — already called
- `getIssuerServer(cert.issuer)` — already called, result passed as `issuer` prop to `ProofCard`
- Issuer lookup failure is non-fatal: renders without issuer card, no error shown to user

**New `<IssuerCard>` component** (`components/proof/issuer-card.tsx`):
- Props: `issuer: IssuerRecord`
- Renders: issuer name, category badge, website link (external), trust badge
- Trust badge: "Verified Issuer" (green) if `status === "approved"`, "Unverified" (muted) otherwise
- Placed below the cert hash block in `ProofCard`, above the metadata panel

### Embed page

- Swap `shortenAddress(cert.issuer, 6)` for `issuer.name ?? shortenAddress(cert.issuer, 6)` in the issuer line
- No issuer card (embed is compact by design)

---

## Data flow

```
Proof page (server)
  getCertificateServer(hash) ──► CertificateRecord
  getIssuerServer(cert.issuer) ──► IssuerRecord | null
  ↓
ProofCard (client)
  ↓
  IssuerCard ← IssuerRecord
  CredentialMetadataPanel ← ProofMetadata

/issuer page (client)
  useWallet() ──► connected address
  getIssuer(address) ──► IssuerRecord | null
  registerIssuer() / approveIssuer() / suspendIssuer() ──► Freighter sign ──► RPC
```

---

## Error handling

`normalizeError` in `contract-client.ts` already maps all relevant error codes:
- `#7 IssuerNotFound` → "No issuer registry record exists for that wallet."
- `#8 IssuerNotApproved` → "Issuer is not approved yet."
- `#9 IssuerSuspended` → "Issuer has been suspended."
- `#11 CredentialRevoked` → "This credential has been revoked."

No changes to error normalization needed.

---

## Out of scope (this iteration)

- Issuer enumeration / admin queue UI (requires on-chain `list_issuers` or event indexer)
- Credential expiry date UI
- Mainnet deployment
- Email or off-chain issuer application flow
