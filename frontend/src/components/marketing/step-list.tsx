import type { Step } from "@/lib/content/types";

export function StepList({
  heading,
  steps,
  id,
}: {
  heading?: string;
  steps?: Step[];
  id?: string;
}) {
  if (!steps?.length) return null;
  return (
    <section id={id} className="flex flex-col gap-6 scroll-mt-24">
      {heading ? (
        <h2 className="m-0 text-2xl font-bold tracking-tight text-text">{heading}</h2>
      ) : null}
      <ol className="m-0 grid list-none gap-4 p-0">
        {steps.map((s, i) => (
          <li
            key={s.name}
            className="grid grid-cols-[2rem_1fr] gap-4 rounded-lg border border-border bg-surface p-5"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(245,158,11,0.14)] font-pixel text-sm font-bold text-primary">
              {i + 1}
            </span>
            <div>
              <h3 className="m-0 mb-1 text-[1.0625rem] font-semibold text-text">{s.name}</h3>
              <p className="m-0 text-sm leading-relaxed text-text-muted">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
