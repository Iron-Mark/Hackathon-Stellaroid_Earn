import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, ExternalLink, ShieldCheck, TriangleAlert } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNav } from "@/components/layout/site-nav";
import { DEFAULT_SAMPLE_PROOF_HASH } from "@/lib/demo-data";
import { appConfig } from "@/lib/config";
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

export default async function StatusPage() {
  const health = await getHealthReport();
  const contractUrl = appConfig.contractId
    ? `${appConfig.explorerUrl}/contract/${appConfig.contractId}`
    : appConfig.explorerUrl;
  const sampleProofHref = `/proof/${DEFAULT_SAMPLE_PROOF_HASH}`;
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
              Current contract ID is linked here. Active RPC: {health.checks.rpc.providerName}.
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

          <aside className="rounded-lg border border-border bg-surface p-5">
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
                href="/metrics"
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
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
