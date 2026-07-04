"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, CopyButton, Input, useToast } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { appConfig, hasRequiredConfig } from "@/lib/config";
import { EMPLOYER_REVIEW_STEPS } from "@/lib/employer-review";
import {
  getCertificate,
  getIssuer,
  createOpportunity,
  fundOpportunity,
} from "@/lib/contract-client";
import type { CertificateRecord } from "@/lib/contract-client";
import { humanizeError } from "@/lib/errors";
import { isValidDecimalAmount, parseAmountToInt, shortenAddress } from "@/lib/format";
import {
  buildProofVerificationBreakdown,
  type ProofVerificationCheckStatus,
} from "@/lib/proof-verification";
import { MAX_OPPORTUNITY_MILESTONES, type IssuerRecord } from "@/lib/types";
import { withTimeout } from "@/lib/with-timeout";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileDown,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  WalletCards,
} from "lucide-react";

interface EmployerOpportunityFormProps {
  initialHash?: string;
  initialCandidate?: string;
}

interface EmployerShortlistItem {
  hash: string;
  owner: string;
  title: string;
  status: CertificateRecord["status"];
  issuerStatus: string;
  savedAt: string;
}

const SHORTLIST_STORAGE_KEY = "stellaroid.employerShortlist.v1";

function isValidCertificateHash(value: string) {
  return /^[0-9a-f]{64}$/i.test(value.trim());
}

function normalizeAddressForCompare(address: string) {
  return address.trim().toUpperCase();
}

function ReviewItem({
  complete,
  label,
  detail,
  status,
}: {
  complete: boolean;
  label: string;
  detail: string;
  status?: ProofVerificationCheckStatus;
}) {
  const effectiveStatus = status ?? (complete ? "pass" : "warning");
  const toneClass =
    effectiveStatus === "pass"
      ? "text-success"
      : effectiveStatus === "fail"
        ? "text-danger"
        : "text-warning";

  return (
    <li className="flex gap-3 rounded-lg border border-border bg-bg px-3 py-3">
      <span
        className={`mt-0.5 ${toneClass}`}
        aria-hidden="true"
      >
        {effectiveStatus === "pass" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : effectiveStatus === "fail" ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <span className="block h-4 w-4 rounded-full border border-current" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-text">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-text-muted">
          {detail}
        </span>
      </span>
    </li>
  );
}

export function EmployerOpportunityForm({
  initialHash = "",
  initialCandidate = "",
}: EmployerOpportunityFormProps) {
  const { wallet } = useFreighterWallet();
  const { toast } = useToast();

  const [certHash, setCertHash] = useState(initialHash);
  const [cert, setCert] = useState<CertificateRecord | null>(null);
  const [issuer, setIssuer] = useState<IssuerRecord | null>(null);
  const [issuerLookupError, setIssuerLookupError] = useState<string | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [milestones, setMilestones] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [createdOppId, setCreatedOppId] = useState<string | null>(null);
  const [opportunityFunded, setOpportunityFunded] = useState(false);
  const [funding, setFunding] = useState(false);
  const [autoLookupAttempted, setAutoLookupAttempted] = useState(false);
  const [initialLookupError, setInitialLookupError] = useState<string | null>(
    null,
  );
  const [shortlist, setShortlist] = useState<EmployerShortlistItem[]>([]);

  const walletConnected =
    wallet.status === "connected" && !!wallet.address && wallet.isExpectedNetwork;

  const cleanHash = certHash.trim();
  const candidateFromLink = initialCandidate.trim();
  const validHashFormat = isValidCertificateHash(cleanHash);
  const candidateMatchesProof =
    !candidateFromLink ||
    !cert ||
    normalizeAddressForCompare(cert.owner) ===
      normalizeAddressForCompare(candidateFromLink);
  const configured = hasRequiredConfig();

  const handleLookup = useCallback(
    async (
      targetHash = certHash.trim(),
      options: { silent?: boolean } = {},
    ) => {
      const lookupHash = targetHash.trim();
      if (!lookupHash || !isValidCertificateHash(lookupHash)) {
        setInitialLookupError("Enter a 64-character certificate hash first.");
        return;
      }

      setLookupBusy(true);
      setCert(null);
      setIssuer(null);
      setIssuerLookupError(null);
      setInitialLookupError(null);
      setCreatedOppId(null);
      setOpportunityFunded(false);
      try {
        const record = await getCertificate(lookupHash);
        setCert(record);
        if (record?.title) {
          setTitle((current) =>
            current.trim() ? current : `Paid trial: ${record.title}`,
          );
        }
        if (!record) {
          if (options.silent) {
            setInitialLookupError("No certificate on-chain for that hash.");
          } else {
            toast({
              title: "Not found",
              detail: "No certificate on-chain for that hash.",
              tone: "warning",
            });
          }
        } else {
          try {
            setIssuer(await getIssuer(record.issuer));
          } catch (e) {
            const h = humanizeError(e);
            setIssuerLookupError(h.detail ?? h.title);
          }
        }
      } catch (e) {
        const h = humanizeError(e);
        if (options.silent) {
          setInitialLookupError(h.detail ?? h.title);
        } else {
          toast({ title: h.title, detail: h.detail, tone: "danger" });
        }
      } finally {
        setLookupBusy(false);
      }
    },
    [certHash, toast],
  );

  useEffect(() => {
    const hashFromProof = initialHash.trim();
    if (
      autoLookupAttempted ||
      !hashFromProof ||
      !isValidCertificateHash(hashFromProof)
    ) {
      return;
    }

    setAutoLookupAttempted(true);
    void handleLookup(hashFromProof, { silent: true });
  }, [autoLookupAttempted, handleLookup, initialHash]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SHORTLIST_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as EmployerShortlistItem[];
      if (Array.isArray(parsed)) {
        setShortlist(
          parsed.filter(
            (item) =>
              item &&
              typeof item.hash === "string" &&
              typeof item.owner === "string" &&
              typeof item.title === "string",
          ),
        );
      }
    } catch {
      window.localStorage.removeItem(SHORTLIST_STORAGE_KEY);
    }
  }, []);

  function persistShortlist(items: EmployerShortlistItem[]) {
    setShortlist(items);
    window.localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(items));
  }

  function handleAddToShortlist() {
    if (!cert || !validHashFormat) return;
    const item: EmployerShortlistItem = {
      hash: cleanHash,
      owner: cert.owner,
      title: cert.title || "Untitled credential",
      status: cert.status,
      issuerStatus: issuer?.status ?? (issuerLookupError ? "lookup failed" : "unknown"),
      savedAt: new Date().toISOString(),
    };
    const next = [
      item,
      ...shortlist.filter(
        (candidate) =>
          candidate.hash.toLowerCase() !== item.hash.toLowerCase(),
      ),
    ].slice(0, 6);
    persistShortlist(next);
    toast({
      title: "Candidate saved",
      detail: "This proof is now in your local employer review shortlist.",
      tone: "success",
    });
  }

  function handleRemoveFromShortlist(hash: string) {
    persistShortlist(
      shortlist.filter(
        (candidate) => candidate.hash.toLowerCase() !== hash.toLowerCase(),
      ),
    );
  }

  async function handleCreate() {
    if (!wallet.address || !cert) return;
    setSubmitting(true);
    try {
      const milestoneCount = Number.parseInt(milestones.trim(), 10);
      const result = await withTimeout(
        createOpportunity(
          wallet.address,
          cert.owner,
          certHash.trim(),
          title.trim() || "Paid trial",
          parseAmountToInt(amount, appConfig.assetDecimals),
          milestoneCount,
        ),
        15000,
        "create opportunity",
      );
      const oppId = result?.result as string | undefined;
      if (oppId !== undefined) {
        setCreatedOppId(oppId);
        setOpportunityFunded(false);
      }
      toast({
        title: "Opportunity created",
        detail: `Opportunity ${oppId ?? ""} is in Draft status. Fund it next to start the escrow.`,
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
      setSubmitting(false);
    }
  }

  async function handleFund() {
    if (!wallet.address || createdOppId === null) return;
    setFunding(true);
    try {
      const result = await withTimeout(
        fundOpportunity(wallet.address, createdOppId),
        15000,
        "fund opportunity",
      );
      toast({
        title: "Opportunity funded",
        detail: "Escrow is live. The candidate can now begin work.",
        tone: "success",
        action: result?.hash
          ? {
              label: <>View tx <ExternalLink className="inline w-3 h-3 ml-1" /></>,
              href: `${appConfig.explorerUrl}/tx/${result.hash}`,
            }
          : undefined,
      });
      setOpportunityFunded(true);
    } catch (e) {
      const h = humanizeError(e);
      toast({ title: h.title, detail: h.detail, tone: "danger" });
    } finally {
      setFunding(false);
    }
  }

  const parsedMilestones = Number.parseInt(milestones.trim(), 10);
  const validMilestoneCount =
    Number.isInteger(parsedMilestones) &&
    String(parsedMilestones) === milestones.trim() &&
    parsedMilestones >= 1 &&
    parsedMilestones <= MAX_OPPORTUNITY_MILESTONES;
  const amountIsValid = isValidDecimalAmount(amount, appConfig.assetDecimals);
  const verificationBreakdown = cert
    ? buildProofVerificationBreakdown({
        hash: cleanHash,
        cert,
        issuer,
        issuerLookupFailed: Boolean(issuerLookupError),
      })
    : null;
  const trustReady =
    verificationBreakdown?.decision === "ready_for_paid_trial_review";
  const canCreate = Boolean(
    configured &&
    walletConnected &&
    cert &&
    cert.status === "verified" &&
    trustReady &&
    candidateMatchesProof &&
    !submitting &&
    amountIsValid &&
    validMilestoneCount,
  );
  const hashError =
    cleanHash && !validHashFormat
      ? "Use a 64-character hex certificate hash."
      : undefined;
  const amountError =
    amount.trim() && !amountIsValid
      ? `Enter a positive ${appConfig.assetCode} amount.`
      : undefined;
  const milestoneError =
    milestones.trim() && !validMilestoneCount
      ? `Use a whole number from 1 to ${MAX_OPPORTUNITY_MILESTONES}.`
      : undefined;
  const proofLink = validHashFormat ? `/proof/${cleanHash}` : null;
  const proofPackLink = validHashFormat ? `/proof/${cleanHash}/export` : null;
  const savedCurrentCandidate = Boolean(
    validHashFormat &&
      shortlist.some(
        (candidate) =>
          candidate.hash.toLowerCase() === cleanHash.toLowerCase(),
      ),
  );
  const employerReviewDecision =
    cert && !candidateMatchesProof
      ? "Inspect only: the proof-link candidate does not match the credential owner."
      : verificationBreakdown
        ? verificationBreakdown.employerTrustSummary
        : "Look up a proof before creating an opportunity.";
  const proofChecklist = verificationBreakdown
    ? verificationBreakdown.checks.map((check) => ({
        complete: check.status === "pass",
        status: check.status,
        label: check.title,
        detail: `${check.label}: ${check.detail}`,
      }))
    : [
        {
          complete: Boolean(cert && cert.status === "verified"),
          status: (cert?.status === "verified"
            ? "pass"
            : "warning") as ProofVerificationCheckStatus,
          label: "Verified credential loaded",
          detail: cert
            ? cert.status === "verified"
              ? "This credential is in the verified on-chain state."
              : `Current status is ${cert.status}; funding stays locked until verification.`
            : "Look up the proof hash before creating an opportunity.",
        },
      ];
  const checklist = [
    ...proofChecklist,
    {
      complete: Boolean(cert && candidateMatchesProof),
      status: (cert
        ? candidateMatchesProof
          ? "pass"
          : "fail"
        : "warning") as ProofVerificationCheckStatus,
      label: "Candidate wallet matches",
      detail:
        cert && candidateFromLink
          ? candidateMatchesProof
            ? "The proof-link candidate matches the credential owner."
            : "The proof-link candidate does not match the credential owner."
          : cert
            ? "The credential owner will be used as the paid-trial candidate."
            : "Candidate context appears after a credential lookup.",
    },
    {
      complete: walletConnected,
      status: (walletConnected ? "pass" : "warning") as ProofVerificationCheckStatus,
      label: "Employer wallet ready",
      detail: walletConnected
        ? "Freighter is connected to the expected Stellar network."
        : "Connect Freighter on the expected network before signing.",
    },
    {
      complete: amountIsValid && validMilestoneCount,
      status: (amountIsValid && validMilestoneCount ? "pass" : "warning") as ProofVerificationCheckStatus,
      label: "Escrow terms ready",
      detail:
        amountIsValid && validMilestoneCount
          ? "Amount and milestone count are valid for the contract."
          : "Enter a positive amount and a supported milestone count.",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {(initialHash || initialCandidate) && (
        <section
          className="rounded-2xl border border-primary/25 bg-primary/5 p-5"
          aria-label="Proof handoff"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-[760px]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                <p className="text-xs uppercase tracking-[0.16em] text-primary">
                  Proof handoff
                </p>
              </div>
              <h2 className="mt-2 text-xl font-semibold text-text">
                Review before funding
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                This console was opened from a proof page. Confirm the
                credential status, candidate wallet, and escrow terms before
                creating the paid trial.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {proofLink ? (
                <Button
                  variant="secondary"
                  href={proofLink}
                  icon={<ExternalLink className="h-4 w-4" />}
                >
                  Open proof
                </Button>
              ) : null}
              {proofPackLink ? (
                <Button
                  variant="ghost"
                  href={proofPackLink}
                  icon={<FileDown className="h-4 w-4" />}
                >
                  Proof pack
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-bg px-4 py-3">
              <span className="text-xs uppercase tracking-[0.14em] text-text-muted">
                Proof hash
              </span>
              <div className="mt-2 flex min-w-0 items-center gap-2">
                <code className="min-w-0 flex-1 break-all text-xs text-text">
                  {cleanHash || "No hash supplied"}
                </code>
                {cleanHash ? (
                  <CopyButton
                    value={cleanHash}
                    ariaLabel="Copy certificate hash"
                    className="min-h-11 min-w-11"
                  />
                ) : null}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-bg px-4 py-3">
              <span className="text-xs uppercase tracking-[0.14em] text-text-muted">
                Candidate wallet
              </span>
              <div className="mt-2 flex min-w-0 items-center gap-2">
                <code className="min-w-0 flex-1 break-all text-xs text-text">
                  {candidateFromLink || cert?.owner || "Loaded after lookup"}
                </code>
                {candidateFromLink || cert?.owner ? (
                  <CopyButton
                    value={candidateFromLink || cert?.owner || ""}
                    ariaLabel="Copy candidate wallet"
                    className="min-h-11 min-w-11"
                  />
                ) : null}
              </div>
            </div>
          </div>

          <ul className="mt-4 grid list-none gap-3 p-0 md:grid-cols-2">
            {checklist.map((item) => (
              <ReviewItem key={item.label} {...item} />
            ))}
          </ul>

          {initialLookupError ? (
            <div className="mt-4 flex gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-text">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-warning"
                aria-hidden="true"
              />
              <p className="m-0 leading-relaxed">{initialLookupError}</p>
            </div>
          ) : null}
          {issuerLookupError ? (
            <div className="mt-4 flex gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-text">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-warning"
                aria-hidden="true"
              />
              <p className="m-0 leading-relaxed">
                Issuer registry evidence could not be loaded: {issuerLookupError}
              </p>
            </div>
          ) : null}
        </section>
      )}

      <section className="rounded-2xl border border-border bg-surface p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">Look up credential</h2>
          <p className="mt-1 text-sm text-text-muted">
            Start with the proof hash. A verified credential unlocks the paid
            trial form.
          </p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <Input
            label="Certificate hash"
            value={certHash}
            onChange={(e) => {
              setCertHash(e.target.value);
              setCert(null);
              setIssuer(null);
              setIssuerLookupError(null);
              setCreatedOppId(null);
              setOpportunityFunded(false);
            }}
            placeholder="64 hex characters"
            mono
            className="flex-1"
            error={hashError}
          />
          <Button
            variant="secondary"
            onClick={() => void handleLookup()}
            icon={<Search className="h-4 w-4" />}
            loading={lookupBusy}
            disabled={!cleanHash || !validHashFormat}
          >
            Look up
          </Button>
        </div>

        {cert ? (
          <div className="rounded-xl border border-border bg-bg px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm font-semibold text-text">
                {cert.title || "Untitled credential"}
              </span>
              <Badge
                tone={cert.status === "verified" ? "success" : "warning"}
                dot
              >
                {cert.status}
              </Badge>
            </div>
            <span className="text-xs text-text-muted font-mono">
              Owner: {cert.owner}
            </span>
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-xs uppercase tracking-[0.14em] text-text-muted">
                  Employer review brief
                </span>
                <Badge
                  tone={trustReady && candidateMatchesProof ? "success" : "warning"}
                  dot
                >
                  {trustReady && candidateMatchesProof
                    ? "ready"
                    : "review needed"}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {employerReviewDecision} Candidate wallet:{" "}
                <span className="font-mono text-text">
                  {shortenAddress(cert.owner, 8)}
                </span>
              </p>
              <p className="mt-2 text-xs leading-relaxed text-text-muted">
                Issuer evidence:{" "}
                <span className="font-semibold text-text">
                  {issuer?.status ?? (issuerLookupError ? "lookup failed" : "loading")}
                </span>
                {issuer?.name ? ` · ${issuer.name}` : ""}
              </p>
              <ol className="mt-3 grid list-none gap-2 p-0">
                {EMPLOYER_REVIEW_STEPS.map((step, index) => (
                  <li key={step.id} className="flex gap-2 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-[0.6875rem] font-semibold text-text-muted">
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-text">
                        {step.title}
                      </span>
                      <span className="block leading-relaxed text-text-muted">
                        {step.detail}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {proofLink ? (
                <Button variant="ghost" size="sm" href={proofLink}>
                  Open proof page
                </Button>
              ) : null}
              {proofPackLink ? (
                <Button variant="ghost" size="sm" href={proofPackLink}>
                  Download proof pack
                </Button>
              ) : null}
              <Button
                variant={savedCurrentCandidate ? "secondary" : "ghost"}
                size="sm"
                onClick={handleAddToShortlist}
                icon={<ClipboardList className="h-4 w-4" />}
                disabled={!validHashFormat}
              >
                {savedCurrentCandidate ? "Saved for review" : "Save for review"}
              </Button>
            </div>
          </div>
        ) : initialCandidate ? (
          <div className="rounded-xl border border-border bg-bg px-4 py-3 flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.14em] text-text-muted">
              Candidate from proof link
            </span>
            <code className="text-xs text-text break-all">{initialCandidate}</code>
          </div>
        ) : null}
      </section>

      {cert && !candidateMatchesProof ? (
        <div
          className="flex gap-3 rounded-2xl border border-danger/30 bg-danger/10 px-5 py-4"
          role="alert"
        >
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-danger"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-text">
              Candidate wallet mismatch
            </p>
            <p className="mt-1 text-sm leading-relaxed text-text-muted">
              The proof link supplied {candidateFromLink}, but the credential
              owner is {cert.owner}. Funding is disabled until the proof link
              and credential owner agree.
            </p>
          </div>
        </div>
      ) : null}

      <section
        className="rounded-2xl border border-border bg-surface p-5"
        aria-label="Employer candidate shortlist"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-primary">
              Review shortlist
            </p>
            <h2 className="mt-1 text-xl font-semibold text-text">
              Saved proof candidates
            </h2>
            <p className="mt-1 max-w-[680px] text-sm leading-relaxed text-text-muted">
              Keep up to six proof-backed candidates in this browser while you
              compare issuer evidence, proof packs, and escrow readiness.
            </p>
          </div>
          <Badge tone={shortlist.length ? "success" : "neutral"} dot>
            {shortlist.length ? `${shortlist.length} saved` : "empty"}
          </Badge>
        </div>

        {shortlist.length ? (
          <ul className="mt-4 grid list-none gap-3 p-0 lg:grid-cols-2">
            {shortlist.map((candidate) => {
              const savedDate = new Intl.DateTimeFormat("en", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(candidate.savedAt));

              return (
                <li
                  key={candidate.hash}
                  className="rounded-xl border border-border bg-bg p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text">
                        {candidate.title}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        Saved {savedDate}
                      </p>
                    </div>
                    <Badge
                      tone={candidate.status === "verified" ? "success" : "warning"}
                      dot
                    >
                      {candidate.status}
                    </Badge>
                  </div>
                  <dl className="mt-3 grid gap-2 text-xs">
                    <div>
                      <dt className="uppercase tracking-[0.12em] text-text-muted">
                        Candidate
                      </dt>
                      <dd className="mt-1 break-all font-mono text-text">
                        {candidate.owner}
                      </dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-[0.12em] text-text-muted">
                        Issuer status
                      </dt>
                      <dd className="mt-1 text-text">{candidate.issuerStatus}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" href={`/proof/${candidate.hash}`}>
                      Proof
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      href={`/proof/${candidate.hash}/export`}
                    >
                      Pack
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      href={`/talent/${candidate.owner}?proof=${candidate.hash}`}
                    >
                      Passport
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFromShortlist(candidate.hash)}
                      icon={<Trash2 className="h-4 w-4" />}
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-4 rounded-xl border border-border bg-bg px-4 py-4">
            <p className="text-sm font-semibold text-text">
              No saved candidates yet
            </p>
            <p className="mt-1 text-sm leading-relaxed text-text-muted">
              Look up a proof hash, then save the candidate for side-by-side
              employer review.
            </p>
          </div>
        )}
      </section>

      {cert && cert.status === "verified" ? (
        <section className="rounded-2xl border border-border bg-surface p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-text">Create paid trial</h2>
              <p className="mt-1 text-sm text-text-muted">
                The contract creates the opportunity first, then funds escrow
                as a separate signed step.
              </p>
            </div>
            <Badge
              tone={trustReady && candidateMatchesProof ? "success" : "danger"}
              dot
            >
              {trustReady && candidateMatchesProof ? "ready for escrow" : "blocked"}
            </Badge>
          </div>
          <Input
            label="Opportunity title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., 2-week frontend trial"
          />
          <Input
            label={`Amount (${appConfig.assetCode})`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 100"
            helper="Funds will be held in escrow until you release them."
            error={amountError}
          />
          <Input
            label="Number of milestones"
            value={milestones}
            onChange={(e) => setMilestones(e.target.value)}
            placeholder="1"
            helper={`Use 1-${MAX_OPPORTUNITY_MILESTONES} milestones. Candidate submits each milestone for your approval before release.`}
            error={milestoneError}
          />
          {!canCreate ? (
            <div className="rounded-xl border border-border bg-bg px-4 py-3">
              <p className="text-sm font-semibold text-text">
                Before creating this opportunity
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-muted">
                {!configured ? <li>Set the contract configuration.</li> : null}
                {!walletConnected ? (
                  <li>Connect Freighter on the expected Stellar network.</li>
                ) : null}
                {!candidateMatchesProof ? (
                  <li>
                    Use a proof link whose candidate matches the credential owner.
                  </li>
                ) : null}
                {!trustReady ? (
                  <li>
                    Resolve proof breakdown warnings, especially issuer registry status.
                  </li>
                ) : null}
                {!amountIsValid ? (
                  <li>Enter a positive {appConfig.assetCode} amount.</li>
                ) : null}
                {!validMilestoneCount ? (
                  <li>
                    Use a whole milestone count from 1 to{" "}
                    {MAX_OPPORTUNITY_MILESTONES}.
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="primary"
              onClick={() => void handleCreate()}
              icon={<UserCheck className="h-4 w-4" />}
              loading={submitting}
              disabled={!canCreate}
            >
              Create opportunity
            </Button>
            {createdOppId !== null ? (
              <Button
                variant="primary"
                onClick={() => void handleFund()}
                icon={<WalletCards className="h-4 w-4" />}
                loading={funding}
                disabled={opportunityFunded}
              >
                {opportunityFunded ? "Escrow funded" : "Fund escrow"}
              </Button>
            ) : null}
          </div>
          {createdOppId !== null ? (
            <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-text">
                    Opportunity #{createdOppId} is ready to track
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    Keep the flow moving from creation to funding to milestone review without
                    losing the candidate context.
                  </p>
                </div>
                <Badge tone={opportunityFunded ? "success" : "warning"} dot>
                  {opportunityFunded ? "funded" : "draft"}
                </Badge>
              </div>
              <div className="mt-3 flex gap-3 flex-wrap">
                <Button variant="secondary" href={`/opportunity/${createdOppId}`}>
                  Open opportunity
                </Button>
                <Button variant="ghost" href={`/talent/${cert.owner}`}>
                  View candidate passport
                </Button>
                <Button variant="ghost" href={`/proof/${certHash.trim()}`}>
                  Back to proof
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
