# Live Demo Script - 3 Minutes

> Rehearsed for a live audience with a projector. Times are wall-clock. Every step has a say line and an action line.

## Pre-flight

- Browser tab 1: `https://stellaroid.tech/status`
- Browser tab 2: `https://stellar.expert/explorer/testnet`
- Optional wallet tab: Freighter unlocked on testnet if you plan to show issuer registration or write flows.
- Zoom browser to 110% so the back row can read it.
- Keep this verified proof URL ready:
  `https://stellaroid.tech/proof/c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3`

---

## 00:00 - Hook (20s)

**Say:**

> "Meet Maria. She graduated top of her bootcamp cohort in Quezon City and applied to a Singapore fintech on a Tuesday. The employer emailed her school to verify. Three weeks later, the role was filled by someone who did not need verifying. The certificate was real. Proving it cost more than hiring around it. Stellaroid Earn makes proof cheaper than skipping it."

**Action:** Open `/status`. Point at the health card and the demo runbook.

---

## 00:20 - Show the current demo surface (25s)

**Say:**

> "This is the maintained testnet demo. The status page shows the canonical domain, current contract, runtime checks, and the exact route sequence I can run live without depending on a wallet popup."

**Action:** On `/status`, confirm the page shows the runbook cards: Verified proof, Employer handoff, Issuer trust, Pilot boundary.

---

## 00:45 - Walletless proof (40s)

**Say:**

> "A recruiter does not need Freighter. They open a public proof URL, read the on-chain status, check the issuer, and copy or download the proof pack."

**Action:** Click **Verified proof** or open the prepared proof URL.

**Say:**

> "The hash is the stable lookup key. The page keeps issuer trust, credential status, QR, explorer links, and sharing actions in one place."

**Action:** Show the proof status, QR, and copy/download actions.

---

## 01:25 - Employer handoff (40s)

**Say:**

> "The proof is not just a receipt. It moves into the employer workflow. A verified credential can prefill the paid-trial review path so the employer checks the proof before escrow."

**Action:** Click **Fund paid trial** on the proof page. Confirm `/employer` receives the certificate hash. If the candidate wallet is present, point at the candidate match/checklist panel.

**Say:**

> "This keeps the employer from funding an offer against the wrong wallet or an untrusted proof."

---

## 02:05 - Issuer trust (25s)

**Say:**

> "The issuer path is separate from the employer path. A wallet can claim issuer metadata, but the UI distinguishes claim, approval, suspension, and revocation states."

**Action:** Open `/issuer` or `/issuer/register`. Show the issuer registry language and approval boundary.

---

## 02:30 - Pilot boundary (20s)

**Say:**

> "The next responsible step is not marketplace scope. It is a narrow testnet pilot: one issuer, a small credential batch, one employer review, public proof pages, and a rollback plan."

**Action:** Open `/pilot`. Point at the current pilot boundary and guardrails.

---

## 02:50 - Close (10s)

**Say:**

> "Three weeks compressed into a proof URL and an employer review path. Stellaroid Earn turns a certificate hash into something an issuer, candidate, and employer can all act on."

**Action:** Leave the proof page or `/status` visible. Point judges at [`ONE_PAGER.md`](./ONE_PAGER.md), [`FAQ.md`](./FAQ.md), and [`docs/DEMO_CHECKLIST.md`](../docs/DEMO_CHECKLIST.md).

---

## Fallbacks

- If RPC is slow, stay on `/status` and show the runtime check result rather than waiting silently.
- If a dynamic proof lookup fails, open the prepared verified proof URL above.
- If Freighter is unavailable, skip issuer writes and keep the demo on proof, employer, status, and pilot routes.
- If `/employer` is missing candidate context, paste the same proof hash into the lookup field; the employer review still works from the credential record.
- If a route throws, use `/status` as the reset point and continue with the next card.
