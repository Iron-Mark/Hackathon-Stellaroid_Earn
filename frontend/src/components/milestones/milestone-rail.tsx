export interface MilestoneState {
  registered: boolean;
  verified: boolean;
  paid: boolean;
}

export interface MilestoneRailProps {
  state: MilestoneState;
  orientation?: "horizontal" | "vertical";
  started?: boolean;
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.15" />
      <path
        d="M5.5 10.5L8.5 13.5L14.5 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyCircleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="10"
        cy="10"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

function ActiveCircleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.15" />
      <circle cx="10" cy="10" r="4" fill="currentColor" />
    </svg>
  );
}

type StepStatus = "done" | "active" | "pending";

function getStepStatus(
  stepIndex: number,
  states: boolean[],
): StepStatus {
  if (states[stepIndex]) return "done";
  // active = first step that isn't done
  const firstPending = states.findIndex((s) => !s);
  if (firstPending === stepIndex) return "active";
  return "pending";
}

interface StepProps {
  label: string;
  status: StepStatus;
  vertical?: boolean;
}

function Step({ label, status, vertical }: StepProps) {
  const iconColorClass =
    status === "done"
      ? "text-verified [animation:pixelPop_280ms_cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:animate-none"
      : status === "active"
        ? "text-primary [animation:pulseRing_1.6s_ease-in-out_infinite] motion-reduce:animate-none"
        : "text-text-muted";

  const labelColorClass =
    status === "done"
      ? "text-verified"
      : status === "active"
        ? "text-primary"
        : "text-text-muted";

  const statusHint =
    status === "done" ? "complete" : status === "active" ? "in progress" : "pending";

  return (
    <div className={vertical ? "flex flex-row items-center gap-3 shrink-0" : "flex flex-col items-center gap-2 shrink-0 max-sm:gap-1.5"}>
      <div key={status} className={["w-11 h-11 flex items-center justify-center rounded-full shrink-0", iconColorClass].join(" ")}>
        {status === "done" ? <CheckIcon /> : status === "active" ? <ActiveCircleIcon /> : <EmptyCircleIcon />}
      </div>
      <div className={vertical ? "flex flex-col min-w-0" : undefined}>
        <span className={["font-mono text-[13px] font-medium", vertical ? "" : "text-center max-sm:text-[11px]", labelColorClass].join(" ")}>
          {label}
        </span>
        {vertical && (
          <span className="text-[11px] text-text-muted capitalize">{statusHint}</span>
        )}
        {!vertical && <span className="sr-only"> ({statusHint})</span>}
      </div>
    </div>
  );
}

interface ConnectorProps {
  filled: boolean;
  vertical?: boolean;
}

function Connector({ filled, vertical }: ConnectorProps) {
  return (
    <div
      className={[
        vertical
          ? "w-0.5 h-6 ml-[21px]"
          : "flex-1 h-0.5 min-w-6 mb-5 max-sm:min-w-3",
        filled
          ? vertical ? "bg-linear-to-b from-verified to-verified-strong" : "bg-linear-to-r from-verified to-verified-strong"
          : "bg-border",
      ].join(" ")}
      aria-hidden="true"
    />
  );
}

export function MilestoneRail({ state, orientation = "horizontal", started = true }: MilestoneRailProps) {
  const stepDone = [state.registered, state.verified, state.paid];
  const vertical = orientation === "vertical";

  const registeredStatus = started ? getStepStatus(0, stepDone) : state.registered ? "done" : "pending";
  const verifiedStatus = started ? getStepStatus(1, stepDone) : state.verified ? "done" : "pending";
  const paidStatus = started ? getStepStatus(2, stepDone) : state.paid ? "done" : "pending";

  return (
    <nav
      className={vertical ? "flex flex-col gap-0" : "flex flex-row items-center gap-0 py-4 max-sm:py-2"}
      aria-label="Progress"
    >
      <Step label="Registered" status={registeredStatus} vertical={vertical} />
      <Connector filled={state.registered} vertical={vertical} />
      <Step label="Verified" status={verifiedStatus} vertical={vertical} />
      <Connector filled={state.verified} vertical={vertical} />
      <Step label="Paid" status={paidStatus} vertical={vertical} />
    </nav>
  );
}

export default MilestoneRail;
