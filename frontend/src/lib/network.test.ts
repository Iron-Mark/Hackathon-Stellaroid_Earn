import assert from "node:assert/strict";
import test from "node:test";
import { resolveNetwork } from "./network.ts";

test("defaults to testnet when STELLAR_NETWORK is unset", () => {
  const network = resolveNetwork({});
  assert.equal(network.name, "testnet");
  assert.equal(network.passphrase, "Test SDF Network ; September 2015");
  assert.equal(network.horizonUrl, "https://horizon-testnet.stellar.org");
  assert.equal(network.explorerBase, "https://stellar.expert/explorer/testnet");
  assert.equal(network.enableMainnetPayments, false);
});

test("garbage STELLAR_NETWORK values fall back to testnet, never mainnet", () => {
  for (const value of ["", "MAINNET-ish", "pubnet?", "prod", "Mainnet "]) {
    assert.equal(resolveNetwork({ STELLAR_NETWORK: value }).name, "testnet");
  }
});

test("testnet contract ID prefers CONTRACT_ID_TESTNET over the legacy var", () => {
  const network = resolveNetwork({
    CONTRACT_ID_TESTNET: "CTESTNETID",
    NEXT_PUBLIC_SOROBAN_CONTRACT_ID: "CLEGACYID",
  });
  assert.equal(network.contractId, "CTESTNETID");
  assert.equal(
    resolveNetwork({ NEXT_PUBLIC_SOROBAN_CONTRACT_ID: "CLEGACYID" }).contractId,
    "CLEGACYID",
  );
});

test("mainnet path resolves entirely from injected config", () => {
  const network = resolveNetwork({
    STELLAR_NETWORK: "mainnet",
    CONTRACT_ID_MAINNET: "CMAINNETFAKE",
    RPC_PROVIDERS: "https://rpc-a.example,https://rpc-b.example",
  });
  assert.equal(network.name, "mainnet");
  assert.equal(network.passphrase, "Public Global Stellar Network ; September 2015");
  assert.equal(network.contractId, "CMAINNETFAKE");
  assert.equal(network.horizonUrl, "https://horizon.stellar.org");
  assert.equal(network.explorerBase, "https://stellar.expert/explorer/public");
  assert.deepEqual(network.rpcProviders, [
    "https://rpc-a.example",
    "https://rpc-b.example",
  ]);
});

test("mainnet contract ID never falls back to the testnet value", () => {
  const network = resolveNetwork({
    STELLAR_NETWORK: "mainnet",
    CONTRACT_ID_TESTNET: "CTESTNETID",
    NEXT_PUBLIC_SOROBAN_CONTRACT_ID: "CLEGACYID",
  });
  assert.equal(network.contractId, "");
});

test("mainnet payments flag requires both mainnet and an explicit true", () => {
  assert.equal(
    resolveNetwork({ STELLAR_NETWORK: "mainnet", ENABLE_MAINNET_PAYMENTS: "true" })
      .enableMainnetPayments,
    true,
  );
  assert.equal(
    resolveNetwork({ STELLAR_NETWORK: "mainnet" }).enableMainnetPayments,
    false,
  );
  assert.equal(
    resolveNetwork({ STELLAR_NETWORK: "testnet", ENABLE_MAINNET_PAYMENTS: "true" })
      .enableMainnetPayments,
    false,
  );
  assert.equal(
    resolveNetwork({ STELLAR_NETWORK: "mainnet", ENABLE_MAINNET_PAYMENTS: "TRUE" })
      .enableMainnetPayments,
    false,
    "flag comparison is exact-match lowercase true only",
  );
});
