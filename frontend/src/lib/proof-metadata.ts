import { DEFAULT_SAMPLE_PROOF_HASH } from "./demo-data.ts";
import type { ProofMetadata } from "./types.ts";
import type { CertificateRecord } from "./contract-read-server.ts";
import {
  isSafeExternalHttpUrl,
  sanitizeProofMetadata,
} from "./security.ts";

const PROOF_METADATA: Record<string, ProofMetadata> = {
  [DEFAULT_SAMPLE_PROOF_HASH.toLowerCase()]: {
    title: "Stellar Smart Contract Bootcamp Completion",
    description:
      "Awarded after shipping a working Soroban contract, deploying it to Stellar testnet, and demoing the full register, verify, and pay flow through Freighter.",
    cohort: "Stellar PH Bootcamp 2026",
    criteria:
      "Complete the assigned Soroban contract, pass the test suite, deploy to Stellar testnet, connect the dApp to Freighter, and present an end-to-end verified badge demo.",
    skills: [
      "Soroban smart contracts",
      "Stellar testnet deployment",
      "Freighter wallet integration",
      "Next.js dApp frontend",
      "On-chain credential verification",
    ],
    evidence: [
      {
        label: "About the demo",
        href: "/about",
      },
      {
        label: "Launch the app flow",
        href: "/app",
      },
      {
        label: "Bootcamp contract verified badge",
        href: "https://stellar.expert/explorer/testnet/contract/CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV",
      },
    ],
  },
};

export function getProofMetadata(hash: string): ProofMetadata | null {
  const key = hash.trim().toLowerCase();
  return PROOF_METADATA[key] ?? null;
}

export async function getProofMetadataForCertificate(
  hash: string,
  cert: Pick<CertificateRecord, "title" | "cohort" | "metadataUri"> | null,
): Promise<ProofMetadata | null> {
  if (!cert) return null;

  const fallback = getProofMetadata(hash);
  const uri = cert.metadataUri.trim();

  // Keep issuer-supplied metadata URLs as links only. Fetching arbitrary remote
  // URLs during SSR can become SSRF through redirects, DNS rebinding, or private
  // network resolution that string-based URL checks cannot fully prove safe.
  const contractEvidence = uri && isSafeExternalHttpUrl(uri) ? [{ label: "Metadata source", href: uri }] : [];
  const title = cert.title.trim() || fallback?.title;
  const description = fallback?.description;

  if (!title && !description && !fallback && contractEvidence.length === 0) {
    return null;
  }

  return sanitizeProofMetadata({
    title: title ?? "On-chain credential",
    description:
      description ??
      "This credential is anchored on Stellar and carries contract-backed title, issuer, and status data.",
    cohort: cert.cohort.trim() || fallback?.cohort,
    criteria: fallback?.criteria,
    skills: fallback?.skills ?? [],
    evidence: [...contractEvidence, ...(fallback?.evidence ?? [])],
  });
}
