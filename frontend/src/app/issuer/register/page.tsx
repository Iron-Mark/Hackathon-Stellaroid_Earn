import type { Metadata } from "next";
import { FreighterWalletProvider } from "@/hooks/use-freighter-wallet";
import { RegisterIssuerExperience } from "./register-experience";
import { JsonLd } from "@/components/ui/json-ld";
import { buildPageMetadata } from "@/lib/seo";
import { buildBreadcrumbJsonLd } from "@/lib/schema";

const registerBreadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Issuer", path: "/issuer" },
  { name: "Register", path: "/issuer/register" },
]);

export const metadata: Metadata = buildPageMetadata({
  path: "/issuer/register",
  title: "Register as an issuer",
  description:
    "Create an on-chain issuer profile in the Stellaroid Earn trust registry so your wallet can verify credentials and authorize graduate payments on Stellar testnet.",
  openGraphType: "article",
});

export default function RegisterIssuerPage() {
  return (
    <FreighterWalletProvider>
      <JsonLd data={registerBreadcrumbJsonLd} />
      <RegisterIssuerExperience />
    </FreighterWalletProvider>
  );
}
