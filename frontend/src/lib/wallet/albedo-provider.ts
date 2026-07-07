"use client";

import { appConfig, getExpectedNetworkPassphrase } from "@/lib/config";
import type { WalletSnapshot } from "@/lib/types";
import type { WalletProviderModule } from "./types";

// Albedo (albedo.link) is a web wallet: it signs via a popup/redirect to
// albedo.link, so it works in any browser — including iOS Safari and Android
// Chrome — with no extension and no project/config. It has no persistent
// session we can read silently, so we cache the connected public key locally
// for display; signing always re-prompts the user.

const ALBEDO_ADDRESS_KEY = "stellaroid:albedo:address";

function albedoNetwork(): "public" | "testnet" {
  const network = appConfig.network.toUpperCase();
  return network === "PUBLIC" || network === "PUBNET" ? "public" : "testnet";
}

function localStore(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function connectedSnapshot(address: string): WalletSnapshot {
  return {
    status: "connected",
    address,
    // Albedo signs for the network we request, so there is no wrong-network risk.
    network: appConfig.network,
    networkPassphrase: getExpectedNetworkPassphrase(),
    isExpectedNetwork: true,
    provider: "albedo",
  };
}

function disconnectedSnapshot(): WalletSnapshot {
  return {
    status: "disconnected",
    address: null,
    network: null,
    networkPassphrase: null,
    isExpectedNetwork: false,
    provider: "albedo",
  };
}

// Import lazily so the browser-only SDK never runs during SSR/build.
async function loadAlbedo() {
  const mod = await import("@albedo-link/intent");
  return mod.default;
}

async function read(): Promise<WalletSnapshot> {
  const stored = localStore()?.getItem(ALBEDO_ADDRESS_KEY);
  return stored ? connectedSnapshot(stored) : disconnectedSnapshot();
}

async function connect(): Promise<WalletSnapshot> {
  const albedo = await loadAlbedo();
  const result = await albedo.publicKey({});
  if (!result?.pubkey) {
    throw new Error("Albedo did not return an account.");
  }
  localStore()?.setItem(ALBEDO_ADDRESS_KEY, result.pubkey);
  return connectedSnapshot(result.pubkey);
}

async function sign(transactionXdr: string, address: string): Promise<string> {
  const albedo = await loadAlbedo();
  const result = await albedo.tx({
    xdr: transactionXdr,
    pubkey: address,
    network: albedoNetwork(),
    submit: false,
  });
  if (!result?.signed_envelope_xdr) {
    throw new Error("Albedo did not return a signed transaction.");
  }
  return result.signed_envelope_xdr;
}

export function forgetAlbedoSession() {
  localStore()?.removeItem(ALBEDO_ADDRESS_KEY);
}

export const albedoProvider: WalletProviderModule = {
  id: "albedo",
  label: "Albedo",
  kind: "web",
  tagline: "Web wallet · works on mobile, no install",
  read,
  connect,
  sign,
};
