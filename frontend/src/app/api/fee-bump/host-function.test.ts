import { test } from "node:test";
import assert from "node:assert/strict";
import {
  Account,
  BASE_FEE,
  Networks,
  Operation,
  StrKey,
  TransactionBuilder,
  nativeToScVal,
} from "@stellar/stellar-sdk";

// Mirrors the HostFunction reads in route.ts so a stellar-sdk 17 XDR
// reshape fails here instead of only at fee-bump runtime.
const SOURCE = "GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D";
const CONTRACT = "CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV";

test("sdk 17 HostFunction exposes type and invokeContract for fee-bump checks", () => {
  const sourceAccount = new Account(SOURCE, "0");
  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: CONTRACT,
        function: "register_certificate",
        args: [nativeToScVal("x", { type: "string" })],
      }),
    )
    .setTimeout(30)
    .build();

  const op = transaction.operations[0];
  assert.equal(op.type, "invokeHostFunction");
  if (op.type !== "invokeHostFunction") return;

  const hostFunction = op.func;
  assert.equal(hostFunction.type, "hostFunctionTypeInvokeContract");
  const invokeArgs = hostFunction.invokeContract;
  assert.equal(invokeArgs.functionName.toString(), "register_certificate");
  assert.equal(invokeArgs.contractAddress.type, "scAddressTypeContract");

  const configuredContract = Buffer.from(StrKey.decodeContract(CONTRACT)).toString(
    "hex",
  );
  const txContract = Buffer.from(
    invokeArgs.contractAddress.contractId.toBytes(),
  ).toString("hex");
  assert.equal(txContract, configuredContract);
});
