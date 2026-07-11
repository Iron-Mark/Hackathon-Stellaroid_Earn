"use client";

import Link from "next/link";
import { useEffect } from "react";
import { reportClientError } from "@/lib/error-report";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[stellaroid] unhandled error:", error);
    reportClientError({ error, source: "error-boundary", digest: error.digest });
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        color: "var(--color-text)",
      }}
    >
      <main
        id="main"
        style={{
          width: "100%",
          maxWidth: 560,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <img
          src="/illust/illust-error.svg"
          alt=""
          width={120}
          height={120}
          style={{ marginBottom: 28, imageRendering: "pixelated" }}
        />
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 40px)",
            margin: "0 0 12px",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          Something fell off the ledger.
        </h1>
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: 15,
            lineHeight: 1.6,
            marginBottom: 32,
            maxWidth: 420,
          }}
        >
          Testnet RPC or a runtime hiccup. The on-chain state is unaffected. Only this
          render failed. Try again, or head back.
        </p>
        {error.digest && (
          <p
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--color-text-muted)",
              fontSize: 12,
              marginBottom: 32,
            }}
          >
            digest: {error.digest}
          </p>
        )}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={reset}
            style={{
              padding: "10px 20px",
              borderRadius: 6,
              background: "var(--color-primary)",
              color: "var(--color-on-primary)",
              border: "1px solid var(--color-primary)",
              fontWeight: 600,
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            Try again
          </button>
          <Link
            href="/"
            style={{
              padding: "10px 20px",
              borderRadius: 6,
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              minHeight: 44,
            }}
          >
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
