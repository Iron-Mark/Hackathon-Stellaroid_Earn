# Credential-to-Opportunity Roadmap

**Date:** 2026-04-18
**Status:** Approved
**Scope:** Contract + frontend + optional lightweight index

---

## Problem

Stellaroid Earn is already a real Web3 MVP:
- issuer registers a certificate hash on-chain
- employer verifies it
- employer pays the student on Stellar testnet

That base is valid, but the current product still reads like a bootcamp demo because the trust and hiring layers are thin:
- verification is too permissive
- the credential model is too small
- issuer trust is frontend-only
- the proof page is useful but not recruiter-complete
- payment is direct transfer, not an opportunity workflow

In market terms, this app currently competes as a generic credential verifier. That is the wrong fight. Mature products already dominate generic credential issuance, verification, and sharing.

---

## Goal

Evolve Stellaroid Earn from:

`on-chain credential registry + direct payment`

into:

`trusted issuer -> rich credential proof -> employer action -> escrowed paid opportunity`

This is the strongest market position and the strongest hackathon story.

---

## Positioning

### Product line

**From verified learning to verified earning.**

### Narrow wedge

Start with one buyer type:
- bootcamps
- scholarship programs
- apprenticeships
- internship pipelines
- workforce training providers

Do not position this as a universal university credential platform.

### Why this wedge works

- Generic credential issuance is crowded.
- Trust + payment is much less crowded.
- Employers care more about job-ready proof and next-step action than about blockchain itself.
- The repo already has a real payment rail on Stellar, which is the best differentiator to build around.

---

## Principles

1. **Trust-critical state lives on-chain**
Issuer approval, credential status, and opportunity/payment state belong in the contract.

2. **Presentation-heavy metadata can stay off-chain**
Long descriptions, skill arrays, evidence links, and rich recruiter copy can live in a lightweight index or metadata document referenced by hash.

3. **Proof pages must be readable by non-crypto users**
Hashes and explorer links are supporting evidence, not the main product surface.

4. **Every verification screen should lead to a business action**
The app should never stop at "verified."

5. **No NFT detour**
Non-transferable credentials may become useful later, but NFT work should not displace issuer trust, revocation, or opportunity flows.

---

## Architecture Direction

### Current foundation

**Contract**
- [`contract/src/lib.rs`](../../contract/src/lib.rs)
- [`contract/src/test.rs`](../../contract/src/test.rs)

**Frontend**
- [`frontend/src/lib/contract-client.ts`](../../frontend/src/lib/contract-client.ts)
- [`frontend/src/lib/contract-read-server.ts`](../../frontend/src/lib/contract-read-server.ts)
- [`frontend/src/app/app/page.tsx`](../../frontend/src/app/app/page.tsx)
- [`frontend/src/app/proof/[hash]/page.tsx`](../../frontend/src/app/proof/[hash]/page.tsx)
- [`frontend/src/components/proof/proof-card.tsx`](../../frontend/src/components/proof/proof-card.tsx)
- [`frontend/src/lib/issuer-registry.ts`](../../frontend/src/lib/issuer-registry.ts)

### End-state modules

1. **Trust Layer**
- issuer registry
- role-based verification
- revocation / suspension

2. **Proof Layer**
- credential status
- issuer profile
- evidence-rich proof page
- candidate passport

3. **Opportunity Layer**
- employer dashboard
- escrowed paid trial
- milestone payout

4. **Interop Layer**
- structured metadata export
- optional webhook/API bridge

---

## Phase 1: Trust Layer

This phase fixes the current weak point first.

### Contract data model

Add these enums:

```rust
#[contracttype]
#[derive(Clone)]
pub enum IssuerStatus {
    Pending,
    Approved,
    Suspended,
}

#[contracttype]
#[derive(Clone)]
pub enum CredentialStatus {
    Issued,
    Verified,
    Revoked,
    Suspended,
    Expired,
}
```

Add these structs:

```rust
#[contracttype]
#[derive(Clone)]
pub struct Issuer {
    pub address: Address,
    pub name: Symbol,
    pub website: Symbol,
    pub category: Symbol,
    pub status: IssuerStatus,
}

#[contracttype]
#[derive(Clone)]
pub struct Credential {
    pub owner: Address,
    pub issuer: Address,
    pub title: Symbol,
    pub cohort: Symbol,
    pub metadata_uri: Symbol,
    pub metadata_hash: BytesN<32>,
    pub status: CredentialStatus,
    pub issued_at: u64,
    pub verified_at: Option<u64>,
    pub expires_at: Option<u64>,
}
```

Add storage keys:

```rust
pub enum DataKey {
    Admin,
    Token,
    NextOpportunityId,
    Issuer(Address),
    Cert(BytesN<32>),
    Opportunity(u64),
}
```

### Contract methods

Add:
- `register_issuer`
- `approve_issuer`
- `suspend_issuer`
- `get_issuer`
- `issue_credential`
- `verify_credential`
- `revoke_credential`
- `suspend_credential`
- `get_credential`

### Rules

- Only approved issuers can issue credentials.
- Only admin or approved issuer/verifier can verify credentials.
- Revoked or suspended credentials cannot be used to unlock payments.
- Expired credentials remain visible but lose active eligibility.

### Events

Emit:
- `issuer_reg`
- `issuer_appr`
- `issuer_susp`
- `cred_issue`
- `cred_ver`
- `cred_rev`
- `cred_susp`

### Error model

Extend existing errors with:
- `IssuerNotFound`
- `IssuerNotApproved`
- `IssuerSuspended`
- `CredentialRevoked`
- `CredentialExpired`
- `InvalidStatus`

### Tests

Add tests for:
- unapproved issuer cannot issue
- suspended issuer cannot issue
- unauthorized verifier fails
- revoked credential blocks opportunity creation
- credential status changes emit events

---

## Phase 2: Rich Credential Proof

This phase upgrades the product surface.

### Frontend type model

Extend [`frontend/src/lib/types.ts`](../../frontend/src/lib/types.ts) and [`frontend/src/lib/contract-client.ts`](../../frontend/src/lib/contract-client.ts):

```ts
export type IssuerStatus = "pending" | "approved" | "suspended";
export type CredentialStatus =
  | "issued"
  | "verified"
  | "revoked"
  | "suspended"
  | "expired";

export type IssuerRecord = {
  address: string;
  name: string;
  website: string;
  category: string;
  status: IssuerStatus;
};

export type CredentialRecord = {
  owner: string;
  issuer: string;
  title: string;
  cohort: string;
  metadataUri: string;
  metadataHash: string;
  status: CredentialStatus;
  issuedAt: number;
  verifiedAt?: number;
  expiresAt?: number;
};
```

### Metadata strategy

Store minimal trust state on-chain.

Store rich proof content off-chain in metadata:
- title
- description
- skills
- score
- evidence links
- project links
- evaluator notes

Recommended metadata shape:

```json
{
  "title": "Stellar Smart Contract Bootcamp Completion",
  "description": "Completed issuer-approved smart contract training and project demo.",
  "skills": ["soroban", "rust", "stellar", "wallet integration"],
  "score": 92,
  "evidence": [
    { "label": "GitHub Repo", "url": "https://github.com/..." },
    { "label": "Live Demo", "url": "https://..." }
  ],
  "criteria": "Passed assessment, demo review, and deployment check."
}
```

Hash this metadata and store the hash on-chain as `metadata_hash`.

### Proof page upgrade

Upgrade:
- [`frontend/src/app/proof/[hash]/page.tsx`](../../frontend/src/app/proof/[hash]/page.tsx)
- [`frontend/src/components/proof/proof-card.tsx`](../../frontend/src/components/proof/proof-card.tsx)

Add:
- issuer profile card
- credential title
- cohort/batch
- status chip
- issue / verify / expiry timestamps
- skills section
- evidence links
- recruiter CTA panel
- verified PDF export button

### Components to add

- `frontend/src/components/proof/issuer-trust-card.tsx`
- `frontend/src/components/proof/credential-metadata-panel.tsx`
- `frontend/src/components/proof/credential-status-timeline.tsx`
- `frontend/src/components/proof/recruiter-cta-panel.tsx`

### Recruiter CTA

Primary CTA on proof page:

`Fund paid trial`

Secondary CTAs:
- `Copy proof link`
- `Download verified PDF`
- `View issuer`

---

## Phase 3: Opportunity Layer

This is the novelty and the strongest differentiation.

### Contract data model

Add:

```rust
#[contracttype]
#[derive(Clone)]
pub enum OpportunityStatus {
    Draft,
    Funded,
    InProgress,
    Submitted,
    Approved,
    Released,
    Refunded,
    Cancelled,
}

#[contracttype]
#[derive(Clone)]
pub struct Opportunity {
    pub id: u64,
    pub employer: Address,
    pub candidate: Address,
    pub cert_hash: BytesN<32>,
    pub amount: i128,
    pub status: OpportunityStatus,
    pub milestone_count: u32,
    pub current_milestone: u32,
}
```

### Contract methods

Add:
- `create_opportunity`
- `fund_opportunity`
- `submit_milestone`
- `approve_milestone`
- `release_payment`
- `refund_opportunity`
- `get_opportunity`

### Rules

- Opportunity can only be created for an active credential.
- Employer must fund before work starts.
- Candidate can submit progress.
- Employer approves milestone.
- Final approval releases funds.
- Refund path exists for unresolved or cancelled work.

### Events

Emit:
- `opp_create`
- `opp_fund`
- `mile_submit`
- `mile_appr`
- `pay_release`
- `pay_refund`

### Error model

Add:
- `OpportunityNotFound`
- `AlreadyFunded`
- `InvalidMilestone`
- `InvalidOpportunityStatus`
- `PaymentLocked`

---

## Phase 4: New Frontend Routes

Create these pages:

- `frontend/src/app/issuer/page.tsx`
- `frontend/src/app/issuer/register/page.tsx`
- `frontend/src/app/employer/page.tsx`
- `frontend/src/app/talent/[address]/page.tsx`
- `frontend/src/app/opportunity/[id]/page.tsx`

### Responsibilities

#### `/issuer`
- issuer profile and status
- credentials issued
- revoke / suspend actions
- employer engagement counts

#### `/issuer/register`
- issuer onboarding flow
- submit issuer name, website, category

#### `/employer`
- search or browse candidate proofs
- shortlist verified candidates
- create and fund opportunities

#### `/talent/[address]`
- candidate passport
- all credentials
- skills earned
- active opportunities
- released payments

#### `/opportunity/[id]`
- escrow status
- milestone progression
- release / refund actions

---

## Phase 5: Component Tree

Add these components:

### Issuer
- `components/issuer/issuer-profile-card.tsx`
- `components/issuer/issuer-register-form.tsx`
- `components/issuer/issuer-approval-panel.tsx`
- `components/issuer/issuer-credential-table.tsx`

### Employer
- `components/employer/employer-candidate-search.tsx`
- `components/employer/employer-shortlist.tsx`
- `components/employer/employer-opportunity-form.tsx`

### Talent
- `components/talent/talent-passport.tsx`
- `components/talent/talent-credential-list.tsx`
- `components/talent/talent-opportunity-history.tsx`

### Opportunity
- `components/opportunity/opportunity-card.tsx`
- `components/opportunity/fund-opportunity-form.tsx`
- `components/opportunity/milestone-stepper.tsx`
- `components/opportunity/opportunity-timeline.tsx`

### Proof
- `components/proof/issuer-trust-card.tsx`
- `components/proof/credential-metadata-panel.tsx`
- `components/proof/credential-status-timeline.tsx`
- `components/proof/recruiter-cta-panel.tsx`

---

## Phase 6: Client API Surface

Extend [`frontend/src/lib/contract-client.ts`](../../frontend/src/lib/contract-client.ts):

Add functions:
- `registerIssuer`
- `approveIssuer`
- `suspendIssuer`
- `getIssuer`
- `issueCredential`
- `verifyCredential`
- `revokeCredential`
- `suspendCredential`
- `getCredential`
- `createOpportunity`
- `fundOpportunity`
- `submitMilestone`
- `approveMilestone`
- `releasePayment`
- `refundOpportunity`
- `getOpportunity`

Extend [`frontend/src/lib/contract-read-server.ts`](../../frontend/src/lib/contract-read-server.ts):
- server reads for issuer and opportunity
- shared normalization helpers

---

## Phase 7: Replace Frontend-Only Issuer Trust

Current trust list:
- [`frontend/src/lib/issuer-registry.ts`](../../frontend/src/lib/issuer-registry.ts)

Current file is useful as a temporary UX helper, but it must stop being the source of truth.

Migration path:
1. Keep static registry only as fallback labels during transition.
2. Replace trust checks with on-chain issuer reads.
3. Use static registry only for optional display enrichment.

End state:
- trusted issuer status must come from contract state
- proof page badge must reflect on-chain approval

---

## Optional Lightweight Index

This is optional for hackathon build speed but high value for UX.

### Purpose

Do not use it as a source of trust.

Use it for:
- search
- candidate passport aggregation
- rich metadata hydration
- activity feed
- analytics

### Data it can cache

- issuer records
- metadata JSON
- opportunity summaries
- proof page snapshots

### Good fit

- simple JSON store
- SQLite
- lightweight server route

Do not build a large backend if the contract and frontend work without it.

---

## File-by-File Change Map

| File | Action |
|---|---|
| `contract/src/lib.rs` | Expand contract types, storage keys, methods, events, errors |
| `contract/src/test.rs` | Add trust/opportunity tests |
| `frontend/src/lib/types.ts` | Add issuer, credential, opportunity types |
| `frontend/src/lib/contract-client.ts` | Add new write/read client methods |
| `frontend/src/lib/contract-read-server.ts` | Add server reads for issuer/opportunity |
| `frontend/src/lib/issuer-registry.ts` | Keep only as temporary display fallback |
| `frontend/src/app/app/page.tsx` | Evolve dashboard to role-specific control center |
| `frontend/src/app/proof/[hash]/page.tsx` | Upgrade proof route to rich recruiter-ready proof |
| `frontend/src/components/proof/proof-card.tsx` | Add issuer trust, skills, evidence, CTA |
| `frontend/src/app/issuer/*` | New issuer routes |
| `frontend/src/app/employer/*` | New employer routes |
| `frontend/src/app/talent/*` | New candidate passport route |
| `frontend/src/app/opportunity/*` | New opportunity routes |

---

## Recommended Build Order

### Sprint 1
- issuer registry on-chain
- role-based verification
- credential status enum
- revocation and suspension
- tests for trust layer

### Sprint 2
- richer proof route
- metadata hydration
- issuer trust card
- recruiter CTA panel
- verified PDF export

### Sprint 3
- opportunity contract methods
- employer route
- opportunity page
- fund and release flow

### Sprint 4
- candidate passport
- issuer dashboard
- optional search/index layer

---

## Hackathon Cut Line

If time becomes constrained, the minimum winning scope is:

1. on-chain issuer registry
2. credential status + revocation
3. recruiter-ready proof page
4. escrowed paid trial flow

That combination produces the strongest demo narrative with the least wasted work.

---

## Demo Script

1. Approved issuer logs in and issues credential with metadata.
2. Candidate opens public proof page.
3. Employer verifies issuer and credential status.
4. Employer clicks `Fund paid trial`.
5. Employer funds opportunity escrow.
6. Candidate completes milestone.
7. Employer approves and releases payment.
8. Proof page and opportunity timeline update.

Pitch line:

**From verified learning to verified earning.**

---

## Out of Scope

Do not prioritize these during roadmap execution:
- NFT marketplace behavior
- transferable credential NFTs
- governance token
- AMM, staking, lending, or generic DeFi primitives
- broad university SIS integration
- large backend rewrite

These features weaken focus and do not improve the core wedge.

---

## Success Criteria

The roadmap is successful when the product can demonstrate:
- trusted issuer approval
- readable, evidence-rich credential proof
- revocation visibility
- employer action after verification
- payment release tied to credential-backed opportunity

At that point, the app is no longer just a credential demo. It becomes a credential-to-opportunity product with a clear Web3 reason to exist.
