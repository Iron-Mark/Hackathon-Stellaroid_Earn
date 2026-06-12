import {
  Account,
  BASE_FEE,
  Operation,
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
} from "./config.ts";
import { DEFAULT_SAMPLE_PROOF_HASH } from "./demo-data.ts";
import type {
  CertificateStatus,
  IssuerRecord,
  IssuerStatus,
  OpportunityRecord,
  OpportunityStatus,
} from "./types.ts";
import { MAX_OPPORTUNITY_MILESTONES } from "./types.ts";
import {
  normalizeOpportunityId,
  type OpportunityIdInput,
  opportunityIdToBigInt,
} from "./opportunity-id.ts";
import { routeRpcOperation } from "./rpc-router.ts";

const FALLBACK_SIMULATION_SOURCE =
  "GBAKLRUJEOZGWKSHJFFWJ4DINXQZEJBT7JQTR5T4GATQU2SNO4ZFHZQ4";
const E2E_WALLET_ADDRESS =
  "GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D";

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

function normalizeStatusKey(value: unknown): string {
  if (typeof value === "string") return value.toLowerCase();
  if (typeof value === "number") return String(value);
  // Soroban SDK encodes enum variants as ["VariantName"] or ["VariantName", ...values]
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0].toLowerCase();
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.tag === "string") return record.tag.toLowerCase();
    if (typeof record.name === "string") return record.name.toLowerCase();
    if (typeof record.value === "string") return record.value.toLowerCase();
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

function normalizeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toString" in value) {
    return value.toString();
  }
  return "";
}

function normalizeTimestamp(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return 0;
}

function normalizeBigInt(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      throw new Error("Contract integer is outside JavaScript's safe range.");
    }
    return BigInt(value);
  }
  if (typeof value === "string") return BigInt(value);
  throw new Error("Unable to parse integer value returned by the contract.");
}

function ensureConfigured() {
  if (!hasRequiredConfig()) {
    throw new Error(
      "Missing contract configuration. Set NEXT_PUBLIC_SOROBAN_CONTRACT_ID in .env.local.",
    );
  }
}

function getSimulationSourceAddress() {
  const configured = appConfig.readAddress?.trim();
  return configured || FALLBACK_SIMULATION_SOURCE;
}

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

function normalizeAddress(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toString" in value) {
    return value.toString();
  }
  throw new Error("Unable to parse Stellar address returned by the contract.");
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

function buildSimulationTransaction(
  sourceAddress: string,
  certHashHex: string,
) {
  const sourceAccount = new Account(sourceAddress, "0");
  const args = [nativeToScVal(hexToBytes32(certHashHex), { type: "bytes" })];

  return new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: getExpectedNetworkPassphrase(),
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: appConfig.contractId,
        function: "get_certificate",
        args,
      }),
    )
    .setTimeout(30)
    .build();
}

export async function getCertificateServer(certHashHex: string) {
  if (appConfig.e2eMode) {
    if (certHashHex.trim().toLowerCase() !== DEFAULT_SAMPLE_PROOF_HASH.toLowerCase()) {
      return null;
    }
    return normalizeCertificate({
      owner: E2E_WALLET_ADDRESS,
      issuer: E2E_WALLET_ADDRESS,
      title: "Stellar Smart Contract Bootcamp Completion",
      cohort: "Stellar PH Bootcamp 2026",
      metadata_uri: "",
      status: "Verified",
      issued_at: 0,
      verified_at: Date.now(),
      expires_at: 0,
    });
  }

  ensureConfigured();
  const transaction = buildSimulationTransaction(
    getSimulationSourceAddress(),
    certHashHex,
  );

  return routeRpcOperation(async (server) => {
    try {
      const simulation = await server.simulateTransaction(transaction);

      if (rpc.Api.isSimulationError(simulation)) {
        throw new Error(simulation.error);
      }
      if (!simulation.result?.retval) {
        throw new Error("Simulation for get_certificate returned no value.");
      }

      return normalizeCertificate(scValToNative(simulation.result.retval));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (!/Bad union switch/i.test(message)) {
        throw e;
      }

      const rawSimulation = await server._simulateTransaction(transaction);
      if (rawSimulation.error) {
        throw new Error(rawSimulation.error);
      }

      const rawResultXdr = rawSimulation.results?.[0]?.xdr;
      if (!rawResultXdr) {
        throw new Error("Simulation for get_certificate returned no value.");
      }

      const rawScVal = xdr.ScVal.fromXDR(rawResultXdr, "base64");
      return normalizeCertificate(scValToNative(rawScVal));
    }
  });
}

export async function getIssuerServer(issuer: string) {
  ensureConfigured();
  const sourceAccount = new Account(getSimulationSourceAddress(), "0");
  const args = [nativeToScVal(issuer, { type: "address" })];

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: getExpectedNetworkPassphrase(),
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: appConfig.contractId,
        function: "get_issuer",
        args,
      }),
    )
    .setTimeout(30)
    .build();

  return routeRpcOperation(async (server) => {
    try {
      const simulation = await server.simulateTransaction(transaction);

      if (rpc.Api.isSimulationError(simulation)) {
        throw new Error(simulation.error);
      }
      if (!simulation.result?.retval) {
        throw new Error("Simulation for get_issuer returned no value.");
      }

      return normalizeIssuer(scValToNative(simulation.result.retval));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (!/Bad union switch/i.test(message)) {
        throw e;
      }

      const rawSimulation = await server._simulateTransaction(transaction);
      if (rawSimulation.error) {
        throw new Error(rawSimulation.error);
      }

      const rawResultXdr = rawSimulation.results?.[0]?.xdr;
      if (!rawResultXdr) {
        throw new Error("Simulation for get_issuer returned no value.");
      }

      const rawScVal = xdr.ScVal.fromXDR(rawResultXdr, "base64");
      return normalizeIssuer(scValToNative(rawScVal));
    }
  });
}

function normalizeOpportunityStatus(value: unknown): OpportunityStatus {
  const key = normalizeStatusKey(value);
  switch (key) {
    case "funded": case "1": return "funded";
    case "inprogress": case "in_progress": case "2": return "in_progress";
    case "submitted": case "3": return "submitted";
    case "approved": case "4": return "approved";
    case "released": case "5": return "released";
    case "refunded": case "6": return "refunded";
    case "cancelled": case "7": return "cancelled";
    case "draft": case "0": default: return "draft";
  }
}

function normalizeOpportunity(value: unknown): OpportunityRecord | null {
  if (value == null) return null;
  const record = value as Record<string, unknown>;
  return {
    id: normalizeOpportunityId(normalizeBigInt(record.id)),
    employer: normalizeAddress(record.employer),
    candidate: normalizeAddress(record.candidate),
    certHash: normalizeString(record.cert_hash),
    title: normalizeString(record.title),
    amount: normalizeBigInt(record.amount),
    status: normalizeOpportunityStatus(record.status),
    milestoneCount: Math.min(
      normalizeTimestamp(record.milestone_count),
      MAX_OPPORTUNITY_MILESTONES,
    ),
    currentMilestone: Math.min(
      normalizeTimestamp(record.current_milestone),
      MAX_OPPORTUNITY_MILESTONES,
    ),
  };
}

export async function getOpportunityServer(oppId: OpportunityIdInput) {
  ensureConfigured();
  const sourceAccount = new Account(getSimulationSourceAddress(), "0");
  const args = [nativeToScVal(opportunityIdToBigInt(oppId), { type: "u64" })];

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: getExpectedNetworkPassphrase(),
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: appConfig.contractId,
        function: "get_opportunity",
        args,
      }),
    )
    .setTimeout(30)
    .build();

  return routeRpcOperation(async (server) => {
    try {
      const simulation = await server.simulateTransaction(transaction);

      if (rpc.Api.isSimulationError(simulation)) {
        throw new Error(simulation.error);
      }
      if (!simulation.result?.retval) {
        throw new Error("Simulation for get_opportunity returned no value.");
      }

      return normalizeOpportunity(scValToNative(simulation.result.retval));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (!/Bad union switch/i.test(message)) {
        throw e;
      }

      const rawSimulation = await server._simulateTransaction(transaction);
      if (rawSimulation.error) {
        throw new Error(rawSimulation.error);
      }

      const rawResultXdr = rawSimulation.results?.[0]?.xdr;
      if (!rawResultXdr) {
        throw new Error("Simulation for get_opportunity returned no value.");
      }

      const rawScVal = xdr.ScVal.fromXDR(rawResultXdr, "base64");
      return normalizeOpportunity(scValToNative(rawScVal));
    }
  });
}
