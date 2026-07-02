# Stellar & Freighter Frontend Integration Guide

A comprehensive step-by-step guide for integrating Stellar (Soroban smart contracts) and the Freighter browser wallet into a Next.js frontend.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Install Dependencies](#2-install-dependencies)
3. [Configure Environment Variables](#3-configure-environment-variables)
4. [Set Up App Configuration](#4-set-up-app-configuration)
5. [Define Shared Types](#5-define-shared-types)
6. [Implement the Freighter Wallet Layer](#6-implement-the-freighter-wallet-layer)
7. [Build the Wallet React Hook](#7-build-the-wallet-react-hook)
8. [Implement the Contract Client](#8-implement-the-contract-client)
   - [8a. Server Setup and Config Guards](#8a-server-setup-and-config-guards)
   - [8b. Argument Serialization](#8b-argument-serialization)
   - [8c. Building Transactions](#8c-building-transactions)
   - [8d. Read-Only Calls (Simulate)](#8d-read-only-calls-simulate)
   - [8e. Write Calls (Sign and Submit)](#8e-write-calls-sign-and-submit)
   - [8f. Return Value Deserialization](#8f-return-value-deserialization)
   - [8g. Error Normalization](#8g-error-normalization)
   - [8h. Exporting Public Contract Functions](#8h-exporting-public-contract-functions)
9. [Helper Utilities](#9-helper-utilities)
   - [9a. Address Validation](#9a-address-validation)
   - [9b. Amount Formatting and Parsing](#9b-amount-formatting-and-parsing)
10. [Wire Everything into a UI Component](#10-wire-everything-into-a-ui-component)
11. [Mark Client Components](#11-mark-client-components)
12. [Full Data Flow Summary](#12-full-data-flow-summary)
13. [Common Pitfalls](#13-common-pitfalls)

---

## 1. Prerequisites

- **Node.js** 20+ and **npm** (or pnpm/yarn)
- **Next.js** 15+ (App Router)
- A deployed **Soroban smart contract** on Testnet or Mainnet
- A funded account to use as a **read address** for simulating read-only queries (can be any funded testnet account)
- The **Freighter browser extension** installed for testing

---

## 2. Install Dependencies

```bash
npm add @stellar/stellar-sdk @stellar/freighter-api
```

| Package | Purpose |
|---|---|
| `@stellar/stellar-sdk` | Build, serialize, and submit Stellar transactions; decode XDR return values |
| `@stellar/freighter-api` | Communicate with the Freighter browser extension to read wallet state and sign transactions |

---

## 3. Configure Environment Variables

Create a `.env` file (and a committed `.env.example` without secrets):

```env
# RPC endpoint for Soroban (testnet or mainnet)
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# Network identifier: TESTNET or PUBLIC
NEXT_PUBLIC_STELLAR_NETWORK=TESTNET

# Network passphrase (must match the deployed contract's network)
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Your deployed Soroban contract ID
NEXT_PUBLIC_SOROBAN_CONTRACT_ID=

# A funded Stellar account used only for simulating read-only contract calls
NEXT_PUBLIC_STELLAR_READ_ADDRESS=

# Token/asset details
NEXT_PUBLIC_SOROBAN_ASSET_ADDRESS=
NEXT_PUBLIC_SOROBAN_ASSET_CODE=XLM
NEXT_PUBLIC_SOROBAN_ASSET_DECIMALS=7

# Block explorer base URL
NEXT_PUBLIC_STELLAR_EXPLORER_URL=https://stellar.expert/explorer/testnet
```

> **Why a read address?** Soroban's `simulateTransaction` requires a valid source account on-chain. For read-only calls where no user is signed in, you supply a pre-funded account so reads still work anonymously.

---

## 4. Set Up App Configuration

Centralize all environment variable reads in a single config module. This avoids scattered `process.env` calls throughout the codebase and makes the app easy to reconfigure.

```typescript
// src/lib/config.ts
import { Networks } from "@stellar/stellar-sdk";

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

const configuredPassphrase =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? TESTNET_PASSPHRASE;

export const appConfig = {
  rpcUrl:
    process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org",
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "TESTNET",
  networkPassphrase: configuredPassphrase,
  contractId: process.env.NEXT_PUBLIC_SOROBAN_CONTRACT_ID ?? "",
  assetAddress: process.env.NEXT_PUBLIC_SOROBAN_ASSET_ADDRESS ?? "",
  assetCode: process.env.NEXT_PUBLIC_SOROBAN_ASSET_CODE ?? "XLM",
  assetDecimals: Number(process.env.NEXT_PUBLIC_SOROBAN_ASSET_DECIMALS ?? "7"),
  explorerUrl:
    process.env.NEXT_PUBLIC_STELLAR_EXPLORER_URL ??
    "https://stellar.expert/explorer/testnet",
  readAddress: process.env.NEXT_PUBLIC_STELLAR_READ_ADDRESS ?? "",
};

// Map network names to their canonical passphrases
const networkPassphraseByName: Record<string, string> = {
  TESTNET: Networks.TESTNET,
  PUBLIC: Networks.PUBLIC,
  PUBNET: Networks.PUBLIC,
};

export function getExpectedNetworkPassphrase() {
  return networkPassphraseByName[appConfig.network] ?? appConfig.networkPassphrase;
}

export function hasRequiredConfig() {
  return Boolean(appConfig.contractId && appConfig.rpcUrl);
}
```

---

## 5. Define Shared Types

Create a `types.ts` file to share types across the wallet layer, contract client, and UI components.

```typescript
// src/lib/types.ts

// Wallet connection lifecycle states
export type WalletStatus = "disconnected" | "connecting" | "connected" | "unsupported";

// Transaction lifecycle states
export type TxState = "idle" | "signing" | "submitting" | "success" | "error";

// Snapshot of the current wallet state
export type WalletSnapshot = {
  status: WalletStatus;
  address: string | null;
  network: string | null;
  networkPassphrase: string | null;
  isExpectedNetwork: boolean;
  error?: string;
};

// UI feedback for in-progress or completed transactions
export type TxFeedback = {
  state: TxState;
  title: string;
  detail?: string;
  hash?: string;
};
```

---

## 6. Implement the Freighter Wallet Layer

This module wraps `@stellar/freighter-api` directly. It has three responsibilities:

1. **Read** the wallet state without prompting the user
2. **Connect** by requesting explicit user approval
3. **Sign** a prepared transaction XDR

```typescript
// src/lib/freighter.ts
"use client";

import {
  getAddress,
  getNetworkDetails,
  isConnected,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";
import { getExpectedNetworkPassphrase, appConfig } from "@/lib/config";
import type { WalletSnapshot } from "@/lib/types";

function buildUnsupportedWallet(error?: string): WalletSnapshot {
  return {
    status: "unsupported",
    address: null,
    network: null,
    networkPassphrase: null,
    isExpectedNetwork: false,
    error: error ?? "Freighter is not available in this browser.",
  };
}

// Reads current wallet state without user interaction
export async function readFreighterWallet(): Promise<WalletSnapshot> {
  const connection = await isConnected();

  if (connection.error) {
    return buildUnsupportedWallet(connection.error);
  }

  if (!connection.isConnected) {
    return {
      status: "disconnected",
      address: null,
      network: null,
      networkPassphrase: null,
      isExpectedNetwork: false,
    };
  }

  // Fetch address and network details in parallel
  const [addressResponse, networkResponse] = await Promise.all([
    getAddress(),
    getNetworkDetails(),
  ]);

  if (addressResponse.error) {
    return {
      status: "disconnected",
      address: null,
      network: null,
      networkPassphrase: null,
      isExpectedNetwork: false,
      error: addressResponse.error,
    };
  }

  if (networkResponse.error) {
    return {
      status: addressResponse.address ? "connected" : "disconnected",
      address: addressResponse.address || null,
      network: null,
      networkPassphrase: null,
      isExpectedNetwork: false,
      error: networkResponse.error,
    };
  }

  const networkPassphrase =
    networkResponse.networkPassphrase || getExpectedNetworkPassphrase();

  // Accept match by either passphrase or network name
  const isExpectedNetwork =
    networkPassphrase === getExpectedNetworkPassphrase() ||
    networkResponse.network === appConfig.network;

  return {
    status: addressResponse.address ? "connected" : "disconnected",
    address: addressResponse.address || null,
    network: networkResponse.network ?? null,
    networkPassphrase,
    isExpectedNetwork,
  };
}

// Triggers the Freighter "approve connection" popup, then reads state
export async function connectFreighterWallet() {
  const access = await requestAccess();

  if (access.error) {
    throw new Error(access.error);
  }

  return readFreighterWallet();
}

// Signs a raw transaction XDR string using Freighter
export async function signWithFreighter(transactionXdr: string, address: string) {
  const result = await signTransaction(transactionXdr, {
    networkPassphrase: getExpectedNetworkPassphrase(),
    address,
  });

  if (result.error || !result.signedTxXdr) {
    throw new Error(result.error ?? "Freighter did not return a signed transaction.");
  }

  return result.signedTxXdr;
}
```

---

## 7. Build the Wallet React Hook

This hook owns the `WalletSnapshot` React state and exposes stable actions to the UI. It auto-reads the wallet on mount so sessions persist across page loads.

```typescript
// src/hooks/use-freighter-wallet.ts
"use client";

import { useEffect, useState } from "react";
import { connectFreighterWallet, readFreighterWallet } from "@/lib/freighter";
import type { WalletSnapshot } from "@/lib/types";

const initialWalletState: WalletSnapshot = {
  status: "disconnected",
  address: null,
  network: null,
  networkPassphrase: null,
  isExpectedNetwork: false,
};

export function useFreighterWallet() {
  const [wallet, setWallet] = useState<WalletSnapshot>(initialWalletState);

  // Re-read wallet state without a connect popup
  async function refreshWallet() {
    setWallet((current) => ({
      ...current,
      status: current.status === "unsupported" ? "unsupported" : "connecting",
    }));

    try {
      const snapshot = await readFreighterWallet();
      setWallet(snapshot);
      return snapshot;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to read wallet state.";
      const fallback: WalletSnapshot = {
        status: "unsupported",
        address: null,
        network: null,
        networkPassphrase: null,
        isExpectedNetwork: false,
        error: message,
      };
      setWallet(fallback);
      return fallback;
    }
  }

  // Triggers the Freighter extension connection popup
  async function connectWallet() {
    setWallet((current) => ({ ...current, status: "connecting" }));
    const snapshot = await connectFreighterWallet();
    setWallet(snapshot);
    return snapshot;
  }

  // Local-only disconnect (does not revoke Freighter permissions)
  function disconnectWallet() {
    setWallet(initialWalletState);
  }

  // Auto-restore session on mount
  useEffect(() => {
    void refreshWallet();
  }, []);

  return { wallet, connectWallet, disconnectWallet, refreshWallet };
}
```

---

## 8. Implement the Contract Client

This is the core module that bridges the frontend to the Soroban smart contract. It has two interaction modes: **simulate** (reads) and **sign-and-submit** (writes).

### 8a. Server Setup and Config Guards

```typescript
// src/lib/contract-client.ts
"use client";

import {
  Address,
  BASE_FEE,
  Operation,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
} from "@stellar/stellar-sdk";
import { appConfig, getExpectedNetworkPassphrase, hasRequiredConfig } from "@/lib/config";
import { signWithFreighter } from "@/lib/freighter";

// Creates a configured RPC server instance
function getServer() {
  return new rpc.Server(appConfig.rpcUrl, {
    // Allow HTTP for local development RPC endpoints
    allowHttp: appConfig.rpcUrl.startsWith("http://"),
  });
}

// Throws early if required env vars are missing
function ensureConfigured() {
  if (!hasRequiredConfig()) {
    throw new Error(
      "Missing contract configuration. Set the frontend environment variables first."
    );
  }
}
```

### 8b. Argument Serialization

Soroban functions receive arguments as XDR `ScVal` types. Use `nativeToScVal` with an explicit type hint for correct encoding:

```typescript
type ContractArg = {
  value: string | bigint | number;
  type: "address" | "i128" | "u32" | "string";
};

function buildArgs(values: ContractArg[]) {
  return values.map((entry) => nativeToScVal(entry.value, { type: entry.type }));
}
```

| Stellar/Soroban type | Use for |
|---|---|
| `"address"` | Stellar public keys and contract IDs |
| `"u32"` | Unsigned 32-bit integers (IDs, counts) |
| `"i128"` | Token amounts (supports large decimals) |
| `"string"` | UTF-8 strings |

### 8c. Building Transactions

```typescript
async function buildTransaction(
  sourceAddress: string,
  method: string,
  args: ReturnType<typeof buildArgs>
) {
  const server = getServer();
  const sourceAccount = await server.getAccount(sourceAddress);

  return new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: getExpectedNetworkPassphrase(),
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: appConfig.contractId,
        function: method,
        args,
      })
    )
    .setTimeout(30)
    .build();
}
```

### 8d. Read-Only Calls (Simulate)

For queries that only read state, use `simulateTransaction`. This never broadcasts to the network and does not require a signature — so the source account can be any funded address.

```typescript
async function simulateRead<T>(
  sourceAddress: string,
  method: string,
  args: ReturnType<typeof buildArgs>,
  transform: (value: unknown) => T,
) {
  ensureConfigured();
  const server = getServer();
  const transaction = await buildTransaction(sourceAddress, method, args);
  const simulation = await server.simulateTransaction(transaction);

  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(normalizeError(simulation.error));
  }

  if (!simulation.result?.retval) {
    throw new Error(`Simulation for ${method} returned no value.`);
  }

  // Decode XDR return value to a native JS type, then apply your normalizer
  return transform(scValToNative(simulation.result.retval));
}
```

### 8e. Write Calls (Sign and Submit)

For state-changing operations, the full flow is:

1. **Build** the transaction
2. **Prepare** it (RPC adds the correct footprint and fee)
3. **Sign** it via Freighter
4. **Submit** it
5. **Poll** until confirmed or failed

```typescript
async function signAndSubmit<T>(
  sourceAddress: string,
  method: string,
  args: ReturnType<typeof buildArgs>,
  transformReturn?: (value: unknown) => T,
) {
  ensureConfigured();
  const server = getServer();

  // Step 1: Build
  const transaction = await buildTransaction(sourceAddress, method, args);

  // Step 2: Prepare (simulation adds footprint/fees)
  const preparedTransaction = await server.prepareTransaction(transaction);

  // Step 3: Sign via Freighter
  const signedXdr = await signWithFreighter(
    preparedTransaction.toXDR(),
    sourceAddress
  );
  const signedTransaction = TransactionBuilder.fromXDR(
    signedXdr,
    getExpectedNetworkPassphrase()
  );

  // Step 4: Submit
  const sendResponse = await server.sendTransaction(signedTransaction);
  if (sendResponse.status !== "PENDING") {
    throw new Error(normalizeError(sendResponse.errorResult ?? sendResponse.status));
  }

  // Step 5: Poll for confirmation
  const finalResponse = await server.pollTransaction(sendResponse.hash, {
    attempts: 20,
    sleepStrategy: () => 1200, // 1.2 seconds between polls
  });

  if (finalResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    throw new Error("Transaction submitted but not found on the RPC server.");
  }

  if (finalResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
    throw new Error(normalizeError(finalResponse.resultXdr));
  }

  return {
    hash: sendResponse.hash,
    result:
      transformReturn && finalResponse.returnValue
        ? transformReturn(scValToNative(finalResponse.returnValue))
        : undefined,
  };
}
```

### 8f. Return Value Deserialization

`scValToNative` can return a `Map` or a plain JS object depending on the SDK version and contract type. Write normalizers that handle both:

```typescript
// Reads a field from either a Map or plain object
function readRecordValue(record: unknown, keys: string[]) {
  if (!record || typeof record !== "object") return undefined;

  if (record instanceof Map) {
    for (const key of keys) {
      if (record.has(key)) return record.get(key);
    }
    return undefined;
  }

  const obj = record as Record<string, unknown>;
  for (const key of keys) {
    if (key in obj) return obj[key];
  }
  return undefined;
}

function normalizeAddress(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Address) return value.toString();
  if (value && typeof value === "object" && "toString" in value) return value.toString();
  throw new Error("Unable to parse Stellar address returned by the contract.");
}

function normalizeBigInt(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.trunc(value));
  if (typeof value === "string") return BigInt(value);
  throw new Error("Unable to parse integer value returned by the contract.");
}

function normalizeNumber(value: unknown): number {
  const n = Number(normalizeBigInt(value));
  if (!Number.isSafeInteger(n)) throw new Error("ID or count out of safe integer range.");
  return n;
}

function normalizeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toString" in value) return value.toString();
  throw new Error("Unable to parse string value returned by the contract.");
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  throw new Error("Unable to parse boolean value returned by the contract.");
}
```

### 8g. Error Normalization

Soroban contract errors appear as numeric codes in the error string (e.g., `#1`, `#2`). Map them to human-readable messages that match your Rust `contracterror` enum:

```typescript
function normalizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("#1") || /Unauthorized/i.test(message)) {
    return "Only the allowed wallet can perform this action.";
  }
  if (message.includes("#2") || /InvalidInput/i.test(message)) {
    return "Invalid input provided.";
  }
  if (message.includes("#3") || /NotFound/i.test(message)) {
    return "The requested resource does not exist on-chain.";
  }
  // ... add one entry per error variant in your Rust contract

  return message; // fall back to the raw message
}
```

The corresponding Rust contract error structure for reference:

```rust
#[contracterror]
pub enum Error {
    Unauthorized = 1,
    InvalidInput = 2,
    NotFound = 3,
    // ... add your own variants here
}
```

### 8h. Exporting Public Contract Functions

Each exported function maps 1-to-1 to a contract method. Read functions use `simulateRead`, write functions use `signAndSubmit`:

```typescript
// --- Read functions ---

export async function getRecord(recordId: number) {
  return simulateRead(
    getReadAddress(),
    "get_record",
    buildArgs([{ value: recordId, type: "u32" }]),
    normalizeRecord, // your custom normalizer for the return type
  );
}

export async function checkMembership(recordId: number, walletAddress: string) {
  return simulateRead(
    getReadAddress(),
    "is_member",
    buildArgs([
      { value: recordId, type: "u32" },
      { value: walletAddress, type: "address" },
    ]),
    normalizeBoolean,
  );
}

// --- Write functions ---

export async function createRecord(owner: string, name: string) {
  const response = await signAndSubmit(
    owner,
    "create_record",
    buildArgs([
      { value: owner, type: "address" },
      { value: name, type: "string" },
    ]),
    normalizeNumber,
  );

  return { hash: response.hash, recordId: response.result ?? null };
}

export async function transferAmount(
  from: string,
  recordId: number,
  amount: bigint,
) {
  return signAndSubmit(
    from,
    "transfer",
    buildArgs([
      { value: from, type: "address" },
      { value: recordId, type: "u32" },
      { value: amount, type: "i128" },
    ]),
  );
}
```

---

## 9. Helper Utilities

### 9a. Address Validation

Use the SDK's `Address` parser to validate Stellar addresses on the frontend before submitting transactions:

```typescript
// src/lib/validators.ts
import { Address } from "@stellar/stellar-sdk";

export function isValidStellarAddress(value: string): boolean {
  try {
    Address.fromString(value.trim());
    return true;
  } catch {
    return false;
  }
}

export function requireText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

export function parsePositiveInteger(value: string, label: string): number {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) throw new Error(`${label} must be a positive whole number.`);
  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${label} must be a positive whole number.`);
  return parsed;
}
```

### 9b. Amount Formatting and Parsing

Stellar token amounts are stored as integers with a fixed number of decimal places (7 for XLM native, i.e., stroops). Convert between display strings and on-chain integers:

```typescript
// src/lib/format.ts

// "12.5" with decimals=7 → 125000000n
export function parseAmountToInt(amount: string, decimals: number): bigint {
  const [wholePart, fractionPart = ""] = amount.trim().split(".");
  if (fractionPart.length > decimals) {
    throw new Error(`Use at most ${decimals} decimal places for this asset.`);
  }
  const whole = BigInt(wholePart);
  const paddedFraction = fractionPart.padEnd(decimals, "0");
  const fraction = paddedFraction ? BigInt(paddedFraction) : 0n;
  const result = whole * 10n ** BigInt(decimals) + fraction;
  if (result <= 0n) throw new Error("Amount must be greater than zero.");
  return result;
}

// 125000000n with decimals=7 → "12.5"
export function formatAmount(value: bigint, decimals: number): string {
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = value % base;
  if (fraction === 0n) return whole.toString();
  const trimmed = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole}.${trimmed}`;
}

// "GDIX...RV2M"
export function shortenAddress(address: string | null, size = 6): string {
  if (!address) return "Not connected";
  return `${address.slice(0, size)}...${address.slice(-size)}`;
}
```

---

## 10. Wire Everything into a UI Component

In your dashboard component, consume the hook and client functions together:

```typescript
// src/components/contract-dashboard.tsx
"use client";

import { useState } from "react";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { transferAmount } from "@/lib/contract-client";
import { parseAmountToInt } from "@/lib/format";
import { appConfig } from "@/lib/config";
import type { TxFeedback } from "@/lib/types";

export function ContractDashboard() {
  const { wallet, connectWallet, disconnectWallet } = useFreighterWallet();
  const [txFeedback, setTxFeedback] = useState<TxFeedback>({ state: "idle", title: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gate all contract writes behind this check
  const actionsBlocked =
    isSubmitting ||
    wallet.status !== "connected" ||
    !wallet.address ||
    !wallet.isExpectedNetwork;

  async function handleTransfer(recordId: number, amountInput: string) {
    if (!wallet.address) return;

    setIsSubmitting(true);
    setTxFeedback({ state: "signing", title: "Awaiting signature in Freighter..." });

    try {
      const amount = parseAmountToInt(amountInput, appConfig.assetDecimals);
      const result = await transferAmount(wallet.address, recordId, amount);

      setTxFeedback({
        state: "success",
        title: "Transaction confirmed",
        hash: result?.hash,
      });
    } catch (error) {
      setTxFeedback({
        state: "error",
        title: "Transaction failed",
        detail: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      {wallet.status !== "connected" ? (
        <button onClick={connectWallet} disabled={wallet.status === "connecting"}>
          Connect Freighter
        </button>
      ) : (
        <button onClick={disconnectWallet}>Disconnect</button>
      )}

      {!wallet.isExpectedNetwork && wallet.status === "connected" && (
        <p>Switch Freighter to {appConfig.network} to use this app.</p>
      )}

      {/* Disable all action buttons when actionsBlocked is true */}
    </div>
  );
}
```

---

## 11. Mark Client Components

Every file that uses Freighter, React hooks, or browser APIs **must** have the `"use client"` directive as its first line. This applies to:

- `src/lib/freighter.ts` — calls browser extension APIs
- `src/lib/contract-client.ts` — calls Freighter for signing
- `src/hooks/use-freighter-wallet.ts` — uses `useState` and `useEffect`
- `src/components/contract-dashboard.tsx` — uses React state

Server Components in Next.js App Router cannot access the browser extension or React state hooks.

---

## 12. Full Data Flow Summary

### Wallet Connection

```
User clicks "Connect Freighter"
  → connectWallet() in hook
    → connectFreighterWallet() in freighter.ts
      → requestAccess() [Freighter popup shown]
      → readFreighterWallet() [reads address + network]
    → setWallet(snapshot) [React state updated]
  → UI re-renders with wallet.address
```

### Read-Only Contract Query

```
Component calls getRecord(recordId)
  → simulateRead(readAddress, "get_record", args, normalizeRecord)
    → buildTransaction(readAddress, "get_record", args)
      → server.getAccount(readAddress) [fetch sequence number]
      → TransactionBuilder.build()
    → server.simulateTransaction(tx) [no broadcast, no signature]
    → scValToNative(retval) → normalizeRecord(raw) → RecordData
```

### Write Contract Call (e.g., transfer)

```
User submits transfer form
  → transferAmount(wallet.address, recordId, amount)
    → signAndSubmit(...)
      → buildTransaction(wallet.address, "transfer", args)
      → server.prepareTransaction(tx) [RPC adds footprint + fees]
      → signWithFreighter(xdr, address) [Freighter popup shown]
      → TransactionBuilder.fromXDR(signedXdr)
      → server.sendTransaction(signedTx) [broadcast]
      → server.pollTransaction(hash) [wait for confirmation]
    → returns { hash, result }
  → UI shows success + explorer link
```

---

## 13. Common Pitfalls

| Issue | Cause | Fix |
|---|---|---|
| `isConnected` returns false in dev | Freighter not installed | Install the browser extension; test in a Chromium-based browser |
| `simulateTransaction` fails | `readAddress` not funded on testnet | Fund the account at [friendbot.stellar.org](https://friendbot.stellar.org/) |
| `#1 Unauthorized` error | Wallet address doesn't match the required signer | Ensure the connected wallet has the required permissions for this operation |
| Wrong network passphrase | `NEXT_PUBLIC_STELLAR_NETWORK` mismatch | Ensure `.env` network name matches Freighter's active network |
| `scValToNative` returns a `Map` | SDK version behavior | Write normalizers that check `instanceof Map` before object access |
| Amount precision errors | Passing display amounts directly | Always convert with `parseAmountToInt()` before calling contract functions |
| `"use client"` missing | Forgot directive on a file using hooks/browser APIs | Add `"use client"` as the first line in every such file |
| Transaction times out | `pollTransaction` `attempts` too low | Increase `attempts` and/or `sleepStrategy` delay for slow networks |
