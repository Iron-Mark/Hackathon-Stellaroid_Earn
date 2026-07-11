"use client";

import { appConfig, getExpectedNetworkPassphrase } from "@/lib/config";
import type { WalletSnapshot } from "@/lib/types";
import { albedoProvider, forgetAlbedoSession } from "./albedo-provider";
import { freighterProvider } from "./freighter-provider";
import { swkProvider, forgetSwkSession } from "./swk-provider";
import type {
  WalletProviderId,
  WalletProviderMeta,
  WalletProviderModule,
} from "./types";

// Registry of supported wallets. Order = display priority in the picker.
// "swk" is the Stellar Wallets Kit aggregator (xBull, Rabet, LOBSTR, Hana…).
const PROVIDERS: WalletProviderModule[] = [
  freighterProvider,
  albedoProvider,
  swkProvider,
];

const ACTIVE_PROVIDER_KEY = "stellaroid:wallet-provider";

// E2E: the wallet is fully bypassed (no extension/popup in headless tests).
const E2E_WALLET_ADDRESS = "GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D";
const E2E_WALLET_STORAGE_KEY = "stellaroid:e2e:wallet-connected";

function sessionStore(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function localStore(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function e2eSnapshot(): WalletSnapshot {
  return {
    status: "connected",
    address: E2E_WALLET_ADDRESS,
    network: appConfig.network,
    networkPassphrase: getExpectedNetworkPassphrase(),
    isExpectedNetwork: true,
    provider: "freighter",
  };
}

function disconnectedSnapshot(): WalletSnapshot {
  return {
    status: "disconnected",
    address: null,
    network: null,
    networkPassphrase: null,
    isExpectedNetwork: false,
  };
}

export function listProviders(): WalletProviderMeta[] {
  return PROVIDERS.map(({ id, label, kind, tagline, installUrl }) => ({
    id,
    label,
    kind,
    tagline,
    installUrl,
  }));
}

function getProvider(id: WalletProviderId): WalletProviderModule | undefined {
  return PROVIDERS.find((provider) => provider.id === id);
}

function getActiveProviderId(): WalletProviderId | null {
  const value = localStore()?.getItem(ACTIVE_PROVIDER_KEY);
  return value === "freighter" || value === "albedo" || value === "swk"
    ? value
    : null;
}

function setActiveProviderId(id: WalletProviderId) {
  localStore()?.setItem(ACTIVE_PROVIDER_KEY, id);
}

function clearActiveProviderId() {
  localStore()?.removeItem(ACTIVE_PROVIDER_KEY);
}

export async function readWallet(): Promise<WalletSnapshot> {
  if (appConfig.e2eMode) {
    if (sessionStore()?.getItem(E2E_WALLET_STORAGE_KEY) === "1") {
      return e2eSnapshot();
    }
    return {
      ...disconnectedSnapshot(),
      network: appConfig.network,
      networkPassphrase: getExpectedNetworkPassphrase(),
      isExpectedNetwork: true,
    };
  }

  const id = getActiveProviderId();
  if (!id) return disconnectedSnapshot();

  const provider = getProvider(id);
  if (!provider) {
    clearActiveProviderId();
    return disconnectedSnapshot();
  }

  try {
    return await provider.read();
  } catch {
    return disconnectedSnapshot();
  }
}

export async function connectWallet(id: WalletProviderId): Promise<WalletSnapshot> {
  if (appConfig.e2eMode) {
    sessionStore()?.setItem(E2E_WALLET_STORAGE_KEY, "1");
    return e2eSnapshot();
  }

  const provider = getProvider(id);
  if (!provider) {
    throw new Error("Unknown wallet provider.");
  }

  const snapshot = await provider.connect();
  if (snapshot.status === "connected") {
    setActiveProviderId(id);
  }
  return snapshot;
}

export function disconnectWallet() {
  if (appConfig.e2eMode) {
    sessionStore()?.removeItem(E2E_WALLET_STORAGE_KEY);
    return;
  }
  clearActiveProviderId();
  forgetAlbedoSession();
  forgetSwkSession();
}

export async function signTransaction(
  transactionXdr: string,
  address: string,
): Promise<string> {
  if (appConfig.e2eMode) {
    return transactionXdr;
  }

  const id = getActiveProviderId();
  const provider = id ? getProvider(id) : undefined;
  if (!provider) {
    throw new Error("No wallet connected. Connect a wallet to sign.");
  }
  return provider.sign(transactionXdr, address);
}
