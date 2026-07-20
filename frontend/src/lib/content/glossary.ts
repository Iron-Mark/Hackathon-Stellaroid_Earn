// Glossary hub content, definitions are deliberately 1-2 sentences so
// answer engines can lift them verbatim (DefinedTermSet schema).
import type { GlossaryContent } from "./types";

export const glossaryContent: GlossaryContent = {
  "slug": "/glossary",
  "metaTitle": "Verifiable Credentials Glossary",
  "metaDescription": "A verifiable credentials glossary with plain-English definitions of on-chain certificates, credential anchoring, SHA-256 hashes, issuers, and Stellar proof.",
  "keywords": [
    "verifiable credentials glossary",
    "what is a verifiable credential",
    "what is an on-chain certificate",
    "how does blockchain credential verification work",
    "credential anchoring",
    "SHA-256 hash",
    "Soroban",
    "Stellar Asset Contract",
    "cert_ver event",
    "on-chain credential verification"
  ],
  "eyebrow": "Reference / Glossary",
  "h1": "Verifiable credentials glossary",
  "lede": "Plain-English definitions for on-chain credential verification, from verifiable credential to credential anchoring to the cert_ver event. Each entry is written to be quotable by people and answer engines alike, and grounded in how Stellaroid Earn actually works on Stellar testnet.",
  "sections": [
    {
      "heading": "What \"verifiable credential\" means here",
      "paragraphs": [
        "A verifiable credential is a claim about a person, a diploma, a course completion, a certification, that a third party can confirm on their own, without emailing the issuer and waiting days for a reply. The confidence comes from a tamper-evident record rather than a PDF that can be quietly edited or forged.",
        "Stellaroid Earn puts that record on Stellar. An issuer anchors a certificate's SHA-256 hash to the graduate's wallet, an approved issuer or the admin verifies it on-chain, and the result is readable on a public proof page. This glossary defines the vocabulary that flow uses, one term at a time, so the same words mean the same thing to a graduate, a recruiter, and an answer engine."
      ]
    },
    {
      "heading": "One flow, from hash to payment",
      "paragraphs": [
        "Most of the terms below map onto three on-chain actions. Understanding the sequence makes each definition click, because the words describe steps rather than abstractions.",
        "Everything runs on Stellar testnet as an early-access pilot, and every step emits an event that is auditable on stellar.expert. Verification is public and read-only, so anyone can confirm a credential without a wallet or login; a wallet is only needed to issue, verify, or pay."
      ],
      "bullets": [
        "Anchor, register_certificate binds a document's SHA-256 hash to a graduate's wallet and rejects duplicate hashes on-chain.",
        "Verify, an approved issuer or the admin calls verify_certificate; the status becomes Verified and a cert_ver event is emitted.",
        "Pay, link_payment transfers XLM through the native Stellar Asset Contract to the verified wallet, typically settling in under five seconds."
      ]
    }
  ],
  "terms": [
    {
      "term": "Verifiable credential",
      "definition": "A digital claim about a person, such as a diploma or course completion, whose authenticity anyone can check against a tamper-evident record instead of contacting the issuer by email. On Stellaroid Earn, that record is an entry on Stellar."
    },
    {
      "term": "On-chain certificate",
      "definition": "A credential whose SHA-256 hash is bound to a recipient's Stellar wallet by an issuer using register_certificate. Because the proof lives on-chain, it can be confirmed in seconds and duplicate hashes are rejected."
    },
    {
      "term": "Credential anchoring",
      "definition": "The act of writing a document's fingerprint (its hash) to a blockchain so its existence and ownership can later be proven. Stellaroid Earn anchors the SHA-256 hash, never the document itself."
    },
    {
      "term": "SHA-256 hash",
      "definition": "A one-way function that turns any file into a fixed 64-character hexadecimal fingerprint. The same file always produces the same hash, and any change produces a completely different one, so the hash proves a document without revealing it."
    },
    {
      "term": "Issuer",
      "definition": "The school, bootcamp, or institution that registers and verifies a credential. Issuers self-register on-chain with register_issuer and must be approved by the admin before they can issue or verify."
    },
    {
      "term": "Trust registry",
      "definition": "The on-chain list of issuers and their status, pending, approved, or suspended. It answers \"should I trust this issuer?\", so a verified credential is only as strong as the approved issuer behind it."
    },
    {
      "term": "Soroban",
      "definition": "Stellar's smart-contract platform, where contracts are written in Rust. Stellaroid Earn's credential and payment logic runs as a Soroban contract deployed on Stellar testnet."
    },
    {
      "term": "Stellar Asset Contract (SAC)",
      "definition": "The built-in Soroban interface for moving native assets like XLM inside a contract call. Stellaroid Earn's link_payment uses the native SAC to send XLM straight to a verified wallet."
    },
    {
      "term": "XLM (Lumens)",
      "definition": "Stellar's native asset. In Stellaroid Earn it is the token an employer sends to a verified graduate; on testnet it is a valueless test token, not real money."
    },
    {
      "term": "Proof page",
      "definition": "The public, read-only page for a single credential hash. It shows the credential's on-chain status, the issuer's trust status, and any attached evidence, and needs no wallet or login to open."
    },
    {
      "term": "Credential status",
      "definition": "The lifecycle state a credential carries: issued, verified, suspended, revoked, or expired. The status controls what is allowed, for example, payment only unlocks once a credential is verified."
    },
    {
      "term": "Verification",
      "definition": "The trusted step where an approved issuer or the admin calls verify_certificate, moving a credential from issued to verified and emitting a cert_ver event. It is distinct from the public lookup anyone can perform without a wallet."
    },
    {
      "term": "Revocation",
      "definition": "Permanently invalidating a credential via revoke_certificate. The record stays visible on-chain for auditability, but a revoked credential can no longer unlock payment."
    },
    {
      "term": "Suspension",
      "definition": "Temporarily pausing a credential without deleting its history. A suspended credential is not valid for verification-based actions until an issuer or admin restores its status."
    },
    {
      "term": "cert_ver event",
      "definition": "The on-chain event emitted when a credential is verified. Because Stellar indexes events, anyone can audit the verification on a block explorer such as stellar.expert."
    },
    {
      "term": "Testnet",
      "definition": "Stellar's free, public test network that behaves like the main network but uses valueless test tokens. Stellaroid Earn runs entirely on testnet as an early-access pilot, not as a production financial product."
    },
    {
      "term": "Freighter",
      "definition": "A browser-extension wallet for Stellar. Stellaroid Earn uses it to sign issue, verify, and payment transactions on desktop."
    },
    {
      "term": "Albedo",
      "definition": "A web-based Stellar wallet from the StellarExpert team that signs transactions in a popup, giving Stellaroid Earn a mobile-friendly signing path alongside Freighter."
    }
  ],
  "faq": [
    {
      "question": "What is a verifiable credential?",
      "answer": "A verifiable credential is a digital claim about a person, such as a diploma or course completion, that anyone can confirm independently against a tamper-evident record, instead of emailing the issuing institution and waiting for a reply. On Stellaroid Earn, that record is an entry on Stellar: an issuer binds the certificate's SHA-256 hash to the graduate's wallet, and the proof is verifiable in seconds."
    },
    {
      "question": "What is an on-chain certificate?",
      "answer": "An on-chain certificate is a credential whose SHA-256 hash is written to a blockchain and bound to the recipient's wallet. On Stellaroid Earn an issuer creates it by calling register_certificate, which rejects duplicate hashes, so the certificate's existence, owner, and issuer can be checked publicly without trusting a single private database."
    },
    {
      "question": "How does blockchain credential verification work?",
      "answer": "An issuer computes a document's SHA-256 hash and anchors it to the recipient's Stellar wallet with register_certificate. An approved issuer or the admin then calls verify_certificate, which sets the credential's status to Verified and emits a cert_ver event. Anyone can confirm the result on a public proof page or on stellar.expert, no wallet or login required."
    },
    {
      "question": "Do I need a wallet or login to verify a credential?",
      "answer": "No. Verification is public and read-only, so you can open any proof page and check a credential's on-chain status and issuer trust without connecting a wallet or creating an account. A wallet is only needed to issue, verify, or pay on-chain."
    },
    {
      "question": "Is the document itself stored on the blockchain?",
      "answer": "No. Only the document's SHA-256 hash, a 64-character fingerprint, is anchored on-chain, never the file. Because the same document always produces the same hash, a holder can prove a certificate matches the on-chain record without publishing the certificate's contents."
    },
    {
      "question": "What is the difference between verified, suspended, and revoked?",
      "answer": "Verified means an approved issuer or the admin has confirmed the credential on-chain, which unlocks payment. Suspended is a temporary pause that preserves the record's history but blocks verification-based actions until the status is restored. Revoked permanently invalidates the credential; it stays visible for auditability but can no longer unlock payment."
    }
  ],
  "primaryCta": {
    "label": "Read the guides",
    "href": "/guides"
  },
  "secondaryCta": {
    "label": "See a live proof",
    "href": "/proof"
  }
};
