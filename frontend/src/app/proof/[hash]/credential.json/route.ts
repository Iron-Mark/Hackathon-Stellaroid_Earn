// Open Badges 3.0 / W3C VC 2.0 view of a proof. Same cache and hash-gate
// policy as the proof page: 60 s CDN revalidate, instant 404 for malformed
// hashes with no RPC call.
export const revalidate = 60;

import { NextResponse } from "next/server";
import { getCertificateServer } from "@/lib/contract-read-server";
import { getProofMetadataForCertificate } from "@/lib/proof-metadata";
import { lookupIssuer } from "@/lib/issuer-registry";
import { buildOpenBadgeCredential } from "@/lib/open-badge";
import { appConfig } from "@/lib/config";
import { seoCanonicalUrl } from "@/lib/seo";

const HASH_RE = /^[0-9a-f]{64}$/i;

type RouteContext = {
  params: Promise<{ hash: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { hash } = await context.params;

  if (!HASH_RE.test(hash)) {
    return NextResponse.json({ error: "Invalid proof hash." }, { status: 404 });
  }

  let cert;
  try {
    cert = await getCertificateServer(hash);
  } catch {
    return NextResponse.json(
      { error: "Credential lookup is temporarily unavailable." },
      { status: 503 },
    );
  }

  if (!cert) {
    return NextResponse.json({ error: "Credential not found." }, { status: 404 });
  }

  const metadata = await getProofMetadataForCertificate(hash, cert);
  const network =
    appConfig.network === "PUBLIC" || appConfig.network === "PUBNET"
      ? "mainnet"
      : "testnet";

  const credential = buildOpenBadgeCredential({
    hash: hash.toLowerCase(),
    baseUrl: seoCanonicalUrl("/"),
    network,
    cert,
    metadata,
    issuerInfo: lookupIssuer(cert.issuer),
  });

  return NextResponse.json(credential, {
    headers: {
      "Content-Type": "application/vc+ld+json",
      "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
    },
  });
}
