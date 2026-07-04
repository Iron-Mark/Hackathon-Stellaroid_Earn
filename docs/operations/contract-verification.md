# Contract Verification Runbook

This runbook separates three different claims:

- The deployed contract exists on Stellar testnet.
- The deployed bytecode hash matches a local artifact.
- The deployed bytecode is build/source verified through metadata and GitHub attestation.

## Current Public Contract

| Field | Value |
| --- | --- |
| Network | Stellar testnet |
| Contract ID | `CDMUOHMARNVOJZM3IVOCJUPGBHDTHFBMZCCZXEZPQDVJGILH3NIKTTW3` |
| Expected deployed WASM hash | `59ca403e347f4c24b1dd16fbcb65662c2837cc852946e3ae88374eed509d6f7f` |
| Source repo | `github:Iron-Mark/Hackathon-Stellaroid_Earn` |
| Home domain | `stellaroid.tech` |

## Verification Commands

Install Stellar CLI if needed:

```powershell
winget install --id Stellar.StellarCLI
```

Run the repo audit:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-contract-source.ps1
```

Strict mode for a newly redeployed source-verified contract:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-contract-source.ps1 -RequireSourceMatch
```

## Current Finding

As of the latest local audit, the deployed testnet bytecode hash is `59ca403e347f4c24b1dd16fbcb65662c2837cc852946e3ae88374eed509d6f7f`.

That hash matches the ignored local artifact at:

```text
contract/target/wasm32v1-none/release/stellaroid_earn.wasm
```

Current committed source on `june-monthly-builder` builds successfully and passes contract tests, but it does not reproduce the deployed hash. A fresh metadata build from current source produces a different WASM hash.

Stellar CLI also reports that the deployed WASM does not contain a `source_repo` metadata entry, so `stellar contract info build` cannot resolve GitHub build-attestation evidence for this deployed bytecode.

The local reproducibility sweep tested the contract-changing commits from the initial April contract through the June contract CI merge, including `464986e`, `71d2b03`, `34c0bd0`, `ccaa3fc`, `18749df`, `01ee94d`, `358abcc`, and current `june-monthly-builder`. None reproduced the deployed `59ca...` hash from committed source.

## Source Verification Path

For a future source-verifiable deployment:

1. Build from a clean committed source snapshot.
2. Include metadata:

```powershell
stellar contract build `
  --manifest-path .\contract\Cargo.toml `
  --locked `
  --meta source_repo=github:Iron-Mark/Hackathon-Stellaroid_Earn `
  --meta home_domain=stellaroid.tech
```

3. Publish a GitHub release from the same commit so the release workflow can generate build artifacts and attestations.
4. Deploy that exact WASM to Stellar testnet.
5. Update frontend/Vercel contract environment variables and public docs to the new contract ID.
6. Re-run this runbook with `-RequireSourceMatch`.

Do not describe the current deployed contract as source-verified until the deployed bytecode has source metadata and a matching GitHub attestation.
