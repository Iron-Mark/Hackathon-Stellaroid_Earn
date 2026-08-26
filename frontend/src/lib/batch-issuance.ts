import { isHex64 } from "./hex.ts";

/** Pilot-sized cap: each ready row is one Freighter signature on live v3.0.0. */
export const MAX_BATCH_ROWS = 25;
export const MAX_CSV_CHARS = 200_000;
export const CHAIN_LOOKUP_CONCURRENCY = 4;

export const BATCH_CSV_HEADERS = [
  "graduate",
  "hash",
  "title",
  "cohort",
  "metadata_uri",
] as const;

const GRADUATE_KEYS = new Set([
  "graduate",
  "student",
  "wallet",
  "address",
  "owner",
  "g_address",
]);
const HASH_KEYS = new Set([
  "hash",
  "cert_hash",
  "certificate_hash",
  "sha256",
  "digest",
]);
const TITLE_KEYS = new Set(["title", "name", "credential"]);
const COHORT_KEYS = new Set(["cohort", "batch", "class"]);
const METADATA_KEYS = new Set([
  "metadata_uri",
  "metadata",
  "uri",
  "metadatauri",
]);

export const BATCH_TEMPLATE_CSV = `${BATCH_CSV_HEADERS.join(",")}
GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D,aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,Stellar PH Bootcamp Completion,2026-Q3,https://stellaroid.tech
`;

export type BatchRowIssue =
  | "missing_graduate"
  | "invalid_graduate"
  | "missing_hash"
  | "invalid_hash"
  | "duplicate_in_file";

export type ChainLookup = "unchecked" | "free" | "exists" | "failed";

export type QueueStatus =
  | "blocked"
  | "ready"
  | "signing"
  | "submitted"
  | "skipped"
  | "error"
  | "stopped";

export type BatchRow = {
  id: string;
  sourceLine: number;
  graduate: string;
  certHash: string;
  title: string;
  cohort: string;
  metadataUri: string;
  issues: BatchRowIssue[];
  chain: ChainLookup;
};

export type QueueItem = BatchRow & {
  queueStatus: QueueStatus;
  queueDetail?: string;
  txHash?: string;
};

export type ParseBatchSuccess = {
  ok: true;
  rows: BatchRow[];
  truncated: boolean;
  rawCount: number;
};

export type ParseBatchFailure = {
  ok: false;
  error: string;
};

export type ParseBatchResult = ParseBatchSuccess | ParseBatchFailure;

export type BatchSummary = {
  total: number;
  ready: number;
  blocked: number;
  duplicateInFile: number;
  onChain: number;
  lookupFailed: number;
};

const ISSUE_COPY: Record<BatchRowIssue, string> = {
  missing_graduate: "Graduate wallet is missing",
  invalid_graduate: "Graduate wallet must be a 56-character G address",
  missing_hash: "Certificate hash is missing",
  invalid_hash: "Hash must be 64 hexadecimal characters",
  duplicate_in_file: "Same hash appears earlier in this CSV",
};

export function isValidGraduateAddress(addr: string): boolean {
  const trimmed = addr.trim();
  return /^G[A-Z0-9]{55}$/.test(trimmed);
}

export function normalizeBatchHash(raw: string): string {
  return raw.trim().replace(/^0x/i, "").replace(/\s+/g, "").toLowerCase();
}

export function describeIssues(row: Pick<BatchRow, "issues" | "chain">): string {
  const parts = row.issues.map((issue) => ISSUE_COPY[issue]);
  if (row.chain === "exists") parts.push("Already on-chain");
  if (row.chain === "failed") parts.push("On-chain lookup failed");
  return parts.join(". ");
}

export function parseCsvRecords(
  text: string,
  delimiter: "," | ";" = ",",
): { records: string[][]; error?: string } {
  const input = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const records: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === delimiter) {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\n") {
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) records.push(row);
      row = [];
      continue;
    }
    field += char;
  }

  if (inQuotes) {
    return { records: [], error: "CSV has an unclosed quote." };
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) records.push(row);
  return { records };
}

function detectDelimiter(headerLine: string): "," | ";" {
  let commas = 0;
  let semis = 0;
  let inQuotes = false;
  for (let i = 0; i < headerLine.length; i++) {
    const char = headerLine[i];
    if (char === '"') {
      if (inQuotes && headerLine[i + 1] === '"') {
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (inQuotes) continue;
    if (char === ",") commas += 1;
    if (char === ";") semis += 1;
  }
  return semis > commas ? ";" : ",";
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function pickColumn(headers: string[], keys: Set<string>): number {
  return headers.findIndex((header) => keys.has(header));
}

function cell(record: string[], index: number): string {
  if (index < 0) return "";
  return (record[index] ?? "").trim();
}

function validateRowFields(input: {
  sourceLine: number;
  graduateRaw: string;
  hashRaw: string;
  title: string;
  cohort: string;
  metadataUri: string;
}): BatchRow {
  const issues: BatchRowIssue[] = [];
  const graduate = input.graduateRaw.trim().toUpperCase();
  const certHash = normalizeBatchHash(input.hashRaw);

  if (!graduate) issues.push("missing_graduate");
  else if (!isValidGraduateAddress(graduate)) issues.push("invalid_graduate");

  if (!certHash) issues.push("missing_hash");
  else if (!isHex64(certHash)) issues.push("invalid_hash");

  return {
    id: `row-${input.sourceLine}`,
    sourceLine: input.sourceLine,
    graduate,
    certHash,
    title: input.title.trim(),
    cohort: input.cohort.trim(),
    metadataUri: input.metadataUri.trim(),
    issues,
    chain: "unchecked",
  };
}

function markInFileDuplicates(rows: BatchRow[]): BatchRow[] {
  const firstLineByHash = new Map<string, number>();
  return rows.map((row) => {
    if (
      !row.certHash ||
      row.issues.includes("invalid_hash") ||
      row.issues.includes("missing_hash")
    ) {
      return row;
    }
    const first = firstLineByHash.get(row.certHash);
    if (first === undefined) {
      firstLineByHash.set(row.certHash, row.sourceLine);
      return row;
    }
    if (row.issues.includes("duplicate_in_file")) return row;
    return { ...row, issues: [...row.issues, "duplicate_in_file"] };
  });
}

export function parseBatchCsv(text: string): ParseBatchResult {
  if (text.length > MAX_CSV_CHARS) {
    return {
      ok: false,
      error: "CSV is too large to parse in the browser. Split the cohort and try again.",
    };
  }

  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    return { ok: false, error: "CSV is empty." };
  }

  const firstLine = trimmed.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = detectDelimiter(firstLine);
  const parsed = parseCsvRecords(text, delimiter);
  if (parsed.error) {
    return { ok: false, error: parsed.error };
  }
  if (parsed.records.length === 0) {
    return { ok: false, error: "CSV is empty." };
  }

  const headers = parsed.records[0].map(normalizeHeader);
  const graduateIndex = pickColumn(headers, GRADUATE_KEYS);
  const hashIndex = pickColumn(headers, HASH_KEYS);
  if (graduateIndex < 0 || hashIndex < 0) {
    return {
      ok: false,
      error:
        "CSV needs a graduate wallet column (graduate or student) and a hash column (hash or cert_hash).",
    };
  }

  const titleIndex = pickColumn(headers, TITLE_KEYS);
  const cohortIndex = pickColumn(headers, COHORT_KEYS);
  const metadataIndex = pickColumn(headers, METADATA_KEYS);

  const dataRecords = parsed.records.slice(1);
  const rawCount = dataRecords.length;
  if (rawCount === 0) {
    return { ok: false, error: "CSV has a header but no data rows." };
  }

  const truncated = rawCount > MAX_BATCH_ROWS;
  const limited = dataRecords.slice(0, MAX_BATCH_ROWS);
  const rows = markInFileDuplicates(
    limited.map((record, index) =>
      validateRowFields({
        sourceLine: index + 2,
        graduateRaw: cell(record, graduateIndex),
        hashRaw: cell(record, hashIndex),
        title: cell(record, titleIndex),
        cohort: cell(record, cohortIndex),
        metadataUri: cell(record, metadataIndex),
      }),
    ),
  );

  return { ok: true, rows, truncated, rawCount };
}

export function hashesNeedingLookup(rows: BatchRow[]): string[] {
  const seen = new Set<string>();
  const hashes: string[] = [];
  for (const row of rows) {
    if (
      !row.certHash ||
      row.issues.includes("invalid_hash") ||
      row.issues.includes("missing_hash")
    ) {
      continue;
    }
    if (seen.has(row.certHash)) continue;
    seen.add(row.certHash);
    hashes.push(row.certHash);
  }
  return hashes;
}

export function applyChainLookups(
  rows: BatchRow[],
  report: Record<string, Exclude<ChainLookup, "unchecked">>,
): BatchRow[] {
  return rows.map((row) => {
    if (
      !row.certHash ||
      row.issues.includes("invalid_hash") ||
      row.issues.includes("missing_hash")
    ) {
      return { ...row, chain: "unchecked" };
    }
    return { ...row, chain: report[row.certHash] ?? "unchecked" };
  });
}

export function isRowReady(row: BatchRow): boolean {
  return row.issues.length === 0 && row.chain !== "exists";
}

export function buildSigningQueue(rows: BatchRow[]): QueueItem[] {
  return rows.map((row) => {
    if (row.chain === "exists") {
      return {
        ...row,
        queueStatus: "skipped",
        queueDetail: "Already on-chain",
      };
    }
    if (row.issues.length > 0) {
      return {
        ...row,
        queueStatus: "blocked",
        queueDetail: describeIssues(row),
      };
    }
    return { ...row, queueStatus: "ready" };
  });
}

export function summarizeBatch(rows: BatchRow[]): BatchSummary {
  let ready = 0;
  let blocked = 0;
  let duplicateInFile = 0;
  let onChain = 0;
  let lookupFailed = 0;
  for (const row of rows) {
    if (row.issues.includes("duplicate_in_file")) duplicateInFile += 1;
    if (row.chain === "exists") onChain += 1;
    if (row.chain === "failed") lookupFailed += 1;
    if (isRowReady(row)) ready += 1;
    else blocked += 1;
  }
  return {
    total: rows.length,
    ready,
    blocked,
    duplicateInFile,
    onChain,
    lookupFailed,
  };
}

export function summarizeQueue(items: QueueItem[]): {
  ready: number;
  submitted: number;
  skipped: number;
  error: number;
  blocked: number;
  stopped: number;
} {
  const counts = {
    ready: 0,
    submitted: 0,
    skipped: 0,
    error: 0,
    blocked: 0,
    stopped: 0,
  };
  for (const item of items) {
    if (item.queueStatus === "ready" || item.queueStatus === "signing") {
      counts.ready += 1;
    } else if (item.queueStatus in counts) {
      counts[item.queueStatus] += 1;
    }
  }
  return counts;
}

export function isAlreadyExistsError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /#4\b|already exists|already registered/i.test(message);
}

export function isSigningDeclined(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /user rejected|declined|denied/i.test(message);
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let next = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));

  async function worker() {
    while (true) {
      const index = next;
      next += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

export function buildBatchAnalyticsProperties(input: {
  rowCount: number;
  readyCount: number;
  blockedCount?: number;
  submittedCount?: number;
  skippedCount?: number;
  errorCount?: number;
  truncated?: boolean;
  stopped?: boolean;
}) {
  return {
    row_count: input.rowCount,
    ready_count: input.readyCount,
    blocked_count: input.blockedCount ?? 0,
    submitted_count: input.submittedCount ?? 0,
    skipped_count: input.skippedCount ?? 0,
    error_count: input.errorCount ?? 0,
    truncated: Boolean(input.truncated),
    stopped: Boolean(input.stopped),
  };
}
