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
