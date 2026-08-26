import assert from "node:assert/strict";
import test from "node:test";
import {
  applyChainLookups,
  BATCH_TEMPLATE_CSV,
  buildBatchAnalyticsProperties,
  buildSigningQueue,
  hashesNeedingLookup,
  isAlreadyExistsError,
  isRowReady,
  isSigningDeclined,
  isValidGraduateAddress,
  mapWithConcurrency,
  MAX_BATCH_ROWS,
  normalizeBatchHash,
  parseBatchCsv,
  parseCsvRecords,
  summarizeBatch,
} from "./batch-issuance.ts";

const GRAD_A = "GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D";
const GRAD_B = `G${"B".repeat(55)}`;
const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const HASH_C = "c".repeat(64);

test("isValidGraduateAddress accepts a 56-character G address", () => {
  assert.equal(isValidGraduateAddress(GRAD_A), true);
  assert.equal(isValidGraduateAddress(GRAD_A.toLowerCase()), false);
  assert.equal(isValidGraduateAddress("GSHORT"), false);
  assert.equal(isValidGraduateAddress("M" + GRAD_A.slice(1)), false);
});

test("normalizeBatchHash strips 0x and whitespace", () => {
  assert.equal(normalizeBatchHash(`0x${HASH_A.toUpperCase()}`), HASH_A);
  assert.equal(normalizeBatchHash(`${HASH_A.slice(0, 32)} ${HASH_A.slice(32)}`), HASH_A);
});

test("parseCsvRecords keeps quoted commas", () => {
  const { records, error } = parseCsvRecords(
    'graduate,title\nGABC,"Bootcamp, Cohort 1"\n',
  );
  assert.equal(error, undefined);
  assert.deepEqual(records[1], ["GABC", "Bootcamp, Cohort 1"]);
});

test("parseCsvRecords reports an unclosed quote", () => {
  const { error } = parseCsvRecords('graduate,hash\n"oops,bare\n');
  assert.match(error ?? "", /unclosed quote/i);
});

test("parseBatchCsv reads the committed template", () => {
  const parsed = parseBatchCsv(BATCH_TEMPLATE_CSV);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].graduate, GRAD_A);
  assert.equal(parsed.rows[0].certHash, HASH_A);
  assert.equal(parsed.rows[0].title, "Stellar PH Bootcamp Completion");
  assert.deepEqual(parsed.rows[0].issues, []);
  assert.equal(isRowReady(parsed.rows[0]), true);
});

test("parseBatchCsv accepts student and cert_hash aliases plus a BOM", () => {
  const csv = `\uFEFFstudent,cert_hash,name,batch,uri\n${GRAD_B},${HASH_B},Credential,2026-Q2,https://example.test\n`;
  const parsed = parseBatchCsv(csv);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.rows[0].graduate, GRAD_B);
  assert.equal(parsed.rows[0].certHash, HASH_B);
  assert.equal(parsed.rows[0].title, "Credential");
  assert.equal(parsed.rows[0].cohort, "2026-Q2");
  assert.equal(parsed.rows[0].metadataUri, "https://example.test");
});

test("parseBatchCsv accepts semicolon-delimited Excel exports", () => {
  const csv = `graduate;hash;title\n${GRAD_A};${HASH_A};Excel row\n`;
  const parsed = parseBatchCsv(csv);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.rows[0].title, "Excel row");
  assert.deepEqual(parsed.rows[0].issues, []);
});

test("parseBatchCsv flags invalid wallets, hashes, and later duplicate hashes", () => {
  const csv = [
    "graduate,hash,title",
    `${GRAD_A},${HASH_A},First`,
    `not-a-wallet,${HASH_B},Bad wallet`,
    `${GRAD_B},zzzz,Bad hash`,
    `${GRAD_B},${HASH_A},Duplicate hash`,
    `${GRAD_A},0x${HASH_C.toUpperCase()},Prefixed`,
  ].join("\n");
  const parsed = parseBatchCsv(csv);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.deepEqual(parsed.rows[0].issues, []);
  assert.equal(parsed.rows[1].issues.includes("invalid_graduate"), true);
  assert.equal(parsed.rows[2].issues.includes("invalid_hash"), true);
  assert.equal(parsed.rows[3].issues.includes("duplicate_in_file"), true);
  assert.deepEqual(parsed.rows[4].issues, []);
  assert.equal(parsed.rows[4].certHash, HASH_C);
  const summary = summarizeBatch(parsed.rows);
  assert.equal(summary.total, 5);
  assert.equal(summary.ready, 2);
  assert.equal(summary.duplicateInFile, 1);
  assert.equal(summary.blocked, 3);
});

test("parseBatchCsv truncates past the pilot row cap", () => {
  const rows = Array.from({ length: MAX_BATCH_ROWS + 2 }, (_, i) => {
    const hash = i.toString(16).padStart(64, "0");
    return `${GRAD_A},${hash},Row ${i + 1}`;
  });
  const parsed = parseBatchCsv(["graduate,hash,title", ...rows].join("\n"));
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.truncated, true);
  assert.equal(parsed.rawCount, MAX_BATCH_ROWS + 2);
  assert.equal(parsed.rows.length, MAX_BATCH_ROWS);
});

test("parseBatchCsv rejects a missing hash column", () => {
  const parsed = parseBatchCsv(`graduate,title\n${GRAD_A},Hello\n`);
  assert.equal(parsed.ok, false);
  if (parsed.ok) return;
  assert.match(parsed.error, /hash column/i);
});

test("chain lookups mark existing hashes without changing in-file issues", () => {
  const parsed = parseBatchCsv(
    `graduate,hash\n${GRAD_A},${HASH_A}\n${GRAD_B},${HASH_B}\n`,
  );
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.deepEqual(hashesNeedingLookup(parsed.rows), [HASH_A, HASH_B]);
  const withChain = applyChainLookups(parsed.rows, {
    [HASH_A]: "exists",
    [HASH_B]: "free",
  });
  assert.equal(withChain[0].chain, "exists");
  assert.equal(isRowReady(withChain[0]), false);
  assert.equal(withChain[1].chain, "free");
  assert.equal(isRowReady(withChain[1]), true);
  const queue = buildSigningQueue(withChain);
  assert.equal(queue[0].queueStatus, "skipped");
  assert.equal(queue[1].queueStatus, "ready");
});

test("isAlreadyExistsError uses a word boundary so #14 does not match", () => {
  assert.equal(isAlreadyExistsError("HostError: Error(Contract, #4)"), true);
  assert.equal(isAlreadyExistsError("A certificate with that hash is already registered."), true);
  assert.equal(isAlreadyExistsError("HostError: Error(Contract, #14)"), false);
});

test("isSigningDeclined detects a wallet cancel", () => {
  assert.equal(isSigningDeclined(new Error("User declined access")), true);
  assert.equal(isSigningDeclined("TIMEOUT: register_certificate"), false);
});

test("mapWithConcurrency preserves order", async () => {
  const values = [3, 1, 2];
  const result = await mapWithConcurrency(values, 2, async (value) => {
    await new Promise((resolve) => setTimeout(resolve, value));
    return value * 10;
  });
  assert.deepEqual(result, [30, 10, 20]);
});

test("batch analytics properties never include wallets or hashes", () => {
  const props = buildBatchAnalyticsProperties({
    rowCount: 5,
    readyCount: 2,
    blockedCount: 3,
    truncated: true,
  });
  const serialized = JSON.stringify(props);
  assert.equal(serialized.includes(GRAD_A), false);
  assert.equal(serialized.includes(HASH_A), false);
  assert.equal(props.row_count, 5);
  assert.equal(props.ready_count, 2);
  assert.equal(props.truncated, true);
});
