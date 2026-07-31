/* Shared Satori-safe chrome for every Open Graph card.
 *
 * The pixel coin used to be pasted inline into two routes while the shared
 * template drew a rounded amber square with a letter S that exists nowhere
 * else in the brand. This module is now the single source for the coin and
 * for the campaign kit's signature elements (ledger grid, orbit rings, the
 * real on-chain identifiers as a texture line), so link previews and the
 * marketing boards read as one system.
 *
 * Satori constraints honored throughout: flexbox only, explicit px offsets
 * instead of percentage translates, and no clip-path or masks.
 */

export const OG_LEDGER_TEXT =
  "contract CAD6C24P...ISZCV · wasm 1b7479f1...4b9f";

const COIN_ROWS: Array<[number, number, number, number, string]> = [
  [20, 4, 24, 4, "#78350F"],
  [12, 8, 8, 4, "#78350F"],
  [20, 8, 24, 4, "#B45309"],
  [44, 8, 8, 4, "#78350F"],
  [8, 12, 4, 4, "#78350F"],
  [12, 12, 4, 4, "#B45309"],
  [16, 12, 12, 4, "#FBBF24"],
  [28, 12, 4, 4, "#FEF3C7"],
  [32, 12, 16, 4, "#FBBF24"],
  [48, 12, 4, 4, "#B45309"],
  [52, 12, 4, 4, "#78350F"],
  [8, 16, 4, 4, "#78350F"],
  [12, 16, 4, 4, "#B45309"],
  [16, 16, 4, 4, "#FBBF24"],
  [20, 16, 20, 4, "#78350F"],
  [40, 16, 8, 4, "#FBBF24"],
  [48, 16, 4, 4, "#B45309"],
  [52, 16, 4, 4, "#78350F"],
  [4, 20, 4, 8, "#78350F"],
  [8, 20, 4, 8, "#B45309"],
  [12, 20, 8, 8, "#FBBF24"],
  [20, 20, 4, 8, "#78350F"],
  [24, 20, 24, 8, "#FBBF24"],
  [48, 20, 8, 8, "#B45309"],
  [56, 20, 4, 8, "#78350F"],
  [4, 28, 4, 4, "#78350F"],
  [8, 28, 4, 4, "#B45309"],
  [12, 28, 8, 4, "#FBBF24"],
  [20, 28, 20, 4, "#78350F"],
  [40, 28, 8, 4, "#FBBF24"],
  [48, 28, 8, 4, "#B45309"],
  [56, 28, 4, 4, "#78350F"],
  [4, 32, 4, 8, "#78350F"],
  [8, 32, 4, 8, "#B45309"],
  [12, 32, 24, 8, "#FBBF24"],
  [36, 32, 4, 8, "#78350F"],
  [40, 32, 8, 8, "#FBBF24"],
  [48, 32, 8, 8, "#B45309"],
  [56, 32, 4, 8, "#78350F"],
  [8, 40, 4, 4, "#78350F"],
  [12, 40, 4, 4, "#B45309"],
  [16, 40, 4, 4, "#FBBF24"],
  [20, 40, 20, 4, "#78350F"],
  [40, 40, 8, 4, "#FBBF24"],
  [48, 40, 8, 4, "#B45309"],
  [56, 40, 4, 4, "#78350F"],
  [8, 44, 4, 4, "#78350F"],
  [12, 44, 4, 4, "#B45309"],
  [16, 44, 32, 4, "#FBBF24"],
  [48, 44, 4, 4, "#B45309"],
  [52, 44, 4, 4, "#78350F"],
  [8, 48, 8, 4, "#78350F"],
  [16, 48, 32, 4, "#B45309"],
  [48, 48, 8, 4, "#78350F"],
  [12, 52, 40, 4, "#78350F"],
];

export function OgPixelCoin({ size = 52 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      {COIN_ROWS.map(([x, y, w, h, fill], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
      ))}
    </svg>
  );
}

/* Faint graph-paper depth layer, same 44px rhythm as the campaign boards.
 * Spread into the ROOT card div's style rather than rendered as an overlay:
 * Satori paints an absolutely positioned pattern div above later siblings,
 * so as an overlay the grid lines cross the coin art. The root element's own
 * background is guaranteed to be the bottom layer. */
export const OG_GRID_BG = {
  backgroundColor: "#0F172A",
  backgroundImage:
    "linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)",
  backgroundSize: "44px 44px",
} as const;

/* The deployed contract and WASM identifiers as a corner texture line. */
export function OgLedgerLine({
  bottom = 26,
  right = 80,
}: {
  bottom?: number;
  right?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: `${bottom}px`,
        right: `${right}px`,
        fontSize: "14px",
        letterSpacing: "0.08em",
        color: "rgba(148,163,184,0.4)",
        display: "flex",
      }}
    >
      {OG_LEDGER_TEXT}
    </div>
  );
}

/* Orbit system: the coin inside tilted elliptical rings with two pixel
 * satellites. `box` is the square wrapper size; every offset is explicit px
 * because Satori does not resolve percentage translates. */
export function OgOrbitCoin({
  box = 440,
  coin = 210,
}: {
  box?: number;
  coin?: number;
}) {
  const ringA = { w: box, h: Math.round(box * 0.36) };
  const ringB = { w: Math.round(box * 0.82), h: Math.round(box * 0.3) };
  return (
    <div
      style={{
        width: `${box}px`,
        height: `${box}px`,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: `${(box - ringA.w) / 2}px`,
          top: `${(box - ringA.h) / 2}px`,
          width: `${ringA.w}px`,
          height: `${ringA.h}px`,
          border: "1px solid rgba(245,158,11,0.3)",
          borderRadius: "50%",
          transform: "rotate(-14deg)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${(box - ringB.w) / 2}px`,
          top: `${(box - ringB.h) / 2}px`,
          width: `${ringB.w}px`,
          height: `${ringB.h}px`,
          border: "1px solid rgba(139,92,246,0.28)",
          borderRadius: "50%",
          transform: "rotate(18deg)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${Math.round(box * 0.08)}px`,
          top: `${Math.round(box * 0.34)}px`,
          width: "9px",
          height: "9px",
          background: "#FBBF24",
          boxShadow: "0 0 12px rgba(251,191,36,0.8)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: `${Math.round(box * 0.06)}px`,
          bottom: `${Math.round(box * 0.3)}px`,
          width: "8px",
          height: "8px",
          background: "#8B5CF6",
          boxShadow: "0 0 12px rgba(139,92,246,0.8)",
          display: "flex",
        }}
      />
      {/* Positioned wrapper so the coin joins the positioned paint layer and
          covers the rings; a static child would render beneath them. */}
      <div style={{ position: "relative", display: "flex" }}>
        <OgPixelCoin size={coin} />
      </div>
    </div>
  );
}
