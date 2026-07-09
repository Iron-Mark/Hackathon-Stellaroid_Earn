# Contract Verification Runbook

This runbook separates three different claims:

- The deployed contract exists on Stellar testnet.
- The deployed bytecode hash matches a local artifact.
- The deployed bytecode is build/source verified through metadata and GitHub attestation.

## Current Public Contract

| Field | Value |
| --- | --- |
| Network | Stellar testnet |
| Contract ID | `CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV` |
| Expected deployed WASM hash | `1b7479f1ca0f12846bbfdd8f0681670692e29e1f20618150912f010b7caf4b9f` |
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

## Current Finding (2026-07-09 redeploy)

The contract was redeployed on 2026-07-09 from committed source on `july-monthly-builder` with verification metadata embedded. The deployed testnet bytecode hash is `1b7479f1ca0f12846bbfdd8f0681670692e29e1f20618150912f010b7caf4b9f`.

- Built with `stellar contract build --meta source_repo=github:Iron-Mark/Hackathon-Stellaroid_Earn --meta home_domain=stellaroid.tech` (Stellar CLI 27.0.0, soroban-sdk 26.1.0, Rust 1.95.0). The workspace artifact lives at `target/wasm32v1-none/release/stellaroid_earn.wasm` and its SHA-256 matches the deployed hash.
- `stellar contract info meta` on the deployed WASM resolves `source_repo` and `home_domain`, so build-attestation evidence can be linked once the matching GitHub release exists.
- Deploy tx: `cf917d1615cedc0a2b84edd15daf52b7e43ade2df01ce057157ca1e82a6052ae`. Seed txs — init `faf278d7…85e6`, register_issuer `a7f38f78…7a28`, approve_issuer `6d090d9b…f695`, register_certificate `8c20a944…a0e8`, verify_certificate `67137aa8…2cb9`.
- Remaining step for full source verification: publish the GitHub release/tag from the deploying commit so the release workflow generates the build attestation, then re-run this runbook with `-RequireSourceMatch`.

The previous contract (`CDMUOHMARNVOJZM3IVOCJUPGBHDTHFBMZCCZXEZPQDVJGILH3NIKTTW3`, WASM `59ca403e…6f7f`) remains on testnet as historical evidence; its bytecode was never reproducible from committed source, which motivated this redeploy.

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
