"use client";
import { useCallback } from "react";
import { FreighterWalletProvider, useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { useStartFlow } from "./use-start-flow";
import { WelcomeStep } from "@/components/start/welcome-step";
import { ConnectStep } from "@/components/start/connect-step";
import { FundStep } from "@/components/start/fund-step";
import { ActionStep } from "@/components/start/action-step";
import { SigningStep } from "@/components/start/signing-step";
import { SuccessStep } from "@/components/start/success-step";

function StartFlow() {
  const [state, dispatch] = useStartFlow();
  const { wallet } = useFreighterWallet();

  const onStart = useCallback(() => dispatch({ type: "START" }), [dispatch]);
  const onConnected = useCallback(() => dispatch({ type: "CONNECTED" }), [dispatch]);
  const onFunded = useCallback(() => dispatch({ type: "FUNDED" }), [dispatch]);
  const onDoAnother = useCallback(() => dispatch({ type: "RESET" }), [dispatch]);

  return (
    <>
      <SiteNav />
      <main id="main" className="mx-auto w-full max-w-3xl px-6 py-12">
        {state.step === "welcome" && <WelcomeStep onStart={onStart} />}
        {state.step === "connect" && <ConnectStep onConnected={onConnected} />}
        {state.step === "fund" && <FundStep onFunded={onFunded} />}
        {state.step === "action" && <ActionStep state={state} dispatch={dispatch} />}
        {state.step === "signing" && <SigningStep />}
        {state.step === "success" && state.txHash && wallet.address && (
          <SuccessStep
            txHash={state.txHash}
            address={wallet.address}
            onDoAnother={onDoAnother}
          />
        )}
      </main>
      <SiteFooter />
    </>
  );
}

export default function StartPage() {
  return (
    <FreighterWalletProvider>
      <StartFlow />
    </FreighterWalletProvider>
  );
}
