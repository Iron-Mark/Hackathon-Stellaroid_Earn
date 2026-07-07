"use client";

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { getProofShareCopy } from "@/lib/proof-claims";
import {
  buildProofActionProperties,
  trackProductEvent,
} from "@/lib/product-analytics";
import type { CertificateStatus } from "@/lib/types";

interface ShareButtonsProps {
  hash: string;
  status: CertificateStatus | null;
}

export function ShareButtons({ hash, status }: ShareButtonsProps) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(window.location.href);
    }
  }, []);

  const shareCopy = getProofShareCopy(hash, url, status ? { status } : null);
  const tweetText = shareCopy.text;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  const linkedInText = `${shareCopy.text}

Built on Stellar + Soroban. #Stellar #Soroban #ProofOfWork`;
  const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(linkedInText)}`;

  function openInNewTab(href: string) {
    window.open(href, "_blank", "noopener,noreferrer");
  }

  function handleShare(channel: "x" | "linkedin") {
    trackProductEvent("proof_share_clicked", {
      ...buildProofActionProperties({ hash, status, source: "proof_page" }),
      channel,
    });
    openInNewTab(channel === "x" ? tweetUrl : linkedInUrl);
  }

  async function handleCopy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackProductEvent("proof_share_clicked", {
        ...buildProofActionProperties({ hash, status, source: "proof_page" }),
        channel: "copy_link",
      });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard write failed silently
    }
  }

  const buttonClass =
    "inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-border bg-surface-2 px-3 text-[13px] font-semibold text-text no-underline transition-colors hover:bg-border focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2";

  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
      {/* Share on X */}
      <button
        type="button"
        className={buttonClass}
        onClick={() => handleShare("x")}
        aria-label={shareCopy.verified ? "Share verified proof on X (Twitter)" : "Share proof lookup on X (Twitter)"}
      >
        {/* X (Twitter) mark — brand SVG, no Lucide equivalent */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12.5 2.5L3.5 13.5M3.5 2.5L12.5 13.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
        Share on X
      </button>

      {/* Share on LinkedIn */}
      <button
        type="button"
        className={buttonClass}
        onClick={() => handleShare("linkedin")}
        aria-label={shareCopy.verified ? "Share verified proof on LinkedIn" : "Share proof lookup on LinkedIn"}
      >
        {/* LinkedIn "in" mark — brand SVG, no Lucide equivalent */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <rect x="2" y="2" width="4" height="12" rx="0.5" fill="currentColor" />
          <circle cx="4" cy="2" r="1.5" fill="currentColor" />
          <path
            d="M8 6.5V14M8 9.5C8 7.5 14 7 14 10V14"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Share on LinkedIn
      </button>

      {/* Copy share link */}
      <button
        type="button"
        className={buttonClass}
        onClick={handleCopy}
        aria-label="Copy share link"
      >
        {copied ? (
          <Check width={16} height={16} aria-hidden="true" />
        ) : (
          <Copy width={16} height={16} aria-hidden="true" />
        )}
        {copied ? "Copied ✓" : "Copy share link"}
      </button>
    </div>
  );
}

export default ShareButtons;
