# Security Checklist  - Stellaroid Earn

This document records the security controls verified for the Stellaroid Earn MVP
(testnet deployment, Blue Belt / Level 5 submission). Items are checked at the
smart-contract, frontend, infrastructure, and operational layers.

---

## Smart Contract Security

| # | Control | Status | Notes |
|---|---------|--------|-------|
| 1 | **Access control** | PASS | Admin-only functions call `admin.require_auth()` and match the stored admin address before executing. |
| 2 | **Issuer gating** | PASS | `register_certificate` and `verify_certificate` reject callers that do not hold approved issuer status. |
| 3 | **Duplicate prevention** | PASS | Re-submitting an existing certificate hash returns `AlreadyExists`; no silent overwrites. |
| 4 | **Credential lifecycle guards** | PASS | `verify` only transitions a cert from `Issued`; `revoke`/`suspend` check caller authorization before mutating state. |
| 5 | **Expiry enforcement** | PARTIAL | `ensure_not_expired()` rejects records with a nonzero expired timestamp before verification/payment; the current issuer flow sets new credentials to `expires_at = 0`, so there is no automatic expiry transition yet. |
| 6 | **Payment authorization** | PASS | Token transfer only executes when `cert.owner == student` (the submitting address). |
| 7 | **Typed errors** | PASS | `#[contracterror]` enum with 17 variants; frontend `humanizeError()` maps each code to safe, user-facing copy. |
| 8 | **TTL management** | PASS | Storage TTL set to 518,400–1,036,800 ledgers; entries are extended on access to prevent premature archival. |
| 9 | **Re-entrancy** | N/A | Soroban's single-contract execution model makes cross-contract re-entrancy impossible by design. |
| 10 | **Unbounded iteration** | PASS | All storage reads/writes are O(1) keyed lookups; opportunity milestone counts are capped at 24 and UI render paths clamp defensively. |
| 11 | **Source verification** | PASS | The deployed bytecode is reproducible from committed source. Rebuilding the `v3.0.0` release tag yields SHA-256 `1b7479f1…4b9f`, byte-identical to the WASM fetched from testnet, and `verify-contract-source.ps1 -RequireSourceMatch` exits 0. The toolchain is self-evidencing: the deployed WASM records `rsver` 1.95.0, `rssdkver` 26.1.0, and `cliver` 27.0.0 in its own metadata, readable by anyone via `stellar contract info meta`. `.github/workflows/contract-verification.yml` pins those versions, rebuilds the tag weekly, and asserts the hash against both the recorded value and the live on-chain bytecode. Verification targets the release tag rather than `main`, because `main` has since moved the contract path and bumped `soroban-sdk` to 27.0.2, either of which changes the emitted WASM. One documented limitation: the build is host-dependent, so reproduction requires Windows (an identical Linux rebuild yields a different hash); line endings and build path were both ruled out as the cause, and the constraint is recorded in the runbook rather than left to be rediscovered. |

---

## Frontend Security

| # | Control | Status | Notes |
|---|---------|--------|-------|
| 1 | **Content Security Policy** | PASS | `default-src 'self'`; `connect-src` restricted to `https://*.stellar.org` plus the WalletConnect relay (`relay.walletconnect.org` / `verify.walletconnect.org`); `frame-src 'none'` globally; production `script-src` does not allow `unsafe-inline`. |
| 2 | **X-Content-Type-Options** | PASS | `nosniff` header set on all responses. |
| 3 | **X-Frame-Options** | PASS | `DENY` globally; `/proof/[hash]/embed` route permits controlled framing for embed use-case. |
| 4 | **HSTS** | PASS | `max-age=63072000; includeSubDomains; preload` on all routes. |
| 5 | **Referrer-Policy** | PASS | `strict-origin-when-cross-origin` applied via `next.config.ts` headers. |
| 6 | **Permissions-Policy** | PASS | `camera=(), microphone=(), geolocation=()`  - no sensitive device APIs exposed. |
| 7 | **Input validation** | PASS | Proof hashes, token amounts, opportunity milestones, metadata URLs, issuer URLs, and JSON-LD data are validated or sanitized before use. |
| 8 | **Error normalization** | PASS | `humanizeError()` maps all contract and network errors to safe, non-leaking copy. |
| 9 | **SSRF prevention** | PASS | Metadata and evidence URLs must be HTTPS, cannot target localhost/private IP ranges including IPv4-mapped IPv6, and remote metadata fetches use size/time limits. |
| 10 | **No secrets in client bundle** | PASS | All `NEXT_PUBLIC_*` env vars are non-sensitive public config (RPC URL, network passphrase, contract ID). |
| 11 | **Wallet validation** | PASS | Network passphrase returned by Freighter is compared to the expected value before signing; mismatch aborts. |

---

## Infrastructure Security

| # | Control | Status | Notes |
|---|---------|--------|-------|
| 1 | **Automatic HTTPS** | PASS | Hosted on Vercel; TLS termination and certificate renewal are fully managed. |
| 2 | **Small server-side attack surface** | PASS | Server routes are limited to cached health/events and restricted fee sponsorship; fee bump requires bearer auth plus XDR, contract, method, and fee validation. |
| 3 | **CDN caching** | PASS | Dynamic proof routes use `revalidate=60` to reduce RPC load while keeping data fresh. |
| 4 | **Crawl protection** | PASS | `robots.ts` disallows `/proof/*/embed`, `/talent/*`, `/opportunity/*`, and `/api/`. Proof detail pages at `/proof/[hash]` are deliberately left crawlable, because a public credential that cannot be linked or shared defeats the point of publishing it; enumeration is not the threat the design guards against, since a proof URL is a 64-hex SHA-256 and is not guessable. `/status` and `/metrics` are deliberately **not** disallowed either, so that their page-level `noindex` stays readable and therefore enforceable: a path blocked in robots.txt can never be fetched, so its `noindex` is never seen and the URL can still surface as a bare search result. |
| 5 | **Dependency audit** | PASS | **No high or moderate advisory reaches shipped code.** The 2026-07-25 security sweep patched every runtime high/moderate that had surfaced (Next.js SSRF/DoS/cache-confusion; `sharp` libvips CVEs, forced by override so Next's bundled copy is covered; `postcss` override raised to 8.5.23; `fast-uri`, `hono`, and `@hono/node-server` overridden), and the subsequent framework-major bump (Next 16, stellar-sdk 16, zod 4) kept them clear. `npm audit` currently reports 9 high, but all 9 are a **single dev-only advisory** (`brace-expansion` DoS) reached exclusively through the ESLint toolchain (`minimatch` → `@eslint/config-array` / `eslint-config-next` plugins), which the `eslint-config-next 16` bump reintroduced. That code runs only during `npm run lint`, never in the built bundle or at runtime, and the exploit needs an attacker-controlled glob pattern that this repo's static, first-party lint config never supplies. It cannot be overridden to a patched line without breaking ESLint's `minimatch@3` (`TypeError: expand is not a function`), so it is accepted and tracked. Separately, 23 low-severity alerts all chain to a single unpatched advisory (`elliptic <=6.6.1`, "risky cryptographic primitive") reached only through Stellar Wallets Kit's bundled Trezor / HOT / NEAR wallet SDKs, which this app never executes. `elliptic 6.6.1` is the latest published version, so no non-breaking upstream fix exists; npm's only remedy is a breaking Stellar Wallets Kit downgrade. Accepted and tracked; revisit when either advisory ships a compatible patch. |
| 6 | **Static analysis** | PASS | GitHub CodeQL code scanning runs on every push and pull request to `main` and `staging`, plus a weekly cron so newly published queries reach the default branch. `.github/workflows/codeql.yml` analyzes all three languages GitHub reports for this repo with the `security-extended` query suite: `javascript-typescript` (the Next.js frontend), `rust` (the Soroban contract), and `actions` (the workflow files themselves, for script injection via untrusted interpolation). The first full run on `main` (commit `19a9d62`) reported **7 open alerts**: 6 from `javascript-typescript` and 1 from `actions`; `rust` reported 0. By CodeQL's own severity: 4 high (`js/xss-through-dom`, `js/clear-text-storage-of-sensitive-data`, `js/resource-exhaustion`, and `js/regex/missing-regexp-anchor` in an end-to-end test file) and 3 medium (two `js/log-injection`, one `actions/unpinned-tag`). All 7 were triaged against the real data flow. **4 were fixed** and **3 were dismissed as false positives** with recorded reasons. Fixed: the unpinned `dtolnay/rust-toolchain@stable` action is now pinned to a commit SHA (a genuine supply-chain finding, CWE-829); both `js/log-injection` reports were addressed by folding the client-error stack onto a single log row and by removing the pilot-lead log line that echoed a submitted email address, so no user-supplied text reaches a log at all; and the unanchored regex in an end-to-end test was replaced with an exact URL match. Dismissed: `js/xss-through-dom` (the sink is a JSX `href` built from a constant `/proof/` prefix, and the value is gated by a `[0-9a-f]{64}` check, so neither markup nor a `javascript:` scheme is representable), `js/clear-text-storage-of-sensitive-data` (the query matches the identifier "certificate" as TLS key material; here a certificate is an academic credential whose fields are already public on-chain and on the public proof page), and `js/resource-exhaustion` (the SSE duration is not attacker-settable, and the endpoint additionally sits behind the edge rate limit). No high-severity exploitable finding survived triage. |
| 7 | **Web Application Firewall (WAF)** | PASS | Five Vercel edge rate-limit rules are active in front of every unauthenticated endpoint: `/api/events` (100/60s per IP, which also covers `/api/events/stream` via prefix match), `/api/fee-bump` (30/60s, POST), `/api/pilot-lead` (10/600s, POST), `/api/mcp` (60/60s), and client error reporting (30/60s). These are enforced at the edge, ahead of the application. The in-process limiters in `lib/rate-limit.ts` remain as defense in depth, but are per-warm-instance on Fluid Compute rather than global, which is precisely why the edge rules exist. |

---

## Operational Security

| # | Control | Status | Notes |
|---|---------|--------|-------|
| 1 | **Testnet only** | PASS | All contract deployments and transactions target Stellar testnet; mainnet deployment is explicitly out of scope. |
| 2 | **Admin key separation** | PASS | The admin key used for contract deployment is separate from the participant's personal wallet. |
| 3 | **No private key storage** | PASS | No private keys are stored in code, environment variables, or version control. |
| 4 | **RPC health monitoring** | PASS | App surfaces a visible error state when the Soroban RPC endpoint is unreachable; `/api/health` is cached for 30 seconds to reduce amplification risk. `/status#metrics` also labels event sources and can supplement recent RPC reads with Stellar Expert's public index. |

---

## Not Applicable (Testnet MVP)

The following controls are standard for production deployments but are explicitly
out of scope for this testnet MVP submission:

- **Formal third-party audit**  - not applicable at this stage; planned before any mainnet deployment.
- **Public fee sponsorship**  - intentionally disabled; sponsorship requires trusted server authorization.
- **Penetration testing**  - no external engagement; deferred to production. An internal multi-surface red-team review was run on 2026-07-07 and its findings were fixed (see the rate-limit, fee-bump, and checks-effects-interactions entries above).

---

Last reviewed: 2026-07-29
