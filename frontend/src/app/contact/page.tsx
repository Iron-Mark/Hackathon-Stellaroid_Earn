import type { Metadata } from "next";
import Link from "next/link";
import { Bug, ExternalLink, FlaskConical, Mail, ShieldAlert } from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { JsonLd } from "@/components/ui/json-ld";
import {
  SITE_AUTHOR_LINKEDIN,
  SITE_CONTACT_EMAIL,
  SITE_REPOSITORY_URL,
  buildPageMetadata,
} from "@/lib/seo";
import { buildBreadcrumbJsonLd } from "@/lib/schema";

const breadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Contact", path: "/contact" },
]);

export const metadata: Metadata = buildPageMetadata({
  path: "/contact",
  title: "Contact",
  description:
    "Reach the Stellaroid Earn team: pilot requests, general questions, bug reports, and security disclosures.",
  keywords: "stellaroid contact, pilot request, security disclosure",
});

const channels = [
  {
    Icon: FlaskConical,
    title: "Pilot requests",
    body: "Bootcamps, training providers, and employers: the pilot form is the fastest route and goes straight to our inbox.",
    action: { label: "Request a pilot", href: "/pilot#request", external: false },
  },
  {
    Icon: Mail,
    title: "General questions",
    body: "Anything else — partnerships, press, feedback, or privacy/data-deletion requests.",
    action: {
      label: SITE_CONTACT_EMAIL,
      href: `mailto:${SITE_CONTACT_EMAIL}`,
      external: false,
    },
  },
  {
    Icon: Bug,
    title: "Bug reports",
    body: "Found something broken? Open a GitHub issue with steps to reproduce — the whole codebase is public.",
    action: {
      label: "Open a GitHub issue",
      href: `${SITE_REPOSITORY_URL}/issues`,
      external: true,
    },
  },
  {
    Icon: ShieldAlert,
    title: "Security disclosures",
    body: "Report vulnerabilities privately by email. Machine-readable details live in our security.txt.",
    action: {
      label: "/.well-known/security.txt",
      href: "/.well-known/security.txt",
      external: false,
    },
  },
];

export default function ContactPage() {
  return (
    <MarketingShell className="max-w-4xl gap-10">
      <JsonLd data={breadcrumbJsonLd} />
      <header>
        <p className="m-0 font-pixel text-xs font-medium uppercase tracking-widest text-primary">
          Talk to us
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-text">Contact</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-muted">
          Stellaroid Earn is solo-built and early-access — you&rsquo;ll be
          talking to the person who wrote the code. Pick the channel that fits.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {channels.map(({ Icon, title, body, action }) => (
          <div key={title} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-6">
            <div className="flex items-center gap-2.5 text-primary">
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
              <h2 className="m-0 text-lg font-semibold text-text">{title}</h2>
            </div>
            <p className="m-0 text-sm leading-relaxed text-text-muted">{body}</p>
            {action.external ? (
              <a
                href={action.href}
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary no-underline hover:opacity-80"
              >
                {action.label}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="visually-hidden">(opens in new tab)</span>
              </a>
            ) : (
              <Link
                href={action.href}
                className="mt-auto inline-flex w-fit items-center text-sm font-semibold text-primary no-underline hover:opacity-80"
              >
                {action.label}
              </Link>
            )}
          </div>
        ))}
      </div>

      <p className="m-0 text-sm text-text-muted">
        Prefer LinkedIn?{" "}
        <a
          href={SITE_AUTHOR_LINKEDIN}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-primary underline [text-underline-offset:2px]"
        >
          Message Mark directly
        </a>
        .
      </p>
    </MarketingShell>
  );
}
