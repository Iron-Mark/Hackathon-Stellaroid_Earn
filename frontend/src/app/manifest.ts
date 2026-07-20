import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Stellaroid Earn",
    short_name: "Stellaroid",
    description:
      "Bind certificate hashes on-chain, verify credentials, and pay graduates directly on Stellar testnet.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    // Match the app surface (--color-bg) so the install splash and the
    // standalone title bar blend with the dark UI.
    background_color: "#0F172A",
    theme_color: "#0F172A",
    categories: ["finance", "education", "productivity"],
    icons: [
      { src: "/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Verify a proof",
        short_name: "Verify",
        url: "/proof",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Issue a certificate",
        short_name: "Issue",
        url: "/issuer/register",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Hire a graduate",
        short_name: "Hire",
        url: "/employer",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
