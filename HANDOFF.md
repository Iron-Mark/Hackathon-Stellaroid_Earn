# Handoff

State of this repository as of **2026-08-02**, written so anyone picking it up cold, human or agent, on any machine or account, knows where things stand without needing chat history.

**The project is finished and parked.** Do not restart build work here. Read this file before proposing changes.

---

## Current state

Verified against the remote on 2026-08-02:

| Check | State |
| --- | --- |
| Open pull requests | none |
| `main` vs `staging` vs `july-monthly-builder` | tree-identical |
| Working tree | clean |
| CodeQL open alerts | 0 |
| Dependabot open alerts | 0 |
| Tests | 12 contract, 99 frontend unit, 42 end-to-end, all green |
| Production routes | `stellaroid.tech`, `beta.`, `v3.` all 200 |
| Latest release | `v3.2.0`, 13 campaign assets attached |

The Rise In Level 5 (Blue Belt) cycle was **submitted on 2026-07-31**. That cycle is closed. Do not reopen its work items.

---

## Invariants to preserve

**Branch parity.** `main`, `staging`, and `july-monthly-builder` must stay tree-identical. After any PR merges to `main`:

```bash
git checkout july-monthly-builder
git reset --hard origin/july-monthly-builder
git merge origin/main --no-edit
git push origin july-monthly-builder

git checkout main && git pull
gh pr create --base staging --head main --title "chore: sync staging with main"
```

**Branches.** Six exist on the remote. `main` and `staging` are live, `july-monthly-builder` tracks them, and `june` / `april` monthly builders are **read-only archives, never sync them**. `docs-onchain-user-verification` holds planning notes that were deliberately kept off `main`; leave it alone. Delete feature branches after merge.

**Testnet only.** Every deployment, transaction, and money claim in this project is Stellar testnet with no monetary value. Never remove that qualifier from copy, and never deploy to mainnet.

**Contract verification targets the tag, not the branch.** The deployed WASM reproduces from tag `v3.0.0`, not from `main`. See `docs/operations/contract-verification.md`. Do not "fix" a `main` rebuild mismatch; it is expected.

---

## Traps that will recur

1. **`gh` silently switches to the work account.** Pushes then fail with `403`. Fix: `gh auth switch --user Iron-Mark`.
2. **A contract release workflow publishes a tag right after any manual release and steals the "Latest" badge**, so visitors land on a build artifact instead of the product release. Fix: `gh release edit v3.2.0 --latest`.
3. **A red weekly CI run after a quiet period is usually drift, not a regression.** The weekly contract verification runs on **`windows-latest` deliberately**: the build is host-dependent and the deploy happened on Windows. Do not "simplify" it to Ubuntu; it will fail and that failure is not a bug.
4. **Do not let generic `HEAD /api/mcp` requests enter the MCP GET transport.** Keep the route's explicit `204` HEAD handler; otherwise platform probes can hold a function open until Vercel times it out.
5. **Satori (the Open Graph image renderer) paints absolutely positioned pattern elements *above* later siblings.** Background patterns must go on the root element, never as an overlay div. Documented in `frontend/src/lib/og-chrome.tsx`.
6. **`main`'s history was rebased once** (2026-07-30). If a stale local clone conflicts on every file, reset to the remote rather than merging.

---

## Where the assets live

**In the repository** (`images/`): product screenshots, the README banner, and the proof-to-payment flow diagram.

Banner versioning is by filename:

- `images/github-social-card-v1.svg` — archived original artwork
- `images/github-social-card-v2.png` — current campaign banner
- `images/github-social-card.png` — stable pointer consumed by `README.md` and the GitHub social preview, mirroring the newest version

To cut a v3: render from the campaign kit, commit it as `-v3`, then copy it over `images/github-social-card.png`. Do **not** regenerate the banner from the SVG; `scripts/capture-readme-screenshots.ts` explains why.

**In `assets/campaign/`**: the full campaign kit, 13 boards covering launch, landscape, square, story, and a GIF teaser, with a README explaining each set and the posting rules. Committed so the kit is not dependent on the release page surviving. The same files are also attached to the v3.2.0 release for download without cloning.

---

## What remains

Nothing is blocked and nothing is half-finished. Everything below is a choice, not a dependency.

### Distribution, the only items with real upside

- [ ] Post the Discord showcase. Attach one opener (the GIF teaser autoplays; the hero board is the static alternative) and keep the other boards for thread replies.
- [ ] LinkedIn post. Attach the square image and put the link in the first comment, otherwise LinkedIn renders its own card instead of the image.
- [ ] Instagram and Facebook. The four squares work as a carousel in the order general, employer, bootcamps, graduates; the story format has safe-zone padding for the profile chip and reply bar.

### Evidence polish, optional and cosmetic

- [ ] One manual `link_payment` from a fresh funded wallet. Until then the `PAYMENTS` tile on `/status` reads 0, and the committed metrics screenshot shows it.
- [ ] Save the Vercel Web Analytics dashboard screenshots into `images/` and link them from `docs/operations/submission-evidence.md`, where that row currently reads "screenshots pending". The figures themselves are already transcribed there.

Both gaps are **disclosed honestly already**, including in the public case study, so skipping them costs nothing in credibility.

### Completed

Submission, `v3.2.0` release, the case study at `/case-study`, the campaign kit, unified Open Graph cards, README visuals, the banner archive scheme, the GitHub social preview upload, and the repository parking pass are all done.

---

## Orientation for a new agent

Read in this order:

1. `README.md` — what the product is, with the flow diagram
2. `AGENTS.md` — repository conventions and commands (`CLAUDE.md` is a compatibility pointer)
3. `docs/operations/submission-evidence.md` — the reviewer-facing evidence index
4. `docs/reference/security.md` — every security control and every alert ever triaged
5. `docs/operations/contract-verification.md` — how to reproduce the deployed WASM yourself
6. `stellaroid.tech/case-study` — how the system was built, verified, and corrected

**One standing rule that governs all writing here:** every claim must be checkable, and where a number needs context it carries that context inline rather than in a footnote. The testnet wallet figure of 54 always appears beside its split of 30 independent participants plus 24 QA accounts operated by the author. Preserve that pattern in anything you write.
