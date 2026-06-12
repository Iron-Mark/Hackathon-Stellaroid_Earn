import assert from "node:assert/strict";
import test from "node:test";
import { signRequest } from "./pdax-sign.ts";

test("signRequest returns the base64 HMAC-SHA256 of the canonical request", () => {
  const secret = "test_pdax_secret";
  const method = "post";
  const path = "/v1/crypto/out/dry-run";
  const body = JSON.stringify({
    asset: "XLM",
    amount: "25.5000000",
    address: "GCFXWBUR7H2M6P4LLQQY4M72PY3UQNQ5C3YV2SGH3VNKYZW3WTHX6Z2Q",
    network: "stellar-testnet",
  });
  const timestamp = "2026-01-15T08:30:00.000Z";
  const expected = "sYyGkPKA//A66yP/Vborh63MLIRKAJvd8LYOlAatQrA=";

  assert.equal(signRequest(secret, method, path, body, timestamp), expected);
});
