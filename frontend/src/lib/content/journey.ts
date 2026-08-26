// The /journey page's entire content. Every claim here is either a plainly
// stated fact or carries a link to a real commit, PR, tag, or live surface.
// Grounded in this repository's git history: first commit 0aa63b7 (2026-03-20)
// through the Level 5 submission work (2026-07-22).
import type {
  JourneyAward,
  JourneyChapter,
  JourneyCreditGroup,
} from "./types";

const REPO = "https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn";

export function githubCommitUrl(sha: string): string {
  return `${REPO}/commit/${sha}`;
}

export function githubPrUrl(n: number): string {
  return `${REPO}/pull/${n}`;
}

export function githubTagUrl(tag: string): string {
  return `${REPO}/releases/tag/${tag}`;
}

export const journeyChapters: JourneyChapter[] = [
  {
    slug: "bootcamp",
    eyebrow: "March - April 2026",
    title: "It started as a bootcamp assignment",
    summary:
      "The first commit is a setup guide, not a product. Stellaroid Earn began as my submission for the Rise In Stellar Smart Contract Bootcamp.",
    milestones: [
      {
        date: "2026-03-20",
        title: "First commit",
        detail:
          "The repository opens as a participant guide for the Stellar PH bootcamp: install the toolchain, complete the assigned Soroban contract, deploy to testnet.",
        commit: "0aa63b7",
      },
      {
        date: "2026-04-17",
        title: "Cross-platform setup documented",
        detail:
          "I rewrote the setup path so it worked on both macOS and Windows, because the toolchain install was where most people got stuck.",
        commit: "dc1a2e3",
      },
      {
        date: "2026-04-18",
        title: "v1.0.0, the bootcamp submission",
        detail:
          "The credential contract and a working frontend, deployed to Stellar testnet and submitted.",
        commit: "8375e93",
        tag: "v1.0.0",
      },
    ],
  },
  {
    slug: "judge-ready",
    eyebrow: "April 2026",
    title: "Making it something a judge could actually open",
    summary:
      "Three releases in three days, turning a working submission into a reviewable one. It placed Top 5 of 105 participants.",
    milestones: [
      {
        date: "2026-04-19",
        title: "v1.1.0, judge-ready README and screenshots",
        detail:
          "Screenshots, a readable README, and the first attribution pass so the third-party licenses were recorded.",
        commit: "5e256da",
        tag: "v1.1.0",
      },
      {
        date: "2026-04-20",
        title: "v1.2.0, automated releases",
        detail:
          "A GitHub release workflow, so every tagged version ships with its artifacts attached instead of by hand.",
        commit: "71d2b03",
        tag: "v1.2.0",
      },
      {
        date: "2026-04-20",
        title: "v1.2.1, fixing a claim that was wrong",
        detail:
          "My walkthrough said the school paid the graduate. It does not: the employer pays. I shipped the correction the same day rather than leave a misleading step in the demo.",
        commit: "ae59e1d",
        tag: "v1.2.1",
      },
    ],
  },
  {
    slug: "quiet-and-spotlight",
    eyebrow: "May - June 2026",
    title: "Quiet in commits, loud in recognition",
    summary:
      "Thirty-one commits across two months, the slowest stretch of the project. The event was over and most submissions stop here. This one got picked to speak instead.",
    milestones: [
      {
        date: "2026-05-10",
        title: "v1.3.0, stabilized the build and the proof flow",
        detail:
          "Fixed the frontend build and the end-to-end proof path so the public demo kept working without me watching it.",
        commit: "a558c1a",
        tag: "v1.3.0",
      },
      {
        date: "2026-05-27",
        title: "v1.4.0, structured data",
        detail:
          "Search-engine structured data and funding metadata, so the proof pages describe themselves correctly when shared.",
        commit: "150337a",
        tag: "v1.4.0",
      },
    ],
  },
  {
    slug: "trust-layer",
    eyebrow: "Early July 2026",
    title: "Making trust legible",
    summary:
      "A credential is only worth the issuer behind it. This stretch built the trust surface: issuer dossiers, a security posture, and an audit of what the contract actually claims.",
    milestones: [
      {
        date: "2026-07-03",
        title: "v2.0.0, issuer and proof trust polish",
        detail:
          "Issuer registration, approval gating, and suspended-issuer states became visible in the product rather than implied by the contract.",
        commit: "0a65586",
        tag: "v2.0.0",
        pr: 33,
      },
      {
        date: "2026-07-04",
        title: "Contract verification audit",
        detail:
          "Checked what the deployed contract does against what the documentation says it does, and wrote down the gaps.",
        pr: 38,
      },
      {
        date: "2026-07-05",
        title: "Security and demo readiness",
        detail:
          "Security headers, a content security policy, and rate limiting on every write path before opening the demo more widely.",
        pr: 42,
      },
      {
        date: "2026-07-07",
        title: "Trust dossier",
        detail:
          "A single page an employer can read to decide whether an issuer is credible, instead of asking me.",
        pr: 45,
      },
    ],
  },
  {
    slug: "verified-redeploy",
    eyebrow: "July 2026",
    title: "Redeployed so the contract can be checked, not trusted",
    summary:
      "I rebuilt the contract from committed source and redeployed it with verification metadata embedded, so anyone can reproduce the deployed bytecode from this repository.",
    milestones: [
      {
        date: "2026-07-09",
        title: "v3.0.0, source-verified contract",
        detail:
          "Redeployed from committed source with source_repo and home_domain metadata embedded. The deployed WASM hash is reproducible from the repository, and the release tag carries a build attestation.",
        commit: "3b900ac",
        tag: "v3.0.0",
        pr: 48,
        link: { label: "Check it on /status", href: "/status" },
      },
    ],
  },
  {
    slug: "level5-growth",
    eyebrow: "July 2026",
    title: "Built for other people to use, not just to demo",
    summary:
      "The Level 5 push: eight wallets, six languages, a read-only interface for AI agents, and a one-tap way for a stranger to sign a real testnet action.",
    milestones: [
      {
        date: "2026-07-21",
        title: "Eight wallets and mobile signing",
        detail:
          "Freighter and Albedo natively, six more through the Stellar Wallets Kit, and WalletConnect so a phone wallet can sign.",
        pr: 84,
      },
      {
        date: "2026-07-21",
        title: "Five improvements from pilot feedback",
        detail:
          "Every point my pilot testers raised was mapped to the commit that addressed it: role guidance, role choice after connecting, wallet history, mobile support, and issued-credential clarity.",
        commit: "c1450bf",
      },
      {
        date: "2026-07-21",
        title: "Security audit pass",
        detail:
          "Dependency vulnerabilities patched, edge firewall rules added, and the rate-limit key corrected to the real client address.",
        pr: 92,
      },
      {
        date: "2026-07-22",
        title: "Pitch deck completed",
        detail:
          "The deck reached all six required sections, including market opportunity, growth strategy, and the roadmap.",
        pr: 94,
        link: { label: "Open the deck", href: "/slides" },
      },
      {
        date: "2026-07-22",
        title: "A 60-second way to try it",
        detail:
          "A guided flow that connects a wallet, funds it on testnet, and walks someone through signing one real on-chain action.",
        pr: 95,
        link: { label: "Try it yourself", href: "/start" },
      },
      {
        date: "2026-07-22",
        title: "Submission packaging",
        detail:
          "Feedback exported to a spreadsheet, evidence indexed against every requirement, and the wallet prefill wired so a first-time signer can be counted.",
        pr: 97,
      },
    ],
  },
];

export const journeyAwards: JourneyAward[] = [
  {
    slug: "bootcamp-top5",
    chapter: "judge-ready",
    date: "2026-04",
    period: "April 2026",
    headline: "Top 5 of 105 participants",
    detail:
      "Rise In Stellar Smart Contract Bootcamp, Stellar PH 2026. Final score 75.00.",
    evidence: {
      kind: "image",
      href: "/journey/bootcamp-top5.jpg",
      label: "Bootcamp results",
    },
  },
  {
    slug: "monthly-builder",
    chapter: "judge-ready",
    date: "2026-04",
    period: "April - July 2026",
    headline: "Selected as a Global Monthly Builder",
    detail:
      "Carried the project through four consecutive monthly builder rounds after the bootcamp ended.",
  },
  {
    slug: "june-speakership",
    chapter: "quiet-and-spotlight",
    date: "2026-06",
    period: "June 2026",
    headline: "Speaker at the June Monthly Builder",
    detail: "Stellaroid Earn was highlighted and I presented it to the cohort.",
  },
  {
    slug: "ph-representative",
    chapter: "quiet-and-spotlight",
    date: "2026-06",
    period: "June 2026",
    headline: "1 of 13 Philippine builders selected",
    detail:
      "Among 210 builders selected globally from more than 400 applicants in the June Monthly Builder round.",
  },
  {
    slug: "blue-belt",
    chapter: "level5-growth",
    date: "2026-07-21",
    period: "July 2026",
    headline: "Blue Belt, Level 5",
    detail:
      "Approved into the Level 5 track, which is judged on user growth, product iteration, and the pitch rather than on building something new.",
  },
];

export const journeyCredits: JourneyCreditGroup[] = [
  {
    title: "Stellar ecosystem",
    note: "The contract, the wallets, and the explorers this project is built on.",
    items: [
      {
        name: "@stellar/stellar-sdk",
        role: "Builds and simulates every transaction the app sends",
        license: "Apache-2.0",
        href: "https://github.com/stellar/js-stellar-sdk",
      },
      {
        name: "soroban-sdk",
        role: "The Rust SDK the credential contract is written against",
        license: "Apache-2.0",
        href: "https://github.com/stellar/rs-soroban-sdk",
      },
      {
        name: "@stellar/freighter-api",
        role: "Browser wallet connection and signing",
        license: "Apache-2.0",
        href: "https://github.com/stellar/freighter",
      },
      {
        name: "@creit.tech/stellar-wallets-kit",
        role: "Adds six more wallets behind one interface",
        license: "MIT",
        href: "https://github.com/Creit-Tech/Stellar-Wallets-Kit",
      },
      {
        name: "Albedo",
        role: "Web wallet signing with no extension required",
        href: "https://albedo.link/",
      },
      {
        name: "Stellar Expert",
        role: "The public explorer every proof link points at",
        href: "https://stellar.expert/",
      },
      {
        name: "Friendbot",
        role: "Funds a fresh testnet account so anyone can try the app",
        href: "https://developers.stellar.org/docs/build/guides/basics/create-account",
      },
    ],
  },
  {
    title: "The program",
    note: "Stellaroid Earn would not exist without this bootcamp and the people running it.",
    items: [
      {
        name: "Rise In",
        role: "Ran the Stellar Smart Contract Bootcamp and the Monthly Builder track",
        href: "https://www.risein.com/programs",
      },
      {
        name: "Stellar Development Foundation",
        role: "Maintains Soroban, the SDKs, and the testnet this runs on",
        href: "https://stellar.org/",
      },
      {
        name: "Stellar PH community",
        role: "The cohort and facilitators who reviewed and pushed the project",
      },
    ],
  },
  {
    title: "Web stack",
    items: [
      {
        name: "Next.js and React",
        role: "The App Router application and its server components",
        license: "MIT",
        href: "https://nextjs.org/",
      },
      {
        name: "Vercel",
        role: "Hosting, edge firewall, and analytics",
        href: "https://vercel.com/",
      },
      {
        name: "Tailwind CSS",
        role: "The design token system behind every surface",
        license: "MIT",
        href: "https://tailwindcss.com/",
      },
      {
        name: "Framer Motion",
        role: "Animation, honoring the reduce-motion preference",
        license: "MIT",
        href: "https://www.framer.com/motion/",
      },
      {
        name: "Lucide",
        role: "The icon set",
        license: "ISC",
        href: "https://lucide.dev/",
      },
      {
        name: "@modelcontextprotocol/server",
        role: "Powers the read-only endpoint that lets AI agents verify a credential",
        license: "MIT",
        href: "https://github.com/modelcontextprotocol/typescript-sdk",
      },
    ],
  },
  {
    title: "Fonts",
    note: "Both faces are licensed under the SIL Open Font License 1.1, which requires that this notice accompany the font files. They are redistributed here as web font files only, with no Reserved Font Name used in a modified version.",
    items: [
      {
        name: "Orbitron",
        role: "Display face, self-hosted through next/font",
        license: "OFL-1.1",
        href: "https://openfontlicense.org/",
      },
      {
        name: "Exo 2",
        role: "Body face, self-hosted through next/font",
        license: "OFL-1.1",
        href: "https://openfontlicense.org/",
      },
    ],
  },
  {
    title: "Pilot testers",
    note: "The people who tested the app on testnet and told me what was broken. Credited the same anonymized way as the published feedback export.",
    items: [
      {
        name: "Participant 01",
        role: "Bootcamp participant, viewed a proof and filed feedback",
      },
      {
        name: "Participant 02",
        role: "Employer role tester, registered as an issuer",
      },
      {
        name: "Participant 03",
        role: "Issuer flow tester, received a testnet XLM payment",
      },
      {
        name: "Participant 04",
        role: "Mobile experience tester, asked for the mobile work",
      },
      {
        name: "Participant 05",
        role: "Proof verification tester, explored the dashboard",
      },
    ],
  },
];

/** Month-precision dates sort correctly when padded to the first of the month. */
function awardTime(date: string): number {
  return Date.parse(date.length === 7 ? `${date}-01` : date);
}

/** The awards belonging to one chapter, oldest first. Empty for unknown slugs. */
export function awardsForChapter(slug: string): JourneyAward[] {
  return journeyAwards
    .filter((award) => award.chapter === slug)
    .sort((a, b) => awardTime(a.date) - awardTime(b.date));
}
