import { expect, test } from "@playwright/test";

test("status page exposes project health, domain state, and proof links", async ({ page }) => {
  const healthResponse = await page.request.get("/api/health");
  expect(healthResponse.ok()).toBe(true);
  const health = await healthResponse.json();
  expect(health.checks.contract.detail).toContain("Contract ID configured");
  expect(health.checks.contract.detail).not.toContain("reachable");

  await page.goto("/status");

  await expect(
    page.getByRole("heading", { name: "Project Status" }),
  ).toBeVisible();
  await expect(page.getByText("Fallback demo", { exact: true })).toBeVisible();
  await expect(page.getByText("Custom domain", { exact: true })).toBeVisible();
  await expect(page.getByText("Stellar testnet", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open sample proof" })).toHaveAttribute(
    "href",
    /^\/proof\/[0-9a-f]{64}$/,
  );
  await expect(page.getByRole("link", { name: "View contract" })).toHaveAttribute(
    "href",
    /stellar\.expert\/explorer\/testnet\/contract\//,
  );
});

test("events API exposes source-labelled event evidence", async ({ request }) => {
  const response = await request.get("/api/events?limit=3");
  expect(response.ok()).toBe(true);

  const body = await response.json();
  expect(body.summary.totalEvents).toBeGreaterThan(0);
  expect(body.summary.bySource.e2e).toBeGreaterThan(0);
  expect(body.summary.uniqueEventRefs).toBeGreaterThan(0);

  for (const event of body.events) {
    expect(event.source).toMatch(/^(rpc|stellar_expert|e2e)$/);
    expect(event.externalUrl).toContain("stellar.expert");
    expect(event.reference.length).toBeGreaterThan(0);
  }
});
