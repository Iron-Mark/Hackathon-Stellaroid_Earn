import { isSafeExternalHttpUrl } from "./security.ts";
import type { CertificateStatus, IssuerRecord } from "./types.ts";

const HASH_RE = /^[0-9a-f]{64}$/i;

type CertificateLike = {
  owner: string;
  issuer: string;
  status: CertificateStatus;
};

export type ProofVerificationCheckStatus = "pass" | "warning" | "fail";

export type ProofVerificationCheck = {
  id:
    | "hash_anchor"
    | "contract_record"
    | "credential_status"
    | "issuer_registry"
    | "employer_handoff";
  title: string;
  status: ProofVerificationCheckStatus;
  label: string;
  detail: string;
  source: string;
};

export type ProofVerificationDecision =
  | "ready_for_paid_trial_review"
  | "inspect_only";

export type IssuerTrustEvidenceStatus =
  | IssuerRecord["status"]
  | "lookup_failed"
  | "not_loaded";

export type IssuerTrustTier =
  | "registry_verified"
  | "registry_limited"
  | "registry_blocked"
  | "registry_unavailable";

export type IssuerTrustEvidenceItemStatus = "pass" | "warning" | "fail";

export type IssuerTrustEvidenceItem = {
  id:
    | "registry_status"
    | "issuer_wallet"
    | "issuer_profile"
    | "website_metadata";
  title: string;
  status: IssuerTrustEvidenceItemStatus;
  label: string;
  detail: string;
};

export type IssuerTrustEvidence = {
  wallet: string | null;
  name: string | null;
  category: string | null;
  status: IssuerTrustEvidenceStatus;
  website: string | null;
  websiteSafe: boolean | null;
  websiteEvidence:
    | "issuer_supplied_https_url"
    | "omitted_unsafe_or_non_https_url"
    | "not_supplied";
  tier: IssuerTrustTier;
  evidenceScore: number;
  decisionLabel: string;
  employerNote: string;
  evidenceItems: IssuerTrustEvidenceItem[];
  missingItems: string[];
  registryEvidence: string;
  brandingNote: string;
};

export type ProofVerificationBreakdown = {
  decision: ProofVerificationDecision;
  summary: string;
  employerTrustSummary: string;
  checks: ProofVerificationCheck[];
  blockers: string[];
  warnings: string[];
  issuerTrust: IssuerTrustEvidence;
};

export function normalizeProofHash(hash: string) {
  return hash.trim().replace(/^0x/i, "").toLowerCase();
}

function issuerTrustTier(status: IssuerTrustEvidenceStatus): IssuerTrustTier {
  if (status === "approved") return "registry_verified";
  if (status === "suspended") return "registry_blocked";
  if (status === "pending") return "registry_limited";
  return "registry_unavailable";
}

function issuerTrustDecisionLabel(tier: IssuerTrustTier) {
  switch (tier) {
    case "registry_verified":
      return "Employer-ready issuer evidence";
    case "registry_limited":
      return "Limited issuer evidence";
    case "registry_blocked":
      return "Issuer evidence blocks funding";
    case "registry_unavailable":
    default:
      return "Issuer evidence unavailable";
  }
}

function issuerTrustEmployerNote(tier: IssuerTrustTier) {
  switch (tier) {
    case "registry_verified":
      return "Issuer is approved in the contract registry. Employers should still confirm organization control before relying on branding.";
    case "registry_limited":
      return "Issuer is not approved yet. Keep this proof in review mode until registry approval is complete.";
    case "registry_blocked":
      return "Issuer is suspended. Do not use this proof for paid-trial funding decisions.";
    case "registry_unavailable":
    default:
      return "Issuer registry evidence was not available. Retry lookup before funding from this proof.";
  }
}

export function buildIssuerTrustEvidence({
  issuer,
  fallbackWallet,
  issuerLookupFailed = false,
}: {
  issuer?: IssuerRecord | null;
  fallbackWallet?: string | null;
  issuerLookupFailed?: boolean;
}): IssuerTrustEvidence {
  const website = issuer?.website?.trim() || null;
  const websiteSafe = website ? isSafeExternalHttpUrl(website) : null;
  const websiteEvidence = !website
    ? "not_supplied"
    : websiteSafe
      ? "issuer_supplied_https_url"
      : "omitted_unsafe_or_non_https_url";

  let status: IssuerTrustEvidenceStatus = "not_loaded";
  let registryEvidence = "No issuer registry record was loaded for this proof.";

  if (issuerLookupFailed) {
    status = "lookup_failed";
    registryEvidence =
      "Issuer registry lookup failed during this render; retry before relying on branding.";
  } else if (issuer) {
    status = issuer.status;
    if (issuer.status === "approved") {
      registryEvidence =
        "Approved issuer record found in the contract issuer registry.";
    } else if (issuer.status === "suspended") {
      registryEvidence =
        "Issuer record exists but is suspended; do not use this proof for funding decisions.";
    } else {
      registryEvidence =
        "Issuer record exists but is still pending approval.";
    }
  }

  const wallet = issuer?.address || fallbackWallet || null;
  const hasName = Boolean(issuer?.name?.trim());
  const hasCategory = Boolean(issuer?.category?.trim());
  const tier = issuerTrustTier(status);
  const missingItems: string[] = [];

  if (!wallet) missingItems.push("issuer wallet");
  if (!hasName) missingItems.push("issuer display name");
  if (!hasCategory) missingItems.push("issuer category");
  if (!website) {
    missingItems.push("public HTTPS website");
  } else if (!websiteSafe) {
    missingItems.push("safe public HTTPS website");
  }
  if (status !== "approved") missingItems.push("approved registry status");

  const registryStatus: IssuerTrustEvidenceItemStatus =
    status === "approved"
      ? "pass"
      : status === "suspended"
        ? "fail"
        : "warning";
  const websiteStatus: IssuerTrustEvidenceItemStatus = websiteSafe
    ? "pass"
    : "warning";
  const issuerProfileStatus: IssuerTrustEvidenceItemStatus =
    hasName && hasCategory ? "pass" : "warning";
  const evidenceItems: IssuerTrustEvidenceItem[] = [
    {
      id: "registry_status",
      title: "Registry status",
      status: registryStatus,
      label: status.replace("_", " "),
      detail: registryEvidence,
    },
    {
      id: "issuer_wallet",
      title: "Issuer wallet",
      status: wallet ? "pass" : "warning",
      label: wallet ? "present" : "missing",
      detail: wallet
        ? "Issuer wallet is available for contract and explorer review."
        : "No issuer wallet was available for this proof render.",
    },
    {
      id: "issuer_profile",
      title: "Issuer profile",
      status: issuerProfileStatus,
      label: hasName && hasCategory ? "named" : "incomplete",
      detail:
        hasName && hasCategory
          ? "Issuer name and category are present in the registry record."
          : "Issuer name or category is missing from the registry record.",
    },
    {
      id: "website_metadata",
      title: "Website metadata",
      status: websiteStatus,
      label: websiteSafe
        ? "https supplied"
        : website
          ? "not trusted"
          : "not supplied",
      detail: websiteSafe
        ? "Issuer supplied a public HTTPS website. Treat this as metadata until organization control is verified."
        : website
          ? "Issuer website was omitted from trusted links because it is not a safe public HTTPS URL."
          : "No issuer website was supplied for independent organization review.",
    },
  ];

  let evidenceScore = 0;
  if (status === "approved") evidenceScore += 50;
  if (status === "pending") evidenceScore += 25;
  if (status === "lookup_failed") evidenceScore += 10;
  if (status === "not_loaded") evidenceScore += 5;
  if (wallet) evidenceScore += 10;
  if (hasName) evidenceScore += 10;
  if (hasCategory) evidenceScore += 5;
  if (websiteSafe) evidenceScore += 15;

  return {
    wallet,
    name: issuer?.name || null,
    category: issuer?.category || null,
    status,
    website,
    websiteSafe,
    websiteEvidence,
    tier,
    evidenceScore: Math.min(evidenceScore, 100),
    decisionLabel: issuerTrustDecisionLabel(tier),
    employerNote: issuerTrustEmployerNote(tier),
    evidenceItems,
    missingItems,
    registryEvidence,
    brandingNote:
      "Website and display name are issuer-supplied metadata. Registry approval proves contract permission, not domain ownership or legal identity.",
  };
}

function credentialStatusCheck(
  cert: CertificateLike | null,
): ProofVerificationCheck {
  if (!cert) {
    return {
      id: "credential_status",
      title: "Credential status",
      status: "fail",
      label: "not found",
      detail: "No contract status was available for this hash.",
      source: "Stellar testnet contract",
    };
  }

  if (cert.status === "verified") {
    return {
      id: "credential_status",
      title: "Credential status",
      status: "pass",
      label: "verified",
      detail:
        "The contract reports this credential as verified by an approved issuer or admin.",
      source: "Certificate status mapping",
    };
  }

  const failedStatuses: CertificateStatus[] = ["revoked", "suspended", "expired"];
  return {
    id: "credential_status",
    title: "Credential status",
    status: failedStatuses.includes(cert.status) ? "fail" : "warning",
    label: cert.status,
    detail:
      cert.status === "issued"
        ? "The credential is registered, but verification has not been submitted yet."
        : `The credential is ${cert.status}; funding should wait until the state is cleared.`,
    source: "Certificate status mapping",
  };
}

function issuerRegistryCheck(
  evidence: IssuerTrustEvidence,
): ProofVerificationCheck {
  if (evidence.status === "approved") {
    return {
      id: "issuer_registry",
      title: "Issuer registry",
      status: "pass",
      label: "approved",
      detail: evidence.registryEvidence,
      source: "Issuer registry",
    };
  }

  if (evidence.status === "suspended") {
    return {
      id: "issuer_registry",
      title: "Issuer registry",
      status: "fail",
      label: "suspended",
      detail: evidence.registryEvidence,
      source: "Issuer registry",
    };
  }

  return {
    id: "issuer_registry",
    title: "Issuer registry",
    status: "warning",
    label: evidence.status.replace("_", " "),
    detail: evidence.registryEvidence,
    source: "Issuer registry",
  };
}

export function buildProofVerificationBreakdown({
  hash,
  cert,
  issuer,
  issuerLookupFailed = false,
}: {
  hash: string;
  cert: CertificateLike | null;
  issuer?: IssuerRecord | null;
  issuerLookupFailed?: boolean;
}): ProofVerificationBreakdown {
  const cleanHash = normalizeProofHash(hash);
  const hashValid = HASH_RE.test(cleanHash);
  const issuerTrust = buildIssuerTrustEvidence({
    issuer,
    fallbackWallet: cert?.issuer,
    issuerLookupFailed,
  });
  const credentialCheck = credentialStatusCheck(cert);
  const issuerCheck = issuerRegistryCheck(issuerTrust);
  const ready =
    hashValid &&
    Boolean(cert) &&
    credentialCheck.status === "pass" &&
    issuerCheck.status === "pass";

  const checks: ProofVerificationCheck[] = [
    {
      id: "hash_anchor",
      title: "Hash anchor",
      status: hashValid ? "pass" : "fail",
      label: hashValid ? "valid format" : "invalid format",
      detail: hashValid
        ? "64-character hash accepted as the immutable contract lookup key."
        : "The proof hash must be 64 hexadecimal characters before any contract lookup is trusted.",
      source: "Proof URL and proof pack",
    },
    {
      id: "contract_record",
      title: "Contract record",
      status: cert ? "pass" : "fail",
      label: cert ? "found" : "not found",
      detail: cert
        ? "A certificate record was returned by the Stellar testnet contract."
        : "No certificate record was found for this hash.",
      source: "Stellar testnet contract",
    },
    credentialCheck,
    issuerCheck,
    {
      id: "employer_handoff",
      title: "Employer handoff",
      status: ready ? "pass" : "warning",
      label: ready ? "ready" : "review first",
      detail: ready
        ? "Credential status and issuer registry evidence are ready for paid-trial review."
        : "Do not fund solely from this hash until the warning or failed checks are resolved.",
      source: "Employer console",
    },
  ];

  const blockers = checks
    .filter((check) => check.status === "fail")
    .map((check) => `${check.title}: ${check.detail}`);
  const warnings = checks
    .filter((check) => check.status === "warning")
    .map((check) => `${check.title}: ${check.detail}`);
  const decision: ProofVerificationDecision = ready
    ? "ready_for_paid_trial_review"
    : "inspect_only";

  return {
    decision,
    summary: ready
      ? "Verified credential, approved issuer, and contract-backed record are all present."
      : "Inspect the proof first; at least one trust check is not ready for employer funding.",
    employerTrustSummary: ready
      ? "Ready for employer review: the credential is verified on-chain and the issuer registry status is approved."
      : "Inspect only: review the verification breakdown before creating or funding a paid trial.",
    checks,
    blockers,
    warnings,
    issuerTrust,
  };
}
