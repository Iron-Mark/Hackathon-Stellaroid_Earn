"use client";

import { AppShell } from "@/components/layout/app-shell";
import { RpcStatusPill } from "@/components/layout/rpc-status-pill";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";
import { NetworkBanner } from "@/components/app/network-banner";
import { WalletEmptyState } from "@/components/app/wallet-empty-state";
import { BatchIssuanceForm } from "@/components/issuer/batch-issuance-form";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";

export function BatchIssuanceExperience() {
  const { wallet, isMobileBrowser, hasWebWallet } = useFreighterWallet();
  const showWalletEmptyState =
    !hasWebWallet && (isMobileBrowser || wallet.status === "unsupported");

  return (
    <AppShell rpcPill={<RpcStatusPill />} walletButton={<WalletConnectButton />}>
      <div className="flex flex-col gap-6">
        <NetworkBanner wallet={wallet} />
        {showWalletEmptyState ? (
          <WalletEmptyState
            mode={isMobileBrowser ? "desktop-only" : "install-extension"}
          />
        ) : (
          <BatchIssuanceForm />
        )}
      </div>
    </AppShell>
  );
}
