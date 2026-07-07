export type WalletStatus = "disconnected" | "connecting" | "connected" | "unsupported";

export type TxState = "idle" | "signing" | "submitting" | "success" | "error";

export type IssuerStatus = "pending" | "approved" | "suspended";

export type CertificateStatus =
  | "issued"
  | "verified"
  | "revoked"
  | "suspended"
  | "expired"
  | "unknown";

export type WalletSnapshot = {
  status: WalletStatus;
  address: string | null;
  network: string | null;
  networkPassphrase: string | null;
  isExpectedNetwork: boolean;
  error?: string;
  /** Which wallet provider produced this snapshot (e.g. "freighter", "albedo"). */
  provider?: string;
};

export type TxFeedback = {
  state: TxState;
  title: string;
  detail?: string;
  hash?: string;
};

export type IssuerRecord = {
  address: string;
  name: string;
  website: string;
  category: string;
  status: IssuerStatus;
};

export type ProofEvidenceLink = {
  label: string;
  href: string;
};

export type ProofMetadata = {
  title: string;
  description: string;
  cohort?: string;
  criteria?: string;
  skills: string[];
  evidence: ProofEvidenceLink[];
};

export type OpportunityStatus =
  | "draft"
  | "funded"
  | "in_progress"
  | "submitted"
  | "approved"
  | "released"
  | "refunded"
  | "cancelled";

export type OpportunityRecord = {
  id: string;
  employer: string;
  candidate: string;
  certHash: string;
  title: string;
  amount: bigint;
  status: OpportunityStatus;
  milestoneCount: number;
  currentMilestone: number;
};

export const MAX_OPPORTUNITY_MILESTONES = 24;
