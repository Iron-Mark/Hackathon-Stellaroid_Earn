import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { Account, Keypair, Networks, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import {
  swkProvider, forgetSwkSession, selectExtensionWallet,
  cancelExtensionSelection, subscribeExtensionModal,
} from "./swk-provider.ts";

const address = "GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D";
const values = new Map<string, string>();
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { values.set(key, value); },
  removeItem: (key: string) => { values.delete(key); },
};
beforeEach(() => {
  Object.defineProperty(globalThis, "window", { value: { localStorage: storage, rabet: { connect: async () => ({ publicKey: address }) } }, configurable: true });
  forgetSwkSession();
  values.clear();
});
test("restores known legacy sessions without calling an extension", async () => {
  storage.setItem("@StellarWalletsKit/selectedModuleId", "rabet");
  storage.setItem("@StellarWalletsKit/activeAddress", address);
  const saved = await swkProvider.read();
  assert.equal(saved.providerLabel, "Rabet");
  assert.equal(saved.address, address);
  storage.setItem("@StellarWalletsKit/selectedModuleId", "hot");
  assert.equal((await swkProvider.read()).status, "disconnected");
});
test("connects and persists selection, then disconnects locally", async () => {
  const connection = swkProvider.connect();
  await selectExtensionWallet("rabet");
  assert.equal((await connection).providerLabel, "Rabet");
  assert.equal(storage.getItem("@StellarWalletsKit/selectedModuleId"), "rabet");
  forgetSwkSession();
  assert.equal((await swkProvider.read()).status, "disconnected");
});
test("cancels selection and ignores a late extension approval", async () => {
  let approve!: (value: { publicKey: string }) => void;
  Object.assign(window, { rabet: { connect: () => new Promise((resolve) => { approve = resolve; }) } });
  const connection = swkProvider.connect();
  const rejection = assert.rejects(connection, /selection closed/);
  const selection = selectExtensionWallet("rabet");
  await new Promise((resolve) => setTimeout(resolve, 130));
  cancelExtensionSelection();
  approve({ publicKey: address });
  await selection;
  await rejection;
  assert.equal((await swkProvider.read()).status, "disconnected");
});
test("rejects duplicate connections and exposes recoverable picker errors", async () => {
  const states: Array<string | null> = [];
  const unsubscribe = subscribeExtensionModal((state) => states.push(state.error));
  const connection = swkProvider.connect();
  const rejection = assert.rejects(connection, /selection closed/);
  await assert.rejects(swkProvider.connect(), /already in progress/);
  await selectExtensionWallet("hana");
  assert.match(states.at(-1) ?? "", /not installed/);
  cancelExtensionSelection();
  await rejection;
  unsubscribe();
});
test("supports blocked localStorage through an in-memory session", async () => {
  Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); }, configurable: true });
  const connection = swkProvider.connect();
  await selectExtensionWallet("rabet");
  await connection;
  assert.equal((await swkProvider.read()).address, address);
  forgetSwkSession();
  await assert.rejects(swkProvider.sign("xdr", address), /Reconnect/);
});
test("provider signs through the adapter and rejects altered signed transactions", async () => {
  const signer = Keypair.random();
  const account = signer.publicKey();
  let amount = "original";
  const tx = new TransactionBuilder(new Account(account, "1"), { fee: "100", networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.manageData({ name: "qa", value: "original" })).setTimeout(60).build();
  const original = tx.toXDR();
  Object.assign(window, { rabet: {
    connect: async () => ({ publicKey: account }),
    sign: async () => {
      const result = amount === "original" ? tx : new TransactionBuilder(new Account(account, "1"), { fee: "100", networkPassphrase: Networks.TESTNET })
        .addOperation(Operation.manageData({ name: "qa", value: "altered" })).setTimeout(60).build();
      result.sign(signer);
      return { xdr: result.toXDR() };
    },
  } });
  const connected = swkProvider.connect();
  await selectExtensionWallet("rabet");
  await connected;
  assert.ok(await swkProvider.sign(original, account));
  amount = "altered";
  await assert.rejects(swkProvider.sign(original, account), /changed the transaction/);
});
