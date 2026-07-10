import { appConfig } from "@/lib/config";
import type { OpportunityRecord } from "@/lib/types";

export function statusTone(
  status: OpportunityRecord["status"],
): "success" | "warning" | "danger" | "accent" | "neutral" {
  switch (status) {
    case "released":
      return "success";
    case "funded":
    case "in_progress":
      return "accent";
    case "submitted":
    case "approved":
      return "warning";
    case "refunded":
    case "cancelled":
      return "danger";
    case "draft":
    default:
      return "neutral";
  }
}

export function formatXlm(stroops: bigint): string {
  const xlm = Number(stroops) / 1e7;
  return `${xlm.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${appConfig.assetCode}`;
}
