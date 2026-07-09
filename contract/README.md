# Stellaroid Earn

On-chain credential registry that rewards verified students with XLM/SAC-tokens and lets employers pay verified wallets directly.

## Problem & Solution

**Problem:** A graduating student in Manila cannot prove their bootcamp certificate to a remote employer without manual email verification that delays hiring by 2–3 weeks.

**Solution:** The issuer registers a certificate hash and minimal metadata bound to the student's wallet on Soroban; an approved issuer or the admin verifies the credential, and employers can pay the verified wallet directly in seconds. Stellar's sub-cent fees make per-certificate rewards economically viable.

## Stellar Features Used

- **Soroban smart contract** — issuer registry, duplicate-guard, trusted verification, credential status, and payment coordination logic
- **Stellar Asset Contract (SAC)** — reward token transferred via the standard `token::Client` interface
- **Events** — `cert_reg`, `cert_ver`, `reward`, `payment` are indexable on stellar.expert for proof

## Prerequisites

- Rust 1.74+
- Stellar CLI v26+
- `wasm32v1-none` target: `rustup target add wasm32v1-none`

## Build

```bash
stellar contract build
```

## Test

```bash
cargo test
```

## Deploy to Testnet

```bash
stellar keys generate my-key --network testnet --fund
stellar contract deploy \
  --wasm target/wasm32v1-none/release/stellaroid_earn.wasm \
  --source my-key \
  --network testnet
```

## Sample Invocation

```bash
# Initialize with admin + reward token (SAC address)
stellar contract invoke \
  --id <CONTRACT_ID> --source my-key --network testnet \
  -- init --admin <ADMIN_G_ADDR> --token <SAC_C_ADDR>

# Issuer self-registers, then admin approves that issuer
stellar contract invoke \
  --id <CONTRACT_ID> --source <ISSUER_IDENTITY> --network testnet \
  -- register_issuer \
  --issuer <ISSUER_G_ADDR> \
  --name stellaroid_academy \
  --website stellaroid_demo \
  --category bootcamp

stellar contract invoke \
  --id <CONTRACT_ID> --source <ADMIN_IDENTITY> --network testnet \
  -- approve_issuer \
  --admin <ADMIN_G_ADDR> \
  --issuer <ISSUER_G_ADDR>

# Approved issuer registers a certificate hash plus minimal proof metadata
stellar contract invoke \
  --id <CONTRACT_ID> --source <ISSUER_IDENTITY> --network testnet \
  -- register_certificate \
  --issuer <ISSUER_G_ADDR> \
  --student <STUDENT_G_ADDR> \
  --cert_hash 0101010101010101010101010101010101010101010101010101010101010101 \
  --title stellar_bootcamp_completion \
  --cohort uni_tour_2026 \
  --metadata_uri https://example.com/proofs/maria.json

# Approved issuer or admin verifies → emits cert_ver event
stellar contract invoke \
  --id <CONTRACT_ID> --source <ISSUER_IDENTITY> --network testnet \
  -- verify_certificate \
  --verifier <ISSUER_G_ADDR> \
  --cert_hash 0101010101010101010101010101010101010101010101010101010101010101

# Admin rewards the verified student
stellar contract invoke \
  --id <CONTRACT_ID> --source my-key --network testnet \
  -- reward_student \
  --student <STUDENT_G_ADDR> \
  --cert_hash 0101010101010101010101010101010101010101010101010101010101010101 \
  --amount 500

# Employer pays a verified student directly
stellar contract invoke \
  --id <CONTRACT_ID> --source my-key --network testnet \
  -- link_payment \
  --employer <EMPLOYER_G_ADDR> \
  --student <STUDENT_G_ADDR> \
  --cert_hash 0101010101010101010101010101010101010101010101010101010101010101 \
  --amount 10000
```

## Verify

```
https://stellar.expert/explorer/testnet/contract/<CONTRACT_ID>
```

## Proof Block

- **Pitch:** Trusted issuers verify a Philippine bootcamp credential and employers can pay the grad in one flow — on Stellar testnet.
- **Live demo:** https://stellaroid-earn-demo.vercel.app/
- **Contract ID (current security-hardened baseline):** `CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV`
  → https://stellar.expert/explorer/testnet/contract/CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV
- **Contract ID (stable v1):** `CDWCARXLJUJ5ISC3GPXRLR5HC6QPLMGULCVRIACYKQM4U5AG7TFWXHVZ`
  → https://stellar.expert/explorer/testnet/contract/CDWCARXLJUJ5ISC3GPXRLR5HC6QPLMGULCVRIACYKQM4U5AG7TFWXHVZ
- **Reward token (native XLM SAC):** `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- **Historical demo transactions (2026-04-18, pre-trust-layer ABI, cert hash `35a19276…6702e`):**
  - `init` → https://stellar.expert/explorer/testnet/tx/c7de2d61cfd1f51cfb255379775dd928604d264d6b5bb3775dc75cdd7c4b5721
  - `register_certificate` → https://stellar.expert/explorer/testnet/tx/1e8078e36333023c46f11a0bd990f97b62bd13ae086597de6a3db8e66d4b3a22 (emits `cert_reg`)
  - `verify_certificate` → https://stellar.expert/explorer/testnet/tx/2215e08ecc935b6f31d5c335c3aaea3e3742f07ef993d8ca947d1711ad5199d9 (emits `cert_ver`, returns `true`)
  - `link_payment` (100 XLM) → https://stellar.expert/explorer/testnet/tx/5bed652b3725a6826cd4a99e8c750cdd2dc4625f7e3a4a82661680ada50cb435 (emits `payment` + SAC `transfer`)
- **Verified events:** `init`, `cert_reg`, `cert_ver`, `payment` — all visible on the contract's Events tab on stellar.expert.
- **Historical rubric self-check for the pre-trust-layer demo:**
  - [x] Contract deployed + verified on stellar.expert
  - [x] Full register → verify → pay flow executed end to end on testnet (tx hashes above)
  - [x] `cert_reg` + `payment` events visible in explorer
  - [x] No raw ScVal / HostError surfaces (mapped in `frontend/src/lib/contract-client.ts` `normalizeError`)
- **Current repo note:** trust-layer and opportunity escrow tests are included in `contract/src/test.rs`; the security-hardened contract has been redeployed to testnet with WASM hash `1b7479f1ca0f12846bbfdd8f0681670692e29e1f20618150912f010b7caf4b9f`.

## License

MIT
