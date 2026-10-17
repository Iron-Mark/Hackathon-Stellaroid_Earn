import { test } from "node:test";
import assert from "node:assert/strict";
import { Account, Keypair, Networks, Operation, TransactionBuilder, Asset, FeeBumpTransaction } from "@stellar/stellar-sdk";
import { assertSignedTransaction } from "./signed-transaction.ts";

const signer = Keypair.random();
const other = Keypair.random();
function transaction(amount = "1", network = Networks.TESTNET) {
  return new TransactionBuilder(new Account(signer.publicKey(), "1"), { fee: "100", networkPassphrase: network })
    .addOperation(Operation.payment({ destination: other.publicKey(), asset: Asset.native(), amount }))
    .setTimeout(60).build();
}
test("accepts an unchanged transaction signed by the expected account on testnet", async () => {
  const tx = transaction();
  const original = tx.toXDR();
  tx.sign(signer);
  await assertSignedTransaction(original, tx.toXDR(), signer.publicKey(), Networks.TESTNET);
});
test("rejects altered transaction payload", async () => {
  const tx = transaction("2");
  tx.sign(signer);
  await assert.rejects(assertSignedTransaction(transaction().toXDR(), tx.toXDR(), signer.publicKey(), Networks.TESTNET), /changed/);
});
test("rejects an unsigned envelope and a different signer", async () => {
  const tx = transaction();
  const original = tx.toXDR();
  await assert.rejects(assertSignedTransaction(original, original, signer.publicKey(), Networks.TESTNET), /expected account and network/);
  tx.sign(other);
  await assert.rejects(assertSignedTransaction(original, tx.toXDR(), signer.publicKey(), Networks.TESTNET), /expected account and network/);
});
test("rejects a signature created for another network", async () => {
  const tx = transaction("1", Networks.PUBLIC);
  const original = tx.toXDR();
  tx.sign(signer);
  await assert.rejects(assertSignedTransaction(original, tx.toXDR(), signer.publicKey(), Networks.TESTNET), /expected account and network/);
});
test("rejects malformed envelopes and fee-bump wrappers", async () => {
  await assert.rejects(assertSignedTransaction("bad", "bad", signer.publicKey(), Networks.TESTNET));
  const tx = transaction();
  tx.sign(signer);
  const wrapped: FeeBumpTransaction = TransactionBuilder.buildFeeBumpTransaction(other, "100", tx, Networks.TESTNET);
  await assert.rejects(assertSignedTransaction(tx.toXDR(), wrapped.toXDR(), signer.publicKey(), Networks.TESTNET), /unsupported/);
});
