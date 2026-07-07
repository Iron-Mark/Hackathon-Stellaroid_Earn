import type { WalletSnapshot } from "@/lib/types";

export type WalletProviderId = "freighter" | "albedo";

// "extension" wallets need a desktop browser extension; "web" wallets run in
// any browser (including mobile) via a popup/redirect and need no install.
export type WalletProviderKind = "extension" | "web";

export type WalletProviderMeta = {
  id: WalletProviderId;
  label: string;
  kind: WalletProviderKind;
  tagline: string;
  installUrl?: string;
};

export interface WalletProviderModule extends WalletProviderMeta {
  /** Read the current connection without prompting the user. */
  read(): Promise<WalletSnapshot>;
  /** Prompt the user to connect; resolves to a connected snapshot or throws. */
  connect(): Promise<WalletSnapshot>;
  /** Sign a transaction XDR for `address`; resolves to the signed XDR. */
  sign(xdr: string, address: string): Promise<string>;
}
