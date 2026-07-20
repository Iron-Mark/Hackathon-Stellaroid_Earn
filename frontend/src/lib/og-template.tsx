import { ImageResponse } from "next/og";

// Shared per-page Open Graph card. Keeps the brand frame (dark field + amber /
// violet orbs) from the root opengraph-image while swapping in a page-specific
// eyebrow + title, so landing pages and guides get distinct social cards.
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

export function renderOgImage({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0F172A",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          color: "#F8FAFC",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Amber glow orb, top-left */}
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
        {/* Violet glow orb, bottom-right */}
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

        {/* Brand row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "56px",
              height: "56px",
              borderRadius: "12px",
              background: "#F59E0B",
              color: "#0F172A",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "34px",
              fontWeight: 800,
            }}
          >
            S
          </div>
          <span style={{ fontSize: "34px", fontWeight: 700, color: "#F8FAFC" }}>
            Stellaroid Earn
          </span>
        </div>

        {/* Eyebrow + title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "22px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "26px",
              fontWeight: 600,
              letterSpacing: "2px",
              color: "#F59E0B",
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "66px",
              fontWeight: 800,
              lineHeight: 1.08,
              maxWidth: "1010px",
            }}
          >
            {title}
          </div>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "27px",
            color: "#94A3B8",
            position: "relative",
          }}
        >
          <span style={{ display: "flex" }}>stellaroid.tech</span>
          <span style={{ display: "flex", color: "#8B5CF6" }}>
            On-chain credential trust on Stellar testnet
          </span>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
