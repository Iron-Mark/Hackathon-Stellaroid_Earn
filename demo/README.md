# Stellaroid Earn Demo Kit

> Prove the work. Settle the payout. Share the proof.
> A Stellar testnet demo for credential proof, issuer trust, and employer paid-trial handoff.

This folder is the demo hub for judges, sponsors, employers, and early design partners who need to understand the app quickly without relying on a wallet transaction during the presentation.

## Contents

| File | Purpose | Read time |
|---|---|---|
| [`ONE_PAGER.md`](./ONE_PAGER.md) | Elevator pitch, problem, solution, traction hooks | 60 sec |
| [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) | Live walkthrough script: what route to show and what to say | 3 min |
| [`NOVELTY.md`](./NOVELTY.md) | What's new about it and why it's marketable | 2 min |
| [`FAQ.md`](./FAQ.md) | Technical and business questions judges ask | reference |
| [`PRESS_KIT.md`](./PRESS_KIT.md) | Taglines, boilerplate copy, social blurbs, hashtags | reference |

## The 10-second pitch

> Maria graduated top of her cohort in Quezon City. Verifying her credential takes her next employer three weeks, so the role goes to someone who did not need verifying. Stellaroid Earn anchors the hash on Stellar testnet, turns it into a public proof URL, and carries that proof into an employer paid-trial workflow.

## The one-line reframe

> We did not pick a vertical. We picked a shape of transaction: prove -> verify -> act. Which vertical it runs in is a go-to-market decision, not a technical one.

## Live demo

- **Canonical app:** https://stellaroid.tech/
- **Status/runbook:** https://stellaroid.tech/status
- **Network:** Stellar testnet
- **Contract ID:** `CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV`
- **Wallet:** Freighter in testnet mode, only needed for write flows.
- **No-wallet proof flow:** `/proof` and `/proof/[hash]`

## Registered certificates

Known sample proof URLs from the current testnet demo. The public proof pages do not require Freighter.

| # | Hash | Title | Cohort | Status |
|---|---|---|---|---|
| 1 | `b7c433bad95373ba4ef70815eb72665b9bc37dd6190df204f7b1cc794096a254` | Stellar Bootcamp Completion | UniTour 2026 | Verified |
| 2 | `35a19276e58b8f742177892531def5e820f7c07bd8fd5a716ac710db09e6702e` | Stellar Smart Contract Bootcamp Completion | Stellar Philippines UniTour 2026 | Verified |
| 3 | `c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3` | Stellar Smart Contract Bootcamp Completion | Stellar PH Bootcamp 2026 | Verified |
| 4 | `c6df0adf9d1a6f5a88d847e8e9a779e71aa2435d6fa47b47d065ebbfa8c1f890` | Stellar Smart Contract Bootcamp Completion | Stellar PH Bootcamp 2026 | Issued demo sample |

Proof pages:

- https://stellaroid.tech/proof/b7c433bad95373ba4ef70815eb72665b9bc37dd6190df204f7b1cc794096a254
- https://stellaroid.tech/proof/35a19276e58b8f742177892531def5e820f7c07bd8fd5a716ac710db09e6702e
- https://stellaroid.tech/proof/c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3

## Recommended demo route

1. Start at `https://stellaroid.tech/status` and confirm the runbook/health panel is green.
2. Open the verified sample proof.
3. Use **Fund paid trial** to hand the proof into `/employer`.
4. Open `/issuer` or `/issuer/register` to show the issuer trust path.
5. Close on `/pilot` for the narrow testnet rollout boundary.

## Run it locally

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000/status`, then follow [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md).
