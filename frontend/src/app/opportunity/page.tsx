import type { Metadata } from "next";
import Link from "next/link";
import { listOpportunitiesServer } from "@/lib/contract-read-server";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { FreighterWalletProvider } from "@/hooks/use-freighter-wallet";
import { OpportunityDirectory } from "@/components/opportunity/opportunity-directory";
import { JsonLd } from "@/components/ui/json-ld";
import { buildPageMetadata } from "@/lib/seo";
import { buildBreadcrumbJsonLd } from "@/lib/schema";
import type { OpportunityRecord } from "@/lib/types";

export const revalidate = 60;

const breadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Opportunities", path: "/opportunity" },
]);

export const metadata: Metadata = buildPageMetadata({
  path: "/opportunity",
  title: "Opportunities — escrowed paid trials",
  description:
    "Browse every live escrowed paid trial on the Stellaroid Earn testnet contract: funded milestones, submitted work, and released XLM payouts.",
  keywords:
    "stellar opportunities, escrowed paid trial, milestone escrow, XLM payout, Stellar testnet",
});

export default async function OpportunityIndexPage() {
  let opportunities: OpportunityRecord[] | null = null;
  try {
    opportunities = await listOpportunitiesServer();
  } catch {
    opportunities = null;
  }

  return (
    <FreighterWalletProvider>
      <SiteNav />
      <main id="main" className="mx-auto w-full max-w-4xl px-6 py-12">
        <JsonLd data={breadcrumbJsonLd} />
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
            Escrow registry
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-text">
            Opportunities
          </h1>
          <p className="mt-2 max-w-[720px] text-sm text-text-muted">
            Every paid trial escrowed on the Stellaroid Earn testnet contract.
            Candidates submit milestones, employers approve and release —
            all of it publicly auditable on-chain.
          </p>
        </header>

        {opportunities === null ? (
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text">
              Could not reach the Stellar RPC
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              The opportunity registry is read live from Stellar testnet and
              the RPC did not respond. Try again in a moment, or check the
              network status.
            </p>
            <Link
              href="/status"
              className="mt-4 inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold text-text no-underline transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              View network status
            </Link>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text">
              No opportunities yet
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              Be the first: look up a verified credential and fund an escrowed
              paid trial, or take the guided demo to see how the flow works.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/employer"
                className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary no-underline transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-primary"
              >
                Fund a paid trial
              </Link>
              <Link
                href="/demo"
                className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold text-text no-underline transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
              >
                Take the guided demo
              </Link>
            </div>
          </div>
        ) : (
          <OpportunityDirectory opportunities={opportunities} />
        )}
      </main>
      <SiteFooter />
    </FreighterWalletProvider>
  );
}
