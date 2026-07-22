import { appConfig } from "./config.ts";
import { DEFAULT_SAMPLE_PROOF_HASH } from "./demo-data.ts";

// The seeded, verified demo credential and its graduate (cert.owner). The tip
// action pays this graduate against this credential; the contract enforces
// cert.owner == recipient, so these must stay in sync with the live exhibit.
export const TIP_CERT_HASH = DEFAULT_SAMPLE_PROOF_HASH;
export const TIP_RECIPIENT =
  "GALGZZRXRB5SIBGT62OZDA7BMPC4YUZDECHVHGWOAMXIMNLTZGFGTLMN";

// Feedback Form; prefill entry id is filled in Task 7 (fall back to plain link).
const FEEDBACK_FORM_BASE =
  "https://docs.google.com/forms/d/e/1FAIpQLSftFt8grSRUPecRVQWSRROLA8DAUOn4T61CrZQHtPQaMTxaWw/viewform";
// Replace WALLET_ENTRY_ID in Task 7 once obtained from the Form's prefill link.
const WALLET_ENTRY_ID = "";

export function xlmToStroops(xlm: number): bigint {
  return BigInt(Math.round(xlm * 10_000_000));
}

export function explorerTxUrl(hash: string): string {
  return `${appConfig.explorerUrl}/tx/${hash}`;
}

export function feedbackFormUrl(address: string, entryId: string = WALLET_ENTRY_ID): string {
  if (!entryId) return `${FEEDBACK_FORM_BASE}?usp=pp_url`;
  return `${FEEDBACK_FORM_BASE}?usp=pp_url&${entryId}=${encodeURIComponent(address)}`;
}

export async function registerIssuerAction(
  address: string,
  name: string,
  category: string,
): Promise<{ hash: string }> {
  const { registerIssuer } = await import("./contract-client");
  const res = await registerIssuer(address, name, "", category);
  return { hash: res.hash ?? "" };
}

export async function sendTipAction(
  address: string,
  xlm: number,
): Promise<{ hash: string }> {
  const { linkPayment } = await import("./contract-client");
  const res = await linkPayment(address, TIP_RECIPIENT, TIP_CERT_HASH, xlmToStroops(xlm));
  return { hash: res.hash ?? "" };
}
