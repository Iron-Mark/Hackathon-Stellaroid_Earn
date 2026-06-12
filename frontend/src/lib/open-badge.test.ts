import assert from "node:assert/strict";
import test from "node:test";
import { buildOpenBadgeCredential } from "./open-badge.ts";

const HASH = "a".repeat(64);
const OWNER = "GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D";
const ISSUER = "GBAKLRUJEOZGWKSHJFFWJ4DINXQZEJBT7JQTR5T4GATQU2SNO4ZFHZQ4";

const baseInput = {
  hash: HASH,
  baseUrl: "https://stellaroid.example",
  network: "testnet" as const,
  cert: {
    owner: OWNER,
    issuer: ISSUER,
    title: "Stellar Smart Contract Bootcamp Completion",
    cohort: "Stellar PH Bootcamp 2026",
    metadataUri: "",
    status: "verified" as const,
    issuedAt: 1767168000,
    verifiedAt: 1767168100,
    expiresAt: 0,
    verified: true,
  },
  metadata: {
    title: "Stellar Smart Contract Bootcamp Completion",
    description: "Awarded after shipping a working Soroban contract.",
    cohort: "Stellar PH Bootcamp 2026",
    criteria: "Complete the assigned Soroban contract and deploy to testnet.",
    skills: ["Soroban smart contracts", "Stellar testnet deployment"],
    evidence: [{ label: "About the demo", href: "/about" }],
  },
  issuerInfo: {
    name: "Stellar Philippines UniTour",
    category: "bootcamp" as const,
    url: "https://stellaroid.tech",
  },
};

test("golden shape for demo data", () => {
  const vc = buildOpenBadgeCredential(baseInput);

  assert.deepEqual(vc["@context"], [
    "https://www.w3.org/ns/credentials/v2",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
  ]);
  assert.deepEqual(vc.type, ["VerifiableCredential", "OpenBadgeCredential"]);
  assert.equal(
    vc.id,
    `https://stellaroid.example/proof/${HASH}/credential.json`,
  );
  assert.equal(vc.issuer.id, `https://stellaroid.example/issuer#${ISSUER}`);
  assert.equal(vc.issuer.type, "Profile");
  assert.equal(vc.issuer.name, "Stellar Philippines UniTour");
  assert.equal(vc.issuer.url, "https://stellaroid.tech");
  assert.equal(vc.validFrom, "2025-12-31T08:00:00.000Z");
  assert.equal(vc.credentialSubject.type[0], "AchievementSubject");
  assert.equal(vc.credentialSubject.identifier[0].identityHash, HASH);
  assert.equal(
    vc.credentialSubject.achievement.name,
    "Stellar Smart Contract Bootcamp Completion",
  );
  assert.equal(
    vc.credentialSubject.achievement.criteria?.narrative,
    "Complete the assigned Soroban contract and deploy to testnet.",
  );
  assert.deepEqual(vc.credentialSubject.achievement.tag, [
    "Soroban smart contracts",
    "Stellar testnet deployment",
  ]);
  assert.equal(vc["https://stellaroid.tech/ns#network"], "testnet");
  assert.ok(!("proof" in vc), "v1 omits the proof block (roadmap: eddsa cryptosuite)");
});

test("required fields survive null metadata and issuerInfo", () => {
  const vc = buildOpenBadgeCredential({
    ...baseInput,
    metadata: null,
    issuerInfo: null,
  });

  assert.ok(vc.issuer.id.length > 0);
  assert.equal(vc.issuer.name, ISSUER);
  assert.equal(
    vc.credentialSubject.achievement.name,
    "Stellar Smart Contract Bootcamp Completion",
  );
  assert.equal(vc.credentialSubject.achievement.criteria, undefined);
  assert.deepEqual(vc.credentialSubject.achievement.tag, []);
});

test("expiresAt of zero omits validUntil; non-zero maps to ISO", () => {
  const noExpiry = buildOpenBadgeCredential(baseInput);
  assert.ok(!("validUntil" in noExpiry));

  const withExpiry = buildOpenBadgeCredential({
    ...baseInput,
    cert: { ...baseInput.cert, expiresAt: 1798704000 },
  });
  assert.equal(withExpiry.validUntil, "2026-12-31T08:00:00.000Z");
});

test("cert title falls back when metadata title is missing", () => {
  const vc = buildOpenBadgeCredential({
    ...baseInput,
    cert: { ...baseInput.cert, title: "" },
    metadata: null,
  });
  assert.equal(vc.credentialSubject.achievement.name, "On-chain credential");
});
