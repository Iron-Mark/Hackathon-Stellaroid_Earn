# TODO — Stellar Bootcamp Setup

Legend: **A** = Environment (codespace) · **B** = Manual pre-workshop · **C** = Contract deployment · **D** = Rise In submission · **E** = Phase 2 Fullstack

---

## A. Environment (done in this codespace)
- [x] **A1.** Visit GitHub repo
- [x] **A2.** Install **Rust** (rustc 1.95.0)
- [x] **A3.** Install **Stellar CLI** (v26.0.0 at `~/.local/bin/stellar`)
- [x] **A4.** Install **WASM target** (`wasm32v1-none` + `wasm32-unknown-unknown`)
- [x] **A5.** `build-essential` present
- [x] **A6.** Testnet key generated and funded
  - Alias: `my-key`
  - Address: `GAWIOVGFSPJDEIJJZUSVRFPVP3D5VNO2LGCU47KEHJD6MV277QKNR34D`
- [x] **A7.** Persist PATH for new shells:
  ```bash
  echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.bashrc && source ~/.bashrc
  ```

## B. Manual Pre-Workshop (outside codespace)
- [x] **B1.** Submit Google Form: https://forms.gle/uuo7s3A5MoygJWNt5
- [x] **B2.** Join Messenger GC: Stellar PH Offline Bootcamp
- [x] **B3.** Register on Rise In: https://www.risein.com/programs/stellar-bootcamp-ph
- [x] **B4.** ⭐ Star the repo: https://github.com/armlynobinguar/Stellar-Bootcamp-2026
- [x] **B5.** Install **Freighter Wallet** (browser + phone, **Testnet**) — https://freighter.app
- [x] **B6.** Fund Freighter testnet wallet via https://friendbot.stellar.org
  - Address: `GCAUJ4JXMKVANOL3AMZUNGX65LUCHI775XIB6HIPOAKXMVYOWDMAIFPT`
- [x] **B7.** Submit Pull Request (Full Name / Course & Year / Telegram Username)
  - PR: https://github.com/armlynobinguar/Stellar-Bootcamp-2026/pull/73

## C. Contract Deployment (Step 4)
Facilitator update: skip C1-C2 (no facilitator repo). Built own contract `stellaroid_earn` from `fullstack-prompt-template.md` v4 instead.

- [x] ~~**C1.** Get facilitator-provided repo link~~ (skipped per instructor)
- [x] ~~**C2.** Clone facilitator repo~~ (skipped — own `contract/` folder instead)
- [x] **C3.** Complete `contract/src/lib.rs` + 5 passing tests in `contract/src/test.rs`
- [x] **C4.** `cargo test` — 6/6 passed
- [x] **C5.** `stellar contract build` — wasm at `target/wasm32v1-none/release/stellaroid_earn.wasm`
- [x] **C6.** Deployed via `stellar contract deploy --source my-key --network testnet`
- [x] **C7.** Contract ID: `CDWCARXLJUJ5ISC3GPXRLR5HC6QPLMGULCVRIACYKQM4U5AG7TFWXHVZ`
- [x] **C8.** Verify: https://stellar.expert/explorer/testnet/contract/CDWCARXLJUJ5ISC3GPXRLR5HC6QPLMGULCVRIACYKQM4U5AG7TFWXHVZ
- [x] **C9.** Trust-layer rebuild + redeploy (2026-04-19): full 12-fn contract from `lib.rs` (433 lines)
  - New Contract ID: `CBNSOFNXAOIFFKCOZLT7UZ5EEPB3ML2DP4YUGF24M4VBJCUWEHI2DX2Y`
  - WASM hash: `bfee3c47c08e788ebbd3743324c35783f66afe4f34a9fe62b70de11c183cbc02`
  - Verify: https://stellar.expert/explorer/testnet/contract/CBNSOFNXAOIFFKCOZLT7UZ5EEPB3ML2DP4YUGF24M4VBJCUWEHI2DX2Y
  - Seeded: issuer `GAWIO…` → Approved · cert `35a19276…` → Verified
- [x] **C10.** Source-verified redeploy via CI (2026-04-20): deployed CI-built WASM for Stellar Expert source validation
  - Final Contract ID: `CA7P5EPYKC2IW4PCMAH6NRBLHH3WP7AN6WWC3QDRWO4HLE47FAGO6TET`
  - WASM hash: `decf556e731437ef70bba08587e277f67086dd66ec915d48826bb4867fc12e7f`
  - Verify: https://stellar.expert/explorer/testnet/contract/CA7P5EPYKC2IW4PCMAH6NRBLHH3WP7AN6WWC3QDRWO4HLE47FAGO6TET
  - Source validation: **Verified** — linked to GitHub commit `71d2b03`
  - Deploy key: `GALGZZRXRB5SIBGT62OZDA7BMPC4YUZDECHVHGWOAMXIMNLTZGFGTLMN`
  - Seeded: issuer approved · 3 certs (2 Verified, 1 Issued) · 10 XLM reward on cert `c02ce160…`

## D. Rise In Submission (Step 5)
- [x] **D1.** Pushed to https://github.com/Iron-Mark/Stellar-Bootcamp-2026 (dev merged to main as PR #1)
- [x] **D1b.** Live demo deployed to Vercel: https://stellaroid-earn-demo.vercel.app/
- [x] **D2.** Submitted on Rise In — status: **Under review**
  - GitHub: https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn
  - Contract ID: `CA7P5EPYKC2IW4PCMAH6NRBLHH3WP7AN6WWC3QDRWO4HLE47FAGO6TET`
  - Stellar Expert: https://stellar.expert/explorer/testnet/contract/CA7P5EPYKC2IW4PCMAH6NRBLHH3WP7AN6WWC3QDRWO4HLE47FAGO6TET (source verified)
  - Live demo: https://stellaroid-earn-demo.vercel.app/
  - Vercel env vars updated with new contract ID + admin/read address
- [x] **D3.** Feedback form submitted (rating 5/5, essay on hands-on experience)
- [x] **D4.** Level 5 (Blue Belt) idea submitted: mainnet deployment + onboarding 5 real graduates
- [x] **D5.** GitHub social preview card uploaded (1280×640, `images/github-social-card.png`)
- [x] **D6.** GitHub release v1.1.0 created: "Stellaroid Earn: Trust Layer, Proof Blocks & Full Redesign"
- [x] **D7.** CI release v1.2.0 created automatically via `stellar-expert/soroban-build-workflow`
- [x] **D8.** Repo topics + description updated on GitHub
- [x] **D9.** MIT LICENSE added

## E. Phase 2 — Fullstack (after Contract ID is verified)
Use the Stellar-provided template prompt to generate a project idea + Soroban contract files, then build the fullstack on top.

Template: [`fullstack-prompt-template.md`](./fullstack-prompt-template.md)

- [x] **E1.** Verify deployed Contract ID on Stellar Expert
- [x] **E2.** Project idea: **Stellaroid Earn** — on-chain credential registry + employer-to-student payments (SEA, Students/Employers, Web app + Soroban required, Education theme)
- [x] **E3.** Generated Soroban contract (`contract/src/lib.rs` + 5 tests in `test.rs` + `Cargo.toml` + `README.md`)
- [x] **E4.** Adapted `frontend/` for Stellaroid Earn (register/verify/lookup/pay cards, SHA-256 file helper, RPC health banner, human-readable error mapping)
- [x] **E5.** Wired frontend to deployed Contract ID + native XLM SAC
  - `NEXT_PUBLIC_SOROBAN_CONTRACT_ID=CDWCARXLJUJ5ISC3GPXRLR5HC6QPLMGULCVRIACYKQM4U5AG7TFWXHVZ`
  - `NEXT_PUBLIC_SOROBAN_ASSET_ADDRESS=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
  - Contract initialized via `init` (tx `c7de2d61cfd1f51cfb255379775dd928604d264d6b5bb3775dc75cdd7c4b5721`)
- [x] **E6.** Demo-able MVP flow executed on testnet (2026-04-18): register `1e8078e3…`, verify `2215e08e…`, link_payment 100 XLM `5bed652b…`. UI at `http://localhost:3000` hits the same contract for live Freighter-driven demo.
- [x] **E7.** Final repo layout: `contract/` + `frontend/` at repo root (backend skipped per CLAUDE.md)

---

## F. Post-Submission Enhancements
- [x] **F1.** Judge-optimized README (10 sections, feature gallery, Mermaid diagram, shields.io badges)
- [x] **F2.** Screenshot capture pipeline (Playwright + Sharp, 7 images under 500KB each)
- [x] **F3.** Stellar Expert source code validation (CI-built WASM, build attestation, verified)
- [x] **F4.** Developer attribution (Mark Siazon — portfolio, LinkedIn, GitHub)

---

## Notes
- Stellar CLI v26 dropped `--global` (global is default); use `--fund` on `keys generate` to auto-fund.
- Source validation requires deploying the exact WASM from CI — local builds produce different hashes.
- `NEXT_PUBLIC_*` env vars are baked at Next.js build time — Vercel must rebuild after changes.
- Use `printf '%s'` (not `echo`) when piping env vars to `vercel env add` to avoid trailing newlines.
