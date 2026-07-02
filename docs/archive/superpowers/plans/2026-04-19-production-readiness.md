# Production Readiness — Future Plans

> Status: Not started — items below are identified gaps between the current testnet demo and a production-grade deployment.

---

## 1. Mainnet Migration

- Deploy contract to Stellar mainnet
- Swap `.env` values: RPC URL, network passphrase, contract ID
- Remove Friendbot references from onboarding copy
- Test full register → verify → pay flow with real XLM

---

## 2. Contract Improvements

- **Multi-sig admin** — replace single admin key with Stellar native multisig or a governance contract so no single key is a point of failure
- **Issuer expiry** — add `expiry_ledger` field to issuer record so approvals aren't permanent
- **Batch operations** — add `batch_approve(issuers: Vec<Address>)` to reduce admin friction at scale
- **Upgradeable contract** — use a proxy/data-separation pattern so logic can be patched without losing on-chain state

---

## 3. Wallet & Access

- **WalletConnect support** — integrate `@stellar/wallet-sdk` to support Albedo, xBull, and mobile wallets beyond Freighter
- **Mobile unlock** — WalletConnect would naturally unblock mobile users without a separate native app

---

## 4. Data & Storage

- **IPFS metadata** — pin certificate metadata JSON to IPFS and store the CID on-chain alongside the hash so the full credential is decentralized
- **Event indexing** — index contract events in a lightweight backend or via StellarExpert API to enable hash search without knowing the exact value
- **Reduce proof staleness** — lower `revalidate` on proof pages or add `revalidatePath()` on-demand revalidation after status changes

---

## 5. RPC Reliability

- Add fallback RPC URLs in `lib/config.ts`
- Add retry logic with exponential backoff in `lib/contract-client.ts`
- Monitor RPC health via the existing `RpcStatusPill` — surface degraded state more prominently

---

## 6. Admin & Issuer Flow

- **Auto-approval pipeline** — webhook or cron job that triggers `approve_issuer` after off-chain KYC/verification step
- **Issuer notifications** — email via Resend/SendGrid when `register_issuer` event is detected, and again when approved
- **Delegated admins** — allow the contract admin to grant approval rights to other addresses

---

## Priority Order for Production

1. Mainnet deploy (contract + env)
2. Multi-sig admin
3. IPFS metadata
4. WalletConnect
5. Event indexing / search
6. Auto-approval pipeline + notifications
