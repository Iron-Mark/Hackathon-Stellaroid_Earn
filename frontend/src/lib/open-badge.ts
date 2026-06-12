import type { CertificateRecord } from "./contract-read-server.ts";
import type { IssuerInfo } from "./issuer-registry.ts";
import type { ProofMetadata } from "./types.ts";

/**
 * Open Badges 3.0 / W3C VC Data Model 2.0 credential document.
 *
 * v1 intentionally omits the `proof` block. Roadmap: sign with a Data
 * Integrity proof (eddsa-rdfc-2022 cryptosuite) once an issuer signing key
 * ceremony exists. Until then the on-chain hash anchored on Stellar is the
 * verification path, exposed via the human-readable proof page.
 */
export type OpenBadgeCredential = {
  "@context": readonly [string, string];
  type: readonly ["VerifiableCredential", "OpenBadgeCredential"];
  id: string;
  issuer: {
    id: string;
    type: "Profile";
    name: string;
    url?: string;
  };
  validFrom: string;
  validUntil?: string;
  credentialSubject: {
    type: readonly ["AchievementSubject"];
    identifier: readonly [
      {
        type: "IdentityObject";
        identityHash: string;
        identityType: "identifier";
        hashed: true;
        salt: "not-salted";
      },
    ];
    achievement: {
      id: string;
      type: readonly ["Achievement"];
      name: string;
      description: string;
      criteria?: { narrative: string };
      tag: string[];
    };
  };
  "https://stellaroid.tech/ns#network": string;
};

export type OpenBadgeInput = {
  hash: string;
  baseUrl: string;
  network: "testnet" | "mainnet";
  cert: CertificateRecord;
  metadata: ProofMetadata | null;
  issuerInfo: IssuerInfo | null;
};

const FALLBACK_TITLE = "On-chain credential";
const FALLBACK_DESCRIPTION =
  "This credential is anchored on Stellar and carries contract-backed title, issuer, and status data.";

function epochSecondsToIso(seconds: number): string {
  return new Date(seconds * 1000).toISOString();
}

export function buildOpenBadgeCredential(
  input: OpenBadgeInput,
): OpenBadgeCredential {
  const { hash, baseUrl, network, cert, metadata, issuerInfo } = input;
  const credentialUrl = `${baseUrl}/proof/${hash}/credential.json`;
  const name = metadata?.title || cert.title.trim() || FALLBACK_TITLE;
  const criteria = metadata?.criteria?.trim();

  const credential: OpenBadgeCredential = {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    ],
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    id: credentialUrl,
    issuer: {
      id: `${baseUrl}/issuer#${cert.issuer}`,
      type: "Profile",
      name: issuerInfo?.name ?? cert.issuer,
      ...(issuerInfo?.url ? { url: issuerInfo.url } : {}),
    },
    validFrom: epochSecondsToIso(cert.issuedAt),
    credentialSubject: {
      type: ["AchievementSubject"],
      identifier: [
        {
          type: "IdentityObject",
          identityHash: hash.toLowerCase(),
          identityType: "identifier",
          hashed: true,
          salt: "not-salted",
        },
      ],
      achievement: {
        id: `${baseUrl}/proof/${hash}`,
        type: ["Achievement"],
        name,
        description: metadata?.description || FALLBACK_DESCRIPTION,
        ...(criteria ? { criteria: { narrative: criteria } } : {}),
        tag: metadata?.skills ? [...metadata.skills] : [],
      },
    },
    "https://stellaroid.tech/ns#network": network,
  };

  if (cert.expiresAt > 0) {
    credential.validUntil = epochSecondsToIso(cert.expiresAt);
  }

  return credential;
}
