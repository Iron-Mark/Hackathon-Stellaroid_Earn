// Regenerates the PWA icon set in public/ from public/logo-512.svg.
// Usage: node scripts/generate-pwa-icons.mjs
//
// Maskable icons keep the logo inside the ~80% safe zone on a solid
// app-background tile so Android's adaptive shapes (circle, squircle)
// never crop the mark.
import sharp from "sharp";

const BG = "#0F172A"; // --color-bg
const SOURCE = "public/logo-512.svg";

async function maskable(size, out, ratio = 0.6) {
  const inner = Math.round(size * ratio);
  const logo = await sharp(SOURCE)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(out);

  console.log(`wrote ${out} (${size}x${size}, maskable)`);
}

await maskable(192, "public/icon-maskable-192.png");
await maskable(512, "public/icon-maskable-512.png");

// iOS flattens transparency onto black, so the apple-touch-icon must be an
// opaque tile. iOS rounds the corners itself and has no mask safe-zone, so
// the mark can sit larger than on the maskable set.
await maskable(180, "public/apple-touch-icon.png", 0.72);
