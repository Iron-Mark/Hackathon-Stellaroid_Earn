# Release Checklist

Use this checklist to promote work without burning CI or repeating redundant verification.

## Branch Flow

```text
feature branch or *-monthly-builder -> staging -> main
```

- Open feature and monthly-builder pull requests against `staging`.
- Promote `staging` to `main` with a pull request after local verification and one meaningful CI pass.
- Keep archive branches read-only unless a recovery operation is explicitly needed.

## Before Opening A Pull Request

Pick checks by what changed.

| Change type | Local checks |
|---|---|
| Frontend code, app routes, config, dependencies | `npm run lint`, `npx tsc --noEmit --incremental false --pretty false`, `npm run test:unit`, `npm run build`, `npm run test:e2e` from `frontend/` |
| Frontend docs only | `git diff --check` and link/path review |
| Workflow changes | `git diff --check`, workflow syntax review, and one intentional GitHub Actions run after push |
| Vercel/domain settings | `scripts/verify-vercel-branch-domains.ps1` and `scripts/repair-vercel-branch-deployments.ps1` dry run |
| Branch protection or branch strategy | `scripts/verify-github-branch-governance.ps1` |
| Operations docs/scripts | `scripts/verify-operations.ps1 -SkipHttp` |
| Contract changes | `cargo test` and the relevant Stellar CLI checks documented in `AGENTS.md` |

Do not run every check for every conversation. Run the smallest check set that proves the thing that changed.

## GitHub Actions Policy

Frontend CI is intentionally path-filtered:

- Push CI runs on `main` and `staging` for `frontend/**` or `.github/workflows/frontend-ci.yml`.
- Pull request CI runs for PRs targeting `main` or `staging` for those same paths.
- Monthly-builder branches do not run push CI by default.
- Concurrency cancels older in-progress frontend CI runs for the same branch or pull request.

Do not push just to see CI run. Push when there is a ready change to publish.

## Vercel Policy

Use the existing Vercel project only:

```text
marksiazon-dev/stellaroid-earn-demo
```

Expected public domains:

- `stellaroid.tech`
- `beta.stellaroid.tech`
- `v2.stellaroid.tech`
- `v1.stellaroid.tech`
- `v0.stellaroid.tech`

Verify them with:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-vercel-branch-domains.ps1
```

Do not redeploy if this verification passes.

Before any manual Vercel repair, run the dry run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\repair-vercel-branch-deployments.ps1
```

Only add `-Deploy` when the dry run reports a concrete missing deployment or stale alias. The script uses temporary worktrees for branch deployments and the `scripts/templates/v0-archive-showcase/` template for `v0.stellaroid.tech`.

## Branch Governance Policy

Verify branch protection with:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-github-branch-governance.ps1
```

Expected state:

- `main`, `staging`, and `june-monthly-builder` are synced before promotion work starts.
- `main` and `staging` require pull-request based updates and resolved conversations.
- `april-bootcamp` and `april-monthly-builder` are locked archive branches.
- `*-monthly-builder` branches are protected against deletion and force-pushes by ruleset.
- Legacy branches such as `dev`, `old-ver`, and `mark-siazon` remain deleted.

## Promotion Steps

### Monthly Builder To Staging

1. Confirm the monthly-builder branch contains the intended work.
2. Run the relevant local checks for the changed surface area.
3. Open a PR from the monthly-builder branch to `staging`.
4. Let one PR CI run validate frontend changes when applicable.
5. Merge after review and verification.
6. Verify `beta.stellaroid.tech` after Vercel deploys `staging`.

### Staging To Main

1. Confirm `beta.stellaroid.tech` is healthy.
2. Open a PR from `staging` to `main`.
3. Let one PR CI run validate frontend changes when applicable.
4. Merge after review.
5. Verify `stellaroid.tech`.

## Stop Conditions

Stop and ask before:

- Deleting branches.
- Changing branch protection.
- Disabling production security controls.
- Rotating or deleting environment variables.
- Creating new Vercel projects.
- Triggering broad redeploys across archive branches.

Continue without asking for:

- Read-only verification.
- Local docs/script edits.
- Local lint/type/test/build checks when they directly match the change.
- Read-only Vercel/GitHub inspection.
- Running the repair script without `-Deploy`.
