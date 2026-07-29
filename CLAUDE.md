# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is the **Stellar PH Bootcamp** bootcamp repository — a participant-facing guide, not a production codebase. It packages:

1. **`README.md`** — 5-step walkthrough: install toolchain → complete assigned Soroban contract → `cargo test` (≥3 tests) → deploy to Stellar **testnet** → submit on Rise In.
2. **`docs/reference/pre-workshop-setup-guide.pdf`** — participant install guide (Rust, Stellar CLI, WASM target, Freighter).
3. **`docs/reference/freighter-integration.md`** — generalized Next.js + Soroban + Freighter integration recipe.
4. **`frontend/`** — Next.js 16 (App Router) + React 19 dApp using `@stellar/stellar-sdk` and `@stellar/freighter-api`. Composition: `app/` (layout, page, `/about`, `/app`, `/issuer`, `/issuer/register`, `/proof`, `/proof/[hash]`, `/proof/[hash]/embed`), `components/` (`about/`, `actions/`, `activity/`, `app/`, `demo/`, `issuer/`, `landing/`, `layout/`, `milestones/`, `onboarding/`, `proof/`, `ui/`, `wallet/`), `hooks/`, `lib/` (config, contract-client, contract-read-server, demo-data, errors, events, format, freighter, i18n, issuer-registry, motion, proof-metadata, types, utils, with-timeout), `styles/globals.css` (Tailwind v4 `@theme` design tokens). Security: HTTP security headers + CSP in `next.config.ts`; dynamic proof routes cached with `revalidate=60` and guarded with a hex-format check before any RPC call.
5. **`docs/archive/bootcamp-setup-2026-04/setup-todo.md`** — archived local setup progress tracker (A–E sections: Environment, Manual pre-workshop, Contract deploy, Rise In, Phase 2 fullstack).
6. **`docs/archive/bootcamp-setup-2026-04/fullstack-prompt-template.md`** — archived v3 prompt template for generating a Stellar dApp idea + Soroban contract files + frontend design brief. Used in Phase 2 after the Contract ID is deployed. Refined against the `stellar-dev`, `ui-ux-pro-max`, and `superpowers/writing-skills` plugins.

The assigned Soroban contract itself is **not** in this repo — participants clone a separate facilitator-provided contract repo.

## Common commands

### Frontend (`frontend/`)
```bash
npm install
npm run dev       # next dev
npm run build     # next build
npm run start     # next start (after build)
npm run lint      # next lint
```

### Stellar CLI (environment setup)
This codespace already has: Rust 1.95, `wasm32v1-none` + `wasm32-unknown-unknown` targets, Stellar CLI 26.0.0 at `~/.local/bin/stellar`, and a funded testnet key aliased `my-key`.

```bash
export PATH="$PATH:$HOME/.local/bin"   # if stellar is not on PATH
stellar --version
stellar keys address my-key
```

### Contract workflow (once a contract is cloned into this workspace)
```bash
cargo test
cargo build --target wasm32-unknown-unknown --release
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/<crate>.wasm \
  --source my-key \
  --network testnet
```

## Stellar CLI v26 gotchas

- `--global` flag is **removed** from `stellar keys generate` — global is the default. Use `--fund` to auto-fund at creation: `stellar keys generate my-key --network testnet --fund`.
- Prefer the **prebuilt binary** from GitHub releases over `cargo install --locked stellar-cli` in constrained environments (the from-source build pulls hundreds of crates and can OOM in small containers).

## Frontend architecture (at a glance)

The integration follows the flow documented in `docs/reference/freighter-integration.md`:

- **Config layer** reads `NEXT_PUBLIC_*` env vars (RPC URL, network passphrase, contract ID, read address). Network passphrase **must** match the network the contract is deployed on.
- **Wallet layer** (`lib/` + `hooks/`) wraps `@stellar/freighter-api` — connection state, public key, network check, sign.
- **Contract client** (`lib/`) builds transactions with `@stellar/stellar-sdk`: read-only calls via `simulateTransaction` using the read address; writes sign via Freighter and submit via Soroban RPC. Handles ScVal arg serialization, return-value decoding, and error normalization.
- **UI components** are marked `"use client"` because Freighter is a browser-only API.
- **Security** (`next.config.ts`): CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and HSTS on every route. `/proof/[hash]` pages validate the hash format before any RPC call and use `revalidate=60` for CDN caching. `robots.ts` keeps `/proof/[hash]/embed`, `/talent/*`, `/opportunity/*`, and `/api/` out of search; proof detail pages stay crawlable on purpose, for portfolio sharing.

When editing the frontend, treat the integration guide as the canonical spec.

## What not to do

- Don't commit `vs_buildtools.exe`, `install.cmd`, or other Windows-only artifacts — this repo is consumed cross-platform and those belong in the PDF guide, not the tree.
- Don't add a backend unless a participant's submission needs one (`backend/` is explicitly optional per the README's repo structure).
- Don't deploy to mainnet from examples — all flows target **testnet**.
- Don't add `Co-Authored-By: Claude` (or any Claude co-author trailer) to commits, PRs, or other `gh` actions. Commits and PRs should be authored solely by the user.
- Don't use the deprecated `soroban contract ...` CLI in examples or docs — use `stellar contract ...` (Stellar CLI v21+).
