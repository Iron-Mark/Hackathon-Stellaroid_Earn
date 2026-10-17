# Direct extension-wallet integrations

The October 2026 dependency remediation replaces Stellar Wallets Kit with a
local chooser and six direct integrations. Removing the unused HOT/NEAR tree
also removes its unpatched Elliptic dependency. No audit suppression, fake
package, cryptography replacement, or wallet downgrade is used.

| Wallet | API | Runtime bridge |
| --- | --- | --- |
| xBull | `connect`, `sign` with explicit account and network | `@creit.tech/xbull-wallet-connect@0.4.0` |
| Rabet | Injected `connect`, `sign` | None |
| LOBSTR | `isConnected`, `getPublicKey`, `signTransaction` | `@lobstrco/signer-extension-api@2.0.0` |
| Hana | Injected `stellar.getPublicKey`, `stellar.signTransaction` | None |
| Klever | Injected `stellar.getAddress`, `stellar.signTransaction` | None |
| Bitget | Injected `stellar.connect`, `stellar.signTransaction` | None |

The bridge packages load on demand and are unchanged upstream libraries.
xBull retains its web-popup fallback and closes bridge connections after each
operation, as required by its [upstream documentation](https://github.com/Creit-Tech/xBull-Wallet-Connect).
Its license is AGPL-3.0; the [LOBSTR bridge](https://github.com/Lobstrco/lobstr-browser-extension/tree/main/%40lobstrco/signer-extension-api)
declares GPL-3.0. These dependencies were already present through the former
kit. The remaining wrappers use the wallets' existing injected APIs, following
the former MIT-licensed kit's API mappings, without vendoring its source.

## Session and signing behavior

- Keep provider ID `swk` and legacy address, module, and label storage keys.
  Existing supported-wallet sessions restore without requesting permission.
  Unknown IDs, including HOT, cannot restore a session.
- Local disconnect clears the cached session. It does not revoke wallet-side
  permissions. Closing the chooser cancels the pending app connection; a late
  approval cannot reconnect the app. A failed extension request leaves the
  chooser open for retry or cancellation.
- The six icons remain self-hosted. The existing CSP is unchanged. No new
  third-party image host or iframe permission is needed.
- Before signing, recheck the selected account. Pass the expected account and
  network where the API supports them. Klever and Bitget also check the wallet
  network when their network method exists.
- LOBSTR does not accept a network argument. All six returned envelopes are
  parsed with the Stellar SDK, compared with the original transaction hash,
  and required to carry a valid signature from the expected account under the
  requested network. Altered, unsigned, wrong-account, wrong-network, malformed,
  and fee-bump envelopes are rejected before submission.
- This path supports the app's normal single-account signing flow, not wallets
  that return only signatures from alternative multisig signers. Connection
  displays the app's requested network; it is not proof of the extension's
  current network setting. Signature validation enforces the signing boundary.

## Verification

From `frontend`:

```sh
npm ci
npm audit
npm audit --omit=dev
npm run test:unit
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e
npm run test:wallets
```

The wallet browser suite uses a separate local server with `NEXT_PUBLIC_E2E_MODE=0`,
no configured contract, and injected extension doubles. It exercises the real
chooser, both genuine bridge packages, cached-session restoration, disconnect,
retry, and cancellation without submitting transactions. Existing application
E2E fixtures remain unchanged. Unit tests generate ephemeral local testnet
signatures without RPC access. Real installed-extension prompts, hardware,
mobile devices, and actual wallet approvals still need manual verification.
