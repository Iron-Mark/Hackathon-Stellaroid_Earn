import assert from "node:assert/strict";
import test from "node:test";
import { dateInputToUnixSeconds, formatUnixDate, parseAmountToInt } from "./format.ts";

test("parseAmountToInt scales valid unsigned decimal input exactly", () => {
  assert.equal(parseAmountToInt("100", 2), 10000n);
  assert.equal(parseAmountToInt("0.01", 2), 1n);
  assert.equal(parseAmountToInt("1.2345678", 7), 12345678n);
});

test("parseAmountToInt rejects malformed or ambiguous decimal input", () => {
  for (const amount of ["", "0", "-0.1", "1.2.3", "1.-1", "1,000", "1abc"]) {
    assert.throws(
      () => parseAmountToInt(amount, 7),
      /amount|decimal|greater than zero/i,
    );
  }
});

test("formatUnixDate uses UTC calendar dates and Not set for zero", () => {
  assert.equal(formatUnixDate(0), "Not set");
  assert.equal(formatUnixDate(-1), "Not set");
  assert.equal(formatUnixDate(1_700_000_000), "14 Nov 2023");
});

test("dateInputToUnixSeconds encodes UTC end of day", () => {
  assert.equal(dateInputToUnixSeconds(""), 0);
  assert.equal(dateInputToUnixSeconds("not-a-date"), 0);
  assert.equal(dateInputToUnixSeconds("2026-08-25"), Date.UTC(2026, 7, 25, 23, 59, 59) / 1000);
});

