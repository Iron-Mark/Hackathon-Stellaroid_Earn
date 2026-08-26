import type { Metadata } from "next";
import { FreighterWalletProvider } from "@/hooks/use-freighter-wallet";
import { BatchIssuanceExperience } from "./batch-experience";
import { JsonLd } from "@/components/ui/json-ld";
import { buildPageMetadata } from "@/lib/seo";
import { buildBreadcrumbJsonLd } from "@/lib/schema";

const batchBreadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Issuer", path: "/issuer" },
  { name: "Batch issuance", path: "/issuer/batch" },
]);

export const metadata: Metadata = buildPageMetadata({
  path: "/issuer/batch",
  title: "Batch issue credentials from CSV",
  description:
    "Preview a graduate cohort CSV, catch duplicate hashes, and sign a register_certificate queue on Stellar testnet. Live v3.0.0: one wallet signature per row.",
  openGraphType: "article",
});

export default function BatchIssuancePage() {
  return (
    <FreighterWalletProvider>
      <JsonLd data={batchBreadcrumbJsonLd} />
      <BatchIssuanceExperience />
    </FreighterWalletProvider>
  );
}
