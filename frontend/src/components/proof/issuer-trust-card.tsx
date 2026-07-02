import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { shortenAddress } from "@/lib/format";
import { buildIssuerTrustEvidence } from "@/lib/proof-verification";
import { isSafeExternalHttpUrl } from "@/lib/security";
import type { IssuerRecord } from "@/lib/types";

interface IssuerTrustCardProps {
  issuer: IssuerRecord;
}

function statusTone(status: IssuerRecord["status"]): "success" | "warning" | "danger" {
  switch (status) {
    case "approved":
      return "success";
    case "suspended":
      return "danger";
    case "pending":
    default:
      return "warning";
  }
}

export function IssuerTrustCard({ issuer }: IssuerTrustCardProps) {
  const safeWebsite = isSafeExternalHttpUrl(issuer.website) ? issuer.website : "";
  const evidence = buildIssuerTrustEvidence({ issuer });

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2 px-4 py-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-pixel text-xs font-medium text-text-muted uppercase tracking-wider">
          Issuer trust evidence
        </span>
        <Badge tone={statusTone(issuer.status)} dot>
          {issuer.status}
        </Badge>
      </div>
      <div>
        <p className="text-sm font-semibold text-text">
          {issuer.name || "Unnamed issuer"}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-text-muted">
          {evidence.registryEvidence}
        </p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-[0.6875rem] uppercase tracking-[0.14em] text-text-muted">
            Wallet
          </dt>
          <dd className="mt-1 flex min-w-0 items-center gap-2">
            <code className="rounded border border-border bg-bg px-1.5 py-0.5 font-mono text-xs text-text">
              {shortenAddress(issuer.address, 6)}
            </code>
            <CopyButton value={issuer.address} ariaLabel="Copy issuer address" />
          </dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] uppercase tracking-[0.14em] text-text-muted">
            Category
          </dt>
          <dd className="mt-1">
            <Badge tone="accent">{issuer.category || "uncategorized"}</Badge>
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[0.6875rem] uppercase tracking-[0.14em] text-text-muted">
            Website evidence
          </dt>
          <dd className="mt-1">
            {safeWebsite ? (
              <a
                href={safeWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center gap-1 break-all text-[0.8125rem] text-accent no-underline hover:underline"
              >
                {safeWebsite.replace(/^https?:\/\//, "")}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : issuer.website ? (
              <p className="text-[0.8125rem] text-text-muted">
                Website omitted because it is not a public HTTPS URL.
              </p>
            ) : (
              <p className="text-[0.8125rem] text-text-muted">
                No website supplied by issuer.
              </p>
            )}
          </dd>
        </div>
      </dl>
      <p className="rounded-md border border-warning/20 bg-warning/10 px-3 py-2 text-xs leading-relaxed text-text-muted">
        {evidence.brandingNote}
      </p>
    </div>
  );
}
