# Demo Exhibits Seed Log

The `/demo` guided tour and the `/opportunity` directory rely on two escrow
exhibits seeded as **real transactions** on the public testnet contract
(`CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV`). Nothing on
`/demo` is simulated; every card links to these records.

## Actors

| Role | Alias (local `stellar` CLI) | Address |
| --- | --- | --- |
| Employer | `demo-employer` | `GAHBWPHQPFF5GTD6DTR7WF3S5SUQ5YKS5L7DDCBPEWBEQLADLML7H7XQ` |
| Candidate / credential owner | `deploy-key` | `GALGZZRXRB5SIBGT62OZDA7BMPC4YUZDECHVHGWOAMXIMNLTZGFGTLMN` |

The candidate must be the owner of the verified sample credential
(`c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3`) —
`create_opportunity` enforces `cert.owner == candidate`.

## Exhibit A — opportunity #0, full cycle (status: `released`)

25 XLM escrowed, one milestone, released to the candidate. Seeded 2026-07-10.

| Action | Tx hash |
| --- | --- |
| create_opportunity | `f0cb61965fbf941ebd7cff0cd07e8741e8425d6ca88e11c1ca81683c2d32b0f9` |
| fund_opportunity | `1056631081c50335d905a570e363249c985bf385836be7b5feb5f71c473f407a` |
| submit_milestone | `2cfa468ddf9aa110fd6f9fb25a2c2758f6a9cb1f90093ae76b67fdf9a8b03b31` |
| approve_milestone | `f2ac95e80f4f789a1c5bd6ca8cab2b38791ac8da1463baabde86077e4e7d0e0e` |
| release_payment | `8b1b1f435f6c63b2e38102ae8a2cfa3ea72064245622c07fdb1258e0c55e5c4c` |

## Exhibit B — opportunity #1, live escrow (status: `funded`)

10 XLM locked, two milestones, intentionally left mid-flight so the tour can
show funds sitting in the contract. Seeded 2026-07-10.

| Action | Tx hash |
| --- | --- |
| create_opportunity | `27a81f41be1f9615dd5b9e794a87fd85c025840ea7a0176e61e34f802151e275` |
| fund_opportunity | `7765809807c6d4c619a9a10a818262a7b64e6467871c537e42c60971d1c1ac1d` |

Do **not** approve/release/refund exhibit B — its value is being live.

## Direct `link_payment` evidence (2026-08-27)

One testnet XLM (`10000000` stroops, no monetary value) from a fresh
Friendbot-funded employer wallet, not `demo-employer` and not one of the QA
keys I operate, to the sample credential owner above. Opportunity #1 was not touched.

| Field | Value |
| --- | --- |
| Employer | `GASY7N4RT2AJBPO43MYLMPU5K2NT7VFHMPNIOPAWZ4HVRREMCTK7O4XT` |
| Amount | 1 testnet XLM |
| Tx | [`7173ace84a571b862b5a8684aa6342dfd8cb9ba4f1ab8381111bb08216d348c7`](https://stellar.expert/explorer/testnet/tx/7173ace84a571b862b5a8684aa6342dfd8cb9ba4f1ab8381111bb08216d348c7) |
| Ledger | 4353114 |

This is what moves the `/status#metrics` Payments tile. Escrow `release_payment`
events are counted separately as `pay_rel`.

## Frontend wiring

- `frontend/src/lib/config.ts` — `demoOpportunityReleasedId` (default `"0"`) and
  `demoOpportunityLiveId` (default `"1"`); override with
  `NEXT_PUBLIC_DEMO_OPPORTUNITY_RELEASED_ID` / `NEXT_PUBLIC_DEMO_OPPORTUNITY_LIVE_ID`.
- `frontend/src/lib/demo-tour.ts` — step copy plus the fund/release tx links above.

## Reseeding after a contract redeploy

1. Re-register + verify the sample credential (see
   `docs/operations/contract-verification.md` seed txs for the pattern).
2. Repeat the two exhibits with `stellar contract invoke` as above
   (`create_opportunity` → `fund_opportunity` [→ `submit_milestone` →
   `approve_milestone` → `release_payment` for exhibit A]).
3. Update the IDs (env vars or config defaults), the tx hashes in
   `demo-tour.ts`, and this log.
