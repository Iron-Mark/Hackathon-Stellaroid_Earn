// Content for the audience landing pages. Drafted + fact-checked against the
// contract flow; keep claims testnet-honest (see /about + llms.txt).
import type { LandingContent } from "./types";

export const verifyBootcampCertificate: LandingContent = {
  "slug": "/verify-bootcamp-certificate",
  "metaTitle": "Verify Bootcamp Certificate on Blockchain",
  "metaDescription": "Verify bootcamp certificates on blockchain: anchor a certificate's SHA-256 hash on Stellar so graduates get tamper-evident proof employers check in seconds.",
  "keywords": [
    "verify bootcamp certificate on blockchain",
    "on-chain certificate verification for bootcamps",
    "anchor SHA-256 hash of a certificate",
    "blockchain credential for schools",
    "tamper-evident bootcamp certificate",
    "Stellar credential verification"
  ],
  "eyebrow": "FOR BOOTCAMPS & CREDENTIAL ISSUERS",
  "h1": "Verify bootcamp certificates on the blockchain",
  "lede": "Anchor each certificate's SHA-256 hash on Stellar so your graduates carry a tamper-evident proof anyone can check in seconds, no email thread, no phone call, no login. This is an early-access pilot running live on Stellar testnet.",
  "primaryCta": {
    "label": "Register as an issuer",
    "href": "/issuer/register"
  },
  "secondaryCta": {
    "label": "See a sample proof",
    "href": "/proof"
  },
  "sections": [
    {
      "heading": "What it means to verify a bootcamp certificate on blockchain",
      "paragraphs": [
        "When your bootcamp issues a certificate, the file itself is easy to copy, screenshot, or forge. Anchoring it on-chain fixes that. Your browser computes the certificate's SHA-256 hash, a 64-character fingerprint unique to that exact document, and an issuer signs the register_certificate transaction, binding the hash to the graduate's Stellar wallet.",
        "From that point the credential has an on-chain record: who issued it, which wallet owns it, and its status. Anyone can confirm the proof against the live contract on Stellar testnet without contacting your registrar. Verification stops being a favor your admissions staff does over email and becomes a public, read-only lookup."
      ],
      "bullets": [
        "SHA-256 hash binds one exact certificate file to one graduate wallet",
        "register_certificate writes the record on-chain and emits a cert_reg event",
        "Credentials move through explicit statuses: issued, verified, suspended, revoked, expired"
      ]
    },
    {
      "heading": "Tamper-evidence: duplicate hashes are rejected on-chain",
      "paragraphs": [
        "The contract will not let the same certificate hash be registered twice. A second attempt to anchor an already-registered hash fails with an AlreadyExists error before anything is written. Nobody, not another issuer, not a bad actor, can quietly overwrite or re-mint a credential your school already anchored.",
        "Because the hash is derived from the document, any edit to the certificate (a changed name, date, or grade) produces a completely different hash that will not match the anchored record. That mismatch is the tamper-evidence: an altered file simply won't verify."
      ]
    },
    {
      "heading": "The public proof page your graduates share",
      "paragraphs": [
        "Every anchored credential gets a public proof page. A graduate pastes the 64-character hash, or shares the link, and the page shows the on-chain record, the issuing organization's trust status, the credential's current status, and any attached evidence. No wallet, no account, no login is required to open it.",
        "That means an employer in another country can confirm a certificate the moment they receive it, and your graduate controls the link they hand out. A wallet is only ever needed to issue, verify, or pay on-chain, never to read a proof."
      ],
      "bullets": [
        "Wallet-free and login-free, verification is public and read-only",
        "Shows credential status, issuer trust status, and on-chain evidence",
        "Every action is auditable on stellar.expert via the emitted events"
      ]
    },
    {
      "heading": "The issuer trust registry",
      "paragraphs": [
        "A proof is only as good as the organization behind it, so issuers are first-class, on-chain identities. Your bootcamp self-registers with register_issuer and enters a pending queue; an admin approves it with approve_issuer before it can issue or verify anything. Approved status is visible on every proof page your credentials appear on.",
        "This two-step trust handshake is what lets an employer distinguish a credential from an approved issuer from one issued by an unverified wallet, without you vouching for it manually. An admin can also suspend an issuer, which is reflected on-chain immediately."
      ]
    },
    {
      "heading": "Verification and payment, bound in one flow",
      "paragraphs": [
        "Most credential tools stop at issuing a badge; background-check firms only do verification. Stellaroid Earn sits at the intersection: once a credential is verified, the same flow can settle payment. An employer calls link_payment, which sends XLM through the native Stellar Asset Contract straight to the graduate's verified wallet, testnet settlement is typically under five seconds and costs a fraction of a cent.",
        "For a bootcamp, that closes the loop between the proof you issue and the outcome your graduates are chasing: verified work that an employer can trust and pay against without an invoice or a middleman."
      ]
    }
  ],
  "features": [
    {
      "title": "Tamper-evident by design",
      "body": "The certificate's SHA-256 hash is anchored on-chain, and duplicate hashes are rejected with an AlreadyExists error. Any edit to the file breaks the match, so forgeries won't verify."
    },
    {
      "title": "Wallet-free public proofs",
      "body": "Graduates share a proof link that anyone can open, no wallet, no account, no login. Employers confirm a credential in seconds instead of waiting on an email reply."
    },
    {
      "title": "On-chain issuer trust",
      "body": "Your bootcamp registers with register_issuer and is approved by an admin. Approved-issuer status shows on every proof, so employers can tell a trusted credential from an unverified one."
    },
    {
      "title": "Open and auditable",
      "body": "register_certificate and verify_certificate emit cert_reg and cert_ver events that anyone can audit on stellar.expert. Nothing about a credential is hidden behind a private database."
    },
    {
      "title": "Full credential lifecycle",
      "body": "Credentials carry explicit statuses, issued, verified, suspended, revoked, expired, so you can pause or revoke a credential on-chain while keeping its full audit trail intact."
    },
    {
      "title": "Verify-then-pay in one flow",
      "body": "Once verified, a graduate's wallet can receive XLM via link_payment through the native Stellar Asset Contract, testnet settlement typically under five seconds for a fraction of a cent."
    }
  ],
  "steps": [
    {
      "name": "Register your bootcamp as an issuer",
      "text": "Sign register_issuer with your organization's Stellar wallet to enter the pending trust queue, then an admin approves you with approve_issuer. Approved-issuer status then appears on every proof your credentials produce."
    },
    {
      "name": "Anchor the certificate hash",
      "text": "Drop the certificate PDF into the app; the browser computes its SHA-256 hash and you sign register_certificate to bind that hash to the graduate's wallet. The contract rejects duplicate hashes and emits a cert_reg event."
    },
    {
      "name": "Verify the credential on-chain",
      "text": "An approved issuer or the admin calls verify_certificate with the hash. The contract updates the credential's status to Verified and emits a cert_ver event that anyone can audit on stellar.expert."
    },
    {
      "name": "Share the public proof",
      "text": "The graduate shares the proof page or its 64-character hash. Employers open it with no wallet or login and see the on-chain record, issuer trust status, and credential status in seconds."
    }
  ],
  "faq": [
    {
      "question": "How do you verify a bootcamp certificate on the blockchain?",
      "answer": "An issuer computes the certificate's SHA-256 hash and signs register_certificate to bind it to the graduate's Stellar wallet. An approved issuer or admin then calls verify_certificate, which sets the credential's status to Verified and emits a cert_ver event. Anyone can then confirm the credential on the public proof page or on stellar.expert without a wallet or login."
    },
    {
      "question": "What does anchoring a certificate's SHA-256 hash actually prove?",
      "answer": "The SHA-256 hash is a unique fingerprint of one exact certificate file. Anchoring it on-chain records which wallet holds that credential and when it was issued and verified. Because the hash is derived from the document, any change to the certificate produces a different hash that won't match the anchored record, so an altered or forged file will not verify."
    },
    {
      "question": "Can the same certificate be registered twice?",
      "answer": "No. The contract rejects a duplicate hash with an AlreadyExists error before writing anything, so a credential your bootcamp has already anchored cannot be overwritten or re-minted by anyone else. This is the tamper-evidence guarantee for issuers."
    },
    {
      "question": "Do graduates or employers need a wallet to check a certificate?",
      "answer": "No. Verification is public and read-only, anyone can open a proof page or paste the 64-character hash to confirm a credential with no wallet and no login. A Stellar wallet is only needed to issue, verify, or pay on-chain."
    },
    {
      "question": "Who is allowed to verify a credential?",
      "answer": "Only an approved issuer or the admin wallet can submit the verify_certificate transaction. Issuers become approved through a two-step handshake: they self-register with register_issuer and an admin approves them with approve_issuer. Approved-issuer status is shown on every proof page."
    },
    {
      "question": "Is this running on Stellar mainnet?",
      "answer": "No. Stellaroid Earn is an early-access pilot running live on Stellar testnet. It is a free public demo with no purchase, subscription, or mainnet funds required, you can register as an issuer and anchor test credentials to try the full issue-to-verify flow."
    }
  ],
  "internalLinks": [
    {
      "label": "Register as an issuer",
      "href": "/issuer/register"
    },
    {
      "label": "See a sample proof page",
      "href": "/proof"
    },
    {
      "label": "Try the app",
      "href": "/app"
    },
    {
      "label": "Verify candidate credentials",
      "href": "/verify-candidate-credentials"
    },
    {
      "label": "Instant payouts to graduates",
      "href": "/instant-payouts"
    },
    {
      "label": "For employers",
      "href": "/employer"
    },
    {
      "label": "Join the pilot",
      "href": "/pilot"
    },
    {
      "label": "Why Stellaroid Earn",
      "href": "/about"
    },
    {
      "label": "Glossary of terms",
      "href": "/glossary"
    },
    {
      "label": "Guides",
      "href": "/guides"
    }
  ]
};

export const verifyCandidateCredentials: LandingContent = {
  "slug": "/verify-candidate-credentials",
  "metaTitle": "Verify Candidate Credentials on Stellar",
  "metaDescription": "Verify candidate credentials instantly from a public, wallet-free proof URL, no login or background-check delay, then fund a paid trial in XLM on Stellar.",
  "keywords": [
    "verify candidate credentials instantly",
    "how do employers verify bootcamp credentials",
    "background check alternative for education",
    "instant credential verification",
    "on-chain credential verification",
    "verify bootcamp graduate credentials",
    "credential verification for recruiters"
  ],
  "eyebrow": "For employers and recruiters",
  "h1": "Verify candidate credentials instantly, from one public URL",
  "lede": "Open a candidate's proof page and confirm their credential on Stellar in seconds, no login, no wallet, no third-party background-check wait. When the record checks out, fund a paid trial in XLM tied to that exact verified credential.",
  "primaryCta": {
    "label": "Verify a credential",
    "href": "/proof"
  },
  "secondaryCta": {
    "label": "Fund a paid trial",
    "href": "/employer"
  },
  "sections": [
    {
      "heading": "The credential check that doesn't wait on an email",
      "paragraphs": [
        "A candidate presents a certificate. Confirming it the usual way means emailing the school, waiting on a reply, or routing it through a third-party check, days or weeks before you can move. Stellaroid Earn removes that step for the credential itself, because the proof already lives on Stellar.",
        "When an issuer registers a certificate, its SHA-256 hash is bound on-chain to the graduate's wallet with register_certificate, and duplicate hashes are rejected. You confirm it by opening a public proof page, read-only, with no login and no wallet."
      ],
      "bullets": [
        "Public and read-only, open the proof URL and the record loads without an account.",
        "Auditable, verification emits an on-chain event you can inspect on stellar.expert.",
        "Not just a logo you trust, the issuer's on-chain approval status is shown next to the credential."
      ]
    },
    {
      "heading": "What a proof page shows you",
      "paragraphs": [
        "Each proof page is a single, shareable URL. It surfaces exactly what a reviewer needs to make a call, and links straight to the raw on-chain record."
      ],
      "bullets": [
        "A live status badge: issued, verified, suspended, revoked, or expired.",
        "The issuer's trust state: approved, pending, or suspended.",
        "The graduate's wallet address and the certificate hash, both copyable.",
        "A direct link to the contract's on-chain events on stellar.expert.",
        "Credential details attached by the issuer, title, cohort, and any linked evidence."
      ]
    },
    {
      "heading": "Verified once, then fund the work in the same flow",
      "paragraphs": [
        "Verification and payment are bound together on-chain, that is the wedge. Credential platforms issue badges; screening firms confirm history; Stellaroid does the one thing neither does: it lets you pay against the exact credential you just verified.",
        "Once an approved issuer or the admin wallet has run verify_certificate, you can fund a paid trial with link_payment, which sends XLM through the native Stellar Asset Contract straight to the verified wallet. On testnet that settles in typically under five seconds for a fraction of a cent, no invoice, no net-terms, no platform take rate."
      ]
    },
    {
      "heading": "Where we are: a live testnet pilot",
      "paragraphs": [
        "Stellaroid Earn is an early-access startup running a live pilot on Stellar testnet. Everything here is real and on-chain, but it settles in testnet XLM, not mainnet funds, it is a working demonstration of the verify-then-pay flow, not a regulated background-screening or financial product.",
        "It verifies the credential a candidate presents; it does not run criminal, employment-history, or identity checks. If you want to put it in front of real candidates, join the pilot and fund a paid trial."
      ]
    }
  ],
  "features": [
    {
      "title": "Confirm in seconds",
      "body": "Open a public proof URL and read the credential's on-chain status right away, no account, no wallet, no waiting on an email reply from the school."
    },
    {
      "title": "Auditable, not just asserted",
      "body": "verify_certificate emits a cert_ver event on-chain. You can confirm it yourself on stellar.expert instead of trusting a PDF or a logo on a resume."
    },
    {
      "title": "Issuer trust is on the page",
      "body": "Each proof shows whether the issuing school or bootcamp is an approved, pending, or suspended issuer, so you know who stands behind the credential."
    },
    {
      "title": "Live credential status",
      "body": "Credentials carry a real status, issued, verified, suspended, revoked, or expired, so you never act on a stale or withdrawn record."
    },
    {
      "title": "Pay against the verified credential",
      "body": "link_payment sends XLM via the native Stellar Asset Contract straight to the verified wallet, settling on testnet in typically under five seconds for a fraction of a cent."
    },
    {
      "title": "Wallet-free to verify",
      "body": "A wallet is only needed to issue, verify, or pay. Checking a candidate's credential needs nothing but the link they share."
    }
  ],
  "steps": [
    {
      "name": "Open the proof page",
      "text": "Paste the candidate's 64-character certificate hash at /proof, or open the proof URL they shared. The record loads read-only, no login or wallet needed."
    },
    {
      "name": "Read the status and issuer",
      "text": "Confirm the status badge reads Verified and check the issuer's on-chain trust state. Verified means an approved issuer or the admin wallet ran verify_certificate for that hash."
    },
    {
      "name": "Audit it on-chain",
      "text": "Follow the link to stellar.expert to see the cert_ver event and the contract's full history for yourself. Nothing is hidden behind the UI."
    },
    {
      "name": "Fund a paid trial (optional)",
      "text": "To move forward, use link_payment to send XLM through the native Stellar Asset Contract to the graduate's verified wallet. Testnet settlement is typically under five seconds."
    }
  ],
  "faq": [
    {
      "question": "How do employers verify bootcamp credentials with Stellaroid Earn?",
      "answer": "Open the candidate's public proof page and paste the 64-character SHA-256 hash of their certificate. The page loads the on-chain record, the credential's status, the issuing school or bootcamp's trust state, the graduate's wallet, and a link to the raw events on stellar.expert, all read-only, with no login or wallet required."
    },
    {
      "question": "Do I need an account or wallet to verify a candidate's credential?",
      "answer": "No. Verification is public and read-only, so anyone can open a proof page and confirm a credential without connecting a wallet or creating an account. A wallet is only needed if you want to issue, verify, or pay on-chain."
    },
    {
      "question": "Is this a background check?",
      "answer": "No. Stellaroid Earn instantly confirms the credential a candidate presents by checking its on-chain record; it does not run criminal, employment-history, or identity screening, and it is not a regulated background-check provider. It is an instant, auditable way to verify the credential itself, currently running as a live pilot on Stellar testnet."
    },
    {
      "question": "What does a 'Verified' status actually mean?",
      "answer": "It means an approved issuer or the admin wallet submitted the verify_certificate transaction for that certificate hash. The contract then set the credential's status to Verified and emitted a cert_ver event that anyone can audit on stellar.expert."
    },
    {
      "question": "How do I pay a candidate once their credential is verified?",
      "answer": "Call link_payment, which transfers XLM through the native Stellar Asset Contract directly to the graduate's verified wallet. On testnet this settles in typically under five seconds for a fraction of a cent, with no invoice and no platform fee."
    },
    {
      "question": "What if the credential was revoked or expired?",
      "answer": "The proof page shows it. Credentials carry a live status, issued, verified, suspended, revoked, or expired, and revoked or expired credentials stay visible on-chain for auditability but are no longer eligible for verification-based actions like payment."
    }
  ],
  "internalLinks": [
    {
      "label": "Verify a credential",
      "href": "/proof"
    },
    {
      "label": "Fund a paid trial",
      "href": "/employer"
    },
    {
      "label": "Verify a bootcamp certificate",
      "href": "/verify-bootcamp-certificate"
    },
    {
      "label": "Instant payouts in XLM",
      "href": "/instant-payouts"
    },
    {
      "label": "How Stellaroid Earn works",
      "href": "/about"
    },
    {
      "label": "Join the pilot",
      "href": "/pilot"
    },
    {
      "label": "Try the app",
      "href": "/app"
    },
    {
      "label": "Glossary",
      "href": "/glossary"
    }
  ]
};

export const instantPayouts: LandingContent = {
  "slug": "/instant-payouts",
  "metaTitle": "Get Paid in XLM for Verified Credentials",
  "metaDescription": "Instant payouts in XLM the moment your credential is verified: link_payment sends XLM straight to your verified Stellar wallet in seconds for a fraction of a cent.",
  "keywords": [
    "get paid in XLM when your credential is verified",
    "instant crypto payout on credential verification",
    "pay graduates in XLM",
    "stellar payment for verified work",
    "verify then pay on-chain",
    "link_payment XLM",
    "instant XLM payout",
    "credential verification and payment"
  ],
  "eyebrow": "PROOF, THEN PAYMENT",
  "h1": "Get paid in XLM the moment your credential is verified",
  "lede": "Stellaroid Earn binds credential verification to an instant payout in one on-chain flow. Once an approved issuer verifies your credential, link_payment sends XLM straight to your verified wallet, typically in under five seconds, for a fraction of a cent. This is a live pilot on Stellar testnet.",
  "primaryCta": {
    "label": "Try the pilot",
    "href": "/app"
  },
  "secondaryCta": {
    "label": "View a live proof",
    "href": "/proof"
  },
  "sections": [
    {
      "heading": "Why proof and payment belong in one flow",
      "paragraphs": [
        "Most tools stop at the credential. A graduate earns a badge, then waits days or weeks while an employer confirms it by email, runs a background check, and finally cuts a payment through net-30 terms and a platform that skims a cut. The proof and the payout live in two different systems, and the gap between them is where time and money leak.",
        "Stellaroid Earn closes that gap. The same on-chain record that proves a credential is real is the record that unlocks payment. There is no second system to reconcile: when the contract marks a credential Verified, the employer can pay the exact wallet that owns it, and the money moves in the same flow."
      ],
      "bullets": [
        "Verification and payment share one on-chain source of truth",
        "No invoice, no net-terms, no 30-day wait after work is verified",
        "Payment lands on the wallet the credential is bound to, not a routing account"
      ]
    },
    {
      "heading": "The verify-then-pay flow, on-chain",
      "paragraphs": [
        "Three contract calls carry a credential from issued to paid. An issuer calls register_certificate to bind a certificate's SHA-256 hash to a graduate's Stellar wallet; duplicate hashes are rejected on-chain. An approved issuer or the admin then calls verify_certificate, which sets the credential status to Verified and emits a cert_ver event anyone can audit on stellar.expert.",
        "Only after that does payment open. link_payment transfers XLM via the native Stellar Asset Contract directly to the verified wallet and emits a payment event. On Stellar testnet, settlement is typically under five seconds and costs a fraction of a cent in network fees."
      ],
      "bullets": [
        "register_certificate, anchor the hash to the graduate's wallet",
        "verify_certificate, trusted verification, status becomes Verified, emits cert_ver",
        "link_payment, XLM moves wallet-to-wallet via the native SAC, emits payment"
      ]
    },
    {
      "heading": "Payment is gated on verification, by the contract",
      "paragraphs": [
        "Binding proof to payment only matters if the payment cannot jump the queue. In Stellaroid Earn, it cannot. An employer cannot pay a credential that has not been verified, the contract blocks the write until a credential reaches the Verified state, and a revoked credential is rejected with a typed CredentialRevoked error.",
        "The gate stays closed on bad credentials too. A revoked credential can no longer unlock payment (the contract returns CredentialRevoked), and suspended or expired credentials are not eligible for verification-based actions. The status that graduates and employers see on a proof page is the same status the contract enforces before it releases a single stroop."
      ],
      "bullets": [
        "No payment to an unverified credential, enforced on-chain",
        "Revoked, suspended, and expired credentials cannot trigger a payout",
        "The proof page status and the contract's gate are the same record"
      ]
    },
    {
      "heading": "The wedge: verification and payment, bound in one flow",
      "paragraphs": [
        "Credential platforms like Credly, Accredible, Dock, Blockcerts, and BCdiploma issue and display credentials. Background-check firms verify people. Neither side pays anyone. Stellaroid Earn sits at the intersection they leave empty: it verifies a credential and pays its owner in a single on-chain flow.",
        "Because it runs on Stellar, the payout is near-instant and near-free, it moves wallet-to-wallet with no platform take rate, and every step, the verification and the payment, is a public event on stellar.expert. Anyone can open a proof page and confirm a credential with no wallet and no login; a wallet is only needed to issue, verify, or pay."
      ]
    }
  ],
  "features": [
    {
      "title": "Direct to the verified wallet",
      "body": "link_payment sends XLM through the native Stellar Asset Contract straight to the wallet the credential is bound to, wallet-to-wallet, with no platform take rate between the employer and the graduate."
    },
    {
      "title": "Sub-5-second settlement",
      "body": "On Stellar testnet, a payment typically clears in under five seconds. There is no invoice to raise, no net-30 to wait out, and no batch run, the payout follows verification immediately."
    },
    {
      "title": "A fraction of a cent in fees",
      "body": "Stellar network fees are tiny, so paying a graduate costs a fraction of a cent. The economics work for a single credential payout, not just large batches."
    },
    {
      "title": "Payment gated on verification",
      "body": "The contract will not release funds to an unverified credential, and a revoked credential returns CredentialRevoked. Employers pay confirmed work, and only confirmed work."
    },
    {
      "title": "Public, auditable payout",
      "body": "Verification emits cert_ver and payment emits a payment event, both visible on stellar.expert. The proof page shows the status; the chain shows the money moved."
    },
    {
      "title": "No login to check the proof",
      "body": "Anyone can open a public proof page and confirm a credential without a wallet or account. A wallet is only needed to issue, verify, or pay on-chain."
    }
  ],
  "steps": [
    {
      "name": "An issuer anchors the credential",
      "text": "A school, bootcamp, or employer calls register_certificate, binding the certificate's SHA-256 hash to the graduate's Stellar wallet. Duplicate hashes are rejected on-chain, so a credential cannot be silently overwritten."
    },
    {
      "name": "An approved issuer verifies it",
      "text": "An approved issuer or the admin wallet calls verify_certificate with the hash. The contract sets the credential status to Verified and emits a cert_ver event that anyone can audit on stellar.expert, no email thread required."
    },
    {
      "name": "The employer pays the verified wallet",
      "text": "With the credential verified, the employer calls link_payment to send XLM via the native Stellar Asset Contract straight to the graduate's wallet. It emits a payment event and typically settles in under five seconds for a fraction of a cent."
    }
  ],
  "faq": [
    {
      "question": "How do I get paid in XLM when my credential is verified?",
      "answer": "Once an approved issuer or the admin verifies your credential with verify_certificate, an employer can call link_payment, which transfers XLM through the native Stellar Asset Contract directly to your verified Stellar wallet. On testnet it typically settles in under five seconds for a fraction of a cent, with no invoice and no platform fee."
    },
    {
      "question": "Can an employer pay before a credential is verified?",
      "answer": "No. The contract blocks payment to any credential that has not reached the Verified status, this is enforced on-chain by the contract itself. A revoked credential also cannot unlock payment; the contract returns a CredentialRevoked error."
    },
    {
      "question": "How fast does the payout settle and what does it cost?",
      "answer": "Payments run on Stellar testnet through the native Stellar Asset Contract, so settlement is typically under five seconds and network fees are a fraction of a cent. This is a live pilot on testnet, not a mainnet or production financial product."
    },
    {
      "question": "Does the payment go through a platform or middleman?",
      "answer": "No. link_payment moves XLM wallet-to-wallet, straight to the wallet the credential is bound to, with no platform take rate between the employer and the graduate. The transfer emits a payment event that is publicly auditable on stellar.expert."
    },
    {
      "question": "Do I need a wallet to view a proof of payment or verification?",
      "answer": "No. Verification is public and read-only, anyone can open a proof page and confirm a credential's status, its issuer's trust standing, and its on-chain events without connecting a wallet or logging in. A wallet is only needed to issue, verify, or pay on-chain."
    },
    {
      "question": "Is this real money on mainnet?",
      "answer": "No. Stellaroid Earn is a live pilot running on Stellar testnet. It is a free public demo with no purchase, subscription, or mainnet funds required, and it should not be treated as a mainnet or production financial product."
    }
  ],
  "internalLinks": [
    {
      "label": "Try the pilot",
      "href": "/app"
    },
    {
      "label": "View a live proof",
      "href": "/proof"
    },
    {
      "label": "For employers",
      "href": "/employer"
    },
    {
      "label": "Verify candidate credentials",
      "href": "/verify-candidate-credentials"
    },
    {
      "label": "Register as an issuer",
      "href": "/issuer/register"
    },
    {
      "label": "Join the pilot",
      "href": "/pilot"
    },
    {
      "label": "How it works",
      "href": "/about"
    },
    {
      "label": "Glossary",
      "href": "/glossary"
    }
  ]
};

export const landingPages: LandingContent[] = [
  verifyBootcampCertificate,
  verifyCandidateCredentials,
  instantPayouts,
];
