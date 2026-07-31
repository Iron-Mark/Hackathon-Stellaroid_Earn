# Guided Session Facilitation

How to run the eight-team scenario from `scripts/guided-qa-cohort-lib.mjs` as a
live session with real participants, each connecting their own wallet.

This is the recruiting instrument. The guided QA cohort proved the product works
across all three roles; this proves people can drive it. One session of 24
participants moves the independent participant count from 30 to 54.

- Network: Stellar testnet only. No real money moves at any point.
- Contract: `CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV`
- Duration: 75 minutes, including setup slack
- Capacity: 24 participants in 8 tables of 3

## Why this shape

Each table runs one complete credential-to-payment loop, so every participant
signs at least one real transaction from their own wallet rather than watching a
demo. Three roles per table:

| Role | What they do | Transactions they sign |
| --- | --- | --- |
| Issuer | Registers the organization, issues a credential, verifies it | `register_issuer`, `register_certificate`, `verify_certificate` |
| Graduate | Submits the milestone against their verified credential | `submit_milestone` |
| Employer | Creates and funds the opportunity, approves, releases payment | `create_opportunity`, `fund_opportunity`, `approve_milestone`, `release_payment` |

I sign `approve_issuer` for each table from the facilitator key, because issuer
approval is admin-gated by design. That is one transaction per table and the
only one I sign.

The eight scenarios in `TEAM_SCENARIOS` give each table a distinct organization,
credential, and opportunity, so nothing collides on-chain and each table's
evidence is separable.

## Before the session

- [ ] Confirm testnet RPC and the deployed contract are healthy at `/status`
- [ ] Dry-run the scenario list so table cards match the plan exactly:
      `node scripts/run-guided-qa-cohort.mjs`
- [ ] Print or share one card per table: table number, organization name,
      credential title, opportunity title, and which role each seat holds
- [ ] Verify `/start` auto-funds on testnet from a fresh browser profile
- [ ] Have the Freighter install link ready, plus Albedo as the no-install
      fallback for locked-down laptops
- [ ] Confirm the facilitator key is loaded and is the expected admin address
- [ ] Open the feedback form; participants fill it at the end, not during

## Run of show

**0 to 10 min. Framing.**
What the product does in one sentence, then the loop on screen: a credential is
anchored, an employer funds an opportunity against it, approval releases the
payment. State plainly that this is testnet and the XLM has no monetary value.

**10 to 25 min. Everyone gets a wallet.**
Send everyone to `/start`. It connects a wallet, auto-funds on testnet, and
walks one real on-chain action. Nobody proceeds until their own address shows
funded. This is the step that produces independent participants, so do not let
anyone share a laptop or borrow an address.

**25 to 30 min. Tables and roles.**
Hand out table cards. Each seat takes issuer, graduate, or employer. Ask each
table to read their scenario aloud once so the names are settled before signing.

**30 to 60 min. Run the loop, table by table.**
Issuers go first: register, then wait for my approval, then issue and verify the
credential. I approve all eight issuers as they come in. Employers then create
and fund the opportunity against the verified credential. Graduates submit the
milestone. Employers approve and release.

Expect the issuer step to be the bottleneck. Tables that finish early can open
their graduate's public proof page and try the share link.

**60 to 70 min. Look at what you made.**
Each table opens their proof page and their release transaction on Stellar
Expert. This is the moment the point lands: the credential and the payment are
one verifiable record, readable without a wallet.

**70 to 75 min. Feedback.**
Everyone fills the form, including their wallet address so responses tie to
on-chain activity.

## After the session

Collect the 24 participant addresses. Then verify independently rather than
trusting the room:

```powershell
node scripts/verify-guided-qa-cohort.mjs
```

That script re-reads issuer, credential, and opportunity state live from the
contract, checks each address is funded on Horizon, and asserts the transaction
hashes are unique. Point it at the participant addresses for this session.

Record the results the same way the QA cohort log does: table, role, address,
transaction hashes, all linked to Stellar Expert.

## What this evidence proves, and what it does not

It proves 24 people each held their own key, connected their own wallet, and
signed real testnet transactions through the product. That is what the Level 5
user-growth requirement asks for, and it is the thing the guided QA cohort
cannot show, because I hold those keys.

It does not prove retention, and one session is not a growth curve. Say so when
presenting it.

## Related

- Guided QA evidence log: [guided-qa-cohort-2026-07.md](guided-qa-cohort-2026-07.md)
- Submission evidence index: [submission-evidence.md](submission-evidence.md)
- Demo readiness: [demo-checklist.md](demo-checklist.md)
