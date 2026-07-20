// Guides library registry, /guides, /guides/[slug], the sitemap, and
// internal links all derive from this single typed source.
import type { GuideArticle, GuideIndexContent } from "./types";

export const guideIndexContent: GuideIndexContent = {
  "slug": "/guides",
  "metaTitle": "Stellar Credential Verification Guides",
  "metaDescription": "Stellar credential verification guides for issuers, employers, and graduates, anchor a certificate hash, verify it on-chain, and pay in one flow on testnet.",
  "keywords": [
    "stellar credential verification guides",
    "blockchain credential guides",
    "how to verify credentials",
    "on-chain credential verification guide",
    "verify credentials on stellar",
    "soroban credential guides"
  ],
  "eyebrow": "Guides · Stellar testnet pilot",
  "h1": "Stellar credential verification guides",
  "lede": "A growing library of step-by-step guides for verifying credentials and paying graduates on Stellar. Each one is grounded in the live testnet pilot and names the exact on-chain actions, so you can follow along and audit every step on stellar.expert.",
  "sections": [
    {
      "heading": "What the guides cover",
      "paragraphs": [
        "Every guide walks through one part of the Stellaroid Earn flow on Stellar testnet, grounded in the actual contract functions rather than marketing shorthand. You see how a certificate hash is anchored, verified, and paid, with each on-chain action named so you can reproduce it and audit the result on stellar.expert.",
        "The guides are practical, not theoretical: they follow the same three-step path the pilot uses, register, verify, pay, and point to the exact page where you can run each step yourself."
      ],
      "bullets": [
        "Anchoring a credential, how an issuer computes a certificate's SHA-256 hash and binds it to a graduate's Stellar wallet with register_certificate, and why duplicate hashes are rejected on-chain.",
        "Verifying credentials, how an approved issuer or the admin calls verify_certificate, moving a credential to Verified and emitting a cert_ver event anyone can audit.",
        "Instant payouts, how link_payment sends XLM through the native Stellar Asset Contract straight to a verified wallet, typically settling in under five seconds for a fraction of a cent.",
        "Reading a proof, how to open a public proof page and confirm a credential's status (issued, verified, suspended, revoked, or expired) with no wallet and no login."
      ]
    },
    {
      "heading": "Who they're for",
      "paragraphs": [
        "The library is written for the three people in the flow. Pick the track that matches what you are trying to do; each guide is self-contained and links into the live pilot so you can try the step for yourself."
      ],
      "bullets": [
        "Issuers, bootcamps, schools, and training providers registering and verifying credentials on-chain.",
        "Employers and recruiters, confirming a candidate's credential and paying them directly, without an email thread or invoice delay.",
        "Graduates, sharing a wallet-free public proof link that anyone can open and verify in seconds."
      ]
    }
  ],
  "faq": [
    {
      "question": "What do the Stellar credential verification guides cover?",
      "answer": "They cover the full on-chain flow: how an issuer anchors a certificate's SHA-256 hash to a graduate's wallet with register_certificate, how an approved issuer or the admin calls verify_certificate to set the status to Verified and emit a cert_ver event, and how link_payment pays the graduate in XLM. They also show how to read a public proof page without a wallet."
    },
    {
      "question": "Do I need a wallet to follow these guides?",
      "answer": "No wallet is needed to read the guides or to open a public proof page, verification is public and read-only. A Stellar wallet such as Freighter or Albedo is only required when you actually issue, verify, or pay on-chain."
    },
    {
      "question": "Are these guides for mainnet or testnet?",
      "answer": "Everything in the guides runs on the Stellar testnet pilot. It is a free public demo with no purchase, subscription, or mainnet funds required, and on-chain payments typically settle in under five seconds for a fraction of a cent."
    }
  ],
  "primaryCta": {
    "label": "Try the pilot",
    "href": "/app"
  },
  "secondaryCta": {
    "label": "Browse the glossary",
    "href": "/glossary"
  }
};

export const guides: GuideArticle[] = [
  {
    "slug": "verify-bootcamp-certificate-is-real",
    "title": "How to verify a coding bootcamp certificate is real",
    "metaTitle": "How to Verify a Coding Bootcamp Certificate Is Real",
    "metaDescription": "Learn how to verify a coding bootcamp certificate is real: open its public proof page, check on-chain status and issuer trust, then audit it on stellar.expert.",
    "keywords": [
      "how to verify a coding bootcamp certificate is real",
      "is a bootcamp certificate legitimate",
      "verify certificate authenticity",
      "spot a fake certificate",
      "how to check a bootcamp certificate on-chain",
      "bootcamp certificate verification",
      "verify bootcamp certificate online",
      "check if a certificate is real"
    ],
    "audience": "Employers, recruiters, and graduates",
    "datePublished": "2026-07-09",
    "technical": false,
    "lede": "Anyone can claim a bootcamp certificate; almost no one can check one in minutes. Here is how to tell whether a coding bootcamp certificate is real, the limits of PDFs and screenshots, and how a public, wallet-free on-chain proof page settles the question for good.",
    "blocks": [
      {
        "type": "p",
        "text": "A coding bootcamp certificate is easy to claim and, historically, hard to check. Employers email the school and wait days; recruiters take the PDF on faith; graduates get passed over while verification drags. This guide shows how to verify a coding bootcamp certificate is real in minutes, what a PDF can and cannot prove, and how an on-chain proof page removes the guesswork."
      },
      {
        "type": "callout",
        "text": "Where this runs: the proof pages in this guide are part of Stellaroid Earn, an early-access pilot live on Stellar testnet, free to try, no wallet needed to read a proof."
      },
      {
        "type": "h2",
        "text": "Why a PDF or a screenshot cannot prove a certificate is real"
      },
      {
        "type": "p",
        "text": "The usual proof of a bootcamp credential is a PDF, an image, or a line on a profile. None of them are verifiable on their own:"
      },
      {
        "type": "ul",
        "items": [
          "A PDF can be copied, edited in minutes, or generated from a template, the file itself carries no signature most people can meaningfully check.",
          "A screenshot proves even less; it is trivial to fabricate and impossible to trace back to the issuer.",
          "There is usually no authoritative source to check against, so verification falls back on emailing the school and waiting for a reply.",
          "Third-party background checks add cost and days, and still depend on someone answering that email."
        ]
      },
      {
        "type": "callout",
        "text": "The core problem is not that people lie often, it is that honest credentials are slow and expensive to confirm. That friction is exactly what an on-chain proof removes."
      },
      {
        "type": "h2",
        "text": "What makes a credential verifiable on-chain"
      },
      {
        "type": "p",
        "text": "Stellaroid Earn takes a different approach. The issuing school or bootcamp anchors the certificate's SHA-256 hash on Stellar and binds it to the graduate's wallet using the register_certificate function. Duplicate hashes are rejected on-chain, so the same certificate cannot be registered twice. From then on the credential carries a status anyone can read:"
      },
      {
        "type": "ul",
        "items": [
          "Issued, registered on-chain, but not yet verified.",
          "Verified, an approved issuer or the admin confirmed it with verify_certificate.",
          "Suspended, temporarily paused by the issuer or admin.",
          "Revoked, invalidated, but kept visible on-chain for auditability.",
          "Expired, past its validity window and no longer eligible for verification-based actions."
        ]
      },
      {
        "type": "p",
        "text": "Because the record and its events live on-chain, verification is public and read-only. You do not need a wallet, an account, or the graduate's permission to look. A wallet is only needed to issue, verify, or pay."
      },
      {
        "type": "p",
        "text": "Whether you are an employer screening a candidate, a recruiter confirming a claim, or a graduate checking your own proof, the five-step checklist at the end of this guide walks the whole verification in under a minute, get the hash or proof link, open the public proof page, read the status, check the issuer, and audit the record on stellar.expert."
      },
      {
        "type": "callout",
        "text": "Match the hash. If a graduate sends you the original PDF, compute its SHA-256 hash with any standard tool and confirm it matches the hash on the proof page. A match means that exact file was the one anchored on-chain; a mismatch means the document was altered."
      },
      {
        "type": "h2",
        "text": "Red flags that a bootcamp certificate might be fake or unverifiable"
      },
      {
        "type": "ul",
        "items": [
          "The only proof offered is a PDF or screenshot with no link to a verifiable record.",
          "A proof page exists, but the status is anything other than Verified.",
          "The credential was issued by a Pending or Suspended issuer rather than an Approved one.",
          "The hash on the proof page does not match the hash of the file you were sent.",
          "Searching the hash returns no on-chain record at all."
        ]
      },
      {
        "type": "h2",
        "text": "Beyond verification: verify, then pay"
      },
      {
        "type": "p",
        "text": "Most credential tools stop at \"Is it real?\". Stellaroid Earn binds verification to payment in a single on-chain flow: once a credential is verified, an employer calls link_payment to send XLM through the native Stellar Asset Contract straight to the graduate's verified wallet, with testnet settlement typically under five seconds and fees a fraction of a cent. Verification is not just a badge here, it is the gate that unlocks getting paid."
      },
      {
        "type": "callout",
        "text": "Honest status: Stellaroid Earn is an early-access pilot running live on Stellar testnet, not a mainnet or production financial product. The verification model and public proof pages work today, so employers and graduates can try the model now, join the pilot to put your own credentials through it."
      }
    ],
    "howToSteps": [
      {
        "name": "Get the certificate's hash or proof link",
        "text": "Ask the graduate or the issuing bootcamp for the credential's public proof link, or its 64-character SHA-256 hash. On Stellaroid Earn the proof link points to a page under /proof, and the hash is what was anchored on-chain."
      },
      {
        "name": "Open the public proof page",
        "text": "Open the proof link, or paste the 64-character hash at stellaroid.tech/proof. No wallet, login, or account is required to read a proof, verification is public and read-only."
      },
      {
        "name": "Read the credential status",
        "text": "Confirm the status badge reads Verified. A credential can be issued, verified, suspended, revoked, or expired; only Verified means an approved issuer or the admin completed on-chain verification."
      },
      {
        "name": "Check the issuer's trust status",
        "text": "Look at the issued-by line and its issuer badge. An Approved issuer was vetted and approved on-chain by the admin; a Pending or Suspended issuer was not, so treat those credentials with caution."
      },
      {
        "name": "Audit the record on stellar.expert",
        "text": "Use the View on-chain events link to open the contract on stellar.expert and confirm the cert_ver verification event plus the record's owner and issuer wallets. Nothing on-chain can be edited after the fact."
      }
    ],
    "howToName": "How to verify a coding bootcamp certificate is real",
    "faq": [
      {
        "question": "How can I verify a coding bootcamp certificate is real?",
        "answer": "Open its public proof page (or paste the 64-character SHA-256 hash at stellaroid.tech/proof), confirm the status badge reads Verified, check that it was issued by an Approved issuer, and audit the on-chain record on stellar.expert. No wallet or login is needed to read a proof."
      },
      {
        "question": "Is a bootcamp certificate legitimate if it is only a PDF?",
        "answer": "A PDF or screenshot proves nothing on its own, it can be copied, edited, or fabricated, and there is rarely an authoritative source to check it against. A credential is verifiable when its SHA-256 hash is anchored on-chain to the issuer and the graduate's wallet, so anyone can confirm it independently."
      },
      {
        "question": "Do I need a wallet or account to check a certificate?",
        "answer": "No. On Stellaroid Earn, verification is public and read-only: anyone can open a proof page and confirm a credential without connecting a wallet or logging in. A wallet is only needed to issue, verify, or pay on-chain."
      },
      {
        "question": "What does Verified mean on a proof page?",
        "answer": "It means an approved issuer or the admin wallet submitted a verify_certificate transaction for that certificate hash, the contract set the status to Verified, and it emitted a cert_ver event that anyone can audit on stellar.expert."
      },
      {
        "question": "How do I spot a fake certificate?",
        "answer": "Be skeptical of a PDF with no verifiable source, a proof page whose status is not Verified, a credential from a Pending or Suspended issuer, or a file whose hash does not match the one on the proof page. A genuine on-chain credential shows a Verified status, an Approved issuer, and a matching hash you can audit on stellar.expert."
      },
      {
        "question": "Is Stellaroid Earn a production credential system?",
        "answer": "Not yet, it is an early-access pilot running live on Stellar testnet, not a mainnet or production financial product. The verification flow and public proof pages are fully functional on testnet, so employers and graduates can try the model today."
      }
    ],
    "primaryCta": {
      "label": "Verify candidate credentials",
      "href": "/verify-candidate-credentials"
    },
    "secondaryCta": {
      "label": "Open a proof page",
      "href": "/proof"
    }
  },
  {
    "slug": "how-employers-verify-credentials",
    "title": "How do employers verify bootcamp credentials?",
    "metaTitle": "How Employers Verify Bootcamp Credentials",
    "metaDescription": "How do employers verify bootcamp credentials? Compare calling schools, background-check vendors, and verification networks with instant on-chain proof.",
    "keywords": [
      "how do employers verify bootcamp credentials",
      "employer credential verification process",
      "verify education background",
      "credential verification vs background check",
      "on-chain vs traditional credential verification",
      "ways employers check education credentials"
    ],
    "audience": "Employers and recruiters",
    "datePublished": "2026-07-09",
    "technical": false,
    "lede": "Recruiters have four imperfect options for confirming a bootcamp grad's credential: call the school, pay a background-check vendor, query a verification network, or take the PDF on faith. On-chain verification adds a faster path, open a public proof page and read the record in seconds.",
    "blocks": [
      {
        "type": "callout",
        "text": "Short answer: employers verify bootcamp credentials by contacting the issuing school, paying a background-check vendor, or querying a verification network like the National Student Clearinghouse, reliable routes that typically cost days or per-candidate fees, and that often don't cover bootcamps at all. On-chain verification adds a faster option, open a public proof page and confirm the record in seconds, with no phone call, vendor, or login."
      },
      {
        "type": "p",
        "text": "A bootcamp certificate is only a claim until someone confirms it. For years, employers have had four practical ways to do that confirmation, and each carries real tradeoffs. This guide lays them out honestly, then shows where instant on-chain verification fits."
      },
      {
        "type": "h2",
        "text": "The traditional ways employers verify credentials"
      },
      {
        "type": "h3",
        "text": "1. Contact the school or bootcamp directly"
      },
      {
        "type": "p",
        "text": "The most common method: email or call the registrar and ask them to confirm the certificate. It is authoritative when it works, but it depends on someone answering, a records team that keeps good archives, and a bootcamp that still exists. Turnaround is often measured in days, and there is no artifact the candidate can reuse for the next application."
      },
      {
        "type": "h3",
        "text": "2. Use a background-check vendor"
      },
      {
        "type": "p",
        "text": "Third-party verification firms will confirm education history as part of a wider screen. They are convenient and thorough, but they typically charge a per-candidate fee and take days to return results. Because bootcamps are newer and more fragmented than universities, some vendors struggle to confirm them at all and fall back to contacting the school anyway."
      },
      {
        "type": "h3",
        "text": "3. Query a verification network"
      },
      {
        "type": "p",
        "text": "Networks like the National Student Clearinghouse centralize degree and enrollment verification for participating institutions in the United States. Where an institution participates, this is fast and reliable. The catch for bootcamp hiring: these networks largely cover degree-granting colleges, so many coding bootcamps and short-course providers are not listed at all."
      },
      {
        "type": "h3",
        "text": "4. Inspect the document itself"
      },
      {
        "type": "p",
        "text": "The fastest traditional option is also the weakest: accept a PDF or screenshot at face value. A certificate file is easy to edit, and a convincing forgery is hard to catch by eye, which is exactly why the other three methods exist."
      },
      {
        "type": "h2",
        "text": "The tradeoffs, side by side"
      },
      {
        "type": "p",
        "text": "Here is how the traditional methods compare with instant on-chain verification across the dimensions that matter to a hiring team."
      },
      {
        "type": "ul",
        "items": [
          "Speed, Phone, email, and vendor checks take days to weeks; a public proof page resolves in seconds.",
          "Cost, Background-check vendors charge a per-candidate fee; opening a Stellaroid Earn proof page is free and needs no account.",
          "Coverage, Verification networks mainly cover degree-granting institutions, so many bootcamps aren't listed; any issuer approved on-chain can anchor a credential.",
          "Trust source, Traditional checks trust a person replying to an email; on-chain checks trust a cryptographic hash plus an approved issuer's recorded signature.",
          "Auditability, A vendor report is a private PDF; a cert_ver event is public, and anyone can re-check it on stellar.expert.",
          "Tamper-resistance, An emailed certificate can be edited; a certificate's SHA-256 hash is bound on-chain and duplicate hashes are rejected by register_certificate."
        ]
      },
      {
        "type": "h2",
        "text": "How instant on-chain verification works"
      },
      {
        "type": "p",
        "text": "Stellaroid Earn anchors a certificate's SHA-256 hash to the graduate's Stellar wallet. An approved issuer or admin calls verify_certificate, which sets the credential's status to Verified and emits a cert_ver event. For an employer, checking that proof is a read-only action, the five-step checklist at the end of this guide takes under a minute and needs no wallet."
      },
      {
        "type": "h2",
        "text": "Credential verification vs background check"
      },
      {
        "type": "p",
        "text": "These terms get used interchangeably, but they are not the same. Credential verification answers a narrow question: is this specific certificate authentic and issued by who it claims? A background check is broader, identity, employment history, and, depending on the role and jurisdiction, criminal records, and is usually performed by a licensed provider under strict compliance rules. On-chain verification is a fast, auditable way to settle the credential-authenticity question; it complements a background check rather than replacing it."
      },
      {
        "type": "h2",
        "text": "What on-chain proof does and doesn't replace"
      },
      {
        "type": "p",
        "text": "On-chain proof confirms that a specific credential was issued and verified by an approved issuer, and it makes that fact independently auditable. It does not run a criminal-records search, confirm past employment, or satisfy a regulated screening requirement on its own. Treat it as a fast credential-authenticity layer that sits alongside the rest of your hiring process."
      },
      {
        "type": "callout",
        "text": "Stellaroid Earn is an early-access pilot on Stellar testnet. The verification flow, proof pages, and contract functions described here are live and auditable, but this is a pilot demo, not a production or regulated background-check service."
      },
      {
        "type": "p",
        "text": "Want to try it against a real credential? Open a candidate's proof page, or start with the employer overview to see the full verify-then-pay flow."
      }
    ],
    "howToSteps": [
      {
        "name": "Get the certificate hash or proof link",
        "text": "Ask the candidate for their credential's proof link or its 64-character SHA-256 hash. That is all you need to look it up, and it is safe to share publicly."
      },
      {
        "name": "Open the public proof page",
        "text": "Paste the hash on the Stellaroid Earn proof page. No wallet, login, or account is required, verification is read-only and public."
      },
      {
        "name": "Confirm status and issuer",
        "text": "Check that the credential status reads Verified and that it was issued by an approved issuer. The proof page shows the issuer's on-chain trust status alongside the record."
      },
      {
        "name": "Audit the event on-chain (optional)",
        "text": "For independent confirmation, open the contract on stellar.expert and find the cert_ver event for that hash. The proof does not depend on trusting Stellaroid Earn."
      },
      {
        "name": "Pay the graduate directly (optional)",
        "text": "If you decide to hire, connect a Stellar wallet and call link_payment to send XLM straight to the verified wallet. Testnet settlement is typically under five seconds."
      }
    ],
    "howToName": "How employers verify bootcamp credentials",
    "faq": [
      {
        "question": "How do employers verify bootcamp credentials?",
        "answer": "Traditionally, employers confirm a bootcamp credential by contacting the issuing school, hiring a background-check vendor, or querying a verification network such as the National Student Clearinghouse, methods that are accurate but can take days. Stellaroid Earn adds an instant option: the credential's SHA-256 hash is anchored on Stellar by an approved issuer, so anyone can open its public proof page and confirm the record in seconds without a wallet or login."
      },
      {
        "question": "What is the difference between credential verification and a background check?",
        "answer": "Credential verification confirms that one specific credential, like a bootcamp certificate, is authentic and was issued by the stated institution. A background check is broader and usually run by a third party, covering identity, employment history, and, depending on the role, criminal records. On-chain verification on Stellaroid Earn addresses the credential-authenticity part; it is not a full background check and does not replace one."
      },
      {
        "question": "Does an employer need an account or wallet to verify a credential?",
        "answer": "No. Verification on Stellaroid Earn is public and read-only, so anyone can open a proof page and confirm a credential's on-chain status without connecting a wallet or logging in. A Stellar wallet is only needed to issue, verify, or pay on-chain."
      },
      {
        "question": "How long does on-chain credential verification take?",
        "answer": "Opening a proof page returns the credential's status immediately. The underlying trusted verification, an approved issuer or admin calling verify_certificate, settles on Stellar testnet in seconds, and the resulting cert_ver event is instantly auditable on stellar.expert."
      },
      {
        "question": "Can a bootcamp certificate be forged or duplicated on-chain?",
        "answer": "The certificate's SHA-256 hash is bound to a graduate's wallet by register_certificate, and duplicate hashes are rejected on-chain, so the same credential cannot be re-registered by someone else. Only an approved issuer or the admin wallet can move a credential to Verified status, which is what employers look for on the proof page."
      },
      {
        "question": "Is Stellaroid Earn a background-check service employers can rely on today?",
        "answer": "Stellaroid Earn is an early-access pilot running on Stellar testnet. Its verification flow, public proof pages, and contract functions are live and auditable, but it is a pilot demo focused on credential authenticity, not a production or regulated background-check service."
      }
    ],
    "primaryCta": {
      "label": "Verify a candidate now",
      "href": "/verify-candidate-credentials"
    },
    "secondaryCta": {
      "label": "For employers",
      "href": "/employer"
    }
  },
  {
    "slug": "anchor-certificate-hash-stellar-soroban",
    "title": "How to anchor a certificate SHA-256 hash on Stellar with Soroban",
    "metaTitle": "Anchor a Certificate Hash on Stellar with Soroban",
    "metaDescription": "Learn how to anchor a certificate SHA-256 hash on Stellar with Soroban: register, verify, then pay a graduate on-chain, all auditable on stellar.expert.",
    "keywords": [
      "anchor a certificate SHA-256 hash on Stellar with Soroban",
      "soroban smart contract credential",
      "store hash on stellar",
      "stellar dApp tutorial",
      "register_certificate",
      "verify_certificate",
      "link_payment",
      "soroban credential verification tutorial"
    ],
    "audience": "Developers and technical issuers",
    "datePublished": "2026-07-09",
    "technical": true,
    "lede": "A developer walkthrough of how Stellaroid Earn binds a certificate's SHA-256 hash to a Stellar wallet with a Soroban smart contract: register_certificate to anchor it, verify_certificate to trust it, and link_payment to pay the graduate, every step auditable on stellar.expert.",
    "blocks": [
      {
        "type": "p",
        "text": "This guide walks through how Stellaroid Earn anchors a certificate's SHA-256 hash on Stellar using a Soroban smart contract, and how the same short flow turns a verified credential into an instant on-chain payout. Every function named here maps to a real call in the deployed testnet contract."
      },
      {
        "type": "callout",
        "text": "Stellaroid Earn is an early-access pilot running entirely on Stellar testnet with test XLM. It is not a mainnet or production financial product. The sub-five-second settlement and fraction-of-a-cent fees referenced below are real testnet characteristics."
      },
      {
        "type": "h2",
        "text": "Why the hash goes on-chain, not the document"
      },
      {
        "type": "p",
        "text": "You never put the certificate PDF on-chain. Instead you store its SHA-256 hash, a 32-byte fingerprint written as 64 hexadecimal characters. That single digest is enough to prove a document is the exact one that was registered, without ever exposing the document itself."
      },
      {
        "type": "ul",
        "items": [
          "Deterministic: hashing the same file always yields the same 64-character digest, so a document can be re-checked against the on-chain record at any time.",
          "One-way: the digest reveals nothing about the document's contents, so private certificate data stays off-chain.",
          "Tamper-evident: change a single byte of the file and the hash changes completely, breaking the match.",
          "Cheap and small: a fixed 32 bytes fits on-chain regardless of how large the original document is."
        ]
      },
      {
        "type": "p",
        "text": "This is also how the contract enforces uniqueness. Because the hash is the credential's on-chain key, registering the same hash twice is rejected, a credential cannot be silently overwritten."
      },
      {
        "type": "h2",
        "text": "The contract surface: three writes do the work"
      },
      {
        "type": "p",
        "text": "Stellaroid's contract exposes nineteen public functions, but the credential lifecycle rests on three writes. register_certificate anchors the hash to a student's wallet. verify_certificate marks it trusted. link_payment pays the verified wallet. Along the way a credential moves through explicit statuses: issued, verified, suspended, revoked, and expired."
      },
      {
        "type": "code",
        "lang": "rust",
        "text": "// Illustrative signatures showing the shape of the flow.\n// The contract crate on GitHub is the canonical source.\n// cert_hash is the 32-byte SHA-256 digest; amount is an i128 (stroops).\n\npub fn register_certificate(\n    env: Env,\n    issuer: Address,\n    student: Address,\n    cert_hash: BytesN<32>,\n    title: String,\n    cohort: String,\n    metadata_uri: String,\n) -> Result<(), Error>;   // stores the record, emits `cert_reg`, rejects duplicates\n\npub fn verify_certificate(\n    env: Env,\n    verifier: Address,       // must be an approved issuer or the admin\n    cert_hash: BytesN<32>,\n) -> Result<(), Error>;   // sets status = Verified, emits `cert_ver`\n\npub fn link_payment(\n    env: Env,\n    employer: Address,\n    student: Address,\n    cert_hash: BytesN<32>,   // must resolve to a Verified credential\n    amount: i128,\n) -> Result<(), Error>;   // transfers XLM via the native SAC, emits `payment`"
      },
      {
        "type": "callout",
        "text": "The signatures above are illustrative, they show the argument shape, not the exact source. Read the contract crate on GitHub for the authoritative definitions and the tests that cover the full flow."
      },
      {
        "type": "h3",
        "text": "Step 1, Hash the certificate"
      },
      {
        "type": "p",
        "text": "Compute the SHA-256 digest of the document on your own machine. The file itself never leaves your side; only the 64-character hex string is sent on-chain."
      },
      {
        "type": "code",
        "lang": "bash",
        "text": "# Hash the certificate locally, the file never leaves your machine.\n# Linux:\nsha256sum diploma.pdf\n# macOS:\nshasum -a 256 diploma.pdf\n# -> 9f2c8b...e41d   (64 hex characters = the 32-byte digest that goes on-chain)"
      },
      {
        "type": "p",
        "text": "Stellaroid's web app does exactly the same thing in the browser with the Web Crypto API, so a school can drop in a PDF and the digest is computed client-side before anything is signed."
      },
      {
        "type": "code",
        "lang": "javascript",
        "text": "// The browser computes the same digest with Web Crypto,\n// so only the 32-byte hash, never the document, is sent on-chain.\nconst bytes = new Uint8Array(await file.arrayBuffer());\nconst digest = await crypto.subtle.digest(\"SHA-256\", bytes);\nconst hash = [...new Uint8Array(digest)]\n  .map((b) => b.toString(16).padStart(2, \"0\"))\n  .join(\"\"); // 64 hex chars"
      },
      {
        "type": "h3",
        "text": "Step 2, Anchor it with register_certificate"
      },
      {
        "type": "p",
        "text": "As an approved issuer, sign a register_certificate call that binds the hash to the student's Stellar wallet along with minimal proof metadata. The contract stores the record and emits a cert_reg event."
      },
      {
        "type": "code",
        "lang": "bash",
        "text": "stellar contract invoke \\\n  --id \"$CONTRACT_ID\" \\\n  --source issuer-key \\\n  --network testnet \\\n  -- \\\n  register_certificate \\\n  --issuer \"$ISSUER_ADDRESS\" \\\n  --student \"$STUDENT_ADDRESS\" \\\n  --cert_hash 9f2c8b...e41d \\\n  --title \"Full-Stack Web3 Bootcamp\" \\\n  --cohort \"2026-Q2\" \\\n  --metadata_uri \"ipfs://bafy.../proof.json\""
      },
      {
        "type": "callout",
        "text": "Duplicate hashes are rejected on-chain: a second register_certificate for the same hash fails with AlreadyExists (error #4), so a credential can never be silently overwritten."
      },
      {
        "type": "h3",
        "text": "Step 3, Verify, then pay"
      },
      {
        "type": "p",
        "text": "verify_certificate can only be called by an approved issuer or the admin wallet, an arbitrary wallet is rejected with Unauthorized (error #3), while a registered-but-unapproved issuer fails with IssuerNotApproved (#8) and a suspended issuer with IssuerSuspended (#9). A successful call flips the credential's status to Verified and emits a cert_ver event. Only then does payment unlock, link_payment transfers XLM through the native Stellar Asset Contract straight to the student's verified wallet, emits a payment event, and on testnet settles in typically under five seconds for a fraction of a cent."
      },
      {
        "type": "code",
        "lang": "bash",
        "text": "# 2, an approved issuer or the admin verifies the credential\nstellar contract invoke --id \"$CONTRACT_ID\" --source approved-issuer-key --network testnet \\\n  -- verify_certificate \\\n  --verifier \"$VERIFIER_ADDRESS\" \\\n  --cert_hash 9f2c8b...e41d\n\n# 3, once Verified, the employer pays the wallet directly\nstellar contract invoke --id \"$CONTRACT_ID\" --source employer-key --network testnet \\\n  -- link_payment \\\n  --employer \"$EMPLOYER_ADDRESS\" \\\n  --student \"$STUDENT_ADDRESS\" \\\n  --cert_hash 9f2c8b...e41d \\\n  --amount 1000000000        # stroops (100 XLM); the native SAC uses 7-decimal i128 amounts"
      },
      {
        "type": "h2",
        "text": "Audit every step on stellar.expert"
      },
      {
        "type": "p",
        "text": "Reads are public and require no signing. You can query the record directly, or simply open the contract's event stream in a browser, no wallet, no login."
      },
      {
        "type": "code",
        "lang": "bash",
        "text": "# Public read (simulation only, no signing, no fee)\nstellar contract invoke --id \"$CONTRACT_ID\" --source any-key --network testnet \\\n  -- get_certificate --cert_hash 9f2c8b...e41d\n\n# Or open the contract's event stream in a browser:\n# https://stellar.expert/explorer/testnet/contract/$CONTRACT_ID"
      },
      {
        "type": "p",
        "text": "In the explorer you can trace the credential's whole life:"
      },
      {
        "type": "ul",
        "items": [
          "The cert_reg event, emitted when register_certificate anchors the hash.",
          "The cert_ver event, emitted when an approved issuer or the admin verifies it.",
          "The payment event, emitted when link_payment sends XLM to the student's wallet.",
          "The full transaction history, every write is a public Stellar transaction anyone can inspect."
        ]
      },
      {
        "type": "h2",
        "text": "Wire it into a dApp"
      },
      {
        "type": "p",
        "text": "In the browser, Stellaroid builds these calls with @stellar/stellar-sdk. Read-only calls like get_certificate run through simulateTransaction using a public read address, no signing needed, which is why proof pages resolve a hash without a wallet. Writes are signed with Freighter or Albedo and submitted over Soroban RPC. Wallet components are marked \"use client\" because the wallet APIs are browser-only."
      },
      {
        "type": "p",
        "text": "Ready to try it end to end? Open the Stellaroid app to hash a file and sign register_certificate against the live testnet contract, or clone the repository to read the contract crate and run its tests."
      }
    ],
    "howToSteps": [
      {
        "name": "Hash the certificate",
        "text": "Compute the document's SHA-256 digest with sha256sum (Linux), shasum -a 256 (macOS), or the Web Crypto API in the browser. The result is 64 hex characters; the document itself never goes on-chain."
      },
      {
        "name": "Anchor it with register_certificate",
        "text": "As an approved issuer, sign a register_certificate call that binds the hash to the student's Stellar wallet along with its title and cohort. The contract stores the record, emits a cert_reg event, and rejects any duplicate hash."
      },
      {
        "name": "Verify with verify_certificate",
        "text": "An approved issuer or the admin wallet calls verify_certificate with the hash. The contract sets the credential's status to Verified and emits a cert_ver event that anyone can audit."
      },
      {
        "name": "Pay with link_payment",
        "text": "Once the credential is Verified, the employer calls link_payment to send XLM through the native Stellar Asset Contract straight to the student's wallet. Testnet settlement is typically under five seconds."
      },
      {
        "name": "Audit on stellar.expert",
        "text": "Open the contract on stellar.expert and inspect its event stream to confirm the cert_reg, cert_ver, and payment events. Reads are public, so no wallet is required."
      }
    ],
    "howToName": "How to anchor a certificate SHA-256 hash on Stellar with Soroban",
    "faq": [
      {
        "question": "Why anchor a hash instead of the certificate itself?",
        "answer": "Only the SHA-256 digest goes on-chain, never the document. The 32-byte hash is a tamper-evident fingerprint: re-hashing the same file always produces the same value, so anyone can confirm a document matches the on-chain record while the file itself stays private and off-chain."
      },
      {
        "question": "Which Soroban function anchors the hash?",
        "answer": "register_certificate binds a certificate's SHA-256 hash to a student's Stellar wallet along with minimal metadata (title, cohort, and a metadata URI) and emits a cert_reg event. Duplicate hashes are rejected on-chain with an AlreadyExists error, so the same credential cannot be registered twice."
      },
      {
        "question": "How do I compute the SHA-256 hash?",
        "answer": "On the command line run sha256sum file.pdf on Linux, or shasum -a 256 file.pdf on macOS. Stellaroid's web app does the same in the browser using the Web Crypto API, so only the 64-character hex digest is ever sent on-chain."
      },
      {
        "question": "How can anyone audit the anchored hash?",
        "answer": "Every write is a public Stellar transaction. Open the contract on stellar.expert and inspect its events, cert_reg from registration, cert_ver from verification, and payment from payout, without a wallet or login."
      },
      {
        "question": "Do you need a wallet to read a credential?",
        "answer": "No. Reads such as get_certificate are read-only and public, so Stellaroid's proof pages resolve a hash without any wallet or login. A wallet is only needed to sign the write transactions: registering, verifying, or paying."
      },
      {
        "question": "Is this running on Stellar mainnet?",
        "answer": "No. Stellaroid Earn is an early-access pilot running entirely on Stellar testnet with test XLM. Settlement is typically under five seconds for a fraction of a cent in network fees, but it is not a production or regulated financial product."
      }
    ],
    "primaryCta": {
      "label": "Try the app",
      "href": "/app"
    },
    "secondaryCta": {
      "label": "View the contract on GitHub",
      "href": "https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn"
    }
  }
];

export function getGuide(slug: string): GuideArticle | undefined {
  return guides.find((g) => g.slug === slug);
}
