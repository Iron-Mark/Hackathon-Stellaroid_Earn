import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/app",
  title: "Verify credentials & pay on Stellar",
  description:
    "Register a certificate, verify it with an approved issuer or admin wallet, and pay the graduate, all in one Freighter-signed flow on Stellar testnet.",
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
