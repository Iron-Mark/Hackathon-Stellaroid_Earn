import { FreighterWalletProvider } from "@/hooks/use-freighter-wallet";
import { AppShell } from "@/components/layout/app-shell";
import { RpcStatusPill } from "@/components/layout/rpc-status-pill";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";
import { EmployerOpportunityForm } from "@/components/employer/employer-opportunity-form";
import { JsonLd } from "@/components/ui/json-ld";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { buildBreadcrumbJsonLd } from "@/lib/schema";

const employerBreadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Hire", path: "/employer" },
]);

export const metadata: Metadata = buildPageMetadata({
  path: "/employer",
  title: "Hire verified graduates",
  description:
    "Review a graduate's on-chain verified credential and fund an escrowed paid trial in XLM on Stellar testnet — no invoices, no platform fee, settlement in seconds.",
});

interface EmployerPageProps {
  searchParams?: Promise<{
    hash?: string | string[];
    candidate?: string | string[];
  }>;
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EmployerPage({ searchParams }: EmployerPageProps) {
  const params = await searchParams;
  const initialHash = firstSearchParam(params?.hash) ?? "";
  const initialCandidate = firstSearchParam(params?.candidate) ?? "";

  return (
    <FreighterWalletProvider>
      <AppShell
        rpcPill={<RpcStatusPill />}
        walletButton={<WalletConnectButton />}
      >
        <div className="flex flex-col gap-6">
          <JsonLd data={employerBreadcrumbJsonLd} />
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
        </div>
      </AppShell>
    </FreighterWalletProvider>
  );
}
