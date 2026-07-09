# Stellaroid Earn Demo Checklist

Canonical live URL: https://stellaroid.tech

Use this short checklist before a submission, demo, or public share.

Last live smoke pass: 2026-07-09 (new source-verified contract CAD6C24P…ISZCV; verified + issued demo proofs, /status events, and /docs confirmed live). `stellaroid.tech`, `beta.stellaroid.tech`, and `v3.stellaroid.tech` returned `200 OK` on `/` and `/status` with Stellaroid page titles/content.

## Public Demo Path

- Open https://stellaroid.tech and confirm the homepage loads as Stellaroid Earn.
- Open the verified proof:
  https://stellaroid.tech/proof/c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3
- Confirm the proof shows `Verification breakdown` with hash anchor, contract record, credential status, issuer registry, employer handoff checks, and an issuer trust dossier score.
- From the proof page, click `Fund paid trial` and confirm `/employer` opens with the proof context.
- In `/employer`, confirm the employer review brief repeats the issuer trust dossier before escrow creation.
- Open https://stellaroid.tech/status#metrics and confirm it shows the canonical URL, current project state, and public contract-event evidence with source labels.
- On `/status#metrics`, confirm the `Event stream` panel moves from connecting to a snapshot/live state and reports RPC/indexer source counts.

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
- Stellar testnet contract:
  https://stellar.expert/explorer/testnet/contract/CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV

## Demo Talk Track

1. Start with the homepage: Stellaroid Earn turns completed work into a public credential proof.
2. Open a verified proof: the proof is walletless, shareable, and separates hash, contract, issuer, and employer-readiness evidence.
3. Click into employer flow: employers can carry verified proof context, save candidates into a local review shortlist, and use proof-pack evidence before creating a paid trial.
4. End on status: the project has a canonical domain, operational status route, source-labelled event evidence, and a bounded testnet pilot path.
