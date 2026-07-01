"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Input, useToast } from "@/components/ui";
import { AppShell } from "@/components/layout/app-shell";
import { RpcStatusPill } from "@/components/layout/rpc-status-pill";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";
import { NetworkBanner } from "@/components/app/network-banner";
import { WalletEmptyState } from "@/components/app/wallet-empty-state";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { approveIssuer, getIssuer, suspendIssuer } from "@/lib/contract-client";
import { appConfig } from "@/lib/config";
import { humanizeError } from "@/lib/errors";
import { withTimeout } from "@/lib/with-timeout";
import { getAllIssuers } from "@/lib/issuer-registry";
import { ExternalLink } from "lucide-react";
import type { IssuerRecord } from "@/lib/types";

const knownIssuers = getAllIssuers();
const issuerEmployerHandoffSteps = [
  "Keep the issuer profile current before sharing credential links.",
  "Verify each credential before sending the proof to an employer.",
  "Share the proof page or proof pack so recruiters can start from the same record.",
];

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

type FlowTone = "success" | "warning" | "danger" | "neutral";

function flowToneClasses(tone: FlowTone): string {
  switch (tone) {
    case "success":
      return "border-success/30 bg-success/10 text-success";
    case "warning":
      return "border-warning/30 bg-warning/10 text-warning";
    case "danger":
      return "border-danger/30 bg-danger/10 text-danger";
    case "neutral":
    default:
      return "border-border bg-bg text-text-muted";
  }
}

function getIssuerFlowSteps(issuer: IssuerRecord | null) {
  const approved = issuer?.status === "approved";
  const pending = issuer?.status === "pending";
  const suspended = issuer?.status === "suspended";

  return [
    {
      label: "1. Register",
      state: issuer ? "Complete" : "Needed",
      detail: issuer
        ? "This wallet has an on-chain issuer profile."
        : "Submit a profile from the wallet that will issue credentials.",
      tone: issuer ? "success" : "warning",
    },
    {
      label: "2. Admin approval",
      state: approved ? "Approved" : suspended ? "Suspended" : pending ? "Pending" : "Blocked",
      detail: approved
        ? "Admin approved this issuer. It can now issue and verify credentials."
        : suspended
          ? "Admin suspended this issuer. It cannot issue or verify credentials."
          : pending
            ? "Profile exists, but issuing is blocked until the admin approves it."
            : "Approval cannot start until a profile exists.",
      tone: approved ? "success" : suspended ? "danger" : pending ? "warning" : "neutral",
    },
    {
      label: "3. Can issue",
      state: approved ? "Ready" : "Locked",
      detail: approved
        ? "Open the app flow to register a credential under this approved issuer."
        : "The app flow will reject certificate writes until approval is complete.",
      tone: approved ? "success" : "neutral",
    },
  ] satisfies Array<{
    label: string;
    state: string;
    detail: string;
    tone: FlowTone;
  }>;
}

export function IssuerDashboard() {
  const { wallet, isMobileBrowser } = useFreighterWallet();
  const { toast } = useToast();
  const [issuer, setIssuer] = useState<IssuerRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [targetIssuer, setTargetIssuer] = useState("");
  const [targetRecord, setTargetRecord] = useState<IssuerRecord | null>(null);
  const [targetLookupBusy, setTargetLookupBusy] = useState(false);
  const [adminBusy, setAdminBusy] = useState<"approve" | "suspend" | null>(null);

  const showDesktopOnlyFallback = isMobileBrowser;
  const showInstallFallback = wallet.status === "unsupported" && !isMobileBrowser;
  const showWalletEmptyState = showDesktopOnlyFallback || showInstallFallback;
  const walletConnected =
    wallet.status === "connected" && !!wallet.address && wallet.isExpectedNetwork;
  const configuredAdmin = appConfig.adminAddress.trim().toUpperCase();
  const isAdminWallet =
    walletConnected &&
    !!wallet.address &&
    !!configuredAdmin &&
    wallet.address.trim().toUpperCase() === configuredAdmin;
  const issuerFlowSteps = getIssuerFlowSteps(issuer);
  const canIssue = issuer?.status === "approved";

  useEffect(() => {
    let cancelled = false;

    async function loadIssuer() {
      if (!walletConnected || !wallet.address) {
        setIssuer(null);
        return;
      }

      setLoading(true);
      try {
        const record = await getIssuer(wallet.address);
        if (!cancelled) {
          setIssuer(record);
        }
      } catch (e) {
        if (!cancelled) {
          setIssuer(null);
          const h = humanizeError(e);
          toast({ title: h.title, detail: h.detail, tone: "danger" });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadIssuer();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletConnected, wallet.address]);

  async function handleTargetLookup() {
    if (!targetIssuer.trim()) return;
    setTargetLookupBusy(true);
    try {
      const record = await getIssuer(targetIssuer.trim());
      setTargetRecord(record);
      if (!record) {
        toast({
          title: "Issuer not found",
          detail: "No issuer record exists for that wallet yet.",
          tone: "warning",
        });
      }
    } catch (e) {
      setTargetRecord(null);
      const h = humanizeError(e);
      toast({ title: h.title, detail: h.detail, tone: "danger" });
    } finally {
      setTargetLookupBusy(false);
    }
  }

  async function handleAdminAction(action: "approve" | "suspend") {
    if (!wallet.address || !targetIssuer.trim() || !isAdminWallet) return;

    setAdminBusy(action);
    try {
      const target = targetIssuer.trim();
      const result = await withTimeout(
        action === "approve"
          ? approveIssuer(wallet.address, target)
          : suspendIssuer(wallet.address, target),
        15000,
        action,
      );
      toast({
        title: action === "approve" ? "Issuer approved" : "Issuer suspended",
        detail:
          action === "approve"
            ? "The issuer can now publish and verify credentials with this wallet."
            : "The issuer is now blocked from publishing and verifying credentials.",
        tone: "success",
        action: result?.hash
          ? {
              label: <>View on stellar.expert <ExternalLink className="inline w-3 h-3 ml-1" /></>,
              href: `${appConfig.explorerUrl}/tx/${result.hash}`,
            }
          : undefined,
      });
      const updated = await getIssuer(target);
      setTargetRecord(updated);
      if (
        wallet.address &&
        issuer &&
        wallet.address.trim().toUpperCase() === issuer.address.trim().toUpperCase()
      ) {
        setIssuer(updated);
      }
    } catch (e) {
      const h = humanizeError(e);
      toast({ title: h.title, detail: h.detail, tone: "danger" });
    } finally {
      setAdminBusy(null);
    }
  }

  return (
    <AppShell rpcPill={<RpcStatusPill />} walletButton={<WalletConnectButton />}>
      <div className="flex flex-col gap-6">
        <NetworkBanner wallet={wallet} />

        {showWalletEmptyState ? (
          <WalletEmptyState
            mode={showDesktopOnlyFallback ? "desktop-only" : "install-extension"}
          />
        ) : null}

        <section className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
                Issuer console
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-text">
                On-chain issuer status
              </h1>
              <p className="mt-2 max-w-[720px] text-sm text-text-muted">
                This route is the Phase 1 trust entrypoint. It tells the connected wallet whether
                it is unregistered, pending approval, approved, or suspended in the new issuer
                registry.
              </p>
            </div>
            {issuer ? (
              <Badge tone={statusTone(issuer.status)} dot>
                {issuer.status}
              </Badge>
            ) : (
              <Badge tone="accent">
                {loading ? "Loading…" : "No issuer record"}
              </Badge>
            )}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-xl font-semibold text-text">Connected wallet</h2>
            <div className="mt-4 rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text-muted">
              {wallet.address ? (
                <>
                  <div className="font-mono text-text break-all">{wallet.address}</div>
                  <div className="mt-2">
                    Network status:{" "}
                    {wallet.isExpectedNetwork ? "Ready for testnet actions" : "Wrong network"}
                  </div>
                </>
              ) : (
                "Connect Freighter to inspect or register an issuer profile."
              )}
            </div>

            <div className="mt-5">
              {issuer ? (
                <div className="space-y-3 text-sm text-text-muted">
                  <div>
                    <span className="block text-xs uppercase tracking-[0.14em] text-text-muted/70">
                      Name
                    </span>
                    <span className="text-text">{issuer.name || "Unnamed issuer"}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.14em] text-text-muted/70">
                      Website
                    </span>
                    <span className="text-text">{issuer.website || "No website submitted"}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.14em] text-text-muted/70">
                      Category
                    </span>
                    <span className="text-text">{issuer.category || "Uncategorized"}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.14em] text-text-muted/70">
                      Status
                    </span>
                    <Badge tone={statusTone(issuer.status)} dot>
                      {issuer.status}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/60 bg-bg/50 px-6 py-8 text-center">
                  <img
                    src="/illust/illust-issuer-empty.svg"
                    alt=""
                    className="w-24 h-auto"
                    aria-hidden="true"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-text">No issuer record yet :(</p>
                    <p className="text-sm text-text-muted">Register your wallet as an issuer, then ask the admin to approve it.</p>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <Button variant="primary" href="/issuer/register">
                      Register now
                    </Button>
                    <Button variant="ghost" disabled>
                      App writes locked
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-xl font-semibold text-text">Next actions</h2>
            <div className="mt-4 flex flex-col gap-3">
              {!issuer ? (
                <Button variant="primary" className="w-full" href="/issuer/register">
                  Register issuer profile
                </Button>
              ) : canIssue ? (
                <Button variant="primary" className="w-full" href="/app">
                  Issue credential
                </Button>
              ) : (
                <Button variant="secondary" className="w-full" href="/issuer/register">
                  Review issuer profile
                </Button>
              )}
              {canIssue ? (
                <Button variant="secondary" className="w-full" href="/app">
                  Open app flow
                </Button>
              ) : (
                <Button variant="ghost" className="w-full" disabled>
                  App writes locked until approval
                </Button>
              )}
            </div>
            <div className="mt-5 rounded-xl border border-border bg-bg/60 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-text-muted/70">
                Trust-state ladder
              </p>
              <p className="mt-2 text-sm font-semibold text-text">
                Profile -&gt; Approval -&gt; Issue credentials
              </p>
              <p className="mt-1 text-sm text-text-muted">
                Approved issuers can register, verify, suspend, and revoke credentials. Pending
                and suspended issuers stay visible for auditability, but contract writes remain
                locked.
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {issuerFlowSteps.map((step) => (
                <div
                  key={step.label}
                  className={`rounded-xl border px-4 py-3 ${flowToneClasses(step.tone)}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-text">{step.label}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                      {step.state}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-muted">{step.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-border bg-bg/60 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-text-muted/70">
                Employer proof handoff
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-muted">
                {issuerEmployerHandoffSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          </aside>
        </section>

        {isAdminWallet ? (
          <section className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
                  Admin controls
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-text">
                  Approve or suspend issuers
                </h2>
                <p className="mt-2 max-w-[720px] text-sm text-text-muted">
                  This panel is only shown when the connected wallet matches{" "}
                  <code className="font-mono text-text">NEXT_PUBLIC_STELLAR_ADMIN_ADDRESS</code>.
                </p>
              </div>
              <Badge tone="success" dot>
                Admin wallet active
              </Badge>
            </div>

            {knownIssuers.length > 0 && (
              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.14em] text-text-muted/70 mb-2">Known issuers</p>
                <div className="flex flex-wrap gap-2">
                  {knownIssuers.map(({ address, info }) => (
                    <button
                      key={address}
                      type="button"
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        targetIssuer === address
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border bg-bg text-text-muted hover:border-primary/50 hover:text-text"
                      }`}
                      onClick={() => {
                        setTargetIssuer(address);
                        setTargetRecord(null);
                      }}
                    >
                      <span>{info.name}</span>
                      <span className="text-xs opacity-60">{address.slice(0, 4)}…{address.slice(-4)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
              <Input
                label="Target issuer wallet"
                value={targetIssuer}
                onChange={(e) => {
                  setTargetIssuer(e.target.value);
                  setTargetRecord(null);
                }}
                placeholder="G..."
                helper="Pick a known issuer above or paste any wallet address."
                mono
              />
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  onClick={() => void handleTargetLookup()}
                  loading={targetLookupBusy}
                  disabled={!targetIssuer.trim()}
                >
                  Load issuer
                </Button>
              </div>
            </div>

            {targetRecord ? (
              <div className="mt-5 rounded-xl border border-border bg-bg p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-base font-semibold text-text">
                      {targetRecord.name || "Unnamed issuer"}
                    </p>
                    <p className="mt-1 text-sm text-text-muted">
                      {targetRecord.website || "No website"} · {targetRecord.category || "Uncategorized"}
                    </p>
                  </div>
                  <Badge tone={statusTone(targetRecord.status)} dot>
                    {targetRecord.status}
                  </Badge>
                </div>

                <div className="mt-4 flex gap-3 flex-wrap">
                  <Button
                    variant="primary"
                    onClick={() => void handleAdminAction("approve")}
                    loading={adminBusy === "approve"}
                    disabled={targetRecord.status === "approved"}
                  >
                    Approve issuer
                  </Button>
                  <Button
                    variant="warning"
                    onClick={() => void handleAdminAction("suspend")}
                    loading={adminBusy === "suspend"}
                    disabled={targetRecord.status === "suspended"}
                  >
                    Suspend issuer
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        ) : configuredAdmin ? (
          <section className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-muted">
            Looking for admin controls? They&apos;re hidden because the connected wallet doesn&apos;t match the configured admin address.
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

export default IssuerDashboard;
