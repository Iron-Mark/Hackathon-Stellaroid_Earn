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
// The feedback Form's "Stellar Wallet Address" field id, so the success screen
// pre-fills the connected wallet into the Form (from the Form's prefill link).
const WALLET_ENTRY_ID = "entry.654213072";

export function xlmToStroops(xlm: number): bigint {
  if (!Number.isFinite(xlm) || xlm < 0) {
    throw new Error("Tip amount must be a non-negative finite number.");
  }
  // Go through the decimal string instead of multiplying by 1e7. The float
  // multiply is only exact while xlm * 1e7 stays inside 2^53, so it drifts
  // silently for large amounts, and Math.round past that point is meaningless.
  // Padding the fraction to Stellar's 7 decimal places keeps every input the
  // chips can produce exact, and toFixed does the one rounding to the nearest
  // stroop instead of rounding twice. Note the input is still a double, so an
  // amount above ~9e8 XLM cannot carry 7 decimals in the first place; this
  // fixes the conversion, not the caller's choice of number.
  const [whole, fraction = ""] = xlm.toFixed(7).split(".");
  return BigInt(whole) * 10_000_000n + BigInt(fraction.padEnd(7, "0"));
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
