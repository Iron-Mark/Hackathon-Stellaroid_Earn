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
