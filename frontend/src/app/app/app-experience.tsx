"use client";

import { type ReactNode, useState, useRef, useEffect } from "react";
import { NetworkBanner } from "@/components/app/network-banner";
import { WalletEmptyState } from "@/components/app/wallet-empty-state";
import { AppShell } from "@/components/layout/app-shell";
import { RpcStatusPill } from "@/components/layout/rpc-status-pill";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";
import { NextActionCard } from "@/components/actions/next-action-card";
import { MilestoneRail } from "@/components/milestones/milestone-rail";
import { RegisterForm } from "@/components/actions/register-form";
import { VerifyForm } from "@/components/actions/verify-form";
import { PayForm } from "@/components/actions/pay-form";
import { ProofBlockPreview } from "@/components/proof/proof-block-preview";
import { ActivitySnackbar } from "@/components/activity/activity-snackbar";
import { CopyButton } from "@/components/ui";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { FreighterWelcome } from "@/components/onboarding/freighter-welcome";
import { DemoAutofillButton } from "@/components/demo/demo-autofill-button";
import { ExternalLink } from "lucide-react";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { appConfig } from "@/lib/config";
import { shortenAddress } from "@/lib/format";
import { getCredentialTitleForPreviewState } from "@/lib/proof-preview";
import type { CertificateStatus } from "@/lib/types";

interface AppExperienceProps {
  sidebarActivity?: ReactNode;
}

export function AppExperience({ sidebarActivity }: AppExperienceProps) {
  const { wallet, isMobileBrowser, hasWebWallet } = useFreighterWallet();
  const contractId = appConfig.contractId ?? "";
  const contractUrl = contractId
    ? `${appConfig.explorerUrl}/contract/${contractId}`
    : appConfig.explorerUrl;
  const shortContract = contractId ? shortenAddress(contractId, 12) : "Not configured";
  const [role, setRole] = useState<"issuer" | "employer">("issuer");
  const [milestones, setMilestones] = useState({
    registered: false,
    verified: false,
    paid: false,
    credentialStatus: undefined as CertificateStatus | undefined,
    credentialTitle: undefined as string | undefined,
    lastHash: undefined as string | undefined,
    lastStudent: undefined as string | undefined,
  });

  const step2Ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!milestones.registered) return;
    const t = setTimeout(() => {
      step2Ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 350);
    return () => clearTimeout(t);
  }, [milestones.registered]);

  const walletConnected =
    wallet.status === "connected" && !!wallet.address && wallet.isExpectedNetwork;
  // A cross-platform (web) wallet lets mobile and extension-less desktop users
  // sign, so only fall back to the "no wallet" screen when nothing works here.
  const showWalletEmptyState =
    !hasWebWallet && (isMobileBrowser || wallet.status === "unsupported");

  return (
    <AppShell rpcPill={<RpcStatusPill />} walletButton={<WalletConnectButton />} sidebarMode>
      {sidebarActivity ? <ActivitySnackbar>{sidebarActivity}</ActivitySnackbar> : null}
      {!showWalletEmptyState ? <FreighterWelcome /> : null}
      <div className="flex flex-col gap-6">
        <NetworkBanner wallet={wallet} />
        <div className="grid [grid-template-columns:minmax(0,1.5fr)_minmax(280px,0.95fr)] gap-6 items-start max-[920px]:grid-cols-1">
          <div className="flex flex-col gap-6 min-w-0">
            {showWalletEmptyState ? (
              <WalletEmptyState
                mode={isMobileBrowser ? "desktop-only" : "install-extension"}
              />
            ) : (
              <>
                <NextActionCard
                  role={role}
                  setRole={setRole}
                  milestones={milestones}
                  walletConnected={walletConnected}
                />
                {/* Horizontal rail — mobile only */}
                <div className="min-[920px]:hidden">
                  <MilestoneRail state={milestones} started={walletConnected} />
                </div>
                <section>
                  {role === "issuer" && (
                    <div className="flex flex-col gap-8">
                      <section className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <p className="font-pixel text-[10.5px] font-semibold tracking-[0.1em] uppercase text-text-muted shrink-0"><span className="text-primary">Step 1</span> — Issue certificate</p>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        <div className="flex gap-4">
                          <div className="w-px shrink-0 bg-linear-to-b from-primary/50 to-transparent" />
                          <div className="flex-1 min-w-0">
                            <RegisterForm
                              onSuccess={(hash, student, _txHash, credentialTitle) =>
                                setMilestones((m) => ({
                                  ...m,
                                  registered: true,
                                  verified: false,
                                  paid: false,
                                  credentialStatus: "issued",
                                  credentialTitle: credentialTitle?.trim() || undefined,
                                  lastHash: hash,
                                  lastStudent: student,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </section>
                      <section
                        ref={step2Ref}
                        className={[
                          "flex flex-col gap-3 transition-opacity duration-300",
                          milestones.registered ? "" : "opacity-30 pointer-events-none select-none",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3">
                          <p className="font-pixel text-[10.5px] font-semibold tracking-[0.1em] uppercase text-text-muted shrink-0"><span className="text-primary">Step 2</span> — Endorse on-chain</p>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        <div className="flex gap-4">
                          <div className="w-px shrink-0 bg-linear-to-b from-primary/50 to-transparent" />
                          <div className="flex-1 min-w-0">
                            <VerifyForm
                              initialHash={milestones.lastHash}
                              allowTrustedActions
                              onVerified={(hash) =>
                                setMilestones((m) => ({
                                  ...m,
                                  verified: true,
                                  credentialStatus: "verified",
                                  lastHash: hash,
                                }))
                              }
                              onStatusChange={(hash, status, _txHash, record) =>
                                setMilestones((m) => ({
                                  ...m,
                                  verified: status === "verified",
                                  credentialStatus: status,
                                  credentialTitle: getCredentialTitleForPreviewState(record?.title),
                                  lastHash: hash,
                                  lastStudent: record?.owner ?? m.lastStudent,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </section>
                    </div>
                  )}
                  {role === "employer" && (
                    <div className="flex flex-col gap-8">
                      <section className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <p className="font-pixel text-[10.5px] font-semibold tracking-[0.1em] uppercase text-text-muted shrink-0">Look up credential</p>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        <div className="flex gap-4">
                          <div className="w-px shrink-0 bg-linear-to-b from-border to-transparent" />
                          <div className="flex-1 min-w-0">
                            <VerifyForm
                              initialHash={milestones.lastHash}
                              allowTrustedActions={false}
                              onStatusChange={(hash, status, _txHash, record) =>
                                setMilestones((m) => ({
                                  ...m,
                                  verified: status === "verified",
                                  credentialStatus: status,
                                  credentialTitle: getCredentialTitleForPreviewState(record?.title),
                                  lastHash: hash,
                                  lastStudent: record?.owner ?? m.lastStudent,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </section>
                      {milestones.verified && !milestones.paid ? (
                        <section className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <p className="font-pixel text-[10.5px] font-semibold tracking-[0.1em] uppercase text-text-muted shrink-0">Pay student</p>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                          <div className="flex gap-4">
                            <div className="w-px shrink-0 bg-linear-to-b from-border to-transparent" />
                            <div className="flex-1 min-w-0">
                              <PayForm
                                initialHash={milestones.lastHash}
                                initialStudent={milestones.lastStudent}
                                onPaid={() => setMilestones((m) => ({ ...m, paid: true }))}
                              />
                            </div>
                          </div>
                        </section>
                      ) : null}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
          <aside className="sticky top-24 max-[920px]:static flex flex-col gap-6">
            {/* Contract / Network / Wallet — desktop only, replaces subheader */}
            <div className="max-[920px]:hidden bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-4 flex flex-col gap-2 border-b border-border">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-pixel text-[10.5px] font-semibold tracking-[0.1em] uppercase text-text-muted">Contract</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <a
                            href={contractUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary-hover hover:underline no-underline text-[13px] inline-flex items-center gap-0.5 transition-colors"
                          >
                            stellar.expert <ExternalLink className="inline w-3 h-3 ml-1" />
                          </a>
                        }
                      />
                      <TooltipContent side="bottom">
                        Browse transactions, events, and storage for this contract on Stellar Expert
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {contractId
                  ? <CopyButton value={contractId} label={shortContract} ariaLabel="Copy contract ID" />
                  : <code className="font-mono text-[13px] text-text-muted">{shortContract}</code>
                }
              </div>
              <div className="px-4 py-4">
                <WalletConnectButton sidebar />
              </div>
            </div>
            <div className="max-[920px]:hidden bg-surface border border-border rounded-lg px-5 py-4">
              <p className="font-pixel text-[10.5px] font-semibold tracking-[0.1em] uppercase text-text-muted mb-3">Progress</p>
              <MilestoneRail state={milestones} orientation="vertical" started={walletConnected} />
            </div>
            <ProofBlockPreview
              hash={milestones.lastHash}
              certStatus={milestones.credentialStatus}
              credentialTitle={milestones.credentialTitle}
            />
          </aside>
        </div>
        {!showWalletEmptyState ? <DemoAutofillButton registered={milestones.registered} /> : null}
      </div>
    </AppShell>
  );
}
