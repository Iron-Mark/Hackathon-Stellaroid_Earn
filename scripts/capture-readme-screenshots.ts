/**
 * scripts/capture-readme-screenshots.ts
 *
 * Headless Playwright screenshot capture for the README gallery.
 * Run: NODE_PATH=frontend/node_modules npx tsx scripts/capture-readme-screenshots.ts
 *
 * Requires: frontend built (npm run build) and started (npm run start --port 3007).
 * If a server is already running on 3007, the script will skip build/start.
 */

import { chromium, type Browser, type Page } from "playwright";
import sharp from "sharp";
import { execSync, spawn, type ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as http from "http";

// ── Configuration ──────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname ?? __dirname, "..");
const FRONTEND = path.join(ROOT, "frontend");
const IMAGES = path.join(ROOT, "images");
const PORT = 3007;
const BASE = `http://127.0.0.1:${PORT}`;

const CERT_VERIFIED =
  "c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3";
const CERT_LOCKED =
  "c6df0adf9d1a6f5a88d847e8e9a779e71aa2435d6fa47b47d065ebbfa8c1f890";

interface Capture {
  name: string;
  url: string;
  width: number;
  height: number;
  waitSelector?: string;
}

const CAPTURES: Capture[] = [
  { name: "landing-hero.png", url: "/", width: 1440, height: 900 },
  { name: "app-dashboard.png", url: "/app", width: 1440, height: 900 },
  {
    name: "proof-verified.png",
    url: `/proof/${CERT_VERIFIED}`,
    width: 1440,
    height: 900,
    waitSelector: "[data-proof-card]",
  },
  {
    name: "proof-locked.png",
    url: `/proof/${CERT_LOCKED}`,
    width: 1440,
    height: 900,
    waitSelector: "[data-proof-card]",
  },
  { name: "issuer-page.png", url: "/issuer", width: 1440, height: 900 },
  { name: "proof-lookup.png", url: "/proof", width: 1440, height: 900 },
  {
    name: "mobile-proof-card.png",
    url: `/proof/${CERT_VERIFIED}`,
    width: 390,
    height: 844,
  },
];

const MAX_SIZE = 500 * 1024; // 500KB
const HERO_MAX_SIZE = 200 * 1024; // 200KB

// ── Helpers ────────────────────────────────────────────────────────

function isServerUp(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(BASE, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(maxWait = 60_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    if (await isServerUp()) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server did not start within ${maxWait / 1000}s`);
}

async function compressImage(filePath: string, isHero: boolean): Promise<number> {
  const maxSize = isHero ? HERO_MAX_SIZE : MAX_SIZE;
  let buffer = await sharp(filePath).png({ compressionLevel: 9 }).toBuffer();

  if (buffer.length > maxSize) {
    // More aggressive: reduce quality and resize
    const meta = await sharp(filePath).metadata();
    const targetWidth = Math.min(meta.width ?? 1440, isHero ? 1280 : 1440);
    buffer = await sharp(filePath)
      .resize({ width: targetWidth, withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: true, quality: 80 })
      .toBuffer();
  }

  fs.writeFileSync(filePath, buffer);
  return buffer.length;
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log("=== Stellaroid Earn — README Screenshot Capture ===\n");

  // 1. Check if server is already running
  let serverProcess: ChildProcess | null = null;
  const alreadyUp = await isServerUp();

  if (alreadyUp) {
    console.log(`Server already running on ${BASE}\n`);
  } else {
    // Build
    console.log("Building frontend...");
    try {
      execSync("npm run build", {
        cwd: FRONTEND,
        stdio: "inherit",
        timeout: 300_000,
      });
    } catch (e) {
      console.error("Build failed. Make sure .env.local exists in frontend/");
      process.exit(1);
    }

    // Start
    console.log(`\nStarting production server on port ${PORT}...`);
    serverProcess = spawn(
      "npm",
      ["run", "start", "--", "--port", String(PORT), "--hostname", "127.0.0.1"],
      { cwd: FRONTEND, shell: true, stdio: "pipe" },
    );

    serverProcess.stderr?.on("data", (d: Buffer) => {
      const line = d.toString().trim();
      if (line) console.log(`  [server] ${line}`);
    });

    await waitForServer();
    console.log("Server is up.\n");
  }

  // 2. Capture screenshots
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });

    for (const cap of CAPTURES) {
      const outPath = path.join(IMAGES, cap.name);
      console.log(`Capturing ${cap.name} (${cap.width}x${cap.height})...`);

      const context = await browser.newContext({
        viewport: { width: cap.width, height: cap.height },
      });
      // Suppress the first-visit Freighter onboarding modal so /app captures
      // the real dashboard instead of the "New to Stellar?" overlay. Runs
      // before any page script, so the modal's effect never opens it.
      await context.addInitScript(() => {
        try {
          localStorage.setItem("stellaroid:freighter-welcome-dismissed", "1");
        } catch {
          /* ignore */
        }
      });
      const page: Page = await context.newPage();

      try {
        await page.goto(`${BASE}${cap.url}`, {
          waitUntil: "networkidle",
          timeout: 30_000,
        });

        // Extra wait for dynamic content
        if (cap.waitSelector) {
          await page.waitForSelector(cap.waitSelector, { timeout: 10_000 }).catch(() => {});
        }
        await page.waitForTimeout(2000);

        await page.screenshot({ path: outPath, type: "png" });
      } catch (err) {
        console.warn(`  Warning: ${cap.name} capture failed: ${err}`);
      } finally {
        await context.close();
      }
    }
  } finally {
    if (browser) await browser.close();
  }

  // 3. Convert social card SVG → PNG
  const svgPath = path.join(IMAGES, "github-social-card.svg");
  const pngPath = path.join(IMAGES, "github-social-card.png");
  if (fs.existsSync(svgPath)) {
    console.log("\nConverting github-social-card.svg → png...");
    await sharp(svgPath)
      .resize(1280, 640)
      .png({ compressionLevel: 9 })
      .toFile(pngPath);
  }

  // 4. Compress all PNGs
  console.log("\nCompressing images...");
  const summary: { name: string; size: string }[] = [];

  for (const file of fs.readdirSync(IMAGES)) {
    if (!file.endsWith(".png")) continue;
    const filePath = path.join(IMAGES, file);
    const isHero = file === "landing-hero.png";

    try {
      const size = await compressImage(filePath, isHero);
      summary.push({ name: file, size: `${(size / 1024).toFixed(1)} KB` });
    } catch {
      const stat = fs.statSync(filePath);
      summary.push({ name: file, size: `${(stat.size / 1024).toFixed(1)} KB (uncompressed)` });
    }
  }

  // 5. Tear down
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
    console.log("\nServer stopped.");
  }

  // 6. Summary
  console.log("\n=== Screenshot Summary ===\n");
  console.log("File".padEnd(30) + "Size");
  console.log("-".repeat(50));
  for (const s of summary) {
    console.log(s.name.padEnd(30) + s.size);
  }

  const totalBytes = summary.reduce((sum, s) => {
    const kb = parseFloat(s.size);
    return sum + (isNaN(kb) ? 0 : kb);
  }, 0);
  console.log("-".repeat(50));
  console.log(`Total: ${totalBytes.toFixed(1)} KB`);
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
