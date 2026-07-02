# Proof Block Redesign — Trust Narrative Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Restructure the Proof Block's two UI surfaces (dashboard preview card and full public proof page) into a trust-first reading order: What they earned → Is it trustworthy → How to verify → Share it.

**Architecture:** Four files change. `proof-qr-block.tsx` gets a larger QR size. `proof-block-preview.tsx` adds a `certStatus` prop and reads credential title from `getProofMetadata`. `app-experience.tsx` passes the new prop. `proof-card.tsx` gets a full section reorder with two native `<details>` disclosures for the technical rows and rubric checklist.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Lucide icons. No new dependencies.

---

## File Map

| File | Change |
|---|---|
| `frontend/src/components/proof/proof-qr-block.tsx` | Bump QR from 96 → 128 px |
| `frontend/src/components/proof/proof-block-preview.tsx` | Add `certStatus` prop, derive title via `getProofMetadata`, rewrite copy |
| `frontend/src/app/app/app-experience.tsx` | Pass `certStatus={milestones.credentialStatus}` to `<ProofBlockPreview>` |
| `frontend/src/components/proof/proof-card.tsx` | Reorder sections, add `<details>` wrappers, move QR block |

---

## Verification approach

This project has no unit test runner for frontend components. After each task:

1. **Type check:** `cd frontend && npx tsc --noEmit`
   Expected: no errors
2. **Lint:** `cd frontend && npm run lint`
   Expected: no errors
3. **Visual check (after Task 4):** `cd frontend && npm run dev` → open `http://localhost:3000/proof/<any-hash>` and `http://localhost:3000/app`

---

## Task 1 — Increase QR code size

**Files:**
- Modify: `frontend/src/components/proof/proof-qr-block.tsx`

- [x] **Step 1: Edit proof-qr-block.tsx**

  Replace the entire file content with:

  ```tsx
  "use client";

  import { useEffect, useState } from "react";
  import { ProofQr } from "./proof-qr";

  interface ProofQrBlockProps {
    hash: string;
  }

  export function ProofQrBlock({ hash }: ProofQrBlockProps) {
    const [url, setUrl] = useState<string>("");

    useEffect(() => {
      setUrl(`${window.location.origin}/proof/${hash}`);
    }, [hash]);

    return (
      <div className="flex items-center gap-4">
        {url ? (
          <ProofQr url={url} size={128} />
        ) : (
          <div
            className="w-32 h-32 rounded shrink-0 bg-[#F8FAFC] p-1.5"
            aria-hidden="true"
          />
        )}
        <div className="text-[0.8125rem] text-text-muted leading-relaxed">
          <strong className="block text-text text-sm mb-0.5">Scan to verify</strong>
          Point a phone camera at the QR to open this Proof Block without a wallet.
        </div>
      </div>
    );
  }

  export default ProofQrBlock;
  ```

  Note: `w-32 h-32` = 128 px (Tailwind scale). The border-top and pt-4 are removed here — the parent section in `proof-card.tsx` will own the separator in Task 4.

- [x] **Step 2: Type check**

  ```bash
  cd frontend && npx tsc --noEmit
  ```

  Expected: no errors.

- [x] **Step 3: Commit**

  ```bash
  cd frontend && git add src/components/proof/proof-qr-block.tsx
  git commit -m "feat: increase proof QR code size from 96 to 128px"
  ```

---

## Task 2 — Redesign ProofBlockPreview (dashboard card)

**Files:**
- Modify: `frontend/src/components/proof/proof-block-preview.tsx`

- [x] **Step 1: Replace the entire file**

  ```tsx
  import Link from "next/link";
  import { ArrowRight, Lock } from "lucide-react";
  import { Badge } from "@/components/ui";
  import { getProofMetadata } from "@/lib/proof-metadata";
  import type { CertificateStatus } from "@/lib/types";

  export interface ProofBlockPreviewProps {
    hash?: string;
    certStatus?: CertificateStatus;
  }

  const FALLBACK_TITLE = "Stellar Smart Contract Bootcamp Completion";

  function statusBadge(status: CertificateStatus) {
    switch (status) {
      case "verified":
        return { tone: "verified" as const, label: "Verified" };
      case "issued":
        return { tone: "warning" as const, label: "Awaiting verification" };
      case "revoked":
        return { tone: "danger" as const, label: "Revoked" };
      case "suspended":
        return { tone: "warning" as const, label: "Suspended" };
      case "expired":
        return { tone: "warning" as const, label: "Expired" };
      default:
        return { tone: "neutral" as const, label: status };
    }
  }

  export function ProofBlockPreview({ hash, certStatus }: ProofBlockPreviewProps) {
    const metadata = hash ? getProofMetadata(hash) : null;
    const credentialTitle = metadata?.title ?? FALLBACK_TITLE;
    const badge = certStatus ? statusBadge(certStatus) : null;

    return (
      <div className="rounded-2xl bg-surface-glass border border-border-glass p-6 flex flex-col gap-4">
        <Badge tone="accent">Proof Block</Badge>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-base font-semibold text-text font-heading leading-snug">
            {credentialTitle}
          </h2>
          {badge ? (
            <Badge tone={badge.tone} dot>
              {badge.label}
            </Badge>
          ) : null}
        </div>

        {hash ? (
          <>
            <p className="text-sm text-text-muted leading-relaxed">
              Your on-chain credential — anyone can verify it, no login needed.
            </p>
            <Link
              href={`/proof/${hash}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary no-underline hover:underline transition-colors"
            >
              View &amp; share your proof
              <ArrowRight width={14} height={14} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-text-muted leading-relaxed">
              Your proof card unlocks after you complete registration. Once issued,
              anyone can verify it — no login needed.
            </p>
            <div className="flex items-center gap-2 opacity-55">
              <Lock width={14} height={14} aria-hidden="true" />
              <span
                className="text-sm text-text-muted cursor-not-allowed"
                aria-disabled="true"
              >
                Awaiting registration
              </span>
            </div>
          </>
        )}
      </div>
    );
  }

  export default ProofBlockPreview;
  ```

- [x] **Step 2: Type check**

  ```bash
  cd frontend && npx tsc --noEmit
  ```

  Expected: no errors. If you see "getProofMetadata is not a module" errors, confirm `frontend/src/lib/proof-metadata.ts` exports `getProofMetadata` as a named export (it does — line 37).

- [x] **Step 3: Commit**

  ```bash
  cd frontend && git add src/components/proof/proof-block-preview.tsx
  git commit -m "feat: show credential title and status in proof block preview card"
  ```

---

## Task 3 — Pass certStatus from app-experience

**Files:**
- Modify: `frontend/src/app/app/app-experience.tsx` (line 242)

- [x] **Step 1: Update the ProofBlockPreview call**

  Find line 242 in `app-experience.tsx`:
  ```tsx
  <ProofBlockPreview hash={milestones.lastHash} />
  ```

  Replace with:
  ```tsx
  <ProofBlockPreview
    hash={milestones.lastHash}
    certStatus={milestones.credentialStatus}
  />
  ```

  `milestones.credentialStatus` is typed as `CertificateStatus | undefined` (line 41 of `app-experience.tsx`), which matches the optional `certStatus?: CertificateStatus` prop.

- [x] **Step 2: Type check**

  ```bash
  cd frontend && npx tsc --noEmit
  ```

  Expected: no errors.

- [x] **Step 3: Commit**

  ```bash
  cd frontend && git add src/app/app/app-experience.tsx
  git commit -m "feat: wire certStatus into ProofBlockPreview from milestones state"
  ```

---

## Task 4 — Restructure ProofCard (Trust Narrative)

This is the largest change. The helper functions `statusMeta` and `issuerMeta` are unchanged — only the JSX returned by `ProofCard` changes.

**Files:**
- Modify: `frontend/src/components/proof/proof-card.tsx`

- [x] **Step 1: Replace the ProofCard JSX**

  Keep everything above line 150 (the two helper functions) exactly as-is. Replace only the `ProofCard` function body with:

  ```tsx
  export function ProofCard({
    hash,
    cert,
    issuer,
    proofMetadata,
    lookupFailed = false,
    issuerLookupFailed = false,
  }: ProofCardProps) {
    const contractId = appConfig.contractId;
    const explorerUrl = appConfig.explorerUrl;
    const shortContract = shortenAddress(contractId, 8);
    const shortHash = shortenAddress(hash, 8);
    const status = statusMeta(cert, lookupFailed);
    const issuerState = issuerMeta(cert, issuer, issuerLookupFailed);

    return (
      <div className="max-w-2xl mx-auto px-8 max-sm:px-3">
        <article className="relative overflow-hidden rounded-2xl bg-surface border border-border-glass flex flex-col gap-6 p-8 max-sm:p-5 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-[linear-gradient(to_right_in_oklch,var(--color-primary),var(--color-accent))]">

          {/* Header row */}
          <header className="flex items-center gap-2 flex-wrap">
            <Badge tone="accent">Stellar testnet</Badge>
            <Badge tone={status.tone} dot>
              {status.label}
            </Badge>
          </header>

          {/* ① What they earned */}
          {proofMetadata ? (
            <CredentialMetadataPanel metadata={proofMetadata} />
          ) : null}

          {/* ② Is it trustworthy? — or not-found block */}
          {cert || lookupFailed ? (
            <section
              className="flex flex-col gap-3"
              aria-label="Proof status summary"
            >
              <div className="rounded-lg border border-border bg-surface-2 px-4 py-3">
                <p className="text-text text-[0.95rem] font-semibold">
                  {status.title}
                </p>
                <p className="mt-1 text-text-muted text-sm leading-relaxed">
                  {status.body}
                </p>
                {cert && status.canVerify ? (
                  <Link
                    href="/app"
                    className="inline-flex mt-2 text-accent text-[0.8125rem] font-semibold hover:underline no-underline"
                  >
                    Open trusted verification flow →
                  </Link>
                ) : null}
              </div>

              {issuerState ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-pixel text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                    Issued by
                  </span>
                  <span className="text-sm font-semibold text-text">
                    {issuerState.name}
                  </span>
                  <Badge tone={issuerState.tone} dot>
                    {issuerState.label}
                  </Badge>
                </div>
              ) : null}
            </section>
          ) : (
            <div className="flex flex-col items-center gap-1 text-sm text-text-muted border border-dashed border-border rounded-lg p-6 text-center">
              <img
                src="/illust/illust-lookup.svg"
                alt=""
                width={160}
                height={107}
                loading="lazy"
                style={{ imageRendering: "pixelated", marginBottom: 12 }}
              />
              <p className="text-text text-base font-semibold">
                No record for this hash yet.
              </p>
              <p className="max-w-[42ch] leading-relaxed">
                The hash may be mistyped, or the certificate hasn&rsquo;t been
                registered on-chain. Double-check the 64 hex characters, or
                look up a different one.
              </p>
              <Link
                href="/proof"
                className="mt-3 inline-flex items-center px-4 py-2 rounded-md bg-primary text-on-primary font-semibold text-sm no-underline hover:bg-primary-hover transition-colors"
              >
                Look up another hash →
              </Link>
            </div>
          )}

          {/* ③ How to verify */}
          {cert ? (
            <section
              className="border-t border-border pt-4 flex flex-col gap-3"
              aria-label="How to verify"
            >
              <ProofQrBlock hash={hash} />
              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href={`${explorerUrl}/contract/${contractId}#events`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.8125rem] text-accent no-underline whitespace-nowrap hover:opacity-80 hover:underline transition-opacity"
                  aria-label="View on-chain events in explorer"
                >
                  View on-chain events ↗
                </a>
                <CopyButton value={hash} ariaLabel="Copy certificate hash" />
                <span className="text-[0.8125rem] text-text-muted">
                  Copy certificate hash
                </span>
              </div>
            </section>
          ) : null}

          {/* ▾ Technical details */}
          <details className="border-t border-border pt-4 group">
            <summary className="cursor-pointer list-none flex items-center gap-2 text-[0.8125rem] font-medium text-text-muted hover:text-text transition-colors select-none">
              <span className="transition-transform group-open:rotate-90 inline-block">▶</span>
              Technical details
            </summary>
            <div className="mt-3 grid gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-pixel text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                  Contract ID
                </span>
                <code className="font-mono text-[0.8125rem] text-text bg-surface-2 border border-border rounded px-1.5 py-0.5">
                  {shortContract}
                </code>
                <CopyButton value={contractId} ariaLabel="Copy contract ID" />
                <a
                  href={`${explorerUrl}/contract/${contractId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.8125rem] text-accent no-underline whitespace-nowrap hover:opacity-80 hover:underline transition-opacity"
                  aria-label="View contract on explorer"
                >
                  View on explorer ↗
                </a>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-pixel text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                  Certificate hash
                </span>
                <HashReveal hash={shortHash} />
                <CopyButton value={hash} ariaLabel="Copy certificate hash" />
              </div>
              {cert ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-pixel text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                      Owner
                    </span>
                    <code className="font-mono text-[0.8125rem] text-text bg-surface-2 border border-border rounded px-1.5 py-0.5">
                      {shortenAddress(cert.owner, 8)}
                    </code>
                    <CopyButton value={cert.owner} ariaLabel="Copy owner address" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-pixel text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                      Issuer
                    </span>
                    <code className="font-mono text-[0.8125rem] text-text bg-surface-2 border border-border rounded px-1.5 py-0.5">
                      {shortenAddress(cert.issuer, 8)}
                    </code>
                    <CopyButton
                      value={cert.issuer}
                      ariaLabel="Copy issuer address"
                    />
                  </div>
                </>
              ) : null}
            </div>
          </details>

          {/* ▾ Submission self-check */}
          <details className="border-t border-border pt-4 group">
            <summary className="cursor-pointer list-none flex items-center gap-2 text-[0.8125rem] font-medium text-text-muted hover:text-text transition-colors select-none">
              <span className="transition-transform group-open:rotate-90 inline-block">▶</span>
              Submission self-check
            </summary>
            <ul
              className="list-none m-0 p-0 flex flex-col gap-2 mt-3"
              role="list"
            >
              <li className="flex items-start gap-2 text-sm text-text">
                <Check
                  className="w-4 h-4 text-success shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                Contract deployed + verified on stellar.expert
              </li>
              <li className="flex items-start gap-2 text-sm text-text">
                <Check
                  className="w-4 h-4 text-success shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <code>cargo test</code> passes (≥5 tests)
              </li>
              <li className="flex items-start gap-2 text-sm text-text">
                <Check
                  className="w-4 h-4 text-success shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                Frontend signs real tx via Freighter end-to-end
              </li>
              <li className="flex items-start gap-2 text-sm text-text">
                <Check
                  className="w-4 h-4 text-success shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                On-chain events emitted and visible in explorer
              </li>
              <li className="flex items-start gap-2 text-sm text-text">
                <Check
                  className="w-4 h-4 text-success shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                No raw ScVal / HostError surfaces in any error path
              </li>
            </ul>
          </details>

          {/* ④ Share it */}
          <section
            className="border-t border-border pt-4"
            aria-label="Share this proof"
          >
            <p className="font-pixel text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Share
            </p>
            <ShareButtons hash={hash} />
          </section>

          {/* Footer */}
          <footer className="text-xs text-text-muted text-center border-t border-border pt-4 font-mono tracking-wide flex items-center justify-center gap-2">
            <span
              className="flex-1 h-px max-w-20 bg-[repeating-linear-gradient(90deg,var(--color-border)_0_6px,transparent_6px_10px)]"
              aria-hidden="true"
            />
            Generated from bootcamp submission · Stellar PH Bootcamp 2026
            <span
              className="flex-1 h-px max-w-20 bg-[repeating-linear-gradient(90deg,var(--color-border)_0_6px,transparent_6px_10px)]"
              aria-hidden="true"
            />
          </footer>
        </article>
      </div>
    );
  }
  ```

- [x] **Step 2: Type check**

  ```bash
  cd frontend && npx tsc --noEmit
  ```

  Expected: no errors. Common issue to watch: if `status.tone` produces a value not in Badge's `toneClasses` record, TypeScript will not catch it (it's `Record<string, string>`), but the badge will fall back to "neutral" at runtime — that's fine.

- [x] **Step 3: Lint**

  ```bash
  cd frontend && npm run lint
  ```

  Expected: no errors.

- [x] **Step 4: Visual check**

  ```bash
  cd frontend && npm run dev
  ```

  Open `http://localhost:3000/proof/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2` (any 64-char hex string) and verify:
  - The credential metadata panel appears at the top (if proofMetadata resolves)
  - The status box and issuer row appear below it
  - The QR block + verify links appear in section ③
  - "Technical details" and "Submission self-check" are collapsed toggles (▶ arrow)
  - Clicking each toggle expands/collapses with native browser behavior
  - Share buttons appear at the bottom
  - Open `http://localhost:3000/app` and verify the preview card shows a title and status badge (or graceful fallback)

- [x] **Step 5: Commit**

  ```bash
  cd frontend && git add src/components/proof/proof-card.tsx
  git commit -m "feat: restructure proof card to Trust Narrative Flow — credential title leads, tech details and rubric collapsible"
  ```
