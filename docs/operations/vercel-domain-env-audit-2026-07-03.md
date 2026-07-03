# Vercel Domain and Env Audit - 2026-07-03

Scope: `marksiazon-dev/stellaroid-earn-demo`.

## Domain Parity

`scripts/verify-vercel-branch-domains.ps1` passed for the configured project domains.

| Domain | Expected branch | Audit result |
| --- | --- | --- |
| `stellaroid.tech` | production / `main` | Verified, production root domain, HTTPS 200 |
| `beta.stellaroid.tech` | `staging` | Verified, branch mapped, HTTPS 200 |
| `v2.stellaroid.tech` | `june-monthly-builder` | Verified, archived June showcase, HTTPS 200 |
| `v1.stellaroid.tech` | `april-monthly-builder` | Verified, branch mapped, HTTPS 200 |
| `v0.stellaroid.tech` | `april-bootcamp` | Verified, branch mapped, HTTPS 200 |

`beta`, `v2`, `v1`, and `v0` also report the expected Vercel CNAME configuration. Project SSO deployment protection is disabled, so public showcase domains are reachable.

After the June release, `june-monthly-builder` became the archived `v2` showcase branch. `july-monthly-builder` is the active monthly-builder branch and uses Vercel branch previews until a dedicated July showcase domain is intentionally configured.

## Env Parity

The audit inspected env names and scopes only; values remain encrypted and were not copied into this document.

| Scope | Env status |
| --- | --- |
| Production / `main` | Full current frontend public env set is present. |
| Preview / `staging` | Full current frontend public env set is present. |
| Preview / `july-monthly-builder` | Full current frontend public env set is present. |
| Preview / `june-monthly-builder` | Full current frontend public env set is present; keep as archive-scoped unless intentionally redeploying `v2`. |
| Preview / `april-monthly-builder` | No branch-specific full current frontend env set was listed; it inherits project-wide preview envs. This is acceptable for the archived showcase while the live domain remains healthy. Add branch-scoped env only before intentionally redeploying this archive with the current frontend. |
| Preview / `april-bootcamp` | No branch-specific full current frontend env set was listed; `v0` is generated from the static archive showcase template. Keep it archive-only unless recovery is explicitly needed. |

Project-wide `Production, Preview, Development` envs exist for shared Stellar network/RPC/asset settings. Branch-specific envs exist for the current deployable app branches where contract ID, read address, admin address, explorer URL, asset code/decimals, and passphrase are required at build time.

## Follow-Up Rule

Do not rotate or add archive branch env vars during routine product work. If an archive branch must be redeployed, first run the repair script dry run, then add only the missing branch-scoped envs required by that archive target.
