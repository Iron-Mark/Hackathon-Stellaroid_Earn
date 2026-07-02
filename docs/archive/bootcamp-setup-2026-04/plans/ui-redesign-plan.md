# Stellaroid Earn — UI/UX Redesign Plan

**Project:** Stellar Bootcamp 2026 — Phase 2 dApp (Stellaroid Earn)
**Branch:** `dev`
**Frontend root:** `frontend/` (Next.js 15 + React 19, no CSS framework)
**Current contract ID:** `CDWCARXLJUJ5ISC3GPXRLR5HC6QPLMGULCVRIACYKQM4U5AG7TFWXHVZ` (testnet)
**Goal:** Replace the inline-styled 5-section dashboard with a proof-first UI organized around **Next Action / Milestones / Proof Block** per the deep-research-report thesis.

---

## Design System (fixed — do not invent)

| Token | Value | CSS var |
|---|---|---|
| `--color-bg` | `#0F172A` | slate-900 app background |
| `--color-surface` | `#1E293B` | slate-800 cards |
| `--color-surface-2` | `#273549` | elevated surface / hover |
| `--color-border` | `#334155` | slate-700 dividers |
| `--color-text` | `#F8FAFC` | primary text (15.8:1 on bg) |
| `--color-text-muted` | `#94A3B8` | secondary text (6.8:1) |
| `--color-primary` | `#F59E0B` | gold — primary CTA, verified |
| `--color-primary-hover` | `#FBBF24` | |
| `--color-on-primary` | `#0F172A` | text on gold |
| `--color-accent` | `#8B5CF6` | purple — links, tech |
| `--color-success` | `#22C55E` | |
| `--color-warning` | `#F59E0B` | |
| `--color-danger` | `#EF4444` | |
| `--radius-sm` | `6px` | buttons, inputs |
| `--radius-md` | `8px` | cards |
| `--radius-lg` | `12px` | modals, proof card |
| `--space-1..6` | 4, 8, 12, 16, 24, 32 px | |
| `--transition` | `200ms ease-out` | |
| `--font-sans` | `'IBM Plex Sans', system-ui, sans-serif` | |
| `--font-mono` | `'IBM Plex Mono', ui-monospace, monospace` | |
| Font weights | 300, 400, 500, 600, 700 | |

**Style category:** Minimalism / Swiss, dark-first.
**Anti-patterns forbidden:** emoji-as-icons, raw ScVal in UI, auto-dismiss Freighter popup, hidden fees, color-only state.

---

## Information architecture

```
AppShell
├── Header (contract link · RPC pill · wallet pill)
└── Main
    ├── NextActionCard (one task, one CTA — role-detected)
    ├── Section: Milestones (Registered ● Verified ● Paid)
    └── Section: Proof Block preview (→ /proof/[hash] public)
```

New public route `/proof/[hash]` renders the shareable artifact (no wallet required).

---

## Task 1 — Foundation: tokens, fonts, globals.css, layout wiring

**Files to create:**
- `frontend/src/styles/globals.css` — CSS custom properties from the Design System table above, CSS reset, body defaults (background `--color-bg`, color `--color-text`, `--font-sans`), `@font-face` or Google Fonts `@import` for IBM Plex Sans (300, 400, 500, 600, 700) + IBM Plex Mono (400, 500). Use `font-display: swap`. Add `@media (prefers-reduced-motion: reduce)` that zeros all transitions.

**Files to modify:**
- `frontend/src/app/layout.tsx` — import `../styles/globals.css`, set `<html lang="en">`, metadata title "Stellaroid Earn", remove any default Next.js boilerplate fonts.

**Success criteria:**
- `npm run build` passes.
- Page renders dark background, light text, IBM Plex Sans.
- No remaining inline styles in `layout.tsx`.
- No changes to `contract-dashboard.tsx` in this task (handled later).

---

## Task 2 — Utilities: `errors.ts` + `with-timeout.ts`

**Files to create:**
- `frontend/src/lib/errors.ts` — export `humanizeError(err: unknown): { title: string; detail: string; recoverable: boolean }`.
  - Inspect for common Soroban/Freighter error shapes: user-rejected signing, network mismatch, simulation failure, contract panic (`HostError`), RPC timeout, insufficient balance, not found.
  - Map each to friendly copy + recovery hint (e.g. "Transaction declined in Freighter — try again when ready").
  - Never surface raw `ScVal`, `HostError` codes, or stack traces. Unknown errors → `{ title: "Transaction failed", detail: "Please try again. If this keeps happening, check your network.", recoverable: true }`.
  - Pattern-match on message substring (case-insensitive) + error name.

- `frontend/src/lib/with-timeout.ts` — export `withTimeout<T>(promise: Promise<T>, ms: number, label?: string): Promise<T>` that rejects with `new Error("TIMEOUT: " + label)` after `ms`. Default 15000ms.

**Success criteria:**
- Both files exported from their modules.
- `humanizeError` handles at least: user-rejected, network mismatch, timeout, and unknown/fallback.
- `npm run build` passes.
- No changes to existing components in this task.

---

## Task 3 — UI primitives

**Files to create under `frontend/src/components/ui/`:**

- `button.tsx` — `<Button variant="primary"|"secondary"|"ghost"|"danger" size="md"|"sm" loading? disabled?>`. Primary = gold bg, on-primary text. Secondary = surface-2 bg, border. Ghost = transparent. Danger = danger bg. Min height 44px. Focus ring 2px gold offset 2px. Loading shows inline spinner and sets `aria-busy`.

- `input.tsx` — labeled input: `<Input label helper error mono? {...htmlProps}>`. Label above, helper/error below. Error text danger color with `role="alert"`. Mono variant uses `--font-mono`. Min height 44px.

- `badge.tsx` — `<Badge tone="neutral"|"success"|"warning"|"danger"|"accent">`. Small pill for statuses (e.g. "Verified", "RPC healthy").

- `copy-button.tsx` — `<CopyButton value ariaLabel>`. Icon-only (use inline SVG — lucide copy icon inlined as JSX, no extra deps). 44×44 tap area via padding. On click, `navigator.clipboard.writeText`, swap icon to check for 1500ms, announce via live region.

- `skeleton.tsx` — `<Skeleton width height radius?>`. Pulsing surface-2 block. Respects `prefers-reduced-motion`.

- `toast.tsx` + `use-toast.ts` — minimal toast system. Provider at app root, `useToast()` exposes `toast({ title, detail?, tone?, action? })`. Auto-dismiss 5s, `aria-live="polite"`, stack bottom-right. Dismiss button. Tone maps to left border color.

**Success criteria:**
- All components are `"use client"` where interactive.
- All use tokens from Task 1 (no hard-coded hex).
- `npm run build` passes.
- No external UI deps added (no shadcn, no radix). Inline SVGs only.

---

## Task 4 — App shell + header

**Files to create:**
- `frontend/src/components/layout/app-shell.tsx` — sticky top header + main content container (`max-width: 960px`, padding). Header shows: left "Stellaroid Earn" wordmark; center empty; right: `<RpcStatusPill />` + `<WalletConnectButton />`. Below header: contract ID line with CopyButton + explorer link (right-pointing arrow icon).
- `frontend/src/components/layout/rpc-status-pill.tsx` — extracts the current RPC probe logic into a `<Badge>` that shows "RPC healthy" (success), "RPC slow — up to 15s" (warning), or "Checking…" (neutral). Probes on mount, re-probes every 60s.
- `frontend/src/components/wallet/wallet-connect-button.tsx` — uses existing `useFreighterWallet()` hook; shows "Connect Freighter" when disconnected, shortened address pill when connected. Click-to-disconnect confirms via toast. Network mismatch renders a warning badge inside.

**Files to modify:**
- `frontend/src/app/layout.tsx` — wrap children in `<ToastProvider>` from Task 3.

**Success criteria:**
- Header renders correctly at 375px and ≥1024px.
- Copy button on contract ID works (toast confirms).
- RPC probe logic moved out of `contract-dashboard.tsx` (old copy can stay temporarily; dashboard rewrite is Task 6).
- `npm run build` passes.

---

## Task 5 — Action forms (Register / Verify / Pay)

**Files to create under `frontend/src/components/actions/`:**

- `register-form.tsx` — fields: student wallet (G...), certificate hash (64 hex) with "Compute SHA-256 from file" secondary button. Submit calls `registerCertificate(...)` wrapped in `withTimeout(p, 15000, "register")`. Uses `humanizeError` in catch; surfaces via `useToast()` with explorer link on success.
- `verify-form.tsx` — field: certificate hash. Two buttons: "Look up (read-only)" → `getCertificate`, displays owner/issuer/verified inline; "Mark Verified (on-chain)" → `verifyCertificate`, wrapped and toasted like above.
- `pay-form.tsx` — fields: student wallet, certificate hash, amount (with asset code suffix). Submit calls `linkPayment(...)` wrapped + toasted.

Each form:
- Uses `<Input>`, `<Button>` from Task 3.
- Disables submit when: not configured, wallet disconnected, network mismatch, submitting.
- Shows inline skeleton / loading state via button `loading` prop.
- On timeout error from `withTimeout`, toast copy reads: "Testnet is slow — still waiting. The transaction may still settle. Check the explorer." with explorer-home link.
- Hash input offers "Compute SHA-256 from file" in Register only (keep the existing digest logic; move it into this component).

**Success criteria:**
- Each form is a standalone component that owns its own state.
- No raw `error.message` surfaces anywhere in these components.
- `npm run build` passes.
- The old `contract-dashboard.tsx` is NOT deleted in this task yet.

---

## Task 6 — Dashboard composition (Next Action + Milestones + page wire-up)

**Files to create:**
- `frontend/src/components/actions/next-action-card.tsx` — accepts `role: "issuer" | "employer" | "none"` + current milestone state. Renders a single large card with: role label, one-line description, one CTA. Role can be chosen by a small segmented control at top-right of the card ("I am: Issuer / Employer"). State is lifted to `page.tsx` via `useState` (not persisted — MVP).
- `frontend/src/components/milestones/milestone-rail.tsx` — horizontal rail of three steps: Registered → Verified → Paid. Each step shows an icon (○ pending, ● active, ✓ done) + label + optional subtle value (e.g. hash short, tx short). Driven by `{ registered: boolean, verified: boolean, paid: boolean }` prop. Color success for done, muted for pending; pair color with icon shape.

**Files to modify:**
- `frontend/src/app/page.tsx` — replace `<ContractDashboard />` with:
  ```
  <AppShell>
    <NextActionCard role={role} setRole={setRole} state={state} />
    <section><MilestoneRail state={state} /></section>
    <section>
      {role === "issuer" && <RegisterForm onSuccess={...} />}
      {role === "employer" && (verified ? <PayForm .../> : <VerifyForm .../>)}
    </section>
    <ProofBlockPreview contractId hash={state.lastHash} />
  </AppShell>
  ```
  where `ProofBlockPreview` is a small server-safe card linking to `/proof/[hash]`.

**Files to delete:**
- `frontend/src/components/contract-dashboard.tsx` — replaced fully by the composition above.

**Success criteria:**
- Dashboard renders without the old component.
- Connecting wallet + completing a register→verify→pay flow updates the Milestone rail live.
- No inline `style=` props remain in `page.tsx` or new components (use CSS modules OR a colocated `<style jsx>` block OR class names with a small `dashboard.module.css`). Pick the simplest — prefer CSS modules.
- `npm run build` passes.

---

## Task 7 — Proof Block public route

**Files to create:**
- `frontend/src/app/proof/[hash]/page.tsx` — server component. Accepts `hash` param. Reads contract ID from env. Fetches certificate state via `getCertificate(hash)` server-side using the existing contract client in read-only mode. Renders:
  - Pitch line: "On-chain credential + direct payment rail on Stellar testnet." (hard-coded for MVP)
  - Contract ID + explorer link (+ CopyButton — but CopyButton is client — wrap in `"use client"` island).
  - Certificate hash + verified status + owner/issuer.
  - Verified events section: link "View events on stellar.expert" pointing at `<explorer>/contract/<id>#events`.
  - Rubric self-check: 5 items hard-coded checked if our known contract satisfies them (all 5 should render ✓ for the deployed contract).
  - Share buttons (client island): X intent URL, LinkedIn intent URL, "Copy share link".

- `frontend/src/components/proof/proof-card.tsx` — presentational card used inside the route.
- `frontend/src/components/proof/share-buttons.tsx` — client component with three buttons (X / LinkedIn / Copy link). Uses a tweet template: `"Built Stellaroid Earn on Stellar testnet — on-chain credentials + instant employer payouts. Verified demo: <url>"` (≤240 chars).

**Success criteria:**
- Navigating to `/proof/<valid-hash>` renders full content with no wallet required.
- Navigating to `/proof/<unknown-hash>` renders a friendly "No certificate registered for this hash yet." state (not an error).
- Share buttons open the right intent URLs in new tabs.
- Page is themed identically to the dashboard.
- `npm run build` passes.

---

## Task 8 — Polish pass

**Scope:**
- Add `<Skeleton>` usage anywhere a network call sets `loading` for >300ms (button internal spinner is fine; content areas need skeleton).
- Audit all `.tsx` under `frontend/src/components/` + `frontend/src/app/` for:
  - Any remaining raw `error.message` or ScVal leakage → route through `humanizeError`.
  - Any touch target under 44px → fix padding.
  - Any color-only state (e.g. success indicated only by green) → pair with icon or text.
  - Any missing `aria-label` on icon-only buttons.
  - Any hover-only affordance that doesn't work on touch.
- Verify `prefers-reduced-motion` kills transitions.
- Verify focus rings visible on all interactive elements.
- Run `npm run lint` and fix warnings.
- Update `frontend/README.md` with a one-paragraph "Design system" section pointing at `styles/globals.css` and listing the 4 top-level routes.

**Success criteria:**
- `npm run lint` → 0 warnings, 0 errors.
- `npm run build` → clean.
- All checklist items above addressed with file:line references listed in the final commit message.

---

## Non-goals

- No new dependencies (no Tailwind, no shadcn, no Radix, no icon library — inline SVG only).
- No backend.
- No changes to `lib/contract-client.ts`, `lib/freighter.ts`, `lib/config.ts`, `lib/format.ts`, `lib/validators.ts`, `lib/types.ts`, `hooks/use-freighter-wallet.ts` API surfaces. Internal additions OK.
- No mainnet, no real XLM flows.
- No persistence of milestone state across reloads (MVP — in-memory only).

## Ground rules for every task

- Work only on branch `dev`.
- Commit after each task with message: `ui: <task-name>`. Never add Claude co-author trailers.
- Run `npm run build` at the end of each task; fail if it doesn't pass.
- Historical note: this plan originally warned not to touch the old root setup folder. The setup artifacts now live under `docs/archive/bootcamp-setup-2026-04/` and active references live under `docs/reference/`.
- Inline style props (`style={{...}}`) are banned in new components. Use CSS modules or `globals.css` classes.
- No emoji as icons. Inline SVG only.
- No `any` types unless justified in a comment.
