import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { EXTENSION_WALLETS, isExtensionWalletId, connectExtensionWallet, signExtensionTransaction } from "./extension-adapters.ts";

const address = "GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D";
const other = `G${"A".repeat(55)}`;
const network = "Test SDF Network ; September 2015";
beforeEach(() => Object.defineProperty(globalThis, "window", { value: {}, configurable: true }));
test("allowlists exactly the six legacy IDs with local icons and HTTPS install links", () => {
  assert.equal(EXTENSION_WALLETS.length, 6);
  for (const wallet of EXTENSION_WALLETS) {
    assert.ok(isExtensionWalletId(wallet.id));
    assert.match(wallet.icon, /^\/wallet-icons\//);
    assert.match(wallet.installUrl, /^https:\/\//);
  }
  assert.equal(isExtensionWalletId("hot"), false);
  assert.equal(isExtensionWalletId("bitgetwallet"), false);
});
test("Rabet detects late injection and maps the requested network", async () => {
  let requested: unknown[] = [];
  const connecting = connectExtensionWallet("rabet");
  Object.assign(window, { rabet: { connect: async () => ({ publicKey: address }), sign: async (...args: unknown[]) => { requested = args; return { xdr: "signed" }; } } });
  assert.equal(await connecting, address);
  assert.equal(await signExtensionTransaction("rabet", "original", address, network), "signed");
  assert.deepEqual(requested, ["original", "testnet"]);
  await assert.rejects(signExtensionTransaction("rabet", "xdr", address, "custom"), /only the public and testnet/);
});
test("Hana passes explicit account and network", async () => {
  let requested: unknown;
  Object.assign(window, { hanaWallet: { stellar: { getPublicKey: async () => address, signTransaction: async (params: unknown) => { requested = params; return "signed"; } } } });
  assert.equal(await connectExtensionWallet("hana"), address);
  assert.equal(await signExtensionTransaction("hana", "original", address, network), "signed");
  assert.deepEqual(requested, { xdr: "original", accountToSign: address, networkPassphrase: network });
});
test("Klever validates account, network and returned signer", async () => {
  const provider = { getAddress: async () => ({ address }), getNetwork: async () => ({ networkPassphrase: network }), signTransaction: async () => ({ signedTxXdr: "signed", signerAddress: address }) };
  Object.assign(window, { kleverWallet: { stellar: provider } });
  assert.equal(await signExtensionTransaction("klever", "original", address, network), "signed");
  provider.signTransaction = async () => ({ signedTxXdr: "signed", signerAddress: other });
  await assert.rejects(signExtensionTransaction("klever", "original", address, network), /different account/);
  provider.getNetwork = async () => ({ networkPassphrase: "wrong" });
  await assert.rejects(signExtensionTransaction("klever", "original", address, network), /different network/);
});
test("Bitget uses call-time injection and explicit sign options", async () => {
  await assert.rejects(connectExtensionWallet("BitgetWallet"), /not installed/);
  let requested: unknown[] = [];
  Object.assign(window, { bitkeep: { stellar: { connect: async () => address, network: async () => ({ networkPassphrase: network }), signTransaction: async (...args: unknown[]) => { requested = args; return "signed"; } } } });
  assert.equal(await signExtensionTransaction("BitgetWallet", "original", address, network), "signed");
  assert.deepEqual(requested, ["original", { address, networkPassphrase: network }]);
});
test("rejects missing/malformed accounts, nested errors and changed accounts", async () => {
  await assert.rejects(connectExtensionWallet("hana"), /not installed/);
  Object.assign(window, { hanaWallet: { stellar: { getPublicKey: async () => "bad" } } });
  await assert.rejects(connectExtensionWallet("hana"), /valid account/);
  Object.assign(window, { hanaWallet: { stellar: { getPublicKey: async () => { throw { error: { message: "User cancelled" } }; } } } });
  await assert.rejects(connectExtensionWallet("hana"), /User cancelled/);
  Object.assign(window, { hanaWallet: { stellar: { getPublicKey: async () => other, signTransaction: async () => { throw new Error("Must not sign"); } } } });
  await assert.rejects(signExtensionTransaction("hana", "original", address, network), /account changed/);
});
test("xBull genuine bridge uses injected protocol and closes listeners", async () => {
  // Browser-only SDK also reads location and registers message listeners.
  Object.assign(window, { location: { origin: "http://localhost" }, addEventListener: () => {}, removeEventListener: () => {}, xBullSDK: { getAddress: async () => ({ address }), signTransaction: async () => ({ signedTxXdr: "signed" }) } });
  const { xBullWalletConnect } = await import("@creit.tech/xbull-wallet-connect");
  const close = xBullWalletConnect.prototype.closeConnections;
  let closed = 0;
  xBullWalletConnect.prototype.closeConnections = function () { closed++; close.call(this); };
  try {
    assert.equal(await connectExtensionWallet("xbull"), address);
    assert.equal(await signExtensionTransaction("xbull", "original", address, network), "signed");
    assert.equal(closed, 3);
    Object.assign(window, { xBullSDK: { getAddress: async () => { throw new Error("Declined"); } } });
    await assert.rejects(connectExtensionWallet("xbull"), /Declined/);
    assert.equal(closed, 4);
  } finally { xBullWalletConnect.prototype.closeConnections = close; }
});
test("rejects empty signed XDR", async () => {
  Object.assign(window, { hanaWallet: { stellar: { getPublicKey: async () => address, signTransaction: async () => "" } } });
  await assert.rejects(signExtensionTransaction("hana", "original", address, network), /signed transaction/);
});
test("LOBSTR genuine bridge sends access and sign requests without replacing its protocol", async () => {
  const handlers = new Set<(event: unknown) => void>();
  const requests: Array<Record<string, unknown>> = [];
  const stored = new Map<string, string>();
  Object.assign(window, {
    lobstrSignerExtension: true,
    location: { origin: "http://localhost" },
    sessionStorage: { getItem: (key: string) => stored.get(key), setItem: (key: string, value: string) => stored.set(key, value) },
    addEventListener: (_name: string, handler: (event: unknown) => void) => handlers.add(handler),
    removeEventListener: (_name: string, handler: (event: unknown) => void) => handlers.delete(handler),
    postMessage: (request: Record<string, unknown>) => {
      requests.push(request);
      queueMicrotask(() => {
        const event = { source: window, data: { source: "LOBSTR_EXTERNAL_MSG_RESPONSE", messagedId: request.messageId,
          publicKey: address, connectionKey: "test-connection", signedData: "signed" } };
        for (const handler of handlers) handler(event);
      });
    },
  });
  assert.equal(await connectExtensionWallet("lobstr"), address);
  assert.equal(await signExtensionTransaction("lobstr", "original", address, network), "signed");
  assert.equal(requests.at(-1)?.type, "SIGN");
  assert.equal(requests.at(-1)?.dataToSign, "original");
  assert.equal(handlers.size, 0);
});
