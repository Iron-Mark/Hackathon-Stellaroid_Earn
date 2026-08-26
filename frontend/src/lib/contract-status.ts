// Shared, SDK-free normalization of the Soroban contract's status enums.
//
// Both the client read path (contract-client.ts, lazy-loaded SDK) and the
// server read path (contract-read-server.ts, static SDK) decode contract
// records; these pure helpers used to be copy-pasted in both and DRIFTED —
// the client mis-handled the array wire shape and silently mapped every
// verified/revoked/expired credential to "issued". Keeping one copy here
// removes that whole class of bug.
import type {
  CertificateStatus,
  IssuerStatus,
  OpportunityStatus,
} from "@/lib/types";

// A Soroban unit-enum variant comes back from scValToNative in one of a few
// shapes depending on SDK version / decode path:
//   - string:            "Verified"
//   - single-item array: ["Verified"]        (SDK vec-of-symbol form)
//   - object key:        { Verified: null }
//   - numeric fallback:  1                    (raw discriminant, defensive)
//
// The array case MUST be checked before the object branch: arrays ARE objects,
// and Object.keys(["Verified"]) is ["0"], which would mis-key to the 0th
// variant (e.g. a Verified credential read as "issued").
export function normalizeStatusKey(value: unknown): string {
  if (typeof value === "string") return value.toLowerCase();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0].toLowerCase();
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.tag === "string") return record.tag.toLowerCase();
    if (typeof record.name === "string") return record.name.toLowerCase();
    if (typeof record.value === "string") return record.value.toLowerCase();
    const keys = Object.keys(record);
    if (keys.length >= 1) return keys[0].toLowerCase();
  }
  return "";
}

/**
 * Display overlay for a validity window that has already elapsed.
 * Soroban rolls back storage on `Err`, so a past `expires_at` is not persisted
 * as `Expired` in the same invoke that rejects payment. Proof pages overlay it.
 */
export function overlayExpiredCertificateStatus(
  status: CertificateStatus,
  expiresAt: number,
  nowSeconds = Math.floor(Date.now() / 1000),
): CertificateStatus {
  if (
    expiresAt > 0 &&
    expiresAt <= nowSeconds &&
    status !== "revoked" &&
    status !== "suspended" &&
    status !== "unknown"
  ) {
    return "expired";
  }
  return status;
}

export function normalizeCertificateStatus(value: unknown): CertificateStatus {
  switch (normalizeStatusKey(value)) {
    case "verified":
    case "1":
      return "verified";
    case "revoked":
    case "2":
      return "revoked";
    case "suspended":
    case "3":
      return "suspended";
    case "expired":
    case "4":
      return "expired";
    case "issued":
    case "0":
      return "issued";
    default:
      return "unknown";
  }
}

export function normalizeIssuerStatus(value: unknown): IssuerStatus {
  switch (normalizeStatusKey(value)) {
    case "approved":
    case "1":
      return "approved";
    case "suspended":
    case "2":
      return "suspended";
    case "pending":
    case "0":
    default:
      return "pending";
  }
}

export function normalizeOpportunityStatus(value: unknown): OpportunityStatus {
  switch (normalizeStatusKey(value)) {
    case "funded":
    case "1":
      return "funded";
    case "inprogress":
    case "in_progress":
    case "2":
      return "in_progress";
    case "submitted":
    case "3":
      return "submitted";
    case "approved":
    case "4":
      return "approved";
    case "released":
    case "5":
      return "released";
    case "refunded":
    case "6":
      return "refunded";
    case "cancelled":
    case "7":
      return "cancelled";
    case "draft":
    case "0":
    default:
      return "draft";
  }
}
