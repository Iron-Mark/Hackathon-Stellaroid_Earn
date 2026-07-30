import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTOR_COUNT,
  CONTRACT_ID,
  EXPECTED_ADMIN_ADDRESS,
  actorAlias,
  allActors,
  assertSafeTarget,
  buildCohortPlan,
  expectedTotals,
  redactSecrets,
} from "./guided-qa-cohort-lib.mjs";

test("builds eight natural, unique three-actor teams", () => {
  const plan = buildCohortPlan();
  const actors = allActors(plan);
  assert.equal(plan.length, 8);
  assert.equal(actors.length, ACTOR_COUNT);
  assert.equal(new Set(actors.map((actor) => actor.alias)).size, ACTOR_COUNT);
  assert.equal(new Set(plan.map((team) => team.certificateHash)).size, 8);
  assert.ok(plan.every((team) => !/QA|synthetic/i.test(team.scenario.issuerName)));
});

test("uses stable zero-padded actor aliases", () => {
  assert.equal(actorAlias(1), "qa-actor-01");
  assert.equal(actorAlias(24), "qa-actor-24");
  assert.throws(() => actorAlias(25), /between 1 and 24/);
});

test("hard blocks any target except the approved testnet deployment", () => {
  assert.doesNotThrow(() =>
    assertSafeTarget({
      network: "testnet",
      contractId: CONTRACT_ID,
      adminAddress: EXPECTED_ADMIN_ADDRESS,
    }),
  );
  assert.throws(
    () =>
      assertSafeTarget({
        network: "public",
        contractId: CONTRACT_ID,
        adminAddress: EXPECTED_ADMIN_ADDRESS,
      }),
    /non-testnet/,
  );
});

test("redacts Stellar secrets and 24-word seed phrases", () => {
  const stellarSecret = `S${"A".repeat(55)}`;
  const seed = Array.from({ length: 24 }, () => "apple").join(" ");
  const result = redactSecrets(`${stellarSecret}\n${seed}`);
  assert.doesNotMatch(result, /S[A-Z2-7]{55}/);
  assert.match(result, /REDACTED_STELLAR_SECRET/);
  assert.match(result, /REDACTED_SEED_PHRASE/);
});

test("reports the approved transaction totals", () => {
  assert.deepEqual(expectedTotals(), {
    actors: 24,
    teams: 8,
    actorSignedTransactions: 64,
    facilitatorTransactions: 8,
    totalTransactions: 72,
    approvedIssuers: 8,
    verifiedCredentials: 8,
    releasedOpportunities: 8,
  });
});

