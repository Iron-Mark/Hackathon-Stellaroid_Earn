// Server component — no "use client"
// Cache each proof page for 60 s (stale-while-revalidate).
// One RPC call per unique hash per minute regardless of traffic volume.
export const revalidate = 60;

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCertificateServer,
  CertificateRecord,
  getIssuerServer,
} from "@/lib/contract-read-server";
import { getProofMetadataForCertificate } from "@/lib/proof-metadata";
import { getProofSocialMetadata } from "@/lib/proof-claims";
import type { IssuerRecord } from "@/lib/types";
import { buildPageMetadata, normalizeSeoPath, seoCanonicalUrl } from "@/lib/seo";
import {
  buildProofArticleSchema,
  buildProofDigitalDocumentSchema,
} from "@/lib/schema";
import { ProofCard } from "@/components/proof/proof-card";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { JsonLd } from "@/components/ui/json-ld";

// Accept only well-formed SHA-256 hex strings — anything else gets an instant
// 404 with no RPC call, protecting against hash-enumeration flooding.
const HASH_RE = /^[0-9a-f]{64}$/i;

const BASE_URL = seoCanonicalUrl("/");

interface PageProps {
  params: Promise<{ hash: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { hash } = await params;
  const proofPath = normalizeSeoPath(`/proof/${hash}`);
  let cert: CertificateRecord | null = null;
  if (HASH_RE.test(hash)) {
    try {
      cert = await getCertificateServer(hash);
    } catch {
      cert = null;
    }
  }
  const { title, description } = getProofSocialMetadata(hash, cert);

  return buildPageMetadata({
    path: proofPath,
    title,
    description,
    openGraphType: "article",
    keywords: `${title}, ${description}`,
    // Only real, on-chain-backed proofs are indexable. A well-formed hash with
    // no record renders a "no record" page (200) — keep those out of the index
    // as thin content while staying crawlable for the links they carry.
    robots: cert ? undefined : { index: false, follow: true },
  });
}

export default async function ProofPage({ params }: PageProps) {
  const { hash } = await params;

  if (!HASH_RE.test(hash)) notFound();

  const short =
    hash.length > 16 ? `${hash.slice(0, 10)}…${hash.slice(-10)}` : hash;
  let cert: CertificateRecord | null = null;
  let issuer: IssuerRecord | null = null;
  let lookupFailed = false;
  let issuerLookupFailed = false;
  try {
    cert = await getCertificateServer(hash);
  } catch {
    // Distinguish technical lookup failure from a true on-chain "not found" result.
    lookupFailed = true;
    cert = null;
  }

  if (cert) {
    try {
      issuer = await getIssuerServer(cert.issuer);
    } catch {
      issuerLookupFailed = true;
      issuer = null;
    }
  }

  const proofMetadata = await getProofMetadataForCertificate(hash, cert);
  const proofDocumentJsonLd = buildProofDigitalDocumentSchema({
    hash,
    cert,
    proofMetadata,
  });
  const proofArticleJsonLd = buildProofArticleSchema({
    hash,
    cert,
    proofMetadata,
  });

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: BASE_URL,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Proof",
              item: `${BASE_URL}/proof`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: `Proof · ${short}`,
              item: `${BASE_URL}/proof/${hash}`,
            },
          ],
        }}
      />
      <JsonLd data={proofDocumentJsonLd} />
      {proofArticleJsonLd ? <JsonLd data={proofArticleJsonLd} /> : null}
      <SiteNav />
      <main id="main" className="mx-auto max-w-[900px] px-6 py-12">
        <ProofCard
          hash={hash}
          cert={cert}
          issuer={issuer}
          proofMetadata={proofMetadata}
          lookupFailed={lookupFailed}
          issuerLookupFailed={issuerLookupFailed}
        />
      </main>
      <SiteFooter />
    </>
  );
}
