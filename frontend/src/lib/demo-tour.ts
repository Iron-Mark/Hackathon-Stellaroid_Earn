import { appConfig } from "@/lib/config";
import { DEFAULT_SAMPLE_PROOF_HASH } from "@/lib/demo-data";

// Guided-tour steps for /demo. Every step points at REAL records on Stellar
// testnet, seeded by the team as permanent exhibits (nothing is simulated) —
// see docs/operations/demo-exhibits.md for the seed transactions.
//
// Seed transactions for the escrow exhibits (immutable historical facts):
const RELEASED_FUND_TX =
  "1056631081c50335d905a570e363249c985bf385836be7b5feb5f71c473f407a";
const RELEASED_RELEASE_TX =
  "8b1b1f435f6c63b2e38102ae8a2cfa3ea72064245622c07fdb1258e0c55e5c4c";
const LIVE_FUND_TX =
  "7765809807c6d4c619a9a10a818262a7b64e6467871c537e42c60971d1c1ac1d";

export type DemoTourStep = {
  key: "register" | "verify" | "escrow-live" | "escrow-released";
  step: number;
  title: string;
  narrative: string;
  liveHref: string;
  liveLabel: string;
  explorerHref: string;
  fallback: string;
};

export function getDemoTourSteps(): DemoTourStep[] {
  const contractHref = `${appConfig.explorerUrl}/contract/${appConfig.contractId}`;

  return [
    {
      key: "register",
      step: 1,
      title: "A bootcamp anchors the certificate",
      narrative:
        "The issuer hashes the graduate's certificate (SHA-256) and registers that fingerprint on the Soroban contract. The document itself never leaves the issuer — only the hash goes on-chain.",
      liveHref: `/proof/${DEFAULT_SAMPLE_PROOF_HASH}`,
      liveLabel: "Open the live proof page",
      explorerHref: contractHref,
      fallback:
        "The live credential read is temporarily unavailable — you can still audit the contract's full history on stellar.expert.",
    },
    {
      key: "verify",
      step: 2,
      title: "An approved issuer verifies it",
      narrative:
        "A wallet in the approved-issuer registry endorses the record. From that moment anyone — recruiter, employer, or you right now — can confirm the credential in seconds without an account or a wallet.",
      liveHref: `/proof/${DEFAULT_SAMPLE_PROOF_HASH}`,
      liveLabel: "See the Verified badge",
      explorerHref: contractHref,
      fallback:
        "The live credential read is temporarily unavailable — you can still audit the contract's full history on stellar.expert.",
    },
    {
      key: "escrow-live",
      step: 3,
      title: "An employer escrows a paid trial",
      narrative:
        "An employer reviewed the verified credential and locked XLM in the contract against milestones. This escrow is live right now: the funds sit in the contract, not with us, until work is approved.",
      liveHref: `/opportunity/${appConfig.demoOpportunityLiveId}`,
      liveLabel: "Open the live escrow",
      explorerHref: `${appConfig.explorerUrl}/tx/${LIVE_FUND_TX}`,
      fallback:
        "The live escrow read is temporarily unavailable — the funding transaction is still auditable on stellar.expert.",
    },
    {
      key: "escrow-released",
      step: 4,
      title: "Milestones approved, payment released",
      narrative:
        "In this completed exhibit the graduate submitted work, the employer approved it, and the contract paid the escrowed XLM straight to the graduate's wallet. Proof and payment, one flow.",
      liveHref: `/opportunity/${appConfig.demoOpportunityReleasedId}`,
      liveLabel: "Open the released escrow",
      explorerHref: `${appConfig.explorerUrl}/tx/${RELEASED_RELEASE_TX}`,
      fallback:
        "The live escrow read is temporarily unavailable — the release transaction is still auditable on stellar.expert.",
    },
  ];
}

export const DEMO_TOUR_TX_LINKS = {
  RELEASED_FUND_TX,
  RELEASED_RELEASE_TX,
  LIVE_FUND_TX,
};
