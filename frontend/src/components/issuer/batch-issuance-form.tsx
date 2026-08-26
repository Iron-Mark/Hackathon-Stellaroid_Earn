"use client";

import { useId, useRef, useState } from "react";
import { Badge, Button, useToast } from "@/components/ui";
import { HashReveal } from "@/components/ui/hash-reveal";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import {
  applyChainLookups,
  BATCH_TEMPLATE_CSV,
  buildBatchAnalyticsProperties,
  buildSigningQueue,
  CHAIN_LOOKUP_CONCURRENCY,
  hashesNeedingLookup,
  isAlreadyExistsError,
  isSigningDeclined,
  mapWithConcurrency,
  parseBatchCsv,
  summarizeBatch,
  summarizeQueue,
  type ChainLookup,
  type QueueItem,
} from "@/lib/batch-issuance";
import { appConfig, hasRequiredConfig } from "@/lib/config";
import { getCertificate, registerCertificate } from "@/lib/contract-client";
import { humanizeError } from "@/lib/errors";
import { shortenAddress } from "@/lib/format";
import { trackProductEvent } from "@/lib/product-analytics";
import { withTimeout } from "@/lib/with-timeout";
import { ExternalLink } from "lucide-react";

function queueTone(
  status: QueueItem["queueStatus"],
): "success" | "warning" | "danger" | "primary" | "verified" | "neutral" {
  switch (status) {
    case "ready":
      return "success";
    case "signing":
      return "primary";
    case "submitted":
      return "verified";
    case "skipped":
    case "stopped":
      return "warning";
    case "error":
    case "blocked":
      return "danger";
    default:
      return "neutral";
  }
}

function downloadTemplate() {
  const blob = new Blob([BATCH_TEMPLATE_CSV], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "stellaroid-batch-template.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function BatchIssuanceForm() {
  const { wallet } = useFreighterWallet();
  const { toast } = useToast();
  const fileInputId = useId();
  const pasteId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stopRef = useRef(false);

  const [dragging, setDragging] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [rawCount, setRawCount] = useState(0);
  const [checking, setChecking] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [signing, setSigning] = useState(false);

  const walletConnected =
    wallet.status === "connected" && !!wallet.address && wallet.isExpectedNetwork;
  const summary = summarizeBatch(queue);
  const queueCounts = summarizeQueue(queue);
  const blockedCount = queue.filter((row) => row.queueStatus === "blocked").length;
  const canSign =
    hasRequiredConfig() &&
    walletConnected &&
    !signing &&
    !checking &&
    queueCounts.ready > 0;

  async function lookupChain(items: QueueItem[]): Promise<QueueItem[]> {
    const hashes = hashesNeedingLookup(items);
    const report: Record<string, Exclude<ChainLookup, "unchecked">> = {};
    await mapWithConcurrency(hashes, CHAIN_LOOKUP_CONCURRENCY, async (hash) => {
      try {
        const record = await getCertificate(hash);
        report[hash] = record ? "exists" : "free";
      } catch {
        report[hash] = "failed";
      }
    });
    return buildSigningQueue(applyChainLookups(items, report));
  }

  async function loadCsv(text: string, sourceName: string) {
    const parsed = parseBatchCsv(text);
    if (!parsed.ok) {
      setQueue([]);
      setTruncated(false);
      setRawCount(0);
      setParseError(parsed.error);
      setFileName(sourceName);
      return;
    }

    setParseError(null);
    setFileName(sourceName);
    setTruncated(parsed.truncated);
    setRawCount(parsed.rawCount);
    const preview = buildSigningQueue(parsed.rows);
    setQueue(preview);
    trackProductEvent(
      "issuer_batch_previewed",
      buildBatchAnalyticsProperties({
        rowCount: parsed.rows.length,
        readyCount: summarizeBatch(parsed.rows).ready,
        blockedCount: summarizeBatch(parsed.rows).blocked,
        truncated: parsed.truncated,
      }),
    );

    if (parsed.truncated) {
      toast({
        title: "CSV truncated",
        detail: `Only the first 25 of ${parsed.rawCount} rows were queued. Split larger cohorts.`,
        tone: "warning",
      });
    }

    setChecking(true);
    try {
      const withChain = await lookupChain(preview);
      setQueue(withChain);
    } finally {
      setChecking(false);
    }
  }

  async function handleFile(file: File) {
    const text = await file.text();
    await loadCsv(text, file.name);
  }

  async function handleSubmitQueue() {
    if (!canSign || !wallet.address) return;
    stopRef.current = false;
    setSigning(true);
    trackProductEvent(
      "issuer_batch_sign_started",
      buildBatchAnalyticsProperties({
        rowCount: queue.length,
        readyCount: queueCounts.ready,
      }),
    );

    let submitted = 0;
    let skipped = 0;
    let errors = 0;
    let stopped = false;
    const issuer = wallet.address;

    try {
      for (let index = 0; index < queue.length; index += 1) {
        if (stopRef.current) {
          stopped = true;
          setQueue((current) =>
            current.map((item, itemIndex) =>
              itemIndex >= index && item.queueStatus === "ready"
                ? {
                    ...item,
                    queueStatus: "stopped",
                    queueDetail: "Signing stopped before this row",
                  }
                : item,
            ),
          );
          break;
        }

        const item = queue[index];
        if (item.queueStatus !== "ready") continue;

        setQueue((current) =>
          current.map((row, rowIndex) =>
            rowIndex === index
              ? { ...row, queueStatus: "signing", queueDetail: "Waiting on wallet signature" }
              : row,
          ),
        );

        try {
          const result = await withTimeout(
            registerCertificate(issuer, item.graduate, item.certHash, {
              title: item.title,
              cohort: item.cohort,
              metadataUri: item.metadataUri,
            }),
            20_000,
            "register_certificate",
          );
          submitted += 1;
          setQueue((current) =>
            current.map((row, rowIndex) =>
              rowIndex === index
                ? {
                    ...row,
                    queueStatus: "submitted",
                    queueDetail: "Registered on Stellar testnet",
                    txHash: result?.hash,
                    chain: "exists",
                  }
                : row,
            ),
          );
        } catch (error) {
          if (isSigningDeclined(error)) {
            stopped = true;
            const human = humanizeError(error);
            setQueue((current) =>
              current.map((row, rowIndex) => {
                if (rowIndex === index) {
                  return {
                    ...row,
                    queueStatus: "stopped",
                    queueDetail: human.detail,
                  };
                }
                if (rowIndex > index && row.queueStatus === "ready") {
                  return {
                    ...row,
                    queueStatus: "stopped",
                    queueDetail: "Signing stopped before this row",
                  };
                }
                return row;
              }),
            );
            toast({ title: human.title, detail: human.detail, tone: "warning" });
            break;
          }

          if (isAlreadyExistsError(error)) {
            skipped += 1;
            setQueue((current) =>
              current.map((row, rowIndex) =>
                rowIndex === index
                  ? {
                      ...row,
                      queueStatus: "skipped",
                      queueDetail: "Already on-chain",
                      chain: "exists",
                    }
                  : row,
              ),
            );
            continue;
          }

          errors += 1;
          const human = humanizeError(error);
          setQueue((current) =>
            current.map((row, rowIndex) =>
              rowIndex === index
                ? { ...row, queueStatus: "error", queueDetail: human.detail }
                : row,
            ),
          );
        }
      }
    } finally {
      setSigning(false);
      trackProductEvent(
        "issuer_batch_sign_finished",
        buildBatchAnalyticsProperties({
          rowCount: queue.length,
          readyCount: queueCounts.ready,
          submittedCount: submitted,
          skippedCount: skipped,
          errorCount: errors,
          stopped,
        }),
      );
      if (!stopped) {
        toast({
          title: submitted > 0 ? "Batch signing finished" : "No rows registered",
          detail: `${submitted} registered, ${skipped} skipped, ${errors} failed. All writes target Stellar testnet.`,
          tone: submitted > 0 ? "success" : errors > 0 ? "danger" : "warning",
        });
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
          Issuer console
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-text">Batch issuance</h1>
        <p className="mt-2 max-w-[720px] text-sm text-text-muted">
          Preview a CSV, catch invalid wallets and duplicate hashes, then sign a
          queue. Each ready row calls <code className="font-mono text-text">register_certificate</code> on
          the live v3.0.0 testnet contract. Freighter signs one transaction per
          graduate. Stellar testnet XLM has no monetary value.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={downloadTemplate}>
            Download CSV template
          </Button>
          <Button type="button" variant="ghost" size="sm" href="/app">
            Issue one credential
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-xl font-semibold text-text">1. Load a cohort CSV</h2>
        <p className="mt-2 text-sm text-text-muted">
          Columns: graduate wallet, SHA-256 hash, optional title, cohort, and
          metadata URI. Header aliases such as student or cert_hash also work.
        </p>

        <input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="sr-only"
          aria-label="CSV file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.target.value = "";
          }}
        />

        <div
          className={[
            "mt-4 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-border bg-bg/40",
          ].join(" ")}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              setDragging(false);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
        >
          <p className="text-sm text-text">Drop a CSV here</p>
          <p className="mt-1 text-xs text-text-muted">
            {fileName ? `Loaded ${fileName}` : "Up to 25 rows per queue"}
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => fileInputRef.current?.click()}
            disabled={signing || checking}
          >
            Choose CSV file
          </Button>
        </div>

        <label htmlFor={pasteId} className="mt-5 block text-[13px] font-medium text-text-muted">
          Or paste CSV
        </label>
        <textarea
          id={pasteId}
          rows={6}
          value={pasteValue}
          onChange={(event) => setPasteValue(event.target.value)}
          spellCheck={false}
          disabled={signing}
          placeholder="graduate,hash,title,cohort,metadata_uri"
          className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-[13px] text-text placeholder:text-text-muted/50 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60"
        />
        <div className="mt-3">
          <Button
            type="button"
            variant="secondary"
            disabled={!pasteValue.trim() || signing || checking}
            onClick={() => void loadCsv(pasteValue, "pasted CSV")}
          >
            Preview pasted CSV
          </Button>
        </div>
        {parseError ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            {parseError}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-text">2. Preview and signing queue</h2>
            <p className="mt-2 text-sm text-text-muted">
              Ready rows can be signed. Invalid, duplicate, and already on-chain
              hashes stay out of the wallet prompts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="success">{queueCounts.ready} ready</Badge>
            <Badge tone="warning">{summary.duplicateInFile} in-file duplicates</Badge>
            <Badge tone="danger">{blockedCount} blocked</Badge>
            {summary.onChain > 0 ? (
              <Badge tone="warning">{summary.onChain} on-chain</Badge>
            ) : null}
          </div>
        </div>

        {checking ? (
          <p className="mt-4 text-sm text-text-muted" aria-live="polite">
            Checking hashes on Stellar testnet…
          </p>
        ) : null}
        {truncated ? (
          <p className="mt-4 text-sm text-warning" role="status">
            Showing {queue.length} of {rawCount} rows. Split the rest into another CSV.
          </p>
        ) : null}

        {queue.length === 0 ? (
          <p className="mt-6 text-sm text-text-muted">
            Load a CSV to see the preview table.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[720px] w-full border-collapse text-left text-sm">
              <caption className="sr-only">Batch issuance preview</caption>
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-[0.12em] text-text-muted">
                  <th className="py-2 pr-3 font-medium">Row</th>
                  <th className="py-2 pr-3 font-medium">Graduate</th>
                  <th className="py-2 pr-3 font-medium">Hash</th>
                  <th className="py-2 pr-3 font-medium">Title</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium">Proof</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((row) => (
                  <tr key={row.id} className="border-b border-border/70 align-top">
                    <td className="py-3 pr-3 font-mono text-text-muted">{row.sourceLine}</td>
                    <td className="py-3 pr-3 font-mono text-text">
                      {row.graduate ? shortenAddress(row.graduate, 4) : "Missing"}
                    </td>
                    <td className="py-3 pr-3">
                      {row.certHash ? (
                        <HashReveal hash={row.certHash} />
                      ) : (
                        <span className="text-text-muted">Missing</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-text">{row.title || "Untitled"}</td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-col gap-1">
                        <Badge tone={queueTone(row.queueStatus)}>{row.queueStatus}</Badge>
                        {row.queueDetail ? (
                          <span className="text-xs text-text-muted">{row.queueDetail}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3">
                      {row.queueStatus === "submitted" ? (
                        <a
                          className="text-primary no-underline hover:underline"
                          href={`/proof/${row.certHash}`}
                        >
                          Open proof
                        </a>
                      ) : (
                        <span className="text-text-muted">Not yet</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="primary"
            disabled={!canSign}
            loading={signing}
            onClick={() => void handleSubmitQueue()}
          >
            {signing
              ? "Signing queue"
              : `Sign ${queueCounts.ready} ready row${queueCounts.ready === 1 ? "" : "s"}`}
          </Button>
          {signing ? (
            <Button
              type="button"
              variant="warning"
              onClick={() => {
                stopRef.current = true;
              }}
            >
              Stop after this row
            </Button>
          ) : null}
        </div>
        {!walletConnected ? (
          <p className="mt-3 text-sm text-text-muted">
            Connect a testnet wallet to sign the queue.
          </p>
        ) : null}
        {queueCounts.submitted > 0 ? (
          <p className="mt-3 text-sm text-text-muted" aria-live="polite">
            {queueCounts.submitted} registered
            {queueCounts.skipped ? `, ${queueCounts.skipped} skipped` : ""}
            {queueCounts.error ? `, ${queueCounts.error} failed` : ""}.
            {queue.some((row) => row.txHash) ? (
              <>
                {" "}
                Explorer:{" "}
                <a
                  className="text-primary no-underline hover:underline"
                  href={appConfig.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  stellar.expert <ExternalLink className="inline h-3 w-3" />
                </a>
              </>
            ) : null}
          </p>
        ) : null}
      </section>
    </div>
  );
}
