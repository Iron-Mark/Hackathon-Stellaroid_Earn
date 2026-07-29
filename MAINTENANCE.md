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
Invoke-WebRequest -Uri "https://stellar.expert/explorer/testnet/contract/CA7P5EPYKC2IW4PCMAH6NRBLHH3WP7AN6WWC3QDRWO4HLE47FAGO6TET" -Method Get -TimeoutSec 30
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

## Held Dependency Majors

Two frontend majors are deliberately held back because the surrounding ecosystem cannot support them yet. Both holds are encoded as version-scoped `ignore` entries on the `/frontend` npm entry in [`.github/dependabot.yml`](.github/dependabot.yml), so Dependabot stops re-proposing them inside the grouped `npm-major` PR. Without the holds the group PR fails CI, which is what happened in #108.

| Package | Held at | Blocked version | Blocker |
| --- | --- | --- | --- |
| `typescript` | `^6.0.3` | `7.x` | `typescript-eslint` 8.65.0, bundled by `eslint-config-next` 16, does not support the TS 7.0 native compiler |
| `eslint` | `^9.39.5` | `10.x` | `eslint-plugin-react` 7.37.5, bundled by `eslint-config-next` 16, still calls the removed `context.getFilename()` |

### TypeScript 7.x

`@typescript-eslint/typescript-estree` (via `typescript-eslint` 8.65.0) declares:

```
SUPPORTED_TYPESCRIPT_VERSIONS = '>=4.8.4 <6.1.0'
```

TypeScript 7.0.2 falls outside that range, and the version guard reports:

```
ERROR: You are currently running a version of TypeScript which is not officially
supported by @typescript-eslint/typescript-estree.
* Supported TypeScript versions: >=4.8.4 <6.1.0
* Your TypeScript version: 7.0.2
```

The guard throws when its unsupported-version behavior is `error` and warns otherwise, so the practical result ranges from a hard lint failure to an unsupported-parser warning depending on configuration. Either way TS 7 is outside the supported range.

### ESLint 10.x

`eslint-plugin-react` 7.37.5 still calls `context.getFilename()`, which ESLint 10 removed:

- `lib/util/version.js:31` — `contextOrFilename.getFilename()`, the shared React-version detection helper imported by 10 rules
- `lib/rules/jsx-filename-extension.js:64` — `context.getFilename()`

Because the helper in `lib/util/version.js` is shared, the breakage is not limited to a single rule.

### Why version-scoped, not `update-types`

The ignores name the exact blocked major line (`versions: ["7.x"]`, `versions: ["10.x"]`) rather than using `update-types: [version-update:semver-major]`. A blanket major ignore would also suppress a future TypeScript 8 or ESLint 11 that may well be fine. Scoping to the known-bad line keeps later majors flowing normally.

### Known tradeoff: security updates are also suppressed

A `versions:` ignore suppresses **all** Dependabot updates matching that range, including security updates — and automated security fixes are enabled on this repo. A CVE fixed only in `typescript` 7.x or `eslint` 10.x would therefore not raise a PR. This is an accepted tradeoff, recorded here and in `.github/dependabot.yml` rather than left silent. Both packages are `devDependencies`, which limits but does not eliminate the exposure. Check advisories for these two manually during the monthly review while the holds stand.

### Revisit (noted 2026-07-29)

Re-test and remove the corresponding `ignore` entry when either upstream unblocks:

- `typescript-eslint` ships TypeScript 7 support (watch its `SUPPORTED_TYPESCRIPT_VERSIONS` range).
- `eslint-plugin-react` ships an ESLint 10 compatible release that drops `context.getFilename()`.

Verify with `npm run lint` and `npm run build` in `frontend/` before dropping a hold.

## Monthly Product Review

Answer these in a short issue or note:

- Is https://stellaroid.tech still live?
- Is the verified proof page still readable without a wallet?
- Are issuer pending/approved/locked states clear?
- Can the employer flow still start from a proof page?
- Do `www.stellaroid.tech` and `earn.stellaroid.tech` still redirect to the apex URL?
- Can either held major in "Held Dependency Majors" be unblocked yet, and are there open advisories against `typescript` 7.x or `eslint` 10.x that the version-scoped ignores would be hiding?
- What is the next single feature that makes this more useful to a real issuer or employer?
