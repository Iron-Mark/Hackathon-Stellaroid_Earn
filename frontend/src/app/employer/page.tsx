import { FreighterWalletProvider } from "@/hooks/use-freighter-wallet";
import { AppShell } from "@/components/layout/app-shell";
import { RpcStatusPill } from "@/components/layout/rpc-status-pill";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";
import { EmployerOpportunityForm } from "@/components/employer/employer-opportunity-form";
import { PayoutLinkForm } from "@/components/actions/payout-link-form";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/employer",
  title: "Employer · Stellaroid Earn",
  description:
    "Create and fund escrowed paid trials for verified candidates on Stellar testnet.",
});

interface EmployerPageProps {
  searchParams?: Promise<{
    hash?: string;
    candidate?: string;
  }>;
}

export default async function EmployerPage({ searchParams }: EmployerPageProps) {
  const params = await searchParams;
  const initialHash = params?.hash ?? "";
  const initialCandidate = params?.candidate ?? "";

  return (
    <FreighterWalletProvider>
      <AppShell
        rpcPill={<RpcStatusPill />}
        walletButton={<WalletConnectButton />}
      >
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
              Employer console
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-text">
              Fund a paid trial
            </h1>
            <p className="mt-2 max-w-[720px] text-sm text-text-muted">
              Look up a verified credential, then create an escrowed opportunity.
              Funds are locked until you approve the candidate&apos;s milestones and release payment.
            </p>
          </section>
          <EmployerOpportunityForm
            initialHash={initialHash}
            initialCandidate={initialCandidate}
          />
          <PayoutLinkForm
            initialHash={initialHash}
            initialRecipient={initialCandidate}
          />
        </div>
      </AppShell>
    </FreighterWalletProvider>
  );
}
