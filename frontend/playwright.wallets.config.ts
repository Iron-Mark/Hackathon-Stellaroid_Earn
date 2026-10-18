import { defineConfig, devices } from "@playwright/test";

// Separate server deliberately disables the registry's fixture-wallet bypass.
// These tests exercise the real chooser against browser-injected doubles.
export default defineConfig({
  testDir: "./e2e-wallets", outputDir: "./test-results", timeout: 60_000, workers: 1, reporter: "list",
  use: { baseURL: "http://127.0.0.1:3008" },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3008",
    url: "http://127.0.0.1:3008", reuseExistingServer: false, timeout: 120_000,
    env: { NEXT_PUBLIC_E2E_MODE: "0", NEXT_PUBLIC_SOROBAN_CONTRACT_ID: "", NEXT_PUBLIC_STELLAR_READ_ADDRESS: "", NEXT_PUBLIC_STELLAR_NETWORK: "TESTNET" },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
