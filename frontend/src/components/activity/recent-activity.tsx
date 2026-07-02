import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { appConfig } from "@/lib/config";
import {
  formatRelativeTime,
  getRecentEvents,
  type RecentActivityItem,
} from "@/lib/events";

interface RecentActivityProps {
  className?: string;
  compact?: boolean;
  sidebar?: boolean;
  bare?: boolean;
}

function kindTag(kind: RecentActivityItem["kind"]) {
  if (kind === "payment" || kind === "reward")
    return "font-pixel text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded";
  if (kind === "cert_ver")
    return "font-pixel text-[11px] text-verified bg-verified-bg px-2 py-0.5 rounded";
  if (kind === "cert_reg")
    return "font-pixel text-[11px] text-accent bg-accent/10 px-2 py-0.5 rounded";
  return "font-pixel text-[11px] text-text-muted bg-surface-2 px-2 py-0.5 rounded";
}

export async function RecentActivity({
  className,
  compact = false,
  sidebar = false,
  bare = false,
}: RecentActivityProps) {
  let events: RecentActivityItem[] = [];
  try {
    events = await getRecentEvents(appConfig.contractId, compact ? 3 : 5);
  } catch {
    // RPC unavailable — render empty state rather than crashing the page
  }
  const hasContractLink = Boolean(appConfig.contractId);
  const contractEventsUrl = hasContractLink
    ? `${appConfig.explorerUrl}/contract/${appConfig.contractId}#events`
    : null;

  const cardClass = cn(
    !bare && "rounded-2xl border border-border-glass bg-surface-glass",
    "flex flex-col",
    compact || sidebar ? "p-4 gap-3" : "p-6 gap-4",
    className
  );

  const eyebrowClass = cn(
    "font-pixel text-[11px] font-medium text-text-muted uppercase tracking-wider",
    (compact || sidebar) && "text-[10px]"
  );

  const titleClass = cn(
    "text-lg font-semibold text-text font-heading",
    (compact || sidebar) && "text-sm whitespace-nowrap"
  );

  const viewAllClass = cn(
    "text-[13px] text-accent no-underline hover:text-primary transition-colors whitespace-nowrap",
    (compact || sidebar) && "text-[12px]"
  );

  if (events.length === 0) {
    return (
      <section className={cardClass}>
        <div className={cn("flex items-start justify-between gap-4", (compact || sidebar) && "pr-6")}>
          <div>
            <p className={eyebrowClass}>Live on-chain activity</p>
            <h2 className={titleClass}>Recent contract events</h2>
          </div>
          {contractEventsUrl && (
            <a href={contractEventsUrl} target="_blank" rel="noreferrer" className={viewAllClass}>
              View all <ExternalLink className="inline w-3 h-3 ml-1" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          <img
            src="/illust/illust-no-activity.svg"
            alt=""
            className={cn(
              "h-auto opacity-75 shrink-0",
              compact || sidebar ? "w-7" : "w-10"
            )}
            aria-hidden="true"
            style={{ imageRendering: "pixelated" }}
          />
          <p className={cn("text-sm text-text-muted m-0", (compact || sidebar) && "text-[12px]")}>
            {hasContractLink
              ? "No events yet. Complete the app flow to see live on-chain activity here."
              : "Contract ID not configured yet. Add it to enable live on-chain activity."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={cardClass}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={eyebrowClass}>Live on-chain activity</p>
          <h2 className={titleClass}>Recent contract events</h2>
        </div>
        {contractEventsUrl && (
          <a href={contractEventsUrl} target="_blank" rel="noreferrer" className={viewAllClass}>
            View all <ExternalLink className="inline w-3 h-3 ml-1" />
          </a>
        )}
      </div>
      <div className="flex flex-col">
        {events.map((event) => (
          <a
            key={event.id}
            href={event.externalUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "flex items-center gap-2 py-3 border-b border-border-glass last:border-0 no-underline flex-wrap",
              (compact || sidebar) && "py-2"
            )}
          >
            <span className={kindTag(event.kind)}>{event.label}</span>
            <span className="text-[13px] text-text flex-1 min-w-0 truncate">{event.detail}</span>
            <code className="font-mono text-[12px] text-text-muted hidden sm:inline">
              {event.reference}
            </code>
            <span className="text-[11px] text-text-muted whitespace-nowrap">{formatRelativeTime(event.ledgerClosedAt)}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

export default RecentActivity;
