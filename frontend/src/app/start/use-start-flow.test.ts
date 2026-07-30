import assert from "node:assert/strict";
import test from "node:test";
import { startReducer, initialFlowState } from "./use-start-flow.ts";

test("START moves welcome -> connect", () => {
  const s = startReducer(initialFlowState, { type: "START" });
  assert.equal(s.step, "connect");
});

test("CONNECTED -> fund, FUNDED -> action", () => {
  let s = startReducer({ ...initialFlowState, step: "connect" }, { type: "CONNECTED" });
  assert.equal(s.step, "fund");
  s = startReducer(s, { type: "FUNDED" });
  assert.equal(s.step, "action");
});

test("CHOOSE_ACTION records the action and stays on action step", () => {
  const s = startReducer(
    { ...initialFlowState, step: "action" },
    { type: "CHOOSE_ACTION", action: "tip" },
  );
  assert.equal(s.action, "tip");
  assert.equal(s.step, "action");
});

test("SUBMIT -> signing, SUCCESS -> success with hash", () => {
  let s = startReducer({ ...initialFlowState, step: "action", action: "issuer" }, { type: "SUBMIT" });
  assert.equal(s.step, "signing");
  s = startReducer(s, { type: "SUCCESS", hash: "H1" });
  assert.equal(s.step, "success");
  assert.equal(s.txHash, "H1");
});

test("ERROR returns to action with a message; RETRY clears it", () => {
  let s = startReducer({ ...initialFlowState, step: "signing", action: "issuer" }, { type: "ERROR", message: "declined" });
  assert.equal(s.step, "action");
  assert.equal(s.error, "declined");
  s = startReducer(s, { type: "RETRY" });
  assert.equal(s.error, null);
});

test("SET_FIELD writes the string fields without touching the others", () => {
  let s = startReducer(
    { ...initialFlowState, step: "action", action: "issuer" },
    { type: "SET_FIELD", key: "issuerName", value: "Harborlight" },
  );
  assert.equal(s.issuerName, "Harborlight");
  s = startReducer(s, { type: "SET_FIELD", key: "issuerCategory", value: "Bootcamp" });
  assert.equal(s.issuerName, "Harborlight");
  assert.equal(s.issuerCategory, "Bootcamp");
  // The unrelated fields and the step must survive a field write.
  assert.equal(s.tipXlm, initialFlowState.tipXlm);
  assert.equal(s.step, "action");
  assert.equal(s.action, "issuer");
});

test("SET_FIELD writes tipXlm as a number", () => {
  const s = startReducer(
    { ...initialFlowState, step: "action", action: "tip" },
    { type: "SET_FIELD", key: "tipXlm", value: 5 },
  );
  assert.equal(s.tipXlm, 5);
  assert.equal(typeof s.tipXlm, "number");
  assert.equal(s.issuerName, "");
});

test("RESET clears every field back to the initial state", () => {
  const dirty = startReducer(
    {
      step: "success",
      action: "tip",
      issuerName: "Harborlight",
      issuerCategory: "Bootcamp",
      tipXlm: 10,
      txHash: "H1",
      error: "stale",
    },
    { type: "RESET" },
  );
  assert.deepEqual(dirty, initialFlowState);
});
