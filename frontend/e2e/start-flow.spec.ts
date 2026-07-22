import { expect, test } from "@playwright/test";

test("start flow: connect, skip funding, register as issuer, reach success", async ({ page }) => {
  await page.goto("/start");

  await page.getByRole("button", { name: "Start" }).click();

  // Connect step (e2e mode resolves a fixed test address with no real
  // extension). Mirrors register-verify-pay.spec.ts's connect approach.
  const connectButton = page.getByRole("button", { name: "Connect Freighter", exact: true }).first();
  await expect(connectButton).toBeVisible();
  await connectButton.click();

  // Fund step - skip the real friendbot call in e2e.
  await page.getByRole("button", { name: "Already funded? Skip" }).click();

  // Action step - register as issuer.
  await page.getByRole("button", { name: "Register your org as an issuer" }).click();
  await page.getByLabel("Organization name").fill("E2E Academy");
  await page.getByLabel("Category").fill("Bootcamp");
  await page.getByRole("button", { name: "Sign it" }).click();

  // Success step.
  await expect(page.getByText("You did it - it's on-chain")).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByRole("link", { name: "View your transaction on Stellar Expert" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Open the 20-second form" })).toBeVisible();
});
