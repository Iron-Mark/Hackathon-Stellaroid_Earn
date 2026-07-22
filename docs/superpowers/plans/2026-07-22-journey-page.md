# `/journey` Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `https://stellaroid.tech/journey`, a static page that shows what Stellaroid Earn has earned (five recognitions) and how it got there (six chapters anchored to real commits, tags, and PRs), and that gives the third-party attributions a human-readable home.

**Architecture:** One static server-rendered route with a single client island. All content lives in a typed registry at `lib/content/journey.ts` following the existing `docs.ts` and `guides.ts` pattern; components render that data and hold no prose. The recognition band and credits are server components; only the accordion timeline and its scroll-spy rail are client. Nothing calls RPC, the contract, or any network at request time, so the page cannot degrade.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind v4 design tokens, Framer Motion (already a dependency, already wrapped in `MotionProvider` with `reducedMotion="user"`), `node:test` for unit tests, Playwright for e2e.

**Spec:** `docs/superpowers/specs/2026-07-22-journey-page-design.md`

## Global Constraints

- **Copy: first-person singular.** This is a solo build. Use "I" and "my", never "we" or "our".
- **Copy: no em dashes.** Anywhere. Use commas, colons, or periods.
- **Copy: "graduate", never "student".**
- **Copy: qualify money as Stellar testnet.** Never imply mainnet value.
- **No new dependencies.** Framer Motion, Lucide, and Tailwind are already installed. Add nothing to `package.json`.
- **No localization.** The page is English-only, consistent with `/start`. Do not add it to `lib/i18n.ts`.
- **No `Co-Authored-By` trailers** on any commit.
- **Design tokens only.** Use `text-text`, `text-text-muted`, `border-border`, `bg-surface`, `bg-bg`, `bg-primary`, `text-on-primary`, `bg-primary-hover`. Never raw hex.
- **The bootcamp result is "105 participants"**, matching `README.md:23`. Not "105 teams".
- **Every award and milestone claim must be a plainly stated fact or carry a link.** Do not invent evidence URLs.

## File Structure

| File | Responsibility |
| --- | --- |
| `frontend/src/lib/content/types.ts` (modify) | Add the four journey interfaces alongside the existing `DocPage` / `GuideArticle` types |
| `frontend/src/lib/content/journey.ts` (create) | The entire content registry: six chapters, five awards, five credit groups. The only place page prose lives |
| `frontend/src/lib/content/journey.test.ts` (create) | Data integrity: slug uniqueness, date bounds and ordering, SHA and PR shape, href shape, award-to-chapter resolution |
| `frontend/package.json` (modify) | Broaden `test:unit` glob so nested lib tests actually run |
| `frontend/src/components/journey/journey-recognition.tsx` (create) | Server. The award band |
| `frontend/src/components/journey/journey-credits.tsx` (create) | Server. Grouped attribution list, anchored `#credits` |
| `frontend/src/components/journey/journey-chapter.tsx` (create) | Client. One accordion chapter: header button, animated panel, in-chapter award markers |
| `frontend/src/components/journey/journey-rail.tsx` (create) | Client. Sticky chapter rail, `lg` and up |
| `frontend/src/components/journey/journey-timeline.tsx` (create) | Client. Owns open-state, deep linking, and the scroll-spy observer. Composes rail + chapters |
| `frontend/src/app/journey/page.tsx` (create) | Server. Metadata, JSON-LD, page composition |
| `frontend/src/app/sitemap.xml/route.ts` (modify) | Add `/journey` |
| `frontend/src/components/layout/site-footer.tsx` (modify) | Add the Journey link |
| `frontend/src/app/about/page.tsx` (modify) | Add a link to `/journey` |
| `README.md`, `THIRD-PARTY-NOTICES.md` (modify) | Point at `/journey` and `/journey#credits` |
| `frontend/e2e/journey-page.spec.ts` (create) | Renders, toggles, deep-links, credits reachable |

---

### Task 1: Content registry and its integrity tests

**Files:**
- Modify: `frontend/src/lib/content/types.ts` (append)
- Create: `frontend/src/lib/content/journey.ts`
- Create: `frontend/src/lib/content/journey.test.ts`
- Modify: `frontend/package.json:10`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `JourneyChapter`, `JourneyAward`, `JourneyMilestone`, `JourneyCreditItem`, `JourneyCreditGroup` types; `journeyChapters: JourneyChapter[]`, `journeyAwards: JourneyAward[]`, `journeyCredits: JourneyCreditGroup[]`; and the helpers `awardsForChapter(slug: string): JourneyAward[]` and `githubCommitUrl(sha: string): string`, `githubPrUrl(n: number): string`, `githubTagUrl(tag: string): string`.

- [ ] **Step 1: Fix the test glob first, so the new test can never be silently skipped**

The current script globs `src/lib/*.test.ts`, which does not match `src/lib/content/journey.test.ts`. Change `frontend/package.json` line 10:

```json
    "test:unit": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test src/lib/**/*.test.ts src/app/**/*.test.ts",
```

- [ ] **Step 2: Record the current test count as the baseline**

Run: `cd frontend && npm run test:unit 2>&1 | tail -12`
Expected: a summary line such as `# pass 75`. Write the number down. After the glob change it must not go down.

- [ ] **Step 3: Append the journey interfaces to `frontend/src/lib/content/types.ts`**

```ts
/** One dated entry inside a journey chapter. */
export interface JourneyMilestone {
  /** "2026-04-18" (day precision) or "2026-05" (month precision). */
  date: string;
  title: string;
  detail: string;
  /** Short or full commit SHA, 7-40 hex chars. Rendered as a GitHub link. */
  commit?: string;
  /** Pull request number. Rendered as a GitHub link. */
  pr?: number;
  /** Release tag, e.g. "v1.0.0". Rendered as a GitHub link. */
  tag?: string;
  /** A live surface this milestone produced, e.g. { label: "See the deck", href: "/slides" }. */
  link?: { label: string; href: string };
}

/** A recognition. Rendered both in the top band and inside its chapter. */
export interface JourneyAward {
  /** Unique, URL-safe. */
  slug: string;
  /** Must match a JourneyChapter.slug. */
  chapter: string;
  /** "2026-04" or "2026-07-21". Orders the band. */
  date: string;
  /** Display override for spans, e.g. "April - July 2026". */
  period?: string;
  headline: string;
  detail: string;
  evidence?: { kind: "image" | "link"; href: string; label: string };
}

/** One act of the story. Its slug is the page anchor. */
export interface JourneyChapter {
  /** Unique, URL-safe. Becomes the #anchor and the rail target. */
  slug: string;
  eyebrow: string;
  title: string;
  /** The one-line skim, shown collapsed. */
  summary: string;
  milestones: JourneyMilestone[];
}

export interface JourneyCreditItem {
  name: string;
  /** What it does for this project. */
  role: string;
  /** SPDX-ish identifier, e.g. "Apache-2.0", "MIT", "OFL-1.1". */
  license?: string;
  href?: string;
}

export interface JourneyCreditGroup {
  title: string;
  note?: string;
  items: JourneyCreditItem[];
}
```

- [ ] **Step 4: Write the failing test at `frontend/src/lib/content/journey.test.ts`**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  journeyChapters,
  journeyAwards,
  journeyCredits,
  awardsForChapter,
  githubCommitUrl,
  githubPrUrl,
  githubTagUrl,
} from "./journey.ts";

const DATE_RE = /^\d{4}-\d{2}(-\d{2})?$/;
const SLUG_RE = /^[a-z0-9-]+$/;
const SHA_RE = /^[0-9a-f]{7,40}$/;
const FIRST_COMMIT = Date.parse("2026-03-20");

/** Month-precision dates sort correctly when padded to the first of the month. */
function toTime(date: string): number {
  return Date.parse(date.length === 7 ? `${date}-01` : date);
}

test("chapters have unique, URL-safe slugs", () => {
  const slugs = journeyChapters.map((c) => c.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate chapter slug");
  for (const slug of slugs) assert.match(slug, SLUG_RE);
  assert.ok(journeyChapters.length >= 6, "expected at least six chapters");
});

test("every chapter has non-empty prose and at least one milestone", () => {
  for (const chapter of journeyChapters) {
    assert.ok(chapter.title.length > 0, `${chapter.slug} title`);
    assert.ok(chapter.summary.length > 0, `${chapter.slug} summary`);
    assert.ok(chapter.eyebrow.length > 0, `${chapter.slug} eyebrow`);
    assert.ok(chapter.milestones.length > 0, `${chapter.slug} milestones`);
  }
});

test("every milestone date is well-formed and within the project's lifetime", () => {
  const now = Date.now();
  for (const chapter of journeyChapters) {
    for (const m of chapter.milestones) {
      assert.match(m.date, DATE_RE, `${chapter.slug}: ${m.title}`);
      const t = toTime(m.date);
      assert.ok(!Number.isNaN(t), `${m.title} unparseable`);
      assert.ok(t >= FIRST_COMMIT, `${m.title} predates the first commit`);
      assert.ok(t <= now, `${m.title} is in the future`);
    }
  }
});

test("chapters run oldest to newest by their first milestone", () => {
  const times = journeyChapters.map((c) => toTime(c.milestones[0].date));
  const sorted = [...times].sort((a, b) => a - b);
  assert.deepEqual(times, sorted, "chapters are out of chronological order");
});

test("commit SHAs, PR numbers, and tags are well-formed", () => {
  for (const chapter of journeyChapters) {
    for (const m of chapter.milestones) {
      if (m.commit !== undefined) assert.match(m.commit, SHA_RE, m.title);
      if (m.pr !== undefined) {
        assert.ok(Number.isInteger(m.pr) && m.pr > 0, `${m.title} pr`);
      }
      if (m.tag !== undefined) assert.match(m.tag, /^v\d+\.\d+\.\d+$/, m.title);
    }
  }
});

test("milestone links are root-relative or https", () => {
  for (const chapter of journeyChapters) {
    for (const m of chapter.milestones) {
      if (!m.link) continue;
      assert.ok(m.link.label.length > 0, `${m.title} link label`);
      assert.ok(
        m.link.href.startsWith("/") || m.link.href.startsWith("https://"),
        `${m.title} href must be root-relative or https, got ${m.link.href}`,
      );
    }
  }
});

test("awards have unique slugs and resolve to a real chapter", () => {
  const slugs = journeyAwards.map((a) => a.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate award slug");
  const chapterSlugs = new Set(journeyChapters.map((c) => c.slug));
  for (const award of journeyAwards) {
    assert.match(award.slug, SLUG_RE);
    assert.ok(
      chapterSlugs.has(award.chapter),
      `award ${award.slug} points at unknown chapter ${award.chapter}`,
    );
    assert.match(award.date, DATE_RE, award.slug);
    assert.ok(award.headline.length > 0, `${award.slug} headline`);
    assert.ok(award.detail.length > 0, `${award.slug} detail`);
  }
  assert.equal(journeyAwards.length, 5, "expected exactly five awards");
});

test("award evidence, when present, points somewhere real", () => {
  for (const award of journeyAwards) {
    if (!award.evidence) continue;
    const { kind, href, label } = award.evidence;
    assert.ok(kind === "image" || kind === "link", `${award.slug} kind`);
    assert.ok(label.length > 0, `${award.slug} evidence label`);
    assert.ok(
      href.startsWith("/") || href.startsWith("https://"),
      `${award.slug} evidence href must be root-relative or https, got ${href}`,
    );
  }
});

test("the bootcamp result says participants, not teams", () => {
  const top5 = journeyAwards.find((a) => a.slug === "bootcamp-top5");
  assert.ok(top5, "bootcamp-top5 award is missing");
  const text = `${top5.headline} ${top5.detail}`;
  assert.ok(/participants/i.test(text), "must match README's '105 participants'");
  assert.ok(!/teams/i.test(text), "must not claim teams");
});

test("awardsForChapter returns only that chapter's awards, in date order", () => {
  for (const chapter of journeyChapters) {
    const awards = awardsForChapter(chapter.slug);
    for (const award of awards) assert.equal(award.chapter, chapter.slug);
    const times = awards.map((a) => toTime(a.date));
    assert.deepEqual(times, [...times].sort((a, b) => a - b));
  }
  assert.deepEqual(awardsForChapter("no-such-chapter"), []);
});

test("every award is reachable from some chapter", () => {
  const placed = journeyChapters.flatMap((c) => awardsForChapter(c.slug));
  assert.equal(placed.length, journeyAwards.length, "an award was orphaned");
});

test("credit groups are populated and fonts carry their license", () => {
  assert.ok(journeyCredits.length >= 5, "expected at least five credit groups");
  for (const group of journeyCredits) {
    assert.ok(group.title.length > 0);
    assert.ok(group.items.length > 0, `${group.title} has no items`);
    for (const item of group.items) {
      assert.ok(item.name.length > 0, `${group.title} item name`);
      assert.ok(item.role.length > 0, `${item.name} role`);
      if (item.href !== undefined) {
        assert.ok(item.href.startsWith("https://"), `${item.name} href`);
      }
    }
  }
  const fonts = journeyCredits.find((g) => /font/i.test(g.title));
  assert.ok(fonts, "a fonts credit group is required by OFL-1.1");
  assert.ok(fonts.note && fonts.note.length > 0, "fonts group needs the OFL notice");
  for (const item of fonts.items) {
    assert.equal(item.license, "OFL-1.1", `${item.name} license`);
  }
});

test("copy rules hold across all page prose", () => {
  const prose = [
    ...journeyChapters.flatMap((c) => [
      c.title,
      c.summary,
      c.eyebrow,
      ...c.milestones.flatMap((m) => [m.title, m.detail]),
    ]),
    ...journeyAwards.flatMap((a) => [a.headline, a.detail]),
    ...journeyCredits.flatMap((g) => [g.title, g.note ?? "", ...g.items.map((i) => i.role)]),
  ];
  for (const line of prose) {
    assert.ok(!line.includes("—"), `em dash found in: ${line}`);
    assert.ok(!/\bstudents?\b/i.test(line), `use "graduate" not "student": ${line}`);
    assert.ok(!/\b(we|our)\b/i.test(line), `solo build, use first person singular: ${line}`);
  }
});

test("github url helpers build against the real repository", () => {
  assert.equal(
    githubCommitUrl("0aa63b7"),
    "https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn/commit/0aa63b7",
  );
  assert.equal(
    githubPrUrl(95),
    "https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn/pull/95",
  );
  assert.equal(
    githubTagUrl("v3.0.0"),
    "https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn/releases/tag/v3.0.0",
  );
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `cd frontend && npm run test:unit 2>&1 | tail -20`
Expected: FAIL with `Cannot find module` for `./journey.ts`.

- [ ] **Step 6: Create `frontend/src/lib/content/journey.ts`**

Note on imports: this file is consumed by the `node --experimental-strip-types` test runner, so the type import must carry the `.ts` extension, matching how `hex.test.ts` imports `./hex.ts`.

```ts
// The /journey page's entire content. Every claim here is either a plainly
// stated fact or carries a link to a real commit, PR, tag, or live surface.
// Grounded in this repository's git history: first commit 0aa63b7 (2026-03-20)
// through the Level 5 submission work (2026-07-22).
import type {
  JourneyAward,
  JourneyChapter,
  JourneyCreditGroup,
} from "./types";

const REPO = "https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn";

export function githubCommitUrl(sha: string): string {
  return `${REPO}/commit/${sha}`;
}

export function githubPrUrl(n: number): string {
  return `${REPO}/pull/${n}`;
}

export function githubTagUrl(tag: string): string {
  return `${REPO}/releases/tag/${tag}`;
}

export const journeyChapters: JourneyChapter[] = [
  {
    slug: "bootcamp",
    eyebrow: "March - April 2026",
    title: "It started as a bootcamp assignment",
    summary:
      "The first commit is a setup guide, not a product. Stellaroid Earn began as my submission for the Rise In Stellar Smart Contract Bootcamp.",
    milestones: [
      {
        date: "2026-03-20",
        title: "First commit",
        detail:
          "The repository opens as a participant guide for the Stellar PH bootcamp: install the toolchain, complete the assigned Soroban contract, deploy to testnet.",
        commit: "0aa63b7",
      },
      {
        date: "2026-04-17",
        title: "Cross-platform setup documented",
        detail:
          "I rewrote the setup path so it worked on both macOS and Windows, because the toolchain install was where most people got stuck.",
        commit: "dc1a2e3",
      },
      {
        date: "2026-04-18",
        title: "v1.0.0, the bootcamp submission",
        detail:
          "The credential contract and a working frontend, deployed to Stellar testnet and submitted.",
        commit: "8375e93",
        tag: "v1.0.0",
      },
    ],
  },
  {
    slug: "judge-ready",
    eyebrow: "April 2026",
    title: "Making it something a judge could actually open",
    summary:
      "Three releases in three days, turning a working submission into a reviewable one. It placed Top 5 of 105 participants.",
    milestones: [
      {
        date: "2026-04-19",
        title: "v1.1.0, judge-ready README and screenshots",
        detail:
          "Screenshots, a readable README, and the first attribution pass so the third-party licenses were recorded.",
        commit: "5e256da",
        tag: "v1.1.0",
      },
      {
        date: "2026-04-20",
        title: "v1.2.0, automated releases",
        detail:
          "A GitHub release workflow, so every tagged version ships with its artifacts attached instead of by hand.",
        commit: "71d2b03",
        tag: "v1.2.0",
      },
      {
        date: "2026-04-20",
        title: "v1.2.1, fixing a claim that was wrong",
        detail:
          "My walkthrough said the school paid the graduate. It does not: the employer pays. I shipped the correction the same day rather than leave a misleading step in the demo.",
        commit: "ae59e1d",
        tag: "v1.2.1",
      },
    ],
  },
  {
    slug: "quiet-and-spotlight",
    eyebrow: "May - June 2026",
    title: "Quiet in commits, loud in recognition",
    summary:
      "Thirty-one commits across two months, the slowest stretch of the project. The event was over and most submissions stop here. This one got picked to speak instead.",
    milestones: [
      {
        date: "2026-05-10",
        title: "v1.3.0, stabilized the build and the proof flow",
        detail:
          "Fixed the frontend build and the end-to-end proof path so the public demo kept working without me watching it.",
        commit: "a558c1a",
        tag: "v1.3.0",
      },
      {
        date: "2026-05-27",
        title: "v1.4.0, structured data",
        detail:
          "Search-engine structured data and funding metadata, so the proof pages describe themselves correctly when shared.",
        commit: "150337a",
        tag: "v1.4.0",
      },
    ],
  },
  {
    slug: "trust-layer",
    eyebrow: "Early July 2026",
    title: "Making trust legible",
    summary:
      "A credential is only worth the issuer behind it. This stretch built the trust surface: issuer dossiers, a security posture, and an audit of what the contract actually claims.",
    milestones: [
      {
        date: "2026-07-03",
        title: "v2.0.0, issuer and proof trust polish",
        detail:
          "Issuer registration, approval gating, and suspended-issuer states became visible in the product rather than implied by the contract.",
        commit: "0a65586",
        tag: "v2.0.0",
        pr: 33,
      },
      {
        date: "2026-07-04",
        title: "Contract verification audit",
        detail:
          "Checked what the deployed contract does against what the documentation says it does, and wrote down the gaps.",
        pr: 38,
      },
      {
        date: "2026-07-05",
        title: "Security and demo readiness",
        detail:
          "Security headers, a content security policy, and rate limiting on every write path before opening the demo more widely.",
        pr: 42,
      },
      {
        date: "2026-07-07",
        title: "Trust dossier",
        detail:
          "A single page an employer can read to decide whether an issuer is credible, instead of asking me.",
        pr: 45,
      },
    ],
  },
  {
    slug: "verified-redeploy",
    eyebrow: "July 2026",
    title: "Redeployed so the contract can be checked, not trusted",
    summary:
      "I rebuilt the contract from committed source and redeployed it with verification metadata embedded, so anyone can reproduce the deployed bytecode from this repository.",
    milestones: [
      {
        date: "2026-07-09",
        title: "v3.0.0, source-verified contract",
        detail:
          "Redeployed from committed source with source_repo and home_domain metadata embedded. The deployed WASM hash is reproducible from the repository, and the release tag carries a build attestation.",
        commit: "3b900ac",
        tag: "v3.0.0",
        pr: 48,
        link: { label: "Check it on /status", href: "/status" },
      },
    ],
  },
  {
    slug: "level5-growth",
    eyebrow: "July 2026",
    title: "Built for other people to use, not just to demo",
    summary:
      "The Level 5 push: eight wallets, six languages, a read-only interface for AI agents, and a one-tap way for a stranger to sign a real testnet action.",
    milestones: [
      {
        date: "2026-07-21",
        title: "Eight wallets and mobile signing",
        detail:
          "Freighter and Albedo natively, six more through the Stellar Wallets Kit, and WalletConnect so a phone wallet can sign.",
        pr: 84,
      },
      {
        date: "2026-07-21",
        title: "Five improvements from pilot feedback",
        detail:
          "Every point my pilot testers raised was mapped to the commit that addressed it: role guidance, role choice after connecting, wallet history, mobile support, and issued-credential clarity.",
        commit: "c1450bf",
      },
      {
        date: "2026-07-21",
        title: "Security audit pass",
        detail:
          "Dependency vulnerabilities patched, edge firewall rules added, and the rate-limit key corrected to the real client address.",
        pr: 92,
      },
      {
        date: "2026-07-22",
        title: "Pitch deck completed",
        detail:
          "The deck reached all six required sections, including market opportunity, growth strategy, and the roadmap.",
        pr: 94,
        link: { label: "Open the deck", href: "/slides" },
      },
      {
        date: "2026-07-22",
        title: "A 60-second way to try it",
        detail:
          "A guided flow that connects a wallet, funds it on testnet, and walks someone through signing one real on-chain action.",
        pr: 95,
        link: { label: "Try it yourself", href: "/start" },
      },
      {
        date: "2026-07-22",
        title: "Submission packaging",
        detail:
          "Feedback exported to a spreadsheet, evidence indexed against every requirement, and the wallet prefill wired so a first-time signer can be counted.",
        pr: 97,
      },
    ],
  },
];

export const journeyAwards: JourneyAward[] = [
  {
    slug: "bootcamp-top5",
    chapter: "judge-ready",
    date: "2026-04",
    period: "April 2026",
    headline: "Top 5 of 105 participants",
    detail:
      "Rise In Stellar Smart Contract Bootcamp, Stellar PH 2026. Final score 75.00.",
    evidence: {
      kind: "image",
      href: "/journey/bootcamp-top5.jpg",
      label: "Bootcamp results",
    },
  },
  {
    slug: "monthly-builder",
    chapter: "judge-ready",
    date: "2026-04",
    period: "April - July 2026",
    headline: "Selected as a Global Monthly Builder",
    detail:
      "Carried the project through four consecutive monthly builder rounds after the bootcamp ended.",
  },
  {
    slug: "june-speakership",
    chapter: "quiet-and-spotlight",
    date: "2026-06",
    period: "June 2026",
    headline: "Speaker at the June Monthly Builder",
    detail: "Stellaroid Earn was highlighted and I presented it to the cohort.",
  },
  {
    slug: "ph-representative",
    chapter: "quiet-and-spotlight",
    date: "2026-06",
    period: "June 2026",
    headline: "1 of 13 Philippine builders selected",
    detail:
      "Among 210 builders selected globally from more than 400 applicants in the June Monthly Builder round.",
  },
  {
    slug: "blue-belt",
    chapter: "level5-growth",
    date: "2026-07-21",
    period: "July 2026",
    headline: "Blue Belt, Level 5",
    detail:
      "Approved into the Level 5 track, which is judged on user growth, product iteration, and the pitch rather than on building something new.",
  },
];

export const journeyCredits: JourneyCreditGroup[] = [
  {
    title: "Stellar ecosystem",
    note: "The contract, the wallets, and the explorers this project is built on.",
    items: [
      {
        name: "@stellar/stellar-sdk",
        role: "Builds and simulates every transaction the app sends",
        license: "Apache-2.0",
        href: "https://github.com/stellar/js-stellar-sdk",
      },
      {
        name: "soroban-sdk",
        role: "The Rust SDK the credential contract is written against",
        license: "Apache-2.0",
        href: "https://github.com/stellar/rs-soroban-sdk",
      },
      {
        name: "@stellar/freighter-api",
        role: "Browser wallet connection and signing",
        license: "Apache-2.0",
        href: "https://github.com/stellar/freighter",
      },
      {
        name: "@creit.tech/stellar-wallets-kit",
        role: "Adds six more wallets behind one interface",
        license: "MIT",
        href: "https://github.com/Creit-Tech/Stellar-Wallets-Kit",
      },
      {
        name: "Albedo",
        role: "Web wallet signing with no extension required",
        href: "https://albedo.link/",
      },
      {
        name: "Stellar Expert",
        role: "The public explorer every proof link points at",
        href: "https://stellar.expert/",
      },
      {
        name: "Friendbot",
        role: "Funds a fresh testnet account so anyone can try the app",
        href: "https://developers.stellar.org/docs/build/guides/basics/create-account",
      },
    ],
  },
  {
    title: "The program",
    note: "Stellaroid Earn would not exist without this bootcamp and the people running it.",
    items: [
      {
        name: "Rise In",
        role: "Ran the Stellar Smart Contract Bootcamp and the Monthly Builder track",
        href: "https://www.risein.com/programs",
      },
      {
        name: "Stellar Development Foundation",
        role: "Maintains Soroban, the SDKs, and the testnet this runs on",
        href: "https://stellar.org/",
      },
      {
        name: "Stellar PH community",
        role: "The cohort and facilitators who reviewed and pushed the project",
      },
    ],
  },
  {
    title: "Web stack",
    items: [
      {
        name: "Next.js and React",
        role: "The App Router application and its server components",
        license: "MIT",
        href: "https://nextjs.org/",
      },
      {
        name: "Vercel",
        role: "Hosting, edge firewall, and analytics",
        href: "https://vercel.com/",
      },
      {
        name: "Tailwind CSS",
        role: "The design token system behind every surface",
        license: "MIT",
        href: "https://tailwindcss.com/",
      },
      {
        name: "Framer Motion",
        role: "Animation, honoring the reduce-motion preference",
        license: "MIT",
        href: "https://www.framer.com/motion/",
      },
      {
        name: "Lucide",
        role: "The icon set",
        license: "ISC",
        href: "https://lucide.dev/",
      },
      {
        name: "@modelcontextprotocol/sdk",
        role: "Powers the read-only endpoint that lets AI agents verify a credential",
        license: "MIT",
        href: "https://github.com/modelcontextprotocol/typescript-sdk",
      },
    ],
  },
  {
    title: "Fonts",
    note: "Both faces are licensed under the SIL Open Font License 1.1, which requires that this notice accompany the font files. They are redistributed here as web font files only, with no Reserved Font Name used in a modified version.",
    items: [
      {
        name: "Orbitron",
        role: "Display face, self-hosted through next/font",
        license: "OFL-1.1",
        href: "https://openfontlicense.org/",
      },
      {
        name: "Exo 2",
        role: "Body face, self-hosted through next/font",
        license: "OFL-1.1",
        href: "https://openfontlicense.org/",
      },
    ],
  },
  {
    title: "Pilot testers",
    note: "The people who tested the app on testnet and told me what was broken. Credited the same anonymized way as the published feedback export.",
    items: [
      { name: "Participant 01", role: "Bootcamp participant, viewed a proof and filed feedback" },
      { name: "Participant 02", role: "Employer role tester, registered as an issuer" },
      { name: "Participant 03", role: "Issuer flow tester, received a testnet XLM payment" },
      { name: "Participant 04", role: "Mobile experience tester, asked for the mobile work" },
      { name: "Participant 05", role: "Proof verification tester, explored the dashboard" },
    ],
  },
];

/** Month-precision dates sort correctly when padded to the first of the month. */
function awardTime(date: string): number {
  return Date.parse(date.length === 7 ? `${date}-01` : date);
}

/** The awards belonging to one chapter, oldest first. Empty for unknown slugs. */
export function awardsForChapter(slug: string): JourneyAward[] {
  return journeyAwards
    .filter((award) => award.chapter === slug)
    .sort((a, b) => awardTime(a.date) - awardTime(b.date));
}
```

- [ ] **Step 7: Copy the Top 5 evidence image into the public directory**

The award references `/journey/bootcamp-top5.jpg`, which must be servable. The source lives at the repo root in `images/`.

```bash
mkdir -p frontend/public/journey
cp images/bootcamp-top5.jpg frontend/public/journey/bootcamp-top5.jpg
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `cd frontend && npm run test:unit 2>&1 | tail -20`
Expected: PASS, and the total pass count is the Step 2 baseline plus the new tests. If the count *dropped*, the glob change broke discovery: revert to listing both `src/lib/*.test.ts src/lib/**/*.test.ts` and re-run.

- [ ] **Step 9: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: no output.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/lib/content/types.ts frontend/src/lib/content/journey.ts frontend/src/lib/content/journey.test.ts frontend/package.json frontend/public/journey/
git commit -m "feat(journey): add the journey content registry with integrity tests"
```

---

### Task 2: Recognition band and credits (server components)

**Files:**
- Create: `frontend/src/components/journey/journey-recognition.tsx`
- Create: `frontend/src/components/journey/journey-credits.tsx`

**Interfaces:**
- Consumes: `journeyAwards`, `journeyCredits` from `@/lib/content/journey`; `JourneyAward` from `@/lib/content/types`.
- Produces: `<JourneyRecognition />` and `<JourneyCredits />`, both taking no props. `JourneyCredits` renders a section with `id="credits"`.

Both are server components with no interaction, so they must NOT carry `"use client"`. This keeps them out of the client bundle.

- [ ] **Step 1: Create `frontend/src/components/journey/journey-recognition.tsx`**

```tsx
import { journeyAwards } from "@/lib/content/journey";

/**
 * The award band. Renders every recognition in date order so a visitor sees
 * what the project earned before reading how it was built. Server component:
 * there is no interaction here, so it ships no client JavaScript.
 */
export function JourneyRecognition() {
  return (
    <section aria-labelledby="recognition-heading" className="my-12">
      <h2
        id="recognition-heading"
        className="text-sm font-semibold uppercase tracking-[0.08em] text-text-muted m-0"
      >
        Recognition
      </h2>
      <ul className="mt-4 grid gap-3 p-0 list-none sm:grid-cols-2 lg:grid-cols-3">
        {journeyAwards.map((award) => (
          <li
            key={award.slug}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="m-0 text-xs font-medium uppercase tracking-[0.06em] text-primary">
              {award.period ?? award.date}
            </p>
            <h3 className="mt-2 mb-0 text-base font-semibold leading-snug text-text">
              {award.headline}
            </h3>
            <p className="mt-2 mb-0 text-sm leading-relaxed text-text-muted">
              {award.detail}
            </p>
            {award.evidence ? (
              <a
                href={award.evidence.href}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center text-xs font-semibold text-primary no-underline hover:underline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              >
                {award.evidence.label}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/journey/journey-credits.tsx`**

```tsx
import { journeyCredits } from "@/lib/content/journey";

/**
 * Attribution, published rather than left in THIRD-PARTY-NOTICES.md. The fonts
 * group carries the OFL-1.1 notice, which is the one entry on this page with an
 * actual licensing obligation. Server component: no interaction.
 */
export function JourneyCredits() {
  return (
    <section
      id="credits"
      aria-labelledby="credits-heading"
      className="scroll-mt-24 my-16 border-t border-border pt-10"
    >
      <h2
        id="credits-heading"
        className="m-0 text-2xl font-semibold tracking-tight text-text"
      >
        Built on other people&apos;s work
      </h2>
      <p className="mt-2 mb-0 max-w-[65ch] text-sm leading-relaxed text-text-muted">
        Stellaroid Earn is MIT licensed and depends on the projects below. Each
        keeps its own license. This is the same list carried in the
        repository&apos;s third-party notices.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {journeyCredits.map((group) => (
          <section key={group.title} aria-label={group.title}>
            <h3 className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-text">
              {group.title}
            </h3>
            {group.note ? (
              <p className="mt-2 mb-0 max-w-[60ch] text-xs leading-relaxed text-text-muted">
                {group.note}
              </p>
            ) : null}
            <dl className="mt-4 grid gap-3">
              {group.items.map((item) => (
                <div key={item.name}>
                  <dt className="m-0 text-sm font-semibold text-text">
                    {item.href ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-text no-underline hover:text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                      >
                        {item.name}
                      </a>
                    ) : (
                      item.name
                    )}
                    {item.license ? (
                      <span className="ml-2 rounded-full border border-border px-2 py-0.5 align-middle text-[0.6875rem] font-medium text-text-muted">
                        {item.license}
                      </span>
                    ) : null}
                  </dt>
                  <dd className="m-0 text-sm leading-relaxed text-text-muted">
                    {item.role}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Typecheck and lint**

Run: `cd frontend && npx tsc --noEmit && npm run lint`
Expected: no type errors, no lint errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/journey/journey-recognition.tsx frontend/src/components/journey/journey-credits.tsx
git commit -m "feat(journey): add recognition band and credits sections"
```

---

### Task 3: The accordion chapter (client)

**Files:**
- Create: `frontend/src/components/journey/journey-chapter.tsx`

**Interfaces:**
- Consumes: `awardsForChapter`, `githubCommitUrl`, `githubPrUrl`, `githubTagUrl` from `@/lib/content/journey`; `JourneyChapter` from `@/lib/content/types`.
- Produces: `<JourneyChapter chapter={chapter} index={n} isOpen={bool} onToggle={() => void} />` where `chapter: JourneyChapter`, `index: number`, `isOpen: boolean`, `onToggle: () => void`. The rendered `<section>` carries `id={chapter.slug}` so the rail and deep links can target it.

Three requirements that are easy to get wrong, so read them before writing code:

1. **Panel content is always rendered.** Never `{isOpen && <div>...}`. Collapse is visual only, using a CSS grid-rows transition. This is what keeps the page readable if the island fails to hydrate and keeps the text crawlable.
2. **Collapsed panels get `inert`.** Otherwise keyboard focus walks into an invisible panel. React 19 supports `inert` as a boolean prop.
3. **The header is a `<button>` inside an `<h2>`.** Not a clickable div. The button carries `aria-expanded` and `aria-controls`.

- [ ] **Step 1: Create `frontend/src/components/journey/journey-chapter.tsx`**

```tsx
"use client";

import { ChevronDown } from "lucide-react";
import {
  awardsForChapter,
  githubCommitUrl,
  githubPrUrl,
  githubTagUrl,
} from "@/lib/content/journey";
import type { JourneyChapter as Chapter } from "@/lib/content/types";

/** "2026-04-18" -> "18 Apr 2026"; "2026-05" -> "May 2026". */
function formatDate(date: string): string {
  const parts = date.split("-");
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const month = monthNames[Number(parts[1]) - 1];
  return parts.length === 3
    ? `${Number(parts[2])} ${month} ${parts[0]}`
    : `${month} ${parts[0]}`;
}

export function JourneyChapter({
  chapter,
  index,
  isOpen,
  onToggle,
}: {
  chapter: Chapter;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const panelId = `journey-panel-${chapter.slug}`;
  const headerId = `journey-header-${chapter.slug}`;
  const awards = awardsForChapter(chapter.slug);

  return (
    <section
      id={chapter.slug}
      aria-labelledby={headerId}
      className="scroll-mt-24 border-b border-border py-6 first:pt-0"
    >
      <h2 className="m-0">
        <button
          type="button"
          id={headerId}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="flex w-full items-start gap-4 bg-transparent border-0 p-0 text-left cursor-pointer group focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4"
        >
          <span
            aria-hidden="true"
            className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-text-muted"
          >
            {index + 1}
          </span>
          <span className="flex-1">
            <span className="block text-xs font-medium uppercase tracking-[0.08em] text-primary">
              {chapter.eyebrow}
            </span>
            <span className="mt-1 block text-lg font-semibold leading-snug text-text group-hover:text-primary transition-colors">
              {chapter.title}
            </span>
            <span className="mt-2 block max-w-[65ch] text-sm leading-relaxed text-text-muted">
              {chapter.summary}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`mt-1 h-5 w-5 shrink-0 text-text-muted transition-transform duration-300 motion-reduce:transition-none ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </h2>

      {/*
        Collapse is visual only. The panel stays in the DOM in every state so the
        content remains readable without JavaScript and crawlable by search
        engines. `inert` keeps keyboard focus out while it is collapsed.
      */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        inert={!isOpen}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pl-11 pt-5">
            {awards.length > 0 ? (
              <ul className="m-0 mb-5 grid gap-2 p-0 list-none">
                {awards.map((award) => (
                  <li
                    key={award.slug}
                    className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2"
                  >
                    <p className="m-0 text-sm font-semibold text-text">
                      {award.headline}
                    </p>
                    <p className="mt-1 mb-0 text-xs leading-relaxed text-text-muted">
                      {award.detail}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}

            <ol className="m-0 grid gap-5 p-0 list-none">
              {chapter.milestones.map((milestone) => (
                <li key={`${milestone.date}-${milestone.title}`}>
                  <p className="m-0 text-xs font-medium tabular-nums text-text-muted">
                    {formatDate(milestone.date)}
                  </p>
                  <p className="mt-1 mb-0 text-sm font-semibold text-text">
                    {milestone.title}
                  </p>
                  <p className="mt-1 mb-0 max-w-[65ch] text-sm leading-relaxed text-text-muted">
                    {milestone.detail}
                  </p>
                  <p className="mt-2 mb-0 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    {milestone.tag ? (
                      <a
                        href={githubTagUrl(milestone.tag)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-primary no-underline hover:underline"
                      >
                        {milestone.tag}
                      </a>
                    ) : null}
                    {milestone.commit ? (
                      <a
                        href={githubCommitUrl(milestone.commit)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-text-muted no-underline hover:text-primary hover:underline"
                      >
                        {milestone.commit}
                      </a>
                    ) : null}
                    {milestone.pr ? (
                      <a
                        href={githubPrUrl(milestone.pr)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-text-muted no-underline hover:text-primary hover:underline"
                      >
                        PR #{milestone.pr}
                      </a>
                    ) : null}
                    {milestone.link ? (
                      <a
                        href={milestone.link.href}
                        className="font-semibold text-primary no-underline hover:underline"
                      >
                        {milestone.link.label}
                      </a>
                    ) : null}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: no output. If `inert` errors as an unknown prop, the installed `@types/react` predates React 19 support; in that case check the installed version with `npm ls @types/react` and report it rather than casting the prop away.

- [ ] **Step 3: Lint**

Run: `cd frontend && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/journey/journey-chapter.tsx
git commit -m "feat(journey): add the accordion chapter component"
```

---

### Task 4: The rail and the timeline island

**Files:**
- Create: `frontend/src/components/journey/journey-rail.tsx`
- Create: `frontend/src/components/journey/journey-timeline.tsx`

**Interfaces:**
- Consumes: `<JourneyChapter />` from Task 3 with props `{ chapter, index, isOpen, onToggle }`; `journeyChapters` from `@/lib/content/journey`.
- Produces: `<JourneyTimeline />`, no props, the single client island the page mounts. `<JourneyRail activeSlug={string | null} onJump={(slug: string) => void} />`.

Open-state rules, exactly as specified:

- On mount, if `location.hash` matches a chapter slug, **only** that chapter is open and it is scrolled into view.
- Otherwise **only** the first chapter is open.
- After mount, chapters toggle independently. Opening one never closes another.

- [ ] **Step 1: Create `frontend/src/components/journey/journey-rail.tsx`**

```tsx
"use client";

import { journeyChapters } from "@/lib/content/journey";

/**
 * Sticky chapter rail. Hidden below the lg breakpoint, where the page is a
 * single column and the rail would only cost vertical space.
 */
export function JourneyRail({
  activeSlug,
  onJump,
}: {
  activeSlug: string | null;
  onJump: (slug: string) => void;
}) {
  return (
    <nav
      aria-label="Chapters"
      className="hidden lg:block sticky top-24 self-start"
    >
      <ul className="m-0 grid gap-1 p-0 list-none border-l border-border">
        {journeyChapters.map((chapter) => {
          const isActive = chapter.slug === activeSlug;
          return (
            <li key={chapter.slug}>
              <a
                href={`#${chapter.slug}`}
                aria-current={isActive ? "true" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  onJump(chapter.slug);
                }}
                className={`block border-l-2 py-1.5 pl-3 -ml-px text-xs leading-snug no-underline transition-colors ${
                  isActive
                    ? "border-primary text-text font-semibold"
                    : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                {chapter.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/journey/journey-timeline.tsx`**

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { journeyChapters } from "@/lib/content/journey";
import { JourneyChapter } from "./journey-chapter";
import { JourneyRail } from "./journey-rail";

const CHAPTER_SLUGS = journeyChapters.map((chapter) => chapter.slug);

export function JourneyTimeline() {
  // Server and first client render must agree, so the hash is not read here.
  // The mount effect below opens the deep-linked chapter instead.
  const [openSlugs, setOpenSlugs] = useState<string[]>([CHAPTER_SLUGS[0]]);
  const [activeSlug, setActiveSlug] = useState<string | null>(CHAPTER_SLUGS[0]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggle = useCallback((slug: string) => {
    setOpenSlugs((current) =>
      current.includes(slug)
        ? current.filter((entry) => entry !== slug)
        : [...current, slug],
    );
  }, []);

  const jump = useCallback((slug: string) => {
    setOpenSlugs((current) =>
      current.includes(slug) ? current : [...current, slug],
    );
    setActiveSlug(slug);
    window.history.replaceState(null, "", `#${slug}`);
    document.getElementById(slug)?.scrollIntoView({ block: "start" });
  }, []);

  // Deep link. A hash that names a chapter opens that chapter alone; anything
  // else leaves the first chapter open, which is the server-rendered state.
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash || !CHAPTER_SLUGS.includes(hash)) return;
    setOpenSlugs([hash]);
    setActiveSlug(hash);
    document.getElementById(hash)?.scrollIntoView({ block: "start" });
  }, []);

  // Scroll-spy. The rootMargin band keeps exactly one chapter active near the
  // vertical middle of the viewport.
  useEffect(() => {
    const sections = CHAPTER_SLUGS.map((slug) =>
      document.getElementById(slug),
    ).filter((element): element is HTMLElement => element !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.reduce((closest, entry) =>
          entry.boundingClientRect.top < closest.boundingClientRect.top
            ? entry
            : closest,
        );
        setActiveSlug(top.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="my-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-14"
    >
      <div>
        {journeyChapters.map((chapter, index) => (
          <JourneyChapter
            key={chapter.slug}
            chapter={chapter}
            index={index}
            isOpen={openSlugs.includes(chapter.slug)}
            onToggle={() => toggle(chapter.slug)}
          />
        ))}
      </div>
      <JourneyRail activeSlug={activeSlug} onJump={jump} />
    </div>
  );
}
```

- [ ] **Step 3: Typecheck and lint**

Run: `cd frontend && npx tsc --noEmit && npm run lint`
Expected: no errors. In particular the `react-hooks/exhaustive-deps` rule must be clean: both effects intentionally run once and reference only module-level constants and DOM APIs.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/journey/journey-rail.tsx frontend/src/components/journey/journey-timeline.tsx
git commit -m "feat(journey): add the timeline island with deep linking and scroll-spy"
```

---

### Task 5: The page, its metadata, and the sitemap

**Files:**
- Create: `frontend/src/app/journey/page.tsx`
- Modify: `frontend/src/app/sitemap.xml/route.ts` (the `routes` array)

**Interfaces:**
- Consumes: `<JourneyRecognition />`, `<JourneyCredits />` (Task 2), `<JourneyTimeline />` (Task 4), `journeyChapters` from `@/lib/content/journey`.
- Produces: the `/journey` route.

- [ ] **Step 1: Create `frontend/src/app/journey/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { JsonLd } from "@/components/ui/json-ld";
import { JourneyRecognition } from "@/components/journey/journey-recognition";
import { JourneyTimeline } from "@/components/journey/journey-timeline";
import { JourneyCredits } from "@/components/journey/journey-credits";
import { journeyChapters } from "@/lib/content/journey";
import {
  buildPageMetadata,
  seoCanonicalUrl,
  SITE_AUTHOR_NAME,
  SITE_AUTHOR_URL,
  SITE_CANONICAL_URL,
  SITE_REPOSITORY_URL,
} from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/journey",
  title: "Journey",
  description:
    "How Stellaroid Earn went from a bootcamp assignment to a Blue Belt project: the recognitions it earned and the commits, tags, and deployments behind them.",
});

const FIRST_COMMIT_DATE = "2026-03-20";

/** The newest milestone date, used as the Article's dateModified. */
const lastModified = journeyChapters
  .flatMap((chapter) => chapter.milestones.map((milestone) => milestone.date))
  .sort()
  .at(-1) as string;

const journeyBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_CANONICAL_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Journey",
      item: `${SITE_CANONICAL_URL}/journey`,
    },
  ],
};

const journeyArticleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "The Stellaroid Earn journey",
  description:
    "The recognitions Stellaroid Earn earned and the build history behind them, from the first commit through the Level 5 submission.",
  url: seoCanonicalUrl("/journey"),
  datePublished: FIRST_COMMIT_DATE,
  dateModified: lastModified,
  author: {
    "@type": "Person",
    name: SITE_AUTHOR_NAME,
    url: SITE_AUTHOR_URL,
  },
};

export default function JourneyPage() {
  return (
    <>
      <JsonLd data={journeyBreadcrumbJsonLd} />
      <JsonLd data={journeyArticleJsonLd} />

      <div className="min-h-screen bg-bg">
        <SiteNav />

        <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
          <header>
            <p className="m-0 text-xs font-medium uppercase tracking-[0.08em] text-primary">
              March 2026 to today
            </p>
            <h1 className="mt-3 mb-0 text-3xl font-semibold tracking-tight text-text sm:text-4xl">
              How this project got here
            </h1>
            <p className="mt-4 mb-0 max-w-[65ch] text-base leading-relaxed text-text-muted">
              Stellaroid Earn started as a bootcamp assignment and kept going
              after the bootcamp ended. This page is the record: what it earned,
              what I shipped, and who built the tools underneath it. Every
              milestone links to the commit, pull request, or release it came
              from, so none of it has to be taken on faith.
            </p>
          </header>

          <JourneyRecognition />
          <JourneyTimeline />
          <JourneyCredits />

          <div className="my-12 flex flex-wrap gap-3">
            <Link
              href="/start"
              className="inline-flex items-center gap-2 rounded-md border border-primary bg-primary px-5.5 py-3 text-[0.9375rem] font-semibold text-on-primary no-underline transition-[transform,background,box-shadow] duration-150 hover:-translate-y-px hover:bg-primary-hover motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
            >
              Try it in 60 seconds
            </Link>
            <a
              href={SITE_REPOSITORY_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-transparent px-5.5 py-3 text-[0.9375rem] font-semibold text-text no-underline transition-[transform,background] duration-150 hover:-translate-y-px hover:bg-surface motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
            >
              Read the source
            </a>
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Add `/journey` to the sitemap**

In `frontend/src/app/sitemap.xml/route.ts`, in the `routes` array, immediately after the `/about` entry:

```ts
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/journey", changeFrequency: "monthly", priority: 0.5 },
```

- [ ] **Step 3: Typecheck, lint, and build**

Run: `cd frontend && npx tsc --noEmit && npm run lint && npm run build`
Expected: build succeeds and the route list includes `/journey` as a static route (marked `○`). If it appears as dynamic (`ƒ`), something in the tree reads request state; find it and remove it, because this page must be static.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/journey/page.tsx frontend/src/app/sitemap.xml/route.ts
git commit -m "feat(journey): add the /journey route with metadata and schema"
```

---

### Task 6: Cross-links from the rest of the site and repo

**Files:**
- Modify: `frontend/src/components/layout/site-footer.tsx` (the Project column, near line 71)
- Modify: `frontend/src/app/about/page.tsx` (the closing CTA block at the end of `main`)
- Modify: `README.md:23`
- Modify: `THIRD-PARTY-NOTICES.md` (after the opening paragraph)

**Interfaces:**
- Consumes: the `/journey` route from Task 5.
- Produces: no new exports.

- [ ] **Step 1: Add the footer link**

In `frontend/src/components/layout/site-footer.tsx`, in the same column as the `/about` link (line 68), add directly after it:

```tsx
              <Link href="/journey" prefetch={false} className="py-1.5 text-text-muted hover:text-text transition-colors no-underline">Journey</Link>
```

- [ ] **Step 2: Add the About page link**

In `frontend/src/app/about/page.tsx`, inside the final CTA `<div className="flex gap-3 justify-center my-8 mb-16 flex-wrap">`, after the "Look up a certificate" link, add:

```tsx
              <Link
                href="/journey"
                className="inline-flex items-center gap-2 px-5.5 py-3 rounded-md font-semibold text-[0.9375rem] no-underline text-text border border-border bg-transparent hover:bg-surface hover:-translate-y-px transition-[transform,background] duration-150 motion-reduce:hover:translate-y-0"
              >
                See the journey
              </Link>
```

- [ ] **Step 3: Link the README result row**

In `README.md`, replace line 23:

```markdown
| **Result** | **Top 5 / 105 participants** · Score: 75.00 · [full journey](https://stellaroid.tech/journey) |
```

- [ ] **Step 4: Point the third-party notices at the published page**

In `THIRD-PARTY-NOTICES.md`, after the opening paragraph that ends with `contracts/stellaroid_earn/Cargo.toml`, add:

```markdown

These same attributions are published in human-readable form at
<https://stellaroid.tech/journey#credits>.
```

- [ ] **Step 5: Verify the links build**

Run: `cd frontend && npm run lint && npm run build`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/layout/site-footer.tsx frontend/src/app/about/page.tsx README.md THIRD-PARTY-NOTICES.md
git commit -m "docs(journey): link the journey page from the site and repo"
```

---

### Task 7: End-to-end coverage and full verification

**Files:**
- Create: `frontend/e2e/journey-page.spec.ts`

**Interfaces:**
- Consumes: the `/journey` route and every component built above.
- Produces: no exports.

- [ ] **Step 1: Write the e2e spec at `frontend/e2e/journey-page.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

test("journey page shows recognition, chapters, and credits", async ({ page }) => {
  await page.goto("/journey");

  await expect(
    page.getByRole("heading", { name: "How this project got here" }),
  ).toBeVisible();

  // All five recognitions render, with the bootcamp result matching the README.
  await expect(page.getByText("Top 5 of 105 participants")).toBeVisible();
  await expect(page.getByText("Selected as a Global Monthly Builder")).toBeVisible();
  await expect(page.getByText("Speaker at the June Monthly Builder")).toBeVisible();
  await expect(page.getByText("1 of 13 Philippine builders selected")).toBeVisible();
  await expect(page.getByText("Blue Belt, Level 5")).toBeVisible();

  // Six chapters, each an expandable button.
  const chapterButtons = page.getByRole("button", { expanded: false });
  await expect(page.getByRole("region", { name: /bootcamp assignment/i })).toBeAttached();
  expect(await chapterButtons.count()).toBeGreaterThanOrEqual(5);

  await expect(
    page.getByRole("heading", { name: "Built on other people's work" }),
  ).toBeVisible();
});

test("chapters toggle open and closed", async ({ page }) => {
  await page.goto("/journey");

  const header = page.getByRole("button", { name: /Making trust legible/ });
  await expect(header).toHaveAttribute("aria-expanded", "false");

  await header.click();
  await expect(header).toHaveAttribute("aria-expanded", "true");

  await header.click();
  await expect(header).toHaveAttribute("aria-expanded", "false");
});

test("the first chapter is open by default", async ({ page }) => {
  await page.goto("/journey");
  await expect(
    page.getByRole("button", { name: /It started as a bootcamp assignment/ }),
  ).toHaveAttribute("aria-expanded", "true");
});

test("a deep link opens that chapter alone", async ({ page }) => {
  await page.goto("/journey#verified-redeploy");

  await expect(
    page.getByRole("button", { name: /Redeployed so the contract can be checked/ }),
  ).toHaveAttribute("aria-expanded", "true");
  // The default-open first chapter must have yielded to the deep link.
  await expect(
    page.getByRole("button", { name: /It started as a bootcamp assignment/ }),
  ).toHaveAttribute("aria-expanded", "false");
});

test("milestones link to real commits and the credits anchor resolves", async ({ page }) => {
  await page.goto("/journey");

  await expect(page.getByRole("link", { name: "v3.0.0" })).toHaveAttribute(
    "href",
    "https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn/releases/tag/v3.0.0",
  );

  await expect(page.locator("#credits")).toBeAttached();
  await expect(page.getByText("OFL-1.1").first()).toBeAttached();
});
```

- [ ] **Step 2: Run the e2e spec**

Run: `cd frontend && npx playwright test e2e/journey-page.spec.ts --reporter=list`
Expected: 5 passed. If the `region` query fails because a collapsed panel is `inert`, query with `toBeAttached()` rather than `toBeVisible()`, which the spec above already does.

- [ ] **Step 3: Run the whole verification set**

Run each and confirm before claiming completion:

```bash
cd frontend && npm run test:unit
```
Expected: all pass, count at or above the Task 1 baseline plus the new journey tests.

```bash
cd frontend && npx tsc --noEmit && npm run lint && npm run build
```
Expected: clean, `/journey` listed as a static route.

```bash
cd frontend && npx playwright test --reporter=list
```
Expected: the full e2e suite passes, including the pre-existing specs.

- [ ] **Step 4: Commit**

```bash
git add frontend/e2e/journey-page.spec.ts
git commit -m "test(journey): cover rendering, toggling, and deep linking"
```

- [ ] **Step 5: Push and open the pull request**

```bash
git push -u origin journey-page
gh pr create --title "feat(journey): recognition and build-story page" --body "Adds /journey: a static page showing the five recognitions this project earned and the six-chapter build history behind them, every milestone linked to a real commit, PR, or tag. Also gives the third-party attributions a human-readable home at /journey#credits.

- Content lives in a typed registry at lib/content/journey.ts, tested for slug uniqueness, date bounds and ordering, SHA and PR shape, and copy rules
- Recognition band and credits are server components; only the accordion timeline is client
- Panel content is always in the DOM and collapsed panels are inert, so the page stays readable and crawlable if the island never hydrates
- Broadens the test:unit glob to src/lib/**/*.test.ts, which previously would have silently skipped any nested lib test"
```

If `gh` returns 403, the wrong account is active. Run `gh auth switch --user Iron-Mark` and retry.

---

## Self-Review

**Spec coverage.** Route and shell: Task 5. Content model and all three registries: Task 1. Recognition band: Task 2. Six chapters and five awards: Task 1 data, Task 3 rendering. Credits with the OFL note: Tasks 1 and 2. Accordion, always-in-DOM content, `inert`, independent toggles, deep linking: Tasks 3 and 4. Scroll-spy rail: Task 4. Motion and reduce-motion: handled by the existing `MotionProvider` plus `motion-reduce:` variants in Tasks 3 and 4. SEO, JSON-LD, sitemap: Task 5. Cross-links: Task 6. Unit and e2e tests: Tasks 1 and 7. No gaps.

**Placeholder scan.** No TBD, no "handle errors appropriately", no "similar to Task N". Every code step carries complete code.

**Type consistency.** `JourneyChapter` the interface is imported into `journey-chapter.tsx` aliased as `Chapter` because the component shares its name; that alias is used consistently. `awardsForChapter`, `githubCommitUrl`, `githubPrUrl`, and `githubTagUrl` are defined in Task 1 and consumed with the same signatures in Tasks 3 and 4. `<JourneyChapter />` props declared in Task 3 match exactly what Task 4 passes. `<JourneyRail />` props declared in Task 4 match its call site in the same task.

**One deliberate deviation from the spec.** The spec listed the evidence image as `images/bootcamp-top5.jpg`; that path is a repo file, not a servable URL, so Task 1 Step 7 copies it to `frontend/public/journey/bootcamp-top5.jpg` and the data references `/journey/bootcamp-top5.jpg`. Without this the evidence link would 404.
