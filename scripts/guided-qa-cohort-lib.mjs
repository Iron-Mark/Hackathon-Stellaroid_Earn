import { createHash } from "node:crypto";

export const CONTRACT_ID = "CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV";
export const NETWORK = "testnet";
export const ADMIN_ALIAS = "deploy-key";
export const EXPECTED_ADMIN_ADDRESS =
  "GALGZZRXRB5SIBGT62OZDA7BMPC4YUZDECHVHGWOAMXIMNLTZGFGTLMN";
export const ACTOR_COUNT = 24;
export const TEAM_COUNT = 8;
export const XLM_STROOPS = "10000000";

export const TEAM_SCENARIOS = [
  {
    issuerName: "Harborlight Skills Studio",
    category: "bootcamp",
    credentialTitle: "Full Stack Web Development Foundations",
    cohort: "April 2026 Web Cohort",
    opportunityTitle: "Community Portfolio Site Refresh",
  },
  {
    issuerName: "Northbridge Digital Learning",
    category: "platform",
    credentialTitle: "Product Design Foundations",
    cohort: "Product Design Sprint 2026",
    opportunityTitle: "Mobile Onboarding Usability Review",
  },
  {
    issuerName: "Cedarline Career Lab",
    category: "bootcamp",
    credentialTitle: "Data Analytics Essentials",
    cohort: "Data Skills Cohort 2026-A",
    opportunityTitle: "Program Outcomes Dashboard",
  },
  {
    issuerName: "Pixel Harbor Academy",
    category: "platform",
    credentialTitle: "Frontend Engineering Foundations",
    cohort: "Frontend Builders Batch 4",
    opportunityTitle: "Credential Proof Page Polish",
  },
  {
    issuerName: "Lanternworks Training Collective",
    category: "employer",
    credentialTitle: "Cloud Support Operations",
    cohort: "Cloud Operations Lab 2026",
    opportunityTitle: "Deployment Health Check",
  },
  {
    issuerName: "Meridian Path Skills Hub",
    category: "bootcamp",
    credentialTitle: "Blockchain Application Development",
    cohort: "Blockchain Builders Batch 3",
    opportunityTitle: "Testnet Event Explorer",
  },
  {
    issuerName: "Brightforge Learning Studio",
    category: "platform",
    credentialTitle: "Mobile Interface Development",
    cohort: "Mobile Product Cohort 2026",
    opportunityTitle: "Responsive Proof Card Review",
  },
  {
    issuerName: "Fieldstone Technology Workshop",
    category: "bootcamp",
    credentialTitle: "Smart Contract Engineering Foundations",
    cohort: "Smart Contract Workshop 2026",
    opportunityTitle: "Escrow Workflow Documentation",
  },
];

export function actorAlias(number) {
  if (!Number.isInteger(number) || number < 1 || number > ACTOR_COUNT) {
    throw new Error(`Actor number must be between 1 and ${ACTOR_COUNT}.`);
  }
  return `qa-actor-${String(number).padStart(2, "0")}`;
}

export function actorLabel(number) {
  return `QA User ${String(number).padStart(2, "0")}`;
}

export function certificateHash(teamNumber) {
  const scenario = TEAM_SCENARIOS[teamNumber - 1];
  if (!scenario) throw new Error(`Unknown team ${teamNumber}.`);
  return createHash("sha256")
    .update(
      [
        "stellaroid-guided-testnet-qa",
        "2026-07",
        teamNumber,
        scenario.issuerName,
        scenario.credentialTitle,
        scenario.cohort,
      ].join("|"),
    )
    .digest("hex");
}

export function buildCohortPlan() {
  return TEAM_SCENARIOS.map((scenario, index) => {
    const teamNumber = index + 1;
    const issuerNumber = teamNumber;
    const candidateNumber = teamNumber + TEAM_COUNT;
    const employerNumber = teamNumber + TEAM_COUNT * 2;
    return {
      teamNumber,
      scenario,
      certificateHash: certificateHash(teamNumber),
      issuer: {
        number: issuerNumber,
        alias: actorAlias(issuerNumber),
        label: actorLabel(issuerNumber),
        role: "issuer",
      },
      candidate: {
        number: candidateNumber,
        alias: actorAlias(candidateNumber),
        label: actorLabel(candidateNumber),
        role: "candidate",
      },
      employer: {
        number: employerNumber,
        alias: actorAlias(employerNumber),
        label: actorLabel(employerNumber),
        role: "employer",
      },
    };
  });
}

export function allActors(plan = buildCohortPlan()) {
  return plan
    .flatMap((team) => [team.issuer, team.candidate, team.employer])
    .sort((a, b) => a.number - b.number);
}

export function assertSafeTarget({ network, contractId, adminAddress }) {
  if (network !== NETWORK) throw new Error(`Refusing non-testnet network: ${network}`);
  if (contractId !== CONTRACT_ID) throw new Error(`Refusing unknown contract: ${contractId}`);
  if (adminAddress !== EXPECTED_ADMIN_ADDRESS) {
    throw new Error(`Refusing unexpected facilitator address: ${adminAddress}`);
  }
}

export function redactSecrets(value) {
  return String(value)
    .replace(/\bS[A-Z2-7]{55}\b/g, "[REDACTED_STELLAR_SECRET]")
    .replace(
      /\b(?:[a-z]+\s+){23}[a-z]+\b/gi,
      "[REDACTED_SEED_PHRASE]",
    );
}

export function expectedTotals() {
  return {
    actors: ACTOR_COUNT,
    teams: TEAM_COUNT,
    actorSignedTransactions: TEAM_COUNT * 8,
    facilitatorTransactions: TEAM_COUNT,
    totalTransactions: TEAM_COUNT * 9,
    approvedIssuers: TEAM_COUNT,
    verifiedCredentials: TEAM_COUNT,
    releasedOpportunities: TEAM_COUNT,
  };
}

