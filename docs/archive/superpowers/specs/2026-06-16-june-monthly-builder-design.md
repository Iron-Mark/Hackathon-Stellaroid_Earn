# June Monthly Builder Design

## Goal

Improve Stellaroid Earn as a proof-loop-first product without expanding into mainnet, NFT, marketplace, or new backend scope.

## Research Inputs

- W3C Verifiable Credentials 2.0 keeps the model centered on issuer, holder, and verifier roles.
- 1EdTech Open Badges 3.0 aligns badge credentials with Verifiable Credentials conventions.
- Stellar RPC `simulateTransaction` remains appropriate for read-only contract checks and bounded proof lookups.
- Credential platforms such as Credly and Accredible emphasize issuer management, proof sharing, verification, analytics, and employer-friendly summaries.
- WCAG 2.2 and the local UI/UX checklist prioritize visible focus, target size, readable hierarchy, no color-only state, and role-clear navigation.

## Design

### Public Entry

The landing page should stop presenting the product as a generic dApp first. It should route visitors by job:

- Issue credentials as a bootcamp, school, or training provider.
- Verify a credential as a recruiter, reviewer, or public verifier.
- Hire or fund a paid trial as an employer.

The top navigation should match that model and drop low-priority generic links from the primary nav.

### Proof Trust Artifact

The proof page already renders a recruiter-safe summary export. Add a standards-alignment preview to that export so employers and future issuers can see how a record maps toward W3C VC 2.0 and Open Badges 3.0 without falsely claiming a signed standards credential exists today.

This preview must be explicit that it is unsigned and non-conformant until issuer signing, holder consent, and a proper VC/Open Badges envelope exist.

### UX Polish

Remove inline style-heavy proof lookup layout and make it consistent with the tokenized Tailwind app styling. Keep walletless proof lookup, server-rendered proof pages, and current ISR/cache behavior unchanged.

## Non-Goals

- No new database, auth system, or event ingester.
- No mainnet payment claims.
- No signed W3C VC or Open Badges credential issuance.
- No changes to the existing Soroban contract.
