# Stellaroid Earn  - Architecture Document

## System Overview

Stellaroid Earn is an on-chain credential trust platform built on Stellar testnet. It allows approved issuers to register and verify bootcamp certificates as Soroban smart contract entries, enables public proof verification without a wallet, and facilitates employer-to-graduate payments in XLM.

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Users                               │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐             │
│  │  Issuer   │   │ Student  │   │ Employer │             │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘             │
│       │              │              │                    │
└───────┼──────────────┼──────────────┼────────────────────┘
        │              │              │
        ▼              ▼              ▼
┌──────────────────────────────────────────────────────────┐
│              Frontend (Next.js 16 / React 19)            │
│  ┌────────────────┐  ┌────────────────┐                  │
│  │  App Router     │  │  Components    │                  │
│  │  /app (dash)    │  │  proof/        │                  │
│  │  /issuer        │  │  wallet/       │                  │
│  │  /proof/[hash]  │  │  actions/      │                  │
│  │  /about         │  │  landing/      │                  │
│  └───────┬────────┘  └────────────────┘                  │
│          │                                               │
│  ┌───────┴────────┐  ┌────────────────┐                  │
│  │  lib/           │  │  hooks/        │                  │
│  │  contract-client│  │  useWallet     │                  │
│  │  contract-read  │  │  useContract   │                  │
│  │  freighter      │  └────────────────┘                  │
│  └───────┬────────┘                                      │
└──────────┼───────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│              Wallet Layer (pluggable)                     │
│  requestAccess → signTransaction → submit                │
└──────────┬───────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│              Stellar Testnet (Soroban RPC)                │
│  ┌────────────────────────────────────────┐              │
│  │  Soroban Contract: stellaroid_earn     │              │
│  │  ┌──────────────────────────────────┐  │              │
│  │  │  Issuer Registry (persistent)    │  │              │
│  │  │  Certificate Store (persistent)  │  │              │
│  │  │  Payment Links (persistent)      │  │              │
│  │  │  Admin Config (instance)         │  │              │
│  │  └──────────────────────────────────┘  │              │
│  └────────────────────────────────────────┘              │
│  ┌────────────────────────────────────────┐              │
│  │  XLM (SAC)  - Native Asset Contract    │              │
│  └────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Smart Contract (`contracts/stellaroid_earn/src/lib.rs`)

**Language:** Rust (soroban-sdk 27.0.2 in the manifest, resolving to 27.0.3 in `Cargo.lock`). The contract currently deployed to testnet was built against 26.1.0, which is why rebuilding `main` does not reproduce the deployed WASM hash and verification targets the `v3.0.0` tag instead. See [`docs/operations/contract-verification.md`](../operations/contract-verification.md).
**Target:** `wasm32v1-none`
**Storage model:**
- **Persistent storage**  - Issuer records, certificate records, payment links (TTL: 518,400 ledgers min / 1,036,800 max)
- **Instance storage**  - Admin address, XLM token contract address

**Key data structures:**
- `IssuerRecord`  - name, website, category, status (Pending/Approved/Suspended)
- `CertificateRecord`  - issuer, student, title, cohort, metadata_uri, status, timestamps
- `PaymentRecord`  - payer, amount, linked certificate hash

**Access control:**
- Admin-only: `init`, `approve_issuer`, `suspend_issuer`, `reward_student`
- Approved issuers: `register_certificate`, `verify_certificate`, `revoke_certificate`, `suspend_certificate`
- Public: `register_issuer`, `link_payment`, `get_certificate`, `get_issuer`

**Error handling:** Typed `#[contracterror]` enum with 17 variants covering authorization, credential lifecycle, opportunity escrow, and invalid state failures.

### 2. Frontend (`frontend/`)

**Framework:** Next.js 16 (App Router) + React 19
**Styling:** Tailwind CSS v4 with `@theme` design tokens

**Read paths (2):**
1. **Server-side (RSC):** `/proof/[hash]` pages use `contract-read-server` with `simulateTransaction` via a read-only funded address. CDN-cached with `revalidate=60`.
2. **Client-side:** Dashboard components call `simulateTransaction` directly for real-time state.

**Event evidence path:**
- `/api/events`, `/api/events/stream`, and `/status#metrics` read recent events from Soroban RPC `getEvents` and supplement them with Stellar Expert's public contract event index. Events are decoded, deduplicated, source-labelled (`rpc`, `stellar_expert`, or `e2e`), and displayed as public evidence. The stream route uses short-lived Server-Sent Events for live demo refreshes. This is not a full product analytics warehouse; durable proof history, issuer conversion, and audit-grade action history require a future first-party read model.

**Product action telemetry:**
- Vercel Web Analytics is loaded in production. The app also emits privacy-safe custom events for proof sharing, proof-pack downloads, proof-to-employer handoff, employer shortlist saves, and escrow create/fund starts. Event properties are limited to coarse state such as proof status, hash shape, source surface, channel, issuer trust tier, and validation state; raw wallet addresses and proof hashes are not sent. These events support demo/product iteration, not durable audit history.

**Write path (1):**
- All mutations route through the connected wallet: build tx → `signTransaction()` (Freighter / Albedo / WalletConnect / kit) → `sendTransaction()` → poll `getTransaction()` until confirmed.

**Security:**
- CSP (nonce-based, in `src/middleware.ts`) restricts `connect-src` to `*.stellar.org` plus the WalletConnect relay (`relay.walletconnect.org`, `verify.walletconnect.org`); production `script-src` is nonce + `'self'` and avoids `unsafe-inline`
- `X-Frame-Options: DENY` on every route except the intentionally embeddable `/proof/[hash]/embed` badge (CSP `frame-ancestors` mirrors this)
- `/proof/[hash]` validates hex format before any RPC call
- HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`

### 3. Wallet Integration (multi-provider)

- Provider registry (`frontend/src/lib/wallet/`) behind one `read` / `connect` / `sign` interface. Ships **Freighter** (desktop extension) and **Albedo** (web wallet, also covers mobile) natively; **WalletConnect** (Reown relay) for mobile apps such as LOBSTR, xBull, Hana, and Freighter mobile; and a "More wallets" entry via **Stellar Wallets Kit** (xBull, Rabet, LOBSTR, Hana, Klever, Bitget). Every wallet SDK is lazy-loaded on first use.
- Connection state managed via React hooks (`useWallet`); the active provider id is persisted in `localStorage` so sessions survive reloads
- Network validation ensures the wallet is on Testnet before any write (Albedo and kit wallets sign for the network the app requests, so a wrong-network state cannot occur there)
- Public key used for role detection (admin vs issuer vs employer)
- WalletConnect is gated on a Reown project id (`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`); when unset the option is hidden from the picker

## Data Flow

### Credential Issuance Flow
```
Issuer registers → Admin approves issuer → Issuer registers certificate
→ Issuer verifies certificate → Student shares /proof/<hash> URL
→ Employer views proof → Employer pays graduate via link_payment
```

### Verification Flow (Zero-Wallet)
```
Anyone opens /proof/<hash> → Next.js RSC calls simulateTransaction
→ Contract returns CertificateRecord + issuer registry evidence
→ Page renders status, issuer trust, and verification breakdown
→ No wallet, no login, no API key required
```

## Deployment

| Component | Platform | URL |
|---|---|---|
| Frontend | Vercel | stellaroid.tech |
| Contract | Stellar Testnet | CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV |
| Source verification | Stellar Expert | Fresh security-hardened deploy; source re-verification pending |

## Technology Decisions

| Decision | Rationale |
|---|---|
| Soroban over classic Stellar | Need custom logic (issuer trust layer, credential lifecycle states) that classic offers/payments can't express |
| `simulateTransaction` for reads | Avoids requiring a wallet for public proof verification  - critical for employer adoption |
| Next.js App Router + RSC | Server-side rendering of proof pages enables SEO, link previews, and CDN caching |
| XLM via SAC (not custom token) | Reduces friction  - graduates receive actual XLM, no need to trust-line a custom asset |
| Persistent storage with long TTLs | Credentials should outlive short-term contract state; 518k–1M ledger TTLs provide months of persistence |
| Typed `#[contracterror]` | Provides clear, actionable errors instead of opaque integer codes |
| Fee sponsorship behind server auth | Prevents arbitrary public XDR from being sponsor-signed by requiring bearer authorization plus contract/method/fee validation |
| Public indexer fallback for metrics | Stellar RPC event retention is limited to recent ledgers; supplementing with Stellar Expert keeps older public contract evidence visible without claiming first-party analytics |
