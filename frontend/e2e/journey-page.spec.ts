import { expect, test } from "@playwright/test";

test("journey page shows recognition, chapters, and credits", async ({ page }) => {
  await page.goto("/journey");

  await expect(
    page.getByRole("heading", { name: "How this project got here" }),
  ).toBeVisible();

  // All five recognitions render in the band. Scoped to the band on purpose:
  // each award deliberately appears twice, here and inside its own chapter.
  const band = page.getByRole("region", { name: "Recognition" });
  for (const headline of [
    "Top 5 of 105 participants",
    "Selected as a Global Monthly Builder",
    "Speaker at the June Monthly Builder",
    "1 of 13 Philippine builders selected",
    "Blue Belt, Level 5",
  ]) {
    await expect(band.getByRole("heading", { name: headline })).toBeVisible();
  }

  // Six chapters, each rendered as a section the rail can target.
  for (const slug of [
    "bootcamp",
    "judge-ready",
    "quiet-and-spotlight",
    "trust-layer",
    "verified-redeploy",
    "level5-growth",
  ]) {
    await expect(page.locator(`#${slug}`)).toBeAttached();
  }

  await expect(
    page.getByRole("heading", { name: "Built on other people's work" }),
  ).toBeVisible();
});

test("chapters toggle open and closed", async ({ page }) => {
  await page.goto("/journey");

  const header = page.getByRole("button", { name: /Making trust legible/ });
  await expect(header).toHaveAttribute("aria-expanded", "false");

  await header.click();
  await expect(header).toHaveAttribute("aria-expanded", "true");

  await header.click();
  await expect(header).toHaveAttribute("aria-expanded", "false");
});

test("the first chapter is open by default", async ({ page }) => {
  await page.goto("/journey");
  await expect(
    page.getByRole("button", { name: /It started as a bootcamp assignment/ }),
  ).toHaveAttribute("aria-expanded", "true");
});

test("a deep link opens that chapter alone", async ({ page }) => {
  await page.goto("/journey#verified-redeploy");

  await expect(
    page.getByRole("button", { name: /Redeployed so the contract can be checked/ }),
  ).toHaveAttribute("aria-expanded", "true");
  // The default-open first chapter must have yielded to the deep link.
  await expect(
    page.getByRole("button", { name: /It started as a bootcamp assignment/ }),
  ).toHaveAttribute("aria-expanded", "false");
});

test("collapsed chapter content stays in the DOM but out of the tab order", async ({
  page,
}) => {
  await page.goto("/journey");

  // trust-layer is collapsed on load. Its milestones must still be present, so
  // the page reads correctly without JavaScript and stays crawlable.
  const collapsedPanel = page.locator("#journey-panel-trust-layer");
  await expect(collapsedPanel).toBeAttached();
  await expect(collapsedPanel).toHaveAttribute("inert", "");
  await expect(
    collapsedPanel.getByText("Contract verification audit"),
  ).toBeAttached();
});

test("milestones link to real commits and the credits anchor resolves", async ({
  page,
}) => {
  await page.goto("/journey");

  await expect(page.getByRole("link", { name: "v1.0.0" })).toHaveAttribute(
    "href",
    "https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn/releases/tag/v1.0.0",
  );

  await expect(page.locator("#credits")).toBeAttached();
  await expect(page.getByText("OFL-1.1").first()).toBeAttached();
});
