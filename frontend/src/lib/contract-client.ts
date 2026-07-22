"use client";

import type * as StellarSdk from "@stellar/stellar-sdk";
import {
  appConfig,
  getExpectedNetworkPassphrase,
  hasRequiredConfig,
} from "@/lib/config";
import { DEFAULT_SAMPLE_PROOF_HASH } from "@/lib/demo-data";
import { signTransaction as signWithWallet } from "@/lib/wallet";
import {
  normalizeCertificateStatus,
  normalizeIssuerStatus,
} from "@/lib/contract-status";
import {
  opportunityIdToBigInt,
  type OpportunityIdInput,
} from "@/lib/opportunity-id";
import type {
  CertificateStatus,
  IssuerRecord,
} from "@/lib/types";

// The stellar-sdk browser build is a ~900 KB pre-bundled UMD that webpack
// cannot tree-shake. Loading it lazily keeps it out of every route's First
// Load JS; the chunk is fetched once, on the first contract read or wallet
// action, and cached for the rest of the session.
let sdkPromise: Promise<typeof StellarSdk> | null = null;
let loadedSdk: typeof StellarSdk | null = null;

function getSdk(): Promise<typeof StellarSdk> {
  sdkPromise ??= import("@stellar/stellar-sdk").then((mod) => {
    loadedSdk = mod;
    return mod;
  });
  return sdkPromise;
}

const FALLBACK_SIMULATION_SOURCE =
  "GBAKLRUJEOZGWKSHJFFWJ4DINXQZEJBT7JQTR5T4GATQU2SNO4ZFHZQ4";
const E2E_WALLET_ADDRESS =
  "GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D";
const E2E_CERTIFICATE_STORAGE_KEY = "stellaroid:e2e:certificates";
const e2eCertificates = new Map<string, Record<string, unknown>>();
let e2eStorageHydrated = false;
let nextE2EOpportunityId = 1;

function normalizeHashKey(certHashHex: string) {
  return certHashHex.trim().replace(/^0x/i, "").toLowerCase();
}

function getE2EStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function hydrateE2ECertificates() {
  if (e2eStorageHydrated) return;
  e2eStorageHydrated = true;

  const storage = getE2EStorage();
  const raw = storage?.getItem(E2E_CERTIFICATE_STORAGE_KEY);
  if (!raw) return;

  try {
    const entries = JSON.parse(raw) as Array<[string, Record<string, unknown>]>;
    if (!Array.isArray(entries)) return;

    for (const [key, value] of entries) {
      if (typeof key === "string" && value && typeof value === "object") {
        e2eCertificates.set(normalizeHashKey(key), value);
      }
    }
  } catch {
    storage?.removeItem(E2E_CERTIFICATE_STORAGE_KEY);
  }
}

function persistE2ECertificates() {
  const storage = getE2EStorage();
  if (!storage) return;

  try {
    storage.setItem(
      E2E_CERTIFICATE_STORAGE_KEY,
      JSON.stringify([...e2eCertificates.entries()]),
    );
  } catch {
    // E2E mode can still fall back to the in-memory map if storage is denied.
  }
}

function getE2ECertificate(certHashHex: string) {
  hydrateE2ECertificates();
  return e2eCertificates.get(normalizeHashKey(certHashHex));
}

function setE2ECertificate(
  certHashHex: string,
  record: Record<string, unknown>,
) {
  hydrateE2ECertificates();
  e2eCertificates.set(normalizeHashKey(certHashHex), record);
  persistE2ECertificates();
}

function buildE2ECertificate(
  owner: string,
  issuer: string,
  certHashHex: string,
  status: "Issued" | "Verified",
  metadata?: {
    title?: string;
    cohort?: string;
    metadataUri?: string;
  },
) {
  const current = getE2ECertificate(certHashHex);
  return {
    owner,
    issuer,
    title: metadata?.title ?? normalizeString(current?.title),
    cohort: metadata?.cohort ?? normalizeString(current?.cohort),
    metadata_uri: metadata?.metadataUri ?? normalizeString(current?.metadata_uri),
    status,
    issued_at: normalizeTimestamp(current?.issued_at) || 0,
    verified_at: status === "Verified" ? Date.now() : 0,
    expires_at: 0,
  };
}

function getServer(sdk: typeof StellarSdk) {
  return new sdk.rpc.Server(appConfig.rpcUrl, {
    allowHttp: appConfig.rpcUrl.startsWith("http://"),
  });
}

function ensureConfigured() {
  if (!hasRequiredConfig()) {
    throw new Error(
      "Missing contract configuration. Set NEXT_PUBLIC_SOROBAN_CONTRACT_ID in .env.local.",
    );
  }
}

function getReadAddress() {
  const configured = appConfig.readAddress?.trim();
  return configured || FALLBACK_SIMULATION_SOURCE;
}

type ContractArg =
  | { value: string; type: "address" | "string" }
  | { value: bigint | number; type: "i128" | "u32" | "u64" }
  | { value: Uint8Array; type: "bytes32" };

function hexToBytes32(hex: string): Uint8Array {
  const clean = hex.trim().replace(/^0x/i, "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(clean)) {
    throw new Error(
      "Certificate hash must be 64 hexadecimal characters (32 bytes).",
    );
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function buildArgs(
  sdk: typeof StellarSdk,
  values: ContractArg[],
): StellarSdk.xdr.ScVal[] {
  return values.map((entry) => {
    if (entry.type === "bytes32") {
      // Keep cert hash as ScVal bytes to match contract BytesN<32> params.
      return sdk.nativeToScVal(entry.value, { type: "bytes" });
    }
    return sdk.nativeToScVal(entry.value, { type: entry.type });
  });
}

type RawGetTransactionResult = {
  status?: string;
  errorResultXdr?: string;
};

type RawSendTransactionResult = {
  status?: string;
  hash?: string;
  errorResultXdr?: string;
};

function delayMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendTransactionRaw(transactionXdr: string) {
  const response = await fetch(appConfig.rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `send-${Date.now()}`,
      method: "sendTransaction",
      params: {
        transaction: transactionXdr,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`RPC sendTransaction failed with HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as {
    result?: RawSendTransactionResult;
    error?: { message?: string };
  };

  if (payload.error?.message) {
    throw new Error(payload.error.message);
  }

  if (!payload.result) {
    throw new Error("RPC sendTransaction returned no result.");
  }

  return payload.result;
}

async function pollTransactionRaw(
  hash: string,
  attempts = 20,
  intervalMs = 1200,
) {
  for (let i = 0; i < attempts; i++) {
    const response = await fetch(appConfig.rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: `tx-${hash}-${i}`,
        method: "getTransaction",
        params: { hash },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `RPC getTransaction failed with HTTP ${response.status}.`,
      );
    }

    const payload = (await response.json()) as {
      result?: RawGetTransactionResult;
      error?: { message?: string };
    };

    if (payload.error?.message) {
      throw new Error(payload.error.message);
    }

    const status = payload.result?.status;
    if (status === "SUCCESS" || status === "FAILED") {
      if (!payload.result) {
        throw new Error(
          "RPC getTransaction returned a terminal status without payload.",
        );
      }
      return payload.result;
    }

    if (status !== "NOT_FOUND" && status) {
      throw new Error(`Unexpected getTransaction status: ${status}`);
    }

    await delayMs(intervalMs);
  }

  return { status: "NOT_FOUND" } as RawGetTransactionResult;
}

async function buildTransaction(
  sdk: typeof StellarSdk,
  sourceAddress: string,
  method: string,
  args: StellarSdk.xdr.ScVal[],
) {
  const server = getServer(sdk);
  const sourceAccount = await server.getAccount(sourceAddress);

  return new sdk.TransactionBuilder(sourceAccount, {
    fee: sdk.BASE_FEE,
    networkPassphrase: getExpectedNetworkPassphrase(),
  })
    .addOperation(
      sdk.Operation.invokeContractFunction({
        contract: appConfig.contractId,
        function: method,
        args,
      }),
    )
    .setTimeout(30)
    .build();
}

function buildSimulationTransaction(
  sdk: typeof StellarSdk,
  sourceAddress: string,
  method: string,
  args: StellarSdk.xdr.ScVal[],
) {
  const simulationSource = sourceAddress.trim() || FALLBACK_SIMULATION_SOURCE;
  const sourceAccount = new sdk.Account(simulationSource, "0");

  return new sdk.TransactionBuilder(sourceAccount, {
    fee: sdk.BASE_FEE,
    networkPassphrase: getExpectedNetworkPassphrase(),
  })
    .addOperation(
      sdk.Operation.invokeContractFunction({
        contract: appConfig.contractId,
        function: method,
        args,
      }),
    )
    .setTimeout(30)
    .build();
}

async function prepareTransactionWithFallback(
  sdk: typeof StellarSdk,
  transaction: Awaited<ReturnType<typeof buildTransaction>>,
) {
  const server = getServer(sdk);

  try {
    return await server.prepareTransaction(transaction);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (!/Bad union switch/i.test(message)) {
      throw e;
    }

    // SDK parsers can fail on newer RPC XDR union arms. Use raw simulation and
    // assemble the minimal transaction fields required for submission.
    const rawSimulation = await server._simulateTransaction(transaction);
    if (rawSimulation.error) {
      throw new Error(normalizeError(rawSimulation.error));
    }
    if (!rawSimulation.transactionData || !rawSimulation.minResourceFee) {
      throw new Error("Simulation did not return Soroban transaction data.");
    }

    const classicFee = parseInt(transaction.fee, 10) || 0;
    const minResourceFee = parseInt(rawSimulation.minResourceFee, 10) || 0;
    const builder = sdk.TransactionBuilder.cloneFrom(transaction, {
      fee: String(classicFee + minResourceFee),
      sorobanData: new sdk.SorobanDataBuilder(
        rawSimulation.transactionData,
      ).build(),
      networkPassphrase: transaction.networkPassphrase,
    });

    const invokeOp = transaction.operations[0];
    const existingAuth =
      invokeOp.type === "invokeHostFunction" && invokeOp.auth
        ? invokeOp.auth
        : [];
    const rawAuth = rawSimulation.results?.[0]?.auth ?? [];

    if (
      invokeOp.type === "invokeHostFunction" &&
      existingAuth.length === 0 &&
      rawAuth.length > 0
    ) {
      builder.clearOperations();
      builder.addOperation(
        sdk.Operation.invokeHostFunction({
          source: invokeOp.source,
          func: invokeOp.func,
          auth: rawAuth.map((entry) =>
            sdk.xdr.SorobanAuthorizationEntry.fromXDR(entry, "base64"),
          ),
        }),
      );
    }

    return builder.build();
  }
}

async function simulateRead<T>(
  sourceAddress: string,
  method: string,
  argDefs: ContractArg[],
  transform: (value: unknown) => T,
) {
  ensureConfigured();
  const sdk = await getSdk();
  const args = buildArgs(sdk, argDefs);
  const server = getServer(sdk);
  const transaction = buildSimulationTransaction(sdk, sourceAddress, method, args);
  let simulation: Awaited<
    ReturnType<StellarSdk.rpc.Server["simulateTransaction"]>
  >;

  try {
    simulation = await server.simulateTransaction(transaction);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (!/Bad union switch/i.test(message)) {
      throw e;
    }

    const rawSimulation = await server._simulateTransaction(transaction);
    if (rawSimulation.error) {
      throw new Error(normalizeError(rawSimulation.error));
    }

    const rawResultXdr = rawSimulation.results?.[0]?.xdr;
    if (!rawResultXdr) {
      throw new Error(`Simulation for ${method} returned no value.`);
    }

    const rawScVal = sdk.xdr.ScVal.fromXDR(rawResultXdr, "base64");
    return transform(sdk.scValToNative(rawScVal));
  }

  if (sdk.rpc.Api.isSimulationError(simulation)) {
    throw new Error(normalizeError(simulation.error));
  }

  if (!simulation.result?.retval) {
    throw new Error(`Simulation for ${method} returned no value.`);
  }

  return transform(sdk.scValToNative(simulation.result.retval));
}

async function signAndSubmit<T>(
  sourceAddress: string,
  method: string,
  argDefs: ContractArg[],
  transformReturn?: (value: unknown) => T,
) {
  if (appConfig.e2eMode) {
    return {
      hash: `e2e-${method}-${sourceAddress.slice(0, 6)}`,
      result: undefined,
    };
  }

  ensureConfigured();
  const sdk = await getSdk();
  const args = buildArgs(sdk, argDefs);
  const server = getServer(sdk);

  const transaction = await buildTransaction(sdk, sourceAddress, method, args);
  const preparedTransaction = await prepareTransactionWithFallback(
    sdk,
    transaction,
  );

  const signedXdr = await signWithWallet(
    preparedTransaction.toXDR(),
    sourceAddress,
  );

  const signedTransaction = sdk.TransactionBuilder.fromXDR(
    signedXdr,
    getExpectedNetworkPassphrase(),
  );

  let sendHash: string;

  try {
    const sendResponse = await server.sendTransaction(signedTransaction);
    if (
      sendResponse.status !== "PENDING" &&
      sendResponse.status !== "DUPLICATE"
    ) {
      throw new Error(
        normalizeError(sendResponse.errorResult ?? sendResponse.status),
      );
    }
    sendHash = sendResponse.hash;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (!/Bad union switch/i.test(message)) {
      throw e;
    }

    // SDK parser can also fail in sendTransaction when decoding errorResultXdr.
    const rawSend = await sendTransactionRaw(signedTransaction.toXDR());

    if (!rawSend.hash) {
      throw new Error("Transaction submission did not return a hash.");
    }

    const status = rawSend.status ?? "";
    if (status !== "PENDING" && status !== "DUPLICATE") {
      throw new Error(normalizeError(rawSend.errorResultXdr ?? status));
    }

    sendHash = rawSend.hash;
  }

  let finalResponse:
    | Awaited<ReturnType<StellarSdk.rpc.Server["pollTransaction"]>>
    | undefined;

  try {
    finalResponse = await server.pollTransaction(sendHash, {
      attempts: 20,
      sleepStrategy: () => 1200,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (!/Bad union switch/i.test(message)) {
      throw e;
    }

    // SDK XDR parser can fail when RPC returns newer union arms.
    // Fall back to raw JSON-RPC polling using status-only semantics.
    const rawResult = await pollTransactionRaw(sendHash, 20, 1200);
    if (rawResult.status === "NOT_FOUND") {
      throw new Error("Transaction submitted but not found on the RPC server.");
    }
    if (rawResult.status === "FAILED") {
      throw new Error(
        normalizeError(rawResult.errorResultXdr ?? "Transaction failed."),
      );
    }

    return {
      hash: sendHash,
      result: undefined,
    };
  }

  if (finalResponse.status === sdk.rpc.Api.GetTransactionStatus.NOT_FOUND) {
    throw new Error("Transaction submitted but not found on the RPC server.");
  }

  if (finalResponse.status === sdk.rpc.Api.GetTransactionStatus.FAILED) {
    throw new Error(normalizeError(finalResponse.resultXdr));
  }

  return {
    hash: sendHash,
    result:
      transformReturn && finalResponse.returnValue
        ? transformReturn(sdk.scValToNative(finalResponse.returnValue))
        : undefined,
  };
}

function normalizeAddress(value: unknown): string {
  if (typeof value === "string") return value;
  // Only meaningful once the SDK chunk has loaded; the generic toString
  // fallback below handles Address instances either way.
  if (loadedSdk && value instanceof loadedSdk.Address) return value.toString();
  if (value && typeof value === "object" && "toString" in value)
    return value.toString();
  throw new Error("Unable to parse Stellar address returned by the contract.");
}

function normalizeBigInt(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.trunc(value));
  if (typeof value === "string") return BigInt(value);
  throw new Error("Unable to parse integer value returned by the contract.");
}

// Status normalizers are shared with the server read path; see
// @/lib/contract-status. The old private copy here mis-handled the ["Variant"]
// array wire shape (Object.keys(["Verified"]) === ["0"] → "issued").

function normalizeTimestamp(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return 0;
}

function normalizeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toString" in value) {
    return value.toString();
  }
  return "";
}

// Maps Stellaroid Earn contracterror discriminants (1..6) to human copy.
// Never expose raw ScVal / HostError strings to the UI.
function normalizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/#1\b|AlreadyInitialized/i.test(message))
    return "Contract is already initialized.";
  if (/#2\b|NotInitialized/i.test(message))
    return "Contract has not been initialized yet. Run init first.";
  if (/#3\b|Unauthorized/i.test(message))
    return "This wallet is not authorized to perform that action.";
  if (/#4\b|AlreadyExists/i.test(message))
    return "A certificate with that hash is already registered.";
  if (/#5\b|NotFound/i.test(message))
    return "No certificate found for that hash.";
  if (/#6\b|InvalidAmount/i.test(message))
    return "Amount must be greater than zero.";
  if (/#7\b|IssuerNotFound/i.test(message))
    return "No issuer registry record exists for that wallet.";
  if (/#8\b|IssuerNotApproved/i.test(message))
    return "Issuer is not approved yet.";
  if (/#9\b|IssuerSuspended/i.test(message))
    return "Issuer has been suspended.";
  if (/#10\b|InvalidStatus/i.test(message))
    return "This action is not allowed in the credential's current status.";
  if (/#11\b|CredentialRevoked/i.test(message))
    return "This credential has been revoked.";
  if (/#12\b|CredentialExpired/i.test(message))
    return "This credential has expired.";
  if (/#13\b|OpportunityNotFound/i.test(message))
    return "No opportunity found for that ID.";
  if (/#14\b|AlreadyFunded/i.test(message))
    return "This opportunity has already been funded.";
  if (/#15\b|InvalidMilestone/i.test(message))
    return "Invalid milestone action for the current state.";
  if (/#16\b|InvalidOpportunityStatus/i.test(message))
    return "This action is not allowed in the opportunity's current status.";
  if (/#17\b|PaymentLocked/i.test(message))
    return "Payment is locked in escrow.";
  return message;
}

// --- Stellaroid Earn contract API ---

export type CertificateRecord = {
  owner: string;
  issuer: string;
  title: string;
  cohort: string;
  metadataUri: string;
  status: CertificateStatus;
  issuedAt: number;
  verifiedAt: number;
  expiresAt: number;
  verified: boolean;
};

function normalizeIssuer(value: unknown): IssuerRecord | null {
  if (value == null) return null;
  const record = value as Record<string, unknown>;
  return {
    address: normalizeAddress(record.address),
    name: normalizeString(record.name),
    website: normalizeString(record.website),
    category: normalizeString(record.category),
    status: normalizeIssuerStatus(record.status),
  };
}

function normalizeCertificate(value: unknown): CertificateRecord | null {
  if (value == null) return null;
  const record = value as Record<string, unknown>;
  const status = normalizeCertificateStatus(record.status);
  return {
    owner: normalizeAddress(record.owner),
    issuer: normalizeAddress(record.issuer),
    title: normalizeString(record.title),
    cohort: normalizeString(record.cohort),
    metadataUri: normalizeString(record.metadata_uri),
    status,
    issuedAt: normalizeTimestamp(record.issued_at),
    verifiedAt: normalizeTimestamp(record.verified_at),
    expiresAt: normalizeTimestamp(record.expires_at),
    verified: status === "verified",
  };
}

// NOTE: the client-side opportunity read path (getOpportunity +
// normalizeOpportunity) was deleted 2026-07-21: it had no callers, and its
// normalizeString coercion carried the exact cert_hash byte-mangling bug fixed
// in contract-read-server's normalizeHashHex. Server reads own this shape now.

export async function registerIssuer(
  issuer: string,
  name: string,
  website: string,
  category: string,
) {
  return signAndSubmit(
    issuer,
    "register_issuer",
    [
      { value: issuer, type: "address" },
      { value: name, type: "string" },
      { value: website, type: "string" },
      { value: category, type: "string" },
    ],
  );
}

export async function approveIssuer(admin: string, issuer: string) {
  return signAndSubmit(
    admin,
    "approve_issuer",
    [
      { value: admin, type: "address" },
      { value: issuer, type: "address" },
    ],
  );
}

export async function suspendIssuer(admin: string, issuer: string) {
  return signAndSubmit(
    admin,
    "suspend_issuer",
    [
      { value: admin, type: "address" },
      { value: issuer, type: "address" },
    ],
  );
}

export async function getIssuer(issuer: string) {
  if (appConfig.e2eMode) {
    return {
      address: issuer,
      name: "Stellaroid Academy",
      website: "https://stellaroid.tech",
      category: "bootcamp",
      status: "approved" as const,
    };
  }

  return simulateRead(
    getReadAddress(),
    "get_issuer",
    [{ value: issuer, type: "address" }],
    normalizeIssuer,
  );
}

export async function registerCertificate(
  issuer: string,
  student: string,
  certHashHex: string,
  metadata?: {
    title?: string;
    cohort?: string;
    metadataUri?: string;
  },
) {
  if (appConfig.e2eMode) {
    setE2ECertificate(
      certHashHex,
      buildE2ECertificate(student, issuer, certHashHex, "Issued", metadata),
    );
    return {
      hash: `e2e-register-${issuer.slice(0, 6)}`,
      result: undefined,
    };
  }

  return signAndSubmit(
    issuer,
    "register_certificate",
    [
      { value: issuer, type: "address" },
      { value: student, type: "address" },
      { value: hexToBytes32(certHashHex), type: "bytes32" },
      { value: metadata?.title ?? "", type: "string" },
      { value: metadata?.cohort ?? "", type: "string" },
      { value: metadata?.metadataUri ?? "", type: "string" },
    ],
  );
}

export async function verifyCertificate(caller: string, certHashHex: string) {
  if (appConfig.e2eMode) {
    const key = normalizeHashKey(certHashHex);
    const current = getE2ECertificate(key);
    setE2ECertificate(
      key,
      buildE2ECertificate(
        normalizeString(current?.owner) || E2E_WALLET_ADDRESS,
        caller,
        certHashHex,
        "Verified",
        {
          title: normalizeString(current?.title),
          cohort: normalizeString(current?.cohort),
          metadataUri: normalizeString(current?.metadata_uri),
        },
      ),
    );
    return {
      hash: `e2e-verify-${caller.slice(0, 6)}`,
      result: undefined,
    };
  }

  return signAndSubmit(
    caller,
    "verify_certificate",
    [
      { value: caller, type: "address" },
      { value: hexToBytes32(certHashHex), type: "bytes32" },
    ],
  );
}

export async function getCertificate(certHashHex: string) {
  if (appConfig.e2eMode) {
    return normalizeCertificate(getE2ECertificate(certHashHex) ?? null);
  }

  return simulateRead(
    getReadAddress(),
    "get_certificate",
    [{ value: hexToBytes32(certHashHex), type: "bytes32" }],
    normalizeCertificate,
  );
}

export async function revokeCertificate(actor: string, certHashHex: string) {
  return signAndSubmit(
    actor,
    "revoke_certificate",
    [
      { value: actor, type: "address" },
      { value: hexToBytes32(certHashHex), type: "bytes32" },
    ],
  );
}

export async function suspendCertificate(actor: string, certHashHex: string) {
  return signAndSubmit(
    actor,
    "suspend_certificate",
    [
      { value: actor, type: "address" },
      { value: hexToBytes32(certHashHex), type: "bytes32" },
    ],
  );
}

export async function rewardStudent(
  admin: string,
  student: string,
  certHashHex: string,
  amount: bigint,
) {
  return signAndSubmit(
    admin,
    "reward_student",
    [
      { value: student, type: "address" },
      { value: hexToBytes32(certHashHex), type: "bytes32" },
      { value: amount, type: "i128" },
    ],
  );
}

export async function linkPayment(
  employer: string,
  student: string,
  certHashHex: string,
  amount: bigint,
) {
  return signAndSubmit(
    employer,
    "link_payment",
    [
      { value: employer, type: "address" },
      { value: student, type: "address" },
      { value: hexToBytes32(certHashHex), type: "bytes32" },
      { value: amount, type: "i128" },
    ],
  );
}

export async function createOpportunity(
  employer: string,
  candidate: string,
  certHashHex: string,
  title: string,
  amount: bigint,
  milestoneCount: number,
) {
  if (appConfig.e2eMode) {
    const id = String(nextE2EOpportunityId);
    nextE2EOpportunityId += 1;
    return {
      hash: `e2e-create_opportunity-${employer.slice(0, 6)}`,
      result: id,
    };
  }

  return signAndSubmit(
    employer,
    "create_opportunity",
    [
      { value: employer, type: "address" },
      { value: candidate, type: "address" },
      { value: hexToBytes32(certHashHex), type: "bytes32" },
      { value: title, type: "string" },
      { value: amount, type: "i128" },
      { value: milestoneCount, type: "u32" },
    ],
    (v) => normalizeBigInt(v).toString(),
  );
}

export async function fundOpportunity(employer: string, oppId: OpportunityIdInput) {
  return signAndSubmit(
    employer,
    "fund_opportunity",
    [
      { value: employer, type: "address" },
      { value: opportunityIdToBigInt(oppId), type: "u64" },
    ],
  );
}

export async function submitMilestone(candidate: string, oppId: OpportunityIdInput) {
  return signAndSubmit(
    candidate,
    "submit_milestone",
    [
      { value: candidate, type: "address" },
      { value: opportunityIdToBigInt(oppId), type: "u64" },
    ],
  );
}

export async function approveMilestone(employer: string, oppId: OpportunityIdInput) {
  return signAndSubmit(
    employer,
    "approve_milestone",
    [
      { value: employer, type: "address" },
      { value: opportunityIdToBigInt(oppId), type: "u64" },
    ],
  );
}

export async function releasePayment(employer: string, oppId: OpportunityIdInput) {
  return signAndSubmit(
    employer,
    "release_payment",
    [
      { value: employer, type: "address" },
      { value: opportunityIdToBigInt(oppId), type: "u64" },
    ],
  );
}

export async function refundOpportunity(employer: string, oppId: OpportunityIdInput) {
  return signAndSubmit(
    employer,
    "refund_opportunity",
    [
      { value: employer, type: "address" },
      { value: opportunityIdToBigInt(oppId), type: "u64" },
    ],
  );
}

export const E2E_SAMPLE_PROOF_HASH = DEFAULT_SAMPLE_PROOF_HASH;

export { normalizeAddress, normalizeBigInt };
