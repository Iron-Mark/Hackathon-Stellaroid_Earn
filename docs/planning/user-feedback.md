# User Feedback Documentation

## Feedback Collection

**Google Form:** [Stellaroid Earn - User Feedback Form](https://docs.google.com/forms/d/e/1FAIpQLSftFt8grSRUPecRVQWSRROLA8DAUOn4T61CrZQHtPQaMTxaWw/viewform)

Pilot users were asked to:
1. Connect their Freighter wallet to the Stellaroid Earn testnet demo
2. Explore the credential verification flow (view a proof page, check on-chain status)
3. Complete the feedback form with their wallet address, email, name, and product rating

**Anonymized public response export:** [`user-feedback-responses.xlsx`](user-feedback-responses.xlsx) (Excel), with the plain-text [`user-feedback-responses.csv`](user-feedback-responses.csv) committed alongside it.

Privacy note: raw form responses are not committed to this repository. The public CSV keeps the feedback text, ratings, timestamps, and testnet wallet addresses needed for review, but redacts names and emails before publishing.

---

## Participant Wallet Evidence

The following wallet addresses interacted with the Stellaroid Earn contract on Stellar testnet. Each is verifiable on [Stellar Expert](https://stellar.expert/explorer/testnet).

| # | User | Wallet Address | Interaction | Stellar Expert Link |
|---|------|---------------|-------------|---------------------|
| 1 | Participant 01 - Bootcamp participant | `GCBBBLZVJVVM2ZMXPNMDN2ATH7AJ2H4BHOKA7JOJT6EMWTOKCGRKUK6I` | Viewed proof, submitted feedback | [View](https://stellar.expert/explorer/testnet/account/GCBBBLZVJVVM2ZMXPNMDN2ATH7AJ2H4BHOKA7JOJT6EMWTOKCGRKUK6I) |
| 2 | Participant 02 - Employer role tester | `GALGZBDSFG4FRTFSO7XLURBJRYC6PA34H73IF66G7BZOXXQDMWSHPXEU` | Registered as issuer | [View](https://stellar.expert/explorer/testnet/account/GALGZBDSFG4FRTFSO7XLURBJRYC6PA34H73IF66G7BZOXXQDMWSHPXEU) |
| 3 | Participant 03 - Issuer flow tester | `GAWJEP7LWY7WPLP7SBPR4MWQGQJIBAHVNVXYQE33F5FL2VFMFGBBFZ4B` | Received XLM payment | [View](https://stellar.expert/explorer/testnet/account/GAWJEP7LWY7WPLP7SBPR4MWQGQJIBAHVNVXYQE33F5FL2VFMFGBBFZ4B) |
| 4 | Participant 04 - Mobile UX tester | `GCBZAJUZXRHNLVR4RCG743KSTKQSVFKXQCNYWAH4FVHDVSS5IT6DWSI3` | Verified credential | [View](https://stellar.expert/explorer/testnet/account/GCBZAJUZXRHNLVR4RCG743KSTKQSVFKXQCNYWAH4FVHDVSS5IT6DWSI3) |
| 5 | Participant 05 - Proof verification tester | `GAQZJQPZI7YZBUN6YVAFACVKAH6ODNBO3DVELP34VW4MLLUBCL5DMMNS` | Connected wallet, explored dashboard | [View](https://stellar.expert/explorer/testnet/account/GAQZJQPZI7YZBUN6YVAFACVKAH6ODNBO3DVELP34VW4MLLUBCL5DMMNS) |

---

## Feedback Summary

### Ratings Overview

| Question | Average Rating (1–5) |
|---|---|
| Overall experience | 4.2 |
| Ease of use | 3.8 |
| Design and UI | 4.5 |
| Would you use this again? | 4.0 |

### Common Themes

**What users liked:**
- Clean proof verification page  - no login needed
- On-chain transparency  - everything verifiable on Stellar Expert
- Fast transaction finality on testnet

**What users wanted improved:**
- Confusing role picker after wallet connect
- No mobile wallet support yet
- Would like transaction history in the dashboard

---

## Iteration Based on Feedback

After reviewing pilot feedback, the following improvements were implemented:

### Iteration 1: Role Guidance Hints

**Feedback addressed:** Users found the Issuer vs Employer toggle confusing with no context on what each role does

**Changes made:**
- Added contextual hint text below role tabs explaining each role's purpose
- Hint only appears in fresh state (before any credential actions)

**Commit:** [`c1450bf`](https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn/commit/c1450bf)

### Iteration 2: Role Choice Guidance After Connect

**Feedback addressed:** Testers were unsure which role to pick right after connecting their wallet ("Not clear which role to pick after connecting wallet").

**Changes made:**
- The fresh-state hint now shows what *both* Issuer and Employer do, labeled, instead of only the selected role, so a new user can choose.
- Reuses the existing localized strings, so it works across all six supported languages.

**Commit:** [`09c9d45`](https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn/commit/09c9d45)

### Iteration 3: Wallet Transaction History

**Feedback addressed:** Users wanted transaction history visible in the dashboard.

**Changes made:**
- Added an "Activity involving your wallet" panel on `/app` that lists recent contract events tied to the connected wallet, with a link to full account history on Stellar Expert.

**Commit:** [`fa0c5d0`](https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn/commit/fa0c5d0)

### Iteration 4: Mobile Support

**Feedback addressed:** Users asked for mobile support to check proofs on the go.

**Changes made:**
- Mobile-first redesign (bottom navigation, bottom-sheet dialogs, safe-area handling).
- Installable PWA with an offline fallback.
- WalletConnect signing for mobile wallets (LOBSTR, xBull, Hana, Freighter mobile).

**Commit:** [`145f6ad`](https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn/commit/145f6ad)

### Iteration 5: Issued-Credential Clarity

**Feedback addressed:** An issuer wanted a list of all credentials they had issued.

**Changes made:**
- Clarified in the wallet activity panel that issued credentials surface on the recipient's wallet, and that every signed action (issue, verify, pay) is in the issuer's full account history.

**Commit:** [`eb181b8`](https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn/commit/eb181b8)

---

## How to Reproduce User Testing

1. Share the live demo link: https://stellaroid.tech/
2. Ask testers to install [Freighter](https://www.freighter.app/) and switch to Testnet
3. Walk them through: connect wallet → view proof page → explore dashboard
4. Have them fill out the Google Form
5. Export responses to Excel
6. Redact personal names and emails before committing the CSV or updating this document
