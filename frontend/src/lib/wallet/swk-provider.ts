"use client";

import { appConfig, getExpectedNetworkPassphrase } from "@/lib/config";
import type { WalletSnapshot } from "@/lib/types";
import type { WalletProviderModule } from "./types";
import type { Networks } from "@creit.tech/stellar-wallets-kit/types";

// Stellar Wallets Kit (Creit Tech, MIT) backs a single "More wallets" entry:
// its auth modal offers the extension wallets we don't integrate natively —
// xBull, Rabet, LOBSTR, Hana, Klever, Bitget. Deliberately excluded, to
// keep the strict CSP intact: WalletConnect (relay websockets), Ledger
// (WebUSB), Trezor + HOT (iframes blocked by frame-src 'none'), and OneKey
// (its picker icon loads from onekey-asset.com, outside our img-src).
// Everything loads lazily on first use, so the kit and the wallet SDKs stay
// out of every route's First Load JS.

// The kit persists its session under these stable localStorage keys (see
// LocalStorageKeys in its types). Reading them directly lets read() restore
// a session on page load without pulling the kit chunk.
const SWK_ADDRESS_KEY = "@StellarWalletsKit/activeAddress";
const SWK_MODULE_KEY = "@StellarWalletsKit/selectedModuleId";
// Our own cache of the selected wallet's display name, captured at connect
// time so the connected UI can say "xBull" instead of "More wallets".
const SWK_LABEL_KEY = "stellaroid:swk:wallet-label";

const STELLAR_ADDRESS_RE = /^G[A-Z2-7]{55}$/;

function localStore(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

type Kit = typeof import("@creit.tech/stellar-wallets-kit/sdk").StellarWalletsKit;

let kitPromise: Promise<Kit> | null = null;

function loadKit(): Promise<Kit> {
  kitPromise ??= (async () => {
    const [{ StellarWalletsKit }, ...modules] = await Promise.all([
      import("@creit.tech/stellar-wallets-kit/sdk"),
      import("@creit.tech/stellar-wallets-kit/modules/xbull").then((m) => new m.xBullModule()),
      import("@creit.tech/stellar-wallets-kit/modules/rabet").then((m) => new m.RabetModule()),
      import("@creit.tech/stellar-wallets-kit/modules/lobstr").then((m) => new m.LobstrModule()),
      import("@creit.tech/stellar-wallets-kit/modules/hana").then((m) => new m.HanaModule()),
      import("@creit.tech/stellar-wallets-kit/modules/klever").then((m) => new m.KleverModule()),
      import("@creit.tech/stellar-wallets-kit/modules/bitget").then((m) => new m.BitgetModule()),
    ] as const);

    StellarWalletsKit.init({
      modules,
      // The Networks enum values ARE the network passphrases.
      network: getExpectedNetworkPassphrase() as Networks,
      authModal: { showInstallLabel: true },
    });
    return StellarWalletsKit;
  })();
  return kitPromise;
}

function connectedSnapshot(address: string): WalletSnapshot {
  return {
    status: "connected",
    address,
    // Like Albedo, kit wallets sign for the network we request in each
    // signTransaction call, so there is no wrong-network state to surface.
    network: appConfig.network,
    networkPassphrase: getExpectedNetworkPassphrase(),
    isExpectedNetwork: true,
    provider: "swk",
    providerLabel: localStore()?.getItem(SWK_LABEL_KEY) ?? undefined,
  };
}

function disconnectedSnapshot(): WalletSnapshot {
  return {
    status: "disconnected",
    address: null,
    network: null,
    networkPassphrase: null,
    isExpectedNetwork: false,
    provider: "swk",
  };
}

async function read(): Promise<WalletSnapshot> {
  const store = localStore();
  const address = store?.getItem(SWK_ADDRESS_KEY) ?? "";
  const moduleId = store?.getItem(SWK_MODULE_KEY) ?? "";
  if (!moduleId || !STELLAR_ADDRESS_RE.test(address)) {
    return disconnectedSnapshot();
  }
  return connectedSnapshot(address);
}

async function connect(): Promise<WalletSnapshot> {
  const kit = await loadKit();

  let address: string;
  try {
    ({ address } = await kit.authModal());
  } catch (error) {
    // The kit rejects with a plain {code, message} object, not an Error.
    const message =
      error instanceof Error
        ? error.message
        : typeof (error as { message?: unknown } | null)?.message === "string"
          ? (error as { message: string }).message
          : String(error);
    // Closing the picker is a choice, not a failure worth an alarming toast.
    if (/clos|cancel|dismiss/i.test(message)) {
      throw new Error("Wallet selection closed.");
    }
    throw new Error(message || "Unable to connect the selected wallet.");
  }

  if (!STELLAR_ADDRESS_RE.test(address)) {
    throw new Error("The selected wallet did not return an account.");
  }

  try {
    const label = kit.selectedModule?.productName;
    if (label) localStore()?.setItem(SWK_LABEL_KEY, label);
  } catch {
    // Display-name cache only — never block the connection on it.
  }

  return connectedSnapshot(address);
}

async function sign(transactionXdr: string, address: string): Promise<string> {
  const kit = await loadKit();
  const { signedTxXdr } = await kit.signTransaction(transactionXdr, {
    address,
    networkPassphrase: getExpectedNetworkPassphrase(),
  });
  if (!signedTxXdr) {
    throw new Error("The wallet did not return a signed transaction.");
  }
  return signedTxXdr;
}

export function forgetSwkSession() {
  const store = localStore();
  store?.removeItem(SWK_ADDRESS_KEY);
  store?.removeItem(SWK_MODULE_KEY);
  store?.removeItem(SWK_LABEL_KEY);
  // If the kit chunk is already live, clear its in-memory state too.
  if (kitPromise) {
    void kitPromise.then((kit) => kit.disconnect()).catch(() => undefined);
  }
}

export const swkProvider: WalletProviderModule = {
  id: "swk",
  label: "More wallets",
  // The kit's wallets are browser EXTENSIONS, which do not exist on mobile
  // browsers. Marking it "extension" hides it on mobile (where WalletConnect
  // and Albedo take over) while keeping the one-click picker on desktop.
  kind: "extension",
  tagline: "xBull, Rabet, LOBSTR, Hana & more",
  read,
  connect,
  sign,
};
