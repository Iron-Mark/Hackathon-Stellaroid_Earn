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

Avoid generic phrases like "people lack access"

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

* Why this fits **Stellar's hackathon criteria**
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

* No vague terms like "users", "platform", "blockchain solution"
* No purely technical tools (must be user-facing)
* No ideas that cannot be demoed in a hackathon
* Must involve **real money movement or financial coordination**
* Must clearly use **Stellar-specific features**
* Must be understandable in **<30 seconds pitch**

## **OUTPUT STYLE**

* Clean formatting
* Concise but concrete
* No fluff
* Each idea should feel like a **real startup concept**

## **SOROBAN CONTRACT OUTPUT**

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
