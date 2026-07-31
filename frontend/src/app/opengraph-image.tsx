import { ImageResponse } from "next/og";
import { OG_GRID_BG, OgLedgerLine, OgOrbitCoin } from "@/lib/og-chrome";

export const alt =
  "Stellaroid Earn: Bind the hash. Pay the wallet. Prove the work.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        ...OG_GRID_BG,
        padding: "72px 80px",
        fontFamily: "sans-serif",
        color: "#F8FAFC",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Amber glow orb — top left */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          left: "-80px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.06) 40%, transparent 70%)",
          display: "flex",
        }}
      />
      {/* Violet glow orb — bottom right */}
      <div
        style={{
          position: "absolute",
          bottom: "-140px",
          right: "-100px",
          width: "460px",
          height: "460px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)",
          display: "flex",
        }}
      />
      {/* Constellation edges, kept from the original card */}
      <svg
        width="1200"
        height="630"
        viewBox="0 0 1200 630"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <line x1="100" y1="100" x2="300" y2="180" stroke="rgba(245,158,11,0.1)" strokeWidth="1" />
        <line x1="300" y1="180" x2="520" y2="90" stroke="rgba(245,158,11,0.09)" strokeWidth="1" />
        <line x1="520" y1="90" x2="740" y2="160" stroke="rgba(245,158,11,0.08)" strokeWidth="1" />
        <line x1="300" y1="180" x2="200" y2="340" stroke="rgba(245,158,11,0.07)" strokeWidth="1" />
        <line x1="200" y1="340" x2="400" y2="480" stroke="rgba(245,158,11,0.06)" strokeWidth="1" />
        <circle cx="300" cy="180" r="16" fill="rgba(245,158,11,0.06)" />
        <circle cx="100" cy="100" r="3" fill="rgba(245,158,11,0.3)" />
        <circle cx="520" cy="90" r="3.5" fill="rgba(245,158,11,0.3)" />
        <circle cx="200" cy="340" r="3" fill="rgba(245,158,11,0.25)" />
        <circle cx="400" cy="480" r="2.5" fill="rgba(245,158,11,0.2)" />
        <circle cx="300" cy="180" r="5" fill="rgba(245,158,11,0.5)" />
      </svg>

      {/* Orbit-ringed coin — the campaign kit's signature, right side */}
      <div
        style={{
          position: "absolute",
          right: "44px",
          top: "128px",
          display: "flex",
        }}
      >
        <OgOrbitCoin box={420} coin={216} />
      </div>

      {/* Top bar: wordmark + badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          <span
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: "#F8FAFC",
              letterSpacing: "-0.01em",
            }}
          >
            Stellaroid Earn
          </span>
          <span
            style={{
              fontSize: "13px",
              color: "#94A3B8",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Proof & Payment on Stellar
          </span>
        </div>

        {/* Live badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "#2DD4BF",
            background: "rgba(45, 212, 191, 0.1)",
            border: "1px solid rgba(45, 212, 191, 0.3)",
            borderRadius: "999px",
            padding: "8px 18px",
            fontWeight: 600,
            letterSpacing: "0.06em",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "8px",
              height: "8px",
              borderRadius: "999px",
              background: "#2DD4BF",
              boxShadow: "0 0 8px rgba(45,212,191,0.5)",
            }}
          />
          STELLAR TESTNET
        </div>
      </div>

      {/* Main headline */}
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
            fontSize: "68px",
            fontWeight: 700,
            letterSpacing: "-0.035em",
            lineHeight: 1.05,
            color: "#F8FAFC",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Bind the hash.</span>
          <span>Pay the wallet.</span>
          <span
            style={{
              background:
                "linear-gradient(90deg, #F59E0B 0%, #8B5CF6 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Prove the work.
          </span>
        </div>
        <div
          style={{
            fontSize: "20px",
            color: "#94A3B8",
            lineHeight: 1.5,
            maxWidth: "660px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Verify credentials on-chain and pay graduates directly in XLM.</span>
          <span>No invoice, no platform, no wait.</span>
        </div>
      </div>

      <OgLedgerLine bottom={22} right={80} />

      {/* Bottom accent line */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "4px",
          background:
            "linear-gradient(90deg, #F59E0B 0%, #8B5CF6 50%, #2DD4BF 100%)",
          display: "flex",
        }}
      />
    </div>,
    { ...size },
  );
}
