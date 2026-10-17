import { test, expect } from "@playwright/test";

const address = "GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((account) => {
    localStorage.setItem("stellaroid:freighter-welcome-dismissed", "1");
    Object.assign(window, {
      rabet: { connect: async () => ({ publicKey: account }) },
      hanaWallet: { stellar: { getPublicKey: async () => account } },
      kleverWallet: { stellar: { getAddress: async () => ({ address: account }) } },
      bitkeep: { stellar: { connect: async () => account } },
      xBullSDK: { getAddress: async () => ({ address: account }) },
      lobstrSignerExtension: true,
    });
    window.addEventListener("message", (event) => {
      if (event.source !== window || event.data?.source !== "LOBSTR_EXTERNAL_MSG_REQUEST") return;
      window.postMessage({ source: "LOBSTR_EXTERNAL_MSG_RESPONSE", messagedId: event.data.messageId,
        publicKey: account, connectionKey: "qa-connection", isConnected: true }, window.location.origin);
    });
  }, address);
  await page.goto("/app");
});
for (const label of ["xBull", "Rabet", "LOBSTR", "Hana Wallet", "Klever Wallet", "Bitget Wallet"]) {
  test(`${label} connects through the real picker, restores and disconnects`, async ({ page }) => {
    await page.getByRole("button", { name: /^More wallets/ }).first().click();
    const chooser = page.getByRole("dialog", { name: "Choose a Stellar wallet" });
    await expect(chooser.getByRole("button", { name: label, exact: true })).toBeVisible();
    await chooser.getByRole("button", { name: label, exact: true }).click();
    await expect(chooser).not.toBeVisible();
    await expect(page.getByRole("button", { name: `Disconnect ${label}`, exact: true }).first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("stellaroid:wallet-provider"))).toBe("swk");
    await page.reload();
    await page.getByRole("button", { name: `Disconnect ${label}`, exact: true }).first().click();
    await expect(page.getByRole("button", { name: /^More wallets/ }).first()).toBeVisible();
  });
}
test("picker cancels, retries missing extensions and keeps local icons", async ({ page }) => {
  await page.evaluate(() => { delete (window as Window & { hanaWallet?: unknown }).hanaWallet; });
  await page.getByRole("button", { name: /^More wallets/ }).first().click();
  const chooser = page.getByRole("dialog", { name: "Choose a Stellar wallet" });
  await chooser.getByRole("button", { name: "Hana Wallet", exact: true }).click();
  await expect(chooser.getByRole("alert")).toContainText("not installed");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await chooser.screenshot({ path: "../output/playwright/extension-wallet-picker.png" });
  await page.setViewportSize({ width: 1280, height: 720 });
  expect(await chooser.locator("img").evaluateAll((images) => images.every((img) => img.getAttribute("src")?.startsWith("/wallet-icons/")))).toBe(true);
  await chooser.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(chooser).not.toBeVisible();
  await page.getByRole("button", { name: /^More wallets/ }).first().click();
  await chooser.getByRole("button", { name: "Rabet", exact: true }).click();
  await expect(page.getByRole("button", { name: "Disconnect Rabet", exact: true }).first()).toBeVisible();
});
