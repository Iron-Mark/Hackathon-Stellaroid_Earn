"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui";
import { appConfig, hasRequiredConfig } from "@/lib/config";

type RpcState = "checking" | "healthy" | "slow";

const PROBE_INTERVAL_MS = 60_000;
const SLOW_THRESHOLD_MS = 4_000;

// Raw JSON-RPC getHealth instead of a contract read: the pill runs on mount,
// and a contract-client probe would pull the lazy stellar-sdk chunk into the
// page's hydration window just to answer "is the RPC up".
async function probeRpc(): Promise<RpcState> {
  if (appConfig.e2eMode) return "healthy";
  const start = Date.now();
  try {
    const response = await fetch(appConfig.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "health",
        method: "getHealth",
        params: {},
      }),
      signal: AbortSignal.timeout(SLOW_THRESHOLD_MS),
    });
    if (!response.ok) return "slow";
    return Date.now() - start < SLOW_THRESHOLD_MS ? "healthy" : "slow";
  } catch {
    // Timeout or network failure — the RPC is unreachable or degraded.
    return "slow";
  }
}

export function RpcStatusPill() {
  const [state, setState] = useState<RpcState>("checking");

  useEffect(() => {
    if (!hasRequiredConfig()) return;

    let cancelled = false;

    async function run() {
      const result = await probeRpc();
      if (!cancelled) setState(result);
    }

    void run();

    const interval = setInterval(() => {
      void run();
    }, PROBE_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!hasRequiredConfig()) return null;

  if (state === "checking") {
    return <Badge tone="neutral" dot>Checking…</Badge>;
  }

  if (state === "healthy") {
    return <Badge tone="success" dot>Testnet · live</Badge>;
  }

  return <Badge tone="warning" dot>Testnet · slow</Badge>;
}

export default RpcStatusPill;
