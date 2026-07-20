// Chip styling per event kind — shared by the server-rendered activity feed
// and the client-side wallet activity panel. Kept dependency-free so client
// bundles never pull the stellar-sdk-backed events module.
export function kindTag(kind: string) {
  if (kind === "payment" || kind === "reward" || kind === "pay_rel")
    return "font-pixel text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded";
  if (kind === "cert_ver" || kind === "mile_apr")
    return "font-pixel text-[11px] text-verified bg-verified-bg px-2 py-0.5 rounded";
  if (
    kind === "cert_reg" ||
    kind === "opp_crt" ||
    kind === "opp_fund" ||
    kind === "mile_sub"
  )
    return "font-pixel text-[11px] text-accent bg-accent/10 px-2 py-0.5 rounded";
  return "font-pixel text-[11px] text-text-muted bg-surface-2 px-2 py-0.5 rounded";
}
