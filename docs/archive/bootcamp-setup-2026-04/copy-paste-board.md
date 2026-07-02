**PROMPT PROJECT IDEA**

Generate **\[N\] Stellar dApp ideas** tailored for real-world adoption.  
Each idea must be **specific, realistic, and demo-able within a bootcamp timeframe**.

Avoid generic answers. Every field must include **concrete details (who, where, how, and why).**

### **PROJECT NAME**

A short, memorable name (max 3–4 words)

**PROBLEM (1 sentence)**

Describe a **specific person in a specific place** experiencing a **clear financial or coordination problem**, including:

* Who they are  
* What friction they face  
* The cost or consequence of that friction

Avoid generic phrases like “people lack access”

### **SOLUTION (1 sentence)**

Explain **how the app solves the problem using Stellar specifically**, including:

* What the user does  
* What happens on-chain  
* Why Stellar is essential (speed, cost, trust, composability)

### **STELLAR FEATURES USED**

Select only what is truly needed:

* XLM / USDC transfers  
* Custom tokens (assets issued on Stellar)  
* **Soroban smart contracts**  
* Built-in DEX  
* Trustlines  
* Clawback / Compliance

### **TARGET USERS**

Be precise:

* Who exactly (role, income level, behavior)  
* Where (country/city/region)  
* **Why they care (pain or incentive)**

### **CORE FEATURE (MVP)**

Describe **one specific transaction flow** that proves the product works end-to-end:

* User action → On-chain action → Result  
   This should be demo-able in under 2 minutes

### **WHY THIS WINS (IMPORTANT ADDITION)**

Explain in 1–2 sentences:

* Why this fits **Stellar’s hackathon criteria**  
* Why judges would find it compelling (real users, local economy, composability, etc.)

### **OPTIONAL EDGE (FOR BONUS POINTS)**

Add one enhancement:

* AI integration  
* Local anchor integration  
* Wallet UX improvement  
* DeFi composability  
* Offline / low-connectivity support

## **CONSTRAINTS (SET BEFORE GENERATION)**

### **REGION**

Pick one or combine:  
 \[ \] SEA \[ \] Africa \[ \] LATAM \[ \] South Asia \[ \] MENA \[ \] Global

### **USER TYPE**

Pick 1–2:  
 \[ \] Unbanked \[ \] Freelancers \[ \] Students \[ \] SMEs \[ \] Creators  
 \[ \] Farmers \[ \] NGOs \[ \] Migrants

### **COMPLEXITY**

Pick 1–2:  
 \[ \] No-code friendly  
 \[ \] Soroban required  
 \[ \] Mobile-first  
 \[ \] Web app  
 \[ \] CLI/API only

### **THEME (Pick 1–2 max)**

#### **Finance & Payments**

\[ \] DeFi \[ \] Payroll & salaries \[ \] Remittance  
 \[ \] Micropayments \[ \] Savings & lending  
 \[ \] Cross-border B2B payments \[ \] Split billing

#### **Social Impact**

\[ \] Disaster relief funds \[ \] Charity & donations  
 \[ \] Universal basic income \[ \] Women's economic access

#### **Education**

\[ \] Scholarship disbursement \[ \] Credential verification

#### **Agriculture & Supply Chain**

\[ \] Farmer payments \[ \] Cooperative tokenization

#### **Work & Gig Economy**

\[ \] Freelancer invoicing \[ \] Escrow for contracts

#### **Commerce & Loyalty**

\[ \] SME merchant payments \[ \] Marketplace escrow

#### **Governance & Identity**

\[ \] Digital identity / KYC \[ \] Transparent fund distribution

## **HARD RULES**

* ❌ No vague terms like “users”, “platform”, “blockchain solution”  
* ❌ No purely technical tools (must be user-facing)  
* ❌ No ideas that cannot be demoed in a hackathon  
* ✅ Must involve **real money movement or financial coordination**  
* ✅ Must clearly use **Stellar-specific features**  
* ✅ Must be understandable in **\<30 seconds pitch**

## **OUTPUT STYLE**

* Clean formatting  
* Concise but concrete  
* No fluff  
* Each idea should feel like a **real startup concept**

**SOROBAN CONTRACT OUTPUT**

For each idea above, also generate the following four files. All code must be functional, compile-ready, and directly tied to the MVP core feature described.

**lib.rs**

* Write the full Soroban smart contract in Rust  
* Include all necessary imports from soroban-sdk  
* Define the contract struct, storage keys, and all public contract functions  
* Each function must map directly to the MVP transaction described in the idea  
* Add inline comments explaining what each function does and why

**test.rs**

* Write exactly 5 tests using soroban\_sdk::testutils  no more, no less  
* Test 1 (Happy path): the MVP transaction executes successfully end-to-end  
* Test 2 (Edge case): one failure scenario (e.g. unauthorized caller, insufficient balance, or duplicate entry)  
* Test 3 (State verification): assert that contract storage reflects the correct state after the MVP transaction  
* Use \#\[cfg(test)\] and mod tests structure  
* Mock all necessary environment setup with Env::default()

**Cargo.toml**

* Use the correct \[package\] name matching the project name (snake\_case)  
* Set edition \= "2021"  
* Include soroban-sdk with features \= \["testutils"\] under \[dev-dependencies\]  
* Include the \[lib\] section with crate-type \= \["cdylib", "rlib"\]  
* Include the \[profile.release\] section optimized for Wasm output

**README.md**

* Project name and one-line description  
* Problem and solution (pulled from the idea)  
* Timeline  
* Stellar features used  
* Vision and Purpose  
* Prerequisites (Rust, Soroban CLI version)  
* How to build: soroban contract build  
* How to test: cargo test  
* How to deploy to testnet with soroban contract deploy  
* A sample CLI invocation calling the MVP function with dummy arguments  
* License section (MIT)

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

**SOROBAN CONTRACT OUTPUT**

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

**HOW TO DEPLOY GUIDE**

**\[1\]** [https://github.com/armlynobinguar/Stellar-Bootcamp-2026](https://github.com/armlynobinguar/Stellar-Bootcamp-2026)

**EXAMPLE SMART CONTRACT \+ FRONTEND (Full-Stack)** 

**\[1\]** [https://github.com/armlynobinguar/community-treasury](https://github.com/armlynobinguar/community-treasury)

\[package\]  
name \= "soroban-community-treasury"  
version \= "0.1.0"  
edition \= "2021"  
license \= "MIT"  
\[lib\]  
crate-type \= \["cdylib"\]

\[dependencies\]  
soroban-sdk \= { version \= "22.0.0", features \= \["alloc"\] }

\[dev-dependencies\]  
soroban-sdk \= { version \= "22.0.0", features \= \["testutils", "alloc"\] }

\[profile.release\]  
opt-level \= "z"  
overflow-checks \= true  
debug \= 0  
strip \= "symbols"  
debug-assertions \= false  
panic \= "abort"  
codegen-units \= 1  
lto \= true

\[profile.release-with-logs\]  
inherits \= "release"  
debug-assertions \= true

 cargo test

git clone \<insert link\>  
