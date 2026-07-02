"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { SITE_RISE_EVENT_URL } from "@/lib/seo";

const joinedPrograms = [
  "april-bootcamp",
  "april-monthly-builder",
  "june-monthly-builder",
];

export function FooterProgramLink({ year }: { year: number }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <span ref={rootRef} className="relative inline-flex w-fit">
      <a
        href={SITE_RISE_EVENT_URL}
        target="_blank"
        rel="noreferrer"
        aria-describedby={open ? tooltipId : undefined}
        onFocus={() => setOpen(true)}
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 py-1 text-xs text-text-muted font-mono tracking-wide no-underline transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
      >
        © Stellar PH x Rise · {year}
        <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
        <span className="visually-hidden"> (opens Rise In event in a new tab)</span>
      </a>

      {open ? (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-0 z-30 mb-3 w-72 max-w-[84vw] rounded-md border border-border-glass bg-bg/95 px-3 py-2 text-left text-[11px] leading-relaxed text-text shadow-xl backdrop-blur"
        >
          <span className="flex items-start justify-between gap-3">
            <span>
              <span className="block font-heading text-[12px] font-semibold text-primary">
                Project joined
              </span>
              <span className="mt-0.5 block text-text-muted">
                Click the label to open the Rise event page.
              </span>
            </span>
            <button
              type="button"
              aria-label="Close project program details"
              onClick={() => setOpen(false)}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border-glass bg-transparent text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </span>
          <span className="mt-2 block space-y-0.5">
            {joinedPrograms.map(program => (
              <span key={program} className="block text-text-muted">
                {program}
              </span>
            ))}
          </span>
        </span>
      ) : null}
    </span>
  );
}
