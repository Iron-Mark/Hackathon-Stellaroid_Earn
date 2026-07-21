"use client";

import { appConfig, getExpectedNetworkPassphrase } from "@/lib/config";
import type { WalletSnapshot } from "@/lib/types";
import type { WalletProviderModule } from "./types";

// WalletConnect v2 (Reown relay) is the only way to reach the wallets people
// actually have on phones — LOBSTR, xBull, Hana, Freighter mobile — since none
// of them expose a browser extension on mobile. We talk to the relay directly
// via @walletconnect/sign-client (no @reown/appkit, no EVM baggage) and render
// the pairing QR ourselves with a locally-generated data URL, so the only CSP
// concession is the relay websocket itself. The single-transaction sign flow
// maps 1:1 onto the app's "wallet returns a signed XDR, we submit it" model.

const WC_ADDRESS_KEY = "stellaroid:wc:address";
const WC_TOPIC_KEY = "stellaroid:wc:topic";
const STELLAR_ADDRESS_RE = /^G[A-Z2-7]{55}$/;
const RELAY_URL = "wss://relay.walletconnect.org";

// The kit exposes both a sign-only and a sign-and-submit method. We require
// sign-only (we submit ourselves) and merely allow the others.
const METHOD_SIGN = "stellar_signXDR";
const METHOD_SIGN_AND_SUBMIT = "stellar_signAndSubmitXDR";

type WcChain = "stellar:pubnet" | "stellar:testnet";

function wcChain(): WcChain {
  const network = appConfig.network.toUpperCase();
  return network === "PUBLIC" || network === "PUBNET"
    ? "stellar:pubnet"
    : "stellar:testnet";
}

function localStore(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/* ─── modal bridge ────────────────────────────────────────────────────────
 * connect() runs outside React, so it publishes the pairing URI to a tiny
 * store that <WalletConnectModal /> subscribes to. The modal's Cancel button
 * calls cancelWalletConnect(), which rejects the pending approval.
 * ------------------------------------------------------------------------ */

export type WalletConnectModalState = { open: boolean; uri: string | null };
type Listener = (state: WalletConnectModalState) => void;

let modalState: WalletConnectModalState = { open: false, uri: null };
const listeners = new Set<Listener>();
let cancelCurrent: (() => void) | null = null;

function emit() {
  for (const listener of listeners) listener(modalState);
}

export function subscribeWalletConnectModal(listener: Listener): () => void {
  listeners.add(listener);
  listener(modalState);
  return () => {
    listeners.delete(listener);
  };
}

/** Called by the modal's Cancel control to abort an in-flight connection. */
export function cancelWalletConnect() {
  cancelCurrent?.();
}

function openModal(uri: string, onCancel: () => void) {
  cancelCurrent = onCancel;
  modalState = { open: true, uri };
  emit();
}

function closeModal() {
  cancelCurrent = null;
  modalState = { open: false, uri: null };
  emit();
}

/* ─── sign client (lazy singleton) ───────────────────────────────────────── */

// Infer the client type from the dynamic import so we never depend on the
// exact shape of @walletconnect/types (a transitive package).
type SignClient = Awaited<
  ReturnType<typeof import("@walletconnect/sign-client")["SignClient"]["init"]>
>;

let clientPromise: Promise<SignClient> | null = null;

function getClient(): Promise<SignClient> {
  const projectId = appConfig.walletConnectProjectId;
  if (!projectId) {
    return Promise.reject(
      new Error(
        "WalletConnect is not configured. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.",
      ),
    );
  }
  if (!clientPromise) {
    clientPromise = (async () => {
      const { SignClient } = await import("@walletconnect/sign-client");
      return SignClient.init({
        projectId,
        relayUrl: RELAY_URL,
        // Core defaults telemetry ON (POSTs to pulse.walletconnect.org); our
        // CSP already blocks that host, so leave it blocked and silence it at
        // the source rather than ever widening connect-src to a analytics host.
        telemetryEnabled: false,
        metadata: {
          name: "Stellaroid Earn",
          description: "Verifiable credentials and payments on Stellar",
          url: appConfig.canonicalUrl,
          icons: [`${appConfig.canonicalUrl}/favicon.png`],
        },
      });
    })();
    // Don't cache a rejected init (e.g. a transient relay failure) forever —
    // clear it so the next attempt can re-initialise.
    clientPromise.catch(() => {
      clientPromise = null;
    });
  }
  return clientPromise;
}

function connectedSnapshot(address: string): WalletSnapshot {
  return {
    status: "connected",
    address,
    // The wallet signs for the exact chain we request on every call, so there
    // is no wrong-network state to surface (same as Albedo and the kit).
    network: appConfig.network,
    networkPassphrase: getExpectedNetworkPassphrase(),
    isExpectedNetwork: true,
    provider: "walletconnect",
  };
}

function disconnectedSnapshot(): WalletSnapshot {
  return {
    status: "disconnected",
    address: null,
    network: null,
    networkPassphrase: null,
    isExpectedNetwork: false,
    provider: "walletconnect",
  };
}

async function read(): Promise<WalletSnapshot> {
  // If the deploy no longer has a project id (e.g. the env var was removed, or
  // this is a preview without it), a previously-stored WC session can never
  // sign again — degrade to disconnected instead of a stuck "connected" state.
  // We read from localStorage rather than the live client so page load never
  // eagerly pulls the sign-client chunk; sign() re-checks the live session.
  if (!appConfig.walletConnectProjectId) {
    return disconnectedSnapshot();
  }
  const store = localStore();
  const address = store?.getItem(WC_ADDRESS_KEY) ?? "";
  const topic = store?.getItem(WC_TOPIC_KEY) ?? "";
  if (!topic || !STELLAR_ADDRESS_RE.test(address)) {
    return disconnectedSnapshot();
  }
  return connectedSnapshot(address);
}

// A single connection can be in flight at a time; a second concurrent call
// would clobber the shared modal/cancel state (there is one pairing modal).
let connectInFlight = false;

async function connect(): Promise<WalletSnapshot> {
  if (connectInFlight) {
    throw new Error("A WalletConnect connection is already in progress.");
  }
  connectInFlight = true;
  try {
    const client = await getClient();
    const chain = wcChain();

    // requiredNamespaces is deprecated in WalletConnect v2 (the relay
    // auto-demotes it to optional), so we advertise everything as optional:
    // the wallet approves the chain + methods it supports, and we reject below
    // if no Stellar account was granted. This avoids hard-rejecting wallets at
    // proposal time while still failing closed when the account is missing.
    const { uri, approval } = await client.connect({
      optionalNamespaces: {
        stellar: {
          methods: [METHOD_SIGN, METHOD_SIGN_AND_SUBMIT],
          chains: [chain],
          events: [],
        },
      },
    });

    if (!uri) {
      throw new Error("WalletConnect did not return a pairing link.");
    }

    // Show the QR / deep-link modal and race the wallet's approval against the
    // user cancelling. Whichever settles first wins; the modal always closes.
    const approved = approval();
    const cancelled = new Promise<never>((_, reject) => {
      openModal(uri, () =>
        reject(new Error("WalletConnect connection cancelled.")),
      );
    });

    let session: Awaited<typeof approved>;
    try {
      session = await Promise.race([approved, cancelled]);
    } catch (error) {
      // If the user cancelled but the wallet approves a moment later, tear the
      // now-orphaned session down so it does not linger as a "connected" app.
      void approved
        .then((late) =>
          client.disconnect({
            topic: late.topic,
            reason: { code: 6000, message: "User cancelled" },
          }),
        )
        .catch(() => undefined);
      throw error;
    } finally {
      closeModal();
    }

    const accounts = session.namespaces.stellar?.accounts ?? [];
    // Accounts look like "stellar:testnet:G...."; take the address segment.
    const address = accounts[0]?.split(":")[2] ?? "";
    if (!STELLAR_ADDRESS_RE.test(address)) {
      throw new Error("The connected wallet did not return a Stellar account.");
    }

    const store = localStore();
    store?.setItem(WC_ADDRESS_KEY, address);
    store?.setItem(WC_TOPIC_KEY, session.topic);
    return connectedSnapshot(address);
  } finally {
    connectInFlight = false;
  }
}

// The account is bound to the session topic, so the second argument (address)
// is unused; the request carries only the XDR, matching the shape Stellar
// WalletConnect wallets expect.
async function sign(transactionXdr: string): Promise<string> {
  const client = await getClient();
  const topic = localStore()?.getItem(WC_TOPIC_KEY);
  // The relay drops sessions on expiry (~7 days) or in-wallet revoke, which
  // localStorage never learns about. Verify the session is still live and clear
  // it on a miss, so the UI recovers on the next read instead of throwing a
  // cryptic "no matching key" on every attempt.
  if (!topic || !client.session.getAll().some((s) => s.topic === topic)) {
    forgetWalletConnectSession();
    throw new Error("Your WalletConnect session expired. Reconnect your wallet.");
  }

  let result: { signedXDR?: string; signedTxXdr?: string } | string | null;
  try {
    result = (await client.request({
      topic,
      chainId: wcChain(),
      request: { method: METHOD_SIGN, params: { xdr: transactionXdr } },
    })) as { signedXDR?: string; signedTxXdr?: string } | string | null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/no matching key|session topic|expired/i.test(message)) {
      forgetWalletConnectSession();
      throw new Error(
        "Your WalletConnect session expired. Reconnect your wallet.",
      );
    }
    throw error;
  }

  const signed =
    typeof result === "string"
      ? result
      : (result?.signedXDR ?? result?.signedTxXdr);
  if (!signed) {
    throw new Error("The wallet did not return a signed transaction.");
  }
  return signed;
}

export function forgetWalletConnectSession() {
  const store = localStore();
  const topic = store?.getItem(WC_TOPIC_KEY);
  store?.removeItem(WC_ADDRESS_KEY);
  store?.removeItem(WC_TOPIC_KEY);
  // Tell the relay/wallet to drop the pairing. After a page reload the client
  // is not yet initialized (read() restores from localStorage lazily), so use
  // getClient() — which initialises it if needed — rather than only acting when
  // clientPromise already exists, else the session lingers until ~7-day expiry.
  // Disconnect is an explicit user action, so eagerly loading the chunk is fine.
  if (topic && appConfig.walletConnectProjectId) {
    void getClient()
      .then((client) =>
        client.disconnect({
          topic,
          reason: { code: 6000, message: "User disconnected" },
        }),
      )
      .catch(() => undefined);
  }
}

export const walletConnectProvider: WalletProviderModule = {
  id: "walletconnect",
  label: "WalletConnect",
  kind: "web",
  tagline: "LOBSTR, xBull, Hana, Freighter mobile & more",
  read,
  connect,
  sign,
};
