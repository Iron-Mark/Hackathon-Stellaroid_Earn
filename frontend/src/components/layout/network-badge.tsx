import { resolveNetwork } from "@/lib/network";

/**
 * Persistent network indicator (M-1). Always states which Stellar network
 * the app is reading so cached pages, screenshots, and demos can never pass
 * testnet activity off as mainnet.
 */
export function NetworkBadge() {
  const network = resolveNetwork();
  const isMainnet = network.name === "mainnet";

  return (
    <span
      role="status"
      aria-label={`Connected to Stellar ${network.name}`}
      className={
        "pointer-events-none fixed bottom-3 right-3 z-50 inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 font-pixel text-[11px] font-medium leading-none " +
        (isMainnet
          ? "border-success/30 bg-success/12 text-success"
          : "border-accent/30 bg-accent/18 text-[#C4B5FD]")
      }
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {network.name}
    </span>
  );
}
