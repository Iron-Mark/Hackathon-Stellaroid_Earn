import type { FaqItem } from "@/lib/content/types";

/**
 * Visible FAQ. Pair with buildFaqJsonLd(items) using the SAME array so the
 * on-page text matches the FAQPage structured data (Google's requirement).
 */
export function FaqSection({
  heading = "Frequently asked questions",
  items,
  id = "faq",
}: {
  heading?: string;
  items?: FaqItem[];
  id?: string;
}) {
  if (!items?.length) return null;
  return (
    <section aria-labelledby={`${id}-heading`} className="flex flex-col gap-4 scroll-mt-24">
      <h2 id={`${id}-heading`} className="m-0 text-2xl font-bold tracking-tight text-text">
        {heading}
      </h2>
      <dl className="m-0 grid gap-3">
        {items.map((f) => (
          <div key={f.question} className="rounded-lg border border-border bg-surface px-5 py-4">
            <dt className="text-[0.9375rem] font-semibold text-text [&_code]:font-mono">
              {f.question}
            </dt>
            <dd className="m-0 mt-1.5 text-sm leading-[1.6] text-text-muted">{f.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
