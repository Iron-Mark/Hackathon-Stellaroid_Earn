# August 2026 QA Wave

This log records eight additional Friendbot-funded Stellar testnet wallets that I operate for product verification. They are a QA wave, not independent participants, not independent users, and not extra people for Rise In.

The prior combined snapshot was 54 testnet wallet accounts (30 independent participants plus 24 QA accounts I operate). After this wave the combined figure is **62 testnet wallet accounts (30 independent participants plus 32 QA accounts I operate)**. The 30 independent participant list in the README is unchanged.

- Network: Stellar testnet (`Test SDF Network ; September 2015`)
- RPC: `https://soroban-testnet.stellar.org/`
- Contract (live WASM v3.0.0, not redeployed): `CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV`
- Native SAC: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- CLI: Stellar CLI 27.0.0, installed from the GitHub release tarball `stellar-cli-27.0.0-x86_64-unknown-linux-gnu.tar.gz` (sha256 `357bf712f6353c28cd33c794402a3c87231757a5b305e6ef1604365af4fdd556`) to `~/.local/bin`. Not `cargo install`.
- Key creation: `stellar keys generate <alias> --network testnet --fund` (no `--global`; `--fund` is correct)
- Signing keys: local Stellar CLI identity files only. Aliases below are local. Secret keys, seed phrases, and identity tomls are not committed.
- Personal data: none
- Seeded demo exhibit #1 (opportunity id `1`): not approved, not released, not refunded, escrow not drained

Organization names used in `register_issuer` calls are fictional scenario data. They do not represent real institutions.

## Why this mix

The July guided cohort already ran eight full issuer, graduate, and employer loops (24 QA accounts, 72 public transactions). Repeating that loop eight more times would mean eight more `register_issuer` rows in the pending queue and new funded escrows. I did not do that.

This wave is one extra pass over those eight role-based journeys with safe public writes only:

- Two issuer registrations, left `Pending` (I did not spam `register_issuer` eight times)
- Three tiny `link_payment` calls to the sample verified credential, Stellar testnet XLM with no monetary value
- One `create_opportunity` that opened a **new** Draft (id `25`), not opportunity `#1`, and I did not fund it
- Two native SAC transfers for the graduate-role seats, because `submit_milestone` on opportunity `#1` is forbidden and a new funded escrow was not required

## Wallets

| Alias (local only) | Public address | Role | Method | Amount (testnet, no monetary value) | Ledger | Transaction |
| --- | --- | --- | --- | --- | --- | --- |
| `qa-aug-01` | `GC7AV4NH4MNAAKT5OFXD5IDINCLWGAHM262BSZZCKSQIM62N7XKPE6NU` | issuer | `register_issuer` (Pending: August QA Harborlight Studio) | n/a | 4370129 | [8f66cfbd…2edf](https://stellar.expert/explorer/testnet/tx/8f66cfbdaa3dc936336e524f841f8fe8bc203cab67253cf140ea8121ccdf2edf) |
| `qa-aug-02` | `GC2BJZHBH7DS6JHFR22I7RSGJQES2WBEACJRXMOE5URA7AT7WHEUADQO` | employer | `link_payment` to sample verified credential | 0.1 testnet XLM (`1000000` stroops) | 4370131 | [2ae1d006…0fdf](https://stellar.expert/explorer/testnet/tx/2ae1d0069717031cc480d54da301ee1d905f191c04bdb562df63a6a5d0c70fdf) |
| `qa-aug-03` | `GBVJK63BMVX2LYZ7I36MSX6CQOUP7P2DSYR3ON3ACIETHMJKT3GDC6Y2` | employer | `link_payment` to sample verified credential | 0.1 testnet XLM (`1000000` stroops) | 4370133 | [9f377395…0310](https://stellar.expert/explorer/testnet/tx/9f377395e301b49d8d3117cdf5463d5f80f9e6da938b5d44e4b80218e6e40310) |
| `qa-aug-04` | `GAJMCAKIMFZCRFEY7HODCRJYECA7L2QMZZ7E2TKIU5Q54UL2ENJNEGNE` | employer | `link_payment` to sample verified credential | 1 testnet XLM (`10000000` stroops) | 4370136 | [67d02f3e…2de6](https://stellar.expert/explorer/testnet/tx/67d02f3ee67525e55b01b4fd04e4de78e1c61179547211265ce2125650132de6) |
| `qa-aug-05` | `GD324P7MD5G3SMP7HEZ6HTAWHOV7QCLOODOIUG7JWXQSUOT5DOH6LLLB` | employer | `create_opportunity` Draft id `25` (not `#1`, not funded) | 0.1 testnet XLM (`1000000` stroops) listed on the draft, 0 escrowed | 4370139 | [0c0c012d…179b](https://stellar.expert/explorer/testnet/tx/0c0c012d8216b7adc0907dc70d627f22cc8622dbc6441845153e16f564c5179b) |
| `qa-aug-06` | `GDU7YSK5D3T3L4YRSVIZKAAHTIHVZ3F3VQEIK3EJKAN62ZETJU46Q6KV` | graduate | native SAC `transfer` | 0.1 testnet XLM (`1000000` stroops) | 4370142 | [a0534247…72fe](https://stellar.expert/explorer/testnet/tx/a053424709f14b4491141f15b2768c9b247d0dd47c8c861a7d3d7b4d0b1972fe) |
| `qa-aug-07` | `GDEYHFQEKIOZJWVLHBUKGAELA3L3IQVEH6MYEXU4JDOYEQHJQ3TLT5GG` | graduate | native SAC `transfer` | 0.1 testnet XLM (`1000000` stroops) | 4370145 | [3ccacc49…fbf2](https://stellar.expert/explorer/testnet/tx/3ccacc49c2eedee0a1960ab6d8c4871da59ea7353018a00e9a5c9c3838adfbf2) |
| `qa-aug-08` | `GDMJ7OGQILKF43KLLOUVW6MCVSIQUAZXJFOFJFDB6GLSOYIPRGRZRTQ6` | issuer | `register_issuer` (Pending: August QA Fieldstone Workshop) | n/a | 4370148 | [58a321a3…a0fa](https://stellar.expert/explorer/testnet/tx/58a321a3bbf1f65a30458e8c8187f5d01fe9897c1960f94e4e27fc014c5aa0fa) |

Account pages:

- [`qa-aug-01`](https://stellar.expert/explorer/testnet/account/GC7AV4NH4MNAAKT5OFXD5IDINCLWGAHM262BSZZCKSQIM62N7XKPE6NU)
- [`qa-aug-02`](https://stellar.expert/explorer/testnet/account/GC2BJZHBH7DS6JHFR22I7RSGJQES2WBEACJRXMOE5URA7AT7WHEUADQO)
- [`qa-aug-03`](https://stellar.expert/explorer/testnet/account/GBVJK63BMVX2LYZ7I36MSX6CQOUP7P2DSYR3ON3ACIETHMJKT3GDC6Y2)
- [`qa-aug-04`](https://stellar.expert/explorer/testnet/account/GAJMCAKIMFZCRFEY7HODCRJYECA7L2QMZZ7E2TKIU5Q54UL2ENJNEGNE)
- [`qa-aug-05`](https://stellar.expert/explorer/testnet/account/GD324P7MD5G3SMP7HEZ6HTAWHOV7QCLOODOIUG7JWXQSUOT5DOH6LLLB)
- [`qa-aug-06`](https://stellar.expert/explorer/testnet/account/GDU7YSK5D3T3L4YRSVIZKAAHTIHVZ3F3VQEIK3EJKAN62ZETJU46Q6KV)
- [`qa-aug-07`](https://stellar.expert/explorer/testnet/account/GDEYHFQEKIOZJWVLHBUKGAELA3L3IQVEH6MYEXU4JDOYEQHJQ3TLT5GG)
- [`qa-aug-08`](https://stellar.expert/explorer/testnet/account/GDMJ7OGQILKF43KLLOUVW6MCVSIQUAZXJFOFJFDB6GLSOYIPRGRZRTQ6)

## Payment target (must stay Verified)

`link_payment` calls used the sample verified credential. I did not change its status.

| Field | Value |
| --- | --- |
| Hash | `c02ce1602d5bbb6ddfe93c6603d7f4e3dae3b2fb571ea4e70669ccd5a359aea3` |
| Owner | `GALGZZRXRB5SIBGT62OZDA7BMPC4YUZDECHVHGWOAMXIMNLTZGFGTLMN` |
| Status after this wave | Verified |

## Guards I re-read after the writes

| Check | Result |
| --- | --- |
| Opportunity `#1` | Still `Funded`, amount `100000000` stroops (10 testnet XLM, no monetary value), employer `GAHBWPHQPFF5GTD6DTR7WF3S5SUQ5YKS5L7DDCBPEWBEQLADLML7H7XQ` (`demo-employer`) |
| Opportunity `#25` | `Draft`, unfunded, title `August QA Draft Paid Trial`, employer `qa-aug-05` |
| Horizon | All eight hashes `successful=true` on testnet (ledgers 4370129 through 4370148) |
| Aliases | New `qa-aug-01` through `qa-aug-08`. Not `demo-employer`, not the July `qa-actor-*` keys |

## Interpretation Boundary

These eight accounts are QA coverage I operate. They do not move the independent participant count. Count them with the July 24 as 32 QA accounts, never as 62 users.
