# Stellaroid Earn — Frontend

Next.js 15 (App Router) + React 19 dApp connecting to a Soroban certificate contract on Stellar testnet via Freighter.

Built following [`../docs/reference/freighter-integration.md`](../docs/reference/freighter-integration.md).

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

Then in `.env.local`:

1. Set `NEXT_PUBLIC_SOROBAN_CONTRACT_ID` to your deployed testnet contract ID.
2. Set `NEXT_PUBLIC_STELLAR_ADMIN_ADDRESS` to the admin `G...` address used when calling `init`.
3. Set `NEXT_PUBLIC_STELLAR_READ_ADDRESS` to a funded testnet `G...` account used only for read-only simulation (fund at https://friendbot.stellar.org/).
4. Set `NEXT_PUBLIC_CANONICAL_URL` to the production domain used for search metadata and canonical links.
5. Leave `NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS=0` locally unless you explicitly want to test the Vercel Analytics script outside Vercel.

For current deployment and verification steps, use [`../docs/operations/release-and-deployment.md`](../docs/operations/release-and-deployment.md). Historical trust-layer redeploy notes were pruned after the issuer-aware contract flow became the active baseline.

## Run

```bash
npm run dev
```

Open http://localhost:3000. Install [Freighter](https://www.freighter.app/) and switch it to **Testnet**.

## Routes

| Path | Description |
|------|-------------|
| `/` | Persona-first landing page with Issue, Verify, and Hire entry paths |
| `/about` | About page |
| `/proof` | Proof lookup form — enter any cert hash to check status |
| `/proof/[hash]` | Public proof page — shareable, no wallet required. Cached 60 s at CDN; invalid hashes return instant 404. Verified proof pages expose an employer proof pack, a paid-trial handoff into `/employer`, a candidate-passport handoff into `/talent/[address]?proof=[hash]`, and a three-step employer review path. |
| `/proof/[hash]/export` | JSON employer proof pack with the same review path used by the proof and employer screens. It is useful for recruiters and ATS notes, but the standards preview is unsigned and not a conformant VC/Open Badges credential. |
| `/proof/[hash]/embed` | Compact iframe embed — for portfolios, Notion, blogs. `frame-ancestors *` CSP allows all hosts. |
| `/issuer` | Issuer dashboard — wallet-aware trust-state ladder, employer proof handoff guidance, and admin-only issuer approval/suspension controls |
| `/issuer/register` | Register the connected wallet as a pending issuer, with approval-readiness guidance before signing |
| `/employer` | Employer console for verified-credential paid-trial escrow. When opened from a proof page, it auto-loads the proof hash, shows a candidate/trust checklist, and blocks mismatched candidate links. |
| `/talent/[address]` | Candidate passport for one Stellar wallet. With `?proof=<hash>`, it shows that specific verified proof if the proof owner matches the wallet; it does not claim automatic wallet-wide discovery. |
| `/pilot` | Issuer pilot and employer integration intake, including testnet scope guardrails for the first 5-10 credential rollout |
| `/status` | Operational status surface for demo health, config checks, and source-labelled public contract-event evidence |

## Design system

Tokens and global styles live in `src/styles/globals.css`. The palette is dark-first (slate-900 background) with a gold primary (`--color-primary: #F59E0B`), purple accent, and tokenized font families for heading, body, mono, and pixel labels. Tailwind v4 utilities consume these tokens. A `prefers-reduced-motion` media query zeroes all animation durations globally.

## Layout

```
frontend/
├── next.config.ts                HTTP security headers + CSP for all routes
├── src/
│   ├── app/                      App Router (layout, page, /about, /proof, /proof/[hash], /proof/[hash]/embed)
│   ├── components/
│   │   ├── actions/              RegisterForm, VerifyForm, PayForm, NextActionCard
│   │   ├── activity/             RecentActivity (live on-chain events)
│   │   ├── layout/               AppShell, RpcStatusPill, SiteNav, SiteFooter
│   │   ├── milestones/           MilestoneRail
│   │   ├── proof/                ProofCard, ProofBlockPreview, ShareButtons, ProofQr
│   │   ├── ui/                   Button, Input, Badge, CopyButton, Skeleton, Toast
│   │   └── wallet/               WalletConnectButton
│   ├── hooks/
│   │   └── use-freighter-wallet.tsx
│   ├── lib/
│   │   ├── config.ts             Env + network config
│   │   ├── contract-client.ts    Soroban build/simulate/sign/submit (client-side)
│   │   ├── contract-read-server.ts  Server-side read-only simulation
│   │   ├── demo-data.ts          Fallback sample hashes for E2E / demo mode
│   │   ├── errors.ts             humanizeError — friendly error copy, no raw XDR leakage
│   │   ├── events.ts             RPC + Stellar Expert event reads, decoding, dedupe, and source labels
│   │   ├── format.ts             Amount + address formatting
│   │   ├── freighter.ts          Freighter wrapper (E2E mock included)
│   │   ├── issuer-registry.ts    Known issuer label lookup
│   │   ├── types.ts              Shared types (WalletStatus, TxState, etc.)
│   │   └── with-timeout.ts       Promise timeout helper
│   └── styles/
│       └── globals.css           Design tokens, reset, reduced-motion
```
