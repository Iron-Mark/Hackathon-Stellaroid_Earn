# Next.js lint directory glob adapter

This private development package replaces only the `fast-glob` dependency of
`@next/eslint-plugin-next@16.3.8`. That plugin uses one API:
`globSync(pattern, { onlyDirectories: true })` in `utils/get-root-dirs`.
Its previous `fast-glob -> micromatch -> braces` dependency chain is affected by
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
No patched Braces release was available on 2026-10-17.

The adapter delegates matching to pinned `tinyglobby@0.2.17`, which is already
used elsewhere in the frontend dependency tree. It disables automatic directory
expansion, preserves absolute results, normalizes trailing slashes, and excludes
the base directory of a terminal `/**` pattern. A direct package alias would
silently expand literal root directories into descendants.

## Supported calls

The adapter supports the pinned plugin's directory-only call, including literal,
wildcard, brace, recursive, and absolute root patterns. The plugin normalizes
Windows separators before calling it. It rejects parent traversal segments,
patterns longer than 4,096 characters, and brace nesting deeper than 64.
A terminal `/**` accepts a literal or brace-expanded base such as `apps/web/**`
or `apps/{web,admin}/**`; dynamic bases such as `apps/*/**` are rejected rather
than silently changing which roots are returned. Use explicit roots for that
case. Unsupported options fail explicitly. It does not implement the general
`fast-glob` API and must not be imported by application code.

## Installation and checks

The frontend declares a local development dependency named `fast-glob` pointing
to this directory. The exact Next plugin override references that dependency
with `$fast-glob`. The lockfile uses a repository-relative link, so a clean
`npm ci` installs the same adapter on Windows and Linux without an install hook.

`npm run lint` runs `npm run test:lint-deps` before ESLint. The tests exercise
the actual installed Next plugin's root lookup and link-rule diagnostics, as
well as the adapter's input guards. They verify that the plugin resolves this
package. Recheck its imports, supported calls, and these tests when upgrading
Next or its ESLint plugin. Remove the adapter when an upstream release eliminates
the vulnerable chain.

## Remaining wallet advisory

This tooling change does not replace wallet cryptography. The independent
[Elliptic advisory](https://github.com/advisories/GHSA-848j-6mx2-7j84) has no
patched release as of 2026-10-17. Its remaining installed dependency chain and
application reachability are documented in the repository security checklist.
