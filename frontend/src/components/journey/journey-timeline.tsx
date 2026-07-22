"use client";

import { useCallback, useEffect, useState } from "react";
import { journeyChapters } from "@/lib/content/journey";
import { JourneyChapter } from "./journey-chapter";
import { JourneyRail } from "./journey-rail";

const CHAPTER_SLUGS = journeyChapters.map((chapter) => chapter.slug);

export function JourneyTimeline() {
  // Server and first client render must agree, so the hash is not read here.
  // The mount effect below opens the deep-linked chapter instead.
  const [openSlugs, setOpenSlugs] = useState<string[]>([CHAPTER_SLUGS[0]]);
  const [activeSlug, setActiveSlug] = useState<string | null>(CHAPTER_SLUGS[0]);

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
    <div className="my-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-14">
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
