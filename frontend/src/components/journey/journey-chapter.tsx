"use client";

import { ChevronDown } from "lucide-react";
import {
  awardsForChapter,
  githubCommitUrl,
  githubPrUrl,
  githubTagUrl,
} from "@/lib/content/journey";
import type { JourneyChapter as Chapter } from "@/lib/content/types";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2026-04-18" -> "18 Apr 2026"; "2026-05" -> "May 2026". */
function formatDate(date: string): string {
  const parts = date.split("-");
  const month = MONTH_NAMES[Number(parts[1]) - 1];
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
