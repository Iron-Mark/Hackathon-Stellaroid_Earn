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
│              Frontend (Next.js 15 / React 19)            │
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
│              Wallet Layer (Freighter)                     │
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

### 1. Smart Contract (`contract/src/lib.rs`)

**Language:** Rust (soroban-sdk 22.0.0)
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

**Framework:** Next.js 15 (App Router) + React 19
**Styling:** Tailwind CSS v4 with `@theme` design tokens

**Read paths (2):**
1. **Server-side (RSC):** `/proof/[hash]` pages use `contract-read-server` with `simulateTransaction` via a read-only funded address. CDN-cached with `revalidate=60`.
2. **Client-side:** Dashboard components call `simulateTransaction` directly for real-time state.

**Write path (1):**
- All mutations route through Freighter: build tx → `signTransaction()` → `sendTransaction()` → poll `getTransaction()` until confirmed.

**Security:**
- CSP headers restrict `connect-src` to `*.stellar.org` and production `script-src` avoids `unsafe-inline`
- `X-Frame-Options: DENY` on all routes
- `/proof/[hash]` validates hex format before any RPC call
- HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`

### 3. Wallet Integration (Freighter)

- Connection state managed via React hooks (`useWallet`)
- Network validation ensures Freighter is on Testnet before any write
- Public key used for role detection (admin vs issuer vs employer)

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
→ Contract returns CertificateRecord → Page renders verified/unverified badge
→ No wallet, no login, no API key required
```

## Deployment

| Component | Platform | URL |
|---|---|---|
| Frontend | Vercel | stellaroid.tech |
| Contract | Stellar Testnet | CDMUOHMARNVOJZM3IVOCJUPGBHDTHFBMZCCZXEZPQDVJGILH3NIKTTW3 |
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
