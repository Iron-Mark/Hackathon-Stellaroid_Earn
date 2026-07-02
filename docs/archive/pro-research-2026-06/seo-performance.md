# Stellaroid SEO and Performance Plan

## Source Files
- `PDFs/Web Audits and SEO/Stellaroid.tech - Performance and SEO Review.pdf` - seo-performance-audit - Stellaroid.tech performance & SEO review Overview
- `PDFs/Web Audits and SEO/Stellaroid.tech - SEO Performance and Roadmap Audit.pdf` - roadmap - Stellaroid.tech Audit - SEO, Performance & Roadmap

## Performance Thesis
The source documents treat performance as product quality. SEO metadata alone is not enough; implementation must protect Core Web Vitals, canonical clarity, crawlable content, image discovery, and low client-side JavaScript cost.

## Requirements From Sources
- `Stellaroid.tech - Performance and SEO Review.pdf`: on the Stellar testnet【filecite†turn9file0†L7-L21】. Proof pages are rendered on the server and cached via
- `Stellaroid.tech - Performance and SEO Review.pdf`: The canonical domain stellaroid.tech serves the live app, with www and earn subdomains
- `Stellaroid.tech - Performance and SEO Review.pdf`: redirecting to it; a Vercel fallback remains available for resilience【filecite†turn15file0†L7-L15】. An
- `Stellaroid.tech - Performance and SEO Review.pdf`: rather than heavy images. Proof
- `Stellaroid.tech - Performance and SEO Review.pdf`: browser must discover the LCP
- `Stellaroid.tech - Performance and SEO Review.pdf`: preload; images referenced only in
- `Stellaroid.tech - Performance and SEO Review.pdf`: CSS or JavaScript delay LCP .LCP should be acceptable on
- `Stellaroid.tech - Performance and SEO Review.pdf`: these are loaded via client-side
- `Stellaroid.tech - Performance and SEO Review.pdf`: These operations run on the client
- `Stellaroid.tech - Performance and SEO Review.pdf`: client-side logic (parsing XDR,
- `Stellaroid.tech - Performance and SEO Review.pdf`: caches proof pages or contract
- `Stellaroid.tech - Performance and SEO Review.pdf`: metadata. Using
- `Stellaroid.tech - Performance and SEO Review.pdf`: SEO & metadataProof pages are server-rendered and
- `Stellaroid.tech - Performance and SEO Review.pdf`: runbook ensures canonical URLs
- `Stellaroid.tech - Performance and SEO Review.pdf`: and redirects
- `Stellaroid.tech - Performance and SEO Review.pdf`: Open Graph images and social titles.There is likely a central metadata
- `Stellaroid.tech - Performance and SEO Review.pdf`: RPC. Preloading and caching data via API endpoints could reduce the initial render time.
- `Stellaroid.tech - Performance and SEO Review.pdf`: Preload critical fonts and icons - Use next/font to self-host fonts and include preload tags to
- `Stellaroid.tech - Performance and SEO Review.pdf`: JavaScript. Avoid referencing the LCP element solely in CSS; if a proof badge uses a background
- `Stellaroid.tech - Performance and SEO Review.pdf`: image, preload it using <link rel="preload" fetchpriority="high" as="image"> .
- `Stellaroid.tech - Performance and SEO Review.pdf`: <style> block so the page can render before Tailwind’s full bundle loads. Defer non-critical CSS
- `Stellaroid.tech - Performance and SEO Review.pdf`: and split them into dynamic imports. Only load the Freighter wallet and contract client modules on
- `Stellaroid.tech - Performance and SEO Review.pdf`: Specify sizes on images - Add width and height attributes or set a CSS aspect-ratio on
- `Stellaroid.tech - Performance and SEO Review.pdf`: Cache proof pages - Precache frequently accessed proof pages and status assets. Use dynamic
- `Stellaroid.tech - Performance and SEO Review.pdf`: Strengthen SEO and metadata
- `Stellaroid.tech - Performance and SEO Review.pdf`: Update meta tags - Confirm that each page exports metadata using Next.js 15’s export const
- `Stellaroid.tech - Performance and SEO Review.pdf`: metadata pattern. Include descriptive titles, descriptions and alt text for images; the demo
- `Stellaroid.tech - Performance and SEO Review.pdf`: checklist emphasises verifying Open Graph images for the homepage and proof pages.
- `Stellaroid.tech - Performance and SEO Review.pdf`: Canonical and hreflang - Maintain canonical tags pointing to https://stellaroid.tech and
- `Stellaroid.tech - Performance and SEO Review.pdf`: Robots and sitemap - If not already present, generate a sitemap.xml listing the home page,
- `Stellaroid.tech - Performance and SEO Review.pdf`: robots.txt to block private or admin endpoints.•
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: Tailwind CSS and client-side state for wallet management. Meta tags, canonical links and structured data
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: permanently redirect to the apex domain . However , heavy client components (navigation, animated
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: backgrounds, activity snackbars) and Framer Motion animations add significant JavaScript weight and can
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: harm Core Web Vitals. This audit identifies current strengths, issues and a phased roadmap to harden SEO,
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: cut down client code and improve performance.
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: Robust SEO foundations - Each page exports metadata using a helper; the landing page sets title,
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: description and keywords . The <head> includes canonical and hreflang links (English and
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: Tagalog) and uses Open Graph/Twitter tags with preview images . Proof pages are server
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: Canonical domain & redirects - The cut-over runbook confirms www and earn subdomains
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: redirect via 308 to https://stellaroid.tech . A status route ( /status ) and health API
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: (release-and-deployment.md ) and roadmap, ensuring domain redirects and fallback checks
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: layoutThe SiteNav component is a client component that imports useState and
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: the entire nav is hydrated on every page. The mobile drawer toggles state and
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: to manage scroll behaviour and step progression. This heavy client flow is
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: complex hydration.
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: custom event. On first paint the server may render one locale while the client
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: hydrates to another , causing a content shift.
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: robotsThere is no automatically generated sitemap.xml or robots.txt in the code.
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: Focus on one main quest at a time: secure SEO, then reduce hydration, then optimize heavy
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: Enforce permanent redirects - Confirm www.stellaroid.tech and earn.stellaroid.tech
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: return 308 to the apex domain by adding them to the Vercel project with “redirect to root”
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: configuration. Keep the canonical link set to https://stellaroid.tech .1.
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: slides) export a unique title and meta description using buildPageMetadata . Avoid generic
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: Generate a sitemap & robots.txt - Create an API route (e.g., /api/sitemap ) to generate a
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: sitemap.xml with URLs for the landing page, about, issuer , employer , app (static), status, metrics,
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: slides and proof hashes. Use revalidate on the proof sitemap segment to add new credentials.
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: Add a robots.txt that allows crawling but disallows /api and /_next paths.
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: Phase 2 - Trim client-side footprint
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: links. Only the mobile menu toggle needs to be a client island; use <details><summary>Menu</
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: hydration on every page.
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: generateMetadata and i18n hook. This removes hydration mismatch.
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: the serverless edge and return results via streaming or actions. This reduces client code and
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: confirmation. This reduces client reactivity and improves INP.2.
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: individually. This reduces unused icons in the bundle.
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: Image handling - Replace <img> tags with <Image> from next/image for hero illustrations
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: in the <head> to reduce DNS/connection overhead. Set long-term cache headers for static assets
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: Analytics & measurement - Ensure @vercel/analytics is loaded after load (defer
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: attribute). Use Lighthouse CI or Vercel Speed Insights to monitor LCP (largest hero text or image),
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: deployment time. Include an uptime monitor that returns JSON for external health checks. This helps
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: SEO foundations, canonical URL discipline and robust documentation prove that the team values trust and
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: transparency. However , the current implementation relies heavily on client-side React hooks, animated
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: following the phased roadmap above-first solidifying SEO and domain behaviour , then trimming client
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: hydration, optimizing the /app experience and assets, and setting measurable performance budgets-

## Implementation Checks
- Confirm canonical host, redirects, robots, sitemap, Open Graph/Twitter metadata, and structured data where the source docs require them.
- Identify the real LCP element and ensure it is discoverable early, sized correctly, compressed, and preloaded or fetch-prioritized only when appropriate.
- Reduce client-side JavaScript by moving static content to server-rendered output and isolating interaction into small client islands.
- Audit hydration, long tasks, animations, wallet/Web3 code, analytics scripts, and third-party scripts for INP/TBT risk.
- Record measurements with Lighthouse/PageSpeed/Web Vitals/field telemetry when available; do not claim pass/fail without evidence.

## Acceptance Criteria
- Each source recommendation above is implemented, explicitly deferred with reason, or marked blocked by missing external data.
- Core Web Vitals targets are tracked: LCP under 2.5s, INP under 200ms, CLS under 0.1 at the 75th percentile when field data exists.
- SEO checks include canonical URL behavior, sitemap/robots status, metadata, crawlable content, and social preview behavior.
