import assert from "node:assert/strict";
import test from "node:test";
import { buildEmployerVerificationExport, proofExportFilename } from "./proof-export.ts";
import type { CertificateRecord } from "./contract-read-server.ts";
import type { IssuerRecord, ProofMetadata } from "./types.ts";

const SAMPLE_HASH =
  "c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3";

const cert: CertificateRecord = {
  owner: "GOWNER000000000000000000000000000000000000000000000000000000",
  issuer: "GISSUER0000000000000000000000000000000000000000000000000000",
  title: "Stellar Smart Contract Bootcamp Completion",
  cohort: "Stellar PH Bootcamp 2026",
  metadataUri: "ipfs://example",
  status: "verified",
  issuedAt: 1_767_657_600,
  verifiedAt: 1_767_744_000,
  expiresAt: 0,
  verified: true,
};

const issuer: IssuerRecord = {
  address: cert.issuer,
  name: "Stellar PH Bootcamp",
  website: "https://stellaroid.tech/issuer/stellar-ph",
  category: "Bootcamp",
  status: "approved",
};

const proofMetadata: ProofMetadata = {
  title: cert.title,
  description: "Completed the Stellar smart contract bootcamp.",
  cohort: cert.cohort,
  criteria: "Built and deployed a Soroban testnet project.",
  skills: ["Soroban", "Stellar", "Freighter"],
  evidence: [{ label: "Demo", href: "/proof/demo" }],
};

test("proof export filename uses a stable hash prefix", () => {
  assert.equal(
    proofExportFilename(SAMPLE_HASH),
    "stellaroid-proof-c02ce1602d5b-summary.json",
  );
});

test("employer export includes an explicit unsigned standards preview", () => {
  const payload = buildEmployerVerificationExport({
    hash: SAMPLE_HASH,
    cert,
    issuer,
    proofMetadata,
  });

  assert.equal(payload.standardsAlignment.status, "unsigned_preview");
  assert.equal(payload.employerReview.decision, "ready_for_paid_trial_review");
  assert.equal(payload.employerReview.candidateWallet, cert.owner);
  assert.deepEqual(
    payload.employerReview.path.map((step) => step.title),
    ["Confirm proof", "Match wallet", "Fund escrow"],
  );
  assert.match(payload.standardsAlignment.warning, /not a signed Verifiable Credential/);
  assert.equal(payload.standardsAlignment.roleModel.issuer.name, issuer.name);
  assert.equal(payload.standardsAlignment.roleModel.holder.wallet, cert.owner);
  assert.deepEqual(payload.standardsAlignment.w3cVerifiableCredential2Preview.type, [
    "VerifiableCredential",
    "StellaroidCredentialProof",
  ]);
  assert.equal(
    payload.standardsAlignment.openBadges3Preview.credentialSubject.achievement.name,
    cert.title,
  );
  assert.ok(
    payload.recruiterChecklist.includes(
      "Read standardsAlignment.warning before treating this export as a standards credential.",
    ),
  );
});
