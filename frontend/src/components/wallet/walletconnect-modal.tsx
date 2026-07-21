"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import {
  subscribeWalletConnectModal,
  cancelWalletConnect,
  type WalletConnectModalState,
} from "@/lib/wallet/walletconnect-provider";

/**
 * Renders the WalletConnect pairing UI. It subscribes to the provider's modal
 * store: connect() publishes the `wc:` pairing URI here, and closing the dialog
 * (X, backdrop, Esc) cancels the in-flight connection. The QR is generated
 * locally into a data URL, so no external image host is added to the CSP.
 *
 * Mount once, high in the tree (see FreighterWalletProvider).
 */
export function WalletConnectModal() {
  const [state, setState] = useState<WalletConnectModalState>({
    open: false,
    uri: null,
  });
  const [qr, setQr] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => subscribeWalletConnectModal(setState), []);

  useEffect(() => {
    setIsMobile(/android|iphone|ipad|ipod|iemobile/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    let active = true;
    if (!state.uri) {
      setQr(null);
      return;
    }
    const uri = state.uri;
    // Lazy-load qrcode so it stays out of the main bundle until a WalletConnect
    // pairing is actually started. The data URL keeps the image CSP-clean.
    void import("qrcode").then(({ default: QRCode }) =>
      QRCode.toDataURL(uri, { width: 240, margin: 1, errorCorrectionLevel: "M" })
        .then((url) => {
          if (active) setQr(url);
        })
        .catch(() => {
          if (active) setQr(null);
        }),
    );
    return () => {
      active = false;
    };
  }, [state.uri]);

  function handleCopy() {
    if (!state.uri) return;
    navigator.clipboard.writeText(state.uri).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Dialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) cancelWalletConnect();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Connect with WalletConnect</DialogTitle>
          <DialogDescription>
            {isMobile
              ? "Open your Stellar wallet app to approve the connection."
              : "Scan this code with LOBSTR, xBull, Hana, Freighter, or any WalletConnect wallet."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {qr ? (
            <img
              src={qr}
              width={240}
              height={240}
              alt="WalletConnect pairing QR code"
              className="rounded-xl bg-white p-2 shadow-sm"
            />
          ) : (
            <div className="h-[240px] w-[240px] animate-pulse rounded-xl bg-muted" />
          )}

          {isMobile && state.uri ? (
            <a
              href={state.uri}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Open in wallet app
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : null}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                Link copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Copy connection link
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WalletConnectModal;
