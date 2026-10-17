/** Validate the wallet result without trusting its selected account/network. */
export async function assertSignedTransaction(
  originalXdr: string, signedXdr: string, address: string, networkPassphrase: string,
): Promise<void> {
  const { TransactionBuilder, Transaction, Keypair } = await import("@stellar/stellar-sdk");
  const original = TransactionBuilder.fromXdr(originalXdr, networkPassphrase);
  const signed = TransactionBuilder.fromXdr(signedXdr, networkPassphrase);
  if (!(original instanceof Transaction) || !(signed instanceof Transaction)) {
    throw new Error("The wallet returned an unsupported transaction envelope.");
  }
  const originalHash = original.hash();
  const signedHash = signed.hash();
  if (originalHash.length !== signedHash.length || originalHash.some((byte, index) => byte !== signedHash[index])) {
    throw new Error("The wallet changed the transaction. Nothing was submitted.");
  }
  const signer = Keypair.fromPublicKey(address);
  const valid = signed.signatures.some((signature) => {
    try { return signer.verify(signedHash, signature.signature); } catch { return false; }
  });
  if (!valid) throw new Error("The wallet did not sign with the expected account and network.");
}
