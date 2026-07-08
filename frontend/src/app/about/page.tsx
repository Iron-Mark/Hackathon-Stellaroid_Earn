import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { appConfig } from "@/lib/config";
import { shortenAddress } from "@/lib/format";
import { ActivitySnackbar } from "@/components/activity/activity-snackbar";
import { RecentActivity } from "@/components/activity/recent-activity";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { CopyButton } from "@/components/ui/copy-button";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/ui/json-ld";
import {
  buildPageMetadata,
  seoCanonicalUrl,
  SITE_CANONICAL_URL,
  SITE_CONTRACT_SOURCE_URL,
  SITE_NAME,
  SITE_REPOSITORY_URL,
} from "@/lib/seo";
import { buildAboutSoftwareProductSchema, buildFaqJsonLd } from "@/lib/schema";
import { LocalizedAboutCopy } from "@/components/about/localized-about-copy";
import { StatCard } from "@/components/about/stat-dialog";

export const metadata: Metadata = buildPageMetadata({
  path: "/about",
  title: "About",
  description:
    "Why Stellaroid Earn exists: certificates should be verifiable in seconds, not emails, and trusted verification should unlock payment in the same flow.",
});

const aboutBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_CANONICAL_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "About",
      item: `${SITE_CANONICAL_URL}/about`,
    },
  ],
};

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About | Stellaroid Earn",
  url: seoCanonicalUrl("/about"),
  description:
    "A thin piece of software around one idea: certificates should be verifiable in seconds, not emails. Once a trusted issuer verifies them, the grad should get paid in the same flow.",
  isPartOf: {
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_CANONICAL_URL,
  },
};

const aboutSoftwareProductJsonLd = buildAboutSoftwareProductSchema();

const stack = [
  {
    title: "Rust + soroban-sdk 22",
    desc: "Contract crate, trust-layer tests included",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M7 7l10 10M17 7L7 17" opacity="0.35" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Stellar testnet",
    desc: "Deployed + initialised with native SAC",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L14.09 9.26L21.5 9.27L15.45 13.77L17.77 21.02L12 16.5L6.23 21.02L8.55 13.77L2.5 9.27L9.91 9.26L12 2Z" />
      </svg>
    ),
  },
  {
    title: "Next.js 15 + React 19",
    desc: "App Router, server + client",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 6v12M16 6l-8 12" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Freighter + Albedo",
    desc: "Multi-wallet signing (desktop & mobile)",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 7h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" />
        <path d="M4 7V5a2 2 0 0 1 2-2h10" />
        <circle cx="16" cy="13" r="1.3" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "@stellar/stellar-sdk",
    desc: "Build, simulate, submit via Soroban RPC",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 6L2 12l6 6M16 6l6 6-6 6M14 4l-4 16" />
      </svg>
    ),
  },
  {
    title: "Vercel",
    desc: "Auto-deployed from main",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3L22 20H2L12 3Z" />
      </svg>
    ),
  },
];

const testDetail = {
  title: "6 contract tests, and why each one matters",
  description:
    "Every test maps to a real moment in Maria's story: from her school anchoring the hash, to the employer paying her wallet.",
  items: [
    {
      name: "test_full_flow",
      why: "The complete journey: init, register issuer, approve, register cert, verify, pay. If this passes, Maria gets paid.",
      tone: "flow" as const,
    },
    {
      name: "test_duplicate_certificate",
      why: "Tries to register the same hash twice. The contract must reject it, otherwise anyone could overwrite Maria's credential.",
      tone: "guard" as const,
    },
    {
      name: "test_unauthorized_verify",
      why: "A random wallet tries to verify. Only approved issuers or the admin can. This test proves the trust layer works.",
      tone: "guard" as const,
    },
    {
      name: "test_payment_requires_verification",
      why: "Blocks payment to an unverified cert. Employers can't pay until the credential is confirmed on-chain.",
      tone: "guard" as const,
    },
    {
      name: "test_issuer_registration",
      why: "Issuer self-registers and enters the pending queue. Admin approves. Tests the two-step trust handshake.",
      tone: "pass" as const,
    },
    {
      name: "test_certificate_lifecycle",
      why: "Register → verify → suspend → unsuspend → revoke. Covers every status transition a credential can go through.",
      tone: "flow" as const,
    },
  ],
};

const stats = [
  {
    value: "6",
    label: "Contract tests in repo",
    category: "Tests",
    scrollTo: "contract-surface",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
  },
  {
    value: "12",
    label: "Public functions",
    category: "Surface",
    scrollTo: "contract-surface",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3" />
        <path d="M9 3h6v4H9z" />
      </svg>
    ),
  },
  {
    value: "10",
    label: "Event types",
    category: "On-chain",
    scrollTo: "contract-surface",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    value: "<5s",
    label: "Testnet settlement",
    category: "Speed",
    scrollTo: "tech-stack",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
];

const mariaWins = [
  {
    title: "Paid same day",
    body: "Payment clears the moment work is verified, no 30-day invoice, no net-terms.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    ),
  },
  {
    title: "Keeps 100% of XLM",
    body: "Direct wallet-to-wallet, no 20% platform take rate between the employer and Maria.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10M9 10h4a2 2 0 0 1 0 4H9v-4zM9 14h5a2 2 0 0 1 0 4H9v-4z" />
      </svg>
    ),
  },
  {
    title: "Public Verified Badge URL",
    body: "A shareable link she drops into her next offer email, verifiable without any login.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07L11 5" />
        <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07L13 19" />
      </svg>
    ),
  },
  {
    title: "One-click LinkedIn share",
    body: "Pre-filled post with thumbnail; verified work becomes a portfolio artifact.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
        <path d="M16 6l-4-4-4 4M12 2v14" />
      </svg>
    ),
  },
  {
    title: "Owns it forever",
    body: "Credential lives on Stellar, no platform lock-in, no migration pain if the tool shuts down.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

const fnGroups = [
  {
    label: "Init",
    tone: "neutral" as const,
    fns: [
      {
        sig: "init(admin, token)",
        desc: "One-shot bootstrap. Stores admin + reward token in instance storage.",
      },
    ],
  },
  {
    label: "Write",
    tone: "primary" as const,
    fns: [
      {
        sig: "register_issuer(issuer, name, website, category)",
        desc: "Issuer self-registers on-chain and enters the pending trust queue.",
      },
      {
        sig: "approve_issuer(admin, issuer)",
        desc: "Admin approves a pending issuer so it can issue and verify credentials.",
      },
      {
        sig: "suspend_issuer(admin, issuer)",
        desc: "Admin suspends an issuer from future issue / verify operations.",
      },
      {
        sig: "register_certificate(issuer, student, cert_hash, title, cohort, metadata_uri)",
        desc: "Binds hash plus minimal proof metadata to a student wallet; rejects duplicates; emits cert_reg.",
      },
      {
        sig: "verify_certificate(verifier, cert_hash)",
        desc: "Trusted verification by the approved issuer or admin; emits cert_ver.",
      },
      {
        sig: "revoke_certificate(actor, cert_hash)",
        desc: "Marks a credential revoked so payment-linked actions are blocked.",
      },
      {
        sig: "suspend_certificate(actor, cert_hash)",
        desc: "Temporarily suspends a credential without deleting its audit trail.",
      },
      {
        sig: "reward_student(student, cert_hash, amount)",
        desc: "Admin-triggered XLM reward via the configured SAC.",
      },
      {
        sig: "link_payment(employer, student, cert_hash, amount)",
        desc: "Employer pays a verified student directly; emits payment.",
      },
    ],
  },
  {
    label: "Read",
    tone: "accent" as const,
    fns: [
      {
        sig: "get_certificate(cert_hash)",
        desc: "Read-only lookup of the certificate record.",
      },
      {
        sig: "get_issuer(issuer)",
        desc: "Read-only lookup of issuer trust status and profile metadata.",
      },
    ],
  },
];

const errors = [
  {
    code: "1",
    name: "AlreadyInitialized",
    copy: "Init called twice.",
    tone: "state",
  },
  {
    code: "2",
    name: "NotInitialized",
    copy: "Admin/token not set yet.",
    tone: "state",
  },
  {
    code: "3",
    name: "Unauthorized",
    copy: "Caller isn't allowed.",
    tone: "auth",
  },
  {
    code: "4",
    name: "AlreadyExists",
    copy: "Duplicate cert hash.",
    tone: "input",
  },
  {
    code: "5",
    name: "NotFound",
    copy: "Hash isn't registered.",
    tone: "input",
  },
  {
    code: "6",
    name: "InvalidAmount",
    copy: "Amount must be > 0.",
    tone: "input",
  },
  {
    code: "7",
    name: "IssuerNotFound",
    copy: "Issuer hasn't registered on-chain.",
    tone: "input",
  },
  {
    code: "8",
    name: "IssuerNotApproved",
    copy: "Issuer still needs admin approval.",
    tone: "state",
  },
  {
    code: "9",
    name: "IssuerSuspended",
    copy: "Issuer has been suspended.",
    tone: "state",
  },
  {
    code: "10",
    name: "InvalidStatus",
    copy: "Credential is in the wrong lifecycle state for this action.",
    tone: "state",
  },
  {
    code: "11",
    name: "CredentialRevoked",
    copy: "Credential was revoked and can no longer unlock payment.",
    tone: "state",
  },
  {
    code: "12",
    name: "CredentialExpired",
    copy: "Credential expired and must be reissued or renewed.",
    tone: "state",
  },
];

const fnBadgeClasses: Record<string, string> = {
  primary:
    "text-primary bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.3)]",
  accent: "text-accent bg-[rgba(139,92,246,0.1)] border-[rgba(139,92,246,0.3)]",
  neutral: "text-text-muted bg-surface border-border",
};

const errCategoryClasses: Record<string, string> = {
  state:
    "text-text-muted bg-[rgba(148,163,184,0.12)] border-[rgba(148,163,184,0.25)]",
  auth: "text-accent bg-[rgba(139,92,246,0.12)] border-[rgba(139,92,246,0.25)]",
  input:
    "text-primary bg-[rgba(245,158,11,0.12)] border-[rgba(245,158,11,0.3)]",
};

// Single source of truth: the visible FAQ below and the FAQPage schema render
// from this array, so the on-page text always matches the structured data
// (Google's requirement for FAQ rich results). Answers are grounded in the
// product copy on this page and the homepage "How it works" flow.
const faqItems: Array<{ question: string; answer: string }> = [
  {
    question: "Do I need a wallet to verify a certificate?",
    answer:
      "No. Verification is public and read-only — anyone can open a proof page and confirm a credential without connecting a wallet or logging in. A wallet is only needed to issue, verify, or pay on-chain.",
  },
  {
    question: "How do I verify a credential on Stellar?",
    answer:
      "Paste the 64-character SHA-256 hash on the public proof page to view its on-chain record, the issuer's trust status, and any attached credential evidence.",
  },
  {
    question: "What is an on-chain certificate?",
    answer:
      "An on-chain certificate is a credential whose SHA-256 hash is bound to a student's Stellar wallet by an issuer. The proof lives on Stellar testnet and is verifiable in seconds instead of by email, and duplicate hashes are rejected on-chain.",
  },
  {
    question: "How does the employer pay the graduate?",
    answer:
      "Once a credential is verified, the employer calls link_payment, which transfers XLM through the native Stellar Asset Contract straight to the student's verified wallet. Settlement is typically under five seconds and costs a fraction of a centavo — no invoice and no platform fee.",
  },
  {
    question: "Who can verify a credential?",
    answer:
      "Only an approved issuer or the admin wallet can submit the verify_certificate transaction. When they do, the contract updates the credential status to Verified and emits a cert_ver event that anyone can audit on stellar.expert.",
  },
  {
    question: "What does it cost to use Stellaroid Earn?",
    answer:
      "It is a free public Stellar testnet demo — no purchase, subscription, or mainnet funds required. On-chain payments settle in under five seconds for a fraction of a centavo in network fees.",
  },
];

const aboutFaqJsonLd = buildFaqJsonLd(faqItems);

const problemBeatIconClass =
  "text-[#f87171] bg-[rgba(220,38,38,0.08)] border-[rgba(220,38,38,0.25)]";
const approachBeatIconClass =
  "text-primary bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.3)]";

export default function About() {
  const contractUrl = appConfig.contractId
    ? `${appConfig.explorerUrl}/contract/${appConfig.contractId}`
    : appConfig.explorerUrl;

  return (
    <>
      <JsonLd data={aboutJsonLd} />
      <JsonLd data={aboutSoftwareProductJsonLd} />
      <JsonLd data={aboutBreadcrumbJsonLd} />
      <JsonLd data={aboutFaqJsonLd} />
      <div className="min-h-dvh">
        <SiteNav />
        <main id="main">
          <section className="px-6 py-24 sm:px-0 sm:py-24 sm:pb-16 max-w-5xl mx-auto text-center">
            <span className="inline-block font-pixel text-xs tracking-widest uppercase text-primary border border-amber-500/30 bg-amber-500/8 px-3 py-1 rounded-full mb-5">
              About
            </span>
            <h1 className="text-4xl sm:text-7xl leading-tight -tracking-wide font-bold m-0 mb-5">
              Why{" "}
              <em className="not-italic bg-[linear-gradient(to_right_in_oklch,var(--color-primary),var(--color-accent))] bg-clip-text text-transparent">
                Stellaroid Earn
              </em>
            </h1>
            <LocalizedAboutCopy
              id="lede"
              className="text-base sm:text-lg text-text-muted max-w-160 mx-auto mb-8 leading-[1.55]"
            />
            <p className="text-sm text-text-muted max-w-140 mx-auto mb-8 leading-relaxed">
              Free public Stellar testnet demo. No purchase, subscription, or mainnet funds required.
            </p>
          </section>

          <ActivitySnackbar>
            <RecentActivity compact sidebar bare />
          </ActivitySnackbar>

          <div className="max-w-260 mx-auto px-7">
            <dl
              className="grid grid-cols-4 max-sm:grid-cols-2 bg-surface border border-border rounded-lg overflow-hidden mb-12"
              aria-label="By the numbers"
            >
              {stats.map((s) => (
                <StatCard
                  key={s.label}
                  value={s.value}
                  label={s.label}
                  category={s.category}
                  icon={s.icon}
                  scrollTo={s.scrollTo}
                  detail={s.category === "Tests" ? testDetail : undefined}
                />
              ))}
            </dl>

            <div className="grid grid-cols-2 gap-5 mb-12 max-[720px]:grid-cols-1">
              <article className="bg-surface border border-border rounded-lg px-6.5 py-6 flex flex-col">
                <div className="flex items-center gap-2 font-pixel text-[11px] tracking-widest uppercase text-text-muted mb-2.5 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-[#dc2626]">
                  The problem
                </div>
                <h2 className="text-[1.375rem] mb-3 text-text tracking-tight">
                  The friction costs more than the fraud
                </h2>
                <p className="text-text-muted text-[0.9375rem] leading-relaxed mb-4.5 [&_strong]:text-text [&_strong]:font-semibold">
                  <strong>
                    Maria graduated top of her bootcamp cohort in Quezon City.
                  </strong>{" "}
                  She applies to a Singapore fintech, and then the clock starts.
                </p>
                <ol className="list-none m-0 mb-4.5 p-0 flex flex-col gap-3.5 relative before:absolute before:left-4.25 before:top-3.5 before:bottom-3.5 before:w-0.5 before:bg-border before:rounded">
                  <li className="grid grid-cols-[36px_1fr] gap-3.5 items-start relative">
                    <span
                      className={`w-9 h-9 rounded-[10px] inline-flex items-center justify-center shrink-0 relative z-1 bg-surface border [&_svg]:w-4.5 [&_svg]:h-4.5 ${problemBeatIconClass}`}
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="5" width="18" height="16" rx="2" />
                        <path d="M3 9h18M8 3v4M16 3v4" />
                      </svg>
                    </span>
                    <div>
                      <p className="font-pixel text-[11px] font-semibold tracking-[0.08em] uppercase text-[#f87171] mt-1.5 mb-1">
                        Tuesday
                      </p>
                      <p className="text-text-muted text-sm leading-[1.55] m-0">
                        Maria applies. Employer emails the school to confirm the
                        certificate.
                      </p>
                    </div>
                  </li>
                  <li className="grid grid-cols-[36px_1fr] gap-3.5 items-start relative">
                    <span
                      className={`w-9 h-9 rounded-[10px] inline-flex items-center justify-center shrink-0 relative z-1 bg-surface border [&_svg]:w-4.5 [&_svg]:h-4.5 ${problemBeatIconClass}`}
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                    </span>
                    <div>
                      <p className="font-pixel text-[11px] font-semibold tracking-[0.08em] uppercase text-[#f87171] mt-1.5 mb-1">
                        14–21 days
                      </p>
                      <p className="text-text-muted text-sm leading-[1.55] m-0">
                        Verification drags. 32% of candidates misrepresent.
                        Background checks cost $30–$75 each.
                      </p>
                    </div>
                  </li>
                  <li className="grid grid-cols-[36px_1fr] gap-3.5 items-start relative">
                    <span
                      className={`w-9 h-9 rounded-[10px] inline-flex items-center justify-center shrink-0 relative z-1 bg-surface border [&_svg]:w-4.5 [&_svg]:h-4.5 ${problemBeatIconClass}`}
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M8 8l8 8M16 8l-8 8" />
                      </svg>
                    </span>
                    <div>
                      <p className="font-pixel text-[11px] font-semibold tracking-[0.08em] uppercase text-[#f87171] mt-1.5 mb-1">
                        Three weeks later
                      </p>
                      <p className="text-text-muted text-sm leading-[1.55] m-0">
                        Role filled by a candidate who didn&rsquo;t need
                        verifying. Maria loses a job she earned.
                      </p>
                    </div>
                  </li>
                </ol>
                <LocalizedAboutCopy
                  id="problemKicker"
                  className="mt-auto pt-3.5 border-t border-dashed border-border text-text text-sm leading-[1.55] font-medium [&_em]:not-italic [&_em]:text-primary [&_em]:font-semibold"
                />
              </article>

              <article className="bg-surface border border-border rounded-lg px-6.5 py-6 flex flex-col">
                <div className="flex items-center gap-2 font-pixel text-[11px] tracking-[0.12em] uppercase text-text-muted mb-2.5 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary">
                  The approach
                </div>
                <h2 className="text-[1.125rem] sm:text-[1.375rem] mb-3 text-text tracking-tight">
                  Bind the hash. Trust the issuer. Pay the wallet.
                </h2>
                <p className="text-text-muted text-[0.9375rem] leading-relaxed mb-4.5 [&_strong]:text-text [&_strong]:font-semibold">
                  Same Maria, same Tuesday, on Stellar. The whole cycle takes
                  less time than reading this paragraph.
                </p>
                <ol className="list-none m-0 mb-4.5 p-0 flex flex-col gap-3.5 relative before:absolute before:left-4.25 before:top-3.5 before:bottom-3.5 before:w-0.5 before:bg-border before:rounded">
                  <li className="grid grid-cols-[36px_1fr] gap-3.5 items-start relative">
                    <span
                      className={`w-9 h-9 rounded-[10px] inline-flex items-center justify-center shrink-0 relative z-1 bg-surface border [&_svg]:w-4.5 [&_svg]:h-4.5 ${approachBeatIconClass}`}
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 7h16M4 12h16M4 17h10" />
                        <circle cx="19" cy="17" r="2" />
                      </svg>
                    </span>
                    <div>
                      <p className="font-pixel text-[11px] font-semibold tracking-[0.08em] uppercase text-primary mt-1.5 mb-1">
                        Step 1 · Anchor
                      </p>
                      <p className="text-text-muted text-sm leading-[1.55] m-0">
                        School hashes Maria&rsquo;s diploma and anchors it on
                        Stellar testnet.
                      </p>
                    </div>
                  </li>
                  <li className="grid grid-cols-[36px_1fr] gap-3.5 items-start relative">
                    <span
                      className={`w-9 h-9 rounded-[10px] inline-flex items-center justify-center shrink-0 relative z-1 bg-surface border [&_svg]:w-4.5 [&_svg]:h-4.5 ${approachBeatIconClass}`}
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                    <div>
                      <p className="font-pixel text-[11px] font-semibold tracking-[0.08em] uppercase text-primary mt-1.5 mb-1">
                        Step 2 · Verify in 5s
                      </p>
                      <p className="text-text-muted text-sm leading-[1.55] m-0">
                        An approved issuer or admin verifies on-chain, so the
                        employer can trust the proof without an email thread.
                      </p>
                    </div>
                  </li>
                  <li className="grid grid-cols-[36px_1fr] gap-3.5 items-start relative">
                    <span
                      className={`w-9 h-9 rounded-[10px] inline-flex items-center justify-center shrink-0 relative z-1 bg-surface border [&_svg]:w-4.5 [&_svg]:h-4.5 ${approachBeatIconClass}`}
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 3v14M6 11l6 6 6-6" />
                        <path d="M4 21h16" />
                      </svg>
                    </span>
                    <div>
                      <p className="font-pixel text-[11px] font-semibold tracking-[0.08em] uppercase text-primary mt-1.5 mb-1">
                        Step 3 · Employer pays
                      </p>
                      <p className="text-text-muted text-sm leading-[1.55] m-0">
                        The employer verifies the proof, hires Maria, and sends
                        payment straight to her wallet — no invoice, no
                        middleman.
                      </p>
                    </div>
                  </li>
                </ol>
                <LocalizedAboutCopy
                  id="approachKicker"
                  className="mt-auto pt-3.5 border-t border-dashed border-border text-text text-sm leading-[1.55] font-medium [&_em]:not-italic [&_em]:text-primary [&_em]:font-semibold"
                />
              </article>
            </div>

            <article className="bg-surface border border-border rounded-lg px-6.5 py-6 mt-6 shadow-[0_2px_12px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.04)_inset]">
              <div className="flex items-center gap-2 font-pixel text-[11px] tracking-widest uppercase text-text-muted mb-2.5 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary">
                What changes for Maria
              </div>
              <h2 className="text-[1.375rem] mb-3 text-text tracking-tight">
                Concrete wins, not abstract outcomes
              </h2>
              <ul
                className="list-none m-0 p-0 grid grid-cols-2 max-sm:grid-cols-1 gap-3.5"
                role="list"
              >
                {mariaWins.map((w) => (
                  <li
                    key={w.title}
                    className="grid grid-cols-[auto_1fr] gap-3 items-start p-3.5 px-4 bg-[rgba(0,0,0,0.1)] rounded-lg border border-[rgba(0,0,0,0.1)] shadow-[inset_0_1px_4px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.03)]"
                  >
                    <span
                      className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-primary bg-[rgba(245,158,11,0.12)] shrink-0 [&_svg]:w-4 [&_svg]:h-4"
                      aria-hidden="true"
                    >
                      {w.icon}
                    </span>
                    <div>
                      <p className="text-text text-sm font-semibold mt-0.5 mb-1">
                        {w.title}
                      </p>
                      <p className="text-text-muted text-[13px] leading-relaxed m-0">
                        {w.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            <section id="tech-stack" className="my-14 scroll-mt-24">
              <div className="mb-7">
                <h2 className="text-[1.75rem] tracking-tight mb-2">
                  Tech stack
                </h2>
                <p className="text-text-muted m-0 text-[0.9375rem]">
                  Boring, proven, fast to demo.
                </p>
              </div>
              <div className="grid grid-cols-3 max-[860px]:grid-cols-2 max-[520px]:grid-cols-1 gap-4">
                {stack.map((s) => (
                  <div
                    key={s.title}
                    className="flex flex-col gap-3.5 items-start p-5.5 bg-surface border border-border rounded-lg transition-[border-color,transform,box-shadow] duration-150 relative overflow-hidden min-h-35 hover:border-primary hover:-translate-y-0.5 hover:shadow-[0_6px_20px_-12px_rgba(0,0,0,0.25)] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-linear-to-r before:from-transparent before:via-primary/60 before:to-transparent before:opacity-0 hover:before:opacity-100 motion-reduce:hover:translate-y-0"
                  >
                    <div
                      className="w-11 h-11 rounded-[10px] bg-[rgba(245,158,11,0.12)] text-primary inline-flex items-center justify-center shrink-0 [&_svg]:w-5.5 [&_svg]:h-5.5"
                      aria-hidden="true"
                    >
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-text font-semibold m-0 mb-1 text-sm leading-tight">
                        {s.title}
                      </p>
                      <p className="text-text-muted m-0 text-[13px] leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="contract-surface" className="my-14 scroll-mt-24">
              <div className="mb-7">
                <h2 className="text-[1.75rem] tracking-tight mb-2">
                  Contract surface
                </h2>
                <p className="text-text-muted m-0 text-[0.9375rem]">
                  Twelve public functions; issuer trust explicit; errors human.
                </p>
              </div>
              <div className="flex flex-col gap-5">
                {fnGroups.map((g) => (
                  <div key={g.label} className="flex flex-col gap-2.5">
                    <div className="inline-flex items-center gap-3 py-1.5 border-b border-dashed border-border mb-0.5">
                      <span
                        className={`font-pixel text-[11px] font-bold tracking-[0.12em] uppercase px-2.5 py-0.75 rounded-full border ${fnBadgeClasses[g.tone]}`}
                      >
                        {g.label}
                      </span>
                      <span className="text-xs text-text-muted tracking-[0.02em]">
                        {g.fns.length}{" "}
                        {g.fns.length === 1 ? "function" : "functions"}
                      </span>
                    </div>
                    <div className="grid gap-2.5">
                      {g.fns.map((fn) => (
                        <div
                          key={fn.sig}
                          className="bg-surface border border-border rounded-lg px-5 py-4 grid gap-1"
                        >
                          <div className="font-mono text-primary text-sm font-medium">
                            {fn.sig}
                          </div>
                          <p className="text-text-muted text-sm m-0">
                            {fn.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="my-14">
              <div className="mb-7">
                <h2 className="text-[1.75rem] tracking-tight mb-2">
                  Errors are human
                </h2>
                <p className="text-text-muted m-0 text-[0.9375rem]">
                  No raw <code>ScVal</code> or <code>HostError</code> reaches
                  the UI; every contract error maps to a sentence a reviewer can
                  read.
                </p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
                {errors.map((e) => (
                  <div
                    key={e.code}
                    className="grid grid-cols-[auto_1fr] gap-3 px-4 py-3.5 bg-surface border border-border rounded-sm"
                  >
                    <div className="flex flex-col gap-2 items-start">
                      <span
                        className="font-mono text-[11px] font-semibold text-primary bg-[rgba(245,158,11,0.1)] px-2 py-0.75 rounded h-fit tracking-[0.04em]"
                        aria-label={`Error ${e.code}`}
                      >
                        #{e.code}
                      </span>
                      <span
                        className={`font-pixel text-[10.5px] font-bold tracking-widest uppercase px-2 py-0.75 rounded-full border ${errCategoryClasses[e.tone]}`}
                      >
                        {e.tone}
                      </span>
                    </div>
                    <div>
                      <p className="font-mono text-[13px] font-semibold text-text mb-0.5 m-0">
                        {e.name}
                      </p>
                      <p className="text-xs text-text-muted m-0 leading-[1.4]">
                        {e.copy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside
              className="relative bg-surface border border-border rounded-xl px-7 py-6 mb-8 overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[linear-gradient(to_right_in_oklch,var(--color-primary),var(--color-accent))]"
              aria-label="Deployment receipt"
            >
              <header className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-dashed border-border mb-4">
                <div className="inline-flex items-center gap-3">
                  <img src="/logo.svg" alt="" width={32} height={32} />
                  <div>
                    <p className="m-0 text-[0.9375rem] font-bold text-text tracking-tight">
                      Stellaroid Earn
                    </p>
                    <p className="mt-0.5 m-0 text-xs text-text-muted leading-normal [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline">
                      Stellar PH Bootcamp · in partnership with{" "}
                      <a
                        href="https://risein.com"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Rise In
                      </a>
                    </p>
                  </div>
                </div>
                <div className="inline-flex gap-2 flex-wrap">
                  <Badge tone="accent">Stellar testnet</Badge>
                  <Badge tone="verified" dot>
                    Deployed
                  </Badge>
                </div>
              </header>

              <dl className="grid gap-2.5 m-0">
                <div className="grid grid-cols-[120px_1fr] max-sm:grid-cols-1 max-sm:gap-1 gap-3 items-center">
                  <dt className="font-pixel text-[11px] font-semibold tracking-[0.08em] uppercase text-text-muted">
                    Contract ID
                  </dt>
                  <dd className="m-0 inline-flex items-center gap-2.5 flex-wrap">
                    <code className="font-mono text-[12.5px] text-text bg-surface-2 border border-border rounded px-2 py-0.75">
                      {appConfig.contractId
                        ? shortenAddress(appConfig.contractId, 8)
                        : "—"}
                    </code>
                    {appConfig.contractId ? (
                      <CopyButton
                        value={appConfig.contractId}
                        ariaLabel="Copy contract ID"
                      />
                    ) : null}
                    <a
                      href={contractUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13px] text-primary no-underline hover:underline"
                    >
                      stellar.expert <ExternalLink className="inline w-3 h-3 ml-1" />
                    </a>
                  </dd>
                </div>
                <div className="grid grid-cols-[120px_1fr] max-sm:grid-cols-1 max-sm:gap-1 gap-3 items-center">
                  <dt className="font-pixel text-[11px] font-semibold tracking-[0.08em] uppercase text-text-muted">
                    Source
                  </dt>
                  <dd className="m-0 inline-flex items-center gap-2.5 flex-wrap">
                    <a
                      href={SITE_REPOSITORY_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13px] text-primary no-underline hover:underline"
                    >
                      GitHub <ExternalLink className="inline w-3 h-3 ml-1" />
                    </a>
                    <a
                      href={SITE_CONTRACT_SOURCE_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13px] text-primary no-underline hover:underline"
                    >
                      Contract source <ExternalLink className="inline w-3 h-3 ml-1" />
                    </a>
                  </dd>
                </div>
                <div className="grid grid-cols-[120px_1fr] max-sm:grid-cols-1 max-sm:gap-1 gap-3 items-center">
                  <dt className="font-pixel text-[11px] font-semibold tracking-[0.08em] uppercase text-text-muted">
                    Network
                  </dt>
                  <dd className="m-0 inline-flex items-center gap-2.5 flex-wrap">
                    <code className="font-mono text-[12.5px] text-text bg-surface-2 border border-border rounded px-2 py-0.75">
                      Testnet · Soroban RPC
                    </code>
                  </dd>
                </div>
              </dl>
            </aside>

            <section aria-labelledby="faq-heading" className="mb-16">
              <h2
                id="faq-heading"
                className="text-[1.375rem] font-bold tracking-tight text-text mb-1"
              >
                Frequently asked questions
              </h2>
              <p className="text-text-muted text-sm mb-6">
                Common questions from issuers, employers, and graduates.
              </p>
              <dl className="grid gap-3">
                {faqItems.map((item) => (
                  <div
                    key={item.question}
                    className="bg-surface border border-border rounded-lg px-5 py-4"
                  >
                    <dt className="text-[0.9375rem] font-semibold text-text mb-1.5 [&_code]:font-mono">
                      {item.question}
                    </dt>
                    <dd className="m-0 text-sm text-text-muted leading-[1.6]">
                      {item.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <div className="flex gap-3 justify-center my-8 mb-16 flex-wrap">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 px-5.5 py-3 rounded-md font-semibold text-[0.9375rem] no-underline bg-primary text-on-primary border border-primary shadow-[0_4px_14px_rgba(245,158,11,0.15)] hover:bg-primary-hover hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(245,158,11,0.25)] transition-[transform,background,box-shadow] duration-150 motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
              >
                Try the app →
              </Link>
              <Link
                href="/proof"
                className="inline-flex items-center gap-2 px-5.5 py-3 rounded-md font-semibold text-[0.9375rem] no-underline text-text border border-border bg-transparent hover:bg-surface hover:-translate-y-px transition-[transform,background] duration-150 motion-reduce:hover:translate-y-0"
              >
                Look up a certificate
              </Link>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
