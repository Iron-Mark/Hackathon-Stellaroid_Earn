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

// The issuer branch above was the only path covered. This walks the tip branch
// up to the point of signing: the amount chips, their selected state, and the
// submit gate. It deliberately stops before "Sign it" so the suite does not
// depend on a real link_payment signature against the seeded graduate.
test("start flow: tip branch exposes amount chips and enables submit", async ({ page }) => {
  await page.goto("/start");

  await page.getByRole("button", { name: "Start" }).click();

  const connectButton = page.getByRole("button", { name: "Connect Freighter", exact: true }).first();
  await expect(connectButton).toBeVisible();
  await connectButton.click();

  await page.getByRole("button", { name: "Already funded? Skip" }).click();

  await page.getByRole("button", { name: "Send a testnet tip to a graduate" }).click();

  const amounts = page.getByRole("group", { name: "Tip amount" });
  await expect(amounts).toBeVisible();

  // exact: true matters here. getByRole matches the accessible name as a
  // substring by default, so a loose "1 XLM" also matches "10 XLM" and trips
  // strict mode with two results.
  const chip = (label: string) => page.getByRole("button", { name: label, exact: true });

  // 1 XLM is the reducer's initial tipXlm, so it starts selected.
  await expect(chip("1 XLM")).toHaveAttribute("aria-pressed", "true");

  await chip("5 XLM").click();
  await expect(chip("5 XLM")).toHaveAttribute("aria-pressed", "true");
  await expect(chip("1 XLM")).toHaveAttribute("aria-pressed", "false");

  await expect(page.getByRole("button", { name: "Sign it", exact: true })).toBeEnabled();
});
