import { expect, test } from "@playwright/test";

test("opportunity directory lists escrows and links to the console", async ({
  page,
}) => {
  await page.goto("/opportunity");

  await expect(
    page.getByRole("heading", { name: "Opportunities", exact: true }),
  ).toBeVisible();

  // Filter chips render; wallet-scoped chips are disabled until connected.
  await expect(page.getByRole("button", { name: "All" })).toBeVisible();
  await expect(page.getByRole("button", { name: "For you" })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Created by you" }),
  ).toBeDisabled();

  // The e2e fixture escrow is listed with its live status.
  const row = page.getByRole("link", { name: /Opportunity #1/ });
  await expect(row).toBeVisible();
  await expect(row.getByText("funded")).toBeVisible();

  await row.click();
  await expect(page).toHaveURL("/opportunity/1");
  await expect(
    page.getByRole("heading", { name: "Escrowed paid trial" }),
  ).toBeVisible();
});
