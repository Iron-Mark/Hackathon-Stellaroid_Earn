import type { Feature } from "@/lib/content/types";

export function FeatureGrid({ heading, items }: { heading?: string; items?: Feature[] }) {
  if (!items?.length) return null;
  return (
    <section className="flex flex-col gap-6">
      {heading ? (
        <h2 className="m-0 text-2xl font-bold tracking-tight text-text">{heading}</h2>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((f) => (
          <div key={f.title} className="rounded-lg border border-border bg-surface p-6">
            <h3 className="m-0 mb-2 text-[1.0625rem] font-semibold text-text">{f.title}</h3>
            <p className="m-0 text-sm leading-relaxed text-text-muted">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
