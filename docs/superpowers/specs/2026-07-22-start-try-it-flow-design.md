# Design: `/start` — "Do a real thing on Stellar in ~60 seconds"

**Status:** approved design, pre-implementation
**Date:** 2026-07-22
**Author:** Mark Siazon

## Purpose

Turn `/demo` watchers (and outreach traffic) into people who actually connect a
wallet and sign a **real** testnet transaction, with the least friction
possible. This is the top-of-funnel-to-real-signer handoff: the guided demo
proves the product works without a wallet; `/start` gets the visitor to do one
real on-chain action themselves.

The success criterion is a genuine, verifiable on-chain transaction signed by the
visitor's own wallet, plus a soft handoff into the existing feedback Form so they
count toward the user-validation record.

## Goals

- A visitor with no prior setup can sign a real testnet transaction in ~60
  seconds: connect → fund → pick a light action → sign → done.
- Works for everyone: desktop (Freighter/Albedo) and mobile (WalletConnect/Albedo,
  no install), keyboard-operable, resilient to every failure path.
- Produces **varied** on-chain activity across users (two different contract
  calls), which reads more credibly than a single repeated call.
- Shareable as a standalone URL (`stellaroid.tech/start`) for outreach + QR.

## Non-goals (YAGNI)

- No new contract methods. Reuse existing public calls only.
- No first-party account/email storage. Identity capture leans on the existing
  Google Form.
- No `create_opportunity` in the wizard (too many required inputs for a
  first-timer).
- No mainnet. Testnet only, enforced.

## Route & shape

- New route: `frontend/src/app/start/page.tsx`, a `"use client"` component
  (wallet is browser-only).
- A **linear wizard**: one step visible at a time, with a small step indicator.
- Entry points that link to `/start`: the `/demo` closing CTA ("Do it yourself"),
  the landing hero secondary CTA. `/start` is also the outreach URL.
- Reuses the existing wallet layer and contract client; adds only presentation +
  a slim flow state machine + a friendbot helper.

## The six steps

1. **Welcome.** One line of copy ("Do a real thing on Stellar testnet in ~60
   seconds. Free, no signup, testnet only.") + a `Start` button. Sets expectation
   and the testnet framing.
2. **Connect.** Auto-detects platform via the existing `useFreighterWallet`
   (`isMobileBrowser`, `availableProviders`): desktop shows Freighter (primary) +
   Albedo; mobile shows WalletConnect (QR/deep-link) + Albedo. Reuses the existing
   provider registry and connect logic. If nothing is available (extension-less
   desktop), fall back to the web wallets.
3. **Testnet check + fund.** Guard that the connected wallet is on **testnet**
   (`isExpectedNetwork`); if not, a plain-language "switch your wallet to Testnet"
   message blocks progress. Then read the account: if unfunded, a one-click **"Get
   free testnet XLM"** button calls friendbot and shows the resulting balance;
   auto-skip if already funded.
4. **Pick an action.** Two cards, both public (no issuer approval needed):
   - **Register your org as an issuer** → a two-field form (org **name** +
     **category**) → `registerIssuer(address, name, "", category)`.
   - **Send a testnet tip** → recipient (a seeded demo graduate) and the demo
     credential hash are pre-filled; the user taps an **amount** chip (1 / 5 / 10
     XLM) → `linkPayment(employer=address, student=demoGraduate, certHash=demoHash,
     amount)`.
5. **Sign.** Build → sign in the connected wallet → submit → poll to confirmation,
   via the existing `contract-client` path. **Wait-friendly:** an explicit
   "Waiting for the network (~5s)…" state with a spinner and reassurance;
   `aria-live` announces state changes. A declined signature and RPC errors both
   render plain-language messages (via the existing error humanizer) with a
   **Retry** action — no dead ends.
6. **Success.** "✅ You did it — your action is on-chain," with **the visitor's own
   transaction** linked on Stellar Expert (real, shareable). Then the soft
   capture: *"Want to be counted + rate it? (20s)"* → the existing Google Form
   opened with the **wallet address pre-filled**. Secondary CTAs: "Do the other
   action" (loops to step 4 with the other card) and "Open the full app" (`/app`).

## Actions: exact calls and pre-fills

Both functions already exist in `frontend/src/lib/contract-client.ts`:

- `registerIssuer(issuer, name, website, category)` — `issuer` = connected
  address; `name`/`category` from the mini form. To keep the form to two fields,
  `website` is **not** collected in the wizard; the flow passes an empty string
  (the contract accepts it). Add the website field later only if it proves needed.
- `linkPayment(employer, student, certHashHex, amount)` — `employer` = connected
  address; `student` = a seeded demo graduate address; `certHashHex` = the seeded
  sample proof hash (`DEFAULT_SAMPLE_PROOF_HASH` in `lib/demo-data.ts`); `amount`
  = the chosen chip, converted to stroops (i128).

The demo graduate address and cert hash are surfaced as named constants /
config so they are not magic values scattered in the UI. If a seeded graduate
address is not already available in config, add one derived from the seeded
exhibit.

## Funding + network specifics

- Friendbot: client-side `GET https://friendbot.stellar.org/?addr=<G...>`,
  testnet only, in a new `frontend/src/lib/friendbot.ts` helper. Handle success,
  already-funded (op_already_exists), rate-limit, and network failure explicitly;
  on failure, fall back to showing the address (copyable) + a link to the public
  friendbot page.
- Network guard reuses `isExpectedNetwork` from the wallet snapshot. The action
  and fund steps are blocked until the wallet reports testnet.

## Accessibility & resilience ("friendly for everyone")

- Full keyboard operation; focus moves to the new step's heading on transition.
- `aria-live="polite"` region for the waiting/success/error announcements.
- `prefers-reduced-motion` respected for step transitions and spinners.
- Every failure path (no wallet, wrong network, friendbot failure, declined
  signature, RPC error, timeout) has a specific plain-language message and a way
  forward. No silent failures, no dead ends.

## File structure (reuse vs new)

**Reuse (no changes beyond wiring):**
- `hooks/use-freighter-wallet.tsx`, the wallet provider registry, and
  `components/wallet/*` for connect.
- `lib/contract-client.ts` (`registerIssuer`, `linkPayment`).
- `lib/errors.ts` (`humanizeError`) for messages.
- The Stellar Expert URL helper / `appConfig.explorerUrl`.

**New:**
- `app/start/page.tsx` — route shell + `useStartFlow` wiring.
- `app/start/use-start-flow.ts` — a slim state machine:
  `welcome → connect → fund → action → signing → success` (+ `error` overlay per
  step). Holds: selected action, form inputs, tx hash, last error.
- `components/start/` — `WelcomeStep`, `ConnectStep`, `FundStep`, `ActionStep`
  (with the two cards + mini forms), `SigningStep`, `SuccessStep`, and a shared
  `StepShell` (step indicator + heading + focus management).
- `lib/friendbot.ts` — `fundTestnetAccount(address)` helper.
- Small edits: `/demo` CTA and landing hero secondary CTA link to `/start`; add
  `/start` to the sitemap.

## Data flow

`useStartFlow` owns flow state. Steps are presentational and receive
`{ state, actions }`. Wallet state comes from `useFreighterWallet`. On the sign
step, the flow calls the relevant `contract-client` function, awaits
confirmation, stores the tx hash, and advances to success. All chain access
stays in existing modules; the wizard adds no direct SDK calls except friendbot.

## Error handling

| Failure | Handling |
|---|---|
| No wallet available | Show install/mobile guidance (reuse `WalletEmptyState` copy); mobile offers WalletConnect/Albedo (no install). |
| Wrong network | Block with "switch to Testnet" message; re-check on focus. |
| Friendbot fails / rate-limited | Message + copyable address + link to public friendbot; allow proceeding if already funded. |
| Signature declined | "You declined the signature — try again." + Retry. |
| RPC / submit error | `humanizeError` message + Retry. |
| Confirmation timeout | "Taking longer than usual" + link to check the tx on Stellar Expert. |

## QA / testing

- **Unit:** `friendbot.ts` (URL construction, success/already-funded/failure
  branches); `use-start-flow` transitions (each step advances/blocks correctly);
  network-guard gating.
- **E2E (Playwright, existing e2e-mode wallet bypass):** `/start` → connect (e2e
  fixed address) → each action → success screen renders with the tx link and the
  pre-filled Form link. `contract-client` already has e2e branches to lean on.
- **Manual (human-only):** one real Freighter-desktop run and one WalletConnect
  -mobile run end to end, confirming a real tx and the Form pre-fill.

## Open implementation details

1. **Google Form pre-fill:** obtain the wallet field's `entry.<id>` from the Form
   (via its "Get pre-filled link" feature) and build
   `…/viewform?usp=pp_url&entry.<id>=<address>`. If prefill is not configured,
   fall back to a plain Form link (no wallet param).
2. **Seeded demo graduate + cert hash** for the tip action: reuse
   `DEFAULT_SAMPLE_PROOF_HASH`; confirm/seed a stable graduate recipient address in
   config.
3. Friendbot verified live on the current testnet (the 30 pilot wallets exist and
   are funded there).

## Out of scope / future

- Auto-approving the visitor as an issuer so they could anchor a full credential
  (the richer "shareable proof link" payoff) — deferred; it touches the trust
  model and adds a second signature.
- Localizing the `/start` copy into the six supported locales — the first cut ships
  in English; i18n can follow if the flow proves out.
