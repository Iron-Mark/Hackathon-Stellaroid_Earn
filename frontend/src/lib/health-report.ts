import { appConfig, hasRequiredConfig } from "@/lib/config";
import {
  getActiveProvider,
  routeRpcJsonRpc,
} from "@/lib/rpc-router";
import { getQuote } from "@/lib/quote";

export type HealthStatus = "healthy" | "degraded" | "down";

export type HealthReport = {
  status: HealthStatus;
  timestamp: string;
  checks: {
    config: { ok: boolean; detail: string };
    rpc: {
      ok: boolean;
      latencyMs: number;
      detail: string;
      providerName: string;
      providerUrl: string;
    };
    contract: { ok: boolean; detail: string };
    quote: {
      ok: boolean;
      detail: string;
      source: string | null;
      asOf: string | null;
      stale: boolean;
    };
    pdax: { ok: boolean; mode: string; detail: string };
  };
};

function getPdaxModeForReport(): string {
  const mode = process.env.PDAX_MODE?.toLowerCase() ?? "mock";
  return mode === "mock" || mode === "staging" || mode === "production"
    ? mode
    : `invalid (${process.env.PDAX_MODE})`;
}

export async function getHealthReport(): Promise<HealthReport> {
  const timestamp = new Date().toISOString();
  const configOk = hasRequiredConfig();

  let rpcOk = false;
  let rpcLatency = 0;
  let rpcDetail = "Not checked";
  let rpcProvider = getActiveProvider();

  if (configOk) {
    const start = Date.now();
    try {
      const json = await routeRpcJsonRpc<{
        result?: { status?: string };
      }>(
        {
          jsonrpc: "2.0",
          id: "health-check",
          method: "getHealth",
          params: {},
        },
        { next: { revalidate: 30 } },
      );

      rpcLatency = Date.now() - start;
      rpcProvider = getActiveProvider();

      rpcOk = json.result?.status === "healthy";
      rpcDetail = rpcOk
        ? `Healthy via ${rpcProvider.name} (${rpcLatency}ms)`
        : `${rpcProvider.name} returned status: ${json.result?.status ?? "unknown"}`;
    } catch (err) {
      rpcLatency = Date.now() - start;
      rpcProvider = getActiveProvider();
      rpcDetail = err instanceof Error ? err.message : "RPC connection failed";
    }
  }

  const quote = await getQuote("XLM", "PHP");
  const quoteOk = quote !== null;
  const quoteDetail = !quote
    ? "No quote available (providers unreachable, cache empty)"
    : quote.stale
      ? `Stale ₱${quote.price} via ${quote.source} (as of ${quote.asOf})`
      : `₱${quote.price} via ${quote.source} (as of ${quote.asOf})`;

  const pdaxMode = getPdaxModeForReport();

  const contractOk = Boolean(appConfig.contractId);
  const contractDetail = !configOk
    ? "Config missing"
    : contractOk
      ? `Contract ID configured: ${appConfig.contractId.slice(0, 8)}...`
      : "Missing contract ID";

  const status: HealthStatus =
    configOk && rpcOk && contractOk ? "healthy" : configOk ? "degraded" : "down";

  return {
    status,
    timestamp,
    checks: {
      config: {
        ok: configOk,
        detail: configOk
          ? "All required env vars set"
          : "Missing NEXT_PUBLIC_SOROBAN_CONTRACT_ID or RPC URL",
      },
      rpc: {
        ok: rpcOk,
        latencyMs: rpcLatency,
        detail: rpcDetail,
        providerName: rpcProvider.name,
        providerUrl: rpcProvider.url,
      },
      contract: { ok: contractOk, detail: contractDetail },
      quote: {
        ok: quoteOk,
        detail: quoteDetail,
        source: quote?.source ?? null,
        asOf: quote?.asOf ?? null,
        stale: quote?.stale ?? false,
      },
      pdax: {
        ok: !pdaxMode.startsWith("invalid"),
        mode: pdaxMode,
        detail: `PDAX_MODE=${pdaxMode}${pdaxMode === "mock" ? " (no keys, no network calls)" : ""}`,
      },
    },
  };
}
