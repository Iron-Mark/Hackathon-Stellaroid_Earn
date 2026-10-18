// Wallet API mappings follow the MIT-licensed Stellar Wallets Kit 2.7.0
// modules (Creit Tech). Genuine xBull and LOBSTR bridges retain their own
// licenses and protocols; no signing or encryption is implemented here.

export const EXTENSION_WALLETS = [
  { id: "xbull", label: "xBull", icon: "/wallet-icons/xbull.png", installUrl: "https://xbull.app" },
  { id: "rabet", label: "Rabet", icon: "/wallet-icons/rabet.png", installUrl: "https://rabet.io/" },
  { id: "lobstr", label: "LOBSTR", icon: "/wallet-icons/lobstr.png", installUrl: "https://lobstr.co" },
  { id: "hana", label: "Hana Wallet", icon: "/wallet-icons/hana.png", installUrl: "https://hanawallet.io/" },
  { id: "klever", label: "Klever Wallet", icon: "/wallet-icons/klever.png", installUrl: "https://klever.io/" },
  { id: "BitgetWallet", label: "Bitget Wallet", icon: "/wallet-icons/bitget.png", installUrl: "https://web3.bitget.com" },
] as const;

export type ExtensionWalletId = (typeof EXTENSION_WALLETS)[number]["id"];

export function isExtensionWalletId(value: unknown): value is ExtensionWalletId {
  return EXTENSION_WALLETS.some((wallet) => wallet.id === value);
}

type SignOptions = { address: string; networkPassphrase: string };
type InjectedWallets = {
  rabet?: {
    connect(): Promise<unknown>;
    sign(xdr: string, network: "mainnet" | "testnet"): Promise<unknown>;
  };
  hanaWallet?: { stellar?: {
    getPublicKey(): Promise<unknown>;
    signTransaction(params: { xdr: string; accountToSign: string; networkPassphrase: string }): Promise<unknown>;
  } };
  kleverWallet?: { stellar?: {
    getAddress(): Promise<unknown>;
    signTransaction(xdr: string, options: SignOptions): Promise<unknown>;
    getNetwork?(): Promise<unknown>;
  } };
  bitkeep?: { stellar?: {
    connect(): Promise<unknown>;
    signTransaction(xdr: string, options: SignOptions): Promise<unknown>;
    network?(): Promise<unknown>;
  } };
};

const ADDRESS_RE = /^G[A-Z2-7]{55}$/;
const PUBLIC_NETWORK = "Public Global Stellar Network ; September 2015";
const TEST_NETWORK = "Test SDF Network ; September 2015";

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? value as Record<string, unknown>
    : null;
}

function walletError(error: unknown): Error {
  if (error instanceof Error) return error;
  const outer = record(error);
  const nested = record(outer?.error);
  const message = nested?.message ?? outer?.message ?? outer?.error ?? error;
  return new Error(typeof message === "string" && message ? message : "The wallet request failed.");
}

function checked(value: unknown): unknown {
  const error = record(value)?.error;
  if (error) throw walletError(error);
  return value;
}

function addressValue(value: unknown): string {
  checked(value);
  if (typeof value !== "string" || !ADDRESS_RE.test(value)) {
    throw new Error("The selected wallet did not return a valid account.");
  }
  return value;
}

function signedValue(value: unknown, address: string): string {
  checked(value);
  const response = record(value);
  const signer = response?.signerAddress;
  if (signer !== undefined && signer !== address) {
    throw new Error("The wallet signed with a different account. Reconnect your wallet.");
  }
  const xdr = response ? response.signedTxXdr : value;
  if (typeof xdr !== "string" || !xdr.trim()) {
    throw new Error("The wallet did not return a signed transaction.");
  }
  return xdr;
}

function browser(): Window & InjectedWallets {
  if (typeof window === "undefined") {
    throw new Error("Wallet extensions are available only in the browser.");
  }
  return window as Window & InjectedWallets;
}

function installed<T>(provider: T | undefined, id: ExtensionWalletId): T {
  if (!provider) {
    throw new Error(`${EXTENSION_WALLETS.find((wallet) => wallet.id === id)?.label ?? "Wallet"} is not installed.`);
  }
  return provider;
}

async function withXbull<T>(action: (bridge: import("@creit.tech/xbull-wallet-connect").xBullWalletConnect) => Promise<T>): Promise<T> {
  browser();
  const { xBullWalletConnect } = await import("@creit.tech/xbull-wallet-connect");
  const bridge = new xBullWalletConnect();
  try {
    return await action(bridge);
  } finally {
    bridge.closeConnections();
  }
}

async function lobstr() {
  browser();
  const { default: api } = await import("@lobstrco/signer-extension-api");
  if (!await api.isConnected()) throw new Error("LOBSTR is not installed or connected.");
  return api;
}

async function connect(id: ExtensionWalletId): Promise<string> {
  const wallet = browser();
  switch (id) {
    case "xbull":
      return withXbull(async (bridge) => addressValue(await bridge.connect()));
    case "rabet": {
      // Rabet injects later than the other extensions.
      await new Promise((resolve) => setTimeout(resolve, 100));
      const result = checked(await installed(wallet.rabet, id).connect());
      return addressValue(record(result)?.publicKey);
    }
    case "lobstr":
      return addressValue(await (await lobstr()).getPublicKey());
    case "hana":
      return addressValue(await installed(wallet.hanaWallet?.stellar, id).getPublicKey());
    case "klever": {
      const result = checked(await installed(wallet.kleverWallet?.stellar, id).getAddress());
      return addressValue(record(result)?.address);
    }
    case "BitgetWallet":
      return addressValue(await installed(wallet.bitkeep?.stellar, id).connect());
  }
}

export async function connectExtensionWallet(id: ExtensionWalletId): Promise<string> {
  try {
    if (!isExtensionWalletId(id)) throw new Error("Unknown wallet extension.");
    return await connect(id);
  } catch (error) {
    throw walletError(error);
  }
}

function checkNetwork(value: unknown, expected: string) {
  checked(value);
  const actual = record(value)?.networkPassphrase;
  if (typeof actual !== "string" || !actual) {
    throw new Error("The wallet did not return its network. Check the wallet network and reconnect.");
  }
  if (actual !== expected) {
    throw new Error("The wallet is on a different network. Switch networks and reconnect.");
  }
}

export async function signExtensionTransaction(
  id: ExtensionWalletId,
  xdr: string,
  address: string,
  networkPassphrase: string,
): Promise<string> {
  try {
    if (!isExtensionWalletId(id)) throw new Error("Unknown wallet extension.");
    addressValue(address);
    if (!networkPassphrase) throw new Error("A network passphrase is required to sign.");
    if (id === "rabet" && networkPassphrase !== PUBLIC_NETWORK && networkPassphrase !== TEST_NETWORK) {
      throw new Error("Rabet supports only the public and testnet Stellar networks.");
    }
    if (await connect(id) !== address) {
      throw new Error("The wallet account changed. Reconnect your wallet before signing.");
    }
    const wallet = browser();
    const options = { address, networkPassphrase };
    let result: unknown;
    switch (id) {
      case "xbull":
        result = await withXbull((bridge) => bridge.sign({ xdr, publicKey: address, network: networkPassphrase }));
        break;
      case "rabet": {
        const response = checked(await installed(wallet.rabet, id).sign(xdr, networkPassphrase === PUBLIC_NETWORK ? "mainnet" : "testnet"));
        result = record(response)?.xdr;
        break;
      }
      case "lobstr":
        // LOBSTR's genuine API accepts only XDR. The caller must validate
        // the resulting envelope against the requested account and network.
        result = await (await lobstr()).signTransaction(xdr);
        break;
      case "hana":
        result = await installed(wallet.hanaWallet?.stellar, id).signTransaction({ xdr, accountToSign: address, networkPassphrase });
        break;
      case "klever": {
        const provider = installed(wallet.kleverWallet?.stellar, id);
        if (provider.getNetwork) checkNetwork(await provider.getNetwork(), networkPassphrase);
        result = await provider.signTransaction(xdr, options);
        break;
      }
      case "BitgetWallet": {
        const provider = installed(wallet.bitkeep?.stellar, id);
        if (provider.network) checkNetwork(await provider.network(), networkPassphrase);
        result = await provider.signTransaction(xdr, options);
        break;
      }
    }
    return signedValue(result, address);
  } catch (error) {
    throw walletError(error);
  }
}
