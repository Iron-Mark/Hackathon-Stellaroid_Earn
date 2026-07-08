import type { ReactNode } from "react";
import type { Block, ProseSection as ProseSectionData } from "@/lib/content/types";

/** Renders `backtick code` spans inline; everything else stays plain text. */
export function renderInline(text: string): ReactNode {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <code key={i} className="font-mono text-[0.85em] text-accent">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  );
}

/** A prose section with an optional heading, paragraphs, and a bullet list. */
export function ProseSection({ heading, paragraphs, bullets }: ProseSectionData) {
  return (
    <section className="flex flex-col gap-4">
      {heading ? (
        <h2 className="m-0 text-2xl font-bold tracking-tight text-text">{heading}</h2>
      ) : null}
      {paragraphs?.map((p, i) => (
        <p key={i} className="m-0 max-w-3xl text-[0.95rem] leading-[1.7] text-text-muted">
          {renderInline(p)}
        </p>
      ))}
      {bullets?.length ? (
        <ul className="m-0 grid list-disc gap-2 pl-5 text-[0.95rem] leading-[1.7] text-text-muted">
          {bullets.map((b, i) => (
            <li key={i}>{renderInline(b)}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** Renders an ordered guide-article body from content blocks. */
export function ProseBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2 key={i} className="mt-4 text-2xl font-bold tracking-tight text-text">
                {b.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="mt-2 text-lg font-semibold text-text">
                {b.text}
              </h3>
            );
          case "ul":
            return (
              <ul
                key={i}
                className="m-0 grid list-disc gap-2 pl-5 text-[0.95rem] leading-[1.7] text-text-muted"
              >
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol
                key={i}
                className="m-0 grid list-decimal gap-2 pl-5 text-[0.95rem] leading-[1.7] text-text-muted"
              >
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </ol>
            );
          case "code":
            return (
              <pre
                key={i}
                className="overflow-x-auto rounded-lg border border-border bg-surface-2 p-4 text-[0.8125rem] leading-relaxed"
              >
                <code className="font-mono text-text">{b.text}</code>
              </pre>
            );
          case "callout":
            return (
              <div
                key={i}
                className="rounded-lg border border-primary/30 bg-primary/8 px-4 py-3 text-sm leading-relaxed text-text"
              >
                {renderInline(b.text)}
              </div>
            );
          case "table":
            return (
              <div key={i} className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      {b.headers.map((h, j) => (
                        <th
                          key={j}
                          scope="col"
                          className="px-4 py-2.5 font-pixel text-[11px] font-semibold uppercase tracking-widest text-text-muted"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, j) => (
                      <tr key={j} className="border-b border-border/60 last:border-b-0 bg-surface/50">
                        {row.map((cell, k) => (
                          <td key={k} className="px-4 py-2.5 align-top leading-relaxed text-text-muted [&_code]:whitespace-nowrap">
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "p":
          default:
            return (
              <p key={i} className="m-0 text-[0.95rem] leading-[1.7] text-text-muted">
                {renderInline(b.text)}
              </p>
            );
        }
      })}
    </div>
  );
}
