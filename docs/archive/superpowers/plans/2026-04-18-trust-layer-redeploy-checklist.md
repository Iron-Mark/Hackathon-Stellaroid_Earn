# Trust Layer Redeploy Checklist

Use this after pulling the Phase 1 trust-layer changes. The frontend now expects the new issuer-aware contract ABI, so the old deployed demo contract will not match.

## What Changed

- `verify_certificate` now requires a caller address and contract-side auth
- issuer registration / approval / suspension is now on-chain
- credential status is now lifecycle-based: `issued`, `verified`, `revoked`, `suspended`, `expired`
- payment paths only work for `verified` credentials

## 1. Prepare the Local Toolchain

- Confirm `cargo` is installed and available on `PATH`
- Confirm the Wasm target exists:
  - `rustup target add wasm32-unknown-unknown`
- Confirm Stellar CLI is installed:
  - `stellar version`

## 2. Run Contract Tests

- From repo root:

```powershell
Set-Location contract
cargo test
```

- Do not deploy until the updated trust-layer tests pass locally

## 3. Build the New Wasm

```powershell
Set-Location contract
stellar contract build
```

Expected output artifact:

```text
contract\target\wasm32-unknown-unknown\release\stellaroid_earn.wasm
```

## 4. Deploy a Fresh Testnet Contract

Generate or reuse a funded source identity:

```powershell
stellar keys generate --global my-key --network testnet
stellar keys fund my-key --network testnet
stellar keys address my-key
```

Deploy:

```powershell
stellar contract deploy `
  --wasm target\wasm32-unknown-unknown\release\stellaroid_earn.wasm `
  --source my-key `
  --network testnet
```

Record the returned contract ID. The previous demo contract ID is no longer safe to reuse with the new frontend bindings.

## 5. Initialize the New Contract

Call `init` with:

- `admin`: the wallet that should control issuer approval and suspension
- `token`: the Stellar Asset Contract address used by reward/payment flows

Example:

```powershell
stellar contract invoke `
  --id <NEW_CONTRACT_ID> `
  --source my-key `
  --network testnet `
  -- init `
  --admin <ADMIN_G_ADDR> `
  --token <ASSET_CONTRACT_ID>
```

## 6. Seed the Trust Layer

Register at least one issuer wallet:

```powershell
stellar contract invoke `
  --id <NEW_CONTRACT_ID> `
  --source <ISSUER_IDENTITY> `
  --network testnet `
  -- register_issuer `
  --issuer <ISSUER_G_ADDR> `
  --name stellaroid_academy `
  --website stellaroid_demo `
  --category bootcamp
```

Approve that issuer with the admin wallet:

```powershell
stellar contract invoke `
  --id <NEW_CONTRACT_ID> `
  --source <ADMIN_IDENTITY> `
  --network testnet `
  -- approve_issuer `
  --admin <ADMIN_G_ADDR> `
  --issuer <ISSUER_G_ADDR>
```

## 7. Recreate Demo Credentials

Because this is a fresh deployment, old certificate records do not exist on the new contract.

- Register a fresh certificate hash with an approved issuer
- Verify it using the admin wallet or the issuing wallet
- Optionally test `reward_student` and `link_payment`

Suggested smoke-test flow:

```powershell
stellar contract invoke `
  --id <NEW_CONTRACT_ID> `
  --source <ISSUER_IDENTITY> `
  --network testnet `
  -- register_certificate `
  --issuer <ISSUER_G_ADDR> `
  --student <STUDENT_G_ADDR> `
  --cert_hash <64_HEX_HASH>

stellar contract invoke `
  --id <NEW_CONTRACT_ID> `
  --source <ISSUER_IDENTITY> `
  --network testnet `
  -- verify_certificate `
  --verifier <ISSUER_G_ADDR> `
  --cert_hash <64_HEX_HASH>
```

## 8. Update Frontend Environment

Edit `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_SOROBAN_CONTRACT_ID=<NEW_CONTRACT_ID>
NEXT_PUBLIC_STELLAR_ADMIN_ADDRESS=<ADMIN_G_ADDR>
NEXT_PUBLIC_STELLAR_READ_ADDRESS=<FUNDED_TESTNET_G_ADDR>
NEXT_PUBLIC_SOROBAN_ASSET_ADDRESS=<ASSET_CONTRACT_ID>
NEXT_PUBLIC_SOROBAN_ASSET_CODE=XLM
NEXT_PUBLIC_SOROBAN_ASSET_DECIMALS=7
```

Restart Next.js after changing env values.

## 9. Frontend Smoke Test

- `npm install`
- `npm run dev`
- connect Freighter on testnet
- verify `/issuer` shows the connected issuer state
- verify the admin wallet sees approval / suspension controls on `/issuer`
- verify `/proof/<hash>` shows:
  - credential status
  - issuer trust badge
  - transitional metadata/evidence when available
- verify `/proof/<hash>/embed` loads cleanly

## 10. Demo-Day Validation

- explorer shows the new contract
- issuer registration and approval events are visible
- trusted verification succeeds only for admin / issuer wallets
- revoked credentials cannot proceed to payment
- the frontend no longer assumes public verification by any wallet

## Runtime Notes

- The transitional proof metadata layer is frontend-side only for now. It is intentionally not the source of truth for trust decisions.
- Trust-critical state remains on-chain: issuer status, credential status, verification gating, and payment eligibility.
