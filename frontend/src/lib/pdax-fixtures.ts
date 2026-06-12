export const PDAX_FIXTURE_BALANCES = [
  {
    currency: "PHP",
    available: "2500.00",
    hold: "0.00",
    total: "2500.00",
    updatedAt: "2026-01-15T08:30:00.000Z",
  },
  {
    currency: "XLM",
    available: "145.7500000",
    hold: "10.0000000",
    total: "155.7500000",
    updatedAt: "2026-01-15T08:30:00.000Z",
  },
] as const;

export const PDAX_FIXTURE_TICKERS = {
  "XLM/PHP": {
    pair: "XLM/PHP",
    bid: "6.1800",
    ask: "6.2400",
    last: "6.2100",
    volume24h: "125430.5000000",
    quoteVolume24h: "778923.4050",
    timestamp: "2026-01-15T08:30:00.000Z",
  },
  "USDC/PHP": {
    pair: "USDC/PHP",
    bid: "58.1200",
    ask: "58.1800",
    last: "58.1500",
    volume24h: "89340.1200000",
    quoteVolume24h: "5195107.9780",
    timestamp: "2026-01-15T08:30:00.000Z",
  },
} as const;

export const PDAX_FIXTURE_TRANSACTIONS = [
  {
    id: "pdax_txn_mock_001",
    type: "crypto_out",
    asset: "XLM",
    amount: "50.0000000",
    fee: "0.0200000",
    status: "completed",
    referenceId: "proof_mock_001",
    txHash: "74f7c82b93f2eaf0e1b7f90caa66a70b91e5f02bacef96c9ea1c94d8b2c79a10",
    createdAt: "2026-01-15T08:20:00.000Z",
    updatedAt: "2026-01-15T08:25:00.000Z",
  },
  {
    id: "pdax_txn_mock_002",
    type: "buy",
    asset: "XLM",
    amount: "105.7500000",
    fee: "5.00",
    status: "completed",
    referenceId: "order_mock_002",
    txHash: null,
    createdAt: "2026-01-15T07:45:00.000Z",
    updatedAt: "2026-01-15T07:45:30.000Z",
  },
] as const;

export const PDAX_FIXTURE_CRYPTO_OUT_DRY_RUN = {
  asset: "XLM",
  amount: "12.2500000",
  address: "GCFXWBUR7H2M6P4LLQQY4M72PY3UQNQ5C3YV2SGH3VNKYZW3WTHX6Z2Q",
  network: "stellar-testnet",
  fee: "0.0200000",
  totalDebit: "12.2700000",
  estimatedArrival: "2026-01-15T08:35:00.000Z",
  referenceId: "dryrun_mock_20260115_083000",
  warnings: [],
} as const;
