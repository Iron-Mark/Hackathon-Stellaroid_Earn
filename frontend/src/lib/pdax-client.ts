import {
  PDAX_FIXTURE_BALANCES,
  PDAX_FIXTURE_CRYPTO_OUT_DRY_RUN,
  PDAX_FIXTURE_TICKERS,
  PDAX_FIXTURE_TRANSACTIONS,
} from "./pdax-fixtures.ts";
import { signRequest } from "./pdax-sign.ts";
import { withTimeout } from "./with-timeout.ts";

if (typeof window !== "undefined") {
  throw new Error("PDAX client is server-only and must not be imported in a client bundle");
}

export type PdaxMode = "mock" | "staging" | "production";

export type PdaxBalance = {
  currency: string;
  available: string;
  hold: string;
  total: string;
  updatedAt: string;
};

export type PdaxTicker = {
  pair: string;
  bid: string;
  ask: string;
  last: string;
  volume24h: string;
  quoteVolume24h: string;
  timestamp: string;
};

export type PdaxTransaction = {
  id: string;
  type: string;
  asset: string;
  amount: string;
  fee: string;
  status: string;
  referenceId: string;
  txHash: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PdaxCryptoOutDryRunParams = {
  asset: string;
  amount: string;
  address: string;
  network: string;
};

export type PdaxCryptoOutDryRun = PdaxCryptoOutDryRunParams & {
  fee: string;
  totalDebit: string;
  estimatedArrival: string;
  referenceId: string;
  warnings: string[];
};

type PdaxRequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  query?: Record<string, string>;
};

export class PdaxClientError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "PdaxClientError";
    this.status = status;
  }
}

export async function getBalances(): Promise<PdaxBalance[]> {
  if (getPdaxMode() === "mock") {
    return [...PDAX_FIXTURE_BALANCES];
  }

  return pdaxRequest<PdaxBalance[]>("/v1/balances");
}

export async function getTicker(pair: string): Promise<PdaxTicker> {
  if (getPdaxMode() === "mock") {
    const ticker = PDAX_FIXTURE_TICKERS[pair as keyof typeof PDAX_FIXTURE_TICKERS];
    if (!ticker) {
      throw new PdaxClientError(`PDAX mock ticker fixture not found for ${pair}`);
    }
    return { ...ticker };
  }

  return pdaxRequest<PdaxTicker>("/v1/ticker", { query: { pair } });
}

export async function getTransactions(): Promise<PdaxTransaction[]> {
  if (getPdaxMode() === "mock") {
    return [...PDAX_FIXTURE_TRANSACTIONS];
  }

  return pdaxRequest<PdaxTransaction[]>("/v1/transactions");
}

export async function cryptoOutDryRun(
  params: PdaxCryptoOutDryRunParams,
): Promise<PdaxCryptoOutDryRun> {
  if (getPdaxMode() === "mock") {
    return {
      ...params,
      fee: PDAX_FIXTURE_CRYPTO_OUT_DRY_RUN.fee,
      totalDebit: addFixed7(params.amount, PDAX_FIXTURE_CRYPTO_OUT_DRY_RUN.fee),
      estimatedArrival: PDAX_FIXTURE_CRYPTO_OUT_DRY_RUN.estimatedArrival,
      referenceId: PDAX_FIXTURE_CRYPTO_OUT_DRY_RUN.referenceId,
      warnings: [...PDAX_FIXTURE_CRYPTO_OUT_DRY_RUN.warnings],
    };
  }

  return pdaxRequest<PdaxCryptoOutDryRun>("/v1/crypto/out/dry-run", {
    method: "POST",
    body: params,
  });
}

function getPdaxMode(): PdaxMode {
  const mode = process.env.PDAX_MODE?.toLowerCase() ?? "mock";

  if (mode === "mock" || mode === "staging" || mode === "production") {
    return mode;
  }

  throw new PdaxClientError(`Unsupported PDAX_MODE: ${process.env.PDAX_MODE}`);
}

async function pdaxRequest<T>(path: string, options: PdaxRequestOptions = {}): Promise<T> {
  const { baseUrl, accessKey, secret } = getPdaxCredentials();
  const method = options.method ?? "GET";
  const body = options.body === undefined ? "" : JSON.stringify(options.body);
  const requestPath = buildPath(path, options.query);
  const timestamp = new Date().toISOString();
  const url = new URL(requestPath, baseUrl);

  const headers = new Headers({
    "Access-Key": accessKey,
    "Access-Signature": signRequest(secret, method, requestPath, body, timestamp),
    "Access-Timestamp": timestamp,
    Accept: "application/json",
  });

  if (body) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await withTimeout(
      fetch(url, {
        method,
        headers,
        body: body || undefined,
      }),
      5000,
      `PDAX ${method} ${requestPath}`,
    );

    return parsePdaxResponse<T>(response);
  } catch (error) {
    if (error instanceof PdaxClientError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new PdaxClientError(`PDAX request failed: ${message}`);
  }
}

function getPdaxCredentials() {
  const mode = getPdaxMode();
  const baseUrl = process.env.PDAX_BASE_URL;
  const accessKey = process.env.PDAX_ACCESS_KEY;
  const secret = process.env.PDAX_SECRET;

  if (mode === "mock") {
    throw new PdaxClientError("PDAX mock mode must not request credentials");
  }

  if (!baseUrl) {
    throw new PdaxClientError("PDAX_BASE_URL is required for PDAX staging or production mode");
  }

  if (!accessKey || !secret) {
    throw new PdaxClientError("PDAX_ACCESS_KEY and PDAX_SECRET are required for PDAX staging or production mode");
  }

  return { baseUrl, accessKey, secret };
}

async function parsePdaxResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const detail = typeof payload === "string" ? payload : JSON.stringify(payload);
    throw new PdaxClientError(`PDAX request failed with ${response.status}: ${detail}`, response.status);
  }

  if (isDataEnvelope(payload)) {
    return payload.data as T;
  }

  return payload as T;
}

function isDataEnvelope(value: unknown): value is { data: unknown } {
  return typeof value === "object" && value !== null && "data" in value;
}

function buildPath(path: string, query?: Record<string, string>): string {
  if (!query || Object.keys(query).length === 0) {
    return path;
  }

  const search = new URLSearchParams(query);
  return `${path}?${search.toString()}`;
}

function addFixed7(left: string, right: string): string {
  const scale = 10_000_000n;
  const total = parseFixed7(left) + parseFixed7(right);
  const whole = total / scale;
  const fraction = (total % scale).toString().padStart(7, "0");

  return `${whole}.${fraction}`;
}

function parseFixed7(value: string): bigint {
  const [whole = "0", fraction = ""] = value.split(".");
  return BigInt(whole) * 10_000_000n + BigInt(fraction.padEnd(7, "0").slice(0, 7));
}
