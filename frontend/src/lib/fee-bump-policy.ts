import { timingSafeEqual } from "node:crypto";

export type FeeBumpShapeInput = {
  signedXdr: unknown;
  authorization: string | null;
  expectedToken: string;
  maxXdrLength: number;
};

export type FeeBumpShapeResult =
  | { ok: true; signedXdr: string }
  | { ok: false; status: number; error: string };

// Constant-time equality so the bearer token (which gates the fund-signing key)
// cannot be recovered byte-by-byte through response-timing analysis.
function safeStringEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export function validateFeeBumpRequestShape({
  signedXdr,
  authorization,
  expectedToken,
  maxXdrLength,
}: FeeBumpShapeInput): FeeBumpShapeResult {
  if (
    !expectedToken ||
    authorization === null ||
    !safeStringEqual(authorization, `Bearer ${expectedToken}`)
  ) {
    return {
      ok: false,
      status: 401,
      error: "Fee sponsorship requires server authorization.",
    };
  }
  if (typeof signedXdr !== "string" || !signedXdr) {
    return { ok: false, status: 400, error: "Missing signedXdr field." };
  }
  if (signedXdr.length > maxXdrLength) {
    return { ok: false, status: 413, error: "Signed transaction is too large." };
  }
  return { ok: true, signedXdr };
}

