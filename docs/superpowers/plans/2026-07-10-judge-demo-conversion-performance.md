# Historical plan: judge demo, conversion, trust, and performance

Status: **completed and superseded**. Stellaroid is finished and parked; `HANDOFF.md` is the current authority.

## Original goal

Make the testnet product understandable without a wallet, capture pilot interest, improve trust surfaces, and reduce app-route JavaScript before the July submission cycle.

## Outcome map

| Planned work | Verified implementation evidence |
| --- | --- |
| Lazy-load `@stellar/stellar-sdk` from app routes | `b790dcc` |
| Opportunity directory and wallet filters | `60fb1e3` |
| Wallet-less guided demo over real testnet exhibits | `4f2aa7d` |
| Privacy/terms, contact, and RFC 9116 security.txt | `7c1a5e2` |
| Unit tests in CI and dead-validator removal | `c949b43` |
| Orbitron and Exo 2 font loading | `3251283` |
| Lead form and operational hardening | Present in the current pilot route/components and later review work |
| Speed Insights | Added in `c674293`, then deliberately removed during later v3.2 synchronization in `d9e89bf` |

Later work expanded activity feeds, wallet history, MCP, security, evidence, campaign assets, and release documentation. The final repository state and optional distribution/evidence items are recorded in `HANDOFF.md`.

## Decisions that remain relevant

- All product and money claims are Stellar testnet-only.
- Demo records must remain real, auditable testnet exhibits rather than fabricated fixtures.
- Security/trust copy must describe actual behavior and limitations.
- Performance work requires measured bundle or field evidence.
- The project is parked. Do not restart the historical workstreams unless the owner deliberately reactivates the product.
