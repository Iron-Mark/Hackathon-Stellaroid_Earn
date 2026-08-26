import { expect, test } from "@playwright/test";

const GRADUATE = "GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D";
const HASH_ONE = "1".repeat(64);
const HASH_TWO = "2".repeat(64);

const MIXED_CSV = [
  "graduate,hash,title,cohort,metadata_uri",
  `${GRADUATE},${HASH_ONE},First graduate,2026-Q3,`,
  `${GRADUATE},${HASH_TWO},Second graduate,2026-Q3,`,
  `not-a-wallet,${"3".repeat(64)},Bad wallet,2026-Q3,`,
  `${GRADUATE},zzzz,Bad hash,2026-Q3,`,
  `${GRADUATE},${HASH_ONE},Duplicate of first,2026-Q3,`,
].join("\n");

async function connectIssuer(page: import("@playwright/test").Page) {
  await page.goto("/issuer/batch");
  await page.getByRole("button", { name: "Connect Freighter", exact: true }).click();
  await expect(page.getByRole("button", { name: "Disconnect wallet" })).toBeVisible();
}

test("CSV preview validates rows, catches in-file duplicates, and signs the ready queue", async ({
  page,
}) => {
  await connectIssuer(page);

  await expect(page.getByRole("heading", { name: "Batch issuance" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download CSV template" })).toBeVisible();

  await page.getByLabel("Or paste CSV").fill(MIXED_CSV);
  await page.getByRole("button", { name: "Preview pasted CSV" }).click();

  await expect(page.getByText("2 ready", { exact: true })).toBeVisible();
  await expect(page.getByText("1 in-file duplicates", { exact: true })).toBeVisible();
  await expect(page.getByText("3 blocked", { exact: true })).toBeVisible();
  await expect(page.getByText("Same hash appears earlier in this CSV")).toBeVisible();
  await expect(page.getByText("Graduate wallet must be a 56-character G address")).toBeVisible();
  await expect(page.getByText("Hash must be 64 hexadecimal characters")).toBeVisible();

  const signButton = page.getByRole("button", { name: "Sign 2 ready rows" });
  await expect(signButton).toBeEnabled();
  await signButton.click();

  await expect(page.getByText("Batch signing finished")).toBeVisible();
  await expect(page.getByText("2 registered.")).toBeVisible();
  await expect(page.getByText("3 blocked", { exact: true })).toBeVisible();
  await expect(page.getByText("2 on-chain", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open proof" })).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Open proof" }).first()).toHaveAttribute(
    "href",
    `/proof/${HASH_ONE}`,
  );
});

test("a second preview of issued hashes is skipped as already on-chain", async ({ page }) => {
  await connectIssuer(page);

  const issuedCsv = [
    "graduate,hash,title",
    `${GRADUATE},${HASH_ONE},First graduate`,
    `${GRADUATE},${HASH_TWO},Second graduate`,
  ].join("\n");

  await page.getByLabel("CSV file").setInputFiles({
    name: "cohort.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(issuedCsv),
  });
  await expect(page.getByRole("button", { name: "Sign 2 ready rows" })).toBeEnabled();
  await page.getByRole("button", { name: "Sign 2 ready rows" }).click();
  await expect(page.getByText("2 registered.")).toBeVisible();

  await page.getByLabel("CSV file").setInputFiles({
    name: "cohort-again.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(issuedCsv),
  });
  await expect(page.getByText("2 on-chain", { exact: true })).toBeVisible();
  await expect(page.getByText("Already on-chain").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign 0 ready rows" })).toBeDisabled();
});
