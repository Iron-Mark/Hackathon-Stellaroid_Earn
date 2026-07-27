import type { NextConfig } from "next";

// Per-deploy build id baked into the client bundle. The service worker is
// registered as /sw.js?v=<id>, so each deploy re-installs the worker, which
// refreshes its precache and purges the previous deploy's caches.
const SW_BUILD_ID = (
  process.env.VERCEL_GIT_COMMIT_SHA ?? Date.now().toString(36)
).slice(0, 12);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SW_BUILD: SW_BUILD_ID,
  },

  experimental: {
    // Keep local Windows builds deterministic; parallel static workers have
    // intermittently raced while writing .next trace/manifests in this repo.
    cpus: 1,
  },

  // Prevent webpack from bundling native Node.js modules pulled in by
  // @stellar/stellar-sdk → @stellar/stellar-base → sodium-native.
  // Webpack can't statically analyse sodium-native's dynamic require() calls
  // for native .node binaries — marking them external silences the warnings
  // and lets Node resolve them at runtime instead.
  serverExternalPackages: ["sodium-native", "@stellar/stellar-sdk", "@stellar/stellar-base"],

  // Hide the floating Next.js dev HUD so screenshots stay clean.
  devIndicators: false,

  async headers() {
    return [
      {
        // The service worker script must revalidate on every fetch so a new
        // deploy's worker (and its VERSION-stamped caches) takes over quickly.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        // CSP is nonce-based and is applied from src/proxy.ts.
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // X-Frame-Options is emitted per-path from src/proxy.ts (DENY
          // everywhere except the embeddable /proof/<hash>/embed badge), so CSP
          // frame-ancestors and the legacy header agree. Keep it out of here.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            // Tell browsers to always use HTTPS for 2 years.
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
