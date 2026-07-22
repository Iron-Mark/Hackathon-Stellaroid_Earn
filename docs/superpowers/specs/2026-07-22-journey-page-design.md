# `/journey` Page Design

**Date:** 2026-07-22
**Status:** Approved for planning
**Route:** `https://stellaroid.tech/journey`

## Goal

Give Stellaroid Earn one public page that answers "what has this project actually
earned, and how did it get here" without asking the reader to trust me. The page
braids two tracks that currently live nowhere on the site: the recognition track
(Top 5 of 105, Global Monthly Builder, the June speakership, Blue Belt Level 5)
and the build track (491 commits, nine release tags, two contract deployments
across four months). It also absorbs the attribution duty that
`THIRD-PARTY-NOTICES.md` carries today, so the licensing credits get a
human-readable home instead of only a repo file.

The page is not a pitch. `/slides` is the pitch. This page is the receipt.

## Why this page exists

Three gaps in the current surface:

1. **The accolades are invisible.** `README.md:23` records Top 5 of 105 and
   `/slides` shows the badge, but the Monthly Builder selection, the PH
   representative standing, the June speakership, and Blue Belt appear nowhere
   in the repo or on the site.
2. **Sustained effort is invisible.** A visitor sees a finished app and cannot
   tell whether it took a weekend or four months. The commit shape (24 / 248 /
   13 / 18 / 188 across March to July) tells a more credible story than any
   claim I could write.
3. **Attribution is repo-only.** The OFL-1.1 fonts carry a real notice
   obligation, and today that notice only exists in a markdown file that no
   visitor opens.

## Non-goals

- Not a replacement for `/about` (why the product exists) or `/slides` (the pitch).
- No live counters, no GitHub API calls, no build-time git parsing.
- No localization. The page is English-only, consistent with `/start`.
- No new contract calls, no wallet interaction, no authenticated state.

## Architecture

A static server-rendered route with one client island for the interactive
timeline. Nothing on the page depends on RPC, the contract, or any network call
at request time, so it cannot degrade.

```
app/journey/page.tsx            server, static, metadata + JSON-LD + composition
  components/journey/
    journey-recognition.tsx     server, the award band
    journey-timeline.tsx        client, owns open-state + scroll-spy, renders rail + chapters
    journey-rail.tsx            client child, sticky chapter rail (lg and up)
    journey-chapter.tsx         client child, one accordion chapter
    journey-credits.tsx         server, grouped attribution list
  lib/content/journey.ts        typed content registry (chapters, awards, credits)
  lib/content/types.ts          extended with the journey interfaces
```

The split is deliberate: `journey-recognition.tsx` and `journey-credits.tsx`
stay server components because they have no interaction, so the client bundle
carries only the accordion and the scroll-spy.

## Content model

All page content lives in `lib/content/journey.ts`, following the existing
`docs.ts` and `guides.ts` registry pattern. The page renders this data and holds
no prose of its own.

```ts
export interface JourneyMilestone {
  date: string;                 // "2026-04-18" or "2026-05" for month precision
  title: string;
  detail: string;
  commit?: string;              // 7-40 hex chars, rendered as a GitHub commit link
  pr?: number;                  // rendered as a GitHub PR link
  tag?: string;                 // "v1.0.0", rendered as a GitHub tag link
  link?: { label: string; href: string };   // a live surface, e.g. /slides
}

export interface JourneyAward {
  slug: string;                 // "bootcamp-top5", unique, URL-safe
  chapter: string;              // must resolve to a JourneyChapter.slug
  date: string;                 // "2026-04" or full ISO
  period?: string;              // display override for spans, e.g. "April - July 2026"
  headline: string;             // "Top 5 of 105 - Stellar PH Bootcamp"
  detail: string;               // one sentence of context
  evidence?: { kind: "image" | "link"; href: string; label: string };
}

export interface JourneyChapter {
  slug: string;                 // "bootcamp", unique, URL-safe, becomes the anchor
  eyebrow: string;              // "March - April 2026"
  title: string;
  summary: string;              // the one-line skim
  milestones: JourneyMilestone[];
}

export interface JourneyCreditItem {
  name: string;
  role: string;                 // what it does for this project
  license?: string;             // "Apache-2.0", "MIT", "OFL-1.1"
  href?: string;
}

export interface JourneyCreditGroup {
  title: string;
  note?: string;
  items: JourneyCreditItem[];
}

export const journeyChapters: JourneyChapter[] = [ /* six entries, below */ ];
export const journeyAwards: JourneyAward[] = [ /* five entries, below */ ];
export const journeyCredits: JourneyCreditGroup[] = [ /* five groups, below */ ];
```

`journeyAwards` is the single source for both the recognition band and the
in-chapter award markers, so the two can never disagree. The band renders the
array in date order; each chapter renders the awards whose `chapter` matches its
own slug.

`evidence` is optional by design. An award that has it renders a "View evidence"
link or image; an award without it renders as a plainly stated fact. This lets
the page ship correct today and strengthen one line at a time as evidence is
gathered, with no code change.

### The five awards

| `slug` | `date` | `chapter` | `headline` |
| --- | --- | --- | --- |
| `bootcamp-top5` | `2026-04` | `judge-ready` | Top 5 of 105, Stellar PH Bootcamp 2026 |
| `monthly-builder` | `2026-04` (period "April - July 2026") | `judge-ready` | Selected as a Global Monthly Builder |
| `june-speakership` | `2026-06` | `quiet-and-spotlight` | Speaker at the June Monthly Builder |
| `ph-representative` | `2026-06` | `quiet-and-spotlight` | 1 of 13 Philippine builders among 210 selected globally |
| `blue-belt` | `2026-07-21` | `level5-growth` | Blue Belt, Level 5 |

`bootcamp-top5` ships with `evidence` pointing at the existing
`images/bootcamp-top5.jpg`. The other four ship without `evidence` until
material is supplied.

**One line to confirm before merge:** `ph-representative` is written as "1 of 13
Philippine builders among 210 selected globally from 400 or more applicants,
June Monthly Builder". If the real shape of the 210/400 figure differs, this
string is the only thing that changes.

**Number of record:** the bootcamp result is written as "105 participants" to
match `README.md:23`, which is the number already published.

### The six chapters

| `slug` | `eyebrow` | The beat | Real anchors |
| --- | --- | --- | --- |
| `bootcamp` | March - April 2026 | It started as a Stellar PH bootcamp assignment, not a product | first commit `0aa63b7`, setup guides, tag `v1.0.0` (`8375e93`, Apr 18) |
| `judge-ready` | April 2026 | Turning a submission into something a judge could open, and placing Top 5 | `v1.1.0` (`5e256da`), `v1.2.0` (`71d2b03`), `v1.2.1` (`ae59e1d`, the "employer pays, not the school" copy fix) |
| `quiet-and-spotlight` | May - June 2026 | 31 commits in two months, and the project gets highlighted publicly anyway | `v1.3.0` (`a558c1a`, build and e2e stabilization), `v1.4.0` (`150337a`, structured data) |
| `trust-layer` | Early July 2026 | Making trust legible: issuer dossier, security posture, verification audit | tag `v2.0.0` (`0a65586`), PRs #33, #38, #42, #45 |
| `verified-redeploy` | July 9 2026 | Redeployed from committed source so the deployed WASM is reproducible | tag `v3.0.0` (`3b900ac`), PR #48, contract `CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV` |
| `level5-growth` | July 20 - 22 2026 | Eight wallets, six locales, a read-only MCP server, the deck, and the `/start` funnel | PRs #84, #90, #94, #95, #97, #98, feedback commits `c1450bf`, `09c9d45`, `fa0c5d0`, `145f6ad`, `eb181b8` |

Chapters are ordered oldest to newest. `quiet-and-spotlight` keeps the low
commit count in its summary text rather than hiding it, because the contrast
between a quiet build month and public recognition is the most credible thing
the page says.

### The five credit groups

1. **Stellar ecosystem** - `@stellar/stellar-sdk` and `@stellar/stellar-base`
   (SDF, Apache-2.0), `@stellar/freighter-api` (SDF, Apache-2.0),
   `soroban-sdk`, `@creit.tech/stellar-wallets-kit` (Creit Tech, MIT), Albedo,
   Stellar Expert, friendbot.
2. **The program** - Rise In, the Stellar Smart Contract Bootcamp, and the
   Stellar PH community.
3. **Web stack** - Next.js, React, Vercel, Tailwind CSS, Framer Motion, Lucide,
   `@modelcontextprotocol/sdk` (Anthropic, MIT), `mcp-handler` (MIT).
4. **Fonts** - Orbitron and Exo 2, both OFL-1.1. This group carries a `note`
   reproducing the OFL notice requirement, since it is the one entry on the page
   with an actual legal obligation.
5. **Pilot testers** - the participants who tested the app and submitted
   feedback, credited the same anonymized way as `docs/planning/user-feedback.md`
   (Participant 01 through 05 with their role, no names).

## Page composition

Top to bottom:

1. **Hero.** Title, one-sentence lede, and the honest framing that this is a
   record rather than a pitch. Written in first-person singular.
2. **Recognition band.** The five awards from `journeyAwards` in date order, as
   a responsive grid. Each shows headline, period or date, detail, and an
   evidence affordance when `evidence` is present.
3. **Timeline.** The sticky rail plus the six accordion chapters.
4. **Credits.** The five groups, rendered as grouped definition lists. Anchored
   at `#credits`.
5. **Closing CTA.** Links to `/start` (try it) and the repository.

`SiteNav` and `SiteFooter` wrap the page exactly as `/about` does.

## Interaction design

**Accordion.** Each chapter header is a `<button>` carrying `aria-expanded` and
`aria-controls`, inside an `<h2>` so the page keeps a real heading outline. The
panel is a labelled region referencing its header id.

**Content is always in the DOM.** Collapsed panels are hidden with a
`grid-template-rows: 0fr` to `1fr` transition and `overflow: hidden`, never by
conditional rendering. Crawlers and anyone reading source see every milestone.
Collapsed panels also receive the `inert` attribute, so keyboard focus never
lands inside a visually hidden panel. React 19 supports `inert` as a boolean
prop directly.

**Independent toggles.** Chapters open and close independently. Opening one
never collapses another, so nothing the reader opened disappears.

**Deep linking, and what is open on load.** On mount the component reads
`location.hash`. If the hash matches a chapter slug, that chapter alone is open
and is scrolled into view. If the hash is absent or matches nothing, the first
chapter alone is open. These two rules are exclusive: a deep link never leaves
the first chapter also expanded. This makes `/journey#verified-redeploy` a
shareable link to a specific beat, and makes the rail's anchors behave
correctly.

**Scroll-spy rail.** A sticky rail lists the six chapters, visible at the `lg`
breakpoint and up, hidden below it. An `IntersectionObserver` watching the
chapter sections sets the active entry, which carries `aria-current="true"`.
The observer is created in an effect and disconnected on cleanup.

**Motion.** Framer Motion, using the existing `EASE_DEFI` easing and `fadeUp`
variants from `lib/motion.ts`. The app already wraps everything in
`MotionProvider` with `reducedMotion="user"`, so the OS reduce-motion preference
is honored without new code. Panel height animation uses the CSS grid-rows
technique rather than JS measurement, so it stays correct when content reflows.

## Error handling and degraded states

The page has no runtime data dependency, so there is no loading state, no error
state, and no empty state to design. The failure modes that remain are all
content-level and are caught by tests rather than handled at runtime:

- An award whose `chapter` does not resolve to a real chapter: unit test fails.
- A malformed date, commit SHA, or href: unit test fails.
- JavaScript disabled or the island failing to hydrate: every chapter panel is
  already in the DOM, so all content remains readable. Only the collapse
  behavior and the rail highlight are lost. This is why content is never
  conditionally rendered.

## SEO and metadata

- `buildPageMetadata({ path: "/journey", title: "Journey", description: ... })`,
  matching every other route.
- JSON-LD: a `BreadcrumbList` (Home > Journey) and an `Article` with
  `author` set to the existing `SITE_AUTHOR_NAME` and `SITE_AUTHOR_URL`
  constants, `datePublished` 2026-03-20, `dateModified` the latest chapter date.
  Built through the existing `json-ld-safe` helper.
- Added to `app/sitemap.xml`.
- No `robots` change is needed; the page is static and should be indexed.

## Cross-links

- `SiteFooter`, "Project" column: a `Journey` link.
- `/about`, at the bottom: a link into `/journey`.
- `THIRD-PARTY-NOTICES.md`: a pointer line to `https://stellaroid.tech/journey#credits`
  noting the same attributions are published there.
- `README.md`: the existing Top 5 row gains a link to `/journey`.

## Testing

**Unit** (`lib/content/journey.test.ts`):

The current `test:unit` script globs `src/lib/*.test.ts`, which does **not**
match a test one directory down in `src/lib/content/`. Left alone, the test file
would exist and silently never run. The script must be broadened to
`src/lib/**/*.test.ts` as part of this work. Every existing lib test sits at
`src/lib/*.test.ts`, so the broader glob is a superset and no current test is
dropped. Verify by confirming the reported test count does not fall.

Assertions:

- Every `JourneyChapter.slug` is unique and matches `/^[a-z0-9-]+$/`.
- Every `JourneyAward.slug` is unique and matches the same pattern.
- Every `JourneyAward.chapter` resolves to an existing chapter slug.
- Every date matches `YYYY-MM-DD` or `YYYY-MM`, parses, and falls inside
  2026-03-20 through today.
- Chapters are in ascending date order by their first milestone.
- Every `commit` matches `/^[0-9a-f]{7,40}$/`.
- Every `pr` is a positive integer.
- Every internal `href` starts with `/`; every external one starts with `https://`.
- Every `evidence.href` is either a repo-relative image path or an `https://` URL.
- Every credit item has a non-empty `name` and `role`; every item in the fonts
  group has a `license`.

**E2E** (Playwright, added to the existing spec set):

- `/journey` returns 200 and renders six chapter headings and five award headlines.
- Clicking a chapter header flips its `aria-expanded` between `false` and `true`.
- Loading `/journey#verified-redeploy` leaves that chapter expanded.
- The credits section renders and `#credits` is reachable.

**Checks:** `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## Copy constraints

Binding for every string in `journey.ts` and every component:

- First-person singular. This is a solo build, so "I", never "we".
- No em dashes anywhere.
- "graduate", never "student".
- Any money or payment reference qualified as Stellar testnet.
- No claim without either a link, a repo artifact, or a plainly stated fact
  that I can stand behind. The quiet May and June commit counts stay in.

## Open item

The `ph-representative` wording is the single string awaiting confirmation of
the 210/400 shape. It ships as written above unless corrected during
implementation.
