import { expect, test } from "@playwright/test";

test("guided demo renders all steps with honest labeling", async ({ page }) => {
  await page.goto("/demo");

  await expect(
    page.getByRole("heading", {
      name: "Proof and payment, on real testnet data",
    }),
  ).toBeVisible();

  // Policy labeling: the tour must say the data is real and seeded.
  await expect(
    page.getByText(/real data on Stellar testnet, seeded by the team/),
  ).toBeVisible();
  await expect(page.getByText("Demo exhibit").first()).toBeVisible();

  // All four steps render.
  await expect(
    page.getByRole("heading", { name: /A bootcamp anchors the certificate/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /An approved issuer verifies it/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /An employer escrows a paid trial/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Milestones approved, payment released/ }),
  ).toBeVisible();

  // Live statuses from the e2e fixtures: credential is verified, and the
  // live-escrow exhibit (fixture id 1) reads as funded.
  await expect(page.getByText("Verified", { exact: true })).toBeVisible();
  await expect(page.getByText("funded", { exact: true })).toBeVisible();

  // Every step offers an independent stellar.expert audit link.
  await expect(
    page.getByRole("link", { name: /Verify on stellar.expert/ }),
  ).toHaveCount(4);

  // The live proof page is one click away. Generous timeout: the shared dev
  // server compiles /proof/[hash] on demand while parallel workers compile
  // other routes.
  await page
    .getByRole("link", { name: "Open the live proof page" })
    .click();
  await expect(page).toHaveURL(/\/proof\/[0-9a-f]{64}/, { timeout: 20_000 });
});
