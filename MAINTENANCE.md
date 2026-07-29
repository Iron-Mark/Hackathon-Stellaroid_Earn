# Stellaroid Earn Maintenance

Use this runbook to keep the project credible after the event. Evidence matters more than optimistic status labels.

## Weekly Smoke Check

Run from the repo root:

```powershell
git status --short --branch
```

Frontend checks:

```powershell
cd frontend
npm run lint
npm run build
npm run test:e2e
```

Live canonical checks:

```powershell
Invoke-WebRequest -Uri "https://stellaroid.tech/" -Method Get -TimeoutSec 30
Invoke-WebRequest -Uri "https://stellaroid.tech/status" -Method Get -TimeoutSec 30
Invoke-WebRequest -Uri "https://stellaroid.tech/api/health" -Method Get -TimeoutSec 30
Invoke-WebRequest -Uri "https://stellaroid.tech/sitemap.xml" -Method Get -TimeoutSec 30
```

Proof sample checks:

```powershell
Invoke-WebRequest -Uri "https://stellaroid.tech/proof/c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3" -Method Get -TimeoutSec 30
Invoke-WebRequest -Uri "https://stellaroid.tech/proof/c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3/opengraph-image" -Method Get -TimeoutSec 30
Invoke-WebRequest -Uri "https://stellar.expert/explorer/testnet/contract/CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV" -Method Get -TimeoutSec 30
```

## Domain Continuity Check

Public docs now use `https://stellaroid.tech` as the canonical live URL. Recheck DNS and redirects during monthly review or after registrar changes:

```powershell
nslookup -type=NS stellaroid.tech 8.8.8.8
nslookup -type=A stellaroid.tech 8.8.8.8
nslookup -type=CNAME www.stellaroid.tech 8.8.8.8
nslookup -type=CNAME earn.stellaroid.tech 8.8.8.8
npx vercel domains inspect stellaroid.tech
npx vercel domains inspect www.stellaroid.tech
npx vercel domains inspect earn.stellaroid.tech
```

Then verify HTTP:

```powershell
Invoke-WebRequest -Uri "https://stellaroid.tech/" -Method Get -TimeoutSec 30
Invoke-WebRequest -Uri "https://www.stellaroid.tech/" -Method Get -MaximumRedirection 0 -TimeoutSec 30
Invoke-WebRequest -Uri "https://earn.stellaroid.tech/" -Method Get -MaximumRedirection 0 -TimeoutSec 30
```

Pass criteria are in `docs/operations/release-and-deployment.md`.

The Vercel fallback alias may still exist for recovery checks, but it should not be used as the public demo URL.

## Release Discipline

- Run lint, build, E2E, and `git diff --check` before any checkpoint commit.
- Keep pruned scratch research and staging artifacts out of canonical claims unless citations are normalized and claims are reverified.
- Never paste raw secrets into issues, commits, docs, or chat.
- Keep generated Playwright artifacts out of git.
- Commit only when the user explicitly asks for a checkpoint commit.
- Push only when the user explicitly asks for a push.

## Monthly Product Review

Answer these in a short issue or note:

- Is https://stellaroid.tech still live?
- Is the verified proof page still readable without a wallet?
- Are issuer pending/approved/locked states clear?
- Can the employer flow still start from a proof page?
- Do `www.stellaroid.tech` and `earn.stellaroid.tech` still redirect to the apex URL?
- What is the next single feature that makes this more useful to a real issuer or employer?
