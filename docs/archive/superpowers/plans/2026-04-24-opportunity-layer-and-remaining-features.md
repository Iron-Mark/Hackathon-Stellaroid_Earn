# Opportunity Layer & Remaining Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all remaining checklist items (Phases 2-7) from the credential-to-opportunity roadmap — opportunity contract layer, proof subcomponents, employer/talent/opportunity routes, and cleanup — without breaking existing credential/certificate flows or the root README.md.

**Architecture:** Additive changes only to the contract (new enum, struct, storage keys, methods alongside existing ones). Frontend gets new types, client bindings, server reads, routes, and components. Existing function signatures, error codes 1-12, and proof page behavior remain untouched.

**Tech Stack:** Rust + soroban-sdk 22, Next.js 15 (App Router), React 19, TypeScript, Tailwind v4, @stellar/stellar-sdk, @stellar/freighter-api.

**Constraints:**
- Never modify existing contract function signatures or error codes (1-12)
- Never touch root `README.md`
- Every task must leave `cargo test` and `npm run build` passing
- New features must look polished — no placeholder/skeleton pages that could hurt credibility

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `contract/src/lib.rs` | Modify | Add OpportunityStatus, Opportunity, NextOpportunityId, opportunity methods |
| `contract/src/test.rs` | Modify | Add opportunity lifecycle tests |
| `frontend/src/lib/types.ts` | Modify | Add OpportunityStatus, OpportunityRecord types |
| `frontend/src/lib/contract-client.ts` | Modify | Add opportunity write/read bindings, new error normalization |
| `frontend/src/lib/contract-read-server.ts` | Modify | Add getOpportunityServer |
| `frontend/src/lib/errors.ts` | Modify | Add opportunity error mappings (codes 13-17) |
| `frontend/src/components/proof/issuer-trust-card.tsx` | Create | Issuer trust badge card for proof page |
| `frontend/src/components/proof/credential-status-timeline.tsx` | Create | Visual timeline of credential status events |
| `frontend/src/components/proof/recruiter-cta-panel.tsx` | Create | CTA panel for recruiters on proof page |
| `frontend/src/components/proof/proof-card.tsx` | Modify | Wire in new subcomponents |
| `frontend/src/app/employer/page.tsx` | Create | Employer search + opportunity creation |
| `frontend/src/app/talent/[address]/page.tsx` | Create | Candidate passport page |
| `frontend/src/app/opportunity/[id]/page.tsx` | Create | Opportunity detail page |
| `frontend/src/components/employer/employer-opportunity-form.tsx` | Create | Form to create+fund opportunity |
| `frontend/src/components/talent/talent-passport.tsx` | Create | Passport summary component |
| `frontend/src/components/opportunity/opportunity-card.tsx` | Create | Opportunity summary card |
| `frontend/src/components/opportunity/milestone-stepper.tsx` | Create | Milestone progress stepper |
| `frontend/src/lib/issuer-registry.ts` | Modify | Add deprecation comment, keep as display-only fallback |
| `frontend/src/components/layout/site-nav.tsx` | Modify | Add employer/talent nav links |
| `frontend/src/components/layout/site-footer.tsx` | Modify | Add opportunity-related footer links |

---

## Task 1: Add Opportunity Contract Types and Storage

**Files:**
- Modify: `contract/src/lib.rs:9-16` (DataKey enum)
- Modify: `contract/src/lib.rs:64-78` (Error enum)

- [ ] **Step 1: Add OpportunityStatus enum after CredentialStatus**

Add this after line 34 in `contract/src/lib.rs`:

```rust
#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
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
```

- [ ] **Step 2: Add Opportunity struct after Credential struct**

Add this after the `Credential` struct (after line 58):

```rust
#[contracttype]
#[derive(Clone)]
pub struct Opportunity {
    pub id: u64,
    pub employer: Address,
    pub candidate: Address,
    pub cert_hash: BytesN<32>,
    pub title: String,
    pub amount: i128,
    pub status: OpportunityStatus,
    pub milestone_count: u32,
    pub current_milestone: u32,
}
```

- [ ] **Step 3: Add DataKey variants for opportunity storage**

Add two new variants to the `DataKey` enum:

```rust
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    Issuer(Address),
    Cert(BytesN<32>),
    NextOpportunityId,
    Opportunity(u64),
}
```

- [ ] **Step 4: Add opportunity error variants**

Add after `CredentialExpired = 12`:

```rust
    OpportunityNotFound = 13,
    AlreadyFunded = 14,
    InvalidMilestone = 15,
    InvalidOpportunityStatus = 16,
    PaymentLocked = 17,
```

- [ ] **Step 5: Verify contract compiles**

Run: `cd contract && cargo check`
Expected: compiles with no errors

- [ ] **Step 6: Commit**

```bash
git add contract/src/lib.rs
git commit -m "feat(contract): add opportunity types, storage keys, and error variants"
```

---

## Task 2: Add Opportunity Contract Methods

**Files:**
- Modify: `contract/src/lib.rs` (inside `impl StellaroidEarn`)

- [ ] **Step 1: Add next_opportunity_id helper function**

Add this helper after `status_error` at the bottom of the file (before `#[cfg(test)]`):

```rust
fn next_opportunity_id(env: &Env) -> u64 {
    let key = DataKey::NextOpportunityId;
    let id: u64 = env.storage().instance().get(&key).unwrap_or(0);
    env.storage().instance().set(&key, &(id + 1));
    id
}
```

- [ ] **Step 2: Add create_opportunity method**

Add inside `impl StellaroidEarn`, after `get_certificate`:

```rust
    /// Employer creates a paid trial opportunity linked to a verified credential.
    /// The opportunity starts in Draft status — employer must fund it next.
    pub fn create_opportunity(
        env: Env,
        employer: Address,
        candidate: Address,
        cert_hash: BytesN<32>,
        title: String,
        amount: i128,
        milestone_count: u32,
    ) -> Result<u64, Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        employer.require_auth();

        let cert = load_credential(&env, &cert_hash)?;
        ensure_not_expired(&env, &cert)?;
        if cert.owner != candidate {
            return Err(Error::Unauthorized);
        }
        match cert.status {
            CredentialStatus::Verified => {}
            CredentialStatus::Revoked => return Err(Error::CredentialRevoked),
            CredentialStatus::Expired => return Err(Error::CredentialExpired),
            _ => return Err(Error::InvalidStatus),
        }

        let id = next_opportunity_id(&env);
        let opp = Opportunity {
            id,
            employer: employer.clone(),
            candidate,
            cert_hash,
            title,
            amount,
            status: OpportunityStatus::Draft,
            milestone_count: if milestone_count == 0 { 1 } else { milestone_count },
            current_milestone: 0,
        };
        let key = DataKey::Opportunity(id);
        env.storage().persistent().set(&key, &opp);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        env.events()
            .publish((symbol_short!("opp_crt"), employer), id);
        Ok(id)
    }
```

- [ ] **Step 3: Add fund_opportunity method**

```rust
    /// Employer funds the opportunity by transferring the escrowed amount to the contract.
    pub fn fund_opportunity(env: Env, employer: Address, opp_id: u64) -> Result<(), Error> {
        employer.require_auth();

        let key = DataKey::Opportunity(opp_id);
        let mut opp: Opportunity = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::OpportunityNotFound)?;
        if opp.employer != employer {
            return Err(Error::Unauthorized);
        }
        if opp.status != OpportunityStatus::Draft {
            return Err(Error::AlreadyFunded);
        }

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)?;
        token::Client::new(&env, &token_addr).transfer(
            &employer,
            &env.current_contract_address(),
            &opp.amount,
        );

        opp.status = OpportunityStatus::Funded;
        env.storage().persistent().set(&key, &opp);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        env.events()
            .publish((symbol_short!("opp_fund"), employer), opp_id);
        Ok(())
    }
```

- [ ] **Step 4: Add submit_milestone method**

```rust
    /// Candidate marks the current milestone as submitted for employer review.
    pub fn submit_milestone(env: Env, candidate: Address, opp_id: u64) -> Result<(), Error> {
        candidate.require_auth();

        let key = DataKey::Opportunity(opp_id);
        let mut opp: Opportunity = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::OpportunityNotFound)?;
        if opp.candidate != candidate {
            return Err(Error::Unauthorized);
        }
        match opp.status {
            OpportunityStatus::Funded | OpportunityStatus::InProgress => {}
            _ => return Err(Error::InvalidOpportunityStatus),
        }

        opp.status = OpportunityStatus::Submitted;
        env.storage().persistent().set(&key, &opp);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        env.events()
            .publish((symbol_short!("mile_sub"), candidate), opp_id);
        Ok(())
    }
```

- [ ] **Step 5: Add approve_milestone method**

```rust
    /// Employer approves the current milestone. If all milestones are done,
    /// the opportunity moves to Approved (ready for release).
    pub fn approve_milestone(env: Env, employer: Address, opp_id: u64) -> Result<(), Error> {
        employer.require_auth();

        let key = DataKey::Opportunity(opp_id);
        let mut opp: Opportunity = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::OpportunityNotFound)?;
        if opp.employer != employer {
            return Err(Error::Unauthorized);
        }
        if opp.status != OpportunityStatus::Submitted {
            return Err(Error::InvalidOpportunityStatus);
        }

        opp.current_milestone += 1;
        if opp.current_milestone >= opp.milestone_count {
            opp.status = OpportunityStatus::Approved;
        } else {
            opp.status = OpportunityStatus::InProgress;
        }
        env.storage().persistent().set(&key, &opp);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        env.events()
            .publish((symbol_short!("mile_apr"), employer), opp_id);
        Ok(())
    }
```

- [ ] **Step 6: Add release_payment method**

```rust
    /// Employer releases the escrowed funds to the candidate after final approval.
    pub fn release_payment(env: Env, employer: Address, opp_id: u64) -> Result<(), Error> {
        employer.require_auth();

        let key = DataKey::Opportunity(opp_id);
        let mut opp: Opportunity = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::OpportunityNotFound)?;
        if opp.employer != employer {
            return Err(Error::Unauthorized);
        }
        if opp.status != OpportunityStatus::Approved {
            return Err(Error::InvalidOpportunityStatus);
        }

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)?;
        token::Client::new(&env, &token_addr).transfer(
            &env.current_contract_address(),
            &opp.candidate,
            &opp.amount,
        );

        opp.status = OpportunityStatus::Released;
        env.storage().persistent().set(&key, &opp);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        env.events().publish(
            (symbol_short!("pay_rel"), employer),
            opp_id,
        );
        Ok(())
    }
```

- [ ] **Step 7: Add refund_opportunity method**

```rust
    /// Employer reclaims escrowed funds. Only allowed from Funded or InProgress status.
    pub fn refund_opportunity(env: Env, employer: Address, opp_id: u64) -> Result<(), Error> {
        employer.require_auth();

        let key = DataKey::Opportunity(opp_id);
        let mut opp: Opportunity = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::OpportunityNotFound)?;
        if opp.employer != employer {
            return Err(Error::Unauthorized);
        }
        match opp.status {
            OpportunityStatus::Funded | OpportunityStatus::InProgress => {}
            _ => return Err(Error::InvalidOpportunityStatus),
        }

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)?;
        token::Client::new(&env, &token_addr).transfer(
            &env.current_contract_address(),
            &opp.employer,
            &opp.amount,
        );

        opp.status = OpportunityStatus::Refunded;
        env.storage().persistent().set(&key, &opp);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND);
        env.events().publish(
            (symbol_short!("pay_ref"), employer),
            opp_id,
        );
        Ok(())
    }
```

- [ ] **Step 8: Add get_opportunity method**

```rust
    pub fn get_opportunity(env: Env, opp_id: u64) -> Option<Opportunity> {
        env.storage()
            .persistent()
            .get(&DataKey::Opportunity(opp_id))
    }
```

- [ ] **Step 9: Verify contract compiles**

Run: `cd contract && cargo check`
Expected: compiles with no errors

- [ ] **Step 10: Commit**

```bash
git add contract/src/lib.rs
git commit -m "feat(contract): add opportunity lifecycle methods (create/fund/submit/approve/release/refund)"
```

---

## Task 3: Add Opportunity Contract Tests

**Files:**
- Modify: `contract/src/test.rs`

- [ ] **Step 1: Add opportunity test helpers to test.rs**

Add after the `register_certificate` helper function (after line 70):

```rust
fn create_and_fund_opportunity(
    ctx: &Ctx<'_>,
    employer: &Address,
    candidate: &Address,
    hash: &BytesN<32>,
    amount: i128,
) -> u64 {
    let opp_id = ctx.client.create_opportunity(
        employer,
        candidate,
        hash,
        &text(&ctx.env, "Paid trial"),
        &amount,
        &2, // 2 milestones
    );
    ctx.token_admin.mint(employer, &amount);
    ctx.client.fund_opportunity(employer, &opp_id);
    opp_id
}
```

- [ ] **Step 2: Add T7 — happy path opportunity lifecycle test**

```rust
// T7 — Full opportunity lifecycle: create → fund → submit → approve → release.
#[test]
fn t7_opportunity_happy_path() {
    let ctx = setup();
    ctx.env.mock_all_auths();
    ctx.client.init(&ctx.admin, &ctx.token_addr);

    let issuer = Address::generate(&ctx.env);
    let student = Address::generate(&ctx.env);
    let employer = Address::generate(&ctx.env);
    let hash = BytesN::from_array(&ctx.env, &[7u8; 32]);

    register_issuer(&ctx, &issuer);
    approve_issuer(&ctx, &issuer);
    register_certificate(&ctx, &issuer, &student, &hash);
    ctx.client.verify_certificate(&issuer, &hash);

    let opp_id = create_and_fund_opportunity(&ctx, &employer, &student, &hash, 1_000);

    let opp = ctx.client.get_opportunity(&opp_id).unwrap();
    assert_eq!(opp.status, OpportunityStatus::Funded);
    assert_eq!(opp.amount, 1_000);

    // Milestone 1: submit + approve
    ctx.client.submit_milestone(&student, &opp_id);
    ctx.client.approve_milestone(&employer, &opp_id);
    let opp = ctx.client.get_opportunity(&opp_id).unwrap();
    assert_eq!(opp.status, OpportunityStatus::InProgress);
    assert_eq!(opp.current_milestone, 1);

    // Milestone 2 (final): submit + approve
    ctx.client.submit_milestone(&student, &opp_id);
    ctx.client.approve_milestone(&employer, &opp_id);
    let opp = ctx.client.get_opportunity(&opp_id).unwrap();
    assert_eq!(opp.status, OpportunityStatus::Approved);

    // Release payment
    ctx.client.release_payment(&employer, &opp_id);
    let opp = ctx.client.get_opportunity(&opp_id).unwrap();
    assert_eq!(opp.status, OpportunityStatus::Released);

    let balance = token::Client::new(&ctx.env, &ctx.token_addr).balance(&student);
    assert_eq!(balance, 1_000);
}
```

- [ ] **Step 3: Add T8 — revoked credential cannot create opportunity**

```rust
// T8 — Revoked credential cannot be used to create an opportunity.
#[test]
fn t8_revoked_credential_blocks_opportunity() {
    let ctx = setup();
    ctx.env.mock_all_auths();
    ctx.client.init(&ctx.admin, &ctx.token_addr);

    let issuer = Address::generate(&ctx.env);
    let student = Address::generate(&ctx.env);
    let employer = Address::generate(&ctx.env);
    let hash = BytesN::from_array(&ctx.env, &[8u8; 32]);

    register_issuer(&ctx, &issuer);
    approve_issuer(&ctx, &issuer);
    register_certificate(&ctx, &issuer, &student, &hash);
    ctx.client.verify_certificate(&issuer, &hash);
    ctx.client.revoke_certificate(&issuer, &hash);

    let err = ctx
        .client
        .try_create_opportunity(
            &employer,
            &student,
            &hash,
            &text(&ctx.env, "Paid trial"),
            &1_000,
            &1,
        )
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::CredentialRevoked);
}
```

- [ ] **Step 4: Add T9 — refund path**

```rust
// T9 — Employer can refund a funded opportunity.
#[test]
fn t9_refund_funded_opportunity() {
    let ctx = setup();
    ctx.env.mock_all_auths();
    ctx.client.init(&ctx.admin, &ctx.token_addr);

    let issuer = Address::generate(&ctx.env);
    let student = Address::generate(&ctx.env);
    let employer = Address::generate(&ctx.env);
    let hash = BytesN::from_array(&ctx.env, &[9u8; 32]);

    register_issuer(&ctx, &issuer);
    approve_issuer(&ctx, &issuer);
    register_certificate(&ctx, &issuer, &student, &hash);
    ctx.client.verify_certificate(&issuer, &hash);

    let opp_id = create_and_fund_opportunity(&ctx, &employer, &student, &hash, 500);

    ctx.client.refund_opportunity(&employer, &opp_id);
    let opp = ctx.client.get_opportunity(&opp_id).unwrap();
    assert_eq!(opp.status, OpportunityStatus::Refunded);

    let employer_balance = token::Client::new(&ctx.env, &ctx.token_addr).balance(&employer);
    assert_eq!(employer_balance, 500);
}
```

- [ ] **Step 5: Add T10 — invalid status transitions fail**

```rust
// T10 — Cannot release payment from non-Approved status.
#[test]
fn t10_invalid_status_transitions_fail() {
    let ctx = setup();
    ctx.env.mock_all_auths();
    ctx.client.init(&ctx.admin, &ctx.token_addr);

    let issuer = Address::generate(&ctx.env);
    let student = Address::generate(&ctx.env);
    let employer = Address::generate(&ctx.env);
    let hash = BytesN::from_array(&ctx.env, &[10u8; 32]);

    register_issuer(&ctx, &issuer);
    approve_issuer(&ctx, &issuer);
    register_certificate(&ctx, &issuer, &student, &hash);
    ctx.client.verify_certificate(&issuer, &hash);

    let opp_id = create_and_fund_opportunity(&ctx, &employer, &student, &hash, 300);

    // Cannot release directly from Funded (skipping milestones)
    let err = ctx
        .client
        .try_release_payment(&employer, &opp_id)
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::InvalidOpportunityStatus);

    // Cannot refund after approval
    ctx.client.submit_milestone(&student, &opp_id);
    ctx.client.approve_milestone(&employer, &opp_id);
    ctx.client.submit_milestone(&student, &opp_id);
    ctx.client.approve_milestone(&employer, &opp_id);

    let err = ctx
        .client
        .try_refund_opportunity(&employer, &opp_id)
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::InvalidOpportunityStatus);
}
```

- [ ] **Step 6: Run all tests**

Run: `cd contract && cargo test`
Expected: 10/10 tests pass (T1-T10)

- [ ] **Step 7: Commit**

```bash
git add contract/src/test.rs
git commit -m "test(contract): add opportunity lifecycle tests (T7-T10)"
```

---

## Task 4: Add Frontend Opportunity Types and Error Mappings

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/errors.ts`

- [ ] **Step 1: Add OpportunityStatus and OpportunityRecord to types.ts**

Add after `ProofMetadata` type:

```typescript
export type OpportunityStatus =
  | "draft"
  | "funded"
  | "in_progress"
  | "submitted"
  | "approved"
  | "released"
  | "refunded"
  | "cancelled";

export type OpportunityRecord = {
  id: number;
  employer: string;
  candidate: string;
  certHash: string;
  title: string;
  amount: bigint;
  status: OpportunityStatus;
  milestoneCount: number;
  currentMilestone: number;
};
```

- [ ] **Step 2: Add opportunity error mappings to errors.ts**

Add before the `// Fallback` comment in `humanizeError`:

```typescript
    if (
      message.includes("opportunity not found") ||
      message.includes("#13")
    ) {
      return {
        title: "Opportunity not found",
        detail:
          "No opportunity exists with that ID. It may not have been created yet.",
        recoverable: true,
      };
    }

    if (message.includes("already funded") || message.includes("#14")) {
      return {
        title: "Already funded",
        detail:
          "This opportunity has already been funded. You cannot fund it again.",
        recoverable: false,
      };
    }

    if (message.includes("invalid milestone") || message.includes("#15")) {
      return {
        title: "Invalid milestone",
        detail:
          "The milestone action is not valid for the current state of this opportunity.",
        recoverable: true,
      };
    }

    if (
      message.includes("invalid opportunity") ||
      message.includes("invalidopportunitystatus") ||
      message.includes("#16")
    ) {
      return {
        title: "Invalid opportunity state",
        detail:
          "That action is blocked by the opportunity's current status. Refresh and try again.",
        recoverable: true,
      };
    }

    if (message.includes("payment locked") || message.includes("#17")) {
      return {
        title: "Payment locked",
        detail:
          "Funds are locked in escrow and cannot be moved until the opportunity status allows it.",
        recoverable: false,
      };
    }
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: build succeeds

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/types.ts frontend/src/lib/errors.ts
git commit -m "feat(frontend): add opportunity types and error mappings"
```

---

## Task 5: Add Frontend Opportunity Client Bindings

**Files:**
- Modify: `frontend/src/lib/contract-client.ts`
- Modify: `frontend/src/lib/contract-read-server.ts`

- [ ] **Step 1: Add opportunity normalization to contract-client.ts**

Add after `normalizeCertificate` function:

```typescript
function normalizeOpportunityStatus(value: unknown): OpportunityStatus {
  const key = normalizeStatusKey(value);
  switch (key) {
    case "draft":
    case "0":
      return "draft";
    case "funded":
    case "1":
      return "funded";
    case "inprogress":
    case "in_progress":
    case "2":
      return "in_progress";
    case "submitted":
    case "3":
      return "submitted";
    case "approved":
    case "4":
      return "approved";
    case "released":
    case "5":
      return "released";
    case "refunded":
    case "6":
      return "refunded";
    case "cancelled":
    case "7":
      return "cancelled";
    default:
      return "draft";
  }
}

function normalizeOpportunity(value: unknown): OpportunityRecord | null {
  if (value == null) return null;
  const record = value as Record<string, unknown>;
  return {
    id: Number(normalizeBigInt(record.id)),
    employer: normalizeAddress(record.employer),
    candidate: normalizeAddress(record.candidate),
    certHash: normalizeString(record.cert_hash),
    title: normalizeString(record.title),
    amount: normalizeBigInt(record.amount),
    status: normalizeOpportunityStatus(record.status),
    milestoneCount: Number(normalizeBigInt(record.milestone_count)),
    currentMilestone: Number(normalizeBigInt(record.current_milestone)),
  };
}
```

Also add `OpportunityStatus` and `OpportunityRecord` to the imports from `@/lib/types`:

```typescript
import type {
  CertificateStatus,
  IssuerRecord,
  IssuerStatus,
  OpportunityRecord,
  OpportunityStatus,
} from "@/lib/types";
```

- [ ] **Step 2: Add opportunity write bindings to contract-client.ts**

Add after `linkPayment`:

```typescript
export async function createOpportunity(
  employer: string,
  candidate: string,
  certHashHex: string,
  title: string,
  amount: bigint,
  milestoneCount: number,
) {
  return signAndSubmit(
    employer,
    "create_opportunity",
    buildArgs([
      { value: employer, type: "address" },
      { value: candidate, type: "address" },
      { value: hexToBytes32(certHashHex), type: "bytes32" },
      { value: title, type: "string" },
      { value: amount, type: "i128" },
      { value: milestoneCount, type: "u32" },
    ]),
    (v) => Number(normalizeBigInt(v)),
  );
}

export async function fundOpportunity(employer: string, oppId: number) {
  return signAndSubmit(
    employer,
    "fund_opportunity",
    buildArgs([
      { value: employer, type: "address" },
      { value: BigInt(oppId), type: "u32" },
    ]),
  );
}

export async function submitMilestone(candidate: string, oppId: number) {
  return signAndSubmit(
    candidate,
    "submit_milestone",
    buildArgs([
      { value: candidate, type: "address" },
      { value: BigInt(oppId), type: "u32" },
    ]),
  );
}

export async function approveMilestone(employer: string, oppId: number) {
  return signAndSubmit(
    employer,
    "approve_milestone",
    buildArgs([
      { value: employer, type: "address" },
      { value: BigInt(oppId), type: "u32" },
    ]),
  );
}

export async function releasePayment(employer: string, oppId: number) {
  return signAndSubmit(
    employer,
    "release_payment",
    buildArgs([
      { value: employer, type: "address" },
      { value: BigInt(oppId), type: "u32" },
    ]),
  );
}

export async function refundOpportunity(employer: string, oppId: number) {
  return signAndSubmit(
    employer,
    "refund_opportunity",
    buildArgs([
      { value: employer, type: "address" },
      { value: BigInt(oppId), type: "u32" },
    ]),
  );
}

export async function getOpportunity(oppId: number) {
  return simulateRead(
    getReadAddress(),
    "get_opportunity",
    buildArgs([{ value: BigInt(oppId), type: "u32" }]),
    normalizeOpportunity,
  );
}
```

- [ ] **Step 3: Add getOpportunityServer to contract-read-server.ts**

Add after `getIssuerServer`:

```typescript
function normalizeOpportunityStatus(value: unknown): OpportunityStatus {
  const key = normalizeStatusKey(value);
  switch (key) {
    case "funded": case "1": return "funded";
    case "inprogress": case "in_progress": case "2": return "in_progress";
    case "submitted": case "3": return "submitted";
    case "approved": case "4": return "approved";
    case "released": case "5": return "released";
    case "refunded": case "6": return "refunded";
    case "cancelled": case "7": return "cancelled";
    case "draft": case "0": default: return "draft";
  }
}

function normalizeOpportunity(value: unknown): OpportunityRecord | null {
  if (value == null) return null;
  const record = value as Record<string, unknown>;
  return {
    id: normalizeTimestamp(record.id),
    employer: normalizeAddress(record.employer),
    candidate: normalizeAddress(record.candidate),
    certHash: normalizeString(record.cert_hash),
    title: normalizeString(record.title),
    amount: BigInt(normalizeTimestamp(record.amount)),
    status: normalizeOpportunityStatus(record.status),
    milestoneCount: normalizeTimestamp(record.milestone_count),
    currentMilestone: normalizeTimestamp(record.current_milestone),
  };
}

export async function getOpportunityServer(oppId: number) {
  ensureConfigured();
  const server = getServer();
  const sourceAccount = new Account(getSimulationSourceAddress(), "0");
  const args = [nativeToScVal(oppId, { type: "u32" })];

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: getExpectedNetworkPassphrase(),
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: appConfig.contractId,
        function: "get_opportunity",
        args,
      }),
    )
    .setTimeout(30)
    .build();

  try {
    const simulation = await server.simulateTransaction(transaction);

    if (rpc.Api.isSimulationError(simulation)) {
      throw new Error(simulation.error);
    }
    if (!simulation.result?.retval) {
      throw new Error("Simulation for get_opportunity returned no value.");
    }

    return normalizeOpportunity(scValToNative(simulation.result.retval));
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (!/Bad union switch/i.test(message)) {
      throw e;
    }

    const rawSimulation = await server._simulateTransaction(transaction);
    if (rawSimulation.error) {
      throw new Error(rawSimulation.error);
    }

    const rawResultXdr = rawSimulation.results?.[0]?.xdr;
    if (!rawResultXdr) {
      throw new Error("Simulation for get_opportunity returned no value.");
    }

    const rawScVal = xdr.ScVal.fromXDR(rawResultXdr, "base64");
    return normalizeOpportunity(scValToNative(rawScVal));
  }
}
```

Also add `OpportunityStatus` and `OpportunityRecord` to the imports from `@/lib/types`:

```typescript
import type {
  CertificateStatus,
  IssuerRecord,
  IssuerStatus,
  OpportunityRecord,
  OpportunityStatus,
} from "@/lib/types";
```

- [ ] **Step 4: Add normalizeError entries in contract-client.ts**

Add before `return message;` in `normalizeError`:

```typescript
  if (/#13\b|OpportunityNotFound/i.test(message))
    return "No opportunity found for that ID.";
  if (/#14\b|AlreadyFunded/i.test(message))
    return "This opportunity has already been funded.";
  if (/#15\b|InvalidMilestone/i.test(message))
    return "Invalid milestone action for the current state.";
  if (/#16\b|InvalidOpportunityStatus/i.test(message))
    return "This action is not allowed in the opportunity's current status.";
  if (/#17\b|PaymentLocked/i.test(message))
    return "Payment is locked in escrow.";
```

- [ ] **Step 5: Verify build**

Run: `cd frontend && npm run build`
Expected: build succeeds

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/contract-client.ts frontend/src/lib/contract-read-server.ts
git commit -m "feat(frontend): add opportunity client bindings and server reads"
```

---

## Task 6: Add Proof Subcomponents

**Files:**
- Create: `frontend/src/components/proof/issuer-trust-card.tsx`
- Create: `frontend/src/components/proof/credential-status-timeline.tsx`
- Create: `frontend/src/components/proof/recruiter-cta-panel.tsx`
- Modify: `frontend/src/components/proof/proof-card.tsx`

- [ ] **Step 1: Create issuer-trust-card.tsx**

```tsx
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { shortenAddress } from "@/lib/format";
import type { IssuerRecord } from "@/lib/types";

interface IssuerTrustCardProps {
  issuer: IssuerRecord;
}

function statusTone(status: IssuerRecord["status"]): "success" | "warning" | "danger" {
  switch (status) {
    case "approved":
      return "success";
    case "suspended":
      return "danger";
    case "pending":
    default:
      return "warning";
  }
}

export function IssuerTrustCard({ issuer }: IssuerTrustCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-pixel text-xs font-medium text-text-muted uppercase tracking-wider">
          Issuer trust
        </span>
        <Badge tone={statusTone(issuer.status)} dot>
          {issuer.status}
        </Badge>
      </div>
      <p className="text-sm font-semibold text-text">
        {issuer.name || "Unnamed issuer"}
      </p>
      {issuer.website ? (
        <a
          href={issuer.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.8125rem] text-accent no-underline hover:underline inline-flex items-center gap-1"
        >
          {issuer.website.replace(/^https?:\/\//, "")}
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : null}
      <div className="flex items-center gap-2 text-[0.8125rem] text-text-muted">
        <code className="font-mono text-text bg-bg border border-border rounded px-1.5 py-0.5 text-xs">
          {shortenAddress(issuer.address, 6)}
        </code>
        <CopyButton value={issuer.address} ariaLabel="Copy issuer address" />
        <Badge tone="accent">{issuer.category || "uncategorized"}</Badge>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create credential-status-timeline.tsx**

```tsx
import type { CertificateStatus } from "@/lib/types";

interface StatusEvent {
  label: string;
  timestamp: number;
  active: boolean;
}

interface CredentialStatusTimelineProps {
  status: CertificateStatus;
  issuedAt: number;
  verifiedAt: number;
  expiresAt: number;
}

function formatTimestamp(ts: number): string {
  if (!ts) return "—";
  try {
    return new Date(ts * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function CredentialStatusTimeline({
  status,
  issuedAt,
  verifiedAt,
  expiresAt,
}: CredentialStatusTimelineProps) {
  const events: StatusEvent[] = [
    { label: "Issued", timestamp: issuedAt, active: true },
    { label: "Verified", timestamp: verifiedAt, active: status === "verified" },
  ];

  if (expiresAt) {
    events.push({
      label: "Expires",
      timestamp: expiresAt,
      active: status === "expired",
    });
  }

  if (status === "revoked") {
    events.push({ label: "Revoked", timestamp: 0, active: true });
  }
  if (status === "suspended") {
    events.push({ label: "Suspended", timestamp: 0, active: true });
  }

  return (
    <div className="flex flex-col gap-0">
      <span className="font-pixel text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
        Status timeline
      </span>
      <ol className="flex flex-col gap-0 relative ml-2">
        {events.map((event, i) => (
          <li key={event.label} className="flex items-start gap-3 pb-3 last:pb-0">
            <div className="relative flex flex-col items-center">
              <div
                className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 ${
                  event.active
                    ? event.label === "Revoked" || event.label === "Suspended"
                      ? "border-danger bg-danger"
                      : "border-success bg-success"
                    : "border-border bg-surface-2"
                }`}
              />
              {i < events.length - 1 ? (
                <div className="w-px flex-1 min-h-4 bg-border" />
              ) : null}
            </div>
            <div className="flex items-baseline gap-2 -mt-0.5">
              <span className="text-sm font-medium text-text">{event.label}</span>
              <span className="text-xs text-text-muted">
                {formatTimestamp(event.timestamp)}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 3: Create recruiter-cta-panel.tsx**

```tsx
"use client";

import Link from "next/link";
import { CopyButton } from "@/components/ui/copy-button";

interface RecruiterCtaPanelProps {
  hash: string;
  candidateAddress?: string;
}

export function RecruiterCtaPanel({ hash, candidateAddress }: RecruiterCtaPanelProps) {
  const proofUrl = `https://stellaroid-earn-demo.vercel.app/proof/${hash}`;

  return (
    <section
      className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-4 flex flex-col gap-3"
      aria-label="Recruiter actions"
    >
      <span className="font-pixel text-xs font-medium text-primary uppercase tracking-wider">
        Recruiter actions
      </span>
      <div className="flex gap-3 flex-wrap">
        <Link
          href="/employer"
          className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-on-primary font-semibold text-sm no-underline hover:bg-primary-hover transition-colors"
        >
          Fund paid trial
        </Link>
        <CopyButton value={proofUrl} label="Copy proof link" ariaLabel="Copy proof link" />
      </div>
      {candidateAddress ? (
        <Link
          href={`/talent/${candidateAddress}`}
          className="text-[0.8125rem] text-accent no-underline hover:underline"
        >
          View candidate passport →
        </Link>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 4: Wire subcomponents into proof-card.tsx**

Add imports at the top of `proof-card.tsx`:

```tsx
import { IssuerTrustCard } from "./issuer-trust-card";
import { CredentialStatusTimeline } from "./credential-status-timeline";
import { RecruiterCtaPanel } from "./recruiter-cta-panel";
```

After the issuer state display section (after the `{issuerState ? ...}` block around line 217), add:

```tsx
            {issuer && issuer.status !== "pending" ? (
              <IssuerTrustCard issuer={issuer} />
            ) : null}
```

Before the "How to verify" section (before `{/* ③ How to verify */}`), add:

```tsx
        {cert ? (
          <div className="grid gap-4 sm:grid-cols-2 border-t border-border pt-4">
            <CredentialStatusTimeline
              status={cert.status}
              issuedAt={cert.issuedAt}
              verifiedAt={cert.verifiedAt}
              expiresAt={cert.expiresAt}
            />
            {cert.status === "verified" ? (
              <RecruiterCtaPanel hash={hash} candidateAddress={cert.owner} />
            ) : null}
          </div>
        ) : null}
```

- [ ] **Step 5: Verify build**

Run: `cd frontend && npm run build`
Expected: build succeeds

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/proof/
git commit -m "feat(frontend): add issuer trust card, status timeline, and recruiter CTA to proof page"
```

---

## Task 7: Add Employer Route and Components

**Files:**
- Create: `frontend/src/app/employer/page.tsx`
- Create: `frontend/src/components/employer/employer-opportunity-form.tsx`

- [ ] **Step 1: Create employer-opportunity-form.tsx**

```tsx
"use client";

import { useState } from "react";
import { Button, Input, useToast } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { appConfig, hasRequiredConfig } from "@/lib/config";
import {
  getCertificate,
  createOpportunity,
  fundOpportunity,
} from "@/lib/contract-client";
import type { CertificateRecord } from "@/lib/contract-client";
import { humanizeError } from "@/lib/errors";
import { withTimeout } from "@/lib/with-timeout";
import { ExternalLink, Loader2 } from "lucide-react";

export function EmployerOpportunityForm() {
  const { wallet } = useFreighterWallet();
  const { toast } = useToast();

  const [certHash, setCertHash] = useState("");
  const [cert, setCert] = useState<CertificateRecord | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [milestones, setMilestones] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [createdOppId, setCreatedOppId] = useState<number | null>(null);
  const [funding, setFunding] = useState(false);

  const walletConnected =
    wallet.status === "connected" && !!wallet.address && wallet.isExpectedNetwork;

  async function handleLookup() {
    if (!certHash.trim()) return;
    setLookupBusy(true);
    setCert(null);
    try {
      const record = await getCertificate(certHash.trim());
      setCert(record);
      if (!record) {
        toast({
          title: "Not found",
          detail: "No certificate on-chain for that hash.",
          tone: "warning",
        });
      }
    } catch (e) {
      const h = humanizeError(e);
      toast({ title: h.title, detail: h.detail, tone: "danger" });
    } finally {
      setLookupBusy(false);
    }
  }

  async function handleCreate() {
    if (!wallet.address || !cert) return;
    setSubmitting(true);
    try {
      const result = await withTimeout(
        createOpportunity(
          wallet.address,
          cert.owner,
          certHash.trim(),
          title.trim() || "Paid trial",
          BigInt(Math.round(parseFloat(amount) * 1e7)),
          parseInt(milestones) || 1,
        ),
        15000,
        "create opportunity",
      );
      const oppId = result?.result as number | undefined;
      if (oppId !== undefined) {
        setCreatedOppId(oppId);
      }
      toast({
        title: "Opportunity created",
        detail: `Opportunity ${oppId ?? ""} is in Draft status. Fund it next to start the escrow.`,
        tone: "success",
        action: result?.hash
          ? {
              label: <>View tx <ExternalLink className="inline w-3 h-3 ml-1" /></>,
              href: `${appConfig.explorerUrl}/tx/${result.hash}`,
            }
          : undefined,
      });
    } catch (e) {
      const h = humanizeError(e);
      toast({ title: h.title, detail: h.detail, tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFund() {
    if (!wallet.address || createdOppId === null) return;
    setFunding(true);
    try {
      const result = await withTimeout(
        fundOpportunity(wallet.address, createdOppId),
        15000,
        "fund opportunity",
      );
      toast({
        title: "Opportunity funded",
        detail: "Escrow is live. The candidate can now begin work.",
        tone: "success",
        action: result?.hash
          ? {
              label: <>View tx <ExternalLink className="inline w-3 h-3 ml-1" /></>,
              href: `${appConfig.explorerUrl}/tx/${result.hash}`,
            }
          : undefined,
      });
    } catch (e) {
      const h = humanizeError(e);
      toast({ title: h.title, detail: h.detail, tone: "danger" });
    } finally {
      setFunding(false);
    }
  }

  const parsedAmount = parseFloat(amount);
  const canCreate =
    hasRequiredConfig() &&
    walletConnected &&
    cert &&
    cert.status === "verified" &&
    !submitting &&
    parsedAmount > 0;

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-border bg-surface p-5 flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-text">Look up credential</h2>
        <div className="flex gap-3 items-end">
          <Input
            label="Certificate hash"
            value={certHash}
            onChange={(e) => {
              setCertHash(e.target.value);
              setCert(null);
              setCreatedOppId(null);
            }}
            placeholder="64 hex characters"
            mono
            className="flex-1"
          />
          <Button
            variant="secondary"
            onClick={() => void handleLookup()}
            loading={lookupBusy}
            disabled={!certHash.trim()}
          >
            Look up
          </Button>
        </div>

        {cert ? (
          <div className="rounded-xl border border-border bg-bg px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm font-semibold text-text">
                {cert.title || "Untitled credential"}
              </span>
              <Badge
                tone={cert.status === "verified" ? "success" : "warning"}
                dot
              >
                {cert.status}
              </Badge>
            </div>
            <span className="text-xs text-text-muted font-mono">
              Owner: {cert.owner}
            </span>
          </div>
        ) : null}
      </section>

      {cert && cert.status === "verified" ? (
        <section className="rounded-2xl border border-border bg-surface p-5 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-text">Create paid trial</h2>
          <Input
            label="Opportunity title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., 2-week frontend trial"
          />
          <Input
            label={`Amount (${appConfig.assetCode})`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 100"
            helper="Funds will be held in escrow until you release them."
          />
          <Input
            label="Number of milestones"
            value={milestones}
            onChange={(e) => setMilestones(e.target.value)}
            placeholder="1"
            helper="Candidate submits each milestone for your approval before release."
          />
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="primary"
              onClick={() => void handleCreate()}
              loading={submitting}
              disabled={!canCreate}
            >
              Create opportunity
            </Button>
            {createdOppId !== null ? (
              <Button
                variant="primary"
                onClick={() => void handleFund()}
                loading={funding}
              >
                Fund escrow
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Create employer/page.tsx**

```tsx
import { FreighterWalletProvider } from "@/hooks/use-freighter-wallet";
import { AppShell } from "@/components/layout/app-shell";
import { RpcStatusPill } from "@/components/layout/rpc-status-pill";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";
import { EmployerOpportunityForm } from "@/components/employer/employer-opportunity-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employer · Stellaroid Earn",
  description:
    "Create and fund escrowed paid trials for verified candidates on Stellar testnet.",
};

export default function EmployerPage() {
  return (
    <FreighterWalletProvider>
      <AppShell
        rpcPill={<RpcStatusPill />}
        walletButton={<WalletConnectButton />}
      >
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
              Employer console
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-text">
              Fund a paid trial
            </h1>
            <p className="mt-2 max-w-[720px] text-sm text-text-muted">
              Look up a verified credential, then create an escrowed opportunity.
              Funds are locked until you approve the candidate&apos;s milestones and release payment.
            </p>
          </section>
          <EmployerOpportunityForm />
        </div>
      </AppShell>
    </FreighterWalletProvider>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: build succeeds with new `/employer` route

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/employer/ frontend/src/components/employer/
git commit -m "feat(frontend): add employer route with credential lookup and opportunity creation"
```

---

## Task 8: Add Opportunity Detail Route

**Files:**
- Create: `frontend/src/app/opportunity/[id]/page.tsx`
- Create: `frontend/src/components/opportunity/opportunity-card.tsx`
- Create: `frontend/src/components/opportunity/milestone-stepper.tsx`

- [ ] **Step 1: Create milestone-stepper.tsx**

```tsx
interface MilestoneStepperProps {
  milestoneCount: number;
  currentMilestone: number;
  status: string;
}

export function MilestoneStepper({
  milestoneCount,
  currentMilestone,
  status,
}: MilestoneStepperProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-pixel text-xs font-medium text-text-muted uppercase tracking-wider">
        Milestone progress
      </span>
      <div className="flex gap-2 items-center flex-wrap">
        {Array.from({ length: milestoneCount }, (_, i) => {
          const done = i < currentMilestone;
          const current = i === currentMilestone && status !== "released" && status !== "refunded";
          return (
            <div
              key={i}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold border-2 transition-colors ${
                done
                  ? "border-success bg-success text-on-primary"
                  : current
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface-2 text-text-muted"
              }`}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-text-muted">
        {currentMilestone} of {milestoneCount} milestone{milestoneCount > 1 ? "s" : ""} completed
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create opportunity-card.tsx**

```tsx
"use client";

import { useState } from "react";
import { Badge, Button, useToast } from "@/components/ui";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { appConfig } from "@/lib/config";
import {
  submitMilestone,
  approveMilestone,
  releasePayment,
  refundOpportunity,
} from "@/lib/contract-client";
import { humanizeError } from "@/lib/errors";
import { withTimeout } from "@/lib/with-timeout";
import { ExternalLink } from "lucide-react";
import { MilestoneStepper } from "./milestone-stepper";
import type { OpportunityRecord } from "@/lib/types";

interface OpportunityCardProps {
  opportunity: OpportunityRecord;
}

function statusTone(
  status: OpportunityRecord["status"],
): "success" | "warning" | "danger" | "accent" | "neutral" {
  switch (status) {
    case "released":
      return "success";
    case "funded":
    case "in_progress":
      return "accent";
    case "submitted":
    case "approved":
      return "warning";
    case "refunded":
    case "cancelled":
      return "danger";
    case "draft":
    default:
      return "neutral";
  }
}

function formatXlm(stroops: bigint): string {
  const xlm = Number(stroops) / 1e7;
  return `${xlm.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${appConfig.assetCode}`;
}

export function OpportunityCard({ opportunity: initialOpp }: OpportunityCardProps) {
  const { wallet } = useFreighterWallet();
  const { toast } = useToast();
  const [opp, setOpp] = useState(initialOpp);
  const [busy, setBusy] = useState<string | null>(null);

  const isEmployer =
    wallet.status === "connected" &&
    wallet.address?.toUpperCase() === opp.employer.toUpperCase();
  const isCandidate =
    wallet.status === "connected" &&
    wallet.address?.toUpperCase() === opp.candidate.toUpperCase();

  async function handleAction(
    action: string,
    fn: () => Promise<{ hash?: string } | undefined>,
    nextStatus: OpportunityRecord["status"],
    milestone?: boolean,
  ) {
    setBusy(action);
    try {
      const result = await withTimeout(fn(), 15000, action);
      setOpp((prev) => ({
        ...prev,
        status: nextStatus,
        currentMilestone: milestone ? prev.currentMilestone + 1 : prev.currentMilestone,
      }));
      toast({
        title: `${action} successful`,
        detail: `Opportunity is now ${nextStatus}.`,
        tone: "success",
        action: result?.hash
          ? {
              label: <>View tx <ExternalLink className="inline w-3 h-3 ml-1" /></>,
              href: `${appConfig.explorerUrl}/tx/${result.hash}`,
            }
          : undefined,
      });
    } catch (e) {
      const h = humanizeError(e);
      toast({ title: h.title, detail: h.detail, tone: "danger" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
            Opportunity #{opp.id}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-text">
            {opp.title || "Untitled opportunity"}
          </h2>
        </div>
        <Badge tone={statusTone(opp.status)} dot>
          {opp.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="grid gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-text-muted">Amount:</span>
          <span className="font-semibold text-text">{formatXlm(opp.amount)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-muted">Employer:</span>
          <code className="font-mono text-xs text-text">{opp.employer}</code>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-muted">Candidate:</span>
          <code className="font-mono text-xs text-text">{opp.candidate}</code>
        </div>
      </div>

      <MilestoneStepper
        milestoneCount={opp.milestoneCount}
        currentMilestone={opp.currentMilestone}
        status={opp.status}
      />

      <div className="flex gap-3 flex-wrap border-t border-border pt-4">
        {isCandidate &&
          (opp.status === "funded" || opp.status === "in_progress") ? (
          <Button
            variant="primary"
            onClick={() =>
              void handleAction(
                "Submit milestone",
                () => submitMilestone(wallet.address!, opp.id),
                "submitted",
              )
            }
            loading={busy === "Submit milestone"}
          >
            Submit milestone
          </Button>
        ) : null}

        {isEmployer && opp.status === "submitted" ? (
          <Button
            variant="primary"
            onClick={() =>
              void handleAction(
                "Approve milestone",
                () => approveMilestone(wallet.address!, opp.id),
                opp.currentMilestone + 1 >= opp.milestoneCount
                  ? "approved"
                  : "in_progress",
                true,
              )
            }
            loading={busy === "Approve milestone"}
          >
            Approve milestone
          </Button>
        ) : null}

        {isEmployer && opp.status === "approved" ? (
          <Button
            variant="primary"
            onClick={() =>
              void handleAction(
                "Release payment",
                () => releasePayment(wallet.address!, opp.id),
                "released",
              )
            }
            loading={busy === "Release payment"}
          >
            Release payment
          </Button>
        ) : null}

        {isEmployer &&
          (opp.status === "funded" || opp.status === "in_progress") ? (
          <Button
            variant="warning"
            onClick={() =>
              void handleAction(
                "Refund",
                () => refundOpportunity(wallet.address!, opp.id),
                "refunded",
              )
            }
            loading={busy === "Refund"}
          >
            Refund
          </Button>
        ) : null}
      </div>
    </article>
  );
}
```

- [ ] **Step 3: Create opportunity/[id]/page.tsx**

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getOpportunityServer } from "@/lib/contract-read-server";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { FreighterWalletProvider } from "@/hooks/use-freighter-wallet";
import { OpportunityCard } from "@/components/opportunity/opportunity-card";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Opportunity #${id} · Stellaroid Earn`,
    description: "Escrowed paid trial on Stellar testnet.",
  };
}

export default async function OpportunityPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId < 0) notFound();

  let opportunity;
  try {
    opportunity = await getOpportunityServer(numericId);
  } catch {
    opportunity = null;
  }

  if (!opportunity) notFound();

  return (
    <FreighterWalletProvider>
      <SiteNav />
      <main
        id="main"
        style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}
      >
        <OpportunityCard opportunity={opportunity} />
      </main>
      <SiteFooter />
    </FreighterWalletProvider>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `cd frontend && npm run build`
Expected: build succeeds with new `/opportunity/[id]` route

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/opportunity/ frontend/src/components/opportunity/
git commit -m "feat(frontend): add opportunity detail route with milestone stepper and action controls"
```

---

## Task 9: Add Talent Passport Route

**Files:**
- Create: `frontend/src/app/talent/[address]/page.tsx`
- Create: `frontend/src/components/talent/talent-passport.tsx`

- [ ] **Step 1: Create talent-passport.tsx**

```tsx
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { shortenAddress } from "@/lib/format";
import type { IssuerRecord } from "@/lib/types";
import type { CertificateRecord } from "@/lib/contract-read-server";

interface TalentPassportProps {
  address: string;
  issuer: IssuerRecord | null;
  credentials: { hash: string; cert: CertificateRecord }[];
}

function statusTone(status: string): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "verified":
      return "success";
    case "revoked":
      return "danger";
    case "suspended":
    case "expired":
      return "warning";
    default:
      return "neutral";
  }
}

export function TalentPassport({
  address,
  issuer,
  credentials,
}: TalentPassportProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
          Candidate passport
        </p>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <code className="font-mono text-sm text-text">
            {shortenAddress(address, 10)}
          </code>
          <CopyButton value={address} ariaLabel="Copy candidate address" />
        </div>
        {issuer ? (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-text-muted">Issuer:</span>
            <span className="text-sm font-semibold text-text">{issuer.name}</span>
            <Badge
              tone={issuer.status === "approved" ? "success" : "warning"}
              dot
            >
              {issuer.status}
            </Badge>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-xl font-semibold text-text mb-4">Credentials</h2>
        {credentials.length === 0 ? (
          <p className="text-sm text-text-muted">
            No credentials found for this address.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {credentials.map(({ hash, cert }) => (
              <a
                key={hash}
                href={`/proof/${hash}`}
                className="rounded-xl border border-border bg-bg p-4 no-underline hover:border-primary/50 transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-text">
                    {cert.title || "Untitled"}
                  </p>
                  <p className="text-xs text-text-muted mt-1">{cert.cohort}</p>
                </div>
                <Badge tone={statusTone(cert.status)} dot>
                  {cert.status}
                </Badge>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Create talent/[address]/page.tsx**

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { TalentPassport } from "@/components/talent/talent-passport";
import { shortenAddress } from "@/lib/format";

const STELLAR_ADDRESS_RE = /^G[A-Z2-7]{55}$/;

interface PageProps {
  params: Promise<{ address: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { address } = await params;
  const short = shortenAddress(address, 6);
  return {
    title: `Talent · ${short} · Stellaroid Earn`,
    description: `Candidate passport for ${short} on Stellar testnet.`,
  };
}

export default async function TalentPage({ params }: PageProps) {
  const { address } = await params;
  if (!STELLAR_ADDRESS_RE.test(address)) notFound();

  // Note: Without a backend index, we cannot enumerate all credentials for an address.
  // This page serves as the passport shell — credentials are linked from proof pages.
  // Future: add an event-indexing layer to populate this automatically.

  return (
    <>
      <SiteNav />
      <main
        id="main"
        style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}
      >
        <TalentPassport address={address} issuer={null} credentials={[]} />
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: build succeeds with new `/talent/[address]` route

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/talent/ frontend/src/components/talent/
git commit -m "feat(frontend): add talent passport route"
```

---

## Task 10: Add Navigation Links and Update Footer

**Files:**
- Modify: `frontend/src/components/layout/site-nav.tsx`
- Modify: `frontend/src/components/layout/site-footer.tsx`

- [ ] **Step 1: Read current site-nav.tsx and site-footer.tsx**

Read both files to understand existing link structure before adding new navigation items.

- [ ] **Step 2: Add employer and opportunity links to site-nav.tsx**

Add `Employer` link alongside existing nav items. The exact insertion point depends on the current nav structure — add it after the `Issuer` or `App` link.

- [ ] **Step 3: Add employer/talent/opportunity to site-footer.tsx**

Add links in the appropriate footer column (likely the "On-chain" column based on existing structure).

- [ ] **Step 4: Verify build**

Run: `cd frontend && npm run build`
Expected: build succeeds

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout/site-nav.tsx frontend/src/components/layout/site-footer.tsx
git commit -m "feat(frontend): add employer and opportunity navigation links"
```

---

## Task 11: Demote Issuer Registry and Cleanup

**Files:**
- Modify: `frontend/src/lib/issuer-registry.ts`
- Modify: `frontend/src/components/proof/proof-card.tsx`

- [ ] **Step 1: Update issuer-registry.ts header comment**

Replace the header comment to make clear this is a deprecated display-only fallback:

```typescript
// DEPRECATED: Display-only fallback for issuer names.
// Trust source is the on-chain issuer registry — NOT this static map.
// This file will be removed once all proof pages reliably hydrate from contract state.
// Do NOT add new entries here. Register issuers on-chain via /issuer/register.
```

- [ ] **Step 2: Verify proof-card.tsx already prefers on-chain issuer**

Confirm that `proof-card.tsx` already uses the `issuer` prop (from `getIssuerServer`) as primary and `lookupIssuer` only as fallback in `issuerMeta`. No code changes needed if this is already the case (it is, based on current code).

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: build succeeds

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/issuer-registry.ts
git commit -m "docs: mark issuer-registry.ts as deprecated display-only fallback"
```

---

## Task 12: Update Checklist and Final Verification

**Files:**
- Modify: `docs/archive/superpowers/plans/2026-04-18-credential-opportunity-checklist.md`
- Modify: `frontend/TODO.md`

- [ ] **Step 1: Run cargo test**

Run: `cd contract && cargo test`
Expected: 10/10 tests pass

- [ ] **Step 2: Run npm run build**

Run: `cd frontend && npm run build`
Expected: build succeeds with all new routes

- [ ] **Step 3: Run npm run lint**

Run: `cd frontend && npm run lint`
Expected: no lint errors

- [ ] **Step 4: Update the checklist checkboxes**

Check off all completed items in `docs/archive/superpowers/plans/2026-04-18-credential-opportunity-checklist.md`.

- [ ] **Step 5: Update frontend/TODO.md**

Add a new section documenting the opportunity layer as done.

- [ ] **Step 6: Commit**

```bash
git add docs/archive/superpowers/plans/2026-04-18-credential-opportunity-checklist.md frontend/TODO.md
git commit -m "docs: update checklists with completed opportunity layer and remaining features"
```

---

## Recommended Execution Order

1. Task 1 — Contract types and storage (foundation)
2. Task 2 — Contract methods (depends on Task 1)
3. Task 3 — Contract tests (depends on Task 2)
4. Task 4 — Frontend types and errors (independent of contract, can parallel)
5. Task 5 — Frontend bindings (depends on Task 4)
6. Task 6 — Proof subcomponents (independent of Tasks 1-5)
7. Task 7 — Employer route (depends on Task 5)
8. Task 8 — Opportunity detail route (depends on Task 5)
9. Task 9 — Talent passport route (independent of Tasks 7-8)
10. Task 10 — Navigation links (depends on Tasks 7-9)
11. Task 11 — Issuer registry cleanup (independent)
12. Task 12 — Final verification (depends on all)

**Parallelizable groups:**
- Tasks 1-3 (contract) can run in parallel with Tasks 4 + 6 (frontend types + proof subcomponents)
- Tasks 7, 8, 9 can run in parallel after Task 5
