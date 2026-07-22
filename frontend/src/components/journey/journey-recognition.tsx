import { journeyAwards } from "@/lib/content/journey";

/**
 * The award band. Renders every recognition in date order so a visitor sees
 * what the project earned before reading how it was built. Server component:
 * there is no interaction here, so it ships no client JavaScript.
 */
export function JourneyRecognition() {
  return (
    <section aria-labelledby="recognition-heading" className="my-12">
      <h2
        id="recognition-heading"
        className="text-sm font-semibold uppercase tracking-[0.08em] text-text-muted m-0"
      >
        Recognition
      </h2>
      <ul className="mt-4 grid gap-3 p-0 list-none sm:grid-cols-2 lg:grid-cols-3">
        {journeyAwards.map((award) => (
          <li
            key={award.slug}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="m-0 text-xs font-medium uppercase tracking-[0.06em] text-primary">
              {award.period ?? award.date}
            </p>
            <h3 className="mt-2 mb-0 text-base font-semibold leading-snug text-text">
              {award.headline}
            </h3>
            <p className="mt-2 mb-0 text-sm leading-relaxed text-text-muted">
              {award.detail}
            </p>
            {award.evidence ? (
              <a
                href={award.evidence.href}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center text-xs font-semibold text-primary no-underline hover:underline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              >
                {award.evidence.label}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
