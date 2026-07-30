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

## Held Dependency Majors

Three frontend dependencies are deliberately held back because the surrounding ecosystem cannot support them yet. All three holds are encoded as version-scoped `ignore` entries on the `/frontend` npm entry in [`.github/dependabot.yml`](.github/dependabot.yml), so Dependabot stops re-proposing them. Without the holds the grouped PR fails CI, which is what happened in #108 (majors) and #119 (minor/patch).

The section title is historical — the first two holds were majors. The `@modelcontextprotocol/sdk` hold added 2026-07-29 is a *minor* bump that is equally unmergeable, so "held dependency" is the accurate reading.

| Package | Held at | Blocked version | Blocker |
| --- | --- | --- | --- |
| `typescript` | `^6.0.3` | `7.x` | `typescript-eslint` 8.65.0, bundled by `eslint-config-next` 16, does not support the TS 7.0 native compiler |
| `eslint` | `^9.39.5` | `10.x` | `eslint-plugin-react` 7.37.5, bundled by `eslint-config-next` 16, still calls the removed `context.getFilename()` |
| `@modelcontextprotocol/sdk` | `1.26.0` (exact) | `>1.26.0` | `mcp-handler` 1.1.0, the latest release, declares an exact peer on `@modelcontextprotocol/sdk@1.26.0` |

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

### `@modelcontextprotocol/sdk` above 1.26.0

`mcp-handler` 1.1.0 declares an **exact** peer, not a range:

```
"peerDependencies": { "next": ">=13.0.0", "@modelcontextprotocol/sdk": "1.26.0" }
```

So any bump off 1.26.0 fails `npm ci` outright. Dependabot #119 proposed 1.26.0 -> 1.30.0 and the install step failed with:

```
npm error code ERESOLVE
npm error ERESOLVE could not resolve
npm error While resolving: mcp-handler@1.1.0
npm error Found: @modelcontextprotocol/sdk@1.30.0
npm error Could not resolve dependency:
npm error peer @modelcontextprotocol/sdk@"1.26.0" from mcp-handler@1.1.0
```

This hold differs from the other two in an important way: **there is no upgrade path to wait for.** 1.1.0 is the newest `mcp-handler` (published line: 1.0.5, 1.0.6, 1.0.7, 1.1.0) and it still hard-pins the exact peer, so no combination of currently published versions satisfies a bump. Bumping the SDK requires `mcp-handler` to relax the peer first.

Verify the blocker is still real before touching the hold:

```powershell
npm view mcp-handler version
npm view mcp-handler@1.1.0 peerDependencies
```

### Why version-scoped, not `update-types`

The ignores name the narrowest range that actually breaks (`versions: ["7.x"]`, `versions: ["10.x"]`, `versions: [">1.26.0"]`) rather than using `update-types: [version-update:semver-major]`. A blanket major ignore would also suppress a future TypeScript 8 or ESLint 11 that may well be fine, and would not have caught #119 at all — that was a *minor* bump inside the `npm-minor-patch` group, which no major-scoped rule would touch.

One consequence worth being explicit about: the `typescript` and `eslint` holds self-expire, because they name a single major line. The `@modelcontextprotocol/sdk` hold does not — `>1.26.0` matches every future release, since every future release breaks the exact peer. It has to be removed by hand, and the monthly review below is the checkpoint that catches it.

### Known tradeoff: security updates are also suppressed

A `versions:` ignore suppresses **all** Dependabot updates matching that range, including security updates — and automated security fixes are enabled on this repo. A CVE fixed only in `typescript` 7.x, `eslint` 10.x, or `@modelcontextprotocol/sdk` above 1.26.0 would therefore not raise a PR. This is an accepted tradeoff, recorded here and in `.github/dependabot.yml` rather than left silent. Check advisories for all three manually during the monthly review while the holds stand.

The three are not equally exposed. `typescript` and `eslint` are `devDependencies`, which limits but does not eliminate the risk. `@modelcontextprotocol/sdk` is a **runtime `dependency`**, and its hold covers every version above 1.26.0 rather than one major line, so it is the sharpest of the three: an SDK advisory fixed in any later release would be silently suppressed. If that happens, the fix is not to widen the ignore — it is to unblock or replace `mcp-handler`, since the exact peer is what pins the SDK in the first place.

### Revisit (noted 2026-07-29)

Re-test and remove the corresponding `ignore` entry when the upstream unblocks:

- `typescript-eslint` ships TypeScript 7 support (watch its `SUPPORTED_TYPESCRIPT_VERSIONS` range).
- `eslint-plugin-react` ships an ESLint 10 compatible release that drops `context.getFilename()`.
- `mcp-handler` relaxes its exact `@modelcontextprotocol/sdk@1.26.0` peer to a range, or ships a release that supports a newer SDK.

Verify with `npm run lint` and `npm run build` in `frontend/` before dropping a hold.

## Monthly Product Review

Answer these in a short issue or note:

- Is https://stellaroid.tech still live?
- Is the verified proof page still readable without a wallet?
- Are issuer pending/approved/locked states clear?
- Can the employer flow still start from a proof page?
- Do `www.stellaroid.tech` and `earn.stellaroid.tech` still redirect to the apex URL?
- Can any of the three holds in "Held Dependency Majors" be unblocked yet, and are there open advisories against `typescript` 7.x, `eslint` 10.x, or `@modelcontextprotocol/sdk` above 1.26.0 that the version-scoped ignores would be hiding? Check `npm view mcp-handler@latest peerDependencies` for the SDK one specifically — it will not clear itself.
- What is the next single feature that makes this more useful to a real issuer or employer?
