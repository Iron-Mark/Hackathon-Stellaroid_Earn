import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Globe } from "lucide-react";
import { appConfig } from "@/lib/config";
import { FooterTagline } from "@/components/layout/footer-tagline";
import { FooterProgramLink } from "@/components/layout/footer-program-link";
import { LocaleToggle } from "@/components/layout/locale-toggle";
import { SITE_CONTRACT_SOURCE_URL, SITE_REPOSITORY_URL, SITE_RISE_EVENT_URL } from "@/lib/seo";

export function SiteFooter() {
  const contractUrl = appConfig.contractId
    ? `${appConfig.explorerUrl}/contract/${appConfig.contractId}`
    : appConfig.explorerUrl;

  return (
    <footer className={[
      "relative mt-20 overflow-hidden",
      "border-t border-border-glass bg-surface-glass",
      /* amber hairline at top — mirrors the nav hairline */
      "before:absolute before:inset-x-0 before:top-0 before:h-px",
      "before:bg-linear-to-r before:from-transparent before:via-primary/60 before:to-transparent",
    ].join(" ")}>

      {/* Ambient horizon glow */}
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 h-40"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(245,158,11,0.07), transparent)" }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/*
          Responsive column layout:
          xs (< 640px)   — flex-col: brand full-width, nav groups in 2-col grid below
          sm (640–1023px) — flex-col: brand full-width, nav groups in 3-col flex row below
          lg (1024px+)   — flex-row justify-between: all 4 columns in one row
                           (lg:contents dissolves the nav wrapper so the 3 navs join the
                            outer flex row as direct siblings of the brand column)
        */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">

          {/* Brand */}
          <div className="flex flex-col gap-4 max-w-[280px] lg:shrink-0">
            <Link
              href="/"
              prefetch={false}
              aria-label="Stellaroid Earn — home"
              className="inline-flex items-center gap-2.5 no-underline hover:opacity-80 transition-opacity w-fit"
            >
              <Image src="/logo.svg" alt="" width={26} height={26} />
              <span className="font-heading text-text font-semibold text-[15px]">Stellaroid Earn</span>
            </Link>
            <div className="text-[13px] text-text-muted leading-relaxed">
              <FooterTagline />
            </div>
          </div>

          {/* Nav wrapper — 2-col grid on xs, 3-col flex row on sm, dissolves at lg */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:flex sm:flex-row sm:gap-10 lg:contents">

            {/* Site */}
            <nav aria-label="Site links" className="grid grid-cols-2 gap-x-7 text-[13px]">
              <h2 className="col-span-2 font-pixel text-[11px] font-medium text-primary uppercase tracking-widest mb-3">Site</h2>
              <Link href="/" prefetch={false} className="py-1.5 text-text-muted hover:text-text transition-colors no-underline">Home</Link>
              <Link href="/app" prefetch={false} className="py-1.5 text-text-muted hover:text-text transition-colors no-underline">App</Link>
              <Link href="/proof" prefetch={false} className="py-1.5 text-text-muted hover:text-text transition-colors no-underline">Verify</Link>
              <Link href="/issuer" prefetch={false} className="py-1.5 text-text-muted hover:text-text transition-colors no-underline">Issuer</Link>
              <Link href="/about" prefetch={false} className="py-1.5 text-text-muted hover:text-text transition-colors no-underline">About</Link>
              <Link href="/employer" prefetch={false} className="py-1.5 text-text-muted hover:text-text transition-colors no-underline">Employer</Link>
              <Link href="/pilot" prefetch={false} className="py-1.5 text-text-muted hover:text-text transition-colors no-underline">Pilot</Link>
              <Link href="/status" prefetch={false} className="py-1.5 text-text-muted hover:text-text transition-colors no-underline">Status</Link>
              <Link href="/demo" prefetch={false} className="py-1.5 text-text-muted hover:text-text transition-colors no-underline">Demo</Link>
              <Link href="/contact" prefetch={false} className="py-1.5 text-text-muted hover:text-text transition-colors no-underline">Contact</Link>
            </nav>

            {/* Learn */}
            <nav aria-label="Learn links" className="flex flex-col text-[13px]">
              <h2 className="font-pixel text-[11px] font-medium text-primary uppercase tracking-widest mb-3">Learn</h2>
              <Link href="/docs" prefetch={false} className="py-1.5 text-text-muted hover:text-text transition-colors no-underline">Docs</Link>
              <Link href="/guides" prefetch={false} className="py-1.5 text-text-muted hover:text-text transition-colors no-underline">Guides</Link>
              <Link href="/glossary" prefetch={false} className="py-1.5 text-text-muted hover:text-text transition-colors no-underline">Glossary</Link>
              <Link href="/verify-bootcamp-certificate" prefetch={false} className="py-1.5 text-text-muted hover:text-text transition-colors no-underline">For bootcamps</Link>
              <Link href="/verify-candidate-credentials" prefetch={false} className="py-1.5 text-text-muted hover:text-text transition-colors no-underline">For employers</Link>
              <Link href="/instant-payouts" prefetch={false} className="py-1.5 text-text-muted hover:text-text transition-colors no-underline">Instant payouts</Link>
            </nav>

            {/* On-chain */}
            <nav aria-label="On-chain links" className="flex flex-col text-[13px]">
              <h2 className="font-pixel text-[11px] font-medium text-primary uppercase tracking-widest mb-3">On-chain</h2>
              <a href={contractUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 py-1.5 text-text-muted hover:text-primary transition-colors no-underline">
                Contract on stellar.expert
                <span className="visually-hidden"> (opens in new tab)</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-50" aria-hidden="true" />
              </a>
              <a href="https://stellar.expert/explorer/testnet" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 py-1.5 text-text-muted hover:text-primary transition-colors no-underline">
                Testnet explorer
                <span className="visually-hidden"> (opens in new tab)</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-50" aria-hidden="true" />
              </a>
              <a href="https://developers.stellar.org" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 py-1.5 text-text-muted hover:text-primary transition-colors no-underline">
                Stellar docs
                <span className="visually-hidden"> (opens in new tab)</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-50" aria-hidden="true" />
              </a>
              <Link href="/status#metrics" prefetch={false} className="py-1.5 text-text-muted hover:text-primary transition-colors no-underline">Metrics</Link>
              <Link href="/slides" prefetch={false} className="py-1.5 text-text-muted hover:text-primary transition-colors no-underline">Demo Presentation</Link>
            </nav>

            {/* Source */}
            <nav aria-label="Source links" className="flex flex-col text-[13px]">
              <h2 className="font-pixel text-[11px] font-medium text-primary uppercase tracking-widest mb-3">Source</h2>
              <a href={SITE_REPOSITORY_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 py-1.5 text-text-muted hover:text-text transition-colors no-underline">
                GitHub
                <span className="visually-hidden"> (opens in new tab)</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-50" aria-hidden="true" />
              </a>
              <a href={SITE_CONTRACT_SOURCE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 py-1.5 text-text-muted hover:text-text transition-colors no-underline">
                Contract source
                <span className="visually-hidden"> (opens in new tab)</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-50" aria-hidden="true" />
              </a>
              <a href={SITE_RISE_EVENT_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 py-1.5 text-text-muted hover:text-text transition-colors no-underline">
                Rise In
                <span className="visually-hidden"> (opens in new tab)</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-50" aria-hidden="true" />
              </a>
            </nav>

          </div>
        </div>

        {/* Pilot CTA strip — the one conversion ask on every page. */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/[0.06] px-5 py-4">
          <p className="m-0 text-sm text-text">
            Running a bootcamp or hiring? Pilots are free and testnet-only.
          </p>
          <Link
            href="/pilot#request"
            prefetch={false}
            className="inline-flex min-h-10 items-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary no-underline transition-colors hover:bg-primary-hover"
          >
            Request a testnet pilot →
          </Link>
        </div>

        {/* Bottom bar — stay stacked through tablet widths so attribution never collides. */}
        <div className="mt-8 grid gap-3 border-t border-border-glass pt-5 pr-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-6 lg:pr-0">
          <FooterProgramLink year={new Date().getFullYear()} />
          <div className="grid min-w-0 justify-items-start gap-2 sm:grid-cols-[auto_auto] sm:items-center sm:gap-x-4 lg:flex lg:flex-wrap lg:justify-end lg:gap-y-2">
            <a
              href="https://marksiazon.dev"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 whitespace-nowrap py-1 text-xs text-text-muted hover:text-primary transition-colors no-underline"
            >
              <Globe className="w-3 h-3 opacity-70" aria-hidden="true" />
              Solo developed by Mark Siazon
              <span className="visually-hidden"> (opens in new tab)</span>
            </a>
            <span className="whitespace-nowrap font-pixel text-[10px] text-text-muted/70 uppercase tracking-widest select-none" aria-hidden="true">
              Built on Stellar testnet
            </span>
            <Link
              href="/privacy"
              prefetch={false}
              className="whitespace-nowrap py-1 text-xs text-text-muted hover:text-text transition-colors no-underline"
            >
              Privacy &amp; terms
            </Link>
            <LocaleToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
