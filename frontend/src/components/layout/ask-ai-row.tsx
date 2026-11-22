"use client";

import { useId, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { askAiLinks } from "@/lib/ask-ai";
import { SITE_NAME } from "@/lib/seo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function subscribeToTitle(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.head, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}

function publishedTitle() {
  return document.title.trim() || SITE_NAME;
}

/** Visible plate. Footer logo is 26px; inline link icons are 12px. */
const ASK_AI_MARK_PX = 20;
const ASK_AI_PLATE_FILTER_ID = "ask-ai-plate";

/**
 * These two marks are colored. The plate filter fades them: its chroma
 * ramp only reaches full opacity above 0.28, so orange and the Gemini
 * star are left partly transparent. Their PNGs already have no plate.
 */
function skipsPlateFilter(iconSrc: string) {
  return iconSrc.endsWith("/ask-claude-dark.png") || iconSrc.endsWith("/ask-google-dark.png");
}

export function AskAiRow() {
  const pathname = usePathname() ?? "/";
  const labelId = useId();
  // The metadata title template is already published on document.title.
  const title = useSyncExternalStore(subscribeToTitle, publishedTitle, () => SITE_NAME);
  const row = askAiLinks(pathname, title);

  if (!row) return null;

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-2">
      <span id={labelId} className="text-[13px] leading-snug text-text-muted">
        {row.label}
      </span>
      <TooltipProvider>
        <div
          role="group"
          aria-labelledby={labelId}
          className="relative flex w-max max-w-full flex-wrap items-center gap-0.5"
        >
          <AskAiPlateFilter />
          {row.links.map((link) => {
            const directMark = skipsPlateFilter(link.iconSrc);
            return (
              <Tooltip key={link.id}>
                <TooltipTrigger
                  render={
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.accessibleName}
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-text-muted no-underline touch-manipulation transition-colors duration-200 ease-out hover:bg-primary/10 hover:text-primary active:bg-primary/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
                    >
                      <Image
                        src={link.iconSrc}
                        alt=""
                        width={ASK_AI_MARK_PX}
                        height={ASK_AI_MARK_PX}
                        sizes={`${ASK_AI_MARK_PX}px`}
                        unoptimized={directMark}
                        className="h-[20px] w-[20px] object-contain"
                        style={directMark ? undefined : { filter: `url(#${ASK_AI_PLATE_FILTER_ID})` }}
                      />
                    </a>
                  }
                />
                <TooltipContent side="top" sideOffset={8}>
                  Ask {link.name}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}

/**
 * Drops dark, low-chroma plates so they show the footer surface.
 * White glyphs stay fully opaque through the luma gate.
 * The chroma ramp (transparent below 0.12, opaque only above 0.28) leaves
 * colored pixels partly transparent, so Claude and Gemini do not use it.
 * ChatGPT and Perplexity already have no disc. Grok still uses this gate.
 */
function AskAiPlateFilter() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="pointer-events-none absolute">
      <filter id={ASK_AI_PLATE_FILTER_ID} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
        <feColorMatrix in="SourceGraphic" result="rGray" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 1 0" />
        <feColorMatrix in="SourceGraphic" result="gGray" values="0 1 0 0 0  0 1 0 0 0  0 1 0 0 0  0 0 0 1 0" />
        <feColorMatrix in="SourceGraphic" result="bGray" values="0 0 1 0 0  0 0 1 0 0  0 0 1 0 0  0 0 0 1 0" />
        <feBlend in="rGray" in2="gGray" mode="lighten" result="maxRG" />
        <feBlend in="maxRG" in2="bGray" mode="lighten" result="maxC" />
        <feBlend in="rGray" in2="gGray" mode="darken" result="minRG" />
        <feBlend in="minRG" in2="bGray" mode="darken" result="minC" />
        <feBlend in="maxC" in2="minC" mode="difference" result="chroma" />
        <feColorMatrix in="chroma" result="chromaA" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.3333 0.3333 0.3334 0 0" />
        <feComponentTransfer in="chromaA" result="chromaKeep">
          <feFuncA type="linear" slope="6.25" intercept="-0.75" />
        </feComponentTransfer>
        <feColorMatrix in="SourceGraphic" result="lumaA" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.2126 0.7152 0.0722 0 0" />
        <feComponentTransfer in="lumaA" result="lumaKeep">
          <feFuncA type="linear" slope="2.857" intercept="-1.286" />
        </feComponentTransfer>
        <feColorMatrix in="chromaKeep" result="chromaRGB" values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 0 1" />
        <feColorMatrix in="lumaKeep" result="lumaRGB" values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 0 1" />
        <feBlend in="chromaRGB" in2="lumaRGB" mode="lighten" result="keepRGB" />
        <feColorMatrix in="keepRGB" result="keepA" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.3333 0.3333 0.3334 0 0" />
        <feComposite in="SourceGraphic" in2="keepA" operator="in" />
      </filter>
    </svg>
  );
}
