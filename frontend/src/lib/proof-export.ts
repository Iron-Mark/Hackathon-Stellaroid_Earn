import { appConfig } from "./config.ts";
import type { CertificateRecord } from "./contract-read-server.ts";
import {
  EMPLOYER_REVIEW_CHECKLIST,
  EMPLOYER_REVIEW_STEPS,
} from "./employer-review.ts";
import { buildProofVerificationBreakdown } from "./proof-verification.ts";
import { seoCanonicalUrl } from "./seo.ts";
import type { IssuerRecord, ProofEvidenceLink, ProofMetadata } from "./types.ts";

const EXPORT_VERSION = "2026-06-11";
const STANDARDS_PREVIEW_VERSION = "2026-06-16";

function timestampToIso(value: number): string | null {
  if (!value || value <= 0) return null;
  const millis = value > 9_999_999_999 ? value : value * 1000;
  return new Date(millis).toISOString();
}

function absoluteHref(link: ProofEvidenceLink): ProofEvidenceLink {
  if (link.href.startsWith("/")) {
    return { ...link, href: seoCanonicalUrl(link.href) };
  }
  return link;
}

export function proofExportFilename(hash: string) {
  const clean = hash.trim().replace(/^0x/i, "").toLowerCase();
  return `stellaroid-proof-${clean.slice(0, 12)}-summary.json`;
}

export function buildEmployerVerificationExport({
  hash,
  cert,
  issuer,
  proofMetadata,
}: {
  hash: string;
  cert: CertificateRecord;
  issuer: IssuerRecord | null;
  proofMetadata: ProofMetadata | null;
}) {
  const proofUrl = seoCanonicalUrl(`/proof/${hash}`);
  const verified = cert.status === "verified";
  const issuedAt = timestampToIso(cert.issuedAt);
  const verifiedAt = timestampToIso(cert.verifiedAt);
  const expiresAt = timestampToIso(cert.expiresAt);
  const credentialTitle = proofMetadata?.title ?? cert.title;
  const credentialDescription = proofMetadata?.description ?? null;
  const issuerName = issuer?.name || cert.issuer;
  const issuerId = issuer?.website || cert.issuer;
  const verificationBreakdown = buildProofVerificationBreakdown({
    hash,
    cert,
    issuer,
  });
  const employerUrl = seoCanonicalUrl(
    `/employer?hash=${encodeURIComponent(hash)}&candidate=${encodeURIComponent(cert.owner)}`,
  );
  const employerReviewPath = EMPLOYER_REVIEW_STEPS.map((step, index) => ({
    order: index + 1,
    id: step.id,
    title: step.title,
    detail: step.detail,
  }));

  return {
    type: "stellaroid.employer_verification_summary",
    version: EXPORT_VERSION,
    generatedAt: new Date().toISOString(),
    proofUrl,
    network: appConfig.network,
    contract: {
      id: appConfig.contractId,
      explorerUrl: appConfig.contractId
        ? `${appConfig.explorerUrl}/contract/${appConfig.contractId}`
        : appConfig.explorerUrl,
      eventsUrl: appConfig.contractId
        ? `${appConfig.explorerUrl}/contract/${appConfig.contractId}#events`
        : appConfig.explorerUrl,
    },
    trustSummary: {
      status: cert.status,
      verified,
      employerUse:
        verificationBreakdown.employerTrustSummary,
      sourceOfTruth: "Stellar testnet contract state plus the public proof page.",
      issuerRegistryStatus: verificationBreakdown.issuerTrust.status,
      issuerEvidenceScore: verificationBreakdown.issuerTrust.evidenceScore,
      issuerDecisionLabel: verificationBreakdown.issuerTrust.decisionLabel,
    },
    verificationBreakdown,
    employerReview: {
      decision: verificationBreakdown.decision,
      employerUrl,
      candidateWallet: cert.owner,
      path: employerReviewPath,
      blockers: verificationBreakdown.blockers,
      warnings: verificationBreakdown.warnings,
    },
    credential: {
      hash,
      title: credentialTitle,
      description: credentialDescription,
      cohort: proofMetadata?.cohort ?? cert.cohort,
      owner: cert.owner,
      issuer: cert.issuer,
      metadataUri: cert.metadataUri || null,
      status: cert.status,
      issuedAt,
      verifiedAt,
      expiresAt,
      skills: proofMetadata?.skills ?? [],
      evidence: proofMetadata?.evidence.map(absoluteHref) ?? [],
    },
    issuer: issuer
      ? {
          address: issuer.address,
          name: issuer.name,
          website: issuer.website,
          category: issuer.category,
          status: issuer.status,
        }
      : null,
    standardsAlignment: {
      type: "stellaroid.standards_alignment_preview",
      version: STANDARDS_PREVIEW_VERSION,
      status: "unsigned_preview",
      warning:
        "This maps the current on-chain record toward W3C VC 2.0 and Open Badges 3.0 concepts. It is not a signed Verifiable Credential or conformant OpenBadgeCredential yet.",
      roleModel: {
        issuer: {
          id: issuerId,
          name: issuerName,
          wallet: cert.issuer,
          status: issuer?.status ?? "unknown",
        },
        holder: {
          id: cert.owner,
          wallet: cert.owner,
        },
        verifier: {
          expectedUse:
            "Employer, recruiter, reviewer, or public proof checker opens proofUrl and inspects the on-chain status.",
        },
      },
      w3cVerifiableCredential2Preview: {
        "@context": ["https://www.w3.org/ns/credentials/v2"],
        type: ["VerifiableCredential", "StellaroidCredentialProof"],
        issuer: {
          id: issuerId,
          name: issuerName,
        },
        validFrom: issuedAt,
        validUntil: expiresAt,
        credentialSubject: {
          id: cert.owner,
          achievement: {
            name: credentialTitle || "Stellaroid credential",
            description: credentialDescription,
            criteria: proofMetadata?.criteria ?? null,
            skills: proofMetadata?.skills ?? [],
          },
        },
        credentialStatus: {
          type: "StellaroidContractStatus",
          status: cert.status,
          verified,
          proofUrl,
          contractId: appConfig.contractId,
          certificateHash: hash,
        },
        proof: null,
      },
      openBadges3Preview: {
        "@context": "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
        type: "OpenBadgeCredential",
        name: credentialTitle || "Stellaroid credential",
        description: credentialDescription,
        issuer: {
          id: issuerId,
          type: "Profile",
          name: issuerName,
        },
        credentialSubject: {
          id: cert.owner,
          type: "AchievementSubject",
          achievement: {
            id: proofUrl,
            type: "Achievement",
            name: credentialTitle || "Stellaroid credential",
            description: credentialDescription,
            criteria: proofMetadata?.criteria
              ? { narrative: proofMetadata.criteria }
              : null,
          },
        },
      },
      missingForConformance: [
        "Issuer-signed VC/Open Badges envelope",
        "Holder-controlled sharing or presentation workflow",
        "Published issuer verification method and key rotation policy",
        "Formal credential status list or revocation registry outside the demo contract mapping",
      ],
    },
    recruiterChecklist: [...EMPLOYER_REVIEW_CHECKLIST],
  };
}
