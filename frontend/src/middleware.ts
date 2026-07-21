import { NextRequest, NextResponse } from "next/server";

const isDev = process.env.NODE_ENV === "development";
const isVercelPreview = process.env.VERCEL_ENV === "preview";

function createNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

// The public badge at /proof/<64hex>/embed is meant to be embedded anywhere;
// every other route refuses framing. This single predicate drives both the CSP
// frame-ancestors directive and the legacy X-Frame-Options header below.
function isEmbedRoute(pathname: string) {
  return /^\/proof\/[0-9a-f]{64}\/embed$/i.test(pathname);
}

function buildContentSecurityPolicy(nonce: string, pathname: string) {
  const frameAncestors = isEmbedRoute(pathname)
    ? "frame-ancestors *"
    : "frame-ancestors 'none'";

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com${isVercelPreview ? " https://vercel.live" : ""}`,
    // 'unsafe-inline' here is a deliberate, reviewed tradeoff for Tailwind v4 /
    // Next 15 inline styles. It does NOT extend to scripts: script-src stays
    // locked to a per-request nonce + 'self'. Do not relax script-src "to match".
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    // stellar.creit.tech serves the wallet icons in the Stellar Wallets Kit
    // picker modal (images only; the kit itself is bundled locally).
    "img-src 'self' data: blob: https://stellar.creit.tech",
    "worker-src 'self'",
    "manifest-src 'self'",
    // WalletConnect (Reown) relay for mobile wallet pairing/signing. We use
    // @stellar/stellar-sdk for chain data and sign-client only for the relay
    // websocket + its verify attestation — no web3modal API, no EVM RPC, and
    // no iframe (frame-src stays 'none'; the verify iframe degrades silently).
    `connect-src 'self' https://*.stellar.org wss://relay.walletconnect.org https://relay.walletconnect.org https://verify.walletconnect.org${isVercelPreview ? " https://vercel.live https://*.vercel.live" : ""}`,
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    frameAncestors,
  ].join("; ");
}

export function middleware(request: NextRequest) {
  const nonce = createNonce();
  const pathname = request.nextUrl.pathname;
  const csp = buildContentSecurityPolicy(nonce, pathname);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("x-nonce", nonce);
  // Legacy clickjacking header for older browsers / proxies that ignore CSP
  // frame-ancestors. DENY everywhere except the intentionally embeddable badge.
  if (!isEmbedRoute(pathname)) {
    response.headers.set("X-Frame-Options", "DENY");
  }

  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|favicon-48.png|favicon.png|apple-touch-icon.png|logo.svg|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|map)$).*)",
    },
  ],
};
