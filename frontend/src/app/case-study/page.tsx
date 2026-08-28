import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { JsonLd } from "@/components/ui/json-ld";
import { CopyButton } from "@/components/ui/copy-button";
import { appConfig } from "@/lib/config";
import {
  buildPageMetadata,
  seoCanonicalUrl,
  SITE_AUTHOR_NAME,
  SITE_AUTHOR_URL,
  SITE_CANONICAL_URL,
  SITE_REPOSITORY_URL,
} from "@/lib/seo";

// Traffic figures below are a dated snapshot from the Vercel Web Analytics
// API (production, April to August 2026), transcribed 2026-08-27. They are
// deliberately NOT live reads: the case study describes what the data showed
// at capture time. An earlier dashboard read on 2026-07-30 was 342 visitors
// and 1,615 page views. On-chain counts carry their as-of date inline and
// point readers at /status for current values.
const PUBLISHED = "2026-07-30";
const FIGURES_AS_OF = "2026-08-27";
const DEPLOYED_WASM_HASH =
  "1b7479f1ca0f12846bbfdd8f0681670692e29e1f20618150912f010b7caf4b9f";

export const metadata: Metadata = buildPageMetadata({
  path: "/case-study",
  title: "Case Study",
  description:
    "How I built and verified a credential and escrow system on Stellar testnet: reproducible WASM builds, wallet-free proof pages, and the claims I caught and corrected.",
  openGraphType: "article",
});

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_CANONICAL_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Case Study",
      item: `${SITE_CANONICAL_URL}/case-study`,
    },
  ],
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "A credential and escrow system where every claim is checkable",
  description:
    "How I built and verified a credential and escrow system on Stellar testnet: reproducible WASM builds, wallet-free proof pages, and the claims I caught and corrected.",
  url: seoCanonicalUrl("/case-study"),
  mainEntityOfPage: { "@type": "WebPage", "@id": seoCanonicalUrl("/case-study") },
  image: seoCanonicalUrl("/opengraph-image"),
  datePublished: PUBLISHED,
  dateModified: FIGURES_AS_OF,
  author: { "@type": "Person", name: SITE_AUTHOR_NAME, url: SITE_AUTHOR_URL },
};

const CONTENTS = [
  { href: "#outcome", label: "The outcome" },
  { href: "#problem", label: "The problem" },
  { href: "#built", label: "What I built" },
  { href: "#data", label: "What the data showed" },
  { href: "#reproducible", label: "Reproducible builds" },
  { href: "#wrong", label: "What I caught and corrected" },
  { href: "#count", label: "How I count users" },
  { href: "#verify", label: "Check every claim" },
];

const TRAFFIC = [
  { month: "April 2026", visitors: "66", views: "274" },
  { month: "May 2026", visitors: "111", views: "699" },
  { month: "June 2026", visitors: "44", views: "176" },
  { month: "July 2026", visitors: "123", views: "480" },
  { month: "August 2026", visitors: "38", views: "53" },
];

const FLOW = [
  { n: "01", t: "Register", s: "Approved issuer anchors a credential hash" },
  { n: "02", t: "Verify", s: "Issuer marks it verified on chain" },
  { n: "03", t: "Read", s: "Anyone opens the proof page, no wallet" },
  { n: "04", t: "Fund", s: "Employer escrows testnet XLM against it" },
  { n: "05", t: "Approve", s: "Graduate submits, employer approves" },
  { n: "06", t: "Release", s: "Contract releases the escrow" },
];

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-mt-24 text-balance text-2xl font-bold tracking-tight text-text sm:text-3xl"
    >
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-8 text-balance text-lg font-semibold tracking-tight text-text sm:text-xl">
      {children}
    </h3>
  );
}

function Pull({ children }: { children: React.ReactNode }) {
  return (
    <p className="my-6 max-w-xl border-l-2 border-primary pl-5 text-lg font-medium leading-snug text-text sm:text-xl">
      {children}
    </p>
  );
}

export default function CaseStudyPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={articleJsonLd} />

      <div className="min-h-screen bg-bg">
        <SiteNav />

        <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
          <header>
            <p className="m-0 text-xs font-medium uppercase tracking-[0.14em] text-primary">
              Case study · Solo build
            </p>
            <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-text sm:text-5xl">
              A credential and escrow system where every claim is checkable
            </h1>
            <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-text-muted">
              <span className="font-semibold text-text">{SITE_AUTHOR_NAME}</span>
              <span>Stellaroid Earn</span>
              <span>Stellar testnet</span>
              <span>Published 30 July 2026</span>
              <span aria-hidden="true">·</span>
              <span>Figures refreshed 27 August 2026</span>
            </p>

            <nav
              aria-label="Contents"
              className="mt-8 rounded-xl border border-border bg-surface p-5"
            >
              <p className="m-0 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-text-muted">
                Contents
              </p>
              <ol className="mt-3 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
                {CONTENTS.map((item, i) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-baseline gap-2.5 text-sm text-text hover:text-primary"
                    >
                      <span className="font-mono text-[0.7rem] text-primary">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          </header>

          <section className="mt-14 flex flex-col gap-4">
            <SectionHeading id="outcome">
              Outcome: the credential page became the second most visited part of the
              site
            </SectionHeading>
            <p className="text-lg leading-relaxed text-text">
              I built a system that anchors a training credential on Stellar and
              releases payment against it, then put it in front of real people. In the
              five months from April to August 2026,{" "}
              <strong>
                49 visitors opened one specific public credential page and 44 opened
                the proof index
              </strong>
              , second only to the landing page at 329 visitors.
            </p>
            <p className="text-text-muted">
              The whole premise rests on one bet: a credential is only worth anchoring
              if someone will actually open it. The traffic says they do.
            </p>
            <p className="text-text-muted">
              The contract behind those pages rebuilds byte for byte from release tag{" "}
              <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-sm">
                v3.0.0
              </code>
              , and a weekly CI job re-checks it against live testnet bytecode.
            </p>
            <div className="rounded-lg border border-border border-l-2 border-l-success bg-surface p-4">
              <p className="m-0 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-text-muted">
                Placement
              </p>
              <p className="m-0 mt-1.5 font-mono text-sm text-text">
                Top 5 of 105 participants, Rise In Stellar Smart Contract Bootcamp
              </p>
            </div>
          </section>

          <section className="mt-14 flex flex-col gap-4">
            <SectionHeading id="problem">The problem</SectionHeading>
            <p className="text-text-muted">
              A bootcamp graduate finishes a course and gets a PDF certificate. An
              employer has no cheap way to check it is real. So the graduate re-proves
              the same skills through unpaid trial work, and the employer pays for
              verification with their own time.
            </p>
            <p className="text-text-muted">Two failures sit underneath:</p>
            <ol className="m-0 flex list-decimal flex-col gap-2 pl-6 text-text-muted">
              <li>
                The credential is not independently checkable. Verifying it means
                trusting the issuer, or emailing them.
              </li>
              <li>
                Proof and payment are unrelated. Nothing ties &ldquo;this person is
                qualified&rdquo; to &ldquo;this person got paid for the work&rdquo;.
              </li>
            </ol>
          </section>

          <section className="mt-14 flex flex-col gap-4">
            <SectionHeading id="built">What I built</SectionHeading>
            <p className="text-text-muted">
              A Soroban smart contract on Stellar testnet with 19 public functions
              covering the full path: an issuer registry with admin approval,
              credential registration and verification, and an escrow for paid trials
              with milestone approval and release.
            </p>

            <ol className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3 lg:grid-cols-6">
              {FLOW.map((step) => (
                <li
                  key={step.n}
                  className="rounded-lg border border-border border-t-2 border-t-primary bg-surface p-3"
                >
                  <span className="block font-mono text-[0.65rem] tracking-[0.12em] text-primary">
                    {step.n}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-text">
                    {step.t}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-text-muted">
                    {step.s}
                  </span>
                </li>
              ))}
            </ol>

            <p className="text-text-muted">
              Around it, a Next.js 16 application with four properties I cared about
              more than features.
            </p>

            <SubHeading>Proof pages need no wallet</SubHeading>
            <p className="text-text-muted">
              A credential lives at a public URL keyed by its SHA-256 hash. An
              employer opens it, reads the status straight from chain, and installs
              nothing.
            </p>

            <SubHeading>Payment is escrowed, not promised</SubHeading>
            <p className="text-text-muted">
              An employer funds an opportunity against a verified credential. The
              graduate submits a milestone, the employer approves, and the contract
              releases the testnet XLM. Money and proof move through the same record.
            </p>
            <p className="text-text-muted">
              All amounts are Stellar testnet XLM and carry no monetary value. Testnet
              removes the financial risk. The mechanics are still real: authorization
              checks, state transitions and the settlement path all execute exactly as
              they would on a live network.
            </p>

            <SubHeading>Two wallets natively, six more through a kit</SubHeading>
            <p className="text-text-muted">
              Freighter and Albedo directly, plus LOBSTR, xBull, Hana, Rabet, Klever
              and Bitget through Stellar Wallets Kit. All behind one provider
              interface, lazy loaded so the multi-megabyte SDK stays out of first
              load.
            </p>

            <SubHeading>A read-only MCP server for agents</SubHeading>
            <p className="text-text-muted">
              <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-sm">
                /api/mcp
              </code>{" "}
              exposes six tools, so an AI agent can query credentials and escrows
              straight from chain with no wallet, login or API key. First-party
              dependencies only, rate limited at the edge, covered by 14 end-to-end
              tests.
            </p>
          </section>

          <section className="mt-14 flex flex-col gap-4">
            <SectionHeading id="data">What the data showed</SectionHeading>
            <p className="text-text-muted">
              The site went live in March 2026. The first recorded visitors arrived in
              April; every earlier month is zero. Figures are from Vercel Web
              Analytics, production.
            </p>

            <div className="overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full border-collapse text-sm">
                <caption className="p-4 pb-2 text-left font-mono text-[0.65rem] uppercase tracking-[0.14em] text-text-muted">
                  Traffic, April to August 2026
                </caption>
                <thead>
                  <tr className="border-t border-border">
                    <th className="px-4 py-2.5 text-left font-mono text-[0.65rem] font-medium uppercase tracking-[0.1em] text-text-muted">
                      Month
                    </th>
                    <th className="px-4 py-2.5 text-right font-mono text-[0.65rem] font-medium uppercase tracking-[0.1em] text-text-muted">
                      Visitors
                    </th>
                    <th className="px-4 py-2.5 text-right font-mono text-[0.65rem] font-medium uppercase tracking-[0.1em] text-text-muted">
                      Page views
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TRAFFIC.map((row) => (
                    <tr key={row.month} className="border-t border-border">
                      <td className="px-4 py-2.5 text-text">{row.month}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-text">
                        {row.visitors}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-text">
                        {row.views}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-border font-semibold">
                    <td className="px-4 py-2.5 text-text">Total</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-primary">
                      382
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-primary">
                      1,682
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-text-muted">
              One visitor can open several pages, so the per-page figures below do not
              sum to 382.
            </p>

            <SubHeading>Proof pages were the draw</SubHeading>
            <p className="text-text-muted">
              49 visitors on one specific credential page, 44 on the proof index,
              against 329 for the landing page.
            </p>
            <Pull>
              I stopped treating proof pages as an output and started treating them as
              the product, which is why they became crawlable, shareable and
              embeddable.
            </Pull>

            <SubHeading>A third of traffic was mobile</SubHeading>
            <p className="text-text-muted">
              28% mobile and 2% tablet, which lines up with the 30% running Android or
              iOS. I had been building desktop first. That number is why the app got
              app-style bottom navigation, bottom-sheet dialogs, safe-area handling
              for notches, and became an installable progressive web app.
            </p>

            <SubHeading>Where the traffic came from</SubHeading>
            <p className="text-text-muted">
              19 visitors arrived from Google. Facebook and Messenger sent 49 between
              them. The audience skewed Philippines at 46% and United States at 36%,
              which is the direct reason Tagalog shipped alongside English. The other
              four locales are a forward-looking bet, ready ahead of the data.
            </p>
          </section>

          <section className="mt-14 flex flex-col gap-4">
            <SectionHeading id="reproducible">
              Reproducible builds: verifying the deployed WASM hash yourself
            </SectionHeading>
            <p className="text-text-muted">
              I wanted the deployment claim to be something a stranger could confirm
              without trusting me.
            </p>

            <SubHeading>The deployed bytecode attests its own toolchain</SubHeading>
            <p className="text-text-muted">
              The contract records{" "}
              <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-sm">
                rsver 1.95.0
              </code>
              ,{" "}
              <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-sm">
                rssdkver 26.1.0
              </code>{" "}
              and{" "}
              <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-sm">
                cliver 27.0.0
              </code>{" "}
              in its own metadata. Read it with{" "}
              <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-sm">
                stellar contract info meta
              </code>{" "}
              and you learn how it was built without reading my documentation.
            </p>

            <SubHeading>Tag v3.0.0 rebuilds to the live hash, and CI checks it weekly</SubHeading>
            <div className="rounded-lg border border-border border-l-2 border-l-success bg-surface p-4">
              <p className="m-0 flex items-center justify-between gap-2 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-text-muted">
                Deployed WASM hash
                <CopyButton value={DEPLOYED_WASM_HASH} ariaLabel="Copy WASM hash" />
              </p>
              <p className="m-0 mt-1.5 break-all font-mono text-sm text-text">
                {DEPLOYED_WASM_HASH}
              </p>
            </div>
            <p className="text-text-muted">
              Tag{" "}
              <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-sm">
                v3.0.0
              </code>{" "}
              rebuilds to that hash, which is what is live on testnet. A CI job
              re-runs the rebuild weekly and compares it against bytecode fetched from
              the network.
            </p>
            <Pull>So the claim rots loudly instead of quietly.</Pull>

            <SubHeading>Reproducibility verifies against a tag, never a branch</SubHeading>
            <p className="text-text-muted">
              Reproducibility broke and I assumed the claim had been false. It had
              not. It was aimed at the wrong commit. The source was byte-identical to
              the tag, but the crate had moved directory and a dependency bump had
              landed after deployment. Either change alone alters the emitted WASM.
              Deployed artifacts verify against the tag they were built from, never
              against a moving branch.
            </p>

            <SubHeading>
              The same source builds to a different hash on Windows and Linux
            </SubHeading>
            <p className="text-text-muted">
              Identical source, identical Rust 1.95.0, identical Stellar CLI 27.0.0,
              and the emitted WASM hash still differs by host operating system. The
              deploy happened on Windows, so the weekly job runs on Windows
              deliberately, not on a cheaper Linux runner. I ruled out line endings
              and build paths before accepting that conclusion.
            </p>
          </section>

          <section className="mt-14 flex flex-col gap-4">
            <SectionHeading id="wrong">What I caught and corrected</SectionHeading>
            <p className="text-text-muted">
              Every claim on this page gets checked, and sometimes the check is what
              finds the problem. The corrections are the part I would want to read.
            </p>

            <SubHeading>
              A &ldquo;0 CodeQL alerts&rdquo; claim my own re-check overturned
            </SubHeading>
            <p className="text-text-muted">
              After enabling CodeQL I queried the alerts for my branch, got an empty
              array, and wrote &ldquo;0 alerts&rdquo; into the security checklist. The
              query returns empty before the analysis associates, which is not the
              same as finding nothing. The real first run surfaced 7 alerts. I rewrote
              the row with the actual findings and now verify per alert, not per
              branch list.
            </p>
            <p className="text-text-muted">
              Four of the seven were real and got fixed. An unpinned GitHub action,
              now pinned to a commit SHA. Two log-injection findings: a lead-capture
              route that logged a submitted email address, and a client error handler
              that wrote an unescaped stack across multiple log rows. And an
              unanchored regular expression in a test, replaced with an exact match.
              The lead-capture route now writes a fixed breadcrumb string, so no
              user-submitted content reaches a log line at all, which the source
              shows. The remaining three were false positives, dismissed with the
              reasoning recorded.
            </p>

            <SubHeading>An overstated control, corrected in all four places</SubHeading>
            <p className="text-text-muted">
              A security checklist claimed the robots file blocked crawlers from
              proof routes. It does
              the opposite, on purpose, because a credential nobody can link defeats
              the point of publishing it. That claim appeared in four places,
              including the live documentation site.
            </p>
            <Pull>
              Overstating a control is worse than lacking one, because it stops you
              looking.
            </Pull>

            <SubHeading>
              Stale hardcoded counts, now pointed at a live source
            </SubHeading>
            <p className="text-text-muted">
              Running a structured QA cohort added 8 issuers, 8 credentials and 8
              escrows to the contract, which silently made the registry counts in my
              own submission documents wrong. Those figures should have come from the
              live status endpoint, not from prose. The documents now point at
              something self-updating instead of a snapshot I have to remember to fix.
            </p>

            <SubHeading>A measurement gap the analytics surfaced</SubHeading>
            <p className="text-text-muted">
              <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-sm">
                /start
              </code>{" "}
              is a one-tap flow to connect a wallet, auto-fund on testnet and sign a
              real transaction. It does not appear in my top pages, and I never
              checked whether anyone reached it. Building the funnel is not the same
              as measuring it.
            </p>
          </section>

          <section className="mt-14 flex flex-col gap-4">
            <SectionHeading id="count">How I count users</SectionHeading>
            <p className="text-text-muted">
              Every number on this page follows one rule: state what was measured, and
              state it next to the number rather than in a footnote. The user count is
              where that rule earns its keep.
            </p>
            <p className="text-text-muted">
              The testnet coverage spans 62 wallet accounts, and the split travels
              with the figure everywhere it appears: 30 independent participants from
              the public review, plus 32 accounts I created and operate myself for
              structured QA (24 from the July eight-team pass, plus 8 from the August
              wave). All 62 are real, separately funded testnet accounts with public
              transaction history, and the two groups prove different things. The 30
              show real people chose to use it. The 24 July QA accounts show the full
              issuer, graduate and employer path holds up under repeatable, scripted
              exercise. The 8 August accounts I operate are an extra public-transaction
              pass, not eight more independent people.
            </p>
            <Pull>
              I would rather hand someone a smaller number they can trust than a
              larger one that collapses when they check.
            </Pull>
            <p className="text-text-muted">
              Every one of the 30 participant wallets and all 72 July QA transactions
              resolve on Horizon right now, as do the 8 August QA-wave transactions
              logged in the operations docs.
            </p>
          </section>

          <section className="mt-14 flex flex-col gap-4">
            <SectionHeading id="verify">Check every claim yourself</SectionHeading>

            <div className="overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full border-collapse text-sm">
                <caption className="p-4 pb-2 text-left font-mono text-[0.65rem] uppercase tracking-[0.14em] text-text-muted">
                  Verification surface
                </caption>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="whitespace-nowrap px-4 py-2.5 align-top font-mono text-xs text-text-muted">
                      Contract
                    </td>
                    <td className="px-4 py-2.5 text-text">
                      <span className="break-all font-mono text-xs">
                        {appConfig.contractId}
                      </span>{" "}
                      on Stellar testnet
                    </td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="whitespace-nowrap px-4 py-2.5 align-top font-mono text-xs text-text-muted">
                      Deployed WASM
                    </td>
                    <td className="break-all px-4 py-2.5 font-mono text-xs text-text">
                      {DEPLOYED_WASM_HASH}
                    </td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="whitespace-nowrap px-4 py-2.5 align-top font-mono text-xs text-text-muted">
                      Source verification
                    </td>
                    <td className="px-4 py-2.5 text-text">
                      Reproducible from tag{" "}
                      <code className="font-mono text-xs">v3.0.0</code>
                    </td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="whitespace-nowrap px-4 py-2.5 align-top font-mono text-xs text-text-muted">
                      Re-verification
                    </td>
                    <td className="px-4 py-2.5 text-text">
                      Weekly CI rebuild compared against bytecode fetched live from
                      testnet
                    </td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="whitespace-nowrap px-4 py-2.5 align-top font-mono text-xs text-text-muted">
                      Contract surface
                    </td>
                    <td className="px-4 py-2.5 text-text">
                      19 public functions, 17 typed error codes, 16 events
                    </td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="whitespace-nowrap px-4 py-2.5 align-top font-mono text-xs text-text-muted">
                      Tests
                    </td>
                    <td className="px-4 py-2.5 text-text">
                      12 contract, 99 frontend unit, 42 end to end. The end-to-end
                      suite drives the real contract flows against live testnet,
                      including register, verify, pay, the escrow lifecycle, and all
                      14 MCP endpoint cases.
                    </td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="whitespace-nowrap px-4 py-2.5 align-top font-mono text-xs text-text-muted">
                      On-chain state
                    </td>
                    <td className="px-4 py-2.5 text-text">
                      14 issuers, 114 credentials, 25 escrowed paid trials as of 30
                      July 2026. Current figures are on the{" "}
                      <Link href="/status" className="text-primary underline">
                        live status page
                      </Link>
                      .
                    </td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="whitespace-nowrap px-4 py-2.5 align-top font-mono text-xs text-text-muted">
                      Security
                    </td>
                    <td className="px-4 py-2.5 text-text">
                      CodeQL across TypeScript, Rust and Actions; five edge rate-limit
                      rules; CSP with nonces; no secrets in the client bundle
                    </td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="whitespace-nowrap px-4 py-2.5 align-top font-mono text-xs text-text-muted">
                      Stack
                    </td>
                    <td className="px-4 py-2.5 text-text">
                      Soroban and Rust, Next.js 16, React 19, TypeScript, Tailwind,
                      Playwright
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-text-muted">
              A solo build still gets reviewed. Standing in for the second reviewer,
              by design: static analysis across all three languages, 153 tests, and a
              weekly job whose whole purpose is to catch me being wrong about the
              deployment.
            </p>
          </section>

          <footer className="mt-16 border-t border-border pt-8">
            <p className="text-text-muted">
              Live at{" "}
              <Link href="/" className="text-primary underline">
                stellaroid.tech
              </Link>
              . Source on{" "}
              <a
                href={SITE_REPOSITORY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                GitHub
              </a>
              . Everything runs on Stellar testnet and no real funds are involved.
            </p>
            <p className="mt-3 text-text-muted">
              If you are hiring, I am open to talking about this kind of work. The
              pilot path is on the site for anyone who runs a bootcamp or hires
              graduates. And if you just want to poke at it, open a proof page and
              check the hash yourself.
            </p>
            <ul className="mt-6 flex list-none flex-wrap gap-2 p-0">
              <li>
                <Link
                  href="/contact"
                  className="inline-block rounded-lg border border-primary px-4 py-2 font-mono text-xs text-primary hover:bg-primary/10"
                >
                  Get in touch
                </Link>
              </li>
              <li>
                <Link
                  href="/proof"
                  className="inline-block rounded-lg border border-border bg-surface px-4 py-2 font-mono text-xs text-text hover:border-primary hover:text-primary"
                >
                  Open a proof page
                </Link>
              </li>
              <li>
                <Link
                  href="/status"
                  className="inline-block rounded-lg border border-border bg-surface px-4 py-2 font-mono text-xs text-text hover:border-primary hover:text-primary"
                >
                  Live on-chain status
                </Link>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="inline-block rounded-lg border border-border bg-surface px-4 py-2 font-mono text-xs text-text hover:border-primary hover:text-primary"
                >
                  Developer docs
                </Link>
              </li>
            </ul>
            <p className="mt-8 text-xs text-text-muted">
              Traffic figures cover April to August 2026 from the Vercel Web Analytics
              API, production environment, as of 27 August 2026. On-chain counts change
              as the contract is used; the live status page is the current source.
              Stellaroid Earn runs on Stellar testnet only.
            </p>
          </footer>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
