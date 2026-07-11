# Rise In Submission Draft — July 2026 Monthly Builder Round

Paste-ready copy for the submission form. Everything below is verifiable on
the live site or on stellar.expert — no claim here outruns the product.

---

## One-liner

Stellaroid Earn turns bootcamp certificates into on-chain proof and closes the
loop with escrowed XLM payouts — verify a graduate in seconds, then pay them
on the same rails.

## Description (short)

Bootcamp certificates are PDFs anyone can fake and no one can independently
verify. Stellaroid Earn anchors each certificate's SHA-256 hash on a Soroban
smart contract, lets approved issuers verify it on-chain, and gives anyone a
public proof URL that needs no wallet or login. Employers go one step further:
they escrow XLM against milestones tied to a verified credential, and the
contract — not the platform — releases payment when work is approved. All on
Stellar testnet, all publicly auditable.

## What shipped this round (July v3.2)

- **Wallet-less guided demo** (stellaroid.tech/demo): the full
  register → verify → escrow → payout story on real, independently auditable
  testnet data — a released 25 XLM escrow and a live funded one — with per-step
  stellar.expert audit links. Judges need no extension, and it works on a phone.
- **Opportunity directory** (/opportunity): every live escrowed paid trial on
  the contract, filterable by the connected wallet's role, deep-linking into
  the milestone console.
- **Escrow evidence everywhere**: the live event feeds now decode all six
  escrow events alongside credential events, deduplicated across the Soroban
  RPC and the Stellar Expert indexer; /app shows the events involving your
  wallet.
- **Source-verified contract**: redeployed from committed source with
  `source_repo`/`home_domain` metadata embedded; the deployed WASM hash is
  reproducible from the repo (`verify-contract-source.ps1 -RequireSourceMatch`
  passes) and the release tag carries a GitHub build attestation.
- **Startup posture**: on-site pilot intake form (rate-limited, delivered by
  email), /contact, honest /privacy (including the on-chain-data-is-permanent
  disclosure), RFC 9116 security.txt, first-party client-error telemetry.
- **Performance**: the multi-MB stellar-sdk is lazy-loaded out of First Load
  JS (/app 483 → ~260 KB gzipped), brand fonts self-hosted via next/font,
  installable PWA. Lighthouse performance (mobile, PageSpeed methodology):
  **/ = 97, /demo = 96, /app = 85**.

## Live on the contract

The testnet contract is fully populated, and every one of the 19 public
functions is exercised on-chain and publicly auditable on stellar.expert:

- **6 issuers** in the trust registry across bootcamp, university, guild, and
  employer categories — one suspended, exercising the moderation path.
- **106 credentials** spanning every status: 75 verified, 21 pending, 5
  revoked, 5 suspended.
- **17 escrowed paid trials** covering every lifecycle state — draft, funded,
  in-progress, submitted, released, and refunded.
- **Direct XLM payments and admin rewards**, closing the proof-to-payment loop.

Browse it live at stellaroid.tech/opportunity, or watch the event stream at
stellaroid.tech/status.

## Judge quick path (2 minutes, no wallet)

1. https://stellaroid.tech/demo — four steps, live status badges read from
   chain, every step independently auditable on stellar.expert.
2. https://stellaroid.tech/proof/c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3
   — the public verified proof page.
3. https://stellaroid.tech/opportunity — 17 escrowed paid trials across every
   lifecycle state, filterable by wallet role.
4. https://stellaroid.tech/status — source-labelled on-chain event evidence.

## Evidence links

| What | Link |
| --- | --- |
| Live app | https://stellaroid.tech |
| Guided demo (no wallet) | https://stellaroid.tech/demo |
| Contract (source-verified) | https://stellar.expert/explorer/testnet/contract/CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV |
| Deployed WASM hash | `1b7479f1ca0f12846bbfdd8f0681670692e29e1f20618150912f010b7caf4b9f` (reproducible from committed source) |
| Escrow release tx (25 XLM paid on-chain) | https://stellar.expert/explorer/testnet/tx/8b1b1f435f6c63b2e38102ae8a2cfa3ea72064245622c07fdb1258e0c55e5c4c |
| Populated registry | 6 issuers · 106 credentials · 17 escrows · payments + rewards — all on the contract above |
| Repository | https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn |
| Contract CI / Frontend CI | green on main (cargo test 12/12 · build+lint+typecheck+50 unit+20 e2e) |
| Developer docs | https://stellaroid.tech/docs |
| Pitch deck | https://stellaroid.tech/slides |

## Tech stack (one line)

Rust + soroban-sdk 26.1 (19 public functions: credential registry + milestone
escrow) · Next.js 15 + React 19 PWA · Freighter + Albedo wallets · native XLM
via SAC · Vercel.

## Scope & verifiability

Everything runs on Stellar **testnet** as an early-access pilot — no mainnet or
production-revenue claims. Every figure above corresponds to a real, publicly
auditable on-chain transaction; nothing is mocked or simulated. Open any hash
on stellar.expert to verify it yourself.
