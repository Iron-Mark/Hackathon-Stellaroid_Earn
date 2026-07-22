"use client";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { humanizeError } from "@/lib/errors";
import { registerIssuerAction, sendTipAction } from "@/lib/start-flow";
import { StepShell } from "./step-shell";
import type { FlowEvent, FlowState } from "@/app/start/use-start-flow";

export function ActionStep({
  state,
  dispatch,
}: {
  state: FlowState;
  dispatch: (e: FlowEvent) => void;
}) {
  const { wallet } = useFreighterWallet();

  async function run() {
    if (!wallet.address) return;
    dispatch({ type: "SUBMIT" });
    try {
      const res =
        state.action === "tip"
          ? await sendTipAction(wallet.address, state.tipXlm)
          : await registerIssuerAction(wallet.address, state.issuerName.trim(), state.issuerCategory.trim());
      dispatch({ type: "SUCCESS", hash: res.hash });
    } catch (err) {
      dispatch({ type: "ERROR", message: humanizeError(err).detail });
    }
  }

  const canSubmit =
    state.action === "tip"
      ? state.tipXlm > 0
      : state.issuerName.trim().length > 1 && state.issuerCategory.trim().length > 0;

  return (
    <StepShell stepIndex={4} total={5} title="Pick one thing to do on-chain">
      {state.error && (
        <p aria-live="polite" className="text-xs text-danger">
          {state.error}
        </p>
      )}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => dispatch({ type: "CHOOSE_ACTION", action: "issuer" })}
          aria-pressed={state.action === "issuer"}
          className={`rounded-xl border p-4 text-left ${state.action === "issuer" ? "border-primary bg-primary/10" : "border-border"}`}
        >
          <span className="block text-sm font-semibold text-text">Register your org as an issuer</span>
          <span className="block text-xs text-text-muted">Put your organization on-chain as a credential issuer.</span>
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "CHOOSE_ACTION", action: "tip" })}
          aria-pressed={state.action === "tip"}
          className={`rounded-xl border p-4 text-left ${state.action === "tip" ? "border-primary bg-primary/10" : "border-border"}`}
        >
          <span className="block text-sm font-semibold text-text">Send a testnet tip to a graduate</span>
          <span className="block text-xs text-text-muted">Pay testnet XLM against a verified credential.</span>
        </button>
      </div>

      {state.action === "issuer" && (
        <div className="flex flex-col gap-2">
          <input
            aria-label="Organization name"
            placeholder="Organization name"
            value={state.issuerName}
            onChange={(e) => dispatch({ type: "SET_FIELD", key: "issuerName", value: e.target.value })}
            className="min-h-11 rounded-lg border border-border bg-surface-2 px-3 text-sm text-text"
          />
          <input
            aria-label="Category"
            placeholder="Category (e.g. Bootcamp, University)"
            value={state.issuerCategory}
            onChange={(e) => dispatch({ type: "SET_FIELD", key: "issuerCategory", value: e.target.value })}
            className="min-h-11 rounded-lg border border-border bg-surface-2 px-3 text-sm text-text"
          />
        </div>
      )}

      {state.action === "tip" && (
        <div className="flex gap-2" role="group" aria-label="Tip amount">
          {[1, 5, 10].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => dispatch({ type: "SET_FIELD", key: "tipXlm", value: amt })}
              aria-pressed={state.tipXlm === amt}
              className={`min-h-11 flex-1 rounded-lg border text-sm font-semibold ${state.tipXlm === amt ? "border-primary bg-primary/10 text-primary" : "border-border text-text"}`}
            >
              {amt} XLM
            </button>
          ))}
        </div>
      )}

      {state.action && (
        <button
          type="button"
          onClick={() => void run()}
          disabled={!canSubmit}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-primary"
        >
          Sign it
        </button>
      )}
    </StepShell>
  );
}
