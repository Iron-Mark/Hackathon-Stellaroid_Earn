"use client";

import {
  getAddress,
  getNetworkDetails,
  isConnected,
  requestAccess,
  signTransaction as freighterSignTransaction,
} from "@stellar/freighter-api";
import { appConfig, getExpectedNetworkPassphrase } from "@/lib/config";
import { withTimeout } from "@/lib/with-timeout";
import type { WalletSnapshot } from "@/lib/types";
import type { WalletProviderModule } from "./types";

const FREIGHTER_TIMEOUT_MS = 5_000;

function unsupported(error?: string): WalletSnapshot {
  return {
    status: "unsupported",
    address: null,
    network: null,
    networkPassphrase: null,
    isExpectedNetwork: false,
    error: error ?? "Freighter is not available in this browser.",
    provider: "freighter",
  };
}

function disconnected(error?: string): WalletSnapshot {
  return {
    status: "disconnected",
    address: null,
    network: null,
    networkPassphrase: null,
    isExpectedNetwork: false,
    error,
    provider: "freighter",
  };
}

async function read(): Promise<WalletSnapshot> {
  let connection;
  try {
    connection = await withTimeout(isConnected(), FREIGHTER_TIMEOUT_MS, "Freighter isConnected");
  } catch {
    return unsupported();
  }

  if (connection.error) return unsupported(connection.error);
  if (!connection.isConnected) return disconnected();

  const [addressResponse, networkResponse] = await Promise.all([
    getAddress(),
    getNetworkDetails(),
  ]);

  if (addressResponse.error) {
    return disconnected(addressResponse.error);
  }

  if (networkResponse.error) {
    return {
      status: addressResponse.address ? "connected" : "disconnected",
      address: addressResponse.address || null,
      network: null,
      networkPassphrase: null,
      isExpectedNetwork: false,
      error: networkResponse.error,
      provider: "freighter",
    };
  }

  const networkPassphrase =
    networkResponse.networkPassphrase || getExpectedNetworkPassphrase();
  const isExpectedNetwork =
    networkPassphrase === getExpectedNetworkPassphrase() ||
    networkResponse.network === appConfig.network;

  return {
    status: addressResponse.address ? "connected" : "disconnected",
    address: addressResponse.address || null,
    network: networkResponse.network ?? null,
    networkPassphrase,
    isExpectedNetwork,
    provider: "freighter",
  };
}

async function connect(): Promise<WalletSnapshot> {
  let access;
  try {
    access = await withTimeout(requestAccess(), FREIGHTER_TIMEOUT_MS, "Freighter requestAccess");
  } catch {
    throw new Error("Freighter did not respond. Is the extension installed?");
  }

  if (access.error) {
    throw new Error(access.error);
  }

  return read();
}

async function sign(transactionXdr: string, address: string): Promise<string> {
  const result = await freighterSignTransaction(transactionXdr, {
    networkPassphrase: getExpectedNetworkPassphrase(),
    address,
  });

  if (result.error || !result.signedTxXdr) {
    throw new Error(result.error ?? "Freighter did not return a signed transaction.");
  }

  return result.signedTxXdr;
}

export const freighterProvider: WalletProviderModule = {
  id: "freighter",
  label: "Freighter",
  kind: "extension",
  tagline: "Browser extension · desktop",
  installUrl: "https://www.freighter.app/",
  read,
  connect,
  sign,
};
