# Issuer Trust Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Rebuild and redeploy the Soroban contract from the current trust-layer source, then seed the new deployment with issuer and demo certificate data so the fully-built frontend surfaces work end-to-end.

**Architecture:** The contract source (`lib.rs`, 433 lines, 12 functions) and all frontend code are already complete. The deployed WASM (`CBOM7L…`) was built from a stale artifact and only exports 6 functions. This plan cleans, rebuilds, redeploys, inits, and seeds — no code changes required.

**Tech Stack:** Soroban / Stellar CLI v26, Rust + wasm32v1-none, Next.js 15, `@stellar/stellar-sdk`, `@stellar/freighter-api`

---

## File map (read-only reference — no edits unless a step says otherwise)

| File | Role |
|---|---|
| `contract/src/lib.rs` | Contract source — 12 pub fns including full issuer + credential lifecycle |
| `contract/src/test.rs` | 6 contract tests covering trust layer flows |
| `frontend/.env.local` | Env vars — **NEXT_PUBLIC_SOROBAN_CONTRACT_ID must be updated after redeploy** |
| `frontend/src/lib/contract-client.ts` | All trust layer client calls — already complete |
| `frontend/src/lib/contract-read-server.ts` | Server-side `getCertificateServer` + `getIssuerServer` — already complete |
| `frontend/src/components/issuer/issuer-dashboard.tsx` | Admin approve/suspend UI — already complete |
| `frontend/src/components/issuer/issuer-register-form.tsx` | Issuer registration form — already complete |
| `frontend/src/components/proof/proof-card.tsx` | Proof card with issuer badge — already complete |
| `frontend/src/app/proof/[hash]/page.tsx` | Calls `getIssuerServer`, passes `issuer` to ProofCard — already complete |
| `frontend/src/app/proof/[hash]/embed/page.tsx` | Shows `issuer.name` in compact embed — already complete |

---

## Task 1: Verify contract source is the full trust-layer version

**Files:** `contract/src/lib.rs`, `contract/src/test.rs`

- [x] **Step 1: Check line count**

```bash
wc -l contract/src/lib.rs contract/src/test.rs
```

Expected output:
```
  433 contract/src/lib.rs
  241 contract/src/test.rs
```

If lib.rs shows ~192 lines, stop — the source has been reverted. Do not proceed until the correct source is restored from git history or the trust-layer branch.

- [x] **Step 2: Confirm all 12 public functions exist**

```bash
grep "pub fn" contract/src/lib.rs
```

Expected output (order may vary):
```
    pub fn init(
    pub fn register_issuer(
    pub fn approve_issuer(
    pub fn suspend_issuer(
    pub fn get_issuer(
    pub fn register_certificate(
    pub fn verify_certificate(
    pub fn revoke_certificate(
    pub fn suspend_certificate(
    pub fn get_certificate(
    pub fn reward_student(
    pub fn link_payment(
```

If any are missing, stop. The source does not match the spec.

- [x] **Step 3: Run contract tests**

```bash
cd contract && cargo test 2>&1
```

Expected output ends with:
```
test result: ok. 6 passed; 0 failed; 0 ignored
```

If fewer than 6 tests pass, fix the test failures before proceeding.

- [x] **Step 4: Return to repo root**

```bash
cd ..
```

---

## Task 2: Clean rebuild and inspect the WASM

**Files:** `contract/target/wasm32v1-none/release/stellaroid_earn.wasm` (generated)

- [x] **Step 1: Remove the stale build artifact**

```bash
cd contract && cargo clean
```

Expected: no output, old `target/` is deleted.

- [x] **Step 2: Build fresh WASM**

```bash
stellar contract build
```

Expected last line:
```
Compiling stellaroid_earn ...
```
Artifact produced at: `target/wasm32v1-none/release/stellaroid_earn.wasm`

- [x] **Step 3: Inspect exported functions**

```bash
stellar contract inspect \
  --wasm target/wasm32v1-none/release/stellaroid_earn.wasm
```

Expected: output lists all 12 functions including `register_issuer`, `approve_issuer`, `get_issuer`, `verify_certificate` (with verifier arg), `revoke_certificate`, `suspend_certificate`.

If only 6 functions appear, the build used a cached artifact. Run `cargo clean` again and rebuild.

- [x] **Step 4: Return to repo root**

```bash
cd ..
```

---

## Task 3: Deploy new contract to testnet

**Files:** `frontend/.env.local` (will be updated in Task 5)

- [x] **Step 1: Deploy**

```bash
stellar contract deploy \
  --wasm contract/target/wasm32v1-none/release/stellaroid_earn.wasm \
  --source my-key \
  --network testnet
```

Expected: a new contract address starting with `C` is printed, e.g.:
```
CNEW...CONTRACT...ID
```

**Copy this contract ID — you will need it in Tasks 4, 5, and 6.**

- [x] **Step 2: Initialize the contract**

Replace `<NEW_CONTRACT_ID>` with the address from Step 1.
Admin address is `GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D`.
Token address is `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` (native XLM SAC).

```bash
stellar contract invoke \
  --id <NEW_CONTRACT_ID> \
  --source my-key \
  --network testnet \
  -- init \
  --admin GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D \
  --token CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

Expected: `null` (Soroban returns `()` from `init` on success).

---

## Task 4: Seed the trust layer — register and approve an issuer

**Files:** none (on-chain state change only)

- [x] **Step 1: Register the facilitator wallet as an issuer**

```bash
stellar contract invoke \
  --id <NEW_CONTRACT_ID> \
  --source my-key \
  --network testnet \
  -- register_issuer \
  --issuer GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D \
  --name "Stellar PH Bootcamp" \
  --website "https://stellaroid-earn-demo.vercel.app" \
  --category "bootcamp"
```

Expected: `null`

- [x] **Step 2: Approve the issuer with the admin wallet**

Same wallet is both admin and issuer here (valid for initial seeding).

```bash
stellar contract invoke \
  --id <NEW_CONTRACT_ID> \
  --source my-key \
  --network testnet \
  -- approve_issuer \
  --admin GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D \
  --issuer GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D
```

Expected: `null`

- [x] **Step 3: Verify issuer status on-chain**

```bash
stellar contract invoke \
  --id <NEW_CONTRACT_ID> \
  --source my-key \
  --network testnet \
  -- get_issuer \
  --issuer GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D
```

Expected: JSON with `"status": "Approved"` (or the Soroban enum variant equivalent).

---

## Task 5: Update frontend env and verify build

**Files:** `frontend/.env.local`

- [x] **Step 1: Open `frontend/.env.local` and replace the contract ID**

Change:
```
NEXT_PUBLIC_SOROBAN_CONTRACT_ID=CBOM7L3WKWES3F7Z4JZNREFFPGWU7AKBAH2TI56SJNLPGF5TJ7FOA6HL
```

To:
```
NEXT_PUBLIC_SOROBAN_CONTRACT_ID=<NEW_CONTRACT_ID>
```

Leave all other values unchanged.

- [x] **Step 2: Run build to confirm no type errors**

```bash
cd frontend && npm run build 2>&1 | tail -20
```

Expected: build completes with the route table printed. No TypeScript or compilation errors.

- [x] **Step 3: Return to repo root**

```bash
cd ..
```

---

## Task 6: Seed demo certificate data

The demo proof hash `35a19276e58b8f742177892531def5e820f7c07bd8fd5a716ac710db09e6702e` must exist on the new contract so `/proof/<hash>` loads real data.

- [x] **Step 1: Register the demo certificate**

```bash
stellar contract invoke \
  --id <NEW_CONTRACT_ID> \
  --source my-key \
  --network testnet \
  -- register_certificate \
  --issuer GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D \
  --student GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D \
  --cert_hash 35a19276e58b8f742177892531def5e820f7c07bd8fd5a716ac710db09e6702e \
  --title "Stellar Smart Contract Bootcamp Completion" \
  --cohort "Stellar PH Bootcamp 2026" \
  --metadata_uri "https://stellaroid-earn-demo.vercel.app/proof-metadata/sample.json"
```

Expected: `null`

- [x] **Step 2: Verify the demo certificate**

```bash
stellar contract invoke \
  --id <NEW_CONTRACT_ID> \
  --source my-key \
  --network testnet \
  -- verify_certificate \
  --verifier GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D \
  --cert_hash 35a19276e58b8f742177892531def5e820f7c07bd8fd5a716ac710db09e6702e
```

Expected: `null`

- [x] **Step 3: Confirm certificate status on-chain**

```bash
stellar contract invoke \
  --id <NEW_CONTRACT_ID> \
  --source my-key \
  --network testnet \
  -- get_certificate \
  --cert_hash 35a19276e58b8f742177892531def5e820f7c07bd8fd5a716ac710db09e6702e
```

Expected: JSON with `"status": "Verified"`, `"title": "Stellar Smart Contract Bootcamp Completion"`.

---

## Task 7: Frontend smoke test

**Files:** none (browser verification)

- [x] **Step 1: Start dev server**

```bash
cd frontend && npm run dev
```

Wait for `✓ Ready in` message.

- [x] **Step 2: Verify proof page with issuer card**

Open `http://localhost:3000/proof/35a19276e58b8f742177892531def5e820f7c07bd8fd5a716ac710db09e6702e`

Confirm:
- Status badge shows **Verified**
- Issuer row shows `Stellar PH Bootcamp · Approved issuer` badge (green dot)
- Credential metadata panel shows title, cohort, skills
- No console errors

- [x] **Step 3: Verify embed page**

Open `http://localhost:3000/proof/35a19276e58b8f742177892531def5e820f7c07bd8fd5a716ac710db09e6702e/embed`

Confirm:
- Status badge shows **Verified**
- Issuer line reads `Stellar PH Bootcamp (GAWIO…)` not just the raw address

- [x] **Step 4: Verify issuer dashboard — approved state**

Connect Freighter (admin wallet `GAWIO…`) and open `http://localhost:3000/issuer`

Confirm:
- Status badge shows **approved**
- Issuer card shows name, website, category
- Admin panel is visible (because wallet matches `NEXT_PUBLIC_STELLAR_ADMIN_ADDRESS`)
- Address input + "Load issuer" button present

- [x] **Step 5: Verify issuer dashboard — registration flow (second wallet)**

Connect a different funded testnet wallet and open `http://localhost:3000/issuer/register`

Confirm:
- Registration form shows name, website, category fields
- Submit calls `registerIssuer` via Freighter (approve in wallet popup)
- After success, redirects to `/issuer` and shows **pending** status

- [x] **Step 6: Approve the second wallet from admin panel**

Switch back to admin wallet. Open `/issuer`.

Confirm:
- Paste the second wallet's address into the "Target issuer wallet" input
- Click "Load issuer" → shows the pending issuer record
- Click "Approve issuer" → Freighter popup → approve
- Status updates to **approved**

- [x] **Step 7: Commit**

```bash
cd ..
git add frontend/.env.local
git commit -m "feat: deploy trust-layer contract and seed issuer + demo cert"
```

---

## Troubleshooting

**`cargo clean` not available:** Ensure Rust is on PATH: `export PATH="$PATH:$HOME/.cargo/bin"`

**`stellar contract inspect` shows only 6 functions after build:** The build system found a cached artifact elsewhere. Check if there is a second `target/` directory outside `contract/`. Run `find . -name "stellaroid_earn.wasm" 2>/dev/null` to locate all WASM files.

**`register_certificate` fails with `IssuerNotApproved`:** Task 4 Step 2 (approve_issuer) did not complete. Re-run it and confirm `get_issuer` returns `Approved` before proceeding.

**`verify_certificate` fails with `Unauthorized`:** The `--verifier` address must match either the admin or the certificate's issuer address. Both are `GAWIO…` in this seeding flow.

**Proof page shows "Lookup failed":** The contract ID in `.env.local` does not match the deployed contract. Confirm `NEXT_PUBLIC_SOROBAN_CONTRACT_ID` equals the new contract ID from Task 3 Step 1 and restart the dev server.

**Issuer badge not shown on proof page:** The `getIssuerServer` call succeeded but returned `null` — the issuer wallet is not registered on the new contract. Re-run Task 4.
