import { journeyCredits } from "@/lib/content/journey";

/**
 * Attribution, published rather than left in THIRD-PARTY-NOTICES.md. The fonts
 * group carries the OFL-1.1 notice, which is the one entry on this page with an
 * actual licensing obligation. Server component: no interaction.
 */
export function JourneyCredits() {
  return (
    <section
      id="credits"
      aria-labelledby="credits-heading"
      className="scroll-mt-24 my-16 border-t border-border pt-10"
    >
      <h2
        id="credits-heading"
        className="m-0 text-2xl font-semibold tracking-tight text-text"
      >
        Built on other people&apos;s work
      </h2>
      <p className="mt-2 mb-0 max-w-[65ch] text-sm leading-relaxed text-text-muted">
        Stellaroid Earn is MIT licensed and depends on the projects below. Each
        keeps its own license. This is the same list carried in the
        repository&apos;s third-party notices.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {journeyCredits.map((group) => (
          <section key={group.title} aria-label={group.title}>
            <h3 className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-text">
              {group.title}
            </h3>
            {group.note ? (
              <p className="mt-2 mb-0 max-w-[60ch] text-xs leading-relaxed text-text-muted">
                {group.note}
              </p>
            ) : null}
            <dl className="mt-4 grid gap-3">
              {group.items.map((item) => (
                <div key={item.name}>
                  <dt className="m-0 text-sm font-semibold text-text">
                    {item.href ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-text no-underline hover:text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                      >
                        {item.name}
                      </a>
                    ) : (
                      item.name
                    )}
                    {item.license ? (
                      <span className="ml-2 rounded-full border border-border px-2 py-0.5 align-middle text-[0.6875rem] font-medium text-text-muted">
                        {item.license}
                      </span>
                    ) : null}
                  </dt>
                  <dd className="m-0 text-sm leading-relaxed text-text-muted">
                    {item.role}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </section>
  );
}
