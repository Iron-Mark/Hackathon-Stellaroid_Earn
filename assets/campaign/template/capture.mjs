/**
 * Renders every campaign board in boards.html to a PNG.
 *
 *   node assets/campaign/template/capture.mjs            # all boards -> assets/campaign/
 *   node assets/campaign/template/capture.mjs readme-banner
 *
 * Playwright is resolved out of frontend/node_modules, so run `npm install`
 * there first. Nothing else is needed; the boards are plain HTML and pull the
 * real logo and illustrations straight from frontend/public.
 *
 * Two layout guards run before anything is written, because both of these
 * shipped as visible defects once already:
 *   1. an accent phrase in a headline wrapping across two lines
 *   2. an orbit ring or the ledger line overlapping the copy
 * A failure here means fix the template, not the guard.
 */
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(here, "../../../frontend/package.json"));
const { chromium } = require("@playwright/test");

// id -> output filename. The README banner writes into images/ because the
// site and README consume it; everything else is campaign material.
const BOARDS = [
  ["v320-hero", "../v320-hero.png"],
  ["v320-receipts", "../v320-receipts.png"],
  ["v320-flow", "../v320-flow.png"],
  ["m-general", "../m-general.png"],
  ["m-employer", "../m-employer.png"],
  ["m-issuer", "../m-issuer.png"],
  ["m-graduate", "../m-graduate.png"],
  ["sq-general", "../sq-general.png"],
  ["sq-employer", "../sq-employer.png"],
  ["sq-issuer", "../sq-issuer.png"],
  ["sq-graduate", "../sq-graduate.png"],
  ["story-general", "../story-general.png"],
  ["readme-banner", "../../../images/github-social-card.png"],
];

const only = process.argv[2];
const targets = only ? BOARDS.filter(([id]) => id === only) : BOARDS;
if (!targets.length) {
  console.error(`no board named "${only}". known: ${BOARDS.map(([i]) => i).join(", ")}`);
  process.exit(1);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1700, height: 2000 },
    deviceScaleFactor: 2,
  });
  await page.goto(pathToFileURL(path.join(here, "boards.html")).href);
  // Google Fonts are remote; without this the boards render in fallback faces.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);

  const problems = await page.evaluate(() => {
    const bad = [];
    const overlaps = (a, b) =>
      a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

    for (const span of document.querySelectorAll("h1 span")) {
      const h1 = span.closest("h1");
      const lines = Math.round(
        span.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight),
      );
      if (lines > 1) bad.push(`${span.closest("[id]").id}: accent phrase wraps`);
    }

    for (const board of document.querySelectorAll(".ground[id]")) {
      const copy = [...board.querySelectorAll("h1, .sub, .stat, .step")].map((el) =>
        el.getBoundingClientRect(),
      );
      for (const deco of board.querySelectorAll(".ring, .ledgerline")) {
        const d = deco.getBoundingClientRect();
        if (d.width && copy.some((c) => overlaps(c, d))) {
          bad.push(`${board.id}: ${deco.className.split(" ")[0]} overlaps copy`);
        }
      }
    }
    return bad;
  });

  if (problems.length) {
    console.error("layout guard failed:\n  " + problems.join("\n  "));
    process.exit(1);
  }

  for (const [id, out] of targets) {
    const el = page.locator(`#${id}`);
    await el.scrollIntoViewIfNeeded();
    await el.screenshot({ path: path.join(here, out) });
    console.log(`wrote ${path.basename(out)}`);
  }
} finally {
  await browser.close();
}
