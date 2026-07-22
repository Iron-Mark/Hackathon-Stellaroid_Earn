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
  | { type: "SET_FIELD"; key: "issuerName" | "issuerCategory" | "tipXlm"; value: string | number }
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
      return { ...state, [event.key]: event.value };
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
    default:
      return state;
  }
}

export function useStartFlow() {
  return useReducer(startReducer, initialFlowState);
}
