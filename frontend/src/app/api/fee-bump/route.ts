import { NextResponse } from "next/server";
import {
  Keypair,
  StrKey,
  Transaction,
  TransactionBuilder,
  Networks,
} from "@stellar/stellar-sdk";
import { appConfig } from "@/lib/config";
import { validateFeeBumpRequestShape } from "@/lib/fee-bump-policy";
import {
  checkRateLimit,
  getClientId,
  tryConsumeBudget,
} from "@/lib/rate-limit";

const SPONSOR_SECRET = process.env.FEE_SPONSOR_SECRET ?? "";
const SPONSOR_TOKEN = process.env.FEE_SPONSOR_TOKEN ?? "";
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? Networks.TESTNET;
const MAX_XDR_LENGTH = 32_000;
const MAX_INNER_FEE = 1_000_000;

// Abuse limits so a leaked/shared bearer token cannot script an unbounded
// sponsor-account drain. Both are per-warm-instance guards (see rate-limit.ts)
// and can be overridden via env; the hard global cap is the Vercel edge
// rate-limit rule on /api/fee-bump (30 requests per 60s per IP, POST).
const RATE_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = clampEnvInt(
  process.env.FEE_SPONSOR_MAX_REQUESTS_PER_MIN,
  30,
);
// Rolling stroop budget across all callers. Default 20 XLM/min ceiling — with
// MAX_INNER_FEE = 0.1 XLM that is ~200 sponsored fee-bumps per minute.
const MAX_STROOPS_PER_WINDOW = clampEnvInt(
  process.env.FEE_SPONSOR_MAX_STROOPS_PER_MIN,
  200_000_000,
);

function clampEnvInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function tooManyRequests(retryAfterSec: number) {
  return NextResponse.json(
    { error: "Fee sponsorship rate limit exceeded. Retry shortly." },
    { status: 429, headers: { "Retry-After": String(Math.max(1, retryAfterSec)) } },
  );
}
const ALLOWED_METHODS = new Set([
  "register_issuer",
  "register_certificate",
  "verify_certificate",
  "revoke_certificate",
  "suspend_certificate",
  "reward_student",
  "link_payment",
  "create_opportunity",
  "fund_opportunity",
  "submit_milestone",
  "approve_milestone",
  "release_payment",
  "refund_opportunity",
  "refresh_issuer",
  "set_credential_expiry",
  "renew_certificate",
]);

function validateInnerTransaction(innerTx: Transaction, sponsorPublicKey: string) {
  if (innerTx.networkPassphrase !== NETWORK_PASSPHRASE) {
    throw new Error("Signed transaction uses the wrong network.");
  }
  if (innerTx.source === sponsorPublicKey) {
    throw new Error("Sponsor cannot sponsor its own source account.");
  }
  if (innerTx.operations.length !== 1) {
    throw new Error("Fee sponsorship only supports one operation.");
  }
  if (Number(innerTx.fee) > MAX_INNER_FEE) {
    throw new Error("Signed transaction fee is above the sponsorship ceiling.");
  }
  if (!innerTx.signatures.length) {
    throw new Error("Signed transaction has no user signature.");
  }

  const op = innerTx.operations[0];
  if (op.type !== "invokeHostFunction") {
    throw new Error("Fee sponsorship only supports Soroban contract invocations.");
  }

  const hostFunction = op.func;
  if (hostFunction.switch().name !== "hostFunctionTypeInvokeContract") {
    throw new Error("Fee sponsorship only supports contract function calls.");
  }
  const invokeArgs = hostFunction.value() as unknown as {
    _attributes?: {
      contractAddress?: {
        contractId?: () => Buffer;
      };
      functionName?: string;
    };
  };
  const attrs = invokeArgs._attributes ?? {};
  const configuredContract = appConfig.contractId
    ? Buffer.from(StrKey.decodeContract(appConfig.contractId)).toString("hex")
    : "";
  const txContract = attrs.contractAddress?.contractId
    ? Buffer.from(attrs.contractAddress.contractId()).toString("hex")
    : "";
  if (!configuredContract || txContract !== configuredContract) {
    throw new Error("Signed transaction does not target the configured contract.");
  }
  if (!attrs.functionName || !ALLOWED_METHODS.has(attrs.functionName)) {
    throw new Error("Contract method is not eligible for fee sponsorship.");
  }
}

export async function POST(request: Request) {
  if (!SPONSOR_SECRET || !SPONSOR_TOKEN) {
    return NextResponse.json(
      { error: "Fee sponsorship is not configured on this server." },
      { status: 503 },
    );
  }

  // Cheap per-IP flood control before any parsing or signing work.
  const clientId = getClientId(request.headers);
  const rate = checkRateLimit(
    "fee-bump",
    clientId,
    MAX_REQUESTS_PER_WINDOW,
    RATE_WINDOW_MS,
  );
  if (!rate.ok) {
    return tooManyRequests(rate.retryAfterSec);
  }

  let body: { signedXdr?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const shape = validateFeeBumpRequestShape({
    signedXdr: body.signedXdr,
    authorization: request.headers.get("authorization"),
    expectedToken: SPONSOR_TOKEN,
    maxXdrLength: MAX_XDR_LENGTH,
  });
  if (!shape.ok) {
    return NextResponse.json({ error: shape.error }, { status: shape.status });
  }

  try {
    const sponsorKeypair = Keypair.fromSecret(SPONSOR_SECRET);
    const sponsorPublicKey = sponsorKeypair.publicKey();
    const innerTx = TransactionBuilder.fromXDR(
      shape.signedXdr,
      NETWORK_PASSPHRASE,
    ) as Transaction;
    validateInnerTransaction(innerTx, sponsorPublicKey);

    // Only debit the rolling budget once the request is proven sponsorable, so
    // a valid caller cannot drain the sponsor account faster than the cap.
    if (
      !tryConsumeBudget(
        "fee-bump",
        MAX_INNER_FEE,
        MAX_STROOPS_PER_WINDOW,
        RATE_WINDOW_MS,
      )
    ) {
      return tooManyRequests(Math.ceil(RATE_WINDOW_MS / 1000));
    }

    const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
      sponsorKeypair,
      String(MAX_INNER_FEE),
      innerTx,
      NETWORK_PASSPHRASE,
    );

    feeBumpTx.sign(sponsorKeypair);

    return NextResponse.json({ feeBumpXdr: feeBumpTx.toXDR() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fee bump failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
