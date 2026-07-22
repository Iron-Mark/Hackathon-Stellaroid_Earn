export type FundResult =
  | { ok: true; alreadyFunded: boolean }
  | {
      ok: false;
      reason: "already-funded" | "rate-limited" | "network" | "bad-address";
      message: string;
    };

const STELLAR_ADDRESS_RE = /^G[A-Z2-7]{55}$/;

export function friendbotUrl(address: string): string {
  return `https://friendbot.stellar.org/?addr=${encodeURIComponent(address)}`;
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
    if (text.includes("op_already_exists") || text.includes("already funded")) {
      return { ok: true, alreadyFunded: true };
    }
    return {
      ok: false,
      reason: "network",
      message: "Could not reach the testnet faucet. Try again in a moment.",
    };
  } catch {
    return {
      ok: false,
      reason: "network",
      message: "Could not reach the testnet faucet. Check your connection and retry.",
    };
  }
}
