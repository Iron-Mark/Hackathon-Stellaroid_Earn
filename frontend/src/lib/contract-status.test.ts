import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeCertificateStatus,
  normalizeIssuerStatus,
  normalizeOpportunityStatus,
  normalizeStatusKey,
  overlayExpiredCertificateStatus,
} from "./contract-status.ts";

// The regression this module exists to prevent: scValToNative returns a unit
// enum as ["Verified"], and Object.keys(["Verified"]) is ["0"]. The old
// client normalizer fell into the object branch and returned "0", mapping a
// verified credential to "issued".
test("normalizeStatusKey handles the array wire shape (the drift bug)", () => {
  assert.equal(normalizeStatusKey(["Verified"]), "verified");
  assert.equal(normalizeStatusKey(["Revoked"]), "revoked");
});

test("normalizeStatusKey handles all wire shapes", () => {
  assert.equal(normalizeStatusKey("Verified"), "verified");
  assert.equal(normalizeStatusKey("verified"), "verified");
  assert.equal(normalizeStatusKey(["Verified"]), "verified");
  assert.equal(normalizeStatusKey({ Verified: null }), "verified");
  assert.equal(normalizeStatusKey({ tag: "Verified" }), "verified");
  assert.equal(normalizeStatusKey(1), "1");
  assert.equal(normalizeStatusKey(null), "");
  assert.equal(normalizeStatusKey([]), "");
});

test("certificate status maps correctly from every shape", () => {
  for (const shape of ["Verified", ["Verified"], { Verified: null }]) {
    assert.equal(
      normalizeCertificateStatus(shape),
      "verified",
      `shape: ${JSON.stringify(shape)}`,
    );
  }
  assert.equal(normalizeCertificateStatus(["Revoked"]), "revoked");
  assert.equal(normalizeCertificateStatus(["Suspended"]), "suspended");
  assert.equal(normalizeCertificateStatus(["Expired"]), "expired");
  assert.equal(normalizeCertificateStatus(["Issued"]), "issued");
  assert.equal(normalizeCertificateStatus("Issued"), "issued");
  assert.equal(normalizeCertificateStatus(["Nonsense"]), "unknown");
});

test("issuer status maps correctly from the array shape", () => {
  assert.equal(normalizeIssuerStatus(["Approved"]), "approved");
  assert.equal(normalizeIssuerStatus(["Suspended"]), "suspended");
  assert.equal(normalizeIssuerStatus(["Pending"]), "pending");
  assert.equal(normalizeIssuerStatus({ Approved: null }), "approved");
});

test("opportunity status maps correctly from the array shape", () => {
  assert.equal(normalizeOpportunityStatus(["Funded"]), "funded");
  assert.equal(normalizeOpportunityStatus(["InProgress"]), "in_progress");
  assert.equal(normalizeOpportunityStatus(["Released"]), "released");
  assert.equal(normalizeOpportunityStatus(["Refunded"]), "refunded");
  assert.equal(normalizeOpportunityStatus(["Draft"]), "draft");
});

test("overlayExpiredCertificateStatus treats a past window as expired", () => {
  assert.equal(
    overlayExpiredCertificateStatus("verified", 1_700_000_000, 1_700_000_100),
    "expired",
  );
  assert.equal(
    overlayExpiredCertificateStatus("issued", 1_700_000_000, 1_700_000_100),
    "expired",
  );
  assert.equal(
    overlayExpiredCertificateStatus("revoked", 1_700_000_000, 1_700_000_100),
    "revoked",
  );
  assert.equal(
    overlayExpiredCertificateStatus("suspended", 1_700_000_000, 1_700_000_100),
    "suspended",
  );
  assert.equal(
    overlayExpiredCertificateStatus("verified", 0, 1_700_000_100),
    "verified",
  );
  assert.equal(
    overlayExpiredCertificateStatus("verified", 1_700_000_200, 1_700_000_100),
    "verified",
  );
});
