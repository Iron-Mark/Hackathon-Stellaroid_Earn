"use client";

import { useState } from "react";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { useToast, Button } from "@/components/ui";
import { appConfig } from "@/lib/config";
import { DEFAULT_SAMPLE_PROOF_HASH } from "@/lib/demo-data";
import { bytesToHex } from "@/lib/hex";

export const DEMO_AUTOFILL_EVENT = "demo:autofill";

export interface DemoAutofillDetail {
  studentAddr: string;
  certHash: string;
  amount: string;
}

function generateCertHash(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

interface DemoAutofillButtonProps {
  registered?: boolean;
}

export function DemoAutofillButton({ registered = false }: DemoAutofillButtonProps) {
  const { wallet } = useFreighterWallet();
  const { toast } = useToast();
  const [filling, setFilling] = useState(false);

  if (registered) return null;

  async function handleClick() {
    if (!wallet.address || wallet.status !== "connected") {
      toast({
        title: "Connect Freighter first",
        detail: "Autofill uses your connected wallet as both issuer and student.",
        tone: "warning",
      });
      return;
    }

    setFilling(true);
    const certHash = appConfig.e2eMode ? DEFAULT_SAMPLE_PROOF_HASH : generateCertHash();

    // Brief delay so the animation feels intentional
    await new Promise<void>((r) => setTimeout(r, 400));

    window.dispatchEvent(
      new CustomEvent<DemoAutofillDetail>(DEMO_AUTOFILL_EVENT, {
        detail: {
          studentAddr: wallet.address,
          certHash,
          amount: "10",
        },
      }),
    );

    toast({
      title: "Fields filled",
      detail: `Hash ${certHash.slice(0, 8)}…${certHash.slice(-6)} · your wallet as student`,
      tone: "neutral",
    });

    setFilling(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => void handleClick()}
      disabled={filling}
      aria-label={filling ? "Filling fields…" : "Autofill form inputs"}
      title="Autofill form inputs"
      className="fixed right-[max(1.25rem,env(safe-area-inset-right))] bottom-5 max-lg:bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-50 rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.12)] border border-border bg-surface hover:shadow-[0_10px_24px_rgba(0,0,0,0.16)] hover:-translate-y-px gap-2"
    >
      {filling ? (
        <>
          <svg className="w-3 h-3 animate-spin text-primary shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Filling…
        </>
      ) : (
        <>
          <span
            className="w-2 h-2 rounded-full bg-accent shadow-[0_0_0_3px_rgba(99,102,241,0.2)] shrink-0"
            aria-hidden
          />
          Autofill
        </>
      )}
    </Button>
  );
}

export default DemoAutofillButton;
