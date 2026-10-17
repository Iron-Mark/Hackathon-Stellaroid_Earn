"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui";
import { EXTENSION_WALLETS } from "@/lib/wallet/extension-adapters";
import {
  subscribeExtensionModal, cancelExtensionSelection, selectExtensionWallet,
  type ExtensionModalState,
} from "@/lib/wallet/swk-provider";

/** Local chooser; approval stays inside the selected wallet. */
export function ExtensionWalletModal() {
  const [state, setState] = useState<ExtensionModalState>({ open: false, busy: null, error: null });
  useEffect(() => subscribeExtensionModal(setState), []);
  return (
    <Dialog open={state.open} onOpenChange={(open) => { if (!open) cancelExtensionSelection(); }}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-surface">
        <DialogHeader>
          <DialogTitle>Choose a Stellar wallet</DialogTitle>
          <DialogDescription>Choose your browser wallet, then approve its connection request.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2" aria-busy={Boolean(state.busy)}>
          {EXTENSION_WALLETS.map((wallet) => (
            <div key={wallet.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
              <button type="button" disabled={Boolean(state.busy)}
                onClick={() => { void selectExtensionWallet(wallet.id); }}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-md p-1 text-left font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50">
                <img src={wallet.icon} alt="" width={32} height={32} className="size-8 rounded-lg" />
                {wallet.label}
                {state.busy === wallet.id && <span className="text-xs font-normal text-muted-foreground">Waiting for approval...</span>}
              </button>
              <a href={wallet.installUrl} target="_blank" rel="noopener noreferrer"
                aria-label={`Get ${wallet.label}`} className="rounded px-2 py-1 text-xs text-muted-foreground underline underline-offset-4">Get wallet</a>
            </div>
          ))}
        </div>
        {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
        <button type="button" onClick={cancelExtensionSelection} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
      </DialogContent>
    </Dialog>
  );
}
