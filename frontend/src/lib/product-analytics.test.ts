import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProofActionProperties,
  proofHashShape,
  proofStatusProperty,
} from "./product-analytics.ts";

const SAMPLE_HASH =
  "c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3";

test("proof analytics properties avoid raw proof identifiers", () => {
  const props = buildProofActionProperties({
    hash: SAMPLE_HASH,
    status: "verified",
    source: "proof_page",
  });

  assert.equal(props.proof_hash_shape, "sha256_hex");
  assert.equal(props.proof_status, "verified");
  assert.equal(JSON.stringify(props).includes(SAMPLE_HASH), false);
});

test("proof hash shape reports malformed inputs without storing the value", () => {
  assert.equal(proofHashShape("not-a-proof"), "invalid");
  assert.equal(proofHashShape(""), "missing");
});

test("proof status analytics uses neutral unknown fallback", () => {
  assert.equal(proofStatusProperty(null), "unknown");
  assert.equal(proofStatusProperty(undefined), "unknown");
  assert.equal(proofStatusProperty("issued"), "issued");
});
