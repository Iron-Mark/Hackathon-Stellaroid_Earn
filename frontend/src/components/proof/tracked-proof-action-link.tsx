"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import {
  buildProofActionProperties,
  trackProductEvent,
  type ProductAnalyticsEvent,
} from "@/lib/product-analytics";
import type { CertificateStatus } from "@/lib/types";

interface TrackedProofActionLinkProps
  extends AnchorHTMLAttributes<HTMLAnchorElement> {
  eventName: ProductAnalyticsEvent;
  hash: string;
  proofStatus?: CertificateStatus | null;
  trustTier?: string;
  children: ReactNode;
}

export function TrackedProofActionLink({
  eventName,
  hash,
  proofStatus = null,
  trustTier,
  children,
  onClick,
  ...props
}: TrackedProofActionLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        trackProductEvent(eventName, {
          ...buildProofActionProperties({
            hash,
            status: proofStatus,
            source: "proof_page",
          }),
          trust_tier: trustTier ?? null,
        });
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
