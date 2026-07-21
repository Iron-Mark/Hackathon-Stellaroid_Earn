import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ProseBlocks } from "@/components/marketing/prose-section";
import { JsonLd } from "@/components/ui/json-ld";
import { SITE_CONTACT_EMAIL, buildPageMetadata } from "@/lib/seo";
import { buildBreadcrumbJsonLd } from "@/lib/schema";
import type { Block } from "@/lib/content/types";

const LAST_UPDATED = "July 10, 2026";

const breadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Privacy & terms", path: "/privacy" },
]);

export const metadata: Metadata = buildPageMetadata({
  path: "/privacy",
  title: "Privacy & terms",
  description:
    "What Stellaroid Earn collects (very little), what lives on the public Stellar testnet ledger, and the short service terms for this free testnet pilot.",
  keywords: "stellaroid privacy policy, testnet terms, on-chain data privacy",
});

const blocks: Block[] = [
  {
    type: "p",
    text: "Stellaroid Earn is a free, early-access pilot on the Stellar testnet. I collect as little as possible, and this page lists all of it, plus one disclosure most apps don't need: anything written to the blockchain is public and permanent.",
  },
  {
    type: "p",
    text: "I build and run Stellaroid Earn as a solo project. Mark Siazon is the individual responsible for the data described here (the data controller). For anything on this page, contact me at the address listed under the service terms below.",
  },
  { type: "h2", text: "Analytics" },
  {
    type: "p",
    text: "Production deploys run Vercel Web Analytics. It is cookieless and anonymous: it reports aggregate page views, not identities. I run no advertising trackers, no fingerprinting, and no third-party analytics beyond Vercel.",
  },
  { type: "h2", text: "Error reports" },
  {
    type: "p",
    text: "If the app hits a runtime error in your browser, it sends a short first-party report (error message, page path, stack trace, with no identity and no wallet keys) to my own server logs so I can fix it. Nothing goes to a third-party error service, and reports are capped and deduplicated per browsing session.",
  },
  { type: "h2", text: "Cookies and local storage" },
  {
    type: "ul",
    items: [
      "`stellaroid:locale`: a functional cookie (plus a localStorage copy) that remembers your English/Tagalog preference for one year. It is never sent to third parties.",
      "A localStorage flag that remembers you dismissed the wallet onboarding modal.",
      "No advertising or cross-site cookies of any kind.",
    ],
  },
  { type: "h2", text: "Pilot request form" },
  {
    type: "p",
    text: "If you submit the pilot request form, I receive the name, email, role, organization, and message you typed. Delivery is handled by Resend (a third-party email processor), so the submission lands in my inbox and is used only to reply to you. It is never sold or shared. Because Resend processes the email, delivery may be handled on servers outside the EU. Your IP address is used transiently, in memory, for rate limiting; it is not stored. I keep a submission only until I have replied to you, then I delete it. Want it removed sooner? Email me and I'll remove it.",
  },
  { type: "h2", text: "On-chain data is public and permanent" },
  {
    type: "callout",
    text: "Anything you write to the testnet contract (issuer names, certificate hashes, wallet addresses, escrow amounts) is recorded on the public Stellar testnet ledger. It is visible to anyone (e.g. on stellar.expert) and cannot be edited or deleted by me or anyone else. Never put personal data in on-chain fields; certificate documents themselves stay off-chain, only their SHA-256 hash is anchored.",
  },
  { type: "h2", text: "Wallets" },
  {
    type: "p",
    text: "Connecting Freighter or Albedo shares your public wallet address with the app in your browser. Additional wallets are offered through Stellar Wallets Kit, which surfaces more options behind the \"More wallets\" choice. Across all of these I never see or handle private keys; every transaction is signed inside your own wallet.",
  },
  {
    type: "p",
    text: "One exception to note: if you pick the WalletConnect option, the connection session is relayed through a third-party Reown relay server to link your wallet and this app. For every other path, the strict CSP means there are no third-party data leaks; the WalletConnect relay is the one deliberate outbound connection, and even then it only carries the connection session, never your private keys.",
  },
  { type: "h2", text: "Service terms in brief" },
  {
    type: "ul",
    items: [
      "By using this site you accept these terms.",
      "Stellaroid Earn is a testnet pilot provided as-is, with no warranty and no uptime guarantee.",
      "All flows use Stellar testnet XLM, which has no real-world monetary value. This is not a mainnet or production financial product, and nothing here is financial advice.",
      "Testnet data may be reset. Stellar's testnet itself is periodically wiped, and contract redeploys start from fresh state.",
      "There are no fees and no paid plans. Pilots are free.",
      "Don't use the service to register credentials you don't have the right to issue, or to harass, impersonate, or spam.",
      "Limitation of liability (provided as-is, not legal advice): to the extent allowed by law, Mark Siazon is not liable for any loss or damage arising from your use of this free testnet pilot.",
      "Governing law: to be specified before any paid or mainnet launch. This line and the limitation of liability above are provided as-is and are not legal advice; both need a professional legal review before this site is relied upon.",
      `Questions about any of this: ${SITE_CONTACT_EMAIL}.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <MarketingShell className="max-w-3xl gap-8">
      <JsonLd data={breadcrumbJsonLd} />
      <header>
        <p className="m-0 font-pixel text-xs font-medium uppercase tracking-widest text-primary">
          The fine print, kept short
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-text">
          Privacy &amp; terms
        </h1>
        <p className="mt-3 text-sm text-text-muted">Last updated: {LAST_UPDATED}</p>
      </header>
      <ProseBlocks blocks={blocks} />
    </MarketingShell>
  );
}
