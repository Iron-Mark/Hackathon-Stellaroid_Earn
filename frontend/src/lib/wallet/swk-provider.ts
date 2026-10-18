"use client";

import { appConfig, getExpectedNetworkPassphrase } from "../config.ts";
import type { WalletSnapshot } from "../types";
import type { WalletProviderModule } from "./types";
import {
  EXTENSION_WALLETS, isExtensionWalletId, connectExtensionWallet,
  signExtensionTransaction, type ExtensionWalletId,
} from "./extension-adapters.ts";
import { assertSignedTransaction } from "./signed-transaction.ts";

// Retain the former kit's provider ID and storage keys for existing sessions.
// No kit code is loaded. Direct bridge SDKs are lazy-loaded by the adapters.
const ADDRESS_KEY = "@StellarWalletsKit/activeAddress";
const MODULE_KEY = "@StellarWalletsKit/selectedModuleId";
const LABEL_KEY = "stellaroid:swk:wallet-label";
const ADDRESS_RE = /^G[A-Z2-7]{55}$/;
function localStore(): Storage | null {
  try { return window.localStorage; } catch { return null; }
}
let memorySession: { id: ExtensionWalletId; address: string } | null = null;
function session() {
  if (memorySession) return memorySession;
  try {
    const store = localStore();
    const id = store?.getItem(MODULE_KEY);
    const address = store?.getItem(ADDRESS_KEY) ?? "";
    return isExtensionWalletId(id) && ADDRESS_RE.test(address) ? { id, address } : null;
  } catch { return null; }
}
export type ExtensionModalState = {
  open: boolean; busy: ExtensionWalletId | null; error: string | null;
};
type Listener = (state: ExtensionModalState) => void;
let state: ExtensionModalState = { open: false, busy: null, error: null };
const listeners = new Set<Listener>();
type Pending = { resolve: (value: WalletSnapshot) => void; reject: (error: Error) => void };
let pending: Pending | null = null;
function publish(next: ExtensionModalState) {
  state = next;
  for (const listener of listeners) listener(state);
}
export function subscribeExtensionModal(listener: Listener) {
  listeners.add(listener);
  listener(state);
  return () => { listeners.delete(listener); };
}
export function cancelExtensionSelection() {
  const current = pending;
  pending = null;
  publish({ open: false, busy: null, error: null });
  current?.reject(new Error("Wallet selection closed."));
}
function snapshot(address: string, id: ExtensionWalletId): WalletSnapshot {
  return {
    status: "connected", address, network: appConfig.network,
    networkPassphrase: getExpectedNetworkPassphrase(), isExpectedNetwork: true,
    provider: "swk", providerLabel: EXTENSION_WALLETS.find((wallet) => wallet.id === id)?.label,
  };
}
export async function selectExtensionWallet(id: ExtensionWalletId) {
  const current = pending;
  if (!current || state.busy || !isExtensionWalletId(id)) return;
  publish({ open: true, busy: id, error: null });
  try {
    const address = await connectExtensionWallet(id);
    // Ignore approvals arriving after cancellation or a newer selection.
    if (pending !== current) return;
    if (!ADDRESS_RE.test(address)) throw new Error("The selected wallet did not return an account.");
    memorySession = { id, address };
    try {
      const store = localStore();
      store?.setItem(MODULE_KEY, id);
      store?.setItem(ADDRESS_KEY, address);
      store?.setItem(LABEL_KEY, EXTENSION_WALLETS.find((wallet) => wallet.id === id)!.label);
    } catch { /* Persistence is optional; the memory session remains usable. */ }
    pending = null;
    publish({ open: false, busy: null, error: null });
    current.resolve(snapshot(address, id));
  } catch (error) {
    if (pending !== current) return;
    publish({ open: true, busy: null, error: error instanceof Error ? error.message : "Unable to connect this wallet." });
  }
}
async function read(): Promise<WalletSnapshot> {
  const saved = session();
  if (saved) return snapshot(saved.address, saved.id);
  return { status: "disconnected", address: null, network: null,
    networkPassphrase: null, isExpectedNetwork: false, provider: "swk" };
}
function connect(): Promise<WalletSnapshot> {
  if (pending) return Promise.reject(new Error("A wallet selection is already in progress."));
  return new Promise((resolve, reject) => {
    pending = { resolve, reject };
    publish({ open: true, busy: null, error: null });
  });
}
async function sign(transactionXdr: string, address: string): Promise<string> {
  const saved = session();
  if (!saved || saved.address !== address) throw new Error("Reconnect the selected wallet before signing.");
  const network = getExpectedNetworkPassphrase();
  const signed = await signExtensionTransaction(saved.id, transactionXdr, address, network);
  // LOBSTR has no explicit network parameter. Verify the returned payload and
  // signature under the requested network before any transaction is submitted.
  await assertSignedTransaction(transactionXdr, signed, address, network);
  if (session()?.id !== saved.id || session()?.address !== address) {
    throw new Error("Wallet session changed while signing. Reconnect and try again.");
  }
  return signed;
}
export function forgetSwkSession() {
  cancelExtensionSelection();
  memorySession = null;
  try {
    const store = localStore();
    for (const key of [ADDRESS_KEY, MODULE_KEY, LABEL_KEY]) store?.removeItem(key);
  } catch { /* Storage can be unavailable in privacy mode. */ }
}
export const swkProvider: WalletProviderModule = {
  id: "swk", label: "More wallets", kind: "extension",
  tagline: "xBull, Rabet, LOBSTR, Hana & more", read, connect, sign,
};
