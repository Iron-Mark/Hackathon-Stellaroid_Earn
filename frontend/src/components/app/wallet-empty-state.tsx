import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { DEFAULT_SAMPLE_PROOF_HASH } from "@/lib/demo-data";

interface WalletEmptyStateProps {
  mode: "desktop-only" | "install-extension";
}

export function WalletEmptyState({ mode }: WalletEmptyStateProps) {
  const isDesktopOnly = mode === "desktop-only";

  const copy = isDesktopOnly
    ? {
        label: "Mobile detected",
        title: "Switch to desktop to sign transactions.",
        body: "Signing requires the Freighter browser extension, which only runs on desktop Chrome or Brave. You can still view any public Verified Badge right now — no wallet needed.",
      }
    : {
        label: "Wallet setup",
        title: "Freighter extension not found.",
        body: "Install Freighter in Chrome or Brave on desktop, then come back and connect. You can still open a sample Verified Badge to see the public verification flow.",
      };

  return (
    <section
      className="flex flex-col gap-3 p-[22px] bg-linear-to-b from-[rgba(30,41,59,0.96)] to-[rgba(15,23,42,0.96)] border border-border rounded-2xl"
      aria-label="Wallet setup help"
    >
      <img
        src="/illust/illust-wallet-setup.svg"
        alt=""
        className="w-14 h-auto opacity-90"
        aria-hidden="true"
        style={{ imageRendering: "pixelated" }}
      />
      <span className="inline-flex w-fit font-pixel text-[0.6875rem] font-bold tracking-[0.12em] uppercase text-primary bg-primary/[0.12] border border-primary/25 rounded-full px-[10px] py-1">
        {copy.label}
      </span>
      <h2 className="m-0 text-2xl leading-[1.15] tracking-tight">{copy.title}</h2>
      <p className="m-0 text-muted-foreground leading-relaxed">{copy.body}</p>
      <div className="flex flex-wrap gap-2.5">
        <Link
          href="/demo"
          className="inline-flex items-center justify-center min-h-[42px] px-4 rounded-md font-semibold no-underline bg-primary text-on-primary border border-primary hover:bg-primary-hover hover:text-on-primary"
        >
          Take the guided demo
        </Link>
        {!isDesktopOnly && (
          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center min-h-[42px] px-4 rounded-md font-semibold no-underline text-foreground border border-border bg-transparent hover:bg-surface-2 hover:text-foreground"
          >
            Get Freighter <ExternalLink className="inline w-3 h-3 ml-1" />
          </a>
        )}
        <Link
          href={`/proof/${DEFAULT_SAMPLE_PROOF_HASH}`}
          className="inline-flex items-center justify-center min-h-[42px] px-4 rounded-md font-semibold no-underline text-foreground border border-border bg-transparent hover:bg-surface-2 hover:text-foreground"
        >
          View sample Verified Badge
        </Link>
      </div>
    </section>
  );
}

export default WalletEmptyState;
