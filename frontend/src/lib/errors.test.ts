import assert from "node:assert/strict";
import test from "node:test";
import { humanizeError, isMissingContractMethod } from "./errors.ts";

test("humanizeError maps InvalidExpiry before the generic invalid catch", () => {
  const mapped = humanizeError("HostError: Error(Contract, #18)");
  assert.equal(mapped.title, "Invalid expiry");
  assert.match(mapped.detail, /future validity date/i);

  const byName = humanizeError("Error(Contract, InvalidExpiry)");
  assert.equal(byName.title, "Invalid expiry");
});

test("isMissingContractMethod detects a live WASM host miss", () => {
  assert.equal(
    isMissingContractMethod("HostError: Error(Wasm, InvalidAction)"),
    true,
  );
  assert.equal(isMissingContractMethod("function not found"), true);
  assert.equal(isMissingContractMethod("Error(Contract, #18)"), false);
});
