"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DEMO_AUTOFILL_EVENT, DemoAutofillDetail } from "@/components/demo/demo-autofill-button";
import { Button, Input, useToast } from "@/components/ui";
import { humanizeError } from "@/lib/errors";
import { bytesToHex } from "@/lib/hex";
import { withTimeout } from "@/lib/with-timeout";
import { registerCertificate } from "@/lib/contract-client";
import { appConfig, hasRequiredConfig } from "@/lib/config";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";

export interface RegisterFormProps {
  onSuccess?: (
    hash: string,
    studentAddr: string,
    txHash?: string,
    credentialTitle?: string,
  ) => void;
}

function isValidAddress(addr: string): boolean {
  const trimmed = addr.trim();
  return trimmed.startsWith("G") && trimmed.length === 56;
}

function addressError(addr: string): string {
  const t = addr.trim();
  const wrongPrefix = !t.startsWith("G");
  const diff = 56 - t.length;
  if (wrongPrefix && t.length !== 56) return `Must start with G and be 56 characters (${t.length} entered)`;
  if (wrongPrefix) return `Must start with G — got "${t[0]}"`;
  if (diff > 0) return `${diff} character${diff === 1 ? "" : "s"} short (${t.length} / 56)`;
  if (diff < 0) return `${-diff} character${-diff === 1 ? "" : "s"} too long (${t.length} / 56)`;
  return "Invalid Stellar address";
}

function isValidHash(hash: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(hash.trim().replace(/^0x/i, ""));
}

function fileNameToTitle(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")          // strip extension
    .replace(/[-_]+/g, " ")           // hyphens/underscores → spaces
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()); // Title Case
}

async function extractPdfTitle(file: File): Promise<string | undefined> {
  try {
    // Read first 32 KB — enough to cover PDF info dict and XMP block
    const text = await file.slice(0, 32768).text();
    // PDF info dictionary: /Title (value)
    const dict = text.match(/\/Title\s*\(([^)\\]+)\)/);
    if (dict?.[1]?.trim()) return dict[1].trim();
    // XMP metadata: <dc:title>...<rdf:li ...>value</rdf:li>
    const xmp = text.match(/<dc:title[\s\S]{0,300}?<rdf:li[^>]*>([\s\S]+?)<\/rdf:li>/);
    if (xmp?.[1]?.trim()) return xmp[1].trim();
  } catch {
    // ignore — best-effort only
  }
  return undefined;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { wallet } = useFreighterWallet();
  const { toast } = useToast();
  const hashInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [studentAddr, setStudentAddr] = useState("");
  const [certHash, setCertHash] = useState("");
  const [credentialTitle, setCredentialTitle] = useState("");
  const [cohort, setCohort] = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hashing, setHashing] = useState(false);
  const [autofilled, setAutofilled] = useState(false);

  const [studentTouched, setStudentTouched] = useState(false);
  const [hashTouched, setHashTouched] = useState(false);

  useEffect(() => {
    function onAutofill(e: Event) {
      const detail = (e as CustomEvent<DemoAutofillDetail>).detail;
      if (!detail) return;
      setStudentAddr(detail.studentAddr);
      setCertHash(detail.certHash);
      setCredentialTitle("Stellar Smart Contract Bootcamp Completion");
      setCohort("Stellar PH Bootcamp 2026");
      setAdvancedOpen(true);
      setStudentTouched(false);
      setHashTouched(false);
      setAutofilled(true);
      setTimeout(() => setAutofilled(false), 900);
    }
    window.addEventListener(DEMO_AUTOFILL_EVENT, onAutofill);
    return () => window.removeEventListener(DEMO_AUTOFILL_EVENT, onAutofill);
  }, []);

  const studentError =
    studentTouched && studentAddr.trim() !== "" && !isValidAddress(studentAddr)
      ? addressError(studentAddr)
      : undefined;

  const studentHelper = !studentTouched && !studentAddr
    ? "Enter the student's Stellar public key"
    : !studentError && studentAddr.trim() && !isValidAddress(studentAddr)
      ? `${studentAddr.trim().length} / 56`
      : undefined;

  const hashError =
    hashTouched && certHash.trim() !== "" && !isValidHash(certHash)
      ? "Must be exactly 64 hexadecimal characters"
      : undefined;

  const walletConnected =
    wallet.status === "connected" && !!wallet.address && wallet.isExpectedNetwork;

  const canSubmit =
    hasRequiredConfig() &&
    walletConnected &&
    !submitting &&
    isValidAddress(studentAddr) &&
    isValidHash(certHash);

  async function handleHashFromFile(file: File) {
    setHashing(true);
    try {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const [buf, pdfTitle] = await Promise.all([
        file.arrayBuffer(),
        isPdf ? extractPdfTitle(file) : Promise.resolve(undefined),
      ]);
      const digest = await crypto.subtle.digest("SHA-256", buf);
      const hex = bytesToHex(new Uint8Array(digest));
      setCertHash(hex);
      setHashTouched(false);

      const suggested = pdfTitle ?? fileNameToTitle(file.name);
      if (suggested) {
        setCredentialTitle((prev) => prev || suggested);
        setAdvancedOpen(true);
      }
    } finally {
      setHashing(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragging(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleHashFromFile(file);
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) setStudentAddr(text.trim());
    } catch {
      // clipboard access denied or unavailable
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStudentTouched(true);
    setHashTouched(true);

    if (!canSubmit || !wallet.address) return;

    setSubmitting(true);
    try {
      const result = await withTimeout(
        registerCertificate(wallet.address, studentAddr.trim(), certHash.trim(), {
          title: credentialTitle.trim(),
          cohort: cohort.trim(),
          metadataUri: metadataUri.trim(),
        }),
        15000,
        "register",
      );
      const txHash = result?.hash;
      toast({
        title: "Certificate registered",
        tone: "success",
        action: txHash
          ? {
              label: "View on stellar.expert \u2197",
              href: `${appConfig.explorerUrl}/tx/${txHash}`,
            }
          : undefined,
      });
      onSuccess?.(certHash.trim(), studentAddr.trim(), txHash, credentialTitle.trim());
    } catch (e) {
      const h = humanizeError(e);
      const msg = e instanceof Error ? e.message : "";
      const isIssuerNotFound = /#7\b|issuer not found|no issuer registry/i.test(msg);
      const isIssuerPending = /#8\b|not approved/i.test(msg);
      toast({
        title: h.title,
        detail: h.detail,
        tone: "danger",
        action: isIssuerNotFound
          ? { label: "Register issuer →", href: "/issuer/register" }
          : isIssuerPending
            ? { label: "Check issuer status →", href: "/issuer" }
            : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className={`flex flex-col gap-4 rounded-xl transition-shadow duration-500${autofilled ? " shadow-[0_0_0_2px_rgba(245,158,11,0.3),0_0_20px_rgba(245,158,11,0.08)]" : ""}`}
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="flex flex-col gap-4">
        <Input
          mono
          label="Student wallet (G...)"
          value={studentAddr}
          onChange={(e) => setStudentAddr(e.target.value)}
          onBlur={() => setStudentTouched(true)}
          error={studentError}
          helper={studentHelper}
          placeholder="GABC...XYZ"
          autoComplete="off"
          spellCheck={false}
          labelAction={
            <button
              type="button"
              onClick={() => void handlePaste()}
              className="text-[11px] text-text-muted/50 hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0 font-[inherit]"
            >
              Paste
            </button>
          }
        />

        <div className="flex flex-col gap-1">
          <label htmlFor={hashInputId} className="text-[13px] font-medium text-text-muted">
            Certificate hash (64 hex)
          </label>
          <div
            className={[
              "relative rounded-lg border overflow-hidden bg-surface-2 transition-colors duration-150",
              dragging
                ? "border-primary bg-primary/5"
                : hashError
                  ? "border-danger"
                  : "border-border focus-within:border-primary",
            ].join(" ")}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drop overlay */}
            {dragging && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-surface/90 backdrop-blur-sm pointer-events-none">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-[13px] font-medium text-primary">Drop to compute SHA-256</span>
              </div>
            )}

            {/* Hashing overlay */}
            {hashing && (
              <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-surface/90 backdrop-blur-sm pointer-events-none">
                <svg className="w-4 h-4 text-primary animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span className="text-[13px] text-text-muted">Computing hash…</span>
              </div>
            )}

            <textarea
              id={hashInputId}
              rows={3}
              value={certHash}
              onChange={(e) => setCertHash(e.target.value)}
              onBlur={() => setHashTouched(true)}
              placeholder="0a1b2c3d4e5f… (64 hex characters)"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={hashError ? "true" : undefined}
              className="w-full px-3 py-2.5 font-mono text-[13px] text-text placeholder:text-text-muted/50 bg-transparent resize-none focus:outline-none leading-relaxed"
            />
            <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-surface">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-[12px] text-text-muted hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0 font-[inherit]"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload file
              </button>
              <span className="text-[11px] text-text-muted/50">or drag and drop</span>
              <span className={[
                "ml-auto font-mono text-[10px] tabular-nums transition-colors duration-150",
                isValidHash(certHash) ? "text-verified" : certHash.trim() ? "text-text-muted/60" : "text-text-muted/25",
              ].join(" ")}>
                {isValidHash(certHash) ? "Valid ✓" : `${certHash.replace(/\s/g, "").length} / 64`}
              </span>
            </div>
          </div>
          {hashError ? (
            <p className="text-[12px] text-danger" role="alert">{hashError}</p>
          ) : !hashTouched && !certHash ? (
            <p className="text-[12px] text-text-muted">Paste a SHA-256 hex string, upload a file, or drag it onto the field</p>
          ) : null}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleHashFromFile(f);
            }}
          />
        </div>

        {/* Advanced optional fields */}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setAdvancedOpen(o => !o)}
            className="flex items-center justify-between py-1.5 cursor-pointer text-left bg-transparent border-none p-0 font-[inherit] group"
            aria-expanded={advancedOpen}
          >
            <span className="text-[12px] font-medium text-text-muted/60 group-hover:text-text-muted transition-colors">Advanced (optional)</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={[
                "text-text-muted/60 group-hover:text-text-muted transition-transform duration-200",
                advancedOpen ? "rotate-180" : "",
              ].join(" ")}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <div className={[
            "grid transition-all duration-200 ease-in-out",
            advancedOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          ].join(" ")}>
            <div className="overflow-hidden">
              <div className="flex flex-col gap-4 pt-2 pl-4">
                <Input
                  label="Credential title"
                  value={credentialTitle}
                  onChange={(e) => setCredentialTitle(e.target.value)}
                  tooltip="Stored on-chain and shown on the proof page"
                  placeholder="Stellar Smart Contract Bootcamp Completion"
                  autoComplete="off"
                  spellCheck={false}
                  className="bg-black/20 border-white/8 shadow-[inset_0_2px_6px_rgba(0,0,0,0.3)]"
                />
                <Input
                  label="Cohort or batch"
                  value={cohort}
                  onChange={(e) => setCohort(e.target.value)}
                  tooltip="Example: Stellar PH Bootcamp 2026"
                  placeholder="Stellar PH Bootcamp 2026"
                  autoComplete="off"
                  spellCheck={false}
                  className="bg-black/20 border-white/8 shadow-[inset_0_2px_6px_rgba(0,0,0,0.3)]"
                />
                <Input
                  label="Metadata URL"
                  value={metadataUri}
                  onChange={(e) => setMetadataUri(e.target.value)}
                  tooltip="Use this later for hosted JSON evidence or richer proof details"
                  helper="Proof pages fetch this URL first, then fall back to the on-chain title and cohort."
                  placeholder="https://example.com/proofs/maria.json"
                  autoComplete="off"
                  spellCheck={false}
                  className="bg-black/20 border-white/8 shadow-[inset_0_2px_6px_rgba(0,0,0,0.3)]"
                />
                <div className="rounded-lg border border-border bg-surface-2/70 px-3 py-2 text-[12px] leading-relaxed text-text-muted">
                  <p className="font-semibold text-text">Metadata source of truth</p>
                  <p className="mt-1">
                    Host a JSON proof file, paste its URL here, and keep the file stable. This demo
                    does not upload or pin metadata yet.
                  </p>
                  <code className="mt-2 block break-all font-mono text-text-muted/80">
                    {'{ "title": "...", "description": "...", "skills": ["..."], "evidence": [] }'}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-1 max-sm:flex-col [&>*]:max-sm:w-full">
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          disabled={!canSubmit}
          icon={<img src="/ui-icons/icon-register-cert.svg" alt="" width="16" height="16" aria-hidden="true" />}
        >
          Register Certificate
        </Button>
        <Button type="button" variant="ghost" href="/issuer/batch">
          Issue a cohort from CSV
        </Button>
      </div>
    </form>
  );
}

export default RegisterForm;
