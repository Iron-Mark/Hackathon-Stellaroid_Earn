"use client";

import { useEffect, useRef, useState } from "react";
import { DEMO_AUTOFILL_EVENT, DemoAutofillDetail } from "@/components/demo/demo-autofill-button";
import { Button, Badge, Skeleton, Input, useToast } from "@/components/ui";
import { HashInput } from "@/components/actions/hash-input";
import { humanizeError, isMissingContractMethod } from "@/lib/errors";
import { withTimeout } from "@/lib/with-timeout";
import {
  getCertificate,
  verifyCertificate,
  revokeCertificate,
  suspendCertificate,
  setCredentialExpiry,
  renewCertificate,
  CertificateRecord,
} from "@/lib/contract-client";
import { appConfig, hasRequiredConfig } from "@/lib/config";
import { dateInputToUnixSeconds, formatUnixDate, shortenAddress } from "@/lib/format";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import type { CertificateStatus } from "@/lib/types";

export interface VerifyFormProps {
  initialHash?: string;
  allowTrustedActions?: boolean;
  onVerified?: (hash: string, txHash?: string) => void;
  onStatusChange?: (
    hash: string,
    status: CertificateStatus,
    txHash?: string,
    record?: CertificateRecord,
  ) => void;
}

function isValidHash(hash: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(hash.trim().replace(/^0x/i, ""));
}

type LookupState =
  | { status: "idle" }
  | { status: "loading"; hash: string }
  | { status: "found"; hash: string; record: CertificateRecord }
  | { status: "missing"; hash: string }
  | { status: "error"; hash: string; message: string };

function statusLabel(status: CertificateStatus): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "revoked":
      return "Revoked";
    case "suspended":
      return "Suspended";
    case "expired":
      return "Expired";
    case "issued":
    default:
      return "Issued";
  }
}

function statusTone(status: CertificateStatus): "success" | "accent" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "verified":
      return "success";
    case "issued":
      return "accent";
    case "revoked":
      return "danger";
    case "suspended":
    case "expired":
      return "warning";
    default:
      return "neutral";
  }
}

type LifecycleAction = "verify" | "suspend" | "revoke";
type PendingAction = LifecycleAction | "expiry" | "renew";

function onChainStatus(record: CertificateRecord): CertificateStatus {
  return record.rawStatus ?? record.status;
}

function actionTitle(action: LifecycleAction) {
  switch (action) {
    case "verify":
      return "Credential approved";
    case "suspend":
      return "Credential suspended";
    case "revoke":
      return "Credential revoked";
  }
}

function actionDetail(action: LifecycleAction) {
  switch (action) {
    case "verify":
      return "On-chain approval submitted by the issuer.";
    case "suspend":
      return "The credential has been suspended on-chain.";
    case "revoke":
      return "The credential has been revoked on-chain.";
  }
}

function nextStatusForAction(action: LifecycleAction): CertificateStatus {
  switch (action) {
    case "verify":
      return "verified";
    case "suspend":
      return "suspended";
    case "revoke":
      return "revoked";
  }
}

export function VerifyForm({
  initialHash,
  allowTrustedActions = true,
  onVerified,
  onStatusChange,
}: VerifyFormProps) {
  const { wallet } = useFreighterWallet();
  const { toast } = useToast();
  const onStatusChangeRef = useRef(onStatusChange);

  const [certHash, setCertHash] = useState(initialHash ?? "");
  const [hashTouched, setHashTouched] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });
  const [hashEditing, setHashEditing] = useState(!initialHash);
  const [expiresDate, setExpiresDate] = useState("");

  const normalizedHash = certHash.trim().replace(/^0x/i, "").toLowerCase();
  const configured = hasRequiredConfig();
  const hashOk = isValidHash(certHash);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    if (!initialHash) return;
    setCertHash((current) => current || initialHash);
    setHashEditing(false);
  }, [initialHash]);

  useEffect(() => {
    function onAutofill(e: Event) {
      const detail = (e as CustomEvent<DemoAutofillDetail>).detail;
      if (!detail) return;
      setCertHash(detail.certHash);
      setHashTouched(false);
      setHashEditing(false);
      setLookup({ status: "idle" });
    }
    window.addEventListener(DEMO_AUTOFILL_EVENT, onAutofill);
    return () => window.removeEventListener(DEMO_AUTOFILL_EVENT, onAutofill);
  }, []);

  useEffect(() => {
    if (!configured || !hashOk) {
      setLookup({ status: "idle" });
      return;
    }

    const hash = normalizedHash;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLookup((current) =>
        current.status === "loading" && current.hash === hash
          ? current
          : { status: "loading", hash },
      );

      try {
        const record = await getCertificate(hash);
        if (cancelled) return;
        setLookup(record ? { status: "found", hash, record } : { status: "missing", hash });
        if (record) {
          onStatusChangeRef.current?.(hash, record.status, undefined, record);
        }
      } catch (e) {
        if (cancelled) return;
        const h = humanizeError(e);
        setLookup({ status: "error", hash, message: h.detail });
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [configured, hashOk, normalizedHash]);

  const hashError =
    hashTouched && certHash.trim() !== "" && !isValidHash(certHash)
      ? "Must be exactly 64 hexadecimal characters"
      : undefined;

  const walletConnected =
    wallet.status === "connected" && !!wallet.address && wallet.isExpectedNetwork;

  const currentLookup =
    lookup.status !== "idle" && lookup.hash === normalizedHash ? lookup : { status: "idle" as const };

  const canLookup = configured && hashOk && currentLookup.status !== "loading";
  const mutating = pendingAction !== null;
  const foundRecord =
    currentLookup.status === "found" ? currentLookup.record : null;
  const foundOnChain = foundRecord ? onChainStatus(foundRecord) : null;
  const canVerify =
    allowTrustedActions &&
    configured &&
    walletConnected &&
    !mutating &&
    foundRecord?.status === "issued";
  const canSuspend =
    allowTrustedActions &&
    configured &&
    walletConnected &&
    !mutating &&
    (foundOnChain === "issued" || foundOnChain === "verified");
  const canRevoke =
    allowTrustedActions &&
    configured &&
    walletConnected &&
    !mutating &&
    foundOnChain !== null &&
    foundOnChain !== "revoked";
  const canWriteExpiry =
    allowTrustedActions &&
    configured &&
    walletConnected &&
    !mutating &&
    foundOnChain !== null &&
    foundOnChain !== "revoked" &&
    foundOnChain !== "suspended";

  async function resolveLookup(noisy: boolean) {
    if (!configured || !hashOk) return null;

    const hash = normalizedHash;
    setLookup({ status: "loading", hash });
    try {
      const record = await getCertificate(hash);
      setLookup(record ? { status: "found", hash, record } : { status: "missing", hash });
      if (record) {
        onStatusChangeRef.current?.(hash, record.status, undefined, record);
      }
      return record;
    } catch (e) {
      const h = humanizeError(e);
      setLookup({ status: "error", hash, message: h.detail });
      if (noisy) {
        toast({ title: h.title, detail: h.detail, tone: "danger" });
      }
      return null;
    }
  }

  async function handleLookup() {
    setHashTouched(true);
    if (!canLookup) return;
    await resolveLookup(true);
  }

  async function handleAction(action: LifecycleAction) {
    setHashTouched(true);
    if (!configured || !hashOk || !wallet.address || !walletConnected) return;

    const record =
      currentLookup.status === "found" ? currentLookup.record : await resolveLookup(true);

    if (!record) {
      toast({
        title: "Certificate not found",
        detail: "Only registered hashes can be managed by an approved issuer or admin.",
        tone: "warning",
      });
      return;
    }

    if (action === "verify" && record.status === "verified") {
      toast({
        title: "Already verified",
        detail: "This certificate is already marked verified on-chain.",
        tone: "neutral",
      });
      return;
    }

    if (action === "verify" && record.status !== "issued") {
      toast({
        title: "Status blocks verification",
        detail: `This credential is ${statusLabel(record.status).toLowerCase()}, so it cannot move into verified state right now.`,
        tone: "warning",
      });
      return;
    }

    if (
      action === "suspend" &&
      onChainStatus(record) !== "issued" &&
      onChainStatus(record) !== "verified"
    ) {
      toast({
        title: "Status blocks suspension",
        detail: `This credential is ${statusLabel(onChainStatus(record)).toLowerCase()}, so it cannot be suspended right now.`,
        tone: "warning",
      });
      return;
    }

    if (action === "revoke" && onChainStatus(record) === "revoked") {
      toast({
        title: "Status blocks revocation",
        detail: `This credential is ${statusLabel(onChainStatus(record)).toLowerCase()}, so revocation is not available right now.`,
        tone: "warning",
      });
      return;
    }

    setPendingAction(action);
    try {
      const result =
        action === "verify"
          ? await withTimeout(
              verifyCertificate(wallet.address, normalizedHash),
              15000,
              "verify",
            )
          : action === "suspend"
            ? await withTimeout(
                suspendCertificate(wallet.address, normalizedHash),
                15000,
                "suspend",
              )
            : await withTimeout(
                revokeCertificate(wallet.address, normalizedHash),
                15000,
                "revoke",
              );
      const txHash = result?.hash;
      const nextStatus = nextStatusForAction(action);
      setLookup({
        status: "found",
        hash: normalizedHash,
        record: {
          ...record,
          status: nextStatus,
          verified: nextStatus === "verified",
          verifiedAt: nextStatus === "verified" ? Date.now() : record.verifiedAt,
        },
      });
      toast({
        title: actionTitle(action),
        detail: actionDetail(action),
        tone: "success",
        action: txHash
          ? {
              label: "View on stellar.expert \u2197",
              href: `${appConfig.explorerUrl}/tx/${txHash}`,
            }
          : undefined,
      });
      if (action === "verify") {
        onVerified?.(normalizedHash, txHash);
      }
      onStatusChange?.(
        normalizedHash,
        nextStatus,
        txHash,
        {
          ...record,
          status: nextStatus,
          verified: nextStatus === "verified",
          verifiedAt: nextStatus === "verified" ? Date.now() : record.verifiedAt,
        },
      );
    } catch (e) {
      const h = humanizeError(e);
      toast({ title: h.title, detail: h.detail, tone: "danger" });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleValidityWrite(action: "expiry" | "renew") {
    if (!wallet.address || !walletConnected || !foundRecord) return;
    const expiresAt = dateInputToUnixSeconds(expiresDate);
    if (expiresAt <= Math.floor(Date.now() / 1000)) {
      toast({
        title: "Invalid expiry",
        detail: "Pick a future validity date before saving or renewing.",
        tone: "warning",
      });
      return;
    }

    setPendingAction(action);
    try {
      const result = await withTimeout(
        action === "renew"
          ? renewCertificate(wallet.address, normalizedHash, expiresAt)
          : setCredentialExpiry(wallet.address, normalizedHash, expiresAt),
        15000,
        action === "renew" ? "renew_certificate" : "set_credential_expiry",
      );
      const refreshed = await getCertificate(normalizedHash);
      if (refreshed) {
        setLookup({ status: "found", hash: normalizedHash, record: refreshed });
        onStatusChange?.(normalizedHash, refreshed.status, result?.hash, refreshed);
      }
      toast({
        title: action === "renew" ? "Credential renewed" : "Validity window saved",
        detail:
          action === "renew"
            ? "The credential is active again with a new expiry date."
            : "This credential now has an on-chain expiry date.",
        tone: "success",
        action: result?.hash
          ? {
              label: "View on stellar.expert \u2197",
              href: `${appConfig.explorerUrl}/tx/${result.hash}`,
            }
          : undefined,
      });
    } catch (e) {
      if (isMissingContractMethod(e)) {
        toast({
          title: "Validity write not available yet",
          detail:
            "The live contract does not expose this method. The credential record is unchanged.",
          tone: "warning",
        });
      } else {
        const h = humanizeError(e);
        toast({ title: h.title, detail: h.detail, tone: "danger" });
      }
    } finally {
      setPendingAction(null);
    }
  }

  const formHint = (() => {
    if (!configured) return "Set the contract configuration first before verifying on-chain.";
    if (!certHash.trim()) return "Paste a certificate hash. The app will check chain state before enabling trusted verification.";
    if (!hashOk) return "Enter a full 64-character SHA-256 hash.";
    if (currentLookup.status === "loading") return "Checking whether this hash is already registered...";
    if (currentLookup.status === "missing") return "This hash is not registered, so on-chain approval is blocked.";
    if (currentLookup.status === "error") return currentLookup.message;
    if (currentLookup.status === "found" && currentLookup.record.status === "verified")
      return allowTrustedActions
        ? "This credential is already verified on-chain. You can still suspend or revoke it from here."
        : "This credential is already verified on-chain.";
    if (currentLookup.status === "found" && currentLookup.record.status === "revoked")
      return "This credential was revoked and cannot be verified again.";
    if (currentLookup.status === "found" && currentLookup.record.status === "suspended")
      return allowTrustedActions
        ? "This credential is suspended. Approved issuers or the admin can still revoke it."
        : "This credential is suspended. Resolve issuer status before trying again.";
    if (currentLookup.status === "found" && currentLookup.record.status === "expired")
      return allowTrustedActions
        ? "This credential is past its validity window. An approved issuer can renew it below."
        : "This credential is expired and no longer eligible for verification-based actions.";
    if (currentLookup.status === "found" && !walletConnected)
      return allowTrustedActions
        ? "Hash found. Connect Freighter on Stellar testnet with an approved issuer or admin wallet to manage it."
        : "Hash found. Employers can inspect status here while waiting for trusted verification.";
    if (currentLookup.status === "found")
      return allowTrustedActions
        ? "Hash found on-chain. Approved issuers or the admin wallet can approve, suspend, or revoke it."
        : "Hash found on-chain. Once an approved issuer or admin approves it, the employer can pay.";
    return "Use Look up if you want to refresh the current chain state manually.";
  })();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {!hashEditing && certHash ? (
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-surface-2 border border-border">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-pixel text-[10px] text-text-muted uppercase tracking-widest shrink-0">Hash</span>
              <span className="font-mono text-[12px] text-text truncate">{certHash.slice(0, 16)}…{certHash.slice(-8)}</span>
              {isValidHash(certHash) && (
                <span className="font-pixel text-[10px] text-verified tracking-widest uppercase shrink-0">Valid</span>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(certHash)}
                className="text-[12px] text-text-muted/50 hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0 font-[inherit]"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => setHashEditing(true)}
                className="text-[12px] text-text-muted hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0 font-[inherit]"
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <HashInput
            value={certHash}
            onChange={(v) => { setCertHash(v); setLookup({ status: "idle" }); }}
            onBlur={() => setHashTouched(true)}
            error={hashError}
            helper="Paste a SHA-256 hex string, upload a file, or drag it onto the field"
            touched={hashTouched}
          />
        )}
      </div>

      <div className="flex gap-2 flex-wrap max-sm:flex-col [&>*]:max-sm:w-full">
        <Button
          type="button"
          variant="secondary"
          onClick={handleLookup}
          disabled={!canLookup}
          loading={currentLookup.status === "loading"}
          icon={<img src="/ui-icons/icon-lookup.svg" alt="" width="16" height="16" aria-hidden="true" />}
        >
          Look up
        </Button>
        {allowTrustedActions ? (
          <>
            <Button
              type="button"
              variant="primary"
              onClick={() => void handleAction("verify")}
              disabled={!canVerify}
              loading={pendingAction === "verify"}
              icon={<img src="/ui-icons/icon-approve-cred.svg" alt="" width="16" height="16" aria-hidden="true" />}
            >
              Approve credential
            </Button>
            <Button
              type="button"
              variant="warning"
              onClick={() => void handleAction("suspend")}
              disabled={!canSuspend}
              loading={pendingAction === "suspend"}
              icon={<img src="/ui-icons/icon-suspend-cred.svg" alt="" width="16" height="16" aria-hidden="true" />}
            >
              Suspend credential
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => void handleAction("revoke")}
              disabled={!canRevoke}
              loading={pendingAction === "revoke"}
              icon={<img src="/ui-icons/icon-revoke-cred.svg" alt="" width="16" height="16" aria-hidden="true" />}
            >
              Revoke credential
            </Button>
          </>
        ) : null}
      </div>

      <p className="mt-[-4px] text-text-muted text-sm leading-normal">{formHint}</p>

      {currentLookup.status === "loading" && (
        <div
          className="bg-surface-2 border border-border rounded-md px-4 py-3 flex flex-col gap-2"
          aria-label="Loading certificate details"
          aria-busy="true"
        >
          <div className="flex gap-2 items-center text-sm flex-wrap">
            <span className="text-text-muted min-w-[56px]">Status</span>
            <Skeleton width={72} height={22} radius={4} />
          </div>
          <div className="flex gap-2 items-center text-sm flex-wrap">
            <span className="text-text-muted min-w-[56px]">Owner</span>
            <Skeleton width={160} height={18} radius={4} />
          </div>
          <div className="flex gap-2 items-center text-sm flex-wrap">
            <span className="text-text-muted min-w-[56px]">Issuer</span>
            <Skeleton width={160} height={18} radius={4} />
          </div>
        </div>
      )}

      {currentLookup.status === "found" && (
        <div className="bg-surface-2 border border-border rounded-md px-4 py-3 flex flex-col gap-2">
          <div className="flex gap-2 items-center text-sm flex-wrap">
            <span className="text-text-muted min-w-[56px]">Status</span>
            <Badge tone={statusTone(currentLookup.record.status)} dot>
              {statusLabel(currentLookup.record.status)}
            </Badge>
          </div>
          <div className="flex gap-2 items-center text-sm flex-wrap">
            <span className="text-text-muted min-w-[56px]">Owner</span>
            <span className="font-mono text-text break-all">
              {shortenAddress(currentLookup.record.owner)}
            </span>
          </div>
          <div className="flex gap-2 items-center text-sm flex-wrap">
            <span className="text-text-muted min-w-[56px]">Issuer</span>
            <span className="font-mono text-text break-all">
              {shortenAddress(currentLookup.record.issuer)}
            </span>
          </div>
          {currentLookup.record.title ? (
            <div className="flex gap-2 items-center text-sm flex-wrap">
              <span className="text-text-muted min-w-[56px]">Title</span>
              <span className="text-text break-all">{currentLookup.record.title}</span>
            </div>
          ) : null}
          {currentLookup.record.cohort ? (
            <div className="flex gap-2 items-center text-sm flex-wrap">
              <span className="text-text-muted min-w-[56px]">Cohort</span>
              <span className="text-text break-all">{currentLookup.record.cohort}</span>
            </div>
          ) : null}
          <div className="flex gap-2 items-center text-sm flex-wrap">
            <span className="text-text-muted min-w-[56px]">Expires</span>
            <span className="text-text">
              {formatUnixDate(currentLookup.record.expiresAt)}
            </span>
          </div>
          {allowTrustedActions && canWriteExpiry ? (
            <div className="mt-2 flex flex-col gap-3 border-t border-border pt-3">
              <Input
                type="date"
                label="New valid-until date"
                value={expiresDate}
                onChange={(e) => setExpiresDate(e.target.value)}
                helper="UTC calendar date. Required for set or renew."
              />
              <div className="flex flex-wrap gap-2 max-sm:flex-col [&>*]:max-sm:w-full">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void handleValidityWrite("expiry")}
                  disabled={!canWriteExpiry || currentLookup.record.status === "expired"}
                  loading={pendingAction === "expiry"}
                >
                  Set validity
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => void handleValidityWrite("renew")}
                  disabled={!canWriteExpiry}
                  loading={pendingAction === "renew"}
                >
                  Renew credential
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {currentLookup.status === "missing" && (
        <Badge tone="warning" dot>
          No certificate for that hash
        </Badge>
      )}

      {currentLookup.status === "error" && (
        <Badge tone="danger" dot>
          Unable to read chain state right now
        </Badge>
      )}
    </div>
  );
}

export default VerifyForm;
