import { ImageResponse } from "next/og";
import {
  getCertificateServer,
  type CertificateRecord,
} from "@/lib/contract-read-server";
import { getProofSocialMetadata, proofCanMakeVerifiedClaims } from "@/lib/proof-claims";
import { OG_GRID_BG, OgLedgerLine, OgPixelCoin } from "@/lib/og-chrome";

export const alt = "Stellaroid Earn | Proof status";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ hash: string }>;
}

function shortHash(hash: string) {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-10)}`;
}

export default async function OpengraphImage({ params }: Props) {
  const { hash } = await params;
  const display = shortHash(hash);
  let cert: CertificateRecord | null = null;
  if (/^[0-9a-f]{64}$/i.test(hash)) {
    try {
      cert = await getCertificateServer(hash);
    } catch {
      cert = null;
    }
  }
  const verified = proofCanMakeVerifiedClaims(cert);
  const social = getProofSocialMetadata(hash, cert);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        ...OG_GRID_BG,
        padding: "72px",
        fontFamily: "sans-serif",
        color: "#F8FAFC",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Family ground: same glow pair as every other card, replacing the
          old one-off indigo gradient so proof shares match the brand frame. */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          left: "-80px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(245,158,11,0.16) 0%, rgba(245,158,11,0.05) 40%, transparent 70%)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-140px",
          right: "-100px",
          width: "460px",
          height: "460px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0.05) 40%, transparent 70%)",
          display: "flex",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          fontSize: "28px",
          fontWeight: 600,
          color: "#F59E0B",
          letterSpacing: "-0.02em",
          position: "relative",
          zIndex: 1,
        }}
      >
        <OgPixelCoin size={48} />
        STELLAROID EARN
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: "48px",
          gap: "12px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: "24px",
            color: "#94A3B8",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            fontWeight: 500,
          }}
        >
          {verified ? "Verified Proof of Work" : "Proof Status"}
        </div>
        <div
          style={{
            fontSize: "72px",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            color: "#F8FAFC",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {verified ? "Work completed." : "Check status."}
          <br />
          {verified ? "Payment settled." : cert ? cert.status.toUpperCase() : "NOT FOUND"}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: "auto",
          gap: "16px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: "20px",
            color: "#8B5CF6",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            fontWeight: 600,
          }}
        >
          SHA-256 · Anchored on Stellar
        </div>
        <div
          style={{
            fontSize: "40px",
            fontFamily: "monospace",
            color: "#F8FAFC",
            background: "rgba(148, 163, 184, 0.1)",
            borderRadius: "16px",
            padding: "20px 28px",
            border: "1px solid rgba(148, 163, 184, 0.25)",
            alignSelf: "flex-start",
          }}
        >
          {display}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "72px",
          right: "72px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "18px",
          color: "#10B981",
          background: "rgba(16, 185, 129, 0.12)",
          border: "1px solid rgba(16, 185, 129, 0.4)",
          borderRadius: "999px",
          padding: "10px 20px",
          fontWeight: 600,
          letterSpacing: "0.05em",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "10px",
            height: "10px",
            borderRadius: "999px",
            background: "#10B981",
          }}
        />
        {verified ? "VERIFIED · TESTNET" : social.title.toUpperCase()}
      </div>

      <OgLedgerLine bottom={24} right={72} />
    </div>,
    { ...size },
  );
}
