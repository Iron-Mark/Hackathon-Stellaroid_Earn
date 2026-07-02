**PROJECT NAME: Stellaroid Earn**

**PROBLEM:** A graduating student in the Philippines cannot easily prove their credentials to employers or access financial opportunities, forcing them to rely on manual verification that delays hiring and limits income.

**SOLUTION:** Using Stellar, Stellaroid Earn builds a transparent on-chain system where each certificate has a unique, traceable identity anchored to its rightful owner and students unlock XLM-based rewards, job payouts, and financial access upon instant credential verification.

**STELLAR FEATURES USED**

* Soroban smart contract (core credential registry, tamper-detection, reward, and payment logic)
* XLM transfers (student rewards and employer payouts)
* Custom tokens (optional school-issued credential assets)
* Trustlines (credential asset ownership)

**TARGET USERS:** Students and fresh graduates in the Philippines, Vietnam, and Indonesia seeking verifiable academic and non-academic credentials; universities and bootcamps issuing certificates; employers and DAOs verifying skills before payment

**CORE FEATURE (MVP):** A Soroban smart contract that registers certificates with a unique on-chain identity (hash \+ owner wallet), prevents duplicate issuance, detects tampering attempts, rewards students with XLM upon successful credential verification, and enables employers to trigger direct wallet payments to verified students

**CONSTRAINTS**

| Dimension | Selection |
| :---- | :---- |
| Region | SEA |
| User Type | Students, Employers |
| Complexity | Soroban required, Web app |

**THEME:** Education → Credential Verification \+ Learn-to-Earn \+ Financial Access (students earn XLM rewards upon certificate issuance and verification; employers pay directly to verified wallets)

---

## SOROBAN CONTRACT OUTPUT

Generate the following four files. All code must be functional, compile-ready, and directly tied to the MVP core feature above.

**lib.rs**

* Full Soroban smart contract in Rust
* All necessary imports from `soroban-sdk`
* Contract struct, storage keys, and all public functions covering: certificate registration (with hash \+ owner wallet), duplicate detection, tamper verification, XLM reward transfer to student, employer-triggered payment to verified wallet, and a boolean verification check that emits an event
* Specifically implement the following named functions:
  * `register_certificate()` — registers hash \+ wallet, checks for duplicates, detects tampering
  * `reward_student()` — handles XLM transfer to student wallet upon verified registration
  * `verify_certificate()` — returns boolean and emits an on-chain event
  * `link_payment()` — optional employer-triggered payment to the student's verified wallet
* Inline comments explaining what each function does and why

**test.rs**

* Exactly 3 tests using `soroban_sdk::testutils` — no more, no less
* Test 1 (Happy path): A certificate is successfully registered and the student receives an XLM reward
* Test 2 (Edge case): A duplicate certificate registration is rejected with the correct error
* Test 3 (State verification): Contract storage correctly reflects the certificate owner and hash after a successful registration
* Uses `#[cfg(test)]` and `mod tests` structure with `Env::default()` for all environment setup

**Cargo.toml**

* Package name: `stellaroid_earn` (snake\_case), edition \= `"2021"`
* `soroban-sdk` with `features = ["testutils"]` under `[dev-dependencies]`
* `[lib]` section with `crate-type = ["cdylib", "rlib"]`
* `[profile.release]` optimized for Wasm output

**README.md**

* Project name and one-line description
* Problem and solution (as defined above)
* Suggested timeline for MVP delivery
* Stellar features used (XLM transfers, Soroban contracts, custom tokens, trustlines)
* Prerequisites: Rust toolchain, Soroban CLI version
* Build instructions: `soroban contract build`
* Test instructions: `cargo test`
* Testnet deploy: `soroban contract deploy`
* Sample CLI invocations calling `register_certificate` and `verify_certificate` with dummy arguments
* MIT License section

---

## REFERENCE LINKS

**HOW TO DEPLOY GUIDE**

**\[1\]** [https://github.com/armlynobinguar/Stellar-Bootcamp-2026](https://github.com/armlynobinguar/Stellar-Bootcamp-2026)

**EXAMPLE SMART CONTRACT \+ FRONTEND (Full-Stack)**

**\[1\]** [https://github.com/armlynobinguar/community-treasury](https://github.com/armlynobinguar/community-treasury)

**EXAMPLE Cargo.toml**

```toml
[package]
name = "soroban-community-treasury"
version = "0.1.0"
edition = "2021"
license = "MIT"

[lib]
crate-type = ["cdylib"]

[dependencies]
soroban-sdk = { version = "22.0.0", features = ["alloc"] }

[dev-dependencies]
soroban-sdk = { version = "22.0.0", features = ["testutils", "alloc"] }

[profile.release]
opt-level = "z"
overflow-checks = true
debug = 0
strip = "symbols"
debug-assertions = false
panic = "abort"
codegen-units = 1
lto = true

[profile.release-with-logs]
inherits = "release"
debug-assertions = true
```
