import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  ProofVerificationBreakdown,
  ProofVerificationCheckStatus,
} from "@/lib/proof-verification";

interface VerificationBreakdownCardProps {
  breakdown: ProofVerificationBreakdown;
}

function statusTone(status: ProofVerificationCheckStatus) {
  if (status === "pass") return "success" as const;
  if (status === "fail") return "danger" as const;
  return "warning" as const;
}

function StatusIcon({ status }: { status: ProofVerificationCheckStatus }) {
  const className =
    status === "pass"
      ? "h-4 w-4 text-success"
      : status === "fail"
        ? "h-4 w-4 text-danger"
        : "h-4 w-4 text-warning";

  if (status === "pass") {
    return <CheckCircle2 className={className} aria-hidden="true" />;
  }

  if (status === "fail") {
    return <CircleAlert className={className} aria-hidden="true" />;
  }

  return <AlertTriangle className={className} aria-hidden="true" />;
}

export function VerificationBreakdownCard({
  breakdown,
}: VerificationBreakdownCardProps) {
  const ready = breakdown.decision === "ready_for_paid_trial_review";

  return (
    <section
      className="rounded-lg border border-border bg-bg px-4 py-4"
      aria-label="Proof verification breakdown"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-pixel text-xs font-medium uppercase tracking-wider text-accent">
            Verification breakdown
          </p>
          <h2 className="mt-1 text-base font-semibold text-text">
            {ready ? "Ready for employer review" : "Review before funding"}
          </h2>
        </div>
        <Badge tone={ready ? "success" : "warning"} dot>
          {ready ? "ready" : "inspect only"}
        </Badge>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">
        {breakdown.summary}
      </p>
      <ol className="mt-4 grid list-none gap-3 p-0 md:grid-cols-2">
        {breakdown.checks.map((check) => (
          <li
            key={check.id}
            className="flex min-w-0 gap-3 rounded-lg border border-border bg-surface-2 px-3 py-3"
          >
            <span className="mt-0.5 shrink-0">
              <StatusIcon status={check.status} />
            </span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-text">
                  {check.title}
                </span>
                <Badge tone={statusTone(check.status)}>{check.label}</Badge>
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-text-muted">
                {check.detail}
              </span>
              <span className="mt-1 block font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-text-muted/80">
                {check.source}
              </span>
            </span>
          </li>
        ))}
      </ol>
      {breakdown.warnings.length > 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-text-muted">
          Employer note: {breakdown.employerTrustSummary}
        </p>
      ) : null}
    </section>
  );
}
