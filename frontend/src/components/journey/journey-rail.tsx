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
