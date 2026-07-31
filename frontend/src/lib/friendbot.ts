export type FundResult =
  | { ok: true; alreadyFunded: boolean }
  | {
      ok: false;
      // "faucet-error" and "network" are deliberately separate: the first means
      // the faucet answered and refused, the second means we never got an
      // answer at all. Collapsing them sends the user after the wrong problem.
      // There is no "already-funded" failure reason, because an account that
      // already exists is a success ({ ok: true, alreadyFunded: true }).
      reason: "rate-limited" | "faucet-error" | "network" | "bad-address";
      message: string;
    };

const STELLAR_ADDRESS_RE = /^G[A-Z2-7]{55}$/;

export function friendbotUrl(address: string): string {
  return `https://friendbot.stellar.org/?addr=${encodeURIComponent(address)}`;
}

// Friendbot reports "this account already exists" in the Horizon error body
// rather than through a dedicated status code. Read the parsed result_codes
// first so an incidental mention of the string elsewhere in the payload cannot
// be mistaken for the real signal, and keep the textual scan as the fallback
// for the times friendbot answers with a bare non-JSON body.
export function isAlreadyFundedBody(body: string): boolean {
  try {
    const parsed = JSON.parse(body) as {
      extras?: { result_codes?: { operations?: unknown[]; transaction?: unknown } };
    };
    const codes = parsed?.extras?.result_codes;
    if (codes) {
      const operations = Array.isArray(codes.operations) ? codes.operations.map(String) : [];
      return (
        operations.includes("op_already_exists") ||
        String(codes.transaction) === "op_already_exists"
      );
    }
  } catch {
    // Body is not JSON. Fall through to the textual check.
  }
  return body.includes("op_already_exists") || body.includes("already funded");
}

export async function fundTestnetAccount(
  address: string,
  fetchImpl: typeof fetch = fetch,
): Promise<FundResult> {
  if (!STELLAR_ADDRESS_RE.test(address)) {
    return { ok: false, reason: "bad-address", message: "Invalid testnet address." };
  }
  try {
    const res = await fetchImpl(friendbotUrl(address));
    if (res.status === 200) return { ok: true, alreadyFunded: false };
    if (res.status === 429) {
      return {
        ok: false,
        reason: "rate-limited",
        message: "Friendbot is busy right now. Wait a moment and try again.",
      };
    }
    const text = await res.text().catch(() => "");
    if (isAlreadyFundedBody(text)) {
      return { ok: true, alreadyFunded: true };
    }
    return {
      ok: false,
      reason: "faucet-error",
      message: "The testnet faucet could not fund this account. Try again in a moment.",
    };
  } catch {
    return {
      ok: false,
      reason: "network",
      message: "Could not reach the testnet faucet. Check your connection and retry.",
    };
  }
}
