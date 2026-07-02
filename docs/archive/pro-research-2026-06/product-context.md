# Stellaroid Product Context

## Product Thesis
Stellar/Soroban credential proof and payment product that needs proof-loop focus, issuer/employer workflows, and performance hardening.

## Audience
Graduates, issuers, employers/recruiters, admins, Stellar ecosystem reviewers, and pilot customers.

## Current State From Sources
This context is synthesized from 3 inspected source files. The sources include:

- deep-audit: 1
- seo-performance-audit: 1
- roadmap: 1

## North Star
Complete the credential proof loop before expanding marketplace scope: issue, verify, revoke/suspend, export, and share trusted proof pages quickly.

## Product and UX Priorities
- Prioritize the credential proof loop over premature marketplace/NFT/mainnet expansion.
- Add batch issuance, revocation/suspension UX, expiry/renewal, branded proof pages, and role-based admin/audit logs.
- Create employer/recruiter export packs and pilot request flows for real B2B traction.
- Optimize Soroban proof page rendering with caching/API boundaries so first visits do not block on RPC unnecessarily.
- Trim heavy client components, animated backgrounds, snackbars, and Framer Motion where they hurt Web Vitals.

## High-Signal Suggestions From Sources
- `Stellaroid Earn - Deep Audit.md`: | Gap area | Problem | Why it matters | Recommended fix | Priority | Difficulty |
- `Stellaroid Earn - Deep Audit.md`: | User journey | The public site gives multiple destinations-About, Verify, Issuer, App, Employer, Status-before the visitor understands which path is theirs. | First-session comprehension is weak. Strong credential products usually separate issuer, earner, and verifier journeys clearly. citeturn42view0turn35view8turn35view10 | Redesign the landing page around 3 persona CTAs: **Issue**, **Verify**, **Hire**. Remove unfinished pages from top navigation. | Critical | Medium |
- `Stellaroid Earn - Deep Audit.md`: | Standards interoperability | The system is hash-on-chain and record-based, but there is no visible W3C VC 2.0 or Open Badges 3.0 export/import layer. | In 2026, digital credentials are converging on interoperable standards. Without VC/Open Badges support, this stays chain-native and niche. citeturn35view0turn35view1turn35view2 | Add standards-based credential export first; later add verifiable presentations and issuer-signed JSON-LD/JWT envelopes. | Critical | Hard |
- `Stellaroid Earn - Deep Audit.md`: | Retention | There is no clear reason for issuers/employers to return after the demo flow. | Credential products retain via issuer dashboards, analytics, automations, revocation tools, renewal reminders, and candidate pipelines-not just a proof page. Credly and Accredible both lean hard into management and insight layers. citeturn35view7turn35view8 | Add issuer dashboard KPIs, batch issuance, revocation queue, exports, and employer verification analytics. | High | Medium |
- `Stellaroid Earn - Deep Audit.md`: | Feedback loops | I found no public evidence of waitlists, contact-to-pilot forms, in-app feedback capture, issuer/admin notes, or user interview loops. | That is fatal if you want to move from demo to pilot. You cannot iterate on trust products blind. | Add product feedback events, contact-to-pilot funnel, and issuer/employer feedback prompts after key actions. | High | Easy |
- `Stellaroid Earn - Deep Audit.md`: | Monetization | The current site emphasizes “free public Stellar testnet demo” and “no purchase, subscription, or mainnet funds required.” | Good for a demo, bad for a product narrative. Without a paid admin layer, this remains a showcase. citeturn41view0 | Monetize issuers, not graduates. Charge for issuance volume, branded proof pages, analytics, API access, and compliance/reporting features. | High | Medium |
- `Stellaroid Earn - Deep Audit.md`: | Scalability as a real product | The talent passport page openly says automatic credential enumeration is not available until an index/search layer exists. | That means there is no off-chain operational substrate yet. Real products need searchable views, dashboards, reporting, and support operations. citeturn27view0turn19view1 | Add an event ingester + relational read model before building more front-end concepts. | High | Hard |
- `Stellaroid Earn - Deep Audit.md`: | Feature | Why It Matters | Priority | Difficulty | Suggested Implementation |
- `Stellaroid Earn - Deep Audit.md`: | Batch credential issuance | Real issuers do not issue one certificate at a time. | Critical | Medium | CSV import + background validation + batched signing queue + preview before issuance. |
- `Stellaroid Earn - Deep Audit.md`: | Standards export | Buyers will want VC/Open Badges compatibility. Standards are moving toward interoperable verifiable credentials and Open Badges 3.0 ecosystems. citeturn35view0turn35view1turn35view2 | Critical | Hard | Export each issued credential as Open Badges 3.0 / VC 2.0 compatible JSON, signed by issuer. |
- `Stellaroid Earn - Deep Audit.md`: | Issuer profile pages | “Trusted issuer” needs to be inspectable. | Critical | Medium | Public issuer page with verified domain, org details, approval status, issue count, last activity, revocations. |
- `Stellaroid Earn - Deep Audit.md`: | Off-chain search index | The current talent page admits indexing is missing. citeturn27view0 | Critical | Hard | Build event ingester → Postgres read model → search by wallet, hash, issuer, cohort. |
- `Stellaroid Earn - Deep Audit.md`: | Revocation/suspension UX | Contract supports revoke/suspend, but the public UI story centers on register/verify/pay. citeturn18view1turn42view0 | High | Medium | Add explicit admin/issuer workflows, banners on proof pages, and revocation reasons. |
- `Stellaroid Earn - Deep Audit.md`: | Expiration / renewal flow | Credential lifecycle matters in real programs. | High | Medium | Add expiry date, renewal reminders, and reissue flow. |
- `Stellaroid Earn - Deep Audit.md`: | Branded proof pages | Issuers pay for trust and brand. | High | Easy | Per-issuer theming, logo, domain mapping, policy links, and custom OG images. |
- `Stellaroid Earn - Deep Audit.md`: | Verification analytics | Credly and Accredible both push analytics/insight value. citeturn35view7turn35view8 | High | Medium | Track proof views, shares, verification requests, issuer conversion to pilot, and employer actions. |
- `Stellaroid Earn - Deep Audit.md`: | Employer export pack | Recruiters need a PDF/link summary, not just a hash page. | High | Easy | Generate a recruiter-safe summary packet with issuer, proof status, timestamps, and metadata. |
- `Stellaroid Earn - Deep Audit.md`: | ATS/API integration | Enterprise adoption will come through existing hiring systems. | High | Hard | Offer read APIs/webhooks for verification checks, issuer sync, and credential updates. |
- `Stellaroid Earn - Deep Audit.md`: | Waitlist / pilot request flow | No visible go-to-market capture exists. | High | Easy | Add “Book an issuer pilot” and “Request employer integration” flows. |
- `Stellaroid Earn - Deep Audit.md`: | Role-based admin console | A single admin wallet is not a real operating model. | High | Medium | Add org admins, reviewers, viewers, support roles, and audit logs. |
- `Stellaroid Earn - Deep Audit.md`: | Authentication | Wallet-based auth only; public proof pages need no login. citeturn26view0turn33search2 | Fine for demo, not for real issuer ops. | Org auth, admin RBAC, reviewer roles, non-crypto admin users. | Add app auth for dashboard users while keeping wallet signing for critical chain actions. | Do not make every viewer create an account. |
- `Stellaroid Earn - Deep Audit.md`: | App auth/RBAC | Better Auth or Auth.js | You need non-wallet admin users, SSO-ready growth, and TypeScript-native auth/authorization. citeturn39search10turn39search14 | When dashboard users expand beyond one admin wallet. | Added auth surface; must design roles carefully. |
- `Stellaroid Earn - Deep Audit.md`: | AI layer | OpenAI Responses + MCP only for targeted workflows | OpenAI supports MCP/data apps; use it for narrow, high-value workflows, not generic chat. citeturn38search0turn38search4 | After structured issuer/proof data exists. | Prompt/authorization risks if scoped badly. |
- `Stellaroid Earn - Deep Audit.md`: → Stellar contract for trust-critical writes
- `Stellaroid Earn - Deep Audit.md`: | Severity | Risk | Why it matters | Recommended fix |
- `Stellaroid Earn - Deep Audit.md`: | Critical | Issuer trust is weakly defined. | A wallet plus admin approval is not enough institutional trust for real credentialing. | Add org verification, domain checks, reviewer evidence, and issuer audit trails. |
- `Stellaroid Earn - Deep Audit.md`: | Critical | Public-by-default proof/privacy model. | Real employment/education records need holder control and selective sharing. W3C VC ecosystems explicitly account for issuer-holder-verifier exchange. citeturn41view0turn35view0 | Add proof visibility settings and holder-consented presentations. |
- `Stellaroid Earn - Deep Audit.md`: | Critical | Payment/compliance gap if moved beyond testnet. | Real contractor/payroll flows require onboarding, tax/compliance, disputes, and controlled release. Upwork and Deel make clear how much infrastructure lives here. citeturn35view11turn35view12 | Keep payments optional/pilot-only until a compliance strategy exists. |
- `Stellaroid Earn - Deep Audit.md`: | High | Single-admin trust/control model. | One admin address is brittle operationally and dangerous organizationally. citeturn18view1turn26view0 | Introduce multi-role admin governance and auditable approval actions. |
- `Stellaroid Earn - Deep Audit.md`: | High | Fee sponsor endpoint lacks visible rate limiting and audit logging. | The route validates shape, token, method, fees, and contract ID, which is good, but OWASP still expects strong authorization, abuse controls, and security logging for API surfaces. citeturn15view3turn16view1turn34search0turn34search1 | Add rate limits, request IDs, rotation, expiry, and security audit logs. |
- `Stellaroid Earn - Deep Audit.md`: | High | Incomplete monitoring for trust incidents. | Health exists, but there is no visible full incident/audit pipeline. OWASP treats logging and monitoring as core control areas. citeturn20view1turn34search1turn34search21 | Add audit logs, alerts, and immutable admin-action records. |
- `Stellaroid Earn - Deep Audit.md`: | Bundle size | Dynamically load QR, wallet, and chain-only code paths on app routes. | Split high-friction admin/employer surfaces into route-level chunks. | Do not spend weeks shaving micro-kilobytes while the UX is still unclear. |
- `Stellaroid Earn - Deep Audit.md`: | Phase | Tasks | Priority | Difficulty | Expected impact |
- `Stellaroid Earn - Deep Audit.md`: | Fix the foundation | Fix metrics/events inconsistency; remove unfinished talent/index features from primary flow; unify product copy; freeze new contract scope; add read-only demo mode. | Critical | Easy-Medium | Immediate trust recovery |
- `Stellaroid Earn - Deep Audit.md`: | Make it useful | Add Postgres read model + event ingester; batch issuance; issuer pages; revocation UX; proof summary export; analytics basics. | Critical | Medium-Hard | Turns demo into pilotable product |
- `Stellaroid Earn - Deep Audit.md`: | Make it competitive | Add VC/Open Badges export; issuer domain verification; ATS/API/webhooks; admin RBAC; recruiter summary pack. | High | Hard | Real differentiation vs hackathon demos |
- `Stellaroid Earn - Deep Audit.md`: | Make it marketable | Rewrite landing page around issuer wedge; add pilot capture funnel; publish one real issuer case study; tighten SEO/social proof; create demo scripts for issuer and employer personas. | High | Medium | Distribution and conversion |
- `Stellaroid Earn - Deep Audit.md`: **Top 5 highest-impact improvements**
- `Stellaroid.tech - Performance and SEO Review.pdf`: browser must discover the LCP
- `Stellaroid.tech - Performance and SEO Review.pdf`: Preload critical fonts and icons - Use next/font to self-host fonts and include preload tags to
- `Stellaroid.tech - Performance and SEO Review.pdf`: image, preload it using <link rel="preload" fetchpriority="high" as="image"> .
- `Stellaroid.tech - Performance and SEO Review.pdf`: Inline small critical CSS - Extract minimal CSS for the hero and proof badge into an inline
- `Stellaroid.tech - Performance and SEO Review.pdf`: <style> block so the page can render before Tailwind’s full bundle loads. Defer non-critical CSS
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: harm Core Web Vitals. This audit identifies current strengths, issues and a phased roadmap to harden SEO,
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: usePathname to manage mobile menus and highlight active links. This means
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: Phase 1 - SEO & domain integrity
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: copy; highlight the page’s purpose and include relevant keywords.
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: Phase 2 - Trim client-side footprint
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: Phase 3 - Optimize the /app experience
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: Phase 4 - Assets & performance budgets
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: Phase 5 - Continuous improvement & future plans
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: following the phased roadmap above-first solidifying SEO and domain behaviour , then trimming client
- `Stellaroid.tech - SEO Performance and Roadmap Audit.pdf`: Execute each phase decisively and avoid unnecessary polish until the fundamentals are in place.3.

## Constraints
- Preserve source document truth; do not invent features that are not supported by source context.
- Treat SEO/performance recommendations as implementation requirements only when the source docs describe them for this project.
- Treat missing evidence as a blocker or assumption, not as completed work.
