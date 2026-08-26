export function parseAmountToInt(amount: string, decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new Error("Invalid asset decimal configuration.");
  }
  const trimmed = amount.trim();
  const match = /^(\d+)(?:\.(\d+))?$/.exec(trimmed);
  if (!match) {
    throw new Error("Enter a valid unsigned decimal amount.");
  }
  const [, wholePart, fractionPart = ""] = match;
  if (fractionPart.length > decimals) {
    throw new Error(`Use at most ${decimals} decimal places for this asset.`);
  }
  const whole = BigInt(wholePart || "0");
  const paddedFraction = fractionPart.padEnd(decimals, "0");
  const fraction = paddedFraction ? BigInt(paddedFraction) : 0n;
  const result = whole * 10n ** BigInt(decimals) + fraction;
  if (result <= 0n) throw new Error("Amount must be greater than zero.");
  return result;
}

export function isValidDecimalAmount(amount: string, decimals: number): boolean {
  try {
    parseAmountToInt(amount, decimals);
    return true;
  } catch {
    return false;
  }
}

export function formatAmount(value: bigint, decimals: number): string {
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = value % base;
  if (fraction === 0n) return whole.toString();
  const trimmed = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole}.${trimmed}`;
}

export function shortenAddress(address: string | null, size = 6): string {
  if (!address) return "Not connected";
  return `${address.slice(0, size)}...${address.slice(-size)}`;
}

export function formatUnixDate(unixSeconds: number, emptyLabel = "Not set"): string {
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) return emptyLabel;
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) return emptyLabel;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/** Convert a YYYY-MM-DD date input to a UTC end-of-day unix timestamp, or 0. */
export function dateInputToUnixSeconds(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return 0;
  const millis = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    23,
    59,
    59,
  );
  if (Number.isNaN(millis)) return 0;
  return Math.floor(millis / 1000);
}

export function unixSecondsToDateInput(unixSeconds: number): string {
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) return "";
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}
