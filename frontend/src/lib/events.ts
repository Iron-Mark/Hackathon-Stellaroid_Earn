import { formatAmount } from "./format";
import { appConfig } from "./config";
import { DEFAULT_SAMPLE_PROOF_HASH } from "./demo-data";
import { mergeRecentEvents } from "./event-merge";
import { xdr, scValToNative } from "@stellar/stellar-sdk";

type RpcEvent = {
  contractId: string;
  id: string;
  ledger: number;
  ledgerClosedAt: string;
  topic: string[];
  txHash: string;
  value: string;
};

type RpcHealthResponse = {
  latestLedger: number;
  oldestLedger: number;
};

type StellarExpertContractStats = {
  events?: number | null;
};

type StellarExpertEvent = {
  id?: string;
  paging_token?: string;
  ts?: number;
  contract?: string;
  topics?: string[];
  topicsXdr?: string[];
  bodyXdr?: string;
};

type StellarExpertEventsResponse = {
  _embedded?: {
    records?: StellarExpertEvent[];
  };
};

export type RecentActivityItem = {
  id: string;
  kind: string;
  label: string;
  detail: string;
  hashHex: string | null;
  /** Escrow events carry the opportunity ID so UIs can deep-link /opportunity/{id}. */
  opportunityId: string | null;
  /**
   * The address in the event's second topic. NOT always the signer: escrow
   * and payment events publish the signing employer/candidate, but cert_reg,
   * cert_ver, and reward publish the STUDENT/owner (the subject), and the
   * issuer-registry events carry no address topic at all. Treat this as
   * "wallet involved in the event", never "wallet that signed it".
   */
  actor: string | null;
  ledgerClosedAt: string;
  txHash: string | null;
  externalUrl: string;
  reference: string;
  source: "rpc" | "stellar_expert" | "e2e";
};

const STELLAR_ADDRESS_RE = /^[GC][A-Z2-7]{55}$/;

function decodeScVal(base64: string) {
  return xdr.ScVal.fromXDR(base64, "base64");
}

function decodeScValToNative(base64: string) {
  return scValToNative(decodeScVal(base64));
}

function toHexString(value: unknown) {
  if (!value) return null;
  if (value instanceof Uint8Array) return Buffer.from(value).toString("hex");
  if (Buffer.isBuffer(value)) return value.toString("hex");
  if (Array.isArray(value) && value.every((entry) => typeof entry === "number")) {
    return Buffer.from(value).toString("hex");
  }
  if (typeof value === "object" && "data" in (value as Record<string, unknown>)) {
    const data = (value as { data?: unknown }).data;
    return toHexString(data);
  }
  return null;
}

function topicSymbol(base64: string) {
  const native = decodeScValToNative(base64);
  return typeof native === "string" ? native : "event";
}

function topicAddress(base64: string) {
  if (!base64) return null;
  try {
    const native = decodeScValToNative(base64);
    return typeof native === "string" && STELLAR_ADDRESS_RE.test(native)
      ? native
      : null;
  } catch {
    return null;
  }
}

function opportunityIdFromPayload(payload: unknown): string | null {
  if (
    typeof payload !== "bigint" &&
    typeof payload !== "number" &&
    !(typeof payload === "string" && /^\d+$/.test(payload))
  ) {
    return null;
  }
  try {
    const id = BigInt(payload);
    return id >= 0n ? id.toString() : null;
  } catch {
    return null;
  }
}

function contractEventsUrl(contractId: string) {
  return `${appConfig.explorerUrl}/contract/${contractId}#events`;
}

function txUrl(txHash: string) {
  return `${appConfig.explorerUrl}/tx/${txHash}`;
}

function shortTxHash(txHash: string) {
  return `${txHash.slice(0, 10)}…${txHash.slice(-6)}`;
}

function ledgerFromStellarExpertEventId(id: string) {
  const pagingToken = id.split("-")[0];
  if (!/^\d+$/.test(pagingToken)) return null;

  try {
    return Number(BigInt(pagingToken) / 4_294_967_296n);
  } catch {
    return null;
  }
}

function amountEventDetail(payload: unknown, action: "reward" | "payment") {
  const fallback =
    action === "reward" ? "Student reward sent" : "Employer payment sent";

  if (
    typeof payload !== "bigint" &&
    typeof payload !== "number" &&
    typeof payload !== "string"
  ) {
    return fallback;
  }

  try {
    return `${formatAmount(BigInt(payload), appConfig.assetDecimals)} ${appConfig.assetCode} ${action}`;
  } catch {
    return fallback;
  }
}

function escrowEventDetail(opportunityId: string | null, suffix: string) {
  return opportunityId ? `Opportunity #${opportunityId} ${suffix}` : `Opportunity ${suffix}`;
}

function detailForKind(
  kind: string,
  hashHex: string | null,
  payload: unknown,
  opportunityId: string | null,
) {
  switch (kind) {
    case "init":
      return "Contract bootstrapped";
    case "iss_reg":
      return "Issuer registered";
    case "iss_appr":
      return "Issuer approved";
    case "iss_susp":
      return "Issuer suspended";
    case "cert_reg":
      return hashHex ? `Proof ${hashHex.slice(0, 10)}… registered` : "Certificate registered";
    case "cert_ver":
      return hashHex ? `Proof ${hashHex.slice(0, 10)}… verified` : "Certificate verified";
    case "reward":
      return amountEventDetail(payload, "reward");
    case "payment":
      return amountEventDetail(payload, "payment");
    case "opp_crt":
      return escrowEventDetail(opportunityId, "created");
    case "opp_fund":
      return escrowEventDetail(opportunityId, "funded — escrow locked");
    case "mile_sub":
      return escrowEventDetail(opportunityId, "milestone submitted");
    case "mile_apr":
      return escrowEventDetail(opportunityId, "milestone approved");
    case "pay_rel":
      return escrowEventDetail(opportunityId, "escrow released to candidate");
    case "pay_ref":
      return escrowEventDetail(opportunityId, "escrow refunded to employer");
    default:
      return null;
  }
}

function buildRecentActivityItem({
  id,
  kind,
  payload,
  actor,
  ledgerClosedAt,
  txHash,
  externalUrl,
  reference,
  source,
}: {
  id: string;
  kind: string;
  payload: unknown;
  actor: string | null;
  ledgerClosedAt: string;
  txHash: string | null;
  externalUrl: string;
  reference: string;
  source: RecentActivityItem["source"];
}): RecentActivityItem | null {
  const hashHex = toHexString(payload);
  if (kind === "cert_fail") {
    return null;
  }

  const labelByKind: Record<string, string> = {
    init: "Init",
    iss_reg: "Issuer",
    iss_appr: "Approved",
    iss_susp: "Suspended",
    cert_reg: "Registered",
    cert_ver: "Verified",
    reward: "Reward",
    payment: "Payment",
    opp_crt: "Escrow",
    opp_fund: "Funded",
    mile_sub: "Submitted",
    // Not "Approved" — that chip already means issuer approval (iss_appr)
    // in the same feed, with a different tone.
    mile_apr: "Milestone OK",
    pay_rel: "Released",
    pay_ref: "Refunded",
  };

  const isEscrowKind =
    kind === "opp_crt" ||
    kind === "opp_fund" ||
    kind === "mile_sub" ||
    kind === "mile_apr" ||
    kind === "pay_rel" ||
    kind === "pay_ref";
  const opportunityId = isEscrowKind ? opportunityIdFromPayload(payload) : null;

  const detail = detailForKind(kind, hashHex, payload, opportunityId);
  if (!detail || !labelByKind[kind]) {
    return null;
  }

  return {
    id,
    kind,
    label: labelByKind[kind],
    detail,
    hashHex: isEscrowKind ? null : hashHex,
    opportunityId,
    actor,
    ledgerClosedAt,
    txHash,
    externalUrl,
    reference,
    source,
  };
}

function describeRpcEvent(event: RpcEvent): RecentActivityItem | null {
  const kind = topicSymbol(event.topic[0] ?? "");
  const payload = decodeScValToNative(event.value);

  return buildRecentActivityItem({
    id: event.id,
    kind,
    payload,
    actor: topicAddress(event.topic[1] ?? ""),
    ledgerClosedAt: event.ledgerClosedAt,
    txHash: event.txHash,
    externalUrl: txUrl(event.txHash),
    reference: shortTxHash(event.txHash),
    source: "rpc",
  });
}

function describeStellarExpertEvent(
  event: StellarExpertEvent,
  contractId: string,
): RecentActivityItem | null {
  const id = event.id ?? event.paging_token;
  if (!id || !event.bodyXdr) return null;

  const kind =
    event.topics?.[0] ??
    (event.topicsXdr?.[0] ? topicSymbol(event.topicsXdr[0]) : "event");
  const payload = decodeScValToNative(event.bodyXdr);
  const ledger = ledgerFromStellarExpertEventId(id);
  const decodedActor = event.topics?.[1];
  const actor =
    typeof decodedActor === "string" && STELLAR_ADDRESS_RE.test(decodedActor)
      ? decodedActor
      : topicAddress(event.topicsXdr?.[1] ?? "");

  return buildRecentActivityItem({
    id,
    kind,
    payload,
    actor,
    ledgerClosedAt: event.ts ? new Date(event.ts * 1000).toISOString() : new Date().toISOString(),
    txHash: null,
    externalUrl: contractEventsUrl(contractId),
    reference: ledger ? `ledger ${ledger}` : "indexed event",
    source: "stellar_expert",
  });
}

async function rpcRequest<T>(method: string, params: object) {
  const response = await fetch(appConfig.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `${method}-${Date.now()}`,
      method,
      params,
    }),
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`RPC ${method} failed with ${response.status}.`);
  }

  const json = (await response.json()) as {
    error?: { message?: string };
    result?: T;
  };

  if (json.error) {
    throw new Error(json.error.message ?? `RPC ${method} failed.`);
  }

  if (!json.result) {
    throw new Error(`RPC ${method} returned no result.`);
  }

  return json.result;
}

function stellarExpertNetworkSegment() {
  const match = appConfig.explorerUrl.match(/\/explorer\/([^/?#]+)/);
  if (match?.[1]) return match[1];

  const network = appConfig.network.toUpperCase();
  return network === "PUBLIC" || network === "PUBNET" ? "public" : "testnet";
}

async function stellarExpertRequest<T>(path: string) {
  const baseUrl = `https://api.stellar.expert/explorer/${stellarExpertNetworkSegment()}`;
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Stellar Expert ${path} failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}

// Bound the getEvents scan to a recent ledger window instead of the whole
// retained history, so each upstream call stays cheap even under connection
// pressure. ~7 days at 5s/ledger; still floored at the RPC's oldest ledger.
const MAX_EVENT_LEDGER_WINDOW = 120_960;

async function getRpcRecentEvents(contractId: string, limit: number) {
  const health = await rpcRequest<RpcHealthResponse>("getHealth", {});
  const startLedger = Math.max(
    health.oldestLedger,
    health.latestLedger - MAX_EVENT_LEDGER_WINDOW,
  );
  const eventResult = await rpcRequest<{ events: RpcEvent[] }>("getEvents", {
    startLedger,
    endLedger: health.latestLedger + 1,
    filters: [
      {
        type: "contract",
        contractIds: [contractId],
      },
    ],
    pagination: {
      limit: Math.min(Math.max(limit, 40), 200),
    },
  });

  return eventResult.events
    .map((event) => {
      try {
        return describeRpcEvent(event);
      } catch {
        return null;
      }
    })
    .filter((event): event is RecentActivityItem => Boolean(event));
}

async function getStellarExpertRecentEvents(contractId: string, limit: number) {
  const result = await stellarExpertRequest<StellarExpertEventsResponse>(
    `/contract/${contractId}/events?order=desc&limit=${Math.min(Math.max(limit, 20), 200)}`,
  );

  return (result._embedded?.records ?? [])
    .map((event) => {
      try {
        return describeStellarExpertEvent(event, contractId);
      } catch {
        return null;
      }
    })
    .filter((event): event is RecentActivityItem => Boolean(event));
}


export async function getContractIndexedEventCount(contractId: string) {
  if (!contractId) return null;

  try {
    const stats = await stellarExpertRequest<StellarExpertContractStats>(
      `/contract/${contractId}`,
    );
    return typeof stats.events === "number" ? stats.events : null;
  } catch {
    return null;
  }
}

export async function getRecentEvents(contractId: string, limit = 5) {
  if (appConfig.e2eMode) {
    const E2E_ACTOR = "GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D";
    return [
      {
        id: "e2e-cert-reg",
        kind: "cert_reg",
        label: "Registered",
        detail: `Proof ${DEFAULT_SAMPLE_PROOF_HASH.slice(0, 10)}… registered`,
        hashHex: DEFAULT_SAMPLE_PROOF_HASH,
        opportunityId: null,
        actor: E2E_ACTOR,
        ledgerClosedAt: new Date().toISOString(),
        txHash: "e2e000000000000000000000000000000000000000000000000000000000001",
        externalUrl: contractEventsUrl(contractId),
        reference: "e2e register",
        source: "e2e" as const,
      },
      {
        id: "e2e-cert-ver",
        kind: "cert_ver",
        label: "Verified",
        detail: `Proof ${DEFAULT_SAMPLE_PROOF_HASH.slice(0, 10)}… verified`,
        hashHex: DEFAULT_SAMPLE_PROOF_HASH,
        opportunityId: null,
        actor: E2E_ACTOR,
        ledgerClosedAt: new Date().toISOString(),
        txHash: "e2e000000000000000000000000000000000000000000000000000000000002",
        externalUrl: contractEventsUrl(contractId),
        reference: "e2e verify",
        source: "e2e" as const,
      },
      {
        id: "e2e-payment",
        kind: "payment",
        label: "Payment",
        detail: `10 ${appConfig.assetCode} payment`,
        hashHex: null,
        opportunityId: null,
        actor: E2E_ACTOR,
        ledgerClosedAt: new Date().toISOString(),
        txHash: "e2e000000000000000000000000000000000000000000000000000000000003",
        externalUrl: contractEventsUrl(contractId),
        reference: "e2e payment",
        source: "e2e" as const,
      },
      {
        id: "e2e-opp-fund",
        kind: "opp_fund",
        label: "Funded",
        detail: "Opportunity #1 funded — escrow locked",
        hashHex: null,
        opportunityId: "1",
        actor: E2E_ACTOR,
        ledgerClosedAt: new Date().toISOString(),
        txHash: "e2e000000000000000000000000000000000000000000000000000000000004",
        externalUrl: contractEventsUrl(contractId),
        reference: "e2e escrow",
        source: "e2e" as const,
      },
    ].slice(0, limit);
  }

  if (!contractId) return [];

  const [rpcResult, stellarExpertResult] = await Promise.allSettled([
    getRpcRecentEvents(contractId, limit),
    getStellarExpertRecentEvents(contractId, limit),
  ]);

  const events = mergeRecentEvents(
    [
      ...(rpcResult.status === "fulfilled" ? rpcResult.value : []),
      ...(stellarExpertResult.status === "fulfilled" ? stellarExpertResult.value : []),
    ],
    limit,
  );

  if (events.length > 0) return events;

  if (rpcResult.status === "rejected" && stellarExpertResult.status === "rejected") {
    throw new Error(
      `${rpcResult.reason instanceof Error ? rpcResult.reason.message : "RPC events failed"}; ${
        stellarExpertResult.reason instanceof Error
          ? stellarExpertResult.reason.message
          : "Stellar Expert events failed"
      }`,
    );
  }

  return [];
}

// Short-TTL, in-flight-deduplicating cache. Every concurrent /api/events and
// /api/events/stream reader shares one upstream fetch per (contract, limit)
// per window instead of each triggering its own RPC + indexer round-trips —
// this is the primary guard against connection-flood amplification.
const EVENT_CACHE_TTL_MS = 15_000;
const recentEventsCache = new Map<
  string,
  { at: number; value: Promise<RecentActivityItem[]> }
>();

export function getRecentEventsCached(contractId: string, limit = 5) {
  const key = `${contractId}:${limit}`;
  const now = Date.now();
  const cached = recentEventsCache.get(key);
  if (cached && now - cached.at < EVENT_CACHE_TTL_MS) {
    return cached.value;
  }

  const value = getRecentEvents(contractId, limit);
  recentEventsCache.set(key, { at: now, value });
  // Never persist a rejection: drop it so the next reader retries upstream.
  value.catch(() => {
    if (recentEventsCache.get(key)?.value === value) {
      recentEventsCache.delete(key);
    }
  });
  return value;
}

export async function getRecentProofHashes(contractId: string, limit = 3) {
  const events = await getRecentEvents(contractId, 12);
  const uniqueHashes = Array.from(
    new Set(
      events
        .filter((event) => (event.kind === "cert_reg" || event.kind === "cert_ver") && event.hashHex)
        .map((event) => event.hashHex as string),
    ),
  );

  return uniqueHashes.slice(0, limit);
}

// Re-exported from format.ts (SDK-free) so client components can use it
// without pulling this module's stellar-sdk import into their bundle.
export { formatRelativeTime } from "./format";
