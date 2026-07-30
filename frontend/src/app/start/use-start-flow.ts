"use client";
import { useReducer } from "react";

export type Step = "welcome" | "connect" | "fund" | "action" | "signing" | "success";
export type FlowAction = "issuer" | "tip";

export type FlowState = {
  step: Step;
  action: FlowAction | null;
  issuerName: string;
  issuerCategory: string;
  tipXlm: number;
  txHash: string | null;
  error: string | null;
};

export type FlowEvent =
  | { type: "START" }
  | { type: "CONNECTED" }
  | { type: "FUNDED" }
  | { type: "CHOOSE_ACTION"; action: FlowAction }
  // Split by field type so the key and value stay correlated. A single
  // `key: ... ; value: string | number` variant type-checked
  // SET_FIELD("tipXlm", "abc"), which would put a string where the submit gate
  // and stroop conversion both expect a number.
  | { type: "SET_FIELD"; key: "issuerName" | "issuerCategory"; value: string }
  | { type: "SET_FIELD"; key: "tipXlm"; value: number }
  | { type: "SUBMIT" }
  | { type: "SUCCESS"; hash: string }
  | { type: "ERROR"; message: string }
  | { type: "RETRY" }
  | { type: "RESET" };

export const initialFlowState: FlowState = {
  step: "welcome",
  action: null,
  issuerName: "",
  issuerCategory: "",
  tipXlm: 1,
  txHash: null,
  error: null,
};

export function startReducer(state: FlowState, event: FlowEvent): FlowState {
  switch (event.type) {
    case "START":
      return { ...state, step: "connect" };
    case "CONNECTED":
      return { ...state, step: "fund" };
    case "FUNDED":
      return { ...state, step: "action" };
    case "CHOOSE_ACTION":
      return { ...state, action: event.action, error: null };
    case "SET_FIELD":
      // Branch per field rather than spreading a computed key: a computed key
      // over a union widens the value type back to string | number and loses
      // the correlation the event type just established.
      return event.key === "tipXlm"
        ? { ...state, tipXlm: event.value }
        : { ...state, [event.key]: event.value };
    case "SUBMIT":
      return { ...state, step: "signing", error: null };
    case "SUCCESS":
      return { ...state, step: "success", txHash: event.hash };
    case "ERROR":
      return { ...state, step: "action", error: event.message };
    case "RETRY":
      return { ...state, error: null };
    case "RESET":
      return { ...initialFlowState };
    default: {
      // Exhaustiveness guard: every FlowEvent variant is handled above, so
      // `event` is `never` here. Add a variant without a case and this stops
      // compiling instead of silently falling through to a no-op.
      const unhandled: never = event;
      void unhandled;
      return state;
    }
  }
}

export function useStartFlow() {
  return useReducer(startReducer, initialFlowState);
}
