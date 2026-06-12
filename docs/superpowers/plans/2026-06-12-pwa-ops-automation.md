# PWA Ops Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Phase 1 of the master plan: deterministic headless maintenance checks that make Stellaroid Earn demo readiness verifiable before PWA/offline code is added.

**Architecture:** Add Node 22 TypeScript scripts under `frontend/scripts/ops/`, expose them through `frontend/package.json`, and run them from a scheduled/manual GitHub Action. The scripts check public URLs, contract ID consistency, and security headers without adding a backend or changing product behavior.

**Tech Stack:** Next.js 15, React 19, Node 22 built-in TypeScript stripping, GitHub Actions, Stellar testnet URLs, existing `frontend` npm tooling.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `frontend/scripts/ops/common.ts` | Create | Shared HTTP check helpers, JSON report output, and process exit handling |
| `frontend/scripts/ops/health.ts` | Create | Check canonical app, status page, health API, proof page, proof OG image, and contract explorer URL |
| `frontend/scripts/ops/contract-drift.ts` | Create | Compare contract IDs found in README/docs with expected env values |
| `frontend/scripts/ops/headers.ts` | Create | Assert CSP and core security headers for public and embed routes |
| `frontend/package.json` | Modify | Add `ops:*` scripts using Node 22 TypeScript strip mode |
| `.github/workflows/maintenance.yml` | Create | Scheduled/manual maintenance workflow |
| `MAINTENANCE.md` | Modify | Replace manual-only checks with script-first commands |

## Task 1: Add Shared Ops Helpers

**Files:**
- Create: `frontend/scripts/ops/common.ts`

- [ ] **Step 1: Write the shared helper file**

```ts
export type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
  url?: string;
  status?: number;
  durationMs?: number;
};

export type HttpCheck = {
  name: string;
  url: string;
  method?: "GET" | "HEAD";
  expectedStatus?: number;
  timeoutMs?: number;
  validateText?: (text: string) => string | undefined;
  validateJson?: (json: unknown) => string | undefined;
};

export const DEFAULT_BASE_URL = process.env.OPS_BASE_URL ?? "https://stellaroid.tech";
export const DEFAULT_EXPLORER_URL =
  process.env.OPS_EXPLORER_URL ?? "https://stellar.expert/explorer/testnet";
export const DEFAULT_SAMPLE_HASH =
  process.env.OPS_SAMPLE_HASH ??
  "c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3";

export function absoluteUrl(pathOrUrl: string, baseUrl = DEFAULT_BASE_URL) {
  return pathOrUrl.startsWith("http") ? pathOrUrl : new URL(pathOrUrl, baseUrl).toString();
}

export async function checkHttp(check: HttpCheck): Promise<CheckResult> {
  const started = Date.now();
  const expectedStatus = check.expectedStatus ?? 200;
  try {
    const response = await fetch(check.url, {
      method: check.method ?? "GET",
      signal: AbortSignal.timeout(check.timeoutMs ?? 15_000),
      headers: { "User-Agent": "stellaroid-ops-check/1.0" },
    });
    const durationMs = Date.now() - started;
    if (response.status !== expectedStatus) {
      return {
        name: check.name,
        ok: false,
        url: check.url,
        status: response.status,
        durationMs,
        detail: `Expected HTTP ${expectedStatus}, received ${response.status}`,
      };
    }
    if (check.validateText) {
      const message = check.validateText(await response.text());
      if (message) {
        return { name: check.name, ok: false, url: check.url, status: response.status, durationMs, detail: message };
      }
    }
    if (check.validateJson) {
      const message = check.validateJson(await response.json());
      if (message) {
        return { name: check.name, ok: false, url: check.url, status: response.status, durationMs, detail: message };
      }
    }
    return { name: check.name, ok: true, url: check.url, status: response.status, durationMs, detail: "OK" };
  } catch (error) {
    return {
      name: check.name,
      ok: false,
      url: check.url,
      durationMs: Date.now() - started,
      detail: error instanceof Error ? error.message : "Request failed",
    };
  }
}

export function printReport(title: string, results: CheckResult[]) {
  const report = {
    title,
    generatedAt: new Date().toISOString(),
    ok: results.every((result) => result.ok),
    results,
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}
```

- [ ] **Step 2: Run the script type check**

Run: `cd frontend && npx tsc --noEmit --incremental false --pretty false`

Expected: TypeScript exits 0.

## Task 2: Add Health Check CLI

**Files:**
- Create: `frontend/scripts/ops/health.ts`

- [ ] **Step 1: Write the health CLI**

```ts
import {
  DEFAULT_BASE_URL,
  DEFAULT_EXPLORER_URL,
  DEFAULT_SAMPLE_HASH,
  absoluteUrl,
  checkHttp,
  printReport,
  type CheckResult,
} from "./common.ts";

function hasHealthShape(json: unknown) {
  if (!json || typeof json !== "object") return "Health API did not return an object";
  const status = (json as { status?: unknown }).status;
  if (status !== "healthy" && status !== "degraded" && status !== "down") {
    return "Health API status must be healthy, degraded, or down";
  }
  return undefined;
}

const expectedContractId = process.env.OPS_CONTRACT_ID ?? "";
const contractUrl = expectedContractId
  ? `${DEFAULT_EXPLORER_URL}/contract/${expectedContractId}`
  : undefined;

const results: CheckResult[] = [];

results.push(
  await checkHttp({ name: "Landing page", url: absoluteUrl("/") }),
  await checkHttp({ name: "Status page", url: absoluteUrl("/status") }),
  await checkHttp({
    name: "Health API",
    url: absoluteUrl("/api/health"),
    validateJson: hasHealthShape,
  }),
  await checkHttp({
    name: "Sample proof page",
    url: absoluteUrl(`/proof/${DEFAULT_SAMPLE_HASH}`),
    validateText: (text) =>
      text.includes(DEFAULT_SAMPLE_HASH.slice(0, 12)) || text.includes("Proof")
        ? undefined
        : "Proof page did not include proof content",
  }),
  await checkHttp({
    name: "Sample proof OG image",
    url: absoluteUrl(`/proof/${DEFAULT_SAMPLE_HASH}/opengraph-image`),
  }),
);

if (contractUrl) {
  results.push(await checkHttp({ name: "Contract explorer page", url: contractUrl }));
}

printReport("Stellaroid Earn health checks", results);
```

- [ ] **Step 2: Run the new CLI against production**

Run: `cd frontend && OPS_CONTRACT_ID=CDMUOHMARNVOJZM3IVOCJUPGBHDTHFBMZCCZXEZPQDVJGILH3NIKTTW3 node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types scripts/ops/health.ts`

Expected: JSON report prints with `"ok": true`.

## Task 3: Add Contract Drift CLI

**Files:**
- Create: `frontend/scripts/ops/contract-drift.ts`

- [ ] **Step 1: Write the drift CLI**

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { printReport, type CheckResult } from "./common.ts";

const root = resolve(import.meta.dirname, "../../..");
const expected = process.env.OPS_CONTRACT_ID ?? process.env.NEXT_PUBLIC_SOROBAN_CONTRACT_ID ?? "";
const contractPattern = /\bC[A-Z2-7]{55}\b/g;
const files = ["README.md", "MAINTENANCE.md", "docs/ARCHITECTURE.md"];

const results: CheckResult[] = [];

if (!expected) {
  results.push({
    name: "Expected contract ID",
    ok: false,
    detail: "Set OPS_CONTRACT_ID or NEXT_PUBLIC_SOROBAN_CONTRACT_ID",
  });
} else {
  for (const file of files) {
    const path = resolve(root, file);
    const ids = Array.from(new Set(readFileSync(path, "utf8").match(contractPattern) ?? []));
    const unexpected = ids.filter((id) => id !== expected);
    results.push({
      name: `${file} contract IDs`,
      ok: unexpected.length === 0,
      detail:
        unexpected.length === 0
          ? `All discovered contract IDs match ${expected}`
          : `Unexpected IDs: ${unexpected.join(", ")}`,
    });
  }
}

printReport("Stellaroid Earn contract drift", results);
```

- [ ] **Step 2: Run it with the expected current contract ID**

Run: `cd frontend && OPS_CONTRACT_ID=CDMUOHMARNVOJZM3IVOCJUPGBHDTHFBMZCCZXEZPQDVJGILH3NIKTTW3 node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types scripts/ops/contract-drift.ts`

Expected: JSON report prints. If it fails, update stale docs or intentionally adjust `OPS_CONTRACT_ID`.

## Task 4: Add Security Headers CLI

**Files:**
- Create: `frontend/scripts/ops/headers.ts`

- [ ] **Step 1: Write the headers CLI**

```ts
import {
  DEFAULT_SAMPLE_HASH,
  absoluteUrl,
  printReport,
  type CheckResult,
} from "./common.ts";

function headerIncludes(headers: Headers, name: string, expected: string) {
  const actual = headers.get(name);
  if (!actual) return `Missing ${name}`;
  return actual.includes(expected) ? undefined : `${name} did not include ${expected}; received ${actual}`;
}

async function checkHeaders(name: string, url: string, expectations: Array<[string, string]>): Promise<CheckResult> {
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "stellaroid-ops-check/1.0" },
    });
    const failures = expectations
      .map(([header, expected]) => headerIncludes(response.headers, header, expected))
      .filter(Boolean);
    return {
      name,
      url,
      status: response.status,
      ok: response.ok && failures.length === 0,
      detail: failures.length === 0 ? "OK" : failures.join("; "),
    };
  } catch (error) {
    return { name, url, ok: false, detail: error instanceof Error ? error.message : "Request failed" };
  }
}

const baseExpectations: Array<[string, string]> = [
  ["content-security-policy", "default-src 'self'"],
  ["x-content-type-options", "nosniff"],
  ["x-frame-options", "DENY"],
  ["referrer-policy", "strict-origin-when-cross-origin"],
  ["permissions-policy", "camera=()"],
  ["strict-transport-security", "max-age=63072000"],
];

const embedExpectations: Array<[string, string]> = [
  ["content-security-policy", "frame-ancestors *"],
  ["x-content-type-options", "nosniff"],
  ["referrer-policy", "strict-origin-when-cross-origin"],
];

const results = [
  await checkHeaders("Landing headers", absoluteUrl("/"), baseExpectations),
  await checkHeaders("Proof headers", absoluteUrl(`/proof/${DEFAULT_SAMPLE_HASH}`), baseExpectations),
  await checkHeaders(
    "Proof embed headers",
    absoluteUrl(`/proof/${DEFAULT_SAMPLE_HASH}/embed`),
    embedExpectations,
  ),
];

printReport("Stellaroid Earn security headers", results);
```

- [ ] **Step 2: Run the headers CLI**

Run: `cd frontend && node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types scripts/ops/headers.ts`

Expected: JSON report prints with `"ok": true`.

## Task 5: Wire npm Scripts

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Add ops scripts**

Change the `scripts` block to include these entries:

```json
{
  "ops:health": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types scripts/ops/health.ts",
  "ops:contract-drift": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types scripts/ops/contract-drift.ts",
  "ops:headers": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types scripts/ops/headers.ts",
  "ops:all": "npm run ops:health && npm run ops:contract-drift && npm run ops:headers"
}
```

- [ ] **Step 2: Verify package JSON remains valid**

Run: `cd frontend && node -e "JSON.parse(require('node:fs').readFileSync('package.json','utf8')); console.log('package.json ok')"`

Expected: `package.json ok`.

## Task 6: Add Scheduled Maintenance Workflow

**Files:**
- Create: `.github/workflows/maintenance.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: Maintenance Checks

on:
  workflow_dispatch:
  schedule:
    - cron: "17 21 * * 1,4"

permissions:
  contents: read

jobs:
  maintenance:
    name: Health, drift, and headers
    runs-on: ubuntu-latest
    timeout-minutes: 15
    defaults:
      run:
        working-directory: frontend

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run deterministic ops checks
        env:
          OPS_CONTRACT_ID: CDMUOHMARNVOJZM3IVOCJUPGBHDTHFBMZCCZXEZPQDVJGILH3NIKTTW3
        run: npm run ops:all
```

- [ ] **Step 2: Verify workflow YAML is readable**

Run: `ruby -e "require 'yaml'; YAML.load_file('.github/workflows/maintenance.yml'); puts 'workflow yaml ok'"`

Expected: `workflow yaml ok`.

## Task 7: Update Maintenance Runbook

**Files:**
- Modify: `MAINTENANCE.md`

- [ ] **Step 1: Add script-first weekly checks**

Add this section after the opening paragraph:

````md
## Script-First Weekly Check

Run from the repo root:

```powershell
cd frontend
$env:OPS_CONTRACT_ID="CDMUOHMARNVOJZM3IVOCJUPGBHDTHFBMZCCZXEZPQDVJGILH3NIKTTW3"
npm run ops:all
```

Use manual browser checks only when the script reports a failure or when preparing a live demo.
````

- [ ] **Step 2: Keep the existing manual commands**

Do not delete the current manual commands. They remain useful for demo-day confirmation and domain debugging.

## Task 8: Verification and Commit

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run local validation**

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 2: Run frontend checks**

Run: `cd frontend && npm run lint && npm run build && npm run test:unit`

Expected: lint exits 0, build exits 0, unit tests exit 0.

- [ ] **Step 3: Run ops checks**

Run: `cd frontend && OPS_CONTRACT_ID=CDMUOHMARNVOJZM3IVOCJUPGBHDTHFBMZCCZXEZPQDVJGILH3NIKTTW3 npm run ops:all`

Expected: JSON reports print with `"ok": true`.

- [ ] **Step 4: Commit**

```bash
git add frontend/scripts/ops/common.ts frontend/scripts/ops/health.ts frontend/scripts/ops/contract-drift.ts frontend/scripts/ops/headers.ts frontend/package.json .github/workflows/maintenance.yml MAINTENANCE.md
git commit -m "chore: add deterministic maintenance checks"
```

## Follow-On PWA Plan

After Phase 1 lands, create a separate plan for:

- `frontend/src/app/offline/page.tsx`
- service worker registration in `frontend/src/app/layout.tsx`
- `/sw.js` headers in `frontend/next.config.ts`
- middleware matcher updates in `frontend/src/middleware.ts`
- stale proof UI in `frontend/src/components/proof/offline-proof-banner.tsx`
- Playwright coverage for offline proof fallback
