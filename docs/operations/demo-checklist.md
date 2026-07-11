# Stellaroid Earn Demo Checklist

Canonical live URL: https://stellaroid.tech

Use this short checklist before a submission, demo, or public share.

Last live smoke pass: 2026-07-10 (guided demo, opportunity directory, pilot lead form with Resend delivery, trust pages, escrow events in feeds all confirmed live on `stellaroid.tech`).

Lighthouse (mobile, throttled, 2026-07-10 — after the stellar-sdk lazy-load): `/` = 72, `/app` = 60, `/demo` = 82; TBT 50–260 ms everywhere; CLS ≈ 0 on `/` and `/demo`. Known watch item: `/app` CLS 0.139 under throttling (font swap suspected; not reproducible on warm loads). Speed Insights is intentionally NOT enabled (billable) — re-run Lighthouse for fresh numbers instead.

## Public Demo Path

- Open https://stellaroid.tech and confirm the homepage loads as Stellaroid Earn.
- Take the wallet-less tour: https://stellaroid.tech/demo — all four steps show live
  status badges (Anchored / Verified / funded 10 XLM / released 25 XLM) and each
  `Verify on stellar.expert` link resolves.
- Open the verified proof:
  https://stellaroid.tech/proof/c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3
- Confirm the proof shows `Verification breakdown` with hash anchor, contract record, credential status, issuer registry, employer handoff checks, and an issuer trust dossier score.
- From the proof page, click `Fund paid trial` and confirm `/employer` opens with the proof context.
- In `/employer`, confirm the employer review brief repeats the issuer trust dossier before escrow creation.
- Open https://stellaroid.tech/opportunity and confirm both demo exhibits list
  (#1 `funded`, #0 `released`) and each row opens its escrow console.
- Open https://stellaroid.tech/status#metrics and confirm it shows the canonical URL, current project state, and public contract-event evidence with source labels — including escrow events (`Opportunity #N funded/released`), not just credential events.
- On `/status#metrics`, confirm the `Event stream` panel moves from connecting to a snapshot/live state and reports RPC/indexer source counts.
- Submit a test lead on https://stellaroid.tech/pilot#request and confirm the
  success panel plus the notification email in the LEAD_INBOX_EMAIL inbox.

## Social Preview

- Share the homepage URL and confirm the title is `Stellaroid Earn`.
- Share the verified proof URL and confirm the preview uses the proof-specific title and image.
- Confirm OG image URLs return `200` with `image/png`.

## Evidence Links

- Live app: https://stellaroid.tech
- Staging app: https://beta.stellaroid.tech
- July showcase: https://v3.stellaroid.tech
- Status page: https://stellaroid.tech/status
- Beta status page: https://beta.stellaroid.tech/status
- July status page: https://v3.stellaroid.tech/status
- Events API: https://stellaroid.tech/api/events
- Events stream: https://stellaroid.tech/api/events/stream
- Frontend CI: https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn/actions/workflows/frontend-ci.yml
- Contract CI: https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn/actions/workflows/contract-ci.yml
- Verified proof: https://stellaroid.tech/proof/c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3
- Guided demo (wallet-less): https://stellaroid.tech/demo
- Opportunity directory: https://stellaroid.tech/opportunity
- Demo escrow exhibits (seed log): ../operations/demo-exhibits.md
- Security disclosure: https://stellaroid.tech/.well-known/security.txt
- Stellar testnet contract:
  https://stellar.expert/explorer/testnet/contract/CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV

## Demo Talk Track

1. Start with the homepage: Stellaroid Earn turns completed work into a public credential proof.
2. Take the guided demo (`/demo`): the full register → verify → escrow → payout story on real, independently auditable testnet data — no wallet needed.
3. Open a verified proof: the proof is walletless, shareable, and separates hash, contract, issuer, and employer-readiness evidence.
4. Click into employer flow: employers can carry verified proof context, save candidates into a local review shortlist, and use proof-pack evidence before creating a paid trial.
5. Show the opportunity directory (`/opportunity`): every live escrow, filterable by your wallet's role.
6. End on status: canonical domain, operational status route, source-labelled event evidence (credential AND escrow events), and a bounded testnet pilot path with an on-site pilot request form.
