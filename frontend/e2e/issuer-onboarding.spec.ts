import { expect, test } from "@playwright/test";

test("issuer registration explains approval readiness before signing", async ({ page }) => {
  await page.goto("/issuer/register");

  await expect(
    page.getByRole("button", { name: "Connect Freighter", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Connect Freighter", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Register issuer" })).toBeVisible();
  await expect(page.getByText("Approval readiness")).toBeVisible();
  await expect(page.getByText("Admin approval required").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Plan a pilot first" })).toHaveAttribute(
    "href",
    "/pilot",
  );
});

test("issuer dashboard shows the trust-state ladder", async ({ page }) => {
  await page.goto("/issuer");

  await expect(
    page.getByRole("button", { name: "Connect Freighter", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Connect Freighter", exact: true }).click();

  await expect(page.getByRole("heading", { name: "On-chain issuer status" })).toBeVisible();
  await expect(page.getByText("Trust-state ladder")).toBeVisible();
  await expect(page.getByText("Profile -> Approval -> Issue credentials")).toBeVisible();
  await expect(page.getByText("Approved issuers can register, verify, suspend, and revoke credentials.")).toBeVisible();
  await expect(page.getByText("Employer proof handoff")).toBeVisible();
  await expect(page.getByText("Verify each credential before sending the proof to an employer.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Batch issue from CSV" })).toHaveAttribute(
    "href",
    "/issuer/batch",
  );
  await expect(page.getByRole("button", { name: "Refresh issuer dates" })).toHaveCount(0);
});
