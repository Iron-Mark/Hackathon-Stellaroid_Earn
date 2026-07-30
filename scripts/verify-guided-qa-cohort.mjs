#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ADMIN_ALIAS,
  CONTRACT_ID,
  EXPECTED_ADMIN_ADDRESS,
  NETWORK,
  allActors,
  assertSafeTarget,
  buildCohortPlan,
  expectedTotals,
  redactSecrets,
} from "./guided-qa-cohort-lib.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const statePath = resolve(repoRoot, ".local", "qa-cohort", "state.json");
const plan = buildCohortPlan();
const totals = expectedTotals();
const failures = [];

function pass(message) {
  console.log(`PASS ${message}`);
}

function fail(message) {
  failures.push(message);
  console.error(`FAIL ${message}`);
}

function run(command, args, { allowFailure = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 120_000,
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

function view(source, method, methodArgs) {
  const result = run("stellar", [
    "contract",
    "invoke",
    "--id",
    CONTRACT_ID,
    "--source",
    source,
    "--network",
    NETWORK,
    "--send",
    "no",
    "--",
    method,
    ...methodArgs,
  ]);
  return JSON.parse(result.stdout);
}

function statusName(value) {
  if (typeof value === "string") return value.toLowerCase();
  if (Array.isArray(value) && value.length > 0) return String(value[0]).toLowerCase();
  if (value && typeof value === "object") {
    return String(Object.keys(value)[0] ?? "").toLowerCase();
  }
  return "";
}

async function verifyHorizonAccount(actor, address) {
  if (!/^G[A-Z2-7]{55}$/.test(address ?? "")) {
    fail(`${actor.alias} has no valid public address`);
    return;
  }
  const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
  if (!response.ok) {
    fail(`${actor.alias} is not funded on testnet (${response.status})`);
    return;
  }
  const account = await response.json();
  const native = account.balances?.find((balance) => balance.asset_type === "native");
  if (!native || Number(native.balance) <= 0) {
    fail(`${actor.alias} has no positive native XLM balance`);
    return;
  }
  pass(`${actor.alias} funded at ${address}`);
}

const rawState = readFileSync(statePath, "utf8");
if (/\bS[A-Z2-7]{55}\b/.test(rawState) || /@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(rawState)) {
  fail("local state contains a secret key or email address");
}
const state = JSON.parse(rawState);
const adminAddress = run("stellar", ["keys", "address", ADMIN_ALIAS]).stdout;
assertSafeTarget({ network: state.network, contractId: state.contractId, adminAddress });
pass("state targets the approved testnet contract and facilitator");

const actors = allActors(plan);
if (Object.keys(state.actors ?? {}).length !== totals.actors) {
  fail(`expected ${totals.actors} actors, found ${Object.keys(state.actors ?? {}).length}`);
}
await Promise.all(
  actors.map((actor) => verifyHorizonAccount(actor, state.actors?.[actor.alias]?.address)),
);

const expectedActions = [
  "register_issuer",
  "approve_issuer",
  "register_certificate",
  "verify_certificate",
  "create_opportunity",
  "fund_opportunity",
  "submit_milestone",
  "approve_milestone",
  "release_payment",
];
const allHashes = [];

for (const team of plan) {
  const teamState = state.teams?.[String(team.teamNumber)];
  if (!teamState) {
    fail(`team ${team.teamNumber} is missing from state`);
    continue;
  }
  const issuerAddress = state.actors[team.issuer.alias].address;
  const candidateAddress = state.actors[team.candidate.alias].address;
  const employerAddress = state.actors[team.employer.alias].address;
  for (const action of expectedActions) {
    const hash = teamState.actions?.[action]?.hash;
    if (!/^[0-9a-f]{64}$/.test(hash ?? "")) {
      fail(`team ${team.teamNumber} is missing transaction ${action}`);
    } else {
      allHashes.push(hash);
    }
  }

  try {
    const issuer = view(ADMIN_ALIAS, "get_issuer", ["--issuer", issuerAddress]);
    if (issuer?.address !== issuerAddress || issuer?.name !== team.scenario.issuerName) {
      fail(`team ${team.teamNumber} issuer record does not match the plan`);
    } else if (statusName(issuer.status) !== "approved") {
      fail(`team ${team.teamNumber} issuer is not approved`);
    } else {
      pass(`team ${team.teamNumber} issuer approved`);
    }

    const credential = view(ADMIN_ALIAS, "get_certificate", [
      "--cert_hash",
      team.certificateHash,
    ]);
    if (
      credential?.owner !== candidateAddress ||
      credential?.issuer !== issuerAddress ||
      credential?.title !== team.scenario.credentialTitle
    ) {
      fail(`team ${team.teamNumber} credential record does not match the plan`);
    } else if (statusName(credential.status) !== "verified") {
      fail(`team ${team.teamNumber} credential is not verified`);
    } else {
      pass(`team ${team.teamNumber} credential verified`);
    }

    const opportunity = view(ADMIN_ALIAS, "get_opportunity", [
      "--opp_id",
      String(teamState.opportunityId),
    ]);
    if (
      opportunity?.candidate !== candidateAddress ||
      opportunity?.employer !== employerAddress ||
      opportunity?.title !== team.scenario.opportunityTitle
    ) {
      fail(`team ${team.teamNumber} opportunity record does not match the plan`);
    } else if (statusName(opportunity.status) !== "released") {
      fail(`team ${team.teamNumber} opportunity is not released`);
    } else {
      pass(`team ${team.teamNumber} opportunity released`);
    }
  } catch (error) {
    fail(`team ${team.teamNumber} live read failed: ${redactSecrets(error.message)}`);
  }
}

if (allHashes.length !== totals.totalTransactions) {
  fail(`expected ${totals.totalTransactions} transaction hashes, found ${allHashes.length}`);
} else if (new Set(allHashes).size !== allHashes.length) {
  fail("transaction hashes are not unique");
} else {
  pass(`${allHashes.length} unique transaction hashes recorded`);
}

try {
  const releasedDemo = view(ADMIN_ALIAS, "get_opportunity", ["--opp_id", "0"]);
  const fundedDemo = view(ADMIN_ALIAS, "get_opportunity", ["--opp_id", "1"]);
  if (statusName(releasedDemo.status) !== "released") {
    fail("demo opportunity 0 no longer has released status");
  } else {
    pass("demo opportunity 0 remains released");
  }
  if (statusName(fundedDemo.status) !== "funded") {
    fail("demo opportunity 1 no longer has funded status");
  } else {
    pass("demo opportunity 1 remains funded");
  }
} catch (error) {
  fail(`demo exhibit verification failed: ${redactSecrets(error.message)}`);
}

if (failures.length > 0) {
  console.error(`Guided QA verification failed with ${failures.length} issue(s).`);
  process.exit(1);
}
console.log("Guided QA verification passed.");

