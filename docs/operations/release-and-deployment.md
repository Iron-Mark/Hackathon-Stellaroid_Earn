# Release and Deployment Runbook

This runbook is the active source for branch flow, Vercel domains, release checks, deployment repair, and rollback.

## Project Setup

- Vercel team: `marksiazon-dev`
- Vercel project: `stellaroid-earn-demo`
- Vercel project ID: `prj_GNoFcXJpKuwDUz7IeGttAfwCxMFl`
- Vercel root directory: `frontend`
- GitHub repo: `Iron-Mark/Hackathon-Stellaroid_Earn`

Do not create additional Vercel projects for branch showcase domains.

### Environment gates

- **WalletConnect (`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`)**: setting the Reown
  project id enables the WalletConnect option, at which point wallet
  connections traverse the third-party Reown relay. The `/privacy` "Wallets"
  section must disclose that relay **before** WalletConnect goes live in a given
  environment. Ship the privacy disclosure first, then set the env var.

## Branch Flow

```text
feature branch -> august-monthly-builder -> staging -> main
```

- `main`: production-ready source of truth.
- `staging`: integration branch before promotion to `main`.
- `august-monthly-builder`: active monthly-builder branch, seeded from `main` on 2026-08-25 when the July cycle closed.
- `july-monthly-builder`, `june-monthly-builder`, and `april-bootcamp-and-monthly-builder`: historical snapshots, read-only unless recovery is explicitly needed.

Open feature PRs against `august-monthly-builder`. Promote `august-monthly-builder` to `staging`, then `staging` to `main`, by PR after local verification and one meaningful CI pass when frontend code changed.

## CI and Local Checks

Pick checks by changed surface area.

| Change type | Checks |
| --- | --- |
| Frontend code, routes, config, or dependencies | From `frontend/`: `npm run lint`, `npx tsc --noEmit --incremental false --pretty false`, `npm run test:unit`, `npm run build`, `npm run test:e2e` |
| Frontend docs only | `git diff --check` and link/path review |
| Workflow changes | `git diff --check`, workflow syntax review, and one intentional GitHub Actions run after push |
| Vercel/domain settings | `scripts/verify-vercel-branch-domains.ps1` and repair dry run |
| Branch protection or branch strategy | `scripts/verify-github-branch-governance.ps1` |
| Operations docs/scripts | `scripts/verify-operations.ps1 -SkipHttp` |
| Contract changes | `cargo test -p stellaroid_earn --locked`, `cargo build -p stellaroid_earn --target wasm32v1-none --release --locked`, and [`docs/operations/contract-verification.md`](contract-verification.md) |

Frontend CI is path-filtered. Push CI runs on `main` and `staging` only for `frontend/**` or `.github/workflows/frontend-ci.yml`; PR CI targets `main` and `staging` for the same paths. Monthly-builder branches do not run push CI by default.

Contract CI is path-filtered. Push and PR CI run on `main`, `staging`, and `*-monthly-builder` only for `contracts/**`, root Cargo files, or `.github/workflows/contract-ci.yml`.

## Domains

| Domain | Branch | Role |
| --- | --- | --- |
| `stellaroid.tech` | `main` | Production-ready site |
| `beta.stellaroid.tech` | `staging` | Integration preview |
| `v4.stellaroid.tech` | `august-monthly-builder` | Active August monthly-builder showcase |
| `v3.stellaroid.tech` | `july-monthly-builder` | Archived July monthly-builder showcase |
| `v2.stellaroid.tech` | `june-monthly-builder` | Archived June monthly-builder showcase |
| `v1.stellaroid.tech` | `april-monthly-builder` | Archived monthly-builder showcase |
| `v0.stellaroid.tech` | `april-bootcamp-and-monthly-builder` | Archived bootcamp showcase |

`www.stellaroid.tech` and `earn.stellaroid.tech` redirect permanently to `https://stellaroid.tech/`.

`v4.stellaroid.tech` is the active August showcase domain. It is mapped to `august-monthly-builder` in Vercel, and its external DNS CNAME was verified on 2026-08-29. Keep `v3.stellaroid.tech` mapped to `july-monthly-builder` as the frozen July snapshot.

If `v4.stellaroid.tech` fails the HTTPS verifier with a DNS resolution error, first confirm the `v4` CNAME exists at the external DNS host. After adding the record, some recursive resolvers can temporarily keep the previous NXDOMAIN response while Vercel and other resolvers already see the CNAME.

The apex domain uses third-party nameservers, not Vercel nameservers. Manage subdomain records at the external DNS host:

| Host | Type | Value |
| --- | --- | --- |
| `v0` | `CNAME` | `82586c23ca506f63.vercel-dns-017.com` |
| `v1` | `CNAME` | `82586c23ca506f63.vercel-dns-017.com` |
| `v2` | `CNAME` | `82586c23ca506f63.vercel-dns-017.com` |
| `v3` | `CNAME` | `82586c23ca506f63.vercel-dns-017.com` |
| `v4` | `CNAME` | `82586c23ca506f63.vercel-dns-017.com` |
| `beta` | `CNAME` | `82586c23ca506f63.vercel-dns-017.com` |

Do not include `https://` in DNS values. Branch showcase domains are public; Vercel SSO deployment protection should remain disabled unless the showcase URLs are intentionally made private.

## Verification Commands

Broad read-only operations check:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-operations.ps1
```

Domain-focused check:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-vercel-branch-domains.ps1
```

If local DNS has stale NXDOMAIN cache after a new subdomain is added, verify through DNS-over-HTTPS:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-vercel-branch-domains.ps1 -DohUrl https://dns.google/dns-query
```

Branch-governance check:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-github-branch-governance.ps1
```

Contract source-verification audit:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-contract-source.ps1
```

Canonical live checks:

```powershell
curl.exe -I -L --max-redirs 0 https://stellaroid.tech/
curl.exe -I -L --max-redirs 0 https://www.stellaroid.tech/
curl.exe -I -L --max-redirs 0 https://earn.stellaroid.tech/
curl.exe -I -L https://stellaroid.tech/status
curl.exe -sS https://stellaroid.tech/api/health
```

Pass criteria:

- `https://stellaroid.tech/` returns `200`.
- `https://www.stellaroid.tech/` redirects to `https://stellaroid.tech/`.
- `https://earn.stellaroid.tech/` redirects to `https://stellaroid.tech/`.
- `https://stellaroid.tech/status` renders the status page.
- `https://stellaroid.tech/api/health` returns healthy JSON.
- `https://stellaroid-earn-demo.vercel.app/` remains reachable as fallback.

## Deployment Repair

The repair script is safe by default. Without `-Deploy`, it only reads Vercel, GitHub branch metadata, and aliases:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\repair-vercel-branch-deployments.ps1
```

If the dry run reports no repair needed, stop. Do not redeploy.

If the dry run reports a concrete missing branch deployment or stale alias, repair only that issue:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\repair-vercel-branch-deployments.ps1 -Deploy
```

Limit repair to one domain when possible:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\repair-vercel-branch-deployments.ps1 -OnlyDomain beta.stellaroid.tech -Deploy
```

The script deploys from temporary directories only. It does not commit, push, unlock archive branches, or create Vercel projects. `v0.stellaroid.tech` is a special static archive showcase generated from `scripts/templates/v0-archive-showcase/` because `april-bootcamp-and-monthly-builder` does not contain the current `frontend/` root.

## Promotion Steps

Active monthly builder to `staging`:

1. Confirm the monthly-builder branch contains the intended work.
2. Run the relevant local checks.
3. Open a PR to `staging`.
4. Let one PR CI run validate frontend changes when applicable.
5. Merge after review and verification.
6. Verify `beta.stellaroid.tech`.

`staging` to `main`:

1. Confirm `beta.stellaroid.tech` is healthy.
2. Open a PR from `staging` to `main`.
3. Let one PR CI run validate frontend changes when applicable.
4. Merge after review.
5. Verify `stellaroid.tech`.

## Rollback

If the apex domain fails:

1. Keep the Vercel fallback URL serving the app.
2. Temporarily point public links back to `stellaroid-earn-demo.vercel.app`.
3. Re-check registrar nameservers and Vercel project-domain verification.

## Stop Conditions

Stop and ask before:

- Deleting branches.
- Changing branch protection.
- Disabling production security controls.
- Rotating or deleting environment variables.
- Creating new Vercel projects.
- Triggering broad redeploys across archive branches.

Continue without asking for read-only verification, local docs/script edits, local checks that directly match the change, read-only Vercel/GitHub inspection, and the repair script without `-Deploy`.
