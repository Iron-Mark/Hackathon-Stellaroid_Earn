import type { Metadata } from "next";
import {
  FreighterWalletProvider,
} from "@/hooks/use-freighter-wallet";
import { IssuerDashboard } from "@/components/issuer/issuer-dashboard";
import { JsonLd } from "@/components/ui/json-ld";
import { buildPageMetadata, seoCanonicalUrl, SITE_CANONICAL_URL, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/issuer",
  title: "Issuer trust registry",
  description:
    "Inspect or register an issuer wallet in the on-chain trust registry for Stellaroid Earn. Approved issuers can verify credentials and unlock payment on Stellar testnet.",
});

export default function IssuerPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Issuer Dashboard",
          url: seoCanonicalUrl("/issuer"),
          description:
            "Inspect or register an issuer wallet in the on-chain trust registry for Stellaroid Earn.",
          isPartOf: {
            "@type": "WebApplication",
            name: SITE_NAME,
            url: SITE_CANONICAL_URL,
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: SITE_CANONICAL_URL,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Issuer",
              item: seoCanonicalUrl("/issuer"),
            },
          ],
        }}
      />
      <FreighterWalletProvider>
        <IssuerDashboard />
      </FreighterWalletProvider>
    </>
  );
}
