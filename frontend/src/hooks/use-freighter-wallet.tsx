"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  connectWallet as connectWalletProvider,
  disconnectWallet as disconnectWalletProvider,
  listProviders,
  readWallet,
} from "@/lib/wallet";
import type { WalletProviderId, WalletProviderMeta } from "@/lib/wallet/types";
import type { WalletSnapshot } from "@/lib/types";

const initialWalletState: WalletSnapshot = {
  status: "disconnected",
  address: null,
  network: null,
  networkPassphrase: null,
  isExpectedNetwork: false,
};

export type FreighterWalletState = {
  wallet: WalletSnapshot;
  connectWallet: (providerId: WalletProviderId) => Promise<WalletSnapshot>;
  disconnectWallet: () => void;
  refreshWallet: () => Promise<WalletSnapshot>;
  isMobileBrowser: boolean;
  /** Every supported wallet. */
  providers: WalletProviderMeta[];
  /** Wallets usable in the current environment (web wallets always; extensions on desktop only). */
  availableProviders: WalletProviderMeta[];
  /** True when at least one cross-platform (web) wallet can be used here. */
  hasWebWallet: boolean;
  /** The provider backing the current connection, if any. */
  activeProvider: WalletProviderId | null;
};

const FreighterWalletContext = createContext<FreighterWalletState | null>(null);

function detectMobileBrowser() {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod|iemobile|opera mini/i.test(navigator.userAgent);
}

function useFreighterWalletState(): FreighterWalletState {
  const [wallet, setWallet] = useState<WalletSnapshot>(initialWalletState);
  const [isMobileBrowser, setIsMobileBrowser] = useState(false);

  const providers = useMemo(() => listProviders(), []);
  const availableProviders = useMemo(
    () => providers.filter((provider) => provider.kind === "web" || !isMobileBrowser),
    [providers, isMobileBrowser],
  );
  const hasWebWallet = useMemo(
    () => availableProviders.some((provider) => provider.kind === "web"),
    [availableProviders],
  );

  async function refreshWallet() {
    setWallet((current) => ({
      ...current,
      status: current.status === "unsupported" ? "unsupported" : "connecting",
    }));

    try {
      const snapshot = await readWallet();
      setWallet(snapshot);
      return snapshot;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to read wallet state.";
      const fallback: WalletSnapshot = {
        ...initialWalletState,
        status: "unsupported",
        error: message,
      };
      setWallet(fallback);
      return fallback;
    }
  }

  async function connectWallet(providerId: WalletProviderId) {
    setWallet((current) => ({ ...current, status: "connecting" }));
    try {
      const snapshot = await connectWalletProvider(providerId);
      setWallet(snapshot);
      return snapshot;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to connect wallet.";
      const fallback: WalletSnapshot = {
        ...initialWalletState,
        status: "disconnected",
        error: message,
      };
      setWallet(fallback);
      return fallback;
    }
  }

  function disconnectWallet() {
    disconnectWalletProvider();
    setWallet(initialWalletState);
  }

  useEffect(() => {
    setIsMobileBrowser(detectMobileBrowser());
    void refreshWallet();
  }, []);

  const activeProvider =
    wallet.status === "connected" &&
    (wallet.provider === "albedo" ||
      wallet.provider === "freighter" ||
      wallet.provider === "swk")
      ? wallet.provider
      : null;

  return {
    wallet,
    connectWallet,
    disconnectWallet,
    refreshWallet,
    isMobileBrowser,
    providers,
    availableProviders,
    hasWebWallet,
    activeProvider,
  };
}

export function FreighterWalletProvider({ children }: { children: ReactNode }) {
  const value = useFreighterWalletState();

  return (
    <FreighterWalletContext.Provider value={value}>
      {children}
    </FreighterWalletContext.Provider>
  );
}

export function useFreighterWallet() {
  const context = useContext(FreighterWalletContext);
  if (!context) {
    throw new Error("useFreighterWallet must be used within a FreighterWalletProvider.");
  }
  return context;
}

// Provider-agnostic alias for new code.
export const useWallet = useFreighterWallet;
