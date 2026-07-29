import { expect, test } from "@playwright/test";

const SAMPLE_PROOF_HASH =
  "c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3";

test("pilot intake page exposes issuer and employer paths", async ({ page }) => {
  await page.goto("/pilot");

  await expect(
    page.getByRole("heading", { name: /run a narrow credential pilot/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /request an issuer pilot/i }),
  ).toHaveAttribute("href", "#request");
  await expect(
    page.getByRole("link", { name: /book directly on linkedin/i }),
  ).toHaveAttribute("href", "https://www.linkedin.com/in/mark-siazon/");
  await expect(page.getByRole("link", { name: /review proof workflow/i })).toHaveAttribute(
    "href",
    "/proof",
  );

  // The on-site lead form is present with its required fields.
  await expect(
    page.getByRole("heading", { name: "Request a testnet pilot" }),
  ).toBeVisible();
  await expect(page.getByLabel("Your name")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Request a pilot" })).toBeDisabled();
  await expect(page.getByRole("heading", { name: "Pilot scope guardrails" })).toBeVisible();
  await expect(page.getByText("5 to 10 credentials")).toBeVisible();
  await expect(page.getByText("No mainnet or production payroll")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open issuer console" })).toHaveAttribute(
    "href",
    "/issuer",
  );
});

test("verified proof exposes an employer summary export", async ({ page, request }) => {
  await page.goto(`/proof/${SAMPLE_PROOF_HASH}`);

  const exportLink = page.getByRole("link", { name: /download proof pack/i });
  await expect(exportLink).toHaveAttribute("href", `/proof/${SAMPLE_PROOF_HASH}/export`);
  const breakdown = page.getByRole("region", { name: "Proof verification breakdown" });
  await expect(breakdown.getByText("Verification breakdown", { exact: true })).toBeVisible();
  await expect(breakdown.getByText("Hash anchor", { exact: true })).toBeVisible();
  await expect(breakdown.getByText("Issuer registry", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Review proof breakdown", { exact: true })).toBeVisible();
  await expect(page.getByText("Match wallet", { exact: true })).toBeVisible();
  await expect(page.getByText("Save proof pack", { exact: true })).toBeVisible();
  await expect(page.getByText("Fund escrow", { exact: true })).toBeVisible();

  const response = await request.get(`/proof/${SAMPLE_PROOF_HASH}/export`);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-disposition"]).toContain(
    "stellaroid-proof-c02ce1602d5b-summary.json",
  );

  const body = await response.json();
  expect(body.type).toBe("stellaroid.employer_verification_summary");
  expect(body.proofUrl).toBe(`https://stellaroid.tech/proof/${SAMPLE_PROOF_HASH}`);
  expect(body.trustSummary.status).toBe("verified");
  expect(body.trustSummary.verified).toBe(true);
  expect(body.trustSummary.issuerRegistryStatus).toBe("approved");
  expect(body.verificationBreakdown.decision).toBe("ready_for_paid_trial_review");
  expect(body.verificationBreakdown.issuerTrust.status).toBe("approved");
  expect(body.verificationBreakdown.checks.map((check: { title: string }) => check.title)).toEqual([
    "Hash anchor",
    "Contract record",
    "Credential status",
    "Issuer registry",
    "Employer handoff",
  ]);
  expect(body.employerReview.decision).toBe("ready_for_paid_trial_review");
  expect(body.employerReview.path.map((step: { title: string }) => step.title)).toEqual([
    "Review proof breakdown",
    "Match wallet",
    "Save proof pack",
    "Fund escrow",
  ]);
  expect(body.credential.hash).toBe(SAMPLE_PROOF_HASH);
  expect(body.standardsAlignment.status).toBe("unsigned_preview");
  expect(body.standardsAlignment.warning).toContain("not a signed Verifiable Credential");
  expect(body.standardsAlignment.w3cVerifiableCredential2Preview.type).toContain(
    "VerifiableCredential",
  );
  expect(body.recruiterChecklist).toContain(
    "Read standardsAlignment.warning before treating this export as a standards credential.",
  );
  expect(body.recruiterChecklist).toContain(
    "Open proofUrl and review verificationBreakdown.checks before funding.",
  );
});
