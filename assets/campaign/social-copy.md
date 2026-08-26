# Social copy, v3.2.0 launch

Ready-to-post text for the July 2026 cycle, one block per placement. Every
figure here is drawn from committed evidence: the registry counts from
`docs/operations/risein-submission-2026-07.md`, the traffic figures from
`docs/operations/submission-evidence.md`, and the wallet split from the README.
If those change, update these before posting.

Two rules the copy already follows and that any edit must keep. The 54 wallet
figure always appears beside its split of 30 independent participants plus 24
QA accounts operated by the author, never bare. Rise In Level 5 is described as
submitted, never as won.

Boards referenced here live alongside this file. See
[`README.md`](README.md) for which asset goes with which placement.

---

## Discord, general or Stellar community

Attach `stellaroid-teaser.gif` as the autoplay opener, or
`stellaroid-promotional-demo.mp4` when you want the 2-minute live-site
walkthrough. Only the first link is bare so Discord renders a single embed
card; the rest are wrapped in angle brackets to suppress extra previews.

```
**Stellaroid Earn: proof and payment on Stellar, in one flow**

I built a system where a bootcamp graduate's credential is anchored on Stellar, an employer checks it in seconds on a public page with no wallet needed, and payment releases against that same record through an escrow. Everything runs on Stellar testnet, so no real funds are involved.

**Try it without installing anything:**
https://stellaroid.tech/demo
Wallet-less guided tour on real seeded testnet data, works on your phone. Or sign one real testnet transaction in 60 seconds: <https://stellaroid.tech/start>

**Under the hood:**
- Soroban contract, 19 functions: issuer registry, credential lifecycle, milestone escrow
- Public proof pages keyed by SHA-256 hash, readable without a wallet
- 8 wallets behind one interface (Freighter, Albedo, LOBSTR, xBull and more)
- Read-only MCP server, so AI agents can query credentials straight from chain
- Reproducible builds: the deployed WASM rebuilds byte for byte from the v3.0.0 tag, re-verified weekly in CI against live testnet bytecode

**The receipts:**
- Top 5 of 105 participants, Stellar PH Bootcamp
- 54 documented testnet wallet accounts: 30 independent participants plus 24 QA accounts I operate, split stated wherever the number appears
- Every claim links out: contract ID, WASM hash, and all transactions resolve on Stellar Expert

Full case study, including what I caught and corrected along the way: <https://stellaroid.tech/case-study>
Source: <https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn>

Solo build, April to July 2026. Feedback welcome, especially if you try the 60-second flow and something feels off.
```

---

## Discord, university or college server

Opens on the reader's own situation rather than on the product. Avoids the
word "student" and addresses the room as "you".

```
**Stellaroid Earn: proof and payment on Stellar, in one flow**

You finish a course or an OJT, you get a PDF certificate. The company you send it to has no cheap way to check it is real, so you end up proving the same skill again through unpaid trial work.

I built a system where that certificate gets anchored on Stellar instead. An employer opens a public page, reads the status straight from the chain, and installs nothing. Payment for the work releases against that same record through an escrow. All on Stellar testnet, so no real funds are involved.

**See it without installing anything:**
https://stellaroid.tech/demo
Guided tour on real testnet data, works on your phone. Or sign one real transaction in 60 seconds: <https://stellaroid.tech/start>

**Where it is at, four months in:**
- Live on testnet with 14 issuers, 114 credentials, and 25 escrowed paid trials on the contract
- 342 visitors across 5 countries, and the public proof page is the second most visited part of the site
- 54 documented testnet wallets: 30 independent participants plus 24 QA accounts I run
- Top 5 of 105 in the Stellar PH Bootcamp, and submitted for Rise In Level 5

**What is inside:** Soroban contract in Rust with 19 functions, Next.js 16 and React 19 frontend, 8 wallets behind one interface, 153 tests, CI on every push.

Solo build, April to July 2026. The repo is open and the case study walks through the parts I got wrong and had to fix, which is the half nobody usually publishes.

Case study: <https://stellaroid.tech/case-study>
Source: <https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn>
Me: <https://marksiazon.dev>

Happy to answer anything about the stack, the contract, or how it was put together.
```

---

## Discord, developer community

Opens on the technical finding rather than the product, because that is what
earns the read in a dev server. The product arrives in paragraph three.

```
**Stellaroid Earn: credentials and escrow on Soroban**

Something I did not expect while building this. The same Rust source, same rustc 1.95.0, same Stellar CLI 27.0.0 emits a different WASM hash on Windows than on Linux. The deploy happened on Windows, so the weekly verification job runs on Windows deliberately. I ruled out line endings and build paths before accepting that.

That job exists because the contract claims to be reproducible. Tag v3.0.0 rebuilds byte for byte to the deployed hash, and CI re-checks it weekly against bytecode fetched live from testnet, so the claim rots loudly instead of quietly. Related lesson: deployed artifacts verify against the tag they were built from, never against a moving branch.

The product around it: a credential is anchored on Stellar, an employer verifies it on a public page with no wallet, and an escrow releases payment against that same record. Stellar testnet only, no real funds.

**Shipped so far:** 14 issuers, 114 credentials, and 25 escrowed paid trials live on the contract. 72 QA transactions, all resolving on Stellar Expert. 342 visitors in four months, proof pages second only to the landing page.

**Stack:** Soroban and Rust, Next.js 16, React 19, TypeScript, Playwright. 19 contract functions, 17 typed errors, 16 events. 12 contract tests, 99 unit, 42 end to end. Read-only MCP server at /api/mcp so agents can query credentials straight from chain, no wallet or key.

Wallet-less demo: https://stellaroid.tech/demo
Case study, including a false "0 CodeQL alerts" claim I published and had to correct: <https://stellaroid.tech/case-study>
Source: <https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn>
Me: <https://marksiazon.dev>

Solo build, April to July 2026. Ask me anything about the contract or the verification setup.
```

---

## LinkedIn

Attach `sq-general.png`. **Do not put a URL in the post body**, or LinkedIn
replaces the image with its own link card. Links go in the first comment.

```
I spent April to July building Stellaroid Earn solo: a credential system on Stellar where a bootcamp graduate's certificate is anchored on-chain, an employer verifies it in seconds on a public page with no wallet, and payment releases against that same record through an escrow. Everything runs on Stellar testnet, so no real funds are involved.

It placed top 5 of 105 in the Rise In Stellar Smart Contract Bootcamp.

The part I'm most pleased with isn't a feature. The deployed contract rebuilds byte for byte from its release tag, and a weekly CI job re-checks it against bytecode fetched live from the network. The claim rots loudly instead of quietly.

Full case study, including what I caught and corrected along the way, in the comments.
```

First comment:

```
Case study: https://stellaroid.tech/case-study
Try it in 60 seconds: https://stellaroid.tech/start
Source: https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn
```

---

## Instagram and Facebook

Post the four square boards as a carousel in the order general, employer,
issuer, graduate. Instagram re-serves later slides to people who did not swipe
through, so the general board hooks and the audience boards follow.

```
Built this solo in four months. A graduate's credential, anchored on Stellar. An employer checks it in seconds, no wallet needed. Payment releases against the same record through an escrow, all on Stellar testnet with no real funds. Try it in 60 seconds at stellaroid.tech/start, link in bio.

#Stellar #Soroban #Web3 #BuildInPublic #Blockchain #SoloDev #Philippines
```

For a story, use `story-general.png` and add a link sticker to `/start`, since
story images are not clickable on their own.
