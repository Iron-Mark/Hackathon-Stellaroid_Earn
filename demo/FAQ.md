# FAQ: for judges, sponsors, and pilot partners

## Product

**Q: Who's Maria?**
Maria is the composite protagonist I use across the pitch, a Philippine bootcamp graduate applying to a Singapore fintech. She stands in for the 1.5M+ Filipinos doing remote/freelance work today. She's not a specific person, but every friction she hits (14–21 day verification delays, 32% resume-fraud skepticism, $30–$75 background check fees) is real and cited in `NOVELTY.md`. If you remember Maria, you remember the product.

**Q: What does "proof-of-work" mean here? Mining?**
No. I mean *evidence that a unit of work was completed, verified, and paid for.* Payment settles in testnet XLM with no real-world value. Zero compute, zero mining. Just a SHA-256 hash anchored on Stellar.

**Q: Does the deliverable file leave the user's machine?**
No. Hashing is done client-side in the browser via Web Crypto API. Only the hash touches the network.

**Q: What happens if a user loses the original file?**
The hash remains on-chain forever, but the hash alone cannot reconstruct the file. Users must keep their own copies. Stellaroid Earn is a proof registry, not storage.

**Q: Can the same hash be registered twice?**
No. The contract rejects duplicates. `AlreadyExists` is surfaced as a human-readable toast.

**Q: Can a proof be revoked?**
Yes. Approved issuers or the admin can revoke or suspend a credential, and public proof pages render those states. A richer reason taxonomy and signed standards-grade status list remain future work.

**Q: How does a third party verify a claim without a wallet?**
Anyone can open `/proof`, paste the 64-character SHA-256 hash (the input validates format before routing), and the proof page resolves read-only. No Freighter, no signing, no account. Employers, recruiters, and grant committees can verify a receipt from a phone browser.

## Business

**Q: What's the revenue model?**
Today: none. Future: small platform fee on the pay step (opt-in), SaaS tier for organizations that want white-labeled proof pages, or stablecoin rails with spread.

**Q: Who pays the transaction fees?**
The signing wallet. Stellar fees are sub-cent, so it's a non-issue for demos and realistic use.

**Q: Why Stellar and not Ethereum or Solana?**
Sub-cent fees + 5-second finality + Freighter's smooth onboarding + native payment primitives (no wrapped assets). Ethereum fees kill micro-payments. Solana has better fees but Freighter's UX + Soroban's Rust DX won for this vertical.

## Technical

**Q: What's on-chain vs. off-chain?**
On-chain: SHA-256 hash, issuer address, graduate address, amount (in testnet XLM, no real-world value), status flags, timestamps. Off-chain: the deliverable file itself (user-held).

**Q: What's the stack?**
Next.js 15 (App Router) + React 19, Tailwind CSS v4 design tokens, `@stellar/stellar-sdk`, `@stellar/freighter-api`, and Rust + Soroban SDK for the contract.

**Q: Is it mainnet-ready?**
No. Testnet-only for the MVP. Mainnet readiness is a dedicated work item: contract audit, gas/fee review, error budget, rate limits on the RPC.

**Q: What happens when Soroban RPC goes down?**
The health pill turns red within 60 seconds. `withTimeout` (15s) prevents UI hangs. Humanized error messages ship to the user, never raw ScVal or HostError. Route-level errors hit a branded error boundary (`app/error.tsx`) with a retry action; unknown URLs and malformed proof hashes hit a branded 404 (`app/not-found.tsx`) that links back to the `/proof` lookup. Status metrics also use Stellar Expert as a public index fallback so older event evidence can remain visible when RPC retention moves past the original transactions.

**Q: Accessibility?**
WCAG AA contrast on all tokens. `:focus-visible` rings everywhere. `prefers-reduced-motion` respected globally. 44×44 minimum touch targets. Inline SVG icons (no emoji).

## Security

**Q: What stops someone from anchoring a fake hash?**
Nothing at the cryptographic layer. The contract just stores what's submitted. Trust in *who* issued comes from the issuer's address. This is a **provable audit trail**, not a KYC system. Pair with DID / verifiable credentials for strong identity.

**Q: What if Freighter is phished?**
Same answer as any wallet app. I never touch seed phrases. I only request signatures on scoped transactions. Users approve each action explicitly.

**Q: Error handling?**
All contract errors flow through `humanizeError()`: 10 mapping rules covering user-rejected, network mismatch, timeout, simulation failed, unauthorized, duplicate, invalid, not-found, fetch-failed, insufficient-balance, and a safe fallback. Raw errors never reach JSX.

## Roadmap

**v1 (today):** register -> verify -> revoke/suspend when needed -> pay -> share, testnet.
**v1.1:** batch issuance preview, richer event evidence, pilot feedback loop.
**v2:** mainnet readiness, USDC-on-Stellar payment option, multi-signer issuers, signed VC/Open Badges export.
**v3:** org dashboards, API for external verification, embeddable proof widget.
