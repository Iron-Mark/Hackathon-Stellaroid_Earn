import assert from "node:assert/strict";
import test from "node:test";
import { buildProofVerificationBreakdown } from "./proof-verification.ts";
import type { IssuerRecord } from "./types.ts";

const hash = "c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3";
const cert = {
  owner: "GOWNER000000000000000000000000000000000000000000000000000000",
  issuer: "GISSUER0000000000000000000000000000000000000000000000000000",
  status: "verified" as const,
};
const issuer: IssuerRecord = {
  address: cert.issuer,
  name: "Stellar PH Bootcamp",
  website: "https://stellaroid.tech/issuer/stellar-ph",
  category: "Bootcamp",
  status: "approved",
};

test("proof verification breakdown marks verified approved issuers as employer-ready", () => {
  const breakdown = buildProofVerificationBreakdown({ hash, cert, issuer });

  assert.equal(breakdown.decision, "ready_for_paid_trial_review");
  assert.equal(breakdown.blockers.length, 0);
  assert.equal(breakdown.issuerTrust.status, "approved");
  assert.equal(
    breakdown.checks.every((check) => check.status === "pass"),
    true,
  );
});

test("proof verification breakdown blocks funding when issuer evidence is missing", () => {
  const breakdown = buildProofVerificationBreakdown({
    hash,
    cert,
    issuer: null,
    issuerLookupFailed: true,
  });

  assert.equal(breakdown.decision, "inspect_only");
  assert.equal(breakdown.issuerTrust.status, "lookup_failed");
  assert.match(breakdown.warnings.join("\n"), /Issuer registry/);
});

test("proof verification breakdown blocks invalid proof hashes before contract trust", () => {
  const breakdown = buildProofVerificationBreakdown({
    hash: "not-a-hash",
    cert,
    issuer,
  });

  assert.equal(breakdown.decision, "inspect_only");
  assert.match(breakdown.blockers.join("\n"), /Hash anchor/);
});
