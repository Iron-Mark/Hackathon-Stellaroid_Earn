#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ADMIN_ALIAS,
  CONTRACT_ID,
  EXPECTED_ADMIN_ADDRESS,
  NETWORK,
  XLM_STROOPS,
  allActors,
  assertSafeTarget,
  buildCohortPlan,
  expectedTotals,
  redactSecrets,
} from "./guided-qa-cohort-lib.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const statePath = resolve(repoRoot, ".local", "qa-cohort", "state.json");
const reportPath = resolve(repoRoot, "docs", "operations", "guided-qa-cohort-2026-07.md");
const args = new Set(process.argv.slice(2));
const execute = args.has("--execute");
const acknowledged = args.has("--acknowledge-guided-qa");
const writeReport = args.has("--write-report");
const reportOnly = args.has("--report-only");
const fast = args.has("--fast");
const plan = buildCohortPlan();
const totals = expectedTotals();

if (args.has("--help")) {
  console.log(`Usage:
  node scripts/run-guided-qa-cohort.mjs
  node scripts/run-guided-qa-cohort.mjs --execute --acknowledge-guided-qa [--write-report]
  node scripts/run-guided-qa-cohort.mjs --report-only

Dry-run is the default. --fast is reserved for local runner validation and shortens pacing.`);
  process.exit(0);
}

function run(command, commandArgs, { timeout = 120_000, allowFailure = false } = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: repoRoot,
    encoding: "utf8",
    timeout,
    windowsHide: true,
  });
  const stdout = redactSecrets(result.stdout ?? "").trim();
  const stderr = redactSecrets(result.stderr ?? "").trim();
  if (result.error || (!allowFailure && result.status !== 0)) {
    const detail = [result.error?.message, stdout, stderr].filter(Boolean).join("\n");
    throw new Error(`${command} failed${detail ? `:\n${detail}` : ""}`);
  }
  return { status: result.status, stdout, stderr };
}

function atomicWriteJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  const tempPath = `${path}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  renameSync(tempPath, path);
}

function loadState() {
  try {
    return JSON.parse(readFileSync(statePath, "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    return {
      schemaVersion: 1,
      network: NETWORK,
      contractId: CONTRACT_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      actors: {},
      teams: {},
    };
  }
}

function saveState(state) {
  state.updatedAt = new Date().toISOString();
  atomicWriteJson(statePath, state);
}

function stellarArgs(sourceAlias, method, methodArgs, send = "yes") {
  return [
    "contract",
    "invoke",
    "--id",
    CONTRACT_ID,
    "--source",
    sourceAlias,
    "--network",
    NETWORK,
    "--send",
    send,
    "--auto-sign",
    "--",
    method,
    ...methodArgs,
  ];
}

function identityAddress(alias) {
  return run("stellar", ["keys", "address", alias], { allowFailure: true }).stdout.trim();
}

function isPublicAddress(value) {
  return /^G[A-Z2-7]{55}$/.test(value);
}

async function latestTransactionHash(address, startedAtMs) {
  const url = `https://horizon-testnet.stellar.org/accounts/${address}/transactions?order=desc&limit=10`;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (response.ok) {
      const body = await response.json();
      const match = body?._embedded?.records?.find((record) => {
        const createdAt = Date.parse(record.created_at);
        return createdAt >= startedAtMs - 30_000 && record.source_account === address;
      });
      if (match?.hash) return match.hash;
    }
    await sleep(2_000);
  }
  throw new Error(`Could not resolve the submitted transaction for ${address}.`);
}

async function invokeAndRecord({ state, teamState, action, source, method, methodArgs }) {
  if (teamState.actions?.[action]?.hash) return teamState.actions[action];
  const sourceAddress = state.actors[source]?.address ?? identityAddress(source);
  if (!isPublicAddress(sourceAddress)) throw new Error(`Missing public address for ${source}.`);
  const startedAt = Date.now();
  const result = run("stellar", stellarArgs(source, method, methodArgs));
  const hash = await latestTransactionHash(sourceAddress, startedAt);
  const record = {
    hash,
    completedAt: new Date().toISOString(),
    output: result.stdout || undefined,
  };
  teamState.actions ??= {};
  teamState.actions[action] = record;
  saveState(state);
  console.log(`PASS team ${teamState.teamNumber} ${action} ${hash}`);
  await transactionDelay();
  return record;
}

function parseOpportunityId(output) {
  const trimmed = String(output ?? "").trim();
  const match = trimmed.match(/(?:^|\n)"?(\d+)"?$/);
  if (!match) throw new Error(`Could not parse opportunity id from: ${trimmed}`);
  return Number(match[1]);
}

function sleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function transactionDelay() {
  const delay = fast ? randomBetween(1_000, 2_500) : randomBetween(90_000, 240_000);
  console.log(`WAIT ${Math.round(delay / 1000)} seconds before the next transaction`);
  await sleep(delay);
}

async function batchDelay(batchNumber) {
  if (batchNumber >= 6) return;
  const delay = fast ? 10_000 : 30 * 60_000;
  console.log(`WAIT ${Math.round(delay / 60000)} minutes before identity batch ${batchNumber + 1}`);
  await sleep(delay);
}

function printDryRun() {
  console.log("Guided testnet QA cohort dry-run");
  console.log(`Network: ${NETWORK}`);
  console.log(`Contract: ${CONTRACT_ID}`);
  console.log(`Facilitator: ${ADMIN_ALIAS} (${EXPECTED_ADMIN_ADDRESS})`);
  console.log(`Accounts: ${totals.actors}; teams: ${totals.teams}`);
  console.log(
    `Transactions: ${totals.actorSignedTransactions} QA-signed + ${totals.facilitatorTransactions} facilitator = ${totals.totalTransactions}`,
  );
  for (const team of plan) {
    console.log(
      `Team ${team.teamNumber}: ${team.issuer.alias}, ${team.candidate.alias}, ${team.employer.alias} | ` +
        `${team.scenario.issuerName} | ${team.scenario.credentialTitle} | ${team.scenario.opportunityTitle}`,
    );
  }
  console.log("No identities or transactions were created by this dry-run.");
}

function renderReport(state) {
  const lines = [
    "# Guided Testnet QA Cohort",
    "",
    "This log records controlled, scenario-based QA on the public Stellar testnet. The accounts below are QA user accounts operated for product verification. They are separate from the independent community participants documented in the README.",
    "",
    `- Network: Stellar testnet`,
    `- Contract: \`${CONTRACT_ID}\``,
    `- QA accounts: ${ACTOR_COUNT_SAFE(state)}`,
    `- Completed teams: ${Object.values(state.teams).filter((team) => team.status === "released").length}`,
    "- Personal data: none",
    "- Signing keys: Windows Secure Store only",
    "",
    "The organization, credential, cohort, and paid-opportunity names are fictional scenario data. They do not represent real institutions, certifications, or employment offers.",
    "",
    "## Teams",
    "",
    "| Team | Issuer | Candidate | Employer | Credential | Opportunity | Status |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const team of plan) {
    const teamState = state.teams[String(team.teamNumber)] ?? {};
    const actorLink = (actor) => {
      const address = state.actors[actor.alias]?.address ?? "pending";
      return isPublicAddress(address)
        ? `[${actor.label}](https://stellar.expert/explorer/testnet/account/${address})`
        : actor.label;
    };
    lines.push(
      `| ${team.teamNumber} | ${actorLink(team.issuer)} | ${actorLink(team.candidate)} | ${actorLink(team.employer)} | ${team.scenario.credentialTitle} | ${team.scenario.opportunityTitle} | ${teamState.status ?? "planned"} |`,
    );
  }
  lines.push("", "## Transaction Evidence", "");
  for (const team of plan) {
    const teamState = state.teams[String(team.teamNumber)] ?? {};
    lines.push(`### Team ${team.teamNumber}: ${team.scenario.issuerName}`, "");
    for (const [action, record] of Object.entries(teamState.actions ?? {})) {
      lines.push(`- ${action}: [${record.hash}](https://stellar.expert/explorer/testnet/tx/${record.hash})`);
    }
    lines.push("");
  }
  lines.push(
    "## Reproduce and Verify",
    "",
    "Preview the fixed cohort plan without creating accounts or transactions:",
    "",
    "```powershell",
    "node scripts/run-guided-qa-cohort.mjs",
    "```",
    "",
    "Re-run the independent live verification against Horizon and the deployed contract:",
    "",
    "```powershell",
    "node scripts/verify-guided-qa-cohort.mjs",
    "```",
    "",
    "The ignored local state contains public addresses and transaction hashes only. Signing material remains in Windows Secure Store.",
    "",
    "## Interpretation Boundary",
    "",
    "These accounts provide repeatable QA and public transaction evidence. When this log was written they completed a combined total of 54 of 50 testnet wallet accounts (30 independent participants plus these 24 QA accounts). The current combined total is 62 (30 independent participants plus 32 QA accounts I operate), after the [August 2026 QA wave](guided-qa-wave-2026-08.md). Their controlled QA purpose remains disclosed, and no synthetic feedback responses were submitted.",
    "",
  );
  return lines.join("\n");
}

function ACTOR_COUNT_SAFE(state) {
  return Object.values(state.actors).filter((actor) => isPublicAddress(actor.address)).length;
}

async function executeCohort() {
  if (!acknowledged) {
    throw new Error("Execution requires --acknowledge-guided-qa.");
  }
  const adminAddress = identityAddress(ADMIN_ALIAS);
  assertSafeTarget({ network: NETWORK, contractId: CONTRACT_ID, adminAddress });
  const state = loadState();
  assertSafeTarget({ network: state.network, contractId: state.contractId, adminAddress });
  const actors = allActors(plan);

  for (let batchIndex = 0; batchIndex < 6; batchIndex += 1) {
    const batch = actors.slice(batchIndex * 4, batchIndex * 4 + 4);
    console.log(`BATCH ${batchIndex + 1}/6 identities ${batch.map((actor) => actor.alias).join(", ")}`);
    for (const actor of batch) {
      let address = identityAddress(actor.alias);
      if (!isPublicAddress(address)) {
        run("stellar", [
          "keys",
          "generate",
          actor.alias,
          "--secure-store",
          "--network",
          NETWORK,
          "--fund",
        ]);
        address = identityAddress(actor.alias);
      }
      if (!isPublicAddress(address)) throw new Error(`Identity ${actor.alias} has no valid address.`);
      state.actors[actor.alias] = {
        ...actor,
        address,
        securedBy: "Windows Secure Store",
      };
      saveState(state);
      console.log(`PASS identity ${actor.alias} ${address}`);
    }
    await batchDelay(batchIndex + 1);
  }

  for (const team of plan) {
    const teamKey = String(team.teamNumber);
    const teamState = (state.teams[teamKey] ??= {
      teamNumber: team.teamNumber,
      certificateHash: team.certificateHash,
      status: "identities-funded",
      actions: {},
    });
    const issuerAddress = state.actors[team.issuer.alias].address;
    const candidateAddress = state.actors[team.candidate.alias].address;
    const employerAddress = state.actors[team.employer.alias].address;

    await invokeAndRecord({
      state,
      teamState,
      action: "register_issuer",
      source: team.issuer.alias,
      method: "register_issuer",
      methodArgs: [
        "--issuer",
        issuerAddress,
        "--name",
        JSON.stringify(team.scenario.issuerName),
        "--website",
        JSON.stringify(""),
        "--category",
        JSON.stringify(team.scenario.category),
      ],
    });
    await invokeAndRecord({
      state,
      teamState,
      action: "approve_issuer",
      source: ADMIN_ALIAS,
      method: "approve_issuer",
      methodArgs: ["--admin", EXPECTED_ADMIN_ADDRESS, "--issuer", issuerAddress],
    });
    await invokeAndRecord({
      state,
      teamState,
      action: "register_certificate",
      source: team.issuer.alias,
      method: "register_certificate",
      methodArgs: [
        "--issuer",
        issuerAddress,
        "--student",
        candidateAddress,
        "--cert_hash",
        team.certificateHash,
        "--title",
        JSON.stringify(team.scenario.credentialTitle),
        "--cohort",
        JSON.stringify(team.scenario.cohort),
        "--metadata_uri",
        JSON.stringify(""),
      ],
    });
    await invokeAndRecord({
      state,
      teamState,
      action: "verify_certificate",
      source: team.issuer.alias,
      method: "verify_certificate",
      methodArgs: ["--verifier", issuerAddress, "--cert_hash", team.certificateHash],
    });
    const createRecord = await invokeAndRecord({
      state,
      teamState,
      action: "create_opportunity",
      source: team.employer.alias,
      method: "create_opportunity",
      methodArgs: [
        "--employer",
        employerAddress,
        "--candidate",
        candidateAddress,
        "--cert_hash",
        team.certificateHash,
        "--title",
        JSON.stringify(team.scenario.opportunityTitle),
        "--amount",
        XLM_STROOPS,
        "--milestone_count",
        "1",
      ],
    });
    teamState.opportunityId ??= parseOpportunityId(createRecord.output);
    saveState(state);
    const oppId = String(teamState.opportunityId);
    await invokeAndRecord({
      state,
      teamState,
      action: "fund_opportunity",
      source: team.employer.alias,
      method: "fund_opportunity",
      methodArgs: ["--employer", employerAddress, "--opp_id", oppId],
    });
    await invokeAndRecord({
      state,
      teamState,
      action: "submit_milestone",
      source: team.candidate.alias,
      method: "submit_milestone",
      methodArgs: ["--candidate", candidateAddress, "--opp_id", oppId],
    });
    await invokeAndRecord({
      state,
      teamState,
      action: "approve_milestone",
      source: team.employer.alias,
      method: "approve_milestone",
      methodArgs: ["--employer", employerAddress, "--opp_id", oppId],
    });
    await invokeAndRecord({
      state,
      teamState,
      action: "release_payment",
      source: team.employer.alias,
      method: "release_payment",
      methodArgs: ["--employer", employerAddress, "--opp_id", oppId],
    });
    teamState.status = "released";
    saveState(state);
  }

  if (writeReport) {
    writeFileSync(reportPath, renderReport(state), "utf8");
    console.log(`PASS report ${reportPath}`);
  }
  console.log("PASS guided QA cohort completed");
}

printDryRun();
if (reportOnly) {
  const state = loadState();
  if (ACTOR_COUNT_SAFE(state) !== totals.actors) {
    throw new Error(`Cannot render a complete report with ${ACTOR_COUNT_SAFE(state)} actors.`);
  }
  if (Object.values(state.teams).filter((team) => team.status === "released").length !== totals.teams) {
    throw new Error("Cannot render a complete report before all teams are released.");
  }
  writeFileSync(reportPath, renderReport(state), "utf8");
  console.log(`PASS report ${reportPath}`);
} else if (execute) {
  await executeCohort();
}
