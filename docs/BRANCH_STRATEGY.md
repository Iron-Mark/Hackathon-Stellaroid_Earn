# Branch Strategy

This repository uses a simple promotion path:

```text
main <- staging <- *-monthly-builder
```

Read this as: monthly builder branches merge into `staging`, and `staging` promotes into `main`.

## Branch Roles

- `main`: default branch and production-ready source of truth.
- `staging`: integration branch for verified work before promotion to `main`.
- `*-monthly-builder`: short-lived or archived monthly builder branches for feature batches.
- `april-bootcamp` and older named archives: historical snapshots, not active integration branches.

## Pull Request Flow

- Open feature or monthly-builder pull requests against `staging`.
- Promote `staging` to `main` with a pull request after local verification and CI pass.
- Avoid direct commits to `main` and `staging`; branch protection requires pull-request based updates.
- Keep archive branches read-only unless an explicit recovery operation is needed.

## CI Scope

Frontend CI is intentionally scoped to avoid unnecessary GitHub Actions usage:

- Push CI runs on `main` and `staging` only when `frontend/**` or `.github/workflows/frontend-ci.yml` changes.
- Pull request CI runs for PRs targeting `main` or `staging` only when those same paths change.
- Monthly builder branches do not run push CI by default; their changes are verified when opened as PRs to `staging` or `main`.
- Repeated pushes cancel older in-progress frontend CI runs for the same branch or pull request.

Docs-only and repository-settings-only changes should not consume frontend CI minutes unless they modify the frontend workflow itself.

## Operations Checks

Use one read-only command for routine branch and deployment governance checks:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-operations.ps1
```

This wraps:

- `scripts/verify-vercel-branch-domains.ps1` for domain mappings, DNS configuration, public access, and HTTPS checks.
- `scripts/repair-vercel-branch-deployments.ps1` in dry-run mode for missing branch deployments or stale aliases.
- `scripts/verify-github-branch-governance.ps1` for branch sync, branch protection, locked archives, and monthly-builder rulesets.
- `git diff --check` for local whitespace hygiene.

Use `-SkipHttp` on the operations verifier when you only need API and repository checks. Do not run the repair script with `-Deploy` unless its dry run reports a concrete missing deployment or alias.

## Vercel Domains

All public branch showcases live in the single Vercel project `marksiazon-dev/stellaroid-earn-demo`.

Operational details live in [`DEPLOYMENT_RUNBOOK.md`](DEPLOYMENT_RUNBOOK.md). Promotion steps live in [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md).

| Branch | Domain | Purpose |
|---|---|---|
| `main` | `stellaroid.tech` | Current production-ready site |
| `staging` | `beta.stellaroid.tech` | Integration preview before promotion |
| `june-monthly-builder` | `v2.stellaroid.tech` | Current monthly-builder showcase |
| `april-monthly-builder` | `v1.stellaroid.tech` | Archived monthly-builder showcase |
| `april-bootcamp` | `v0.stellaroid.tech` | Archived bootcamp showcase |

`www.stellaroid.tech` and `earn.stellaroid.tech` redirect to `stellaroid.tech`.

Branch showcase domains are public. Vercel SSO deployment protection must remain disabled for this project unless the showcase URLs are intentionally made private again.

The `april-bootcamp` branch is a docs-only archive and does not contain the current `frontend/` project root. Its `v0.stellaroid.tech` deployment is a static archive showcase generated from that branch context and labeled with the archive commit metadata. The reproducible template for that temporary deployment lives in `scripts/templates/v0-archive-showcase/`; it is copied to a temp directory by `scripts/repair-vercel-branch-deployments.ps1` and is not committed to the locked archive branch.

The apex uses third-party nameservers, so subdomain DNS must be managed at the external DNS host. Use CNAME records for the branch domains:

| Host | Type | Value |
|---|---|---|
| `v0` | `CNAME` | `82586c23ca506f63.vercel-dns-017.com` |
| `v1` | `CNAME` | `82586c23ca506f63.vercel-dns-017.com` |
| `v2` | `CNAME` | `82586c23ca506f63.vercel-dns-017.com` |
| `beta` | `CNAME` | `82586c23ca506f63.vercel-dns-017.com` |

Vercel also accepts `cname.vercel-dns.com` as a fallback CNAME target, but the hash-specific target above matches the existing `www` and `earn` records.
