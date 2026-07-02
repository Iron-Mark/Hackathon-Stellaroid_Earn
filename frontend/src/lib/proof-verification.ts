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

  return {
    wallet: issuer?.address || fallbackWallet || null,
    name: issuer?.name || null,
    category: issuer?.category || null,
    status,
    website,
    websiteSafe,
    websiteEvidence,
    registryEvidence,
    brandingNote:
      "Website and display name are issuer-supplied metadata; verify organization control independently before relying on branding.",
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
