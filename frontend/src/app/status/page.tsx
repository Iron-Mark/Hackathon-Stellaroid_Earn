import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  Route,
  SearchCheck,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNav } from "@/components/layout/site-nav";
import { DEFAULT_SAMPLE_PROOF_HASH } from "@/lib/demo-data";
import { appConfig } from "@/lib/config";
import {
  formatRelativeTime,
  getContractIndexedEventCount,
  getRecentEvents,
  type RecentActivityItem,
} from "@/lib/events";
import { getHealthReport, type HealthStatus } from "@/lib/health-report";
import { shortenAddress } from "@/lib/format";
import { buildPageMetadata, SITE_CANONICAL_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = buildPageMetadata({
  path: "/status",
  title: "Project Status",
  description:
    "Live demo health, Stellar testnet contract details, domain readiness, and proof links for Stellaroid Earn.",
  robots: {
    index: false,
    follow: true,
  },
});

const fallbackDemoUrl = "https://stellaroid-earn-demo.vercel.app/";
const customDomainUrl = SITE_CANONICAL_URL;

const statusTone: Record<HealthStatus, string> = {
  healthy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  degraded: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  down: "border-red-500/30 bg-red-500/10 text-red-300",
};

function statusLabel(status: HealthStatus) {
  if (status === "healthy") return "Healthy";
  if (status === "degraded") return "Degraded";
  return "Down";
}

type KindCount = Record<string, number>;

type MetricCard = {
  label: string;
  value: number;
  detail: string;
};

type MetricsReport = {
  events: RecentActivityItem[];
  error: string | null;
  cards: MetricCard[];
  indexedEventCount: number | null;
};

function eventTone(kind: RecentActivityItem["kind"]) {
  if (kind === "payment" || kind === "reward") {
    return "bg-amber-500/10 text-primary";
  }
  if (kind === "cert_ver") {
    return "bg-emerald-500/10 text-emerald-300";
  }
  if (kind === "cert_reg") {
    return "bg-sky-500/10 text-sky-300";
  }
  return "bg-surface-2 text-text-muted";
}

function sourceLabel(source: RecentActivityItem["source"]) {
  if (source === "stellar_expert") return "Stellar Expert";
  if (source === "rpc") return "RPC";
  return "E2E";
}

function sourceTone(source: RecentActivityItem["source"]) {
  if (source === "stellar_expert") {
    return "border-sky-400/30 bg-sky-500/10 text-sky-200";
  }
  if (source === "rpc") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  }
  return "border-purple-400/30 bg-purple-500/10 text-purple-200";
}

async function getMetricsReport(): Promise<MetricsReport> {
  let events: RecentActivityItem[] = [];
  let error: string | null = null;
  const indexedEventCount = await getContractIndexedEventCount(appConfig.contractId);

  try {
    events = await getRecentEvents(appConfig.contractId, 40);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load on-chain metrics.";
  }

  const byKind = events.reduce<KindCount>((acc, event) => {
    acc[event.kind] = (acc[event.kind] ?? 0) + 1;
    return acc;
  }, {});

  const uniqueProofs = new Set(
    events.filter((event) => event.hashHex).map((event) => event.hashHex),
  ).size;
  const uniqueEventRefs = new Set(events.map((event) => event.txHash ?? event.id)).size;

  return {
    events,
    error,
    indexedEventCount,
    cards: [
      {
        label: "Indexed events",
        value: indexedEventCount ?? events.length,
        detail: indexedEventCount === null ? "Decoded contract events" : "Public contract events",
      },
      { label: "Proof hashes", value: uniqueProofs, detail: "Unique proof IDs found" },
      { label: "Event refs", value: uniqueEventRefs, detail: "Unique tx or event refs" },
      { label: "Registered", value: byKind.cert_reg ?? 0, detail: "Certificate registrations" },
      { label: "Verified", value: byKind.cert_ver ?? 0, detail: "Certificate verifications" },
      { label: "Rewards", value: byKind.reward ?? 0, detail: "Reward events" },
      { label: "Payments", value: byKind.payment ?? 0, detail: "Employer payment events" },
    ],
  };
}

function CheckRow({
  label,
  detail,
  ok,
}: {
  label: string;
  detail: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden="true" />
      ) : (
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true" />
      )}
      <div>
        <p className="m-0 text-sm font-semibold text-text">{label}</p>
        <p className="m-0 mt-1 text-sm leading-relaxed text-text-muted">{detail}</p>
      </div>
    </div>
  );
}

function MetricsSection({
  contractUrl,
  report,
}: {
  contractUrl: string;
  report: MetricsReport;
}) {
  return (
    <section id="metrics" className="mt-10 scroll-mt-24" aria-labelledby="metrics-title">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-primary">
          <BarChart3 className="size-5" aria-hidden="true" />
          <h2 id="metrics-title" className="m-0 text-xl text-text">
            On-chain Metrics
          </h2>
        </div>
        <a
          href={`${contractUrl}#events`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary no-underline hover:underline"
        >
          Open events <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {report.cards.map((card) => (
            <article key={card.label} className="rounded-lg border border-border bg-bg px-4 py-3">
              <p className="m-0 font-pixel text-[10px] uppercase tracking-widest text-text-muted">
                {card.label}
              </p>
              <p className="m-0 mt-2 font-heading text-2xl font-bold text-text">{card.value}</p>
              <p className="m-0 mt-1 text-xs leading-relaxed text-text-muted">{card.detail}</p>
            </article>
          ))}
        </div>

        {report.error ? (
          <div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-200">
            Metrics RPC is degraded: {report.error}
          </div>
        ) : null}

        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="size-4 text-primary" aria-hidden="true" />
            <h3 className="m-0 text-base text-text">Recent Activity</h3>
          </div>

          {report.events.length === 0 ? (
            <p className="m-0 rounded-lg border border-border bg-bg px-4 py-3 text-sm text-text-muted">
              {report.error
                ? "No decoded events are available while the public event checks are degraded."
                : "No decoded contract events found from RPC or the public Stellar Expert index yet."}
            </p>
          ) : (
            <div className="grid gap-2">
              {report.events.slice(0, 8).map((event) => (
                <a
                  key={event.id}
                  href={event.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="grid gap-2 rounded-lg border border-border bg-bg px-4 py-3 text-sm text-text no-underline transition hover:border-primary sm:grid-cols-[auto_1fr_auto] sm:items-center"
                >
                  <span className={`w-fit rounded px-2 py-0.5 font-pixel text-[11px] ${eventTone(event.kind)}`}>
                    {event.label}
                  </span>
                  <span className="min-w-0 truncate text-text-muted">{event.detail}</span>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                    <span
                      className={`rounded border px-1.5 py-0.5 font-pixel text-[9px] uppercase tracking-wider ${sourceTone(event.source)}`}
                    >
                      {sourceLabel(event.source)}
                    </span>
                    <span>{event.reference}</span>
                    <span>{formatRelativeTime(event.ledgerClosedAt)}</span>
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default async function StatusPage() {
  const [health, metrics] = await Promise.all([getHealthReport(), getMetricsReport()]);
  const contractUrl = appConfig.contractId
    ? `${appConfig.explorerUrl}/contract/${appConfig.contractId}`
    : appConfig.explorerUrl;
  const sampleProofHref = `/proof/${DEFAULT_SAMPLE_PROOF_HASH}`;
  const employerProofHref = `/employer?hash=${encodeURIComponent(DEFAULT_SAMPLE_PROOF_HASH)}`;
  const sampleProofLabel = `${DEFAULT_SAMPLE_PROOF_HASH.slice(0, 10)}...${DEFAULT_SAMPLE_PROOF_HASH.slice(-10)}`;
  const updated = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(health.timestamp));

  return (
    <div className="min-h-dvh">
      <SiteNav />
      <main id="main" className="mx-auto max-w-5xl px-6 py-14">
        <section className="mb-10">
          <span className="mb-4 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-pixel text-[11px] uppercase tracking-widest text-primary">
            Post-event operations
          </span>
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="m-0 text-4xl font-bold tracking-tight text-text sm:text-5xl">
                Project Status
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-muted">
                Current health for the maintained Stellaroid Earn demo, its Stellar testnet proof
                surface, and the custom-domain cutover.
              </p>
            </div>
            <div className={`rounded-lg border px-4 py-3 text-sm font-semibold ${statusTone[health.status]}`}>
              {statusLabel(health.status)}
            </div>
          </div>
        </section>

        <section className="mb-10" aria-labelledby="demo-runbook-title">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Route className="size-5" aria-hidden="true" />
            <h2 id="demo-runbook-title" className="m-0 text-xl text-text">
              Demo Runbook
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Link
              href={sampleProofHref}
              className="group flex min-h-[164px] flex-col justify-between rounded-lg border border-border bg-surface p-4 text-text no-underline transition hover:border-primary hover:bg-surface-2"
            >
              <span>
                <SearchCheck className="mb-3 size-5 text-verified" aria-hidden="true" />
                <span className="block text-sm font-semibold">Verified proof</span>
                <span className="mt-2 block text-sm leading-relaxed text-text-muted">
                  Open the walletless proof page with the current testnet sample.
                </span>
              </span>
              <code className="mt-4 block break-all rounded border border-border bg-bg px-2 py-1 font-mono text-[11px] text-text-muted">
                {sampleProofLabel}
              </code>
            </Link>

            <Link
              href={employerProofHref}
              className="group flex min-h-[164px] flex-col justify-between rounded-lg border border-border bg-surface p-4 text-text no-underline transition hover:border-primary hover:bg-surface-2"
            >
              <span>
                <BriefcaseBusiness className="mb-3 size-5 text-primary" aria-hidden="true" />
                <span className="block text-sm font-semibold">Employer handoff</span>
                <span className="mt-2 block text-sm leading-relaxed text-text-muted">
                  Carry the same proof into the paid-trial review workflow.
                </span>
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Review escrow path <ArrowRight className="size-3.5" aria-hidden="true" />
              </span>
            </Link>

            <Link
              href="/issuer"
              className="group flex min-h-[164px] flex-col justify-between rounded-lg border border-border bg-surface p-4 text-text no-underline transition hover:border-primary hover:bg-surface-2"
            >
              <span>
                <ShieldCheck className="mb-3 size-5 text-verified" aria-hidden="true" />
                <span className="block text-sm font-semibold">Issuer trust</span>
                <span className="mt-2 block text-sm leading-relaxed text-text-muted">
                  Inspect the registry path that separates issuer claims from approved issuers.
                </span>
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Open console <ArrowRight className="size-3.5" aria-hidden="true" />
              </span>
            </Link>

            <Link
              href="/pilot"
              className="group flex min-h-[164px] flex-col justify-between rounded-lg border border-border bg-surface p-4 text-text no-underline transition hover:border-primary hover:bg-surface-2"
            >
              <span>
                <ClipboardCheck className="mb-3 size-5 text-accent" aria-hidden="true" />
                <span className="block text-sm font-semibold">Pilot boundary</span>
                <span className="mt-2 block text-sm leading-relaxed text-text-muted">
                  Show the narrow testnet rollout scope for an issuer or employer pilot.
                </span>
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                View pilot scope <ArrowRight className="size-3.5" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-border bg-surface p-5">
            <p className="m-0 font-pixel text-[11px] uppercase tracking-widest text-text-muted">
              Fallback demo
            </p>
            <h2 className="mt-2 text-xl text-text">Live Vercel URL</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Keep this URL public until the custom domain passes DNS and HTTPS checks.
            </p>
            <a
              href={fallbackDemoUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary no-underline hover:underline"
            >
              Open fallback demo <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </article>

          <article className="rounded-lg border border-border bg-surface p-5">
            <p className="m-0 font-pixel text-[11px] uppercase tracking-widest text-text-muted">
              Custom domain
            </p>
            <h2 className="mt-2 text-xl text-text">Canonical URL</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              `stellaroid.tech` is the canonical live URL. `www` and `earn` redirect here.
            </p>
            <a
              href={customDomainUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary no-underline hover:underline"
            >
              Check custom domain <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </article>

          <article className="rounded-lg border border-border bg-surface p-5">
            <p className="m-0 font-pixel text-[11px] uppercase tracking-widest text-text-muted">
              Stellar testnet
            </p>
            <h2 className="mt-2 text-xl text-text">
              {appConfig.contractId ? shortenAddress(appConfig.contractId, 8) : "Not configured"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Current contract ID is linked here. RPC health is checked by the app.
            </p>
            <a
              href={contractUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary no-underline hover:underline"
            >
              View contract <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </article>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-lg border border-border bg-surface-2 p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
              <h2 className="m-0 text-xl text-text">Runtime Checks</h2>
            </div>
            <div className="grid gap-3">
              <CheckRow label="Config" detail={health.checks.config.detail} ok={health.checks.config.ok} />
              <CheckRow label="RPC" detail={health.checks.rpc.detail} ok={health.checks.rpc.ok} />
              <CheckRow label="Contract config" detail={health.checks.contract.detail} ok={health.checks.contract.ok} />
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-text-muted">
              <Clock3 className="size-3.5" aria-hidden="true" />
              Last checked {updated} Manila time
            </p>
          </article>

          <article className="rounded-lg border border-border bg-surface p-5">
            <h2 className="m-0 text-xl text-text">Proof Links</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Public proof pages are the main artifact to preserve after the event.
            </p>
            <div className="mt-5 grid gap-3">
              <Link
                href={sampleProofHref}
                className="inline-flex items-center justify-center rounded-md border border-primary bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary no-underline transition hover:bg-primary-hover"
              >
                Open sample proof
              </Link>
              <Link
                href="#metrics"
                className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-text no-underline transition hover:bg-surface-2"
              >
                View metrics
              </Link>
              <Link
                href="/app"
                className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-text no-underline transition hover:bg-surface-2"
              >
                Run demo flow
              </Link>
            </div>
          </article>
        </section>

        <MetricsSection contractUrl={contractUrl} report={metrics} />
      </main>
      <SiteFooter />
    </div>
  );
}
