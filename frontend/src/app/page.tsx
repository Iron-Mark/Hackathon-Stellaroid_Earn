import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { appConfig } from "@/lib/config";
import { shortenAddress } from "@/lib/format";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/",
  title: "Stellaroid Earn — Proof & Payment on Stellar",
  description:
    "Bind certificate hashes on-chain, verify credentials, and pay graduates directly on Stellar testnet.",
  keywords:
    "stellar, soroban, credential verification, on-chain payroll, proof of work, bootcamp, talent hiring",
});
import { ActivitySnackbar } from "@/components/activity/activity-snackbar";
import { RecentActivity } from "@/components/activity/recent-activity";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { LocalizedHero } from "@/components/landing/localized-hero";
import { HeroBg } from "@/components/landing/hero-bg";
import { HeroOrbs } from "@/components/landing/hero-orbs";
import { JsonLd } from "@/components/ui/json-ld";
import { buildHowToJsonLd } from "@/lib/schema";
import { seoCanonicalUrl } from "@/lib/seo";

// Mirrors the visible "How it works" steps below — answer-engine / rich-result
// markup for "how to verify a credential and pay a graduate on Stellar".
const howToJsonLd = buildHowToJsonLd({
  name: "How to verify a credential and pay a graduate on Stellar",
  description:
    "Three on-chain actions bind proof and payment on Stellar: an issuer registers a certificate, an approved issuer verifies it, and the employer pays the graduate.",
  totalTime: "PT5S",
  url: `${seoCanonicalUrl("/")}#how-it-works`,
  steps: [
    {
      name: "Issuer registers a certificate",
      text: "A school or bootcamp drops a PDF, the browser computes its SHA-256 hash, and the issuer signs register_certificate binding the hash to the student's wallet. Duplicate hashes are rejected on-chain.",
    },
    {
      name: "Approved issuer verifies",
      text: "An approved issuer or the admin calls verify_certificate with the hash. The contract updates the credential status to Verified and emits cert_ver, proof anyone can audit on stellar.expert.",
    },
    {
      name: "Employer pays the graduate",
      text: "link_payment transfers XLM via the native Stellar Asset Contract directly to the student's verified wallet. Settlement is typically under five seconds and costs a fraction of a centavo.",
    },
  ],
});

export default function Landing() {
  const contractShort = appConfig.contractId
    ? shortenAddress(appConfig.contractId, 8)
    : "not configured";
  const contractUrl = appConfig.contractId
    ? `${appConfig.explorerUrl}/contract/${appConfig.contractId}`
    : appConfig.explorerUrl;

  return (
    <div className="relative min-h-dvh">
      <HeroBg />
      <HeroOrbs />
      <JsonLd data={howToJsonLd} />
      <SiteNav />
      <ActivitySnackbar>
        <RecentActivity compact sidebar bare />
      </ActivitySnackbar>
      <main id="main">
        <LocalizedHero />

        <section className="max-w-[1040px] mx-auto px-6 lg:hidden">
          <RecentActivity compact />
        </section>

        <section id="how-it-works" className="max-w-[1040px] mx-auto my-16 px-6 scroll-mt-24">
          <div className="text-center mb-8">
            <h2 className="text-[2rem] tracking-tight mb-2">How it works</h2>
            <p className="text-text-muted max-w-[580px] mx-auto">
              Three on-chain actions. Everything indexable on Stellar Expert.
            </p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
            <div className="bg-surface border border-border rounded-lg p-6">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[rgba(245,158,11,0.14)] text-primary font-pixel font-bold text-sm mb-3">
                1
              </div>
              <h3 className="mb-2 text-[1.0625rem]">Issuer registers a certificate</h3>
              <p className="m-0 text-text-muted leading-relaxed text-sm [&_code]:text-accent [&_code]:font-mono [&_code]:text-[13px]">
                A school or bootcamp drops a PDF, the browser computes its SHA-256 hash, and
                the issuer signs <code>register_certificate</code> binding the hash to the
                student&rsquo;s wallet. Duplicate hashes are rejected on-chain.
              </p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-6">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[rgba(245,158,11,0.14)] text-primary font-pixel font-bold text-sm mb-3">
                2
              </div>
              <h3 className="mb-2 text-[1.0625rem]">Approved issuer verifies</h3>
              <p className="m-0 text-text-muted leading-relaxed text-sm [&_code]:text-accent [&_code]:font-mono [&_code]:text-[13px]">
                An approved issuer or the admin calls <code>verify_certificate</code> with the
                hash. The contract updates the credential status to{" "}
                <code>Verified</code> and emits <code>cert_ver</code>, proof anyone can audit on
                stellar.expert.
              </p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-6">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[rgba(245,158,11,0.14)] text-primary font-pixel font-bold text-sm mb-3">
                3
              </div>
              <h3 className="mb-2 text-[1.0625rem]">Employer pays the grad</h3>
              <p className="m-0 text-text-muted leading-relaxed text-sm [&_code]:text-accent [&_code]:font-mono [&_code]:text-[13px]">
                <code>link_payment</code> transfers XLM via the native SAC directly to the
                student&rsquo;s verified wallet. Settlement is typically under five seconds and
                costs a fraction of a centavo.
              </p>
            </div>
          </div>
        </section>

        <section className="my-16 mx-auto max-w-[1040px] px-8 py-8 bg-linear-to-br from-[rgba(245,158,11,0.08)] to-[rgba(139,92,246,0.06)] border border-border rounded-xl grid gap-5">
          <div>
            <h2 className="mb-2 text-[1.375rem]">Verified Badge</h2>
            <p className="m-0 text-text-muted">
              Public, verifiable, no wallet required.
            </p>
          </div>
          <dl className="grid grid-cols-[max-content_1fr] gap-[10px_18px] text-sm items-center">
            <dt className="text-text-muted">Contract</dt>
            <dd className="m-0 font-mono text-[13px]">
              <a href={contractUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                {contractShort} <ExternalLink className="inline w-3 h-3 ml-1" />
              </a>
            </dd>
            <dt className="text-text-muted">Network</dt>
            <dd className="m-0 font-mono text-[13px]">{appConfig.network}</dd>
            <dt className="text-text-muted">Reward token</dt>
            <dd className="m-0 font-mono text-[13px]">{appConfig.assetCode} (native SAC)</dd>
            <dt className="text-text-muted">App</dt>
            <dd className="m-0 font-mono text-[13px]">
              <Link href="/app" className="text-primary hover:underline">
                stellaroid.tech/app
              </Link>
            </dd>
          </dl>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
