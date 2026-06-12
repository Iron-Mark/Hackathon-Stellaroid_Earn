"use client";

import {
  Account,
  Address,
  BASE_FEE,
  Operation,
  SorobanDataBuilder,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import {
  appConfig,
  getExpectedNetworkPassphrase,
  hasRequiredConfig,
} from "@/lib/config";
import { DEFAULT_SAMPLE_PROOF_HASH } from "@/lib/demo-data";
import { signWithFreighter } from "@/lib/freighter";
import {
  opportunityIdToBigInt,
  type OpportunityIdInput,
} from "@/lib/opportunity-id";
import type {
  CertificateStatus,
  IssuerRecord,
  IssuerStatus,
  OpportunityRecord,
  OpportunityStatus,
} from "@/lib/types";
import { MAX_OPPORTUNITY_MILESTONES as MAX_MILESTONES } from "@/lib/types";

const FALLBACK_SIMULATION_SOURCE =
  "GBAKLRUJEOZGWKSHJFFWJ4DINXQZEJBT7JQTR5T4GATQU2SNO4ZFHZQ4";
const E2E_WALLET_ADDRESS =
  "GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D";
const e2eCertificates = new Map<string, Record<string, unknown>>();

function normalizeHashKey(certHashHex: string) {
  return certHashHex.trim().replace(/^0x/i, "").toLowerCase();
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
  const current = e2eCertificates.get(normalizeHashKey(certHashHex));
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

function getServer() {
  return new rpc.Server(appConfig.rpcUrl, {
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

function buildArgs(values: ContractArg[]): xdr.ScVal[] {
  return values.map((entry) => {
    if (entry.type === "bytes32") {
      // Keep cert hash as ScVal bytes to match contract BytesN<32> params.
      return nativeToScVal(entry.value, { type: "bytes" });
    }
    return nativeToScVal(entry.value, { type: entry.type });
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
  sourceAddress: string,
  method: string,
  args: xdr.ScVal[],
) {
  const server = getServer();
  const sourceAccount = await server.getAccount(sourceAddress);

  return new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: getExpectedNetworkPassphrase(),
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: appConfig.contractId,
        function: method,
        args,
      }),
    )
    .setTimeout(30)
    .build();
}

function buildSimulationTransaction(
  sourceAddress: string,
  method: string,
  args: xdr.ScVal[],
) {
  const simulationSource = sourceAddress.trim() || FALLBACK_SIMULATION_SOURCE;
  const sourceAccount = new Account(simulationSource, "0");

  return new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: getExpectedNetworkPassphrase(),
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: appConfig.contractId,
        function: method,
        args,
      }),
    )
    .setTimeout(30)
    .build();
}

async function prepareTransactionWithFallback(
  transaction: Awaited<ReturnType<typeof buildTransaction>>,
) {
  const server = getServer();

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
    const builder = TransactionBuilder.cloneFrom(transaction, {
      fee: String(classicFee + minResourceFee),
      sorobanData: new SorobanDataBuilder(
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
        Operation.invokeHostFunction({
          source: invokeOp.source,
          func: invokeOp.func,
          auth: rawAuth.map((entry) =>
            xdr.SorobanAuthorizationEntry.fromXDR(entry, "base64"),
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
  args: xdr.ScVal[],
  transform: (value: unknown) => T,
) {
  ensureConfigured();
  const server = getServer();
  const transaction = buildSimulationTransaction(sourceAddress, method, args);
  let simulation: Awaited<ReturnType<rpc.Server["simulateTransaction"]>>;

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

    const rawScVal = xdr.ScVal.fromXDR(rawResultXdr, "base64");
    return transform(scValToNative(rawScVal));
  }

  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(normalizeError(simulation.error));
  }

  if (!simulation.result?.retval) {
    throw new Error(`Simulation for ${method} returned no value.`);
  }

  return transform(scValToNative(simulation.result.retval));
}

async function signAndSubmit<T>(
  sourceAddress: string,
  method: string,
  args: xdr.ScVal[],
  transformReturn?: (value: unknown) => T,
) {
  if (appConfig.e2eMode) {
    return {
      hash: `e2e-${method}-${sourceAddress.slice(0, 6)}`,
      result: undefined,
    };
  }

  ensureConfigured();
  const server = getServer();
  const transaction = await buildTransaction(sourceAddress, method, args);
  const preparedTransaction = await prepareTransactionWithFallback(
    transaction,
  );

  const signedXdr = await signWithFreighter(
    preparedTransaction.toXDR(),
    sourceAddress,
  );

  const signedTransaction = TransactionBuilder.fromXDR(
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
    | Awaited<ReturnType<rpc.Server["pollTransaction"]>>
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

  if (finalResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    throw new Error("Transaction submitted but not found on the RPC server.");
  }

  if (finalResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
    throw new Error(normalizeError(finalResponse.resultXdr));
  }

  return {
    hash: sendHash,
    result:
      transformReturn && finalResponse.returnValue
        ? transformReturn(scValToNative(finalResponse.returnValue))
        : undefined,
  };
}

function normalizeAddress(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Address) return value.toString();
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

function normalizeStatusKey(value: unknown): string {
  if (typeof value === "string") return value.toLowerCase();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.tag === "string") return record.tag.toLowerCase();
    if (typeof record.name === "string") return record.name.toLowerCase();
    if (typeof record.value === "string") return record.value.toLowerCase();
    // scValToNative serializes Soroban enums as { "VariantName": null }
    const keys = Object.keys(record);
    if (keys.length >= 1) return keys[0].toLowerCase();
  }
  return "";
}

function normalizeIssuerStatus(value: unknown): IssuerStatus {
  const key = normalizeStatusKey(value);
  switch (key) {
    case "approved":
    case "1":
      return "approved";
    case "suspended":
    case "2":
      return "suspended";
    case "pending":
    case "0":
    default:
      return "pending";
  }
}

function normalizeCertificateStatus(value: unknown): CertificateStatus {
  const key = normalizeStatusKey(value);
  switch (key) {
    case "verified":
    case "1":
      return "verified";
    case "revoked":
    case "2":
      return "revoked";
    case "suspended":
    case "3":
      return "suspended";
    case "expired":
    case "4":
      return "expired";
    case "issued":
    case "0":
      return "issued";
    default:
      return "unknown";
  }
}

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

function normalizeOpportunityStatus(value: unknown): OpportunityStatus {
  const key = normalizeStatusKey(value);
  switch (key) {
    case "draft":
    case "0":
      return "draft";
    case "funded":
    case "1":
      return "funded";
    case "inprogress":
    case "in_progress":
    case "2":
      return "in_progress";
    case "submitted":
    case "3":
      return "submitted";
    case "approved":
    case "4":
      return "approved";
    case "released":
    case "5":
      return "released";
    case "refunded":
    case "6":
      return "refunded";
    case "cancelled":
    case "7":
      return "cancelled";
    default:
      return "draft";
  }
}

function normalizeOpportunity(value: unknown): OpportunityRecord | null {
  if (value == null) return null;
  const record = value as Record<string, unknown>;
  return {
    id: normalizeBigInt(record.id).toString(),
    employer: normalizeAddress(record.employer),
    candidate: normalizeAddress(record.candidate),
    certHash: normalizeString(record.cert_hash),
    title: normalizeString(record.title),
    amount: normalizeBigInt(record.amount),
    status: normalizeOpportunityStatus(record.status),
    milestoneCount: Math.min(
      Number(normalizeBigInt(record.milestone_count)),
      MAX_MILESTONES,
    ),
    currentMilestone: Math.min(
      Number(normalizeBigInt(record.current_milestone)),
      MAX_MILESTONES,
    ),
  };
}

export async function registerIssuer(
  issuer: string,
  name: string,
  website: string,
  category: string,
) {
  return signAndSubmit(
    issuer,
    "register_issuer",
    buildArgs([
      { value: issuer, type: "address" },
      { value: name, type: "string" },
      { value: website, type: "string" },
      { value: category, type: "string" },
    ]),
  );
}

export async function approveIssuer(admin: string, issuer: string) {
  return signAndSubmit(
    admin,
    "approve_issuer",
    buildArgs([
      { value: admin, type: "address" },
      { value: issuer, type: "address" },
    ]),
  );
}

export async function suspendIssuer(admin: string, issuer: string) {
  return signAndSubmit(
    admin,
    "suspend_issuer",
    buildArgs([
      { value: admin, type: "address" },
      { value: issuer, type: "address" },
    ]),
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
    buildArgs([{ value: issuer, type: "address" }]),
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
    e2eCertificates.set(
      normalizeHashKey(certHashHex),
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
    buildArgs([
      { value: issuer, type: "address" },
      { value: student, type: "address" },
      { value: hexToBytes32(certHashHex), type: "bytes32" },
      { value: metadata?.title ?? "", type: "string" },
      { value: metadata?.cohort ?? "", type: "string" },
      { value: metadata?.metadataUri ?? "", type: "string" },
    ]),
  );
}

export async function verifyCertificate(caller: string, certHashHex: string) {
  if (appConfig.e2eMode) {
    const key = normalizeHashKey(certHashHex);
    const current = e2eCertificates.get(key);
    e2eCertificates.set(
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
    buildArgs([
      { value: caller, type: "address" },
      { value: hexToBytes32(certHashHex), type: "bytes32" },
    ]),
  );
}

export async function getCertificate(certHashHex: string) {
  if (appConfig.e2eMode) {
    return normalizeCertificate(e2eCertificates.get(normalizeHashKey(certHashHex)) ?? null);
  }

  return simulateRead(
    getReadAddress(),
    "get_certificate",
    buildArgs([{ value: hexToBytes32(certHashHex), type: "bytes32" }]),
    normalizeCertificate,
  );
}

export async function revokeCertificate(actor: string, certHashHex: string) {
  return signAndSubmit(
    actor,
    "revoke_certificate",
    buildArgs([
      { value: actor, type: "address" },
      { value: hexToBytes32(certHashHex), type: "bytes32" },
    ]),
  );
}

export async function suspendCertificate(actor: string, certHashHex: string) {
  return signAndSubmit(
    actor,
    "suspend_certificate",
    buildArgs([
      { value: actor, type: "address" },
      { value: hexToBytes32(certHashHex), type: "bytes32" },
    ]),
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
    buildArgs([
      { value: student, type: "address" },
      { value: hexToBytes32(certHashHex), type: "bytes32" },
      { value: amount, type: "i128" },
    ]),
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
    buildArgs([
      { value: employer, type: "address" },
      { value: student, type: "address" },
      { value: hexToBytes32(certHashHex), type: "bytes32" },
      { value: amount, type: "i128" },
    ]),
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
  return signAndSubmit(
    employer,
    "create_opportunity",
    buildArgs([
      { value: employer, type: "address" },
      { value: candidate, type: "address" },
      { value: hexToBytes32(certHashHex), type: "bytes32" },
      { value: title, type: "string" },
      { value: amount, type: "i128" },
      { value: milestoneCount, type: "u32" },
    ]),
    (v) => normalizeBigInt(v).toString(),
  );
}

export async function fundOpportunity(employer: string, oppId: OpportunityIdInput) {
  return signAndSubmit(
    employer,
    "fund_opportunity",
    buildArgs([
      { value: employer, type: "address" },
      { value: opportunityIdToBigInt(oppId), type: "u64" },
    ]),
  );
}

export async function submitMilestone(candidate: string, oppId: OpportunityIdInput) {
  return signAndSubmit(
    candidate,
    "submit_milestone",
    buildArgs([
      { value: candidate, type: "address" },
      { value: opportunityIdToBigInt(oppId), type: "u64" },
    ]),
  );
}

export async function approveMilestone(employer: string, oppId: OpportunityIdInput) {
  return signAndSubmit(
    employer,
    "approve_milestone",
    buildArgs([
      { value: employer, type: "address" },
      { value: opportunityIdToBigInt(oppId), type: "u64" },
    ]),
  );
}

export async function releasePayment(employer: string, oppId: OpportunityIdInput) {
  return signAndSubmit(
    employer,
    "release_payment",
    buildArgs([
      { value: employer, type: "address" },
      { value: opportunityIdToBigInt(oppId), type: "u64" },
    ]),
  );
}

export async function refundOpportunity(employer: string, oppId: OpportunityIdInput) {
  return signAndSubmit(
    employer,
    "refund_opportunity",
    buildArgs([
      { value: employer, type: "address" },
      { value: opportunityIdToBigInt(oppId), type: "u64" },
    ]),
  );
}

export async function getOpportunity(oppId: OpportunityIdInput) {
  return simulateRead(
    getReadAddress(),
    "get_opportunity",
    buildArgs([{ value: opportunityIdToBigInt(oppId), type: "u64" }]),
    normalizeOpportunity,
  );
}

export const E2E_SAMPLE_PROOF_HASH = DEFAULT_SAMPLE_PROOF_HASH;

export { normalizeAddress, normalizeBigInt };
