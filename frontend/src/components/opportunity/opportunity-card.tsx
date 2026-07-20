"use client";

import { useState } from "react";
import { Badge, Button, useToast } from "@/components/ui";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { NetworkBanner } from "@/components/app/network-banner";
import { appConfig, getExpectedNetworkLabel } from "@/lib/config";
import {
  submitMilestone,
  approveMilestone,
  releasePayment,
  refundOpportunity,
} from "@/lib/contract-client";
import { humanizeError } from "@/lib/errors";
import { withTimeout } from "@/lib/with-timeout";
import { ExternalLink } from "lucide-react";
import { MilestoneStepper } from "./milestone-stepper";
import { formatXlm, statusTone } from "./opportunity-format";
import type { OpportunityRecord } from "@/lib/types";

interface OpportunityCardProps {
  opportunity: OpportunityRecord;
}

export function OpportunityCard({ opportunity: initialOpp }: OpportunityCardProps) {
  const { wallet } = useFreighterWallet();
  const { toast } = useToast();
  const [opp, setOpp] = useState(initialOpp);
  const [busy, setBusy] = useState<string | null>(null);

  // Match every other write surface (pay-form, verify-form, issuer-dashboard):
  // only enable actions when connected AND on the expected network — a
  // wrong-network signature is rejected by the wallet with a dead-end error.
  const canConnectAct =
    wallet.status === "connected" && wallet.isExpectedNetwork;
  const isEmployer =
    canConnectAct &&
    wallet.address?.toUpperCase() === opp.employer.toUpperCase();
  const isCandidate =
    canConnectAct &&
    wallet.address?.toUpperCase() === opp.candidate.toUpperCase();

  const canSubmit =
    isCandidate && (opp.status === "funded" || opp.status === "in_progress");
  const canApprove = isEmployer && opp.status === "submitted";
  const canRelease = isEmployer && opp.status === "approved";
  const canRefund =
    isEmployer && (opp.status === "funded" || opp.status === "in_progress");
  const showActions = canSubmit || canApprove || canRelease || canRefund;
  const actionHint =
    opp.status === "released" ||
    opp.status === "refunded" ||
    opp.status === "cancelled"
      ? "This opportunity is complete."
      : wallet.status !== "connected"
        ? "Connect the employer or candidate wallet to act on this opportunity."
        : !wallet.isExpectedNetwork
          ? `Switch your wallet to ${getExpectedNetworkLabel()} to act on this opportunity.`
          : "No actions are available for your wallet at this stage.";

  async function handleAction(
    action: string,
    fn: () => Promise<{ hash?: string } | undefined>,
    nextStatus: OpportunityRecord["status"],
    milestone?: boolean,
  ) {
    setBusy(action);
    try {
      const result = await withTimeout(fn(), 15000, action);
      setOpp((prev) => ({
        ...prev,
        status: nextStatus,
        currentMilestone: milestone ? prev.currentMilestone + 1 : prev.currentMilestone,
      }));
      toast({
        title: `${action} successful`,
        detail: `Opportunity is now ${nextStatus}.`,
        tone: "success",
        action: result?.hash
          ? {
              label: <>View tx <ExternalLink className="inline w-3 h-3 ml-1" /></>,
              href: `${appConfig.explorerUrl}/tx/${result.hash}`,
            }
          : undefined,
      });
    } catch (e) {
      const h = humanizeError(e);
      toast({ title: h.title, detail: h.detail, tone: "danger" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
            Opportunity #{opp.id}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-text">
            {opp.title || "Untitled opportunity"}
          </h2>
        </div>
        <Badge tone={statusTone(opp.status)} dot>
          {opp.status.replace("_", " ")}
        </Badge>
      </div>

      <NetworkBanner wallet={wallet} />

      <div className="grid gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-text-muted">Amount:</span>
          <span className="font-semibold text-text">{formatXlm(opp.amount)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-muted">Employer:</span>
          <code className="font-mono text-xs text-text">{opp.employer}</code>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-muted">Candidate:</span>
          <code className="font-mono text-xs text-text">{opp.candidate}</code>
        </div>
      </div>

      <MilestoneStepper
        milestoneCount={opp.milestoneCount}
        currentMilestone={opp.currentMilestone}
        status={opp.status}
      />

      {showActions ? (
        <div className="flex gap-3 flex-wrap border-t border-border pt-4">
          {canSubmit ? (
            <Button
              variant="primary"
              onClick={() =>
                void handleAction(
                  "Submit milestone",
                  () => submitMilestone(wallet.address!, opp.id),
                  "submitted",
                )
              }
              loading={busy === "Submit milestone"}
            >
              Submit milestone
            </Button>
          ) : null}

          {canApprove ? (
            <Button
              variant="primary"
              onClick={() =>
                void handleAction(
                  "Approve milestone",
                  () => approveMilestone(wallet.address!, opp.id),
                  opp.currentMilestone + 1 >= opp.milestoneCount
                    ? "approved"
                    : "in_progress",
                  true,
                )
              }
              loading={busy === "Approve milestone"}
            >
              Approve milestone
            </Button>
          ) : null}

          {canRelease ? (
            <Button
              variant="primary"
              onClick={() =>
                void handleAction(
                  "Release payment",
                  () => releasePayment(wallet.address!, opp.id),
                  "released",
                )
              }
              loading={busy === "Release payment"}
            >
              Release payment
            </Button>
          ) : null}

          {canRefund ? (
            <Button
              variant="warning"
              onClick={() =>
                void handleAction(
                  "Refund",
                  () => refundOpportunity(wallet.address!, opp.id),
                  "refunded",
                )
              }
              loading={busy === "Refund"}
            >
              Refund
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="border-t border-border pt-4 text-sm text-text-muted">
          {actionHint}
        </p>
      )}
    </article>
  );
}
