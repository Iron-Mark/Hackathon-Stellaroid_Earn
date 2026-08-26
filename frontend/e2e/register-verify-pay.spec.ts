import { expect, test } from "@playwright/test";

test("register, verify, pay, and open the proof page", async ({ page }) => {
  await page.goto("/app");

  const walletIntro = page.getByRole("dialog", {
    name: /wallet to sign/i,
  });
  await walletIntro
    .getByRole("button", { name: "Let’s go" })
    .click({ timeout: 5_000 })
    .catch(() => undefined);

  const connectButton = page.getByRole("button", { name: "Connect Freighter", exact: true }).first();
  await expect(
    connectButton,
  ).toBeVisible();
  await connectButton.click();

  await expect(page.getByRole("button", { name: "Copy wallet address" })).toBeVisible();
  await expect(page.getByText("GAWI •••• •••• R34D")).toBeVisible();

  // Wallet-scoped history: contract events involving the connected wallet
  // surface in the sidebar, including escrow events.
  await expect(page.getByText("Activity involving your wallet")).toBeVisible();
  await expect(
    page.getByText("Opportunity #1 funded — escrow locked"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Autofill form inputs" }).click();

  await expect(page.getByRole("link", { name: "Issue a cohort from CSV" })).toHaveAttribute(
    "href",
    "/issuer/batch",
  );

  const studentWalletInput = page.getByLabel("Student wallet (G...)").first();
  const hashInput = page.getByLabel("Certificate hash (64 hex)").first();
  await expect(studentWalletInput).toHaveValue(/^G[A-Z0-9]{55}$/);
  await expect(hashInput).toHaveValue(/^[0-9a-f]{64}$/);
  await expect(page.getByRole("textbox", { name: "Valid until (optional)" })).toBeVisible();
  const studentWallet = (await studentWalletInput.inputValue()).trim();
  const certHash = (await hashInput.inputValue()).trim();

  await page.getByRole("button", { name: "Register Certificate" }).click();
  await expect(page.getByText("Certificate registered")).toBeVisible();

  await page.getByRole("button", { name: "Look up" }).click();
  await expect(
    page.getByRole("button", { name: "Approve credential" }),
  ).toBeEnabled();
  await expect(page.getByText("Expires")).toBeVisible();
  await expect(page.getByText("Not set")).toBeVisible();

  await page.getByRole("button", { name: "Approve credential" }).click();
  await expect(page.getByText("Credential approved")).toBeVisible();
  await expect(page.getByText(/already verified on-chain/i)).toBeVisible();

  await page.getByRole("radio", { name: /Employer/i }).click();
  await page.getByLabel("Amount (XLM)").fill("10");
  await expect(page.getByRole("button", { name: "Pay Student" })).toBeEnabled();
  await page.getByRole("button", { name: "Pay Student" }).click();
  await expect(page.getByText("Payment settled")).toBeVisible();

  const proofLink = page.getByRole("link", { name: "View & share your proof" });
  await expect(proofLink).toHaveAttribute("href", `/proof/${certHash}`);
  await proofLink.click();

  await expect(page).toHaveURL(`/proof/${certHash}`);
  // exact: true — the page also has an sr-only SEO h1 that extends this title,
  // which the default substring matcher would ambiguously match.
  // First hit to /proof/[hash] cold-compiles in the dev server; give the first
  // content assertion on this route room to absorb that compile so CI is stable.
  await expect(
    page.getByRole("heading", { name: "Stellar Smart Contract Bootcamp Completion", exact: true }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByText("This credential is verified on-chain.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Fund paid trial" })).toHaveAttribute(
    "href",
    new RegExp(`candidate=${studentWallet}`),
  );
  const candidatePassportHref = `/talent/${studentWallet}?proof=${certHash}`;
  await expect(page.getByRole("link", { name: "View candidate passport →" })).toHaveAttribute(
    "href",
    candidatePassportHref,
  );

  await page.goto(candidatePassportHref);
  await expect(page).toHaveURL(candidatePassportHref);
  // First hit to /talent/[address] cold-compiles too.
  await expect(page.getByRole("heading", { name: "Candidate passport" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Known proofs")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Stellar Smart Contract Bootcamp Completion" }),
  ).toHaveAttribute("href", `/proof/${certHash}`);
  await expect(page.getByRole("link", { name: "Back to verified proof" })).toHaveAttribute(
    "href",
    `/proof/${certHash}`,
  );

  await page.goto(`/proof/${certHash}`);

  const employerHref = `/employer?hash=${certHash}&candidate=${studentWallet}`;
  await expect(page.getByRole("link", { name: "Fund paid trial" })).toHaveAttribute(
    "href",
    employerHref,
  );

  await page.goto(employerHref);
  await expect(page).toHaveURL(
    new RegExp(`/employer\\?hash=${certHash}&candidate=${studentWallet}`),
  );
  // First hit to /employer cold-compiles too.
  await expect(page.getByRole("heading", { name: "Review before funding" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Hash anchor", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Issuer registry", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("The proof-link candidate matches the credential owner.")).toBeVisible();
  await expect(page.getByText("Employer review brief")).toBeVisible();
  await expect(
    page.getByText(
      "Ready for employer review: the credential is verified on-chain and the issuer registry status is approved.",
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Opportunity title")).toHaveValue(
    "Paid trial: Stellar Smart Contract Bootcamp Completion",
  );
  await expect(page.getByRole("button", { name: "Create opportunity" })).toBeDisabled();

  await page.getByLabel("Amount (XLM)").fill("25");
  await expect(page.getByRole("button", { name: "Create opportunity" })).toBeEnabled();
  await page.getByRole("button", { name: "Create opportunity" }).click();
  await expect(page.getByText("Opportunity #1 is ready to track")).toBeVisible();
  await expect(page.getByRole("button", { name: "Fund escrow" })).toBeEnabled();
  await page.getByRole("button", { name: "Fund escrow" }).click();
  await expect(page.getByRole("button", { name: "Escrow funded" })).toBeVisible();

  // Close the loop: the created opportunity is reachable and renders the
  // escrow console (submit/approve/release actions live here).
  await page.getByRole("link", { name: "Open opportunity" }).click();
  await expect(page).toHaveURL("/opportunity/1", { timeout: 20_000 });
  await expect(page.getByText("Opportunity #1", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Escrowed paid trial" }),
  ).toBeVisible();
});
