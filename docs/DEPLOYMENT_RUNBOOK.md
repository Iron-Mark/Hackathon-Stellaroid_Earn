# Deployment Runbook

This runbook covers the live Stellaroid branch showcase setup. It is scoped to the existing Vercel project only:

- Vercel team: `marksiazon-dev`
- Vercel project: `stellaroid-earn-demo`
- Vercel project ID: `prj_GNoFcXJpKuwDUz7IeGttAfwCxMFl`
- Vercel root directory: `frontend`
- GitHub repo: `Iron-Mark/Hackathon-Stellaroid_Earn`

Do not create additional Vercel projects for the branch showcase domains.

## Domain Map

| Domain | Branch | Deployment role |
|---|---|---|
| `stellaroid.tech` | `main` | Production-ready site |
| `beta.stellaroid.tech` | `staging` | Integration preview |
| `v2.stellaroid.tech` | `june-monthly-builder` | Current monthly-builder showcase |
| `v1.stellaroid.tech` | `april-monthly-builder` | Archived monthly-builder showcase |
| `v0.stellaroid.tech` | `april-bootcamp` | Archived bootcamp showcase |

`www.stellaroid.tech` and `earn.stellaroid.tech` redirect to `stellaroid.tech`.

## DNS

The apex domain uses third-party nameservers, not Vercel nameservers. Manage these records at the external DNS host.

| Host | Type | Value |
|---|---|---|
| `v0` | `CNAME` | `82586c23ca506f63.vercel-dns-017.com` |
| `v1` | `CNAME` | `82586c23ca506f63.vercel-dns-017.com` |
| `v2` | `CNAME` | `82586c23ca506f63.vercel-dns-017.com` |
| `beta` | `CNAME` | `82586c23ca506f63.vercel-dns-017.com` |

Do not include `https://` in DNS values.

## Public Access

The branch showcase domains are public. Vercel SSO deployment protection must remain disabled for this project unless the showcase URLs are intentionally made private.

Expected protection state:

```powershell
vercel project protection stellaroid-earn-demo --scope marksiazon-dev
```

The expected result is no active `ssoProtection`.

## Verification

Use the operations verifier for the broad read-only check:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-operations.ps1
```

Use the Vercel-only verifier when you are focused on domains:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-vercel-branch-domains.ps1
```

Optional local resolver check:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-vercel-branch-domains.ps1 -CheckLocalResolver
```

The verifier checks:

- Vercel project-domain mappings.
- Branch mapping for each custom domain.
- Vercel DNS configuration.
- Public SSO protection state.
- HTTPS `200` responses and page titles.

Use the GitHub-only verifier when you are focused on branch governance:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-github-branch-governance.ps1
```

That verifier checks:

- `main`, `staging`, and `june-monthly-builder` are synced.
- Deleted legacy branches remain absent.
- `main` and `staging` keep pull-request based protection.
- `april-bootcamp` and `april-monthly-builder` remain locked archives.
- The `*-monthly-builder` ruleset blocks deletion and force-pushes.

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

To limit repair to one domain:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\repair-vercel-branch-deployments.ps1 -OnlyDomain beta.stellaroid.tech -Deploy
```

The script deploys from temporary directories only:

- Active/archive frontend branches use detached temp worktrees from `origin/<branch>`.
- `v0.stellaroid.tech` uses `scripts/templates/v0-archive-showcase/` copied into a temp `frontend/` folder with archive metadata injected at deploy time.

It does not commit, push, unlock archive branches, or create Vercel projects.

## Manual Deployment Rules

Only manually deploy when the Vercel project has a domain mapping but no deployment for the mapped branch, or when an archive branch cannot be deployed by Git integration.

Do not redeploy just to feel safer. First run the verifier. If the verifier passes, stop.

### Current Special Case

`april-bootcamp` is a docs-only archive branch and does not contain the current `frontend/` app root. The `v0.stellaroid.tech` deployment is a static archive showcase generated from that branch context and labeled with the archive commit metadata.

Do not modify the protected `april-bootcamp` branch just to support `v0`. If the v0 deployment must be recreated, use `scripts/repair-vercel-branch-deployments.ps1 -OnlyDomain v0.stellaroid.tech -Deploy`. The script generates the temporary static deployment from the repo-controlled template and deploys it as a preview deployment with `githubCommitRef=april-bootcamp` metadata.

## Troubleshooting

### Vercel Shows "No Deployment"

Cause: the custom domain is mapped to a branch, but Vercel has no ready deployment associated with that branch.

Fix:

1. Confirm the branch exists on GitHub.
2. Confirm the project domain maps to the correct `gitBranch`.
3. Create one preview deployment for that branch only.
4. Re-run `scripts/verify-vercel-branch-domains.ps1`.

### Domain Redirects To `vercel.com/sso-api`

Cause: Vercel SSO deployment protection is enabled for preview/custom domains.

Fix:

```powershell
vercel project protection disable stellaroid-earn-demo --sso --scope marksiazon-dev --format json
```

Then re-run the verifier.

### DNS Looks Wrong Locally But Vercel Says Valid

Local resolver cache can lag. Trust Vercel's domain config for project readiness, then confirm with HTTPS. Use `-CheckLocalResolver` only when diagnosing DNS propagation.

## Cost Controls

- Domain mapping and Vercel API reads do not trigger GitHub Actions.
- GitHub Actions run only on configured workflow triggers.
- Vercel preview deployments consume Vercel build resources; use them only when a branch lacks a ready deployment.
- `scripts/verify-operations.ps1` and `scripts/repair-vercel-branch-deployments.ps1` without `-Deploy` are read-only and should be preferred for routine checks.
- Do not run full local E2E or Vercel redeploys when only docs changed unless the docs describe runtime behavior that needs live proof.
