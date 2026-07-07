import { track } from "@vercel/analytics";
import type { CertificateStatus } from "./types.ts";

type AnalyticsValue = string | number | boolean | null;

export type ProofShareChannel = "x" | "linkedin" | "copy_link";

export type ProductAnalyticsEvent =
  | "proof_share_clicked"
  | "proof_pack_opened"
  | "proof_employer_handoff_clicked"
  | "employer_handoff_loaded"
  | "employer_candidate_saved"
  | "employer_escrow_create_started"
  | "employer_escrow_fund_started";

export type ProductAnalyticsProperties = Record<string, AnalyticsValue>;

export function proofStatusProperty(status: CertificateStatus | null | undefined) {
  return status ?? "unknown";
}

export function proofHashShape(hash: string) {
  const clean = hash.trim().replace(/^0x/i, "");
  if (!clean) return "missing";
  return /^[0-9a-f]{64}$/i.test(clean) ? "sha256_hex" : "invalid";
}

export function analyticsBoolean(value: unknown) {
  return Boolean(value);
}

export function buildProofActionProperties({
  hash,
  status,
  source,
}: {
  hash: string;
  status?: CertificateStatus | null;
  source: "proof_page" | "employer_console";
}): ProductAnalyticsProperties {
  return {
    source,
    proof_status: proofStatusProperty(status),
    proof_hash_shape: proofHashShape(hash),
  };
}

export function trackProductEvent(
  name: ProductAnalyticsEvent,
  properties: ProductAnalyticsProperties = {},
) {
  if (typeof window === "undefined") return;
  track(name, properties);
}
