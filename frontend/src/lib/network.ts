/**
 * Dual-network resolution (M-1). Testnet is the default everywhere;
 * `STELLAR_NETWORK=mainnet` plus mainnet-only values exist ONLY in
 * maintainer-held env. Nothing here fabricates or defaults a mainnet value,
 * and the mainnet path is exercised in tests purely via injected config.
 */
export type StellarNetworkName = "testnet" | "mainnet";

export type NetworkEnv = Record<string, string | undefined>;

export type ResolvedNetwork = {
  name: StellarNetworkName;
  passphrase: string;
  contractId: string;
  rpcProviders: string[];
  horizonUrl: string;
  explorerBase: string;
  /** M-3 gate: wallet-to-wallet mainnet payments stay hidden until true. */
  enableMainnetPayments: boolean;
};

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
const MAINNET_PASSPHRASE = "Public Global Stellar Network ; September 2015";
const TESTNET_RPC = "https://soroban-testnet.stellar.org";
const TESTNET_HORIZON = "https://horizon-testnet.stellar.org";
const MAINNET_HORIZON = "https://horizon.stellar.org";
const TESTNET_EXPLORER = "https://stellar.expert/explorer/testnet";
const MAINNET_EXPLORER = "https://stellar.expert/explorer/public";

function parseProviders(value: string | undefined, fallback: string[]): string[] {
  const entries = (value ?? "")
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  return entries.length > 0 ? entries : fallback;
}

export function resolveNetwork(env: NetworkEnv = process.env): ResolvedNetwork {
  // Only the exact string "mainnet" activates mainnet. Anything else —
  // unset, typo'd, or differently-cased — stays on testnet by design.
  const name: StellarNetworkName =
    env.STELLAR_NETWORK === "mainnet" ? "mainnet" : "testnet";

  if (name === "mainnet") {
    return {
      name,
      passphrase: MAINNET_PASSPHRASE,
      contractId: env.CONTRACT_ID_MAINNET?.trim() ?? "",
      rpcProviders: parseProviders(env.RPC_PROVIDERS, []),
      horizonUrl: env.HORIZON_URL?.trim() || MAINNET_HORIZON,
      explorerBase: MAINNET_EXPLORER,
      enableMainnetPayments: env.ENABLE_MAINNET_PAYMENTS === "true",
    };
  }

  return {
    name,
    passphrase: TESTNET_PASSPHRASE,
    contractId:
      env.CONTRACT_ID_TESTNET?.trim() ||
      env.NEXT_PUBLIC_SOROBAN_CONTRACT_ID?.trim() ||
      "",
    rpcProviders: parseProviders(env.RPC_PROVIDERS, [TESTNET_RPC]),
    horizonUrl: env.HORIZON_URL?.trim() || TESTNET_HORIZON,
    explorerBase: TESTNET_EXPLORER,
    enableMainnetPayments: false,
  };
}
