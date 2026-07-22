# /start "Try it in 60 seconds" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a shareable `/start` wizard that gets a first-time visitor to connect a wallet, fund it, and sign one real Stellar testnet transaction in about a minute, then hands them into the feedback Form.

**Architecture:** A single client-rendered route (`app/start/page.tsx`) drives a linear step machine (`useStartFlow`). Steps are small presentational components. All chain work reuses the existing wallet layer (`useFreighterWallet`) and `contract-client` (`registerIssuer`, `linkPayment`); the only new chain call is a friendbot funding helper. No new contract methods.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind v4 tokens, `@stellar/stellar-sdk` (indirect, via contract-client), Playwright (e2e), `node:test` (unit).

## Global Constraints

- **Testnet only.** No mainnet paths. The wallet must report the expected network before any signature.
- **No new contract methods.** Reuse `registerIssuer` and `linkPayment` from `lib/contract-client.ts`.
- **First cut is English-only.** Do NOT thread i18n through `/start` yet (spec Out-of-scope).
- **Copy style:** no em dashes (use " - " or a period); say "graduate" not "student" in user-facing copy; always qualify money as testnet XLM with no real value.
- **Client component:** `/start` and its steps are `"use client"` (wallet is browser-only).
- **Unit tests** use `node:test` + `node:assert/strict` in `*.test.ts` beside the source (run via `npm run test:unit`). **Flow tests** use Playwright in `frontend/e2e/`.
- **Commits:** conventional style, no `Co-Authored-By` trailer.
- **Concrete values (verified live 2026-07-22):**
  - Sample verified credential hash: `c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3`
  - That credential's graduate (tip recipient, `cert.owner`): `GALGZZRXRB5SIBGT62OZDA7BMPC4YUZDECHVHGWOAMXIMNLTZGFGTLMN`
  - Friendbot: `https://friendbot.stellar.org/?addr=<G...>`
  - 1 XLM = `10_000_000` stroops (i128)
  - Explorer tx link: `` `${appConfig.explorerUrl}/tx/${hash}` ``
  - Feedback Form: `https://docs.google.com/forms/d/e/1FAIpQLSftFt8grSRUPecRVQWSRROLA8DAUOn4T61CrZQHtPQaMTxaWw/viewform`

---

## File Structure

**New:**
- `frontend/src/lib/friendbot.ts` - testnet funding helper.
- `frontend/src/lib/friendbot.test.ts` - unit tests.
- `frontend/src/lib/start-flow.ts` - constants + the two action wrappers + tx-link/Form-link builders.
- `frontend/src/lib/start-flow.test.ts` - unit tests.
- `frontend/src/app/start/use-start-flow.ts` - the step-machine reducer + hook.
- `frontend/src/app/start/use-start-flow.test.ts` - reducer unit tests.
- `frontend/src/app/start/page.tsx` - the route.
- `frontend/src/components/start/step-shell.tsx` - shared shell (indicator + heading + focus).
- `frontend/src/components/start/welcome-step.tsx`
- `frontend/src/components/start/connect-step.tsx`
- `frontend/src/components/start/fund-step.tsx`
- `frontend/src/components/start/action-step.tsx`
- `frontend/src/components/start/signing-step.tsx`
- `frontend/src/components/start/success-step.tsx`

**Modify:**
- `frontend/src/app/demo/page.tsx` - CTA links to `/start`.
- `frontend/src/components/landing/*` (hero) - secondary CTA to `/start`.
- `frontend/src/app/sitemap.xml/route.ts` - add `/start`.
- `frontend/e2e/` - new spec for the flow.

Testing note: the codebase unit-tests **logic** (node:test) and flow-tests **UI** (Playwright); it has no React component unit tests. So Tasks 1-3 are TDD; the UI tasks (4-8) verify via `tsc`/`lint`/`build` and are covered end-to-end by the Playwright test in Task 10.

---

### Task 1: Friendbot funding helper

**Files:**
- Create: `frontend/src/lib/friendbot.ts`
- Test: `frontend/src/lib/friendbot.test.ts`

**Interfaces:**
- Produces: `fundTestnetAccount(address: string, fetchImpl?: typeof fetch): Promise<FundResult>` where `type FundResult = { ok: true; alreadyFunded: boolean } | { ok: false; reason: "already-funded" | "rate-limited" | "network" | "bad-address"; message: string }`. `friendbotUrl(address: string): string`.

- [ ] **Step 1: Write the failing test**

```ts
// frontend/src/lib/friendbot.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { friendbotUrl, fundTestnetAccount } from "./friendbot.ts";

test("friendbotUrl encodes the address", () => {
  assert.equal(
    friendbotUrl("GABC"),
    "https://friendbot.stellar.org/?addr=GABC",
  );
});

test("fundTestnetAccount returns ok on 200", async () => {
  const fakeFetch = async () => new Response("{}", { status: 200 });
  const r = await fundTestnetAccount("GABC", fakeFetch as typeof fetch);
  assert.deepEqual(r, { ok: true, alreadyFunded: false });
});

test("fundTestnetAccount treats op_already_exists as already funded", async () => {
  const body = JSON.stringify({ detail: "op_already_exists" });
  const fakeFetch = async () => new Response(body, { status: 400 });
  const r = await fundTestnetAccount("GABC", fakeFetch as typeof fetch);
  assert.deepEqual(r, { ok: true, alreadyFunded: true });
});

test("fundTestnetAccount reports rate-limit on 429", async () => {
  const fakeFetch = async () => new Response("", { status: 429 });
  const r = await fundTestnetAccount("GABC", fakeFetch as typeof fetch);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "rate-limited");
});

test("fundTestnetAccount reports network on throw", async () => {
  const fakeFetch = async () => {
    throw new Error("offline");
  };
  const r = await fundTestnetAccount("GABC", fakeFetch as typeof fetch);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "network");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx tsx --test src/lib/friendbot.test.ts`
Expected: FAIL - cannot find module `./friendbot.ts`.

- [ ] **Step 3: Write minimal implementation**

```ts
// frontend/src/lib/friendbot.ts
export type FundResult =
  | { ok: true; alreadyFunded: boolean }
  | {
      ok: false;
      reason: "already-funded" | "rate-limited" | "network" | "bad-address";
      message: string;
    };

const STELLAR_ADDRESS_RE = /^G[A-Z2-7]{55}$/;

export function friendbotUrl(address: string): string {
  return `https://friendbot.stellar.org/?addr=${encodeURIComponent(address)}`;
}

export async function fundTestnetAccount(
  address: string,
  fetchImpl: typeof fetch = fetch,
): Promise<FundResult> {
  if (!STELLAR_ADDRESS_RE.test(address)) {
    return { ok: false, reason: "bad-address", message: "Invalid testnet address." };
  }
  try {
    const res = await fetchImpl(friendbotUrl(address));
    if (res.status === 200) return { ok: true, alreadyFunded: false };
    if (res.status === 429) {
      return {
        ok: false,
        reason: "rate-limited",
        message: "Friendbot is busy right now. Wait a moment and try again.",
      };
    }
    const text = await res.text().catch(() => "");
    if (text.includes("op_already_exists") || text.includes("already funded")) {
      return { ok: true, alreadyFunded: true };
    }
    return {
      ok: false,
      reason: "network",
      message: "Could not reach the testnet faucet. Try again in a moment.",
    };
  } catch {
    return {
      ok: false,
      reason: "network",
      message: "Could not reach the testnet faucet. Check your connection and retry.",
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx tsx --test src/lib/friendbot.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/friendbot.ts frontend/src/lib/friendbot.test.ts
git commit -m "feat(start): friendbot testnet funding helper"
```

---

### Task 2: Start-flow constants + action wrappers

**Files:**
- Create: `frontend/src/lib/start-flow.ts`
- Test: `frontend/src/lib/start-flow.test.ts`

**Interfaces:**
- Consumes: `registerIssuer`, `linkPayment` from `./contract-client`; `appConfig` from `./config`.
- Produces:
  - `TIP_RECIPIENT`, `TIP_CERT_HASH` constants.
  - `xlmToStroops(xlm: number): bigint`.
  - `explorerTxUrl(hash: string): string`.
  - `feedbackFormUrl(address: string): string`.
  - `registerIssuerAction(address: string, name: string, category: string): Promise<{ hash: string }>`.
  - `sendTipAction(address: string, xlm: number): Promise<{ hash: string }>`.

- [ ] **Step 1: Write the failing test**

```ts
// frontend/src/lib/start-flow.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { xlmToStroops, explorerTxUrl, feedbackFormUrl, TIP_RECIPIENT } from "./start-flow.ts";

test("xlmToStroops converts to i128 stroops", () => {
  assert.equal(xlmToStroops(1), 10_000_000n);
  assert.equal(xlmToStroops(5), 50_000_000n);
});

test("explorerTxUrl builds a tx link", () => {
  assert.ok(explorerTxUrl("abc").endsWith("/tx/abc"));
});

test("feedbackFormUrl includes the wallet address", () => {
  const url = feedbackFormUrl("GALGZZRX");
  assert.ok(url.includes("docs.google.com/forms"));
  assert.ok(url.includes("GALGZZRX"));
});

test("TIP_RECIPIENT is the seeded graduate", () => {
  assert.equal(TIP_RECIPIENT, "GALGZZRXRB5SIBGT62OZDA7BMPC4YUZDECHVHGWOAMXIMNLTZGFGTLMN");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx tsx --test src/lib/start-flow.test.ts`
Expected: FAIL - cannot find module `./start-flow.ts`.

- [ ] **Step 3: Write minimal implementation**

```ts
// frontend/src/lib/start-flow.ts
import { appConfig } from "./config";
import { registerIssuer, linkPayment } from "./contract-client";

// The seeded, verified demo credential and its graduate (cert.owner). The tip
// action pays this graduate against this credential; the contract enforces
// cert.owner == recipient, so these must stay in sync with the live exhibit.
export const TIP_CERT_HASH =
  "c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3";
export const TIP_RECIPIENT =
  "GALGZZRXRB5SIBGT62OZDA7BMPC4YUZDECHVHGWOAMXIMNLTZGFGTLMN";

// Feedback Form; prefill entry id is filled in Task 7 (fall back to plain link).
const FEEDBACK_FORM_BASE =
  "https://docs.google.com/forms/d/e/1FAIpQLSftFt8grSRUPecRVQWSRROLA8DAUOn4T61CrZQHtPQaMTxaWw/viewform";
// Replace WALLET_ENTRY_ID in Task 7 once obtained from the Form's prefill link.
const WALLET_ENTRY_ID = "";

export function xlmToStroops(xlm: number): bigint {
  return BigInt(Math.round(xlm * 10_000_000));
}

export function explorerTxUrl(hash: string): string {
  return `${appConfig.explorerUrl}/tx/${hash}`;
}

export function feedbackFormUrl(address: string): string {
  if (!WALLET_ENTRY_ID) {
    return `${FEEDBACK_FORM_BASE}?usp=pp_url`;
  }
  return `${FEEDBACK_FORM_BASE}?usp=pp_url&${WALLET_ENTRY_ID}=${encodeURIComponent(address)}`;
}

export async function registerIssuerAction(
  address: string,
  name: string,
  category: string,
): Promise<{ hash: string }> {
  const res = await registerIssuer(address, name, "", category);
  return { hash: res.hash };
}

export async function sendTipAction(
  address: string,
  xlm: number,
): Promise<{ hash: string }> {
  const res = await linkPayment(address, TIP_RECIPIENT, TIP_CERT_HASH, xlmToStroops(xlm));
  return { hash: res.hash };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx tsx --test src/lib/start-flow.test.ts`
Expected: PASS (4 tests).

Note: if `tsc` reports `res.hash` is possibly-undefined, change the return to `{ hash: res.hash ?? "" }` and let the caller treat an empty hash as an error (Task 7 already links only when `txHash` is truthy).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/start-flow.ts frontend/src/lib/start-flow.test.ts
git commit -m "feat(start): action wrappers, stroops + link builders"
```

---

### Task 3: The step-machine reducer

**Files:**
- Create: `frontend/src/app/start/use-start-flow.ts`
- Test: `frontend/src/app/start/use-start-flow.test.ts`

**Interfaces:**
- Produces:
  - `type Step = "welcome" | "connect" | "fund" | "action" | "signing" | "success"`.
  - `type FlowState = { step: Step; action: "issuer" | "tip" | null; issuerName: string; issuerCategory: string; tipXlm: number; txHash: string | null; error: string | null }`.
  - `startReducer(state, event)` reducer + `initialFlowState`.
  - Events: `{type:"START"}`, `{type:"CONNECTED"}`, `{type:"FUNDED"}`, `{type:"CHOOSE_ACTION"; action}`, `{type:"SET_FIELD"; key; value}`, `{type:"SUBMIT"}`, `{type:"SUCCESS"; hash}`, `{type:"ERROR"; message}`, `{type:"RETRY"}`, `{type:"RESET"}`.

- [ ] **Step 1: Write the failing test**

```ts
// frontend/src/app/start/use-start-flow.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { startReducer, initialFlowState } from "./use-start-flow.ts";

test("START moves welcome -> connect", () => {
  const s = startReducer(initialFlowState, { type: "START" });
  assert.equal(s.step, "connect");
});

test("CONNECTED -> fund, FUNDED -> action", () => {
  let s = startReducer({ ...initialFlowState, step: "connect" }, { type: "CONNECTED" });
  assert.equal(s.step, "fund");
  s = startReducer(s, { type: "FUNDED" });
  assert.equal(s.step, "action");
});

test("CHOOSE_ACTION records the action and stays on action step", () => {
  const s = startReducer(
    { ...initialFlowState, step: "action" },
    { type: "CHOOSE_ACTION", action: "tip" },
  );
  assert.equal(s.action, "tip");
  assert.equal(s.step, "action");
});

test("SUBMIT -> signing, SUCCESS -> success with hash", () => {
  let s = startReducer({ ...initialFlowState, step: "action", action: "issuer" }, { type: "SUBMIT" });
  assert.equal(s.step, "signing");
  s = startReducer(s, { type: "SUCCESS", hash: "H1" });
  assert.equal(s.step, "success");
  assert.equal(s.txHash, "H1");
});

test("ERROR returns to action with a message; RETRY clears it", () => {
  let s = startReducer({ ...initialFlowState, step: "signing", action: "issuer" }, { type: "ERROR", message: "declined" });
  assert.equal(s.step, "action");
  assert.equal(s.error, "declined");
  s = startReducer(s, { type: "RETRY" });
  assert.equal(s.error, null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx tsx --test src/app/start/use-start-flow.test.ts`
Expected: FAIL - cannot find module.

- [ ] **Step 3: Write minimal implementation**

```ts
// frontend/src/app/start/use-start-flow.ts
"use client";
import { useReducer } from "react";

export type Step = "welcome" | "connect" | "fund" | "action" | "signing" | "success";
export type FlowAction = "issuer" | "tip";

export type FlowState = {
  step: Step;
  action: FlowAction | null;
  issuerName: string;
  issuerCategory: string;
  tipXlm: number;
  txHash: string | null;
  error: string | null;
};

export type FlowEvent =
  | { type: "START" }
  | { type: "CONNECTED" }
  | { type: "FUNDED" }
  | { type: "CHOOSE_ACTION"; action: FlowAction }
  | { type: "SET_FIELD"; key: "issuerName" | "issuerCategory" | "tipXlm"; value: string | number }
  | { type: "SUBMIT" }
  | { type: "SUCCESS"; hash: string }
  | { type: "ERROR"; message: string }
  | { type: "RETRY" }
  | { type: "RESET" };

export const initialFlowState: FlowState = {
  step: "welcome",
  action: null,
  issuerName: "",
  issuerCategory: "",
  tipXlm: 1,
  txHash: null,
  error: null,
};

export function startReducer(state: FlowState, event: FlowEvent): FlowState {
  switch (event.type) {
    case "START":
      return { ...state, step: "connect" };
    case "CONNECTED":
      return { ...state, step: "fund" };
    case "FUNDED":
      return { ...state, step: "action" };
    case "CHOOSE_ACTION":
      return { ...state, action: event.action, error: null };
    case "SET_FIELD":
      return { ...state, [event.key]: event.value };
    case "SUBMIT":
      return { ...state, step: "signing", error: null };
    case "SUCCESS":
      return { ...state, step: "success", txHash: event.hash };
    case "ERROR":
      return { ...state, step: "action", error: event.message };
    case "RETRY":
      return { ...state, error: null };
    case "RESET":
      return { ...initialFlowState };
    default:
      return state;
  }
}

export function useStartFlow() {
  return useReducer(startReducer, initialFlowState);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx tsx --test src/app/start/use-start-flow.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/start/use-start-flow.ts frontend/src/app/start/use-start-flow.test.ts
git commit -m "feat(start): step-machine reducer + hook"
```

---

### Task 4: StepShell + Welcome + Connect steps

**Files:**
- Create: `frontend/src/components/start/step-shell.tsx`, `welcome-step.tsx`, `connect-step.tsx`

**Interfaces:**
- Consumes: `useFreighterWallet` (`{ wallet, connectWallet, availableProviders, isMobileBrowser }`); `FlowEvent` dispatch.
- Produces: `StepShell({ stepIndex, total, title, children })`; `WelcomeStep({ onStart })`; `ConnectStep({ onConnected })`.

- [ ] **Step 1: StepShell** (focus + `aria-live` + indicator)

```tsx
// frontend/src/components/start/step-shell.tsx
"use client";
import { useEffect, useRef } from "react";

export function StepShell({
  stepIndex,
  total,
  title,
  children,
}: {
  stepIndex: number;
  total: number;
  title: string;
  children: React.ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [stepIndex]);
  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-border bg-surface p-6">
      <p className="font-pixel text-[10px] uppercase tracking-[0.16em] text-text-muted">
        Step {stepIndex} of {total}
      </p>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-2 text-2xl font-semibold text-text outline-none"
      >
        {title}
      </h1>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}
```

- [ ] **Step 2: WelcomeStep**

```tsx
// frontend/src/components/start/welcome-step.tsx
"use client";
import { StepShell } from "./step-shell";

export function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <StepShell stepIndex={1} total={5} title="Do something real on Stellar in ~60 seconds">
      <p className="text-sm leading-relaxed text-text-muted">
        Free, no signup, testnet only. Connect a wallet, we fund it for you, then
        you sign one real on-chain action. Every amount is Stellar testnet XLM with
        no real-world value.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-primary"
      >
        Start
      </button>
    </StepShell>
  );
}
```

- [ ] **Step 3: ConnectStep** (reuses wallet layer; advances on connect)

```tsx
// frontend/src/components/start/connect-step.tsx
"use client";
import { useEffect } from "react";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { StepShell } from "./step-shell";

export function ConnectStep({ onConnected }: { onConnected: () => void }) {
  const { wallet, connectWallet, availableProviders, isMobileBrowser } = useFreighterWallet();

  useEffect(() => {
    if (wallet.status === "connected" && wallet.address) onConnected();
  }, [wallet.status, wallet.address, onConnected]);

  return (
    <StepShell stepIndex={2} total={5} title="Connect a wallet to sign">
      <p className="text-sm leading-relaxed text-text-muted">
        {isMobileBrowser
          ? "On mobile? Use WalletConnect or Albedo, no install needed."
          : "Use the Freighter extension, or Albedo which works in any browser."}
      </p>
      <div className="flex flex-col gap-2.5">
        {availableProviders.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => void connectWallet(p.id)}
            className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-primary ${
              i === 0
                ? "bg-primary text-on-primary"
                : "border border-border text-text"
            }`}
          >
            Connect {p.label}
          </button>
        ))}
      </div>
      {wallet.status === "connecting" && (
        <p aria-live="polite" className="text-xs text-text-muted">
          Opening your wallet...
        </p>
      )}
    </StepShell>
  );
}
```

- [ ] **Step 4: Verify typecheck + lint**

Run: `cd frontend && npx tsc --noEmit && npx eslint src/components/start/`
Expected: exit 0 for both. (`WalletProviderMeta` has `id` and `label` - see `lib/wallet/types.ts`.)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/start/step-shell.tsx frontend/src/components/start/welcome-step.tsx frontend/src/components/start/connect-step.tsx
git commit -m "feat(start): shell, welcome, and connect steps"
```

---

### Task 5: Fund step

**Files:**
- Create: `frontend/src/components/start/fund-step.tsx`

**Interfaces:**
- Consumes: `useFreighterWallet` (`wallet.isExpectedNetwork`, `wallet.address`); `fundTestnetAccount` from `@/lib/friendbot`.
- Produces: `FundStep({ onFunded })`.

- [ ] **Step 1: Implement FundStep**

```tsx
// frontend/src/components/start/fund-step.tsx
"use client";
import { useState } from "react";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { fundTestnetAccount } from "@/lib/friendbot";
import { StepShell } from "./step-shell";

export function FundStep({ onFunded }: { onFunded: () => void }) {
  const { wallet } = useFreighterWallet();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!wallet.isExpectedNetwork) {
    return (
      <StepShell stepIndex={3} total={5} title="Switch your wallet to Testnet">
        <p aria-live="polite" className="text-sm leading-relaxed text-text-muted">
          Your wallet is on a different network. Switch it to Stellar Testnet, then
          come back to this step.
        </p>
      </StepShell>
    );
  }

  async function fund() {
    if (!wallet.address) return;
    setBusy(true);
    setMsg(null);
    const r = await fundTestnetAccount(wallet.address);
    setBusy(false);
    if (r.ok) {
      onFunded();
    } else {
      setMsg(r.message);
    }
  }

  return (
    <StepShell stepIndex={3} total={5} title="Get free testnet XLM">
      <p className="text-sm leading-relaxed text-text-muted">
        We will fund your wallet with free Stellar testnet XLM (no real value) so
        you can pay the tiny network fee. One click.
      </p>
      <button
        type="button"
        onClick={() => void fund()}
        disabled={busy}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-primary"
      >
        {busy ? "Funding..." : "Get free testnet XLM"}
      </button>
      <button
        type="button"
        onClick={onFunded}
        className="text-xs text-text-muted underline"
      >
        Already funded? Skip
      </button>
      {msg && (
        <p aria-live="polite" className="text-xs text-danger">
          {msg}
        </p>
      )}
    </StepShell>
  );
}
```

- [ ] **Step 2: Verify typecheck + lint**

Run: `cd frontend && npx tsc --noEmit && npx eslint src/components/start/fund-step.tsx`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/start/fund-step.tsx
git commit -m "feat(start): one-click friendbot funding step"
```

---

### Task 6: Action step (two cards + mini forms + submit)

**Files:**
- Create: `frontend/src/components/start/action-step.tsx`

**Interfaces:**
- Consumes: `useFreighterWallet` (`wallet.address`); `registerIssuerAction`, `sendTipAction` from `@/lib/start-flow`; `humanizeError` from `@/lib/errors`; the flow `state` + `dispatch`.
- Produces: `ActionStep({ state, dispatch })` where `state`/`dispatch` are from `useStartFlow`.

- [ ] **Step 1: Implement ActionStep**

```tsx
// frontend/src/components/start/action-step.tsx
"use client";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { humanizeError } from "@/lib/errors";
import { registerIssuerAction, sendTipAction } from "@/lib/start-flow";
import { StepShell } from "./step-shell";
import type { FlowEvent, FlowState } from "@/app/start/use-start-flow";

export function ActionStep({
  state,
  dispatch,
}: {
  state: FlowState;
  dispatch: (e: FlowEvent) => void;
}) {
  const { wallet } = useFreighterWallet();

  async function run() {
    if (!wallet.address) return;
    dispatch({ type: "SUBMIT" });
    try {
      const res =
        state.action === "tip"
          ? await sendTipAction(wallet.address, state.tipXlm)
          : await registerIssuerAction(wallet.address, state.issuerName.trim(), state.issuerCategory.trim());
      dispatch({ type: "SUCCESS", hash: res.hash });
    } catch (err) {
      dispatch({ type: "ERROR", message: humanizeError(err).detail });
    }
  }

  const canSubmit =
    state.action === "tip"
      ? state.tipXlm > 0
      : state.issuerName.trim().length > 1 && state.issuerCategory.trim().length > 0;

  return (
    <StepShell stepIndex={4} total={5} title="Pick one thing to do on-chain">
      {state.error && (
        <p aria-live="polite" className="text-xs text-danger">
          {state.error}
        </p>
      )}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => dispatch({ type: "CHOOSE_ACTION", action: "issuer" })}
          aria-pressed={state.action === "issuer"}
          className={`rounded-xl border p-4 text-left ${state.action === "issuer" ? "border-primary bg-primary/10" : "border-border"}`}
        >
          <span className="block text-sm font-semibold text-text">Register your org as an issuer</span>
          <span className="block text-xs text-text-muted">Put your organization on-chain as a credential issuer.</span>
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "CHOOSE_ACTION", action: "tip" })}
          aria-pressed={state.action === "tip"}
          className={`rounded-xl border p-4 text-left ${state.action === "tip" ? "border-primary bg-primary/10" : "border-border"}`}
        >
          <span className="block text-sm font-semibold text-text">Send a testnet tip to a graduate</span>
          <span className="block text-xs text-text-muted">Pay testnet XLM against a verified credential.</span>
        </button>
      </div>

      {state.action === "issuer" && (
        <div className="flex flex-col gap-2">
          <input
            aria-label="Organization name"
            placeholder="Organization name"
            value={state.issuerName}
            onChange={(e) => dispatch({ type: "SET_FIELD", key: "issuerName", value: e.target.value })}
            className="min-h-11 rounded-lg border border-border bg-surface-2 px-3 text-sm text-text"
          />
          <input
            aria-label="Category"
            placeholder="Category (e.g. Bootcamp, University)"
            value={state.issuerCategory}
            onChange={(e) => dispatch({ type: "SET_FIELD", key: "issuerCategory", value: e.target.value })}
            className="min-h-11 rounded-lg border border-border bg-surface-2 px-3 text-sm text-text"
          />
        </div>
      )}

      {state.action === "tip" && (
        <div className="flex gap-2" role="group" aria-label="Tip amount">
          {[1, 5, 10].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => dispatch({ type: "SET_FIELD", key: "tipXlm", value: amt })}
              aria-pressed={state.tipXlm === amt}
              className={`min-h-11 flex-1 rounded-lg border text-sm font-semibold ${state.tipXlm === amt ? "border-primary bg-primary/10 text-primary" : "border-border text-text"}`}
            >
              {amt} XLM
            </button>
          ))}
        </div>
      )}

      {state.action && (
        <button
          type="button"
          onClick={() => void run()}
          disabled={!canSubmit}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-primary"
        >
          Sign it
        </button>
      )}
    </StepShell>
  );
}
```

- [ ] **Step 2: Verify typecheck + lint**

Run: `cd frontend && npx tsc --noEmit && npx eslint src/components/start/action-step.tsx`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/start/action-step.tsx
git commit -m "feat(start): action step with the two light actions"
```

---

### Task 7: Signing + Success steps (and the Form prefill)

**Files:**
- Create: `frontend/src/components/start/signing-step.tsx`, `success-step.tsx`
- Modify: `frontend/src/lib/start-flow.ts` (set `WALLET_ENTRY_ID`)

**Interfaces:**
- Consumes: `explorerTxUrl`, `feedbackFormUrl` from `@/lib/start-flow`.
- Produces: `SigningStep()`; `SuccessStep({ txHash, address, onDoAnother })`.

- [ ] **Step 1: Get the Form prefill entry id and set it**

Open the Form's "Get pre-filled link" (Google Forms editor - three dots - Get pre-filled link), fill the wallet field with a placeholder, and copy the generated URL; the wallet field appears as `entry.<digits>`. Set that in `start-flow.ts`:

```ts
// frontend/src/lib/start-flow.ts  (replace the placeholder)
const WALLET_ENTRY_ID = "entry.XXXXXXXXX"; // the wallet field's entry id
```

If the Form cannot be edited, leave `WALLET_ENTRY_ID = ""`; `feedbackFormUrl` already falls back to a plain Form link and the tests still pass.

- [ ] **Step 2: SigningStep**

```tsx
// frontend/src/components/start/signing-step.tsx
"use client";
import { StepShell } from "./step-shell";

export function SigningStep() {
  return (
    <StepShell stepIndex={5} total={5} title="Sign in your wallet">
      <p aria-live="polite" className="text-sm leading-relaxed text-text-muted">
        Approve the transaction in your wallet, then hang tight while the network
        confirms it (about 5 seconds).
      </p>
      <div
        aria-hidden="true"
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
      >
        <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
      </div>
    </StepShell>
  );
}
```

- [ ] **Step 3: SuccessStep**

```tsx
// frontend/src/components/start/success-step.tsx
"use client";
import { explorerTxUrl, feedbackFormUrl } from "@/lib/start-flow";
import { StepShell } from "./step-shell";

export function SuccessStep({
  txHash,
  address,
  onDoAnother,
}: {
  txHash: string;
  address: string;
  onDoAnother: () => void;
}) {
  return (
    <StepShell stepIndex={5} total={5} title="You did it - it's on-chain">
      <p aria-live="polite" className="text-sm leading-relaxed text-text-muted">
        Your action was signed by your own wallet and recorded on Stellar testnet.
        Anyone can verify it.
      </p>
      <a
        href={explorerTxUrl(txHash)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-text hover:border-primary"
      >
        View your transaction on Stellar Expert
      </a>
      <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <p className="text-sm font-semibold text-text">Want to be counted?</p>
        <p className="mt-1 text-xs text-text-muted">
          Add your name and a quick rating (about 20 seconds). Your wallet is
          pre-filled.
        </p>
        <a
          href={feedbackFormUrl(address)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary hover:opacity-90"
        >
          Open the 20-second form
        </a>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onDoAnother} className="text-xs text-text-muted underline">
          Do the other action
        </button>
        <a href="/app" className="text-xs text-text-muted underline">
          Open the full app
        </a>
      </div>
    </StepShell>
  );
}
```

- [ ] **Step 4: Verify typecheck + lint + unit tests still green**

Run: `cd frontend && npx tsc --noEmit && npx eslint src/components/start/ && npm run test:unit`
Expected: exit 0; unit tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/start/signing-step.tsx frontend/src/components/start/success-step.tsx frontend/src/lib/start-flow.ts
git commit -m "feat(start): signing + success steps with Form prefill"
```

---

### Task 8: The /start route

**Files:**
- Create: `frontend/src/app/start/page.tsx`

**Interfaces:**
- Consumes: `useStartFlow`, all step components, `useFreighterWallet`.

- [ ] **Step 1: Implement the route**

```tsx
// frontend/src/app/start/page.tsx
"use client";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { useStartFlow } from "./use-start-flow";
import { WelcomeStep } from "@/components/start/welcome-step";
import { ConnectStep } from "@/components/start/connect-step";
import { FundStep } from "@/components/start/fund-step";
import { ActionStep } from "@/components/start/action-step";
import { SigningStep } from "@/components/start/signing-step";
import { SuccessStep } from "@/components/start/success-step";

export default function StartPage() {
  const [state, dispatch] = useStartFlow();
  const { wallet } = useFreighterWallet();

  return (
    <>
      <SiteNav />
      <main id="main" className="mx-auto w-full max-w-3xl px-6 py-12">
        {state.step === "welcome" && <WelcomeStep onStart={() => dispatch({ type: "START" })} />}
        {state.step === "connect" && <ConnectStep onConnected={() => dispatch({ type: "CONNECTED" })} />}
        {state.step === "fund" && <FundStep onFunded={() => dispatch({ type: "FUNDED" })} />}
        {state.step === "action" && <ActionStep state={state} dispatch={dispatch} />}
        {state.step === "signing" && <SigningStep />}
        {state.step === "success" && state.txHash && wallet.address && (
          <SuccessStep
            txHash={state.txHash}
            address={wallet.address}
            onDoAnother={() => dispatch({ type: "RESET" })}
          />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: build succeeds and lists a `/start` route.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/start/page.tsx
git commit -m "feat(start): wire the /start route"
```

---

### Task 9: Entry points + sitemap

**Files:**
- Modify: `frontend/src/app/demo/page.tsx`, a landing hero component, `frontend/src/app/sitemap.xml/route.ts`

- [ ] **Step 1: Point the /demo CTA at /start**

In `frontend/src/app/demo/page.tsx`, change the "Launch the app" secondary link's `href` from `/app` to `/start` and its label to `Try it yourself (60s)`. Keep "Browse opportunities" as is.

- [ ] **Step 2: Add a /start CTA to the landing hero**

Find the landing hero CTA group (grep: `grep -rn "Take the 2-min demo" frontend/src/components/landing`). Add, next to the existing demo CTA, a link:

```tsx
<a href="/start" className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold text-text hover:border-primary">
  Try it yourself in 60s
</a>
```

- [ ] **Step 3: Add /start to the sitemap**

In `frontend/src/app/sitemap.xml/route.ts`, add `/start` to the static routes array alongside the other top-level routes (e.g. `/demo`, `/app`).

- [ ] **Step 4: Verify build + lint**

Run: `cd frontend && npm run lint && npm run build`
Expected: exit 0; `/start` in the route list.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/demo/page.tsx frontend/src/components/landing frontend/src/app/sitemap.xml/route.ts
git commit -m "feat(start): link /start from /demo, landing, and sitemap"
```

---

### Task 10: End-to-end test

**Files:**
- Create: `frontend/e2e/start-flow.spec.ts`

**Interfaces:**
- Consumes: the running app in e2e mode (`NEXT_PUBLIC_E2E_MODE`), which bypasses the real wallet with a fixed test address (see `appConfig.e2eMode` usage in `contract-client.ts`).

- [ ] **Step 1: Inspect how existing e2e specs bootstrap the wallet**

Run: `sed -n '1,40p' frontend/e2e/register-verify-pay.spec.ts`
Note how it sets e2e mode / a test wallet address and navigates. Mirror that setup.

- [ ] **Step 2: Write the e2e test**

```ts
// frontend/e2e/start-flow.spec.ts
import { test, expect } from "@playwright/test";

// Mirror the wallet bootstrap used by register-verify-pay.spec.ts (Step 1).
test("start flow reaches success and shows tx + form links", async ({ page }) => {
  await page.goto("/start");
  await page.getByRole("button", { name: "Start" }).click();

  // Connect (e2e mode resolves a fixed address).
  await page.getByRole("button", { name: /Connect/ }).first().click();

  // Fund step - skip if already funded in e2e.
  const skip = page.getByRole("button", { name: /Skip/ });
  if (await skip.isVisible().catch(() => false)) await skip.click();

  // Choose the issuer action and fill it.
  await page.getByRole("button", { name: /Register your org/ }).click();
  await page.getByLabel("Organization name").fill("E2E Academy");
  await page.getByLabel("Category").fill("Bootcamp");
  await page.getByRole("button", { name: "Sign it" }).click();

  // Success.
  await expect(page.getByText(/it's on-chain/i)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("link", { name: /Stellar Expert/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /20-second form/ })).toBeVisible();
});
```

- [ ] **Step 3: Run the e2e test**

Run: `cd frontend && npx playwright test start-flow.spec.ts`
Expected: PASS. If the connect step does not auto-resolve in e2e mode, adjust the bootstrap to match Step 1's approach (set the e2e wallet address before navigating).

- [ ] **Step 4: Commit**

```bash
git add frontend/e2e/start-flow.spec.ts
git commit -m "test(start): e2e walk through the try-it flow"
```

---

## Manual verification (human-only, after merge)

- One real run on **Freighter desktop**: connect, fund, register-as-issuer, confirm the tx on Stellar Expert, confirm the Form opens with the wallet pre-filled.
- One real run on **WalletConnect mobile**: connect via QR, send a testnet tip, confirm.

## Self-Review (author)

- **Spec coverage:** route + shape (Task 8), 6 steps (Tasks 4-8), two light actions (Task 6/2), friendbot funding (Tasks 1/5), network guard (Task 5), success + Form prefill (Task 7), reuse-vs-new (all), accessibility (StepShell focus + aria-live throughout), QA (Tasks 1-3 unit + Task 10 e2e). Entry points + sitemap (Task 9). Covered.
- **Placeholders:** `WALLET_ENTRY_ID` is a real, resolvable value with a concrete acquisition step (Task 7 Step 1) and a working fallback; not a plan-blocking placeholder.
- **Type consistency:** `FlowState`/`FlowEvent` defined in Task 3 are consumed unchanged in Tasks 6/8; `{ hash: string }` from Task 2 is consumed in Task 6; `WalletProviderMeta.{id,label}` used in Task 4.
