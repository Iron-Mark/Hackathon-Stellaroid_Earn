/**
 * scripts/capture-demo-video.ts
 *
 * Headless Playwright screen-recording of a guided product walkthrough, muxed
 * to MP4 with ffmpeg. Regenerates demo/stellaroid-earn-demo.mp4.
 *
 * Run: NODE_PATH=frontend/node_modules npx tsx scripts/capture-demo-video.ts
 *
 * Requires:
 *   - frontend built (npm run build); the script reuses a production server
 *     already listening on PORT 3007, else it builds + starts one and tears
 *     it down afterwards (same contract as capture-readme-screenshots.ts).
 *   - ffmpeg on PATH (webm -> mp4 h264).
 *
 * The walkthrough is silent by design, matching the original April demo: a
 * deliberate, smooth scroll tour of the real testnet surfaces, ending on the
 * multi-wallet picker + live WalletConnect QR (the headline July feature).
 */

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { execSync, spawn, type ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as http from "http";

// ── Configuration ──────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname ?? __dirname, "..");
const FRONTEND = path.join(ROOT, "frontend");
const OUT = path.join(ROOT, "demo", "stellaroid-earn-demo.mp4");
const TMP = path.join(ROOT, ".video-capture-tmp");
const PORT = 3007;
const BASE = `http://127.0.0.1:${PORT}`;
const WIDTH = 1280;
const HEIGHT = 720;

const CERT_VERIFIED =
  "c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3";
const CERT_LOCKED =
  "c6df0adf9d1a6f5a88d847e8e9a779e71aa2435d6fa47b47d065ebbfa8c1f890";

interface Scene {
  name: string;
  url: string;
  // How long to linger at the top before scrolling (ms).
  settle?: number;
  // Whether to smooth-scroll the full page height and back.
  scroll?: boolean;
  // Optional interaction after landing (e.g. open the WalletConnect QR).
  action?: (page: Page) => Promise<void>;
}

const SCENES: Scene[] = [
  { name: "Landing", url: "/", settle: 1800, scroll: true },
  { name: "Guided demo", url: "/demo", settle: 1500, scroll: true },
  {
    name: "Verified proof",
    url: `/proof/${CERT_VERIFIED}`,
    settle: 2200,
    scroll: true,
  },
  {
    name: "Pending proof",
    url: `/proof/${CERT_LOCKED}`,
    settle: 2000,
    scroll: false,
  },
  { name: "Issuer registry", url: "/issuer", settle: 1500, scroll: true },
  { name: "Opportunity directory", url: "/opportunity", settle: 1500, scroll: true },
  {
    name: "App + WalletConnect",
    url: "/app",
    settle: 1800,
    scroll: false,
    action: openWalletConnectQr,
  },
  { name: "Live status", url: "/status", settle: 2000, scroll: true },
];

// ── Server management (mirrors the screenshot script) ──────────────

function isServerUp(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(BASE, (res) => {
      res.resume();
      resolve((res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 400);
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

// ── Scene helpers ──────────────────────────────────────────────────

/** Smooth-scroll from top to bottom and back, pausing so the recording
 *  captures the whole page as a deliberate tour rather than a jump-cut. */
async function scrollTour(page: Page, downSteps = 7): Promise<void> {
  const max = await page.evaluate(() => {
    return Math.max(
      0,
      document.body.scrollHeight - window.innerHeight,
    );
  });
  if (max < 40) {
    await page.waitForTimeout(1200);
    return;
  }
  for (let i = 1; i <= downSteps; i++) {
    const y = Math.round((max * i) / downSteps);
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: "smooth" }), y);
    await page.waitForTimeout(750);
  }
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(900);
}

/** Click "Connect WalletConnect" and let the real relay QR render. Fully
 *  best-effort: if the relay is slow or the button is absent, the scene just
 *  shows the multi-wallet picker instead of breaking the whole recording. */
async function openWalletConnectQr(page: Page): Promise<void> {
  try {
    const btn = page.getByRole("button", { name: /walletconnect/i }).first();
    await btn.waitFor({ state: "visible", timeout: 4000 });
    await btn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await btn.click();
    // Wait for the actual QR image, not just the dialog shell. The URI only
    // arrives after a cold SignClient.init + a live relay handshake, then the
    // qrcode module is lazy-imported to render it — so this can take ~10s.
    const qr = page.locator('img[alt="WalletConnect pairing QR code"]');
    await qr.waitFor({ state: "visible", timeout: 15_000 });
    await page.waitForTimeout(4000); // linger on the QR
    await page.keyboard.press("Escape"); // close = cancel the pairing
    await page.waitForTimeout(800);
  } catch {
    // No projectId / slow relay / layout change — degrade to the picker view.
    await page.waitForTimeout(1500);
  }
}

async function playScene(page: Page, scene: Scene): Promise<void> {
  process.stdout.write(`  • ${scene.name} (${scene.url}) … `);
  try {
    // domcontentloaded (not networkidle): /status holds an SSE stream open,
    // so networkidle would never resolve there.
    await page.goto(`${BASE}${scene.url}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForTimeout(scene.settle ?? 1500);
    if (scene.action) await scene.action(page);
    if (scene.scroll) await scrollTour(page);
    console.log("ok");
  } catch (err) {
    console.log(`skipped (${(err as Error).message.split("\n")[0]})`);
  }
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log("=== Stellaroid Earn — Demo Video Capture ===\n");

  // 1. Server up?
  let serverProcess: ChildProcess | null = null;
  if (await isServerUp()) {
    console.log(`Server already running on ${BASE}\n`);
  } else {
    console.log("Building frontend…");
    execSync("npm run build", { cwd: FRONTEND, stdio: "inherit", timeout: 300_000 });
    console.log(`\nStarting production server on port ${PORT}…`);
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

  // 2. Record the walkthrough into a webm.
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });

  let browser: Browser | null = null;
  let webmPath: string | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const context: BrowserContext = await browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      recordVideo: { dir: TMP, size: { width: WIDTH, height: HEIGHT } },
      reducedMotion: "no-preference",
    });
    // Suppress the first-visit onboarding modal so the /app scene shows the
    // dashboard + wallet picker (and the WalletConnect button is clickable).
    await context.addInitScript(() => {
      try {
        localStorage.setItem("stellaroid:freighter-welcome-dismissed", "1");
      } catch {
        /* ignore */
      }
    });
    const page = await context.newPage();

    console.log("Recording walkthrough:");
    for (const scene of SCENES) await playScene(page, scene);

    const video = page.video();
    await context.close(); // finalizes the webm
    if (video) webmPath = await video.path();
  } finally {
    if (browser) await browser.close();
  }

  if (serverProcess) {
    serverProcess.kill("SIGTERM");
    console.log("\nServer stopped.");
  }

  if (!webmPath || !fs.existsSync(webmPath)) {
    throw new Error("Playwright did not produce a video file.");
  }
  console.log(`\nRaw recording: ${webmPath} (${(fs.statSync(webmPath).size / 1024 / 1024).toFixed(1)} MB)`);

  // 3. Transcode webm -> mp4 (h264/yuv420p, faststart for web playback).
  console.log("Transcoding to MP4 (ffmpeg)…");
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  // CRF 28 + slow preset keeps a UI screencast visually clean while landing
  // the file in the low single-digit MB range (vs ~9 MB at CRF 23).
  execSync(
    `ffmpeg -y -i "${webmPath}" -c:v libx264 -preset slow -crf 28 ` +
      `-vf "fps=30,format=yuv420p" -movflags +faststart "${OUT}"`,
    { stdio: "inherit" },
  );

  fs.rmSync(TMP, { recursive: true, force: true });

  const outMb = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
  console.log(`\n=== Done ===`);
  console.log(`Wrote ${path.relative(ROOT, OUT)} (${outMb} MB)`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
