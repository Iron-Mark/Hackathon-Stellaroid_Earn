import { rpc } from "@stellar/stellar-sdk";
import { appConfig } from "./config.ts";
import { withTimeout } from "./with-timeout.ts";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_PIN_MS = 60_000;
const DEFAULT_BACKOFF_MS = 250;
const DEFAULT_MAX_BACKOFF_MS = 4_000;

export type RpcProviderConfig = {
  name: string;
  url: string;
};

export type RpcProvider = RpcProviderConfig & {
  index: number;
};

export type ActiveRpcProvider = RpcProvider & {
  pinnedUntil: number | null;
  pinned: boolean;
};

type RpcRouterOptions<TServer> = {
  providers?: RpcProviderConfig[];
  serverFactory?: (provider: RpcProvider) => TServer;
  timeoutMs?: number;
  pinMs?: number;
  baseBackoffMs?: number;
  maxBackoffMs?: number;
  jitter?: () => number;
  now?: () => number;
};

type RoutedFetchInit = RequestInit & {
  next?: { revalidate?: number };
};

export class RpcHttpError extends Error {
  readonly status: number;

  constructor(status: number, provider: RpcProvider) {
    super(`RPC ${provider.name} failed with HTTP ${status}.`);
    this.name = "RpcHttpError";
    this.status = status;
  }
}

export class RpcJsonRpcError extends Error {
  readonly status?: number | string;
  readonly code?: number | string;

  constructor(error: { code?: number | string; message?: string }) {
    super(error.message ?? `RPC JSON-RPC error ${error.code ?? "unknown"}.`);
    this.name = "RpcJsonRpcError";
    this.status = error.code;
    this.code = error.code;
  }
}

function normalizeRpcProvider(
  value: unknown,
  index: number,
): RpcProviderConfig | null {
  if (typeof value === "string") {
    const entry = value.trim();
    if (!entry) return null;
    const named = /^([^=|]+)[=|](.+)$/.exec(entry);
    if (named) {
      const name = named[1].trim();
      const url = named[2].trim();
      return url ? { name: name || `rpc-${index + 1}`, url } : null;
    }
    return { name: index === 0 ? "primary" : `rpc-${index + 1}`, url: entry };
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const url = typeof record.url === "string" ? record.url.trim() : "";
    if (!url) return null;
    const name =
      typeof record.name === "string" && record.name.trim()
        ? record.name.trim()
        : index === 0
          ? "primary"
          : `rpc-${index + 1}`;
    return { name, url };
  }

  return null;
}

function parseRpcProviderEnv(value: string | undefined): unknown[] {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Fall through to comma/newline-delimited parsing.
  }
  return value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function resolveRpcProviders({
  providerEnv,
  fallbackUrl,
}: {
  providerEnv?: string;
  fallbackUrl: string;
}): RpcProviderConfig[] {
  const providers = parseRpcProviderEnv(providerEnv)
    .map(normalizeRpcProvider)
    .filter((provider): provider is RpcProviderConfig => Boolean(provider));

  if (providers.length === 0) {
    return [{ name: "primary", url: fallbackUrl }];
  }

  return providers;
}

function normalizeProviders(providers: RpcProviderConfig[]): RpcProvider[] {
  const normalized = providers
    .map((provider, index) => ({
      name: provider.name || (index === 0 ? "primary" : `rpc-${index + 1}`),
      url: provider.url.trim(),
      index,
    }))
    .filter((provider) => provider.url);

  if (normalized.length === 0) {
    return [{ name: "primary", url: appConfig.rpcUrl, index: 0 }];
  }

  return normalized;
}

function getErrorStatus(error: unknown): number | null {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const response =
      record.response && typeof record.response === "object"
        ? (record.response as Record<string, unknown>)
        : null;
    const cause =
      record.cause && typeof record.cause === "object"
        ? (record.cause as Record<string, unknown>)
        : null;
    const causeResponse =
      cause?.response && typeof cause.response === "object"
        ? (cause.response as Record<string, unknown>)
        : null;
    const rpcError =
      record.error && typeof record.error === "object"
        ? (record.error as Record<string, unknown>)
        : null;
    const rawStatus =
      record.status ??
      record.statusCode ??
      response?.status ??
      response?.statusCode ??
      cause?.status ??
      cause?.statusCode ??
      causeResponse?.status ??
      causeResponse?.statusCode ??
      rpcError?.code;
    if (typeof rawStatus === "number") return rawStatus;
    if (typeof rawStatus === "string") {
      const parsed = Number(rawStatus);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  const statusMatch = /\b(?:HTTP|status(?:\s+code)?)\s*(429|5\d\d)\b/i.exec(
    message,
  );
  return statusMatch ? Number(statusMatch[1]) : null;
}

const TRANSIENT_SYSCALL_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ETIMEDOUT",
  "EPIPE",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
]);

function getErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const record = error as Record<string, unknown>;
  if (typeof record.code === "string") return record.code;
  if (record.cause && typeof record.cause === "object") {
    const cause = record.cause as Record<string, unknown>;
    if (typeof cause.code === "string") return cause.code;
  }
  return null;
}

export function isTransientRpcError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const status = getErrorStatus(error);
  if (status !== null && (status === 429 || (status >= 500 && status <= 599))) {
    return true;
  }
  if (/^TIMEOUT:/i.test(message)) return true;
  if (error instanceof Error && error.name === "AbortError") return true;
  // Network-level failures (dead host, DNS, reset socket) must fail over —
  // they are exactly the "kill the primary RPC live" demo scenario.
  const code = getErrorCode(error);
  if (code && TRANSIENT_SYSCALL_CODES.has(code)) return true;
  if (error instanceof TypeError && /fetch failed/i.test(message)) return true;
  return /\b(?:timed out|timeout)\b/i.test(message);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createDefaultServer(provider: RpcProvider) {
  return new rpc.Server(provider.url, {
    allowHttp: provider.url.startsWith("http://"),
  });
}

export class RpcRouter<TServer = rpc.Server> {
  private readonly providers: RpcProvider[];
  private readonly servers: TServer[];
  private readonly timeoutMs: number;
  private readonly pinMs: number;
  private readonly baseBackoffMs: number;
  private readonly maxBackoffMs: number;
  private readonly jitter: () => number;
  private readonly now: () => number;
  private pinnedIndex: number | null = null;
  private pinnedUntil = 0;

  constructor(options: RpcRouterOptions<TServer> = {}) {
    this.providers = normalizeProviders(
      options.providers ??
        resolveRpcProviders({
          providerEnv: process.env.RPC_PROVIDERS,
          fallbackUrl: appConfig.rpcUrl,
        }),
    );
    const serverFactory =
      options.serverFactory ??
      ((provider: RpcProvider) => createDefaultServer(provider) as TServer);
    this.servers = this.providers.map(serverFactory);
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.pinMs = options.pinMs ?? DEFAULT_PIN_MS;
    this.baseBackoffMs = options.baseBackoffMs ?? DEFAULT_BACKOFF_MS;
    this.maxBackoffMs = options.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS;
    this.jitter = options.jitter ?? Math.random;
    this.now = options.now ?? Date.now;
  }

  getActiveProvider(): ActiveRpcProvider {
    const pinned = this.getPinnedIndex();
    const provider = this.providers[pinned ?? 0];
    return {
      ...provider,
      pinned: pinned !== null,
      pinnedUntil: pinned !== null ? this.pinnedUntil : null,
    };
  }

  async request<TResult>(
    operation: (server: TServer, provider: RpcProvider) => Promise<TResult>,
  ): Promise<TResult> {
    const orderedProviders = this.getOrderedProviders();
    let transientError: unknown;

    for (let attempt = 0; attempt < orderedProviders.length; attempt++) {
      const provider = orderedProviders[attempt];
      try {
        const result = await withTimeout(
          Promise.resolve(operation(this.servers[provider.index], provider)),
          this.timeoutMs,
          `RPC ${provider.name}`,
        );
        this.pinProvider(provider);
        return result;
      } catch (error) {
        if (!isTransientRpcError(error)) {
          throw error;
        }
        if (this.pinnedIndex === provider.index) {
          this.pinnedIndex = null;
          this.pinnedUntil = 0;
        }
        transientError = error;
        if (attempt === orderedProviders.length - 1) {
          throw transientError;
        }
        await sleep(this.getBackoffDelay(attempt));
      }
    }

    throw transientError ?? new Error("No RPC providers are configured.");
  }

  private getPinnedIndex() {
    if (this.pinnedIndex === null) return null;
    if (this.now() >= this.pinnedUntil) {
      this.pinnedIndex = null;
      this.pinnedUntil = 0;
      return null;
    }
    return this.pinnedIndex;
  }

  private getOrderedProviders() {
    const pinned = this.getPinnedIndex();
    if (pinned === null) return this.providers;
    return [
      this.providers[pinned],
      ...this.providers.filter((provider) => provider.index !== pinned),
    ];
  }

  private pinProvider(provider: RpcProvider) {
    this.pinnedIndex = provider.index;
    this.pinnedUntil = this.now() + this.pinMs;
  }

  private getBackoffDelay(attempt: number) {
    const exponentialDelay = Math.min(
      this.baseBackoffMs * 2 ** attempt,
      this.maxBackoffMs,
    );
    const jitterMs = Math.max(0, Math.floor(exponentialDelay * this.jitter()));
    return Math.min(exponentialDelay + jitterMs, this.maxBackoffMs);
  }
}

export function createRpcRouter<TServer = rpc.Server>(
  options: RpcRouterOptions<TServer> = {},
) {
  return new RpcRouter<TServer>(options);
}

const rpcRouter = createRpcRouter();

export function getActiveProvider() {
  return rpcRouter.getActiveProvider();
}

export function routeRpcOperation<TResult>(
  operation: (server: rpc.Server, provider: RpcProvider) => Promise<TResult>,
) {
  return rpcRouter.request(operation);
}

export async function routeRpcJsonRpc<TResult>(
  body: unknown,
  init: RoutedFetchInit = {},
): Promise<TResult> {
  return rpcRouter.request(async (_server, provider) => {
    const headers = new Headers(init.headers);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(provider.url, {
      ...init,
      method: init.method ?? "POST",
      headers,
      body:
        typeof body === "string" || body instanceof FormData
          ? body
          : JSON.stringify(body),
    });

    if (!response.ok) {
      throw new RpcHttpError(response.status, provider);
    }

    const payload = (await response.json()) as TResult & {
      error?: { code?: number | string; message?: string };
    };
    if (payload.error) {
      throw new RpcJsonRpcError(payload.error);
    }

    return payload;
  });
}
