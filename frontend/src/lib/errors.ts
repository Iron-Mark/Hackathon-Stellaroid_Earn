export type HumanError = {
  title: string;
  detail: string;
  recoverable: boolean;
};

export function humanizeError(err: unknown): HumanError {
  try {
    const rawMessage =
      err instanceof Error ? err.message : typeof err === "string" ? err : "";
    const message = rawMessage.toLowerCase();
    const name = err instanceof Error ? err.name.toLowerCase() : "";

    // User rejected / declined / denied
    if (
      message.includes("user rejected") ||
      message.includes("declined") ||
      message.includes("denied")
    ) {
      return {
        title: "Signing declined",
        detail: "You cancelled the request in Freighter. Try again when ready.",
        recoverable: true,
      };
    }

    // Network mismatch / wrong network
    if (
      message.includes("network mismatch") ||
      message.includes("wrong network")
    ) {
      return {
        title: "Wrong network",
        detail: "Switch Freighter to the Stellar testnet and try again.",
        recoverable: true,
      };
    }

    if (
      message.includes("missing contract configuration") ||
      message.includes("next_public_soroban_contract_id")
    ) {
      return {
        title: "Missing app configuration",
        detail:
          "Set NEXT_PUBLIC_SOROBAN_CONTRACT_ID in frontend/.env.local and restart the app.",
        recoverable: false,
      };
    }

    if (message.includes("bad union switch")) {
      return {
        title: "RPC/XDR compatibility issue",
        detail:
          "The transaction reached RPC, but response decoding failed. Update frontend dependencies and confirm the contract ABI matches this app build.",
        recoverable: true,
      };
    }

    if (message.includes("not currently connected to freighter")) {
      return {
        title: "Freighter not connected",
        detail:
          "Click 'Connect Freighter' and approve the connection for this site, then try again.",
        recoverable: true,
      };
    }

    if (
      message.includes("freighter is not available") ||
      message.includes("could not establish connection to freighter") ||
      message.includes("unsupported")
    ) {
      return {
        title: "Freighter unavailable",
        detail:
          "Open the app in a browser with the Freighter extension installed and unlocked.",
        recoverable: false,
      };
    }

    // Timeout (from withTimeout)
    if (message.startsWith("timeout:")) {
      return {
        title: "Still settling\u2026",
        detail:
          "Testnet is slow right now \u2014 your transaction may still confirm. Check the explorer.",
        recoverable: true,
      };
    }

    // Simulation failed
    if (message.includes("simulation failed") || message.includes("simulate")) {
      return {
        title: "Transaction simulation failed",
        detail:
          "The contract rejected this input. Double-check addresses and hash format.",
        recoverable: true,
      };
    }

    // InvalidExpiry (#18) must run before includes("#8") because "#18"
    // contains the substring "#8", and before the generic "invalid" catch.
    if (
      message.includes("invalidexpiry") ||
      message.includes("invalid expiry") ||
      message.includes("#18")
    ) {
      return {
        title: "Invalid expiry",
        detail:
          "Pick a future validity date, or leave the field empty for no expiry.",
        recoverable: true,
      };
    }

    // Unauthorized / auth / #3
    if (
      message.includes("unauthorized") ||
      message.includes(" auth") ||
      message.includes("#3") ||
      name.includes("unauthorized")
    ) {
      return {
        title: "Not authorized",
        detail: "This action requires a different signer.",
        recoverable: false,
      };
    }

    if (
      message.includes("issuer not found") ||
      message.includes("no issuer registry") ||
      message.includes("#7")
    ) {
      return {
        title: "Issuer not registered",
        detail:
          "This wallet is not registered as an issuer. Ask the contract admin to add it first.",
        recoverable: false,
      };
    }

    if (message.includes("issuer is not approved") || message.includes("#8")) {
      return {
        title: "Issuer pending approval",
        detail:
          "This issuer has not been approved yet, so it cannot publish or verify credentials.",
        recoverable: false,
      };
    }

    if (message.includes("issuer has been suspended") || message.includes("#9")) {
      return {
        title: "Issuer suspended",
        detail:
          "This issuer is suspended and cannot publish or verify credentials right now.",
        recoverable: false,
      };
    }

    // Not found / #5
    if (message.includes("not found") || message.includes("#5")) {
      return {
        title: "Not found",
        detail: "No record for that certificate hash yet.",
        recoverable: true,
      };
    }

    // Already exists / duplicate / #4
    if (
      message.includes("already exists") ||
      message.includes("duplicate") ||
      message.includes("#4")
    ) {
      return {
        title: "Already registered",
        detail: "This certificate hash is already on-chain.",
        recoverable: false,
      };
    }

    if (
      message.includes("credential has been revoked") ||
      message.includes("#11")
    ) {
      return {
        title: "Credential revoked",
        detail:
          "This credential has been revoked and can no longer be used for verification or payment.",
        recoverable: false,
      };
    }

    if (
      message.includes("credential has expired") ||
      message.includes("#12")
    ) {
      return {
        title: "Credential expired",
        detail:
          "This credential has expired and is no longer eligible for verification-based actions.",
        recoverable: false,
      };
    }

    if (
      message.includes("opportunity not found") ||
      message.includes("opportunitynotfound") ||
      message.includes("#13")
    ) {
      return {
        title: "Opportunity not found",
        detail:
          "No opportunity exists with that ID. It may not have been created yet.",
        recoverable: true,
      };
    }

    if (message.includes("already funded") || message.includes("#14")) {
      return {
        title: "Already funded",
        detail:
          "This opportunity has already been funded. You cannot fund it again.",
        recoverable: false,
      };
    }

    if (message.includes("invalid milestone") || message.includes("#15")) {
      return {
        title: "Invalid milestone",
        detail:
          "The milestone action is not valid for the current state of this opportunity.",
        recoverable: true,
      };
    }

    if (
      message.includes("invalid opportunity") ||
      message.includes("invalidopportunitystatus") ||
      message.includes("#16")
    ) {
      return {
        title: "Invalid opportunity state",
        detail:
          "That action is blocked by the opportunity's current status. Refresh and try again.",
        recoverable: true,
      };
    }

    if (message.includes("payment locked") || message.includes("#17")) {
      return {
        title: "Payment locked",
        detail:
          "Funds are locked in escrow and cannot be moved until the opportunity status allows it.",
        recoverable: false,
      };
    }

    if (
      message.includes("current status") ||
      message.includes("invalidstatus") ||
      message.includes("#10")
    ) {
      return {
        title: "Invalid credential state",
        detail:
          "That action is blocked by the credential's current status. Refresh the proof and try again.",
        recoverable: true,
      };
    }

    // Invalid input / invalid / #6 or client-side validation
    if (
      message.includes("invalid input") ||
      message.includes("invalid") ||
      message.includes("#6") ||
      message.includes("64 hexadecimal") ||
      message.includes("stellar address")
    ) {
      return {
        title: "Invalid input",
        detail:
          "Check the student wallet address and that the hash is 64 hex characters.",
        recoverable: true,
      };
    }

    // Fetch failed / network error / ECONNREFUSED
    if (
      message.includes("fetch failed") ||
      message.includes("network error") ||
      message.includes("econnrefused") ||
      message.includes("failed to fetch")
    ) {
      return {
        title: "Connection problem",
        detail: "Could not reach the Stellar RPC. Check your internet.",
        recoverable: true,
      };
    }

    if (
      message.includes("tx_insufficient_balance") ||
      message.includes("op_underfunded") ||
      message.includes("balance") ||
      message.includes("underfunded")
    ) {
      return {
        title: "Insufficient balance",
        detail:
          "Fund the signing testnet wallet with Friendbot, then try again.",
        recoverable: true,
      };
    }

    if (
      message.includes("tx_no_source_account") ||
      message.includes("op_no_account")
    ) {
      return {
        title: "Wallet not funded",
        detail:
          "This testnet wallet does not exist on-chain yet. Fund it with Friendbot first.",
        recoverable: true,
      };
    }

    if (message.includes("false")) {
      return {
        title: "Certificate not found",
        detail:
          "That hash is not registered yet, so it cannot be marked verified.",
        recoverable: true,
      };
    }

    // Fallback
    return {
      title: "Transaction failed",
      detail:
        rawMessage ||
        "Please try again. If this keeps happening, check the explorer.",
      recoverable: true,
    };
  } catch {
    return {
      title: "Transaction failed",
      detail: "Please try again. If this keeps happening, check the explorer.",
      recoverable: true,
    };
  }
}

/** True when the live WASM has no such host function (v3.0.0 vs newer source). */
export function isMissingContractMethod(err: unknown): boolean {
  const message = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    message.includes("unknown function") ||
    message.includes("no such function") ||
    message.includes("function not found") ||
    message.includes("invalid function name") ||
    message.includes("wasm, invalidaction") ||
    message.includes("wasm invalidaction") ||
    /error\(wasm,\s*invalidaction\)/.test(message)
  );
}
