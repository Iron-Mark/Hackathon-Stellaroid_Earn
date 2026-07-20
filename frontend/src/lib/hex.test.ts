import { test } from "node:test";
import assert from "node:assert/strict";
import { bytesToHex, isHex64 } from "./hex.ts";

test("bytesToHex encodes all byte values with zero-padding", () => {
  assert.equal(bytesToHex(new Uint8Array([0x00, 0x0f, 0x10, 0xff])), "000f10ff");
  assert.equal(bytesToHex(new Uint8Array([])), "");
});

test("bytesToHex round-trips a 32-byte hash", () => {
  const hex = "c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3";
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  assert.equal(bytesToHex(bytes), hex);
  assert.ok(isHex64(bytesToHex(bytes)));
});

test("bytesToHex output survives high-bit bytes (the normalizeString failure mode)", () => {
  // Bytes >0x7f are exactly what UTF-8 string coercion mangles into
  // replacement chars; the hex encoder must handle them losslessly.
  const bytes = new Uint8Array([0x80, 0x9f, 0xc3, 0xfe]);
  assert.equal(bytesToHex(bytes), "809fc3fe");
});

test("isHex64 accepts 64-hex and rejects everything else", () => {
  assert.ok(isHex64("a".repeat(64)));
  assert.ok(isHex64("A".repeat(64)));
  assert.ok(!isHex64("a".repeat(63)));
  assert.ok(!isHex64("g".repeat(64)));
  assert.ok(!isHex64(""));
});
