import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Orbitron, Exo_2, JetBrains_Mono, Share_Tech_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ToastProvider } from "@/components/ui";
import { JsonLd } from "@/components/ui/json-ld";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { NetworkBadge } from "@/components/layout/network-badge";
import "../styles/globals.css";
import { cn } from "@/lib/utils";
import {
  SITE_AUTHOR_LINKEDIN,
  SITE_AUTHOR_NAME,
  SITE_AUTHOR_URL,
  SITE_CANONICAL_URL,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
} from "@/lib/seo";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const exo2 = Exo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pixel",
  display: "swap",
});

const BASE_URL = SITE_CANONICAL_URL;

export const viewport: Viewport = {
  themeColor: "#f59e0b",
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Stellaroid Earn",
    template: "%s | Stellaroid Earn",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_AUTHOR_NAME, url: SITE_AUTHOR_URL }],
  keywords: SITE_KEYWORDS,
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "Stellaroid Earn",
    title: "Stellaroid Earn",
    description: SITE_DESCRIPTION,
    locale: "en_US",
    alternateLocale: "tl_PH",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Stellaroid Earn",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stellaroid Earn",
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

const webAppJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Stellaroid Earn",
    url: BASE_URL,
    creator: {
      "@type": "Person",
      name: SITE_AUTHOR_NAME,
      url: SITE_AUTHOR_URL,
      sameAs: [SITE_AUTHOR_URL, SITE_AUTHOR_LINKEDIN],
    },
    description:
      "Stellaroid Earn links proof and payment on Stellar for certificates, completed work, and milestone approvals.",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Stellaroid Earn",
    url: BASE_URL,
    founder: {
      "@type": "Person",
      name: SITE_AUTHOR_NAME,
      url: SITE_AUTHOR_URL,
    },
  },
];

const authorProfileJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE_AUTHOR_NAME,
  url: SITE_AUTHOR_URL,
  sameAs: [SITE_AUTHOR_LINKEDIN, SITE_AUTHOR_URL],
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: BASE_URL,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang = cookieStore.get("stellaroid:locale")?.value === "tl" ? "tl" : "en";

  return (
    <html
      lang={lang}
      className={cn(orbitron.variable, exo2.variable, jetbrainsMono.variable, shareTechMono.variable, "font-sans")}
    >
      <body suppressHydrationWarning>
        {webAppJsonLd.map((schema, i) => (
          <JsonLd key={i} data={schema} />
        ))}
        <JsonLd data={webSiteJsonLd} />
        <JsonLd data={authorProfileJsonLd} />
        {children}
        <NetworkBadge />
        <ScrollToTop />
        <Analytics />
        <ToastProvider
          theme="dark"
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: "!bg-surface-glass !border-border-glass !backdrop-blur-md !rounded-xl !shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)]",
              title: "!text-text !font-semibold !text-[13px]",
              description: "!text-text-muted !text-[12px] !leading-relaxed",
              actionButton: "!bg-primary !text-bg !text-[12px] !font-semibold !rounded-md hover:!bg-primary-hover",
              closeButton: "!bg-surface-2 !border-border !text-text-muted hover:!text-text",
            },
          }}
        />
      </body>
    </html>
  );
}
