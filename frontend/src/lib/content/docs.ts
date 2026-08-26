// Developer documentation registry — /docs, /docs/[slug], the sitemap, and
// the docs sidebar all derive from this single typed source. Content is
// grounded in docs/reference/*.md, contracts/stellaroid_earn/src/lib.rs, and the contract
// surface on /about; reviewed against the deployed testnet contract.
import type { DocPage } from "./types";

export const docsPages: DocPage[] = [
  {
    "slug": "index",
    "title": "Stellaroid Earn documentation",
    "metaTitle": "Developer documentation & quickstart",
    "metaDescription": "Developer docs for Stellaroid Earn: on-chain credential verification and instant XLM payment on Stellar testnet. Quickstart, contract API, and guides.",
    "keywords": [
      "Stellaroid Earn",
      "Soroban smart contract",
      "Stellar testnet",
      "on-chain credential verification for developers",
      "XLM payments",
      "Freighter wallet",
      "developer documentation"
    ],
    "navLabel": "Overview",
    "lede": "Developer documentation for Stellaroid Earn, an early-access pilot on Stellar testnet that anchors credential hashes on a Soroban smart contract and pays verified graduates in XLM. Start with the quickstart below, then use the map to reach the contract, integration, architecture, and security pages.",
    "blocks": [
      {
        "type": "p",
        "text": "Stellaroid Earn treats a credential as an on-chain record. A school or bootcamp anchors a certificate's SHA-256 hash to a student's Stellar wallet through a Soroban smart contract, an approved issuer verifies it, and an employer pays the graduate in XLM in the same flow. Verification is public and read-only: anyone can open a proof page and confirm a credential without a wallet, login, or API key."
      },
      {
        "type": "p",
        "text": "For developers, the system is deliberately small. The contract is Rust + `soroban-sdk`, deployed to Stellar testnet. Live tag v3.0.0 has a 19-function public surface, a credential core plus a milestone-escrow extension, and typed contract errors. Repository source adds issuer refresh dates and credential expiry writes without changing `register_certificate`. The frontend is Next.js 16 + React 19 using `@stellar/stellar-sdk`: read-only calls go through `simulateTransaction`, and writes are signed with Freighter or Albedo and submitted over Soroban RPC. Every state change emits a contract event that is auditable on Stellar Expert."
      },
      {
        "type": "p",
        "text": "This docs hub is written for developers, technical issuers, and security reviewers. The first rollout is intentionally bounded to a small testnet issuer pilot; issuer intake happens at `/pilot` on the live site."
      },
      {
        "type": "callout",
        "text": "Testnet only. Stellaroid Earn is a free public pilot on Stellar testnet — no purchase, no subscription, and no real funds. There is no mainnet deployment; never send mainnet XLM to any address shown in these docs."
      },
      {
        "type": "h2",
        "text": "The core flow"
      },
      {
        "type": "p",
        "text": "The happy path is three contract calls. Each one is a real transaction on Stellar testnet and each emits an on-chain event."
      },
      {
        "type": "table",
        "headers": [
          "Function",
          "Caller",
          "Effect"
        ],
        "rows": [
          [
            "register_certificate(issuer, student, cert_hash, title, cohort, metadata_uri)",
            "Approved issuer",
            "Binds the certificate's SHA-256 hash to the student's wallet; duplicate hashes are rejected on-chain; emits cert_reg"
          ],
          [
            "verify_certificate(verifier, cert_hash)",
            "Approved issuer or admin",
            "Sets the credential status to Verified; emits cert_ver"
          ],
          [
            "link_payment(employer, student, cert_hash, amount)",
            "Employer",
            "Transfers XLM via the native Stellar Asset Contract directly to the verified student; emits payment"
          ]
        ]
      },
      {
        "type": "p",
        "text": "These three functions sit on a 19-function live surface (tag v3.0.0): an issuer trust layer (`register_issuer` → `approve_issuer`, plus `suspend_issuer`), credential lifecycle controls (`revoke_certificate`, `suspend_certificate`), an admin-initiated `reward_student` payment, read-only lookups (`get_certificate`, `get_issuer`), and a seven-function milestone-escrow extension for funded paid trials (`create_opportunity` through `get_opportunity`). Repository source adds issuer refresh dates and credential expiry writes. A revoked credential blocks downstream payments on-chain. The full reference, including error codes and the status lifecycle, is in /docs/contract."
      },
      {
        "type": "h2",
        "text": "Quickstart: try the pilot"
      },
      {
        "type": "p",
        "text": "You can go from zero to a signed testnet transaction in a few minutes. Step 1 requires nothing installed."
      },
      {
        "type": "h3",
        "text": "1. Open a proof page — no wallet required"
      },
      {
        "type": "p",
        "text": "Open a live verified credential: https://stellaroid.tech/proof/c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3 — the page reads the certificate record from the contract via `simulateTransaction`. A green badge means verified on-chain; amber means issued but not yet verified."
      },
      {
        "type": "h3",
        "text": "2. Connect a wallet on testnet"
      },
      {
        "type": "p",
        "text": "Install the Freighter browser extension and switch it to Testnet, or use Albedo, a web-based wallet that also covers the mobile signing path. Then open https://stellaroid.tech/app and connect."
      },
      {
        "type": "h3",
        "text": "3. Fund a testnet account via friendbot"
      },
      {
        "type": "p",
        "text": "Testnet accounts are funded with test XLM by friendbot, Stellar's testnet faucet. With the Stellar CLI (v26+), the `--fund` flag friendbot-funds the key at creation:"
      },
      {
        "type": "code",
        "lang": "bash",
        "text": "stellar keys generate my-key --network testnet --fund\nstellar keys address my-key"
      },
      {
        "type": "h3",
        "text": "4. Run the /app flow"
      },
      {
        "type": "p",
        "text": "The dashboard at https://stellaroid.tech/app has two roles. As an issuer, you register a certificate hash for a student wallet and then approve it (`verify_certificate`). As an employer, you paste a verified hash and an amount to send a credential-linked XLM payment. Note the trust gate: issuer registration enters a Pending queue on-chain, and only admin-approved issuers can register or verify credentials — suspended issuers are blocked at the contract level."
      },
      {
        "type": "h2",
        "text": "Documentation map"
      },
      {
        "type": "table",
        "headers": [
          "Page",
          "What it covers"
        ],
        "rows": [
          [
            "/docs/contract",
            "Full Soroban contract reference: all 19 public functions, typed error codes, events, and the credential status lifecycle"
          ],
          [
            "/docs/integration",
            "Calling the contract from your own frontend: environment config, the wallet layer (Freighter + Albedo), and the read/write transaction paths"
          ],
          [
            "/docs/architecture",
            "System design: the Next.js app, two read paths (server-rendered proof pages + client-side simulation), one write path, and event indexing"
          ],
          [
            "/docs/security",
            "Security posture: contract access control, CSP and security headers, input validation, and the fee-sponsor authorization boundary"
          ]
        ]
      },
      {
        "type": "h2",
        "text": "Source and deployment"
      },
      {
        "type": "ul",
        "items": [
          "GitHub repository (MIT license): https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn",
          "Contract source: https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn/tree/main/contract",
          "Deployed contract (testnet): CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV — inspect it at https://stellar.expert/explorer/testnet/contract/CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV",
          "Live app: https://stellaroid.tech · operational status: https://stellaroid.tech/status"
        ]
      },
      {
        "type": "p",
        "text": "The deployed testnet contract's WASM hash is `1b7479f1ca0f12846bbfdd8f0681670692e29e1f20618150912f010b7caf4b9f`, built from committed source with `source_repo` and `home_domain` verification metadata embedded. The matching GitHub release attestation is tracked in the repo's verification runbook."
      }
    ],
    "faq": [
      {
        "question": "Is Stellaroid Earn running on Stellar mainnet?",
        "answer": "No. All flows run on Stellar testnet only. Stellaroid Earn is a free early-access pilot with no purchase, subscription, or mainnet funds involved, and it should not be treated as a production financial product."
      },
      {
        "question": "Do I need a wallet to verify a credential?",
        "answer": "No. Proof pages are public and read-only — they check on-chain state via simulateTransaction, so anyone can confirm a credential without a wallet, login, or API key. A wallet is only needed to issue, verify, or pay on-chain."
      },
      {
        "question": "Which wallets does Stellaroid Earn support?",
        "answer": "Freighter (a browser extension, set to Testnet) and Albedo (a web-based wallet that also covers the mobile signing path) natively, plus WalletConnect for mobile apps such as LOBSTR, xBull, Hana, and Freighter mobile, and a \"More wallets\" picker (xBull, Rabet, LOBSTR, Hana, Klever, Bitget) via Stellar Wallets Kit. Reads never require a wallet; writes are signed by whichever wallet you connect."
      },
      {
        "question": "Where can I inspect the deployed contract?",
        "answer": "The contract is deployed on Stellar testnet at CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV and can be inspected on Stellar Expert. The Rust source lives in the contract/ directory of the GitHub repository under an MIT license."
      },
      {
        "question": "Can anyone register credentials on the contract?",
        "answer": "No. Issuers self-register on-chain into a Pending queue and must be approved by the admin before they can register or verify credentials. Suspended issuers are blocked at the contract level, and revoked credentials block downstream payments."
      }
    ]
  },
  {
    "slug": "contract",
    "title": "Contract reference",
    "metaTitle": "Soroban contract reference — functions, errors, events",
    "metaDescription": "Reference for the Stellaroid Earn Soroban contract on Stellar testnet: live tag v3.0.0 (19 functions, 17 errors) and repository source that adds issuer refresh dates plus credential expiry writes.",
    "keywords": [
      "soroban contract reference",
      "stellar testnet",
      "credential verification contract",
      "soroban error codes",
      "stellar contract invoke",
      "on-chain credential lifecycle",
      "soroban events"
    ],
    "navLabel": "Contract reference",
    "lede": "Complete reference for the Stellaroid Earn Soroban contract. Live testnet tag v3.0.0 still has 19 public functions and 17 errors. Repository source adds issuer refresh dates, credential expiry writes, and error 18. Everything here runs on Stellar testnet.",
    "blocks": [
      {
        "type": "p",
        "text": "The Stellaroid Earn contract is written in Rust with `soroban-sdk` and deployed to Stellar testnet. Live tag `v3.0.0` exposes 19 public functions. This repository's contract source adds `refresh_issuer`, `set_credential_expiry`, and `renew_certificate` (22 functions) plus error 18 `InvalidExpiry`. The frontend keeps those writes optional so the live site stays usable until a new contract ID is deployed."
      },
      {
        "type": "callout",
        "text": "Testnet only. Stellaroid Earn is an early-access pilot; the contract is not deployed to mainnet and no real funds are involved. All examples below target the testnet network."
      },
      {
        "type": "h2",
        "text": "Function surface"
      },
      {
        "type": "callout",
        "text": "Live testnet WASM (tag v3.0.0, contract CAD6C24P…) is still 19 functions and 17 errors. Repository source adds refresh_issuer, set_credential_expiry, and renew_certificate. The app hides issuer refresh until get_issuer returns a nonzero registered_at, and treats expiry writes as optional so a missing method does not fail register_certificate."
      },
      {
        "type": "p",
        "text": "Auth requirements below are derived from the on-chain roles each function encodes: the admin wallet set at `init`, issuers in the approval queue, and the employer or student addresses passed as arguments. Unauthorized callers are rejected with error `3 Unauthorized`."
      },
      {
        "type": "table",
        "headers": [
          "Function",
          "Signature",
          "Description",
          "Auth required"
        ],
        "rows": [
          [
            "init",
            "`init(admin, token)`",
            "One-shot bootstrap. Stores the admin and reward token in instance storage.",
            "One-shot; a second call fails with `AlreadyInitialized` (error 1)"
          ],
          [
            "register_issuer",
            "`register_issuer(issuer, name, website, category)`",
            "Issuer self-registers on-chain and enters the pending trust queue.",
            "Issuer (self)"
          ],
          [
            "approve_issuer",
            "`approve_issuer(admin, issuer)`",
            "Admin approves a pending issuer so it can issue and verify credentials.",
            "Admin only"
          ],
          [
            "suspend_issuer",
            "`suspend_issuer(admin, issuer)`",
            "Admin suspends an issuer from future issue / verify operations.",
            "Admin only"
          ],
          [
            "refresh_issuer",
            "`refresh_issuer(actor, issuer)`",
            "Issuer or admin stores a refresh date and extends persistent TTL. Emits `iss_rfr`. Live v3.0.0 WASM does not include this method.",
            "Issuer (self) or admin"
          ],
          [
            "register_certificate",
            "`register_certificate(issuer, student, cert_hash, title, cohort, metadata_uri)`",
            "Binds the hash plus minimal proof metadata to a student wallet; rejects duplicates; emits `cert_reg`.",
            "Approved issuer"
          ],
          [
            "verify_certificate",
            "`verify_certificate(verifier, cert_hash)`",
            "Trusted verification of a registered credential; emits `cert_ver`.",
            "Approved issuer or admin"
          ],
          [
            "revoke_certificate",
            "`revoke_certificate(actor, cert_hash)`",
            "Marks a credential revoked so payment-linked actions are blocked.",
            "Authorized actor"
          ],
          [
            "suspend_certificate",
            "`suspend_certificate(actor, cert_hash)`",
            "Temporarily suspends a credential without deleting its audit trail.",
            "Authorized actor"
          ],
          [
            "set_credential_expiry",
            "`set_credential_expiry(actor, cert_hash, expires_at)`",
            "Set or clear a validity window. Zero means no expiry. Rejects revoked, suspended, and already-elapsed records. Emits `cert_exp`.",
            "Issuing organization or admin"
          ],
          [
            "renew_certificate",
            "`renew_certificate(actor, cert_hash, expires_at)`",
            "Extend the window and restore Issued or Verified after expiry. Revoked and suspended records stay blocked. Emits `cert_ren`.",
            "Issuing organization or admin"
          ],
          [
            "reward_student",
            "`reward_student(student, cert_hash, amount)`",
            "Admin-triggered XLM reward via the configured Stellar Asset Contract. Like `init`, this is an admin/CLI surface — the dApp UI does not expose it.",
            "Admin only"
          ],
          [
            "link_payment",
            "`link_payment(employer, student, cert_hash, amount)`",
            "Employer pays a verified student directly; emits `payment`.",
            "Employer"
          ],
          [
            "get_certificate",
            "`get_certificate(cert_hash)`",
            "Read-only lookup of the certificate record.",
            "Public read (free simulation)"
          ],
          [
            "get_issuer",
            "`get_issuer(issuer)`",
            "Read-only lookup of issuer trust status and profile metadata.",
            "Public read (free simulation)"
          ]
        ]
      },
      {
        "type": "h2",
        "text": "Credential status lifecycle"
      },
      {
        "type": "p",
        "text": "A credential moves through five on-chain statuses. Actions attempted in the wrong state fail with error `10 InvalidStatus`."
      },
      {
        "type": "table",
        "headers": [
          "Status",
          "Meaning"
        ],
        "rows": [
          [
            "issued",
            "Initial state after `register_certificate` binds the hash to the student wallet. Not yet verified."
          ],
          [
            "verified",
            "Set by `verify_certificate` (approved issuer or admin). Unlocks payment via `link_payment`."
          ],
          [
            "suspended",
            "Set by `suspend_certificate`. A temporary hold — the record and its audit trail stay on-chain. Transitions are one-way on the current surface: no function re-verifies a suspended credential."
          ],
          [
            "revoked",
            "Set by `revoke_certificate`. Terminal for payment: revoked credentials can no longer unlock payment (error 11)."
          ],
          [
            "expired",
            "Past a nonzero `expires_at` window. On-chain status may still say Issued or Verified until `renew_certificate` runs; proof pages overlay Expired. Use `renew_certificate` rather than reissuing the hash."
          ]
        ]
      },
      {
        "type": "p",
        "text": "Status transitions are one-way: `verify_certificate` requires an Issued credential (a suspended credential cannot be re-verified) and revocation is terminal. The frontend additionally defines an `unknown` status as a client-side fallback for records it cannot decode; it is not an on-chain state."
      },
      {
        "type": "h2",
        "text": "Error codes"
      },
      {
        "type": "p",
        "text": "Live tag v3.0.0 defines 17 contract errors. Repository source adds error 18 `InvalidExpiry`. Callers and the frontend error layer map them as follows."
      },
      {
        "type": "table",
        "headers": [
          "Code",
          "Name",
          "Meaning"
        ],
        "rows": [
          [
            "1",
            "AlreadyInitialized",
            "`init` called twice."
          ],
          [
            "2",
            "NotInitialized",
            "Admin/token not set yet."
          ],
          [
            "3",
            "Unauthorized",
            "Caller isn't allowed."
          ],
          [
            "4",
            "AlreadyExists",
            "Duplicate cert hash."
          ],
          [
            "5",
            "NotFound",
            "Hash isn't registered."
          ],
          [
            "6",
            "InvalidAmount",
            "Amount must be > 0."
          ],
          [
            "7",
            "IssuerNotFound",
            "Issuer hasn't registered on-chain."
          ],
          [
            "8",
            "IssuerNotApproved",
            "Issuer still needs admin approval."
          ],
          [
            "9",
            "IssuerSuspended",
            "Issuer has been suspended."
          ],
          [
            "10",
            "InvalidStatus",
            "Credential is in the wrong lifecycle state for this action."
          ],
          [
            "11",
            "CredentialRevoked",
            "Credential was revoked and can no longer unlock payment."
          ],
          [
            "12",
            "CredentialExpired",
            "Credential expired and must be reissued or renewed."
          ],
          [
            "18",
            "InvalidExpiry",
            "Expiry must be 0 (no window) or a future unix timestamp. Source only. Live v3.0.0 does not define this code."
          ]
        ]
      },
      {
        "type": "h2",
        "text": "Events"
      },
      {
        "type": "p",
        "text": "The contract emits events as Soroban RPC events with a symbol topic. The app's activity feed decodes the following event kinds; anyone can audit them independently on a Stellar explorer such as stellar.expert."
      },
      {
        "type": "table",
        "headers": [
          "Event",
          "Emitted by",
          "Payload / decoded meaning"
        ],
        "rows": [
          [
            "`init`",
            "`init`",
            "Contract bootstrapped."
          ],
          [
            "`iss_reg`",
            "`register_issuer`",
            "Issuer registered."
          ],
          [
            "`iss_appr`",
            "`approve_issuer`",
            "Issuer approved."
          ],
          [
            "`iss_susp`",
            "`suspend_issuer`",
            "Issuer suspended."
          ],
          [
            "`iss_rfr`",
            "`refresh_issuer`",
            "Issuer refresh date updated. Source only until a new deploy."
          ],
          [
            "`cert_reg`",
            "`register_certificate`",
            "Certificate registered; payload carries the certificate hash."
          ],
          [
            "`cert_ver`",
            "`verify_certificate`",
            "Certificate verified; payload carries the certificate hash."
          ],
          [
            "cert_rev",
            "revoke_certificate",
            "Credential revoked; payload is the certificate hash. Not decoded by the app's activity feed — inspect it on stellar.expert."
          ],
          [
            "cert_sup",
            "suspend_certificate",
            "Credential suspended; payload is the certificate hash. Not decoded by the app's activity feed — inspect it on stellar.expert."
          ],
          [
            "`cert_exp`",
            "`set_credential_expiry`",
            "Validity window updated; payload carries the certificate hash."
          ],
          [
            "`cert_ren`",
            "`renew_certificate`",
            "Credential renewed; payload carries the certificate hash."
          ],
          [
            "`reward`",
            "`reward_student`",
            "Student reward sent; payload carries the amount, formatted with the configured asset decimals and code."
          ],
          [
            "`payment`",
            "`link_payment`",
            "Employer payment sent; payload carries the amount, formatted with the configured asset decimals and code."
          ]
        ]
      },
      {
        "type": "p",
        "text": "A `cert_fail` event kind also exists; the frontend activity feed intentionally filters it out of the public feed."
      },
      {
        "type": "h2",
        "text": "Calling the contract"
      },
      {
        "type": "h3",
        "text": "Writes via Stellar CLI"
      },
      {
        "type": "p",
        "text": "Write functions require the caller's signature. With Stellar CLI (v21+, `stellar contract invoke` — the deprecated `soroban` CLI is not used) and a funded testnet identity, registering a certificate looks like this:"
      },
      {
        "type": "code",
        "lang": "bash",
        "text": "stellar contract invoke \\\n  --id <CONTRACT_ID> \\\n  --source my-key \\\n  --network testnet \\\n  -- \\\n  register_certificate \\\n  --issuer <ISSUER_G_ADDRESS> \\\n  --student <STUDENT_G_ADDRESS> \\\n  --cert_hash <64_CHAR_SHA256_HEX> \\\n  --title \"Soroban Bootcamp Certificate\" \\\n  --cohort \"2026-Q2\" \\\n  --metadata_uri \"https://example.com/credential.json\""
      },
      {
        "type": "p",
        "text": "`cert_hash` is a 32-byte value supplied as 64 hexadecimal characters — the frontend converts the hex string to a `bytes32` ScVal before invoking, and the same format applies from the CLI. The invoking `issuer` must already be registered and approved, or the call fails with error `7 IssuerNotFound` or `8 IssuerNotApproved`."
      },
      {
        "type": "h3",
        "text": "Reads are free simulations"
      },
      {
        "type": "p",
        "text": "`get_certificate` and `get_issuer` never touch the ledger. The frontend builds an unsigned transaction from a configured read address (with a hardcoded fallback account when none is set) and executes it via the RPC `simulateTransaction` method, decoding the return value with `scValToNative`. No wallet, no signature, and no fee is required — this is what powers the public proof pages."
      },
      {
        "type": "h3",
        "text": "How the frontend submits writes"
      },
      {
        "type": "ul",
        "items": [
          "Builds an `invokeContractFunction` operation with `TransactionBuilder` at `BASE_FEE`, pinned to the expected network passphrase from config.",
          "Prepares the transaction against Soroban RPC (with a raw-simulation fallback for SDK XDR parse failures), then hands the XDR to the connected wallet — Freighter or Albedo — for signing.",
          "Submits via `sendTransaction` and accepts `PENDING` or `DUPLICATE` as in-flight statuses, then polls the transaction result for up to 20 attempts at 1.2 s intervals.",
          "Serializes arguments with `nativeToScVal`; addresses as `address`, strings as `string`, and certificate hashes as 32-byte values converted from hex."
        ]
      },
      {
        "type": "h2",
        "text": "Test coverage"
      },
      {
        "type": "p",
        "text": "The contract ships with fifteen tests in `contracts/stellaroid_earn/src/test.rs` (`t1`–`t15`). Together they cover the happy path, the issuer trust layer, revocation gating, event emission, escrow lifecycle, issuer refresh dates, and credential expiry or renewal."
      },
      {
        "type": "table",
        "headers": [
          "Test",
          "What it proves"
        ],
        "rows": [
          [
            "`t1_happy_path_with_approved_issuer`",
            "The complete journey: init, register issuer, approve, register certificate, verify, pay."
          ],
          [
            "`t2_unapproved_issuer_cannot_issue`",
            "A pending issuer cannot register certificates before admin approval."
          ],
          [
            "`t3_suspended_issuer_cannot_issue`",
            "A suspended issuer is blocked from issuing at the contract level."
          ],
          [
            "`t4_wrong_approved_issuer_cannot_verify`",
            "An approved issuer cannot verify a credential it did not issue — only the issuing organization or the admin can."
          ],
          [
            "`t5_revoked_credential_blocks_payment`",
            "A revoked credential can no longer unlock payment."
          ],
          [
            "`t6_issuer_events_emit`",
            "Issuer registration and approval emit auditable events."
          ],
          [
            "`t7_opportunity_happy_path`",
            "The escrow journey: create, fund, submit, approve, release."
          ],
          [
            "`t8_revoked_credential_blocks_opportunity`",
            "A revoked credential cannot anchor a new paid-trial opportunity."
          ],
          [
            "`t9_refund_funded_opportunity`",
            "An employer can recover escrowed funds from a funded trial that never progressed."
          ],
          [
            "`t10_invalid_status_transitions_fail`",
            "Out-of-order escrow moves (release before approval, refund after approval) fail with typed errors."
          ],
          [
            "`t11_rejects_too_many_opportunity_milestones`",
            "Milestone counts are bounded at opportunity creation."
          ],
          [
            "`t12_employer_can_refund_submitted_opportunity`",
            "The employer can still exit and recover escrow after a milestone is submitted but before approval."
          ],
          [
            "`t13_issuer_refresh_dates`",
            "Issuer records store register and refresh timestamps, and only the issuer or admin can bump them."
          ],
          [
            "`t14_credential_expiry_and_renewal`",
            "A future expiry window persists, blocks payment after it elapses, and renew restores Verified access."
          ],
          [
            "`t15_revoked_credential_blocks_expiry_writes`",
            "Revoked credentials cannot have expiry set or be renewed."
          ]
        ]
      },
      {
        "type": "h2",
        "text": "Escrow extension: funded paid trials"
      },
      {
        "type": "p",
        "text": "These seven functions complete the live 19-function public surface. Repository source sits on top of that with the three refresh and expiry writes documented above."
      },
      {
        "type": "table",
        "headers": [
          "Function",
          "Signature",
          "Description",
          "Auth required"
        ],
        "rows": [
          [
            "create_opportunity",
            "create_opportunity(employer, candidate, cert_hash, title, amount, milestone_count)",
            "Creates a paid-trial opportunity against the candidate's credential; rejects non-positive amounts, expired credentials, and a cert_hash not owned by the candidate; emits opp_crt",
            "Employer"
          ],
          [
            "fund_opportunity",
            "fund_opportunity(employer, opp_id)",
            "Escrows the full amount into the contract; fails with AlreadyFunded (#14) if repeated; emits opp_fund",
            "Employer (creator)"
          ],
          [
            "submit_milestone",
            "submit_milestone(candidate, opp_id)",
            "Candidate marks the next milestone as delivered; emits mile_sub",
            "Candidate"
          ],
          [
            "approve_milestone",
            "approve_milestone(employer, opp_id)",
            "Employer approves the submitted milestone; emits mile_apr",
            "Employer (creator)"
          ],
          [
            "release_payment",
            "release_payment(employer, opp_id)",
            "Releases the approved milestone share from escrow to the candidate; emits pay_rel",
            "Employer (creator)"
          ],
          [
            "refund_opportunity",
            "refund_opportunity(employer, opp_id)",
            "Returns remaining escrowed funds to the employer; emits pay_ref",
            "Employer (creator)"
          ],
          [
            "get_opportunity",
            "get_opportunity(opp_id)",
            "Read-only lookup of an opportunity record",
            "None (public read)"
          ]
        ]
      },
      {
        "type": "p",
        "text": "The extension adds five typed error codes on top of the credential-surface errors:"
      },
      {
        "type": "table",
        "headers": [
          "Code",
          "Name",
          "Meaning"
        ],
        "rows": [
          [
            "13",
            "OpportunityNotFound",
            "No opportunity exists for this id."
          ],
          [
            "14",
            "AlreadyFunded",
            "The opportunity has already been funded."
          ],
          [
            "15",
            "InvalidMilestone",
            "Milestone submission or approval is out of order for the current milestone count."
          ],
          [
            "16",
            "InvalidOpportunityStatus",
            "The action is not allowed in the opportunity's current status."
          ],
          [
            "17",
            "PaymentLocked",
            "Escrowed funds cannot be released in the current state."
          ]
        ]
      },
      {
        "type": "p",
        "text": "Escrow events mirror the flow: `opp_crt`, `opp_fund`, `mile_sub`, `mile_apr`, `pay_rel`, and `pay_ref` — all auditable on stellar.expert alongside the credential events."
      }
    ],
    "faq": [
      {
        "question": "Who can verify a credential on-chain?",
        "answer": "Only an approved issuer or the admin wallet can call verify_certificate. Unauthorized callers are rejected with typed errors (Unauthorized #3, IssuerNotApproved #8, IssuerSuspended #9), and the boundary is exercised by contract tests t2 through t4 — unapproved, suspended, and wrong-issuer callers all fail."
      },
      {
        "question": "Do read functions cost anything?",
        "answer": "No. get_certificate and get_issuer are read-only lookups executed as RPC simulations from a read address — no wallet connection, no signature, and no network fee. This is how the public proof pages work."
      },
      {
        "question": "What happens if the same certificate hash is registered twice?",
        "answer": "The contract rejects duplicate hashes with error 4 (AlreadyExists) before writing anything, so an existing credential can never be overwritten or re-minted — the guard is enforced in register_certificate itself."
      },
      {
        "question": "Is the contract deployed to mainnet?",
        "answer": "No. Stellaroid Earn is an early-access pilot and the contract is deployed to Stellar testnet only. No real funds are involved, and all documented flows target the testnet network."
      },
      {
        "question": "How is payment gated by verification?",
        "answer": "link_payment pays a verified student directly, and a revoked credential can no longer unlock payment — the contract returns error 11 (CredentialRevoked), a boundary exercised by the t5_revoked_credential_blocks_payment contract test."
      }
    ]
  },
  {
    "slug": "integration",
    "title": "Wallet & frontend integration",
    "metaTitle": "Wallet & frontend integration",
    "metaDescription": "How the Stellaroid Earn frontend connects Freighter and Albedo wallets to Soroban on Stellar testnet: env config, simulated reads, signed writes, and pitfalls.",
    "keywords": [
      "Stellar wallet integration",
      "Freighter",
      "Albedo wallet",
      "Soroban RPC",
      "simulateTransaction",
      "Next.js dApp",
      "stellar-sdk"
    ],
    "navLabel": "Integration",
    "lede": "How the Stellaroid Earn Next.js frontend talks to Stellar: a config layer of NEXT_PUBLIC_* env vars, a multi-provider wallet layer (Freighter, Albedo, WalletConnect, and a Stellar Wallets Kit picker), and a contract client that simulates reads and signs-and-submits writes over Soroban RPC.",
    "blocks": [
      {
        "type": "p",
        "text": "The Stellaroid Earn frontend is a Next.js 16 (App Router) + React 19 app that uses `@stellar/stellar-sdk` to build and submit Soroban transactions, `@stellar/freighter-api` for the Freighter browser extension, and `@albedo-link/intent` for the Albedo web wallet. This page condenses the integration into its three layers and the code patterns you need to extend it."
      },
      {
        "type": "callout",
        "text": "Stellaroid Earn is an early-access pilot running entirely on Stellar testnet. Every default in the config layer — RPC URL, network passphrase, explorer link — points at testnet. Nothing on this page targets mainnet."
      },
      {
        "type": "h2",
        "text": "Architecture"
      },
      {
        "type": "p",
        "text": "The integration is layered so the UI never talks to a specific wallet SDK or to `process.env` directly:"
      },
      {
        "type": "ul",
        "items": [
          "Config layer (`frontend/src/lib/config.ts`) — reads all `NEXT_PUBLIC_*` env vars once into a single `appConfig` object, maps network names to canonical passphrases, and exposes guards like `hasRequiredConfig()`.",
          "Wallet provider layer (`frontend/src/lib/wallet/`), a registry of providers behind one three-method interface (`read`, `connect`, `sign`). Four providers ship today: Freighter (desktop extension) and Albedo (web wallet, also mobile) natively, WalletConnect (Reown relay, for mobile apps like LOBSTR and xBull), and a \"More wallets\" entry backed by Stellar Wallets Kit. The active provider id is persisted in `localStorage` so sessions survive reloads.",
          "Contract client (`frontend/src/lib/contract-client.ts`) — builds transactions with `@stellar/stellar-sdk`. Reads run as signature-free simulations sourced from a read-only address; writes are prepared by the RPC, signed by the active wallet, submitted, and polled to confirmation.",
          "UI layer (`components/`, `hooks/`) — everything touching a wallet is marked `\"use client\"`, because both wallet SDKs are browser-only APIs that cannot run in Server Components."
        ]
      },
      {
        "type": "code",
        "lang": "bash",
        "text": "npm add @stellar/stellar-sdk @stellar/freighter-api @albedo-link/intent"
      },
      {
        "type": "h2",
        "text": "Config layer: environment variables"
      },
      {
        "type": "p",
        "text": "All configuration is public (`NEXT_PUBLIC_*`), read in one place, and defaulted to testnet values. `hasRequiredConfig()` requires `contractId` and `rpcUrl`; the contract client throws early with a clear message when they are missing."
      },
      {
        "type": "table",
        "headers": [
          "Variable",
          "Purpose",
          "Default"
        ],
        "rows": [
          [
            "NEXT_PUBLIC_STELLAR_RPC_URL",
            "Soroban RPC endpoint used for simulation and submission",
            "https://soroban-testnet.stellar.org"
          ],
          [
            "NEXT_PUBLIC_STELLAR_NETWORK",
            "Network name (TESTNET, PUBLIC, or PUBNET), mapped to its canonical passphrase",
            "TESTNET"
          ],
          [
            "NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE",
            "Fallback passphrase used when the network name is not recognized",
            "Testnet passphrase"
          ],
          [
            "NEXT_PUBLIC_SOROBAN_CONTRACT_ID",
            "Deployed Soroban contract ID (required)",
            "empty"
          ],
          [
            "NEXT_PUBLIC_STELLAR_READ_ADDRESS",
            "Funded account used as the source for read-only simulations",
            "empty (client falls back to a built-in simulation source)"
          ],
          [
            "NEXT_PUBLIC_SOROBAN_ASSET_ADDRESS",
            "Token contract address of the payout asset",
            "empty"
          ],
          [
            "NEXT_PUBLIC_SOROBAN_ASSET_CODE",
            "Display code of the payout asset",
            "XLM"
          ],
          [
            "NEXT_PUBLIC_SOROBAN_ASSET_DECIMALS",
            "Decimal places used when parsing and formatting amounts",
            "7"
          ],
          [
            "NEXT_PUBLIC_STELLAR_EXPLORER_URL",
            "Block explorer base URL for transaction links",
            "https://stellar.expert/explorer/testnet"
          ],
          [
            "NEXT_PUBLIC_STELLAR_ADMIN_ADDRESS",
            "Admin account address exposed to the frontend",
            "empty"
          ],
          [
            "NEXT_PUBLIC_FEE_SPONSOR_ADDRESS",
            "Fee-sponsor account address exposed to the frontend",
            "empty"
          ],
          [
            "NEXT_PUBLIC_E2E_MODE",
            "Test-only wallet bypass for headless e2e runs; honored only when isE2EModeAllowed() passes (checks NODE_ENV, CI, Playwright, and Vercel environment)",
            "off"
          ],
          [
            "NEXT_PUBLIC_PLAYWRIGHT",
            "Set to 1 by the Playwright e2e runner; feeds the same guarded e2e-mode gate and is inert in production and preview",
            "off"
          ]
        ]
      },
      {
        "type": "p",
        "text": "`getExpectedNetworkPassphrase()` resolves the network name to the canonical SDK passphrase (`Networks.TESTNET` / `Networks.PUBLIC`) and falls back to the configured passphrase for unrecognized names. Every transaction the app builds or signs uses this expected passphrase."
      },
      {
        "type": "callout",
        "text": "The network passphrase must match the network the contract is deployed on. A mismatch is the most common integration failure: transactions build fine locally but fail signing or submission."
      },
      {
        "type": "h2",
        "text": "Wallet provider layer"
      },
      {
        "type": "p",
        "text": "The wallet layer is no longer Freighter-only. `frontend/src/lib/wallet/index.ts` keeps a registry of providers (`PROVIDERS = [freighterProvider, albedoProvider, walletConnectProvider, swkProvider]`, in picker display order), each implementing the same interface from `frontend/src/lib/wallet/types.ts`:"
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "export type WalletProviderId = \"freighter\" | \"albedo\" | \"walletconnect\" | \"swk\";\n\n// \"extension\" wallets need a desktop browser extension; \"web\" wallets run in\n// any browser (including mobile) via a popup/redirect and need no install.\nexport type WalletProviderKind = \"extension\" | \"web\";\n\nexport interface WalletProviderModule extends WalletProviderMeta {\n  /** Read the current connection without prompting the user. */\n  read(): Promise<WalletSnapshot>;\n  /** Prompt the user to connect; resolves to a connected snapshot or throws. */\n  connect(): Promise<WalletSnapshot>;\n  /** Sign a transaction XDR for `address`; resolves to the signed XDR. */\n  sign(xdr: string, address: string): Promise<string>;\n}"
      },
      {
        "type": "table",
        "headers": [
          "Provider",
          "Kind",
          "Signing UX",
          "Mobile",
          "Notes"
        ],
        "rows": [
          [
            "Freighter",
            "extension",
            "In-page popup from the browser extension",
            "No, desktop browser extension (install at freighter.app)",
            "Extension calls are wrapped in a 5-second timeout so a missing extension fails fast instead of hanging"
          ],
          [
            "Albedo",
            "web",
            "Popup/redirect to albedo.link",
            "Yes, any browser, including iOS Safari and Android Chrome; no install",
            "No silently readable session: the connected public key is cached in localStorage for display only, and every signature re-prompts the user. Albedo signs for the network the app requests, so a wrong-network state cannot occur"
          ],
          [
            "WalletConnect",
            "web",
            "QR / deep-link pairing over the Reown relay",
            "Yes, pairs with mobile apps like LOBSTR, xBull, Hana, and Freighter mobile",
            "Built on raw @walletconnect/sign-client (no web3modal or EVM); requires NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID, otherwise the option is hidden"
          ],
          [
            "More wallets (Stellar Wallets Kit)",
            "extension",
            "Kit auth modal (xBull, Rabet, LOBSTR, Hana, Klever, Bitget)",
            "No, desktop extensions; the entry is hidden on mobile browsers",
            "Lazy-loaded on first use; picker icons are self-hosted so the CSP img-src stays 'self'"
          ]
        ]
      },
      {
        "type": "p",
        "text": "The active provider id is persisted under the `localStorage` key `stellaroid:wallet-provider`, so `readWallet()` can restore a session on page load without prompting. `disconnectWallet()` is local-only: it clears that key (and Albedo's cached address) but does not revoke any permissions inside the wallet itself. In e2e mode the whole layer is bypassed with a fixed test address so headless tests never need an extension or popup."
      },
      {
        "type": "h2",
        "text": "Contract client: reads vs writes"
      },
      {
        "type": "p",
        "text": "The contract client has two interaction modes with very different requirements:"
      },
      {
        "type": "table",
        "headers": [
          "",
          "Reads",
          "Writes"
        ],
        "rows": [
          [
            "Mechanism",
            "rpc.Server.simulateTransaction — executed on the RPC node, never broadcast",
            "prepareTransaction → wallet sign → sendTransaction → pollTransaction"
          ],
          [
            "Source account",
            "NEXT_PUBLIC_STELLAR_READ_ADDRESS (any funded account; a built-in fallback source is used if unset)",
            "The connected wallet's address"
          ],
          [
            "Signature",
            "None",
            "Required — signed by the active wallet provider"
          ],
          [
            "Fees",
            "None",
            "Network fee; prepareTransaction attaches the Soroban footprint and resource fee from simulation"
          ],
          [
            "Return value",
            "Decoded with scValToNative, then normalized to app types",
            "Transaction hash, plus the decoded return value once confirmed"
          ]
        ]
      },
      {
        "type": "p",
        "text": "Because reads need no wallet, anonymous visitors can query contract state (issuers, certificates, opportunities) without connecting anything — the funded read address exists purely because `simulateTransaction` requires a valid on-chain source account."
      },
      {
        "type": "p",
        "text": "The shipped client also carries raw JSON-RPC fallbacks: when the SDK's XDR parser throws `Bad union switch` on newer RPC response arms, simulation, submission, and polling each retry over plain `fetch` JSON-RPC calls instead of failing the whole operation."
      },
      {
        "type": "h2",
        "text": "Key code patterns"
      },
      {
        "type": "h3",
        "text": "Detecting and connecting a wallet"
      },
      {
        "type": "p",
        "text": "UI code talks only to the public API of `@/lib/wallet` — never to a specific wallet SDK:"
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "\"use client\";\n\nimport { connectWallet, listProviders, readWallet } from \"@/lib/wallet\";\n\n// Enumerate wallets for the picker UI (registry order = display priority)\nconst providers = listProviders();\n// [{ id: \"freighter\", kind: \"extension\", label: \"Freighter\", ... },\n//  { id: \"albedo\",    kind: \"web\",       label: \"Albedo\", ... },\n//  { id: \"walletconnect\", kind: \"web\", label: \"WalletConnect\", ... },\n//  { id: \"swk\", kind: \"extension\", label: \"More wallets\", ... }]\n// (walletconnect only listed when a Reown project id is configured)\n\n// Restore an existing session on mount, without prompting\nconst existing = await readWallet();\n\n// Prompt the user to connect a specific provider\nconst snapshot = await connectWallet(\"albedo\");\nif (snapshot.status === \"connected\") {\n  // snapshot.address, snapshot.provider, snapshot.isExpectedNetwork\n}"
      },
      {
        "type": "h3",
        "text": "Network check"
      },
      {
        "type": "p",
        "text": "The Freighter provider compares the wallet's reported network against the app's expected one, accepting a match by either passphrase or network name, and the UI gates every write behind the result:"
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "const networkPassphrase =\n  networkResponse.networkPassphrase || getExpectedNetworkPassphrase();\n\n// Accept a match by either passphrase or network name\nconst isExpectedNetwork =\n  networkPassphrase === getExpectedNetworkPassphrase() ||\n  networkResponse.network === appConfig.network;\n\n// Gate all contract writes behind this flag in the UI\nconst actionsBlocked =\n  wallet.status !== \"connected\" || !wallet.address || !wallet.isExpectedNetwork;"
      },
      {
        "type": "h3",
        "text": "Read-only call (simulate)"
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "const simulation = await server.simulateTransaction(transaction);\n\nif (rpc.Api.isSimulationError(simulation)) {\n  throw new Error(normalizeError(simulation.error));\n}\n\n// Decode the XDR return value, then normalize to app types\nreturn transform(scValToNative(simulation.result.retval));"
      },
      {
        "type": "h3",
        "text": "Write call (sign and submit)"
      },
      {
        "type": "p",
        "text": "Writes follow a five-step shape. Note that signing goes through the wallet layer's `signTransaction` — whichever provider the user connected handles the actual prompt:"
      },
      {
        "type": "code",
        "lang": "ts",
        "text": "import { signTransaction as signWithWallet } from \"@/lib/wallet\";\n\n// 1. Build the invocation against the source account's sequence number\nconst transaction = await buildTransaction(sourceAddress, method, args);\n\n// 2. Prepare: RPC simulation attaches the Soroban footprint and resource fee\nconst prepared = await server.prepareTransaction(transaction);\n\n// 3. Sign with the active wallet (Freighter popup or Albedo redirect)\nconst signedXdr = await signWithWallet(prepared.toXDR(), sourceAddress);\nconst signed = TransactionBuilder.fromXDR(\n  signedXdr,\n  getExpectedNetworkPassphrase(),\n);\n\n// 4. Submit\nconst sendResponse = await server.sendTransaction(signed);\n\n// 5. Poll until confirmed or failed\nconst final = await server.pollTransaction(sendResponse.hash, {\n  attempts: 20,\n  sleepStrategy: () => 1200, // 1.2 s between polls\n});"
      },
      {
        "type": "p",
        "text": "The production client accepts both `PENDING` and `DUPLICATE` submission statuses, and treats a `FAILED` or `NOT_FOUND` poll result as an error surfaced through a normalizer that maps Soroban's numeric error codes (`#1`, `#2`, ...) to human-readable messages matching the contract's Rust `contracterror` enum."
      },
      {
        "type": "h2",
        "text": "Common pitfalls"
      },
      {
        "type": "table",
        "headers": [
          "Issue",
          "Cause",
          "Fix"
        ],
        "rows": [
          [
            "Wrong network passphrase",
            "The wallet is on a different network than NEXT_PUBLIC_STELLAR_NETWORK, or the passphrase does not match the network the contract is deployed on",
            "Switch the wallet's network; the UI gates writes on isExpectedNetwork, so action buttons stay disabled until it matches. Albedo is immune — it signs for the network the app requests"
          ],
          [
            "simulateTransaction fails on reads",
            "The read address is not funded on testnet — simulation requires a valid on-chain source account even though nothing is broadcast",
            "Fund NEXT_PUBLIC_STELLAR_READ_ADDRESS at friendbot.stellar.org"
          ],
          [
            "Wallet APIs crash during SSR or build",
            "Freighter and Albedo are browser-only; Server Components cannot access extensions or window",
            "Put \"use client\" as the first line of every file that touches the wallet layer or React state; the Albedo SDK is additionally lazy-imported so it never executes during SSR"
          ],
          [
            "Reads work but writes fail",
            "Simulation never broadcasts and needs no signature; submission additionally requires prepareTransaction, a wallet signature, and a funded source account on the right network",
            "Treat the two paths separately when debugging — a passing read proves RPC and config, not the write path. Check the poll result status after sendTransaction"
          ],
          [
            "scValToNative returns a Map",
            "SDK version behavior when decoding contract structs",
            "Write normalizers that check instanceof Map before falling back to plain-object access"
          ],
          [
            "Amount precision errors",
            "Display-formatted amounts passed directly into contract args",
            "Convert with parseAmountToInt() using NEXT_PUBLIC_SOROBAN_ASSET_DECIMALS (7 for native XLM) before building i128 args"
          ]
        ]
      },
      {
        "type": "h2",
        "text": "Further reading"
      },
      {
        "type": "p",
        "text": "The full step-by-step guide — including argument serialization with `nativeToScVal`, return-value normalizers, error mapping, amount formatting helpers, and complete data-flow walkthroughs — lives in the repo at `docs/reference/freighter-integration.md` and is the canonical spec for this integration."
      },
      {
        "type": "callout",
        "text": "The repo guide is written Freighter-first. The shipped code generalizes the same flow behind the multi-provider wallet layer described on this page, so read \"Freighter\" in the guide as \"the active wallet provider\"."
      }
    ],
    "faq": [
      {
        "question": "Which wallets does Stellaroid Earn support?",
        "answer": "Two providers: Freighter, a desktop browser extension, and Albedo, a web wallet that signs via a popup/redirect to albedo.link and works in any browser — including iOS Safari and Android Chrome — with no install. Both sit behind the same three-method provider interface (read, connect, sign), so the UI never depends on a specific wallet SDK."
      },
      {
        "question": "Why does the frontend need a funded read address?",
        "answer": "Soroban's simulateTransaction requires a valid on-chain source account even for read-only calls. NEXT_PUBLIC_STELLAR_READ_ADDRESS supplies a pre-funded testnet account so anonymous visitors can query contract state without connecting a wallet. Fund it via friendbot.stellar.org on testnet."
      },
      {
        "question": "Do read-only contract calls cost fees or require a signature?",
        "answer": "No. Reads run through simulateTransaction, which executes the call on the RPC node without broadcasting anything to the network — no signature and no fee. Only state-changing writes are signed by the wallet and submitted."
      },
      {
        "question": "How does the app handle a wallet on the wrong network?",
        "answer": "For Freighter, the app compares the wallet's network passphrase and network name against the expected values derived from NEXT_PUBLIC_STELLAR_NETWORK, and blocks all contract writes until isExpectedNetwork is true. Albedo signs for whichever network the app requests, so a mismatch cannot occur with it."
      },
      {
        "question": "Is any of this running on Stellar mainnet?",
        "answer": "No. Stellaroid Earn is an early-access pilot on Stellar testnet. Every configuration default — the RPC URL, the network passphrase, and the block-explorer link — points at testnet, and no flow in the documentation or repo targets mainnet."
      }
    ]
  },
  {
    "slug": "architecture",
    "title": "Architecture",
    "metaTitle": "Architecture — Next.js frontend, Soroban contract",
    "metaDescription": "How Stellaroid Earn works: a Next.js 16 frontend on Vercel talking directly to a Soroban smart contract on Stellar testnet — no traditional backend.",
    "keywords": [
      "Stellaroid Earn architecture",
      "Soroban smart contract",
      "Stellar testnet",
      "Next.js App Router",
      "simulateTransaction",
      "Freighter wallet",
      "content security policy",
      "service worker"
    ],
    "navLabel": "Architecture",
    "lede": "Stellaroid Earn is a Next.js 16 (App Router) frontend deployed on Vercel that talks directly to a Soroban smart contract on Stellar testnet. There is no traditional backend — the chain is the system of record.",
    "blocks": [
      {
        "type": "h2",
        "text": "System overview"
      },
      {
        "type": "p",
        "text": "The system has two deployed pieces: a Next.js 16 (App Router) + React 19 frontend on Vercel, and a Soroban smart contract (Rust, `soroban-sdk` 26.1.0, compiled to `wasm32v1-none`) on Stellar testnet. All state — issuer records, certificate records, payment links, admin config — lives in contract storage. Reads reach the chain through Soroban RPC `simulateTransaction`; writes are signed in the user's wallet and submitted through the same RPC. The only server-side code is Next.js itself: React Server Components render proof pages, and four API routes: GET /api/health, GET /api/events and its /stream variant (read-only public event aggregation), and POST /api/fee-bump — an optional, bearer-token-gated endpoint that signs fee-bump transactions server-side with a dedicated testnet sponsor key."
      },
      {
        "type": "code",
        "lang": "text",
        "text": "Users (issuer / student / employer)\n        |\n        v\nNext.js 16 frontend (Vercel)\n  config layer -> wallet layer (Freighter | Albedo) -> contract client\n        |                                  |\n        | reads: simulateTransaction      | writes: signTransaction -> sendTransaction\n        v                                  v\nSoroban RPC  --  Stellar testnet\n  stellaroid_earn contract\n    - Issuer Registry      (persistent storage)\n    - Certificate Store    (persistent storage)\n    - Payment Links        (persistent storage)\n    - Admin Config         (instance storage)\n  XLM Stellar Asset Contract (SAC) - native asset"
      },
      {
        "type": "p",
        "text": "Access control is enforced in the contract, not the frontend: `init`, `approve_issuer`, `suspend_issuer`, and `reward_student` are admin-only; `register_certificate`, `verify_certificate`, `revoke_certificate`, and `suspend_certificate` require an approved issuer; `refresh_issuer`, `set_credential_expiry`, and `renew_certificate` require the issuer or admin and exist in repository source; `register_issuer`, `link_payment`, `get_certificate`, and `get_issuer` are public. Failures surface as a typed `#[contracterror]` enum with 17 variants on live v3.0.0 and 18 in source."
      },
      {
        "type": "h2",
        "text": "Component breakdown"
      },
      {
        "type": "table",
        "headers": [
          "Component",
          "Location",
          "Responsibility"
        ],
        "rows": [
          [
            "Config layer",
            "`frontend/src/lib/config.ts`",
            "Reads `NEXT_PUBLIC_*` env vars (RPC URL, network, passphrase, contract ID, read address). The passphrase must match the network the contract is deployed on."
          ],
          [
            "Wallet layer",
            "`frontend/src/lib/wallet/` + `hooks/`",
            "Provider registry with two wallets — Freighter (browser extension) and Albedo (web-based signer). Manages connection state, public key, network validation, and `signTransaction`."
          ],
          [
            "Contract client",
            "`frontend/src/lib/contract-client.ts`, `contract-read-server.ts`",
            "Builds transactions with `@stellar/stellar-sdk`; handles ScVal argument serialization, return-value decoding, and error normalization. Server-side reads have a dedicated module for RSC use."
          ],
          [
            "UI",
            "`frontend/src/app/` + `components/`",
            "App Router routes (`/app`, `/issuer`, `/proof/[hash]`, `/proof/[hash]/embed`, `/about`, …). Wallet-touching components are `\"use client\"` because wallet APIs are browser-only; proof pages render server-side."
          ],
          [
            "Smart contract",
            "`contract/src/lib.rs` (separate deploy)",
            "Issuer registry, certificate lifecycle, payment links. Persistent storage with 518,400–1,036,800 ledger TTLs; admin config in instance storage."
          ],
          [
            "Soroban RPC",
            "`https://soroban-testnet.stellar.org` (default)",
            "Simulation for reads, submission and polling for writes, `getEvents` for recent contract events."
          ],
          [
            "Stellar Expert",
            "`https://stellar.expert/explorer/testnet`",
            "Explorer links, plus a public contract-event index used to supplement RPC's limited event retention."
          ],
          [
            "Friendbot",
            "`https://friendbot.stellar.org`",
            "Funds testnet accounts, including the read-only simulation address."
          ]
        ]
      },
      {
        "type": "h2",
        "text": "Data flow: the three core actions"
      },
      {
        "type": "p",
        "text": "All writes follow one pipeline in `contract-client.ts`: build the invocation → `simulateTransaction` to assemble it → sign in the connected wallet → `sendTransaction` → poll `getTransaction` until a terminal status. Reads stop after simulation and never submit anything."
      },
      {
        "type": "h3",
        "text": "1. Credential issuance and verification (issuer signs)"
      },
      {
        "type": "ol",
        "items": [
          "An issuer calls `register_issuer` (public, signed by the issuer's own wallet); the admin then calls `approve_issuer`. These emit `iss_reg` and `iss_appr` events.",
          "The approved issuer registers a certificate via `register_certificate` — the transaction is simulated, signed in Freighter or Albedo, submitted, and polled to confirmation. Emits a `cert_reg` event carrying the proof hash.",
          "The issuer attests the credential with `verify_certificate`, which emits `cert_ver`. The student can now share the `/proof/<hash>` URL."
        ]
      },
      {
        "type": "h3",
        "text": "2. Public proof verification (nobody signs)"
      },
      {
        "type": "ol",
        "items": [
          "Anyone opens `/proof/<hash>`. The route validates the 64-character hex format before making any RPC call.",
          "A React Server Component calls `get_certificate` through `simulateTransaction`, using the funded account in `NEXT_PUBLIC_STELLAR_READ_ADDRESS` as the transaction source. The simulation is never submitted — no signature, no fee, no on-chain footprint, and no events.",
          "The page renders certificate status, issuer trust evidence, and a verification breakdown, and is CDN-cached with `revalidate=60`. Client-side dashboard components use the same simulation mechanism directly for real-time state."
        ]
      },
      {
        "type": "h3",
        "text": "3. Employer payment (employer signs)"
      },
      {
        "type": "ol",
        "items": [
          "An employer viewing a proof calls `link_payment` (public), signing with their own wallet through the same simulate → sign → submit → poll pipeline.",
          "XLM moves through the native Stellar Asset Contract (SAC) — no custom token, so graduates receive actual XLM with no trustline setup.",
          "The contract records a `PaymentRecord` (payer, amount, linked certificate hash) and emits a `payment` event with the amount. Admin-initiated `reward_student` calls emit a separate `reward` event."
        ]
      },
      {
        "type": "p",
        "text": "Emitted events (`init`, `iss_reg`, `iss_appr`, `iss_susp`, `iss_rfr`, `cert_reg`, `cert_ver`, `cert_exp`, `cert_ren`, `reward`, `payment`) are surfaced as public evidence via `/api/events`, a short-lived Server-Sent Events stream at `/api/events/stream`, and `/status#metrics`. Because RPC event retention only covers recent ledgers, the frontend supplements `getEvents` with Stellar Expert's public contract-event index and labels each item by source (`rpc`, `stellar_expert`, or `e2e`). This is display-grade evidence, not an audit-grade analytics store."
      },
      {
        "type": "h2",
        "text": "Deployment"
      },
      {
        "type": "table",
        "headers": [
          "Component",
          "Platform",
          "Detail"
        ],
        "rows": [
          [
            "Frontend",
            "Vercel",
            "stellaroid.tech"
          ],
          [
            "Contract",
            "Stellar testnet",
            "`CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV`"
          ],
          [
            "Source verification",
            "Stellar Expert",
            "Fresh security-hardened deploy; source re-verification pending"
          ]
        ]
      },
      {
        "type": "callout",
        "text": "Testnet only. Every RPC endpoint, contract ID, and payment flow in this stack targets Stellar testnet. There is no mainnet deployment, and no flow in this documentation should be pointed at mainnet."
      },
      {
        "type": "p",
        "text": "Configuration is entirely env-var driven from `lib/config.ts`. The app refuses to operate meaningfully without `NEXT_PUBLIC_SOROBAN_CONTRACT_ID` and an RPC URL. Two test-only variables (NEXT_PUBLIC_E2E_MODE, NEXT_PUBLIC_PLAYWRIGHT) also flow through lib/config.ts but are gated to be inert outside local test runs, and NEXT_PUBLIC_CANONICAL_URL feeds the SEO/security layers."
      },
      {
        "type": "table",
        "headers": [
          "Variable",
          "Default",
          "Purpose"
        ],
        "rows": [
          [
            "`NEXT_PUBLIC_STELLAR_RPC_URL`",
            "`https://soroban-testnet.stellar.org`",
            "Soroban RPC endpoint"
          ],
          [
            "`NEXT_PUBLIC_STELLAR_NETWORK`",
            "`TESTNET`",
            "Network name, mapped to the expected passphrase for wallet network checks"
          ],
          [
            "`NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE`",
            "`Test SDF Network ; September 2015`",
            "Must match the network the contract is deployed on"
          ],
          [
            "`NEXT_PUBLIC_SOROBAN_CONTRACT_ID`",
            "(none — required)",
            "Deployed contract address"
          ],
          [
            "`NEXT_PUBLIC_SOROBAN_ASSET_ADDRESS`",
            "(none)",
            "XLM SAC contract address"
          ],
          [
            "`NEXT_PUBLIC_SOROBAN_ASSET_CODE` / `_DECIMALS`",
            "`XLM` / `7`",
            "Display metadata for the payment asset"
          ],
          [
            "`NEXT_PUBLIC_STELLAR_READ_ADDRESS`",
            "(none)",
            "Funded testnet `G...` account used only as the source for read-only simulations (fund via Friendbot)"
          ],
          [
            "`NEXT_PUBLIC_STELLAR_ADMIN_ADDRESS`",
            "(none)",
            "Admin public key, used for role detection in the UI"
          ],
          [
            "`NEXT_PUBLIC_FEE_SPONSOR_ADDRESS`",
            "(none)",
            "Fee-sponsorship account; sponsor signing sits behind server auth with contract/method/fee validation"
          ],
          [
            "`NEXT_PUBLIC_STELLAR_EXPLORER_URL`",
            "`https://stellar.expert/explorer/testnet`",
            "Explorer link base"
          ]
        ]
      },
      {
        "type": "p",
        "text": "One build-time value is set automatically in `next.config.ts`: `NEXT_PUBLIC_SW_BUILD` is derived from `VERCEL_GIT_COMMIT_SHA` (first 12 characters, with a timestamp fallback) and stamps the service worker registration URL per deploy."
      },
      {
        "type": "h2",
        "text": "Notable technical decisions"
      },
      {
        "type": "h3",
        "text": "Reads via simulation with a dedicated read address"
      },
      {
        "type": "p",
        "text": "Public proof verification must not require a wallet — that is critical for employer adoption. Read calls are built as normal contract invocations but only ever passed to `simulateTransaction`, sourced from the funded read-only account. Nothing is signed or submitted, so verification is free, anonymous, and cacheable (`revalidate=60` on proof pages)."
      },
      {
        "type": "h3",
        "text": "Nonce-based CSP assembled in proxy"
      },
      {
        "type": "p",
        "text": "Static security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and 2-year preloaded HSTS) come from `next.config.ts`. The Content-Security-Policy itself is built per-request in `src/middleware.ts`: a fresh nonce is generated with `crypto.getRandomValues`, passed to the app via an `x-nonce` header, and embedded in `script-src` — so production scripts run without `'unsafe-inline'`. `connect-src` is restricted to `'self'` and `https://*.stellar.org`. `frame-ancestors` is `'none'` everywhere except `/proof/<hash>/embed` (matched against the 64-hex pattern), which allows framing so proofs can be embedded; CSP `frame-ancestors` takes precedence over `X-Frame-Options` in modern browsers."
      },
      {
        "type": "code",
        "lang": "text",
        "text": "default-src 'self';\nscript-src 'self' 'nonce-<per-request>' https://va.vercel-scripts.com;\nstyle-src 'self' 'unsafe-inline' https://fonts.googleapis.com;\nfont-src 'self' https://fonts.gstatic.com;\nimg-src 'self' data: blob:;\nworker-src 'self';\nmanifest-src 'self';\nconnect-src 'self' https://*.stellar.org;\nframe-src 'none';\nobject-src 'none';\nbase-uri 'self';\nform-action 'self';\nframe-ancestors 'none'   (frame-ancestors * on /proof/<hash>/embed only)"
      },
      {
        "type": "h3",
        "text": "A deliberately conservative service worker"
      },
      {
        "type": "p",
        "text": "The PWA service worker (`frontend/public/sw.js`) is scoped narrowly because the app's data is on-chain and staleness is dangerous:"
      },
      {
        "type": "ul",
        "items": [
          "Navigations: network-first, falling back to a cached copy of that page, then `/offline.html` (page cache capped at 30 entries).",
          "`/_next/static/*`: cache-first — these assets are content-hashed and immutable.",
          "Same-origin images, fonts, and icons: stale-while-revalidate.",
          "`/api/*` and all cross-origin requests (Soroban RPC, fonts CDN): untouched — always network.",
          "Framed navigations (the `/proof/<hash>/embed` route) are skipped entirely, because a cached fallback cannot reproduce the route's `frame-ancestors` headers."
        ]
      },
      {
        "type": "p",
        "text": "The worker is registered as `/sw.js?v=<build id>` and names its caches with that version, so each deploy installs a new worker, refreshes the precache, and purges the previous deploy's caches. `next.config.ts` additionally serves `/sw.js` with `Cache-Control: no-cache, no-store, must-revalidate` so the new worker takes over quickly."
      },
      {
        "type": "h3",
        "text": "Verification pages are never served from cache"
      },
      {
        "type": "p",
        "text": "Pages under `/proof`, `/talent`, and `/opportunity` are explicitly excluded from the service worker's page cache. The comment in `sw.js` states the rationale: a stale on-chain verdict is worse than no page — a revoked credential replayed from cache as \"verified\" would invert the product's core guarantee. If the network is unavailable, these routes fall through to the offline page rather than a cached verdict."
      },
      {
        "type": "h3",
        "text": "Other decisions"
      },
      {
        "type": "table",
        "headers": [
          "Decision",
          "Rationale"
        ],
        "rows": [
          [
            "Soroban over classic Stellar",
            "The issuer trust layer and credential lifecycle states need custom logic that classic offers/payments cannot express"
          ],
          [
            "XLM via SAC, not a custom token",
            "Graduates receive actual XLM; no trustline to a custom asset required"
          ],
          [
            "Persistent storage with long TTLs",
            "Credentials should outlive short-term contract state; 518,400–1,036,800 ledger TTLs provide months of persistence"
          ],
          [
            "Typed `#[contracterror]` enum",
            "Clear, actionable errors instead of opaque integer codes"
          ],
          [
            "Fee sponsorship behind server auth",
            "Bearer authorization plus contract/method/fee validation prevents arbitrary public XDR from being sponsor-signed"
          ],
          [
            "Public indexer fallback for event metrics",
            "RPC event retention covers only recent ledgers; Stellar Expert's index keeps older public evidence visible without claiming first-party analytics"
          ]
        ]
      }
    ],
    "faq": [
      {
        "question": "Does Stellaroid Earn have a backend server?",
        "answer": "No traditional backend. The Soroban contract on Stellar testnet is the system of record. The only server-side code is the Next.js app itself: React Server Components that render proof pages via read-only simulation, and four API routes: GET /api/health, GET /api/events and its /stream variant (read-only public event aggregation), and POST /api/fee-bump — an optional, bearer-token-gated endpoint that signs fee-bump transactions server-side with a dedicated testnet sponsor key."
      },
      {
        "question": "How do proof pages verify credentials without a wallet?",
        "answer": "The /proof/[hash] route validates the 64-character hex hash, then calls the contract's get_certificate function through Soroban RPC simulateTransaction, using a dedicated funded read-only address as the transaction source. Simulations are never signed or submitted, so verification requires no wallet, no login, and no fee."
      },
      {
        "question": "Which wallets are supported for signing?",
        "answer": "Two providers are registered in the wallet layer: Freighter (browser extension) and Albedo (web-based signer, which enables mobile signing). All writes go through the connected provider: build transaction, simulate, sign in the wallet, submit via sendTransaction, then poll getTransaction until confirmed."
      },
      {
        "question": "Is anything deployed to mainnet?",
        "answer": "No. This is an early-access pilot on Stellar testnet only. The contract (CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV) is deployed to testnet, the default RPC endpoint is soroban-testnet.stellar.org, and all payment flows use testnet XLM."
      },
      {
        "question": "Why doesn't the service worker cache proof pages?",
        "answer": "Because a stale on-chain verdict is worse than no page. If a revoked credential were replayed from cache as verified, it would invert the product's core guarantee. Pages under /proof, /talent, and /opportunity always hit the network, and /api/* plus cross-origin RPC requests bypass the service worker entirely."
      }
    ]
  },
  {
    "slug": "security",
    "title": "Security posture",
    "metaTitle": "Security posture — contract, CSP, and API guards",
    "metaDescription": "How Stellaroid Earn secures its testnet pilot: Soroban contract auth guards, nonce-based CSP, strict headers, rate-limited APIs, and honest known limitations.",
    "keywords": [
      "soroban contract security",
      "content security policy",
      "nonce-based CSP",
      "stellar testnet",
      "rate limiting",
      "security headers",
      "checks-effects-interactions"
    ],
    "navLabel": "Security",
    "lede": "Stellaroid Earn is a Stellar testnet pilot, and this page documents its security controls the way they are built: concrete guards at the contract, frontend, API, and operational layers — with known limitations stated plainly rather than hidden.",
    "blocks": [
      {
        "type": "p",
        "text": "This page summarizes the security controls verified for the Stellaroid Earn MVP across four layers: the Soroban smart contract, the Next.js frontend, the small server-side API surface, and operations. It is a working posture for a testnet pilot, not a claim of production hardening — the Known limitations section is part of the posture, not an appendix."
      },
      {
        "type": "callout",
        "text": "Testnet only. All contract deployments and transactions target Stellar testnet. Mainnet deployment is explicitly out of scope for this pilot, and a formal third-party audit is planned before any mainnet deployment."
      },
      {
        "type": "h2",
        "text": "Smart contract security"
      },
      {
        "type": "p",
        "text": "Every state-changing function is gated by an explicit authorization check, and every failure path returns a typed error code. The table below maps each guard to its mechanism."
      },
      {
        "type": "table",
        "headers": [
          "Guard",
          "Mechanism"
        ],
        "rows": [
          [
            "Admin access control",
            "Admin-only functions call admin.require_auth() and match the caller against the stored admin address before executing."
          ],
          [
            "Issuer gating",
            "register_certificate and verify_certificate reject callers that do not hold approved issuer status. Issuers self-register into a pending queue; only the admin approves them."
          ],
          [
            "Duplicate prevention",
            "Re-submitting an existing certificate hash returns AlreadyExists (error 4) — no silent overwrites of a credential."
          ],
          [
            "Lifecycle guards",
            "verify only transitions a certificate from Issued; revoke and suspend check caller authorization before mutating state."
          ],
          [
            "Payment authorization",
            "The token transfer only executes when cert.owner equals the submitting student address."
          ],
          [
            "Checks-effects-interactions",
            "Escrow transfers apply the checks-effects-interactions pattern in the contract source (state updates before token transfers). Note: the deployed testnet bytecode is not yet source-verified against current commits — see the verification runbook."
          ],
          [
            "Expiry enforcement (partial)",
            "ensure_not_expired() rejects records with a nonzero expired timestamp before verification or payment. Issuers can now set a window with set_credential_expiry after register_certificate. Live v3.0.0 WASM still always stores expires_at = 0 until a new contract ID is deployed."
          ],
          [
            "Storage TTL",
            "Storage TTL is set to 518,400–1,036,800 ledgers and entries are extended on access to prevent premature archival."
          ],
          [
            "Bounded iteration",
            "All storage reads and writes are O(1) keyed lookups; opportunity milestone counts are capped at 24, and UI render paths clamp defensively."
          ]
        ]
      },
      {
        "type": "p",
        "text": "Cross-contract re-entrancy is not a threat class here: Soroban's single-contract execution model makes it impossible by design."
      },
      {
        "type": "h3",
        "text": "Typed error codes"
      },
      {
        "type": "p",
        "text": "The contract defines a typed `#[contracterror]` enum (17 variants on live v3.0.0, 18 in repository source). The frontend's `humanizeError()` maps every code to safe, non-leaking copy, including source-only `InvalidExpiry` (#18). No raw `ScVal` or `HostError` ever reaches the UI. The credential-layer codes surfaced in the app are:"
      },
      {
        "type": "table",
        "headers": [
          "Code",
          "Error",
          "Category",
          "Meaning"
        ],
        "rows": [
          [
            "1",
            "AlreadyInitialized",
            "state",
            "Init called twice."
          ],
          [
            "2",
            "NotInitialized",
            "state",
            "Admin/token not set yet."
          ],
          [
            "3",
            "Unauthorized",
            "auth",
            "Caller isn't allowed."
          ],
          [
            "4",
            "AlreadyExists",
            "input",
            "Duplicate cert hash."
          ],
          [
            "5",
            "NotFound",
            "input",
            "Hash isn't registered."
          ],
          [
            "6",
            "InvalidAmount",
            "input",
            "Amount must be > 0."
          ],
          [
            "7",
            "IssuerNotFound",
            "input",
            "Issuer hasn't registered on-chain."
          ],
          [
            "8",
            "IssuerNotApproved",
            "state",
            "Issuer still needs admin approval."
          ],
          [
            "9",
            "IssuerSuspended",
            "state",
            "Issuer has been suspended."
          ],
          [
            "10",
            "InvalidStatus",
            "state",
            "Credential is in the wrong lifecycle state for this action."
          ],
          [
            "11",
            "CredentialRevoked",
            "state",
            "Credential was revoked and can no longer unlock payment."
          ],
          [
            "12",
            "CredentialExpired",
            "state",
            "Credential expired and must be reissued or renewed."
          ],
          [
            "18",
            "InvalidExpiry",
            "input",
            "Expiry must be 0 or a future unix timestamp. Source only."
          ]
        ]
      },
      {
        "type": "h2",
        "text": "Frontend security"
      },
      {
        "type": "h3",
        "text": "Nonce-based Content Security Policy"
      },
      {
        "type": "p",
        "text": "The CSP is built per request in `src/middleware.ts`. A fresh nonce is generated for every request (16 bytes from `crypto.getRandomValues`, base64-encoded), attached to the `script-src` directive, and forwarded to server components via an `x-nonce` request header so inline scripts (such as JSON-LD blocks) can carry it. Production `script-src` does not allow `unsafe-inline`."
      },
      {
        "type": "table",
        "headers": [
          "Directive",
          "Production value"
        ],
        "rows": [
          [
            "default-src",
            "'self'"
          ],
          [
            "script-src",
            "'self' 'nonce-{per-request}' https://va.vercel-scripts.com"
          ],
          [
            "style-src",
            "'self' 'unsafe-inline' https://fonts.googleapis.com"
          ],
          [
            "font-src",
            "'self' https://fonts.gstatic.com"
          ],
          [
            "img-src",
            "'self' data: blob:"
          ],
          [
            "worker-src",
            "'self'"
          ],
          [
            "manifest-src",
            "'self'"
          ],
          [
            "connect-src",
            "'self' https://*.stellar.org"
          ],
          [
            "frame-src",
            "'none'"
          ],
          [
            "object-src",
            "'none'"
          ],
          [
            "base-uri",
            "'self'"
          ],
          [
            "form-action",
            "'self'"
          ],
          [
            "frame-ancestors",
            "'none' (relaxed to * only on /proof/{hash}/embed)"
          ]
        ]
      },
      {
        "type": "p",
        "text": "Two environment-scoped relaxations exist and are compiled out of production: development adds `'unsafe-eval'` to `script-src` (Next.js dev tooling), and Vercel preview deployments add `https://vercel.live` to `script-src`, and `https://vercel.live` plus `https://*.vercel.live` to `connect-src` for the preview toolbar. Network egress from the browser is otherwise restricted to `https://*.stellar.org` — the Soroban RPC and Horizon hosts."
      },
      {
        "type": "p",
        "text": "The embed route is the single intentional framing exception: the proxy matches `/proof/{64-hex}/embed` and emits `frame-ancestors *` there so the verified badge can be embedded elsewhere, while every other route gets `frame-ancestors 'none'`. Browsers that support CSP Level 2 give `frame-ancestors` precedence over `X-Frame-Options`, which is how the embed route can be framed despite the global `DENY` header below."
      },
      {
        "type": "code",
        "lang": "text",
        "text": "default-src 'self'; script-src 'self' 'nonce-<per-request>' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; worker-src 'self'; manifest-src 'self'; connect-src 'self' https://*.stellar.org; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
      },
      {
        "type": "h3",
        "text": "Security headers"
      },
      {
        "type": "p",
        "text": "Static security headers are applied to every route from `next.config.ts`; the CSP itself is nonce-based and therefore applied from the proxy instead."
      },
      {
        "type": "table",
        "headers": [
          "Header",
          "Value"
        ],
        "rows": [
          [
            "Strict-Transport-Security",
            "max-age=63072000; includeSubDomains; preload"
          ],
          [
            "X-Frame-Options",
            "DENY"
          ],
          [
            "X-Content-Type-Options",
            "nosniff"
          ],
          [
            "Referrer-Policy",
            "strict-origin-when-cross-origin"
          ],
          [
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=()"
          ]
        ]
      },
      {
        "type": "p",
        "text": "The service worker script `/sw.js` is additionally served with `Cache-Control: no-cache, no-store, must-revalidate` so each deploy's worker takes over quickly and stale client code does not linger."
      },
      {
        "type": "h3",
        "text": "Input validation and output encoding"
      },
      {
        "type": "ul",
        "items": [
          "Proof hashes are validated as 64-character hex before any RPC call is made; dynamic proof pages are cached with revalidate=60.",
          "External URLs (metadata, evidence, issuer links) must be HTTPS and pass an SSRF check that rejects localhost, private IPv4 ranges (10/8, 172.16/12, 192.168/16, 169.254/16, 127/8), IPv6 loopback, unique-local and link-local addresses, and IPv4-mapped IPv6 forms such as ::ffff:127.0.0.1. Issuer-supplied metadata URIs are never fetched server-side — they render as links only, which removes the SSRF fetch surface entirely.",
          "Internal links from untrusted metadata must start with a single slash, contain no backslashes, and resolve to the canonical origin.",
          "Proof metadata is sanitized before render: all text fields are length-truncated (title 140 chars, description 700, skill 64, evidence label 100), skills are capped at 12 entries, evidence links at 8, and any evidence href failing the URL safety checks is dropped.",
          "JSON-LD is serialized through an escaping helper that replaces <, >, &, U+2028, and U+2029 with unicode escapes before injection, and every JSON-LD script tag carries the per-request CSP nonce.",
          "Wallet signing is validated: the network passphrase returned by the wallet is compared to the expected value before signing, and a mismatch aborts the transaction."
        ]
      },
      {
        "type": "h2",
        "text": "API protections"
      },
      {
        "type": "p",
        "text": "The server-side attack surface is deliberately small: four API routes. Three of the four are guarded by dependency-free, in-memory abuse controls from `src/lib/rate-limit.ts` (GET /api/health relies on its 30-second response cache instead) — fixed-window rate limiting, concurrency slots for long-lived streams, and a rolling spend budget. Clients are identified by the first `x-forwarded-for` hop (falling back to `x-real-ip`), and the counter maps are opportunistically pruned once a bucket exceeds 5,000 keys so a spray of unique keys cannot grow memory without bound."
      },
      {
        "type": "table",
        "headers": [
          "Endpoint",
          "Purpose",
          "Guards"
        ],
        "rows": [
          [
            "GET /api/health",
            "RPC health probe",
            "Response cached for 30 seconds to reduce amplification risk"
          ],
          [
            "GET /api/events",
            "Recent contract events",
            "60 requests/min per client IP; limit parameter clamped to 1–40; 30-second revalidate cache"
          ],
          [
            "GET /api/events/stream",
            "Live event stream (SSE)",
            "20 new connections per IP per minute; 4 simultaneous streams per IP; 200 simultaneous streams per instance"
          ],
          [
            "POST /api/fee-bump",
            "Restricted fee sponsorship",
            "Bearer-token auth plus full transaction validation (below)"
          ]
        ]
      },
      {
        "type": "h3",
        "text": "Fee-bump validation chain"
      },
      {
        "type": "p",
        "text": "Fee sponsorship is intentionally not public. The endpoint returns 503 unless both the sponsor secret and bearer token are configured, and every request passes this chain:"
      },
      {
        "type": "ul",
        "items": [
          "Bearer token must match the configured sponsor token.",
          "Submitted XDR is capped at 32,000 characters.",
          "The inner transaction must contain exactly one operation, and it must be a Soroban invokeHostFunction contract call.",
          "The invoked contract must match the configured contract ID, and the method must be on a 16-entry allowlist (register_issuer, register_certificate, verify_certificate, revoke_certificate, suspend_certificate, reward_student, link_payment, create_opportunity, fund_opportunity, submit_milestone, approve_milestone, release_payment, refund_opportunity, refresh_issuer, set_credential_expiry, renew_certificate).",
          "The inner fee is capped at 1,000,000 stroops (0.1 XLM), the network passphrase must match the expected network, the transaction must already carry the user's signature, and the sponsor cannot sponsor its own source account.",
          "Abuse ceilings: a per-instance rate limit (default 30 requests/min, override via FEE_SPONSOR_MAX_REQUESTS_PER_MIN) and a rolling spend budget across all callers (default 200,000,000 stroops — 20 XLM — per minute, override via FEE_SPONSOR_MAX_STROOPS_PER_MIN), so a leaked or shared token cannot script an unbounded sponsor-account drain."
        ]
      },
      {
        "type": "callout",
        "text": "Honest scope note: all of these guards live in module memory. On serverless hosting (Vercel Fluid Compute) they are per-warm-instance, not globally shared, so the hard global ceiling has to come from the layer in front of them. Five Vercel edge rate-limit rules now sit ahead of the app, covering /api/events (which also covers /api/events/stream by prefix), /api/fee-bump, /api/pilot-lead, /api/mcp, and client error reporting. The in-memory guards remain as defense in depth: they bound abuse per instance and, paired with the shared short-TTL event cache, sharply cut upstream RPC and indexer fan-out from connection floods."
      },
      {
        "type": "h2",
        "text": "Operational security"
      },
      {
        "type": "ul",
        "items": [
          "Testnet only: all contract deployments and transactions target Stellar testnet; mainnet is explicitly out of scope.",
          "No custody of user funds: payments move wallet-to-wallet through the native Stellar Asset Contract, and transactions are signed client-side in the user's wallet (Freighter or Albedo). User private keys never touch the server. The one server-held secret is the optional fee-bump sponsor key (FEE_SPONSOR_SECRET) — a dedicated testnet-only account gated by a bearer token and spend caps.",
          "No accounts, passwords, or logins: public verification of a proof page requires no wallet and no sign-in; the only identifier in on-chain records is a public wallet address alongside a SHA-256 certificate hash.",
          "No private keys are stored in code, environment variables, or version control; all NEXT_PUBLIC_* variables in the client bundle are non-sensitive public config (RPC URL, network passphrase, contract ID).",
          "Admin key separation: the admin key used for contract deployment is separate from any personal wallet.",
          "Crawl protection: robots.ts disallows /proof/*/embed, /talent/*, /opportunity/*, and /api/. Proof detail pages stay crawlable on purpose, because a public credential you cannot link or share defeats the point of publishing it, and a proof URL is a 64-hex SHA-256 rather than something you can guess your way through.",
          "RPC health monitoring: the app surfaces a visible error state when the Soroban RPC endpoint is unreachable, and /api/health responses are cached for 30 seconds.",
          "TLS termination and certificate renewal are fully managed by the hosting platform (Vercel), with a 2-year HSTS policy including subdomains and preload."
        ]
      },
      {
        "type": "h2",
        "text": "Known limitations"
      },
      {
        "type": "p",
        "text": "These are stated deliberately. For a testnet pilot, an accurate limitation list is more useful to reviewers than an inflated control list."
      },
      {
        "type": "ul",
        "items": [
          "Testnet MVP, no external audit yet: no formal third-party audit and no external penetration test have been performed. Both are deferred until before any mainnet deployment. An internal red-team review was run and its findings fixed, which is not a substitute for an independent audit.",
          "In-app rate limits are per-instance: every abuse guard written in this repo is in-memory and per-warm-instance, so traffic spread across serverless instances is only bounded per instance. The global ceiling comes from Vercel edge rate-limit rules, which are configured in the Vercel dashboard rather than in this repository and therefore cannot be reviewed from this source tree.",
          "Single admin key: one admin address, set at init, gates issuer approval and suspension and triggers reward payouts. There is no multisig or role separation.",
          "Partial expiry enforcement on live v3.0.0: issuance still stores expires_at = 0. Repository source adds set_credential_expiry and renew_certificate, and the app will call them when an issuer picks a date. Those writes no-op against the live WASM until a new contract ID is deployed.",
          "Source verification pending: the runbook records the deployed WASM hash, but contract-metadata and GitHub-attestation verification is incomplete — the deployment must not be described as source-verified.",
          "Public fee sponsorship intentionally disabled: sponsored transactions require a trusted server-held bearer token."
        ]
      },
      {
        "type": "p",
        "text": "The underlying checklist lives in the repository at `docs/reference/security.md` and was last reviewed on 2026-07-29."
      }
    ],
    "faq": [
      {
        "question": "Has Stellaroid Earn been audited?",
        "answer": "No. Stellaroid Earn is a testnet MVP and has had no formal third-party audit or penetration test. Both are explicitly deferred and planned before any mainnet deployment. In the meantime, the contract test suite covers authorization, duplicate rejection, payment gating, and the full credential lifecycle."
      },
      {
        "question": "Does Stellaroid Earn hold or custody user funds?",
        "answer": "No. Payments move wallet-to-wallet through the native Stellar Asset Contract on testnet. Transactions are signed client-side in the user's wallet (Freighter or Albedo), and the server never sees or stores a user's private key. (The optional fee-bump endpoint holds its own dedicated testnet sponsor key, gated by a bearer token and spend caps.)"
      },
      {
        "question": "Are the API rate limits enforced globally?",
        "answer": "The guards in this repo are not global; the edge rules in front of them are. The rate limits, stream concurrency slots, and fee-sponsorship spend budget are in-memory and per-warm-instance on serverless hosting, so on their own they bound abuse per instance rather than globally. The hard global ceiling comes from five Vercel edge rate-limit rules that sit ahead of the app on the unauthenticated endpoints. Those rules are configured in the Vercel dashboard rather than in this repository, so they cannot be reviewed from this source tree."
      },
      {
        "question": "What personal data does the platform store?",
        "answer": "There are no user accounts, passwords, or logins. Public proof verification works without a wallet or sign-in. On-chain records contain a SHA-256 certificate hash, credential metadata, and public wallet addresses — no private keys are stored in code, environment variables, or version control."
      },
      {
        "question": "How does the frontend prevent XSS?",
        "answer": "Every request gets a fresh Content-Security-Policy with a random per-request nonce; production script-src allows only self, nonce-tagged scripts, and Vercel analytics — no unsafe-inline. JSON-LD output is serialized through an escaping helper (replacing angle brackets, ampersands, and line separators), untrusted metadata is length-truncated and URL-checked before render, and frame-src and object-src are set to none."
      }
    ]
  }
];

export function getDocPage(slug: string): DocPage | undefined {
  return docsPages.find((p) => p.slug === slug);
}
