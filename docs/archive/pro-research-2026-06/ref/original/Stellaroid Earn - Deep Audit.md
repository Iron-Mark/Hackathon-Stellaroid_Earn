# Stellaroid Earn Deep Audit

## Executive summary

**What the project is trying to become**

Stellaroid Earn is trying to be a trust layer for skills and early-career hiring: issuers register a certificate hash on Stellar, an approved issuer or admin verifies it, the graduate gets a public proof URL, and an employer can pay the graduate from the same flow. The repo and site frame that loop as “verify credentials, settle payment in one flow,” with public proof pages, issuer approval, employer payments, a status page, metrics, and even an opportunity/paid-trial concept in the contract. citeturn42view0turn41view0turn9view0turn18view1

**What it currently does well**

This is not AI slop. It is a serious hackathon MVP with better engineering hygiene than most hackathon demos. It has a live domain, a real Soroban contract, documented architecture, Playwright E2E coverage, GitHub Actions CI for build/lint/typecheck/E2E, a release workflow for the contract, a health endpoint, CSP and security headers, and a public proof artifact that works without a wallet. That combination makes it feel like a polished portfolio-quality MVP with real implementation depth. citeturn43view0turn26view0turn15view1turn15view2turn14view2turn16view0turn10view5

**What is weak, missing, outdated, or unclear**

The project has a classic hackathon disease: it wants to be three products at once. It is simultaneously a credential verifier, a direct payment rail, and the beginnings of a paid-trial marketplace/opportunity system. That scope is too wide for the current trust surface. The public site still runs on testnet, the talent passport openly says indexing is “not live yet,” the metrics/events surface shows zero activity, and the documentation drifts in multiple places: roadmap copy, status page copy, design-system descriptions, contract surface descriptions, and route docs are not fully aligned. citeturn41view0turn27view0turn20view0turn21view0turn19view1turn43view0turn12view0turn13view0

**What it feels like right now**

The honest classification is: **a strong hackathon MVP and portfolio project that could become a real B2B pilot**, but is **not yet a production product**. It does not feel like an internal tool. It also does not feel like a durable startup product yet because the boring but decisive layers are missing: issuer identity verification, standards interoperability, indexing, privacy controls, admin operations, reporting, auditability, and compliance-ready payment handling. citeturn41view0turn27view0turn35view0turn35view1turn35view2turn35view11turn35view12

**The biggest opportunity**

The biggest opportunity is to **stop selling “proof + payment + marketplace” as one thing** and instead become **the cleanest verifiable credential proof layer for bootcamps, training providers, and student organizations**. That wedge fits the market better because standards-based digital credentials are maturing, skilled credentials are showing up more often in hiring, and trust signals in hiring are moving toward verification, portability, and skills-based evidence rather than resume claims alone. citeturn35view0turn35view1turn35view2turn35view5turn35view6

**Brutal verdict**

The strongest version of Stellaroid Earn is **not** “Web3 hiring marketplace.” That is fake productivity dressed as ambition. The strongest version is **issuer-grade credential proof infrastructure with walletless verification, issuer trust controls, analytics, standards exports, and ATS-friendly integrations**. Payments can stay as a later module or partner integration. If you keep forcing all three stories into one MVP, you will bury the only part that actually has a shot. citeturn42view0turn41view0turn27view1turn35view11turn35view12

## Product and feature gaps

**Product gap analysis**

| Gap area | Problem | Why it matters | Recommended fix | Priority | Difficulty |
|---|---|---|---|---|---|
| Core value proposition | The product tries to sell credential verification, direct payment, talent passports, and paid-trial opportunities at once. | Buyers do not buy four wedges at once. Credly, Accredible, Dock, and Velocity all win by being clear about the job they do: credentialing, lifecycle management, scale infrastructure, or career-wallet portability. citeturn35view7turn35view8turn35view9turn35view10 | Reposition around one wedge: **verifiable skills proof for bootcamps and training providers**. Relegate payments to “optional pilot workflow.” | Critical | Easy |
| User journey | The public site gives multiple destinations—About, Verify, Issuer, App, Employer, Status—before the visitor understands which path is theirs. | First-session comprehension is weak. Strong credential products usually separate issuer, earner, and verifier journeys clearly. citeturn42view0turn35view8turn35view10 | Redesign the landing page around 3 persona CTAs: **Issue**, **Verify**, **Hire**. Remove unfinished pages from top navigation. | Critical | Medium |
| Onboarding | Write flows depend on Freighter and Stellar testnet knowledge. | Freighter is a browser wallet; that is acceptable for a developer demo, but it is brutal for non-crypto issuers and employers. Stellar’s own docs frame Freighter as a wallet/browser extension, not a mass-market issuer admin console. citeturn33search2turn33search22turn42view0 | Add a no-wallet demo mode for first-use exploration, plus issuer onboarding that uses email + org verification + guided wallet setup only when needed. | Critical | Medium |
| Main use cases | The contract already includes issuer, credential, employer payment, and opportunity escrow functions, but the public UX mainly shows register/verify/pay and an incomplete employer/talent story. | Scope drift confuses buyers and increases implementation risk. The contract surface is ahead of the product surface. citeturn18view1turn41view0turn27view1turn27view0 | Freeze new contract surface. Ship the proof loop completely before expanding opportunity features. | Critical | Easy |
| Trust and credibility | The site says “live on-chain activity,” but the recent-contract-events block shows “No events yet,” metrics are zero, and `/api/events` returns an empty response, while a sample verified proof still exists. | That creates a credibility fracture around the core promise. If trust is the product, contradictory proof surfaces are poison. citeturn42view0turn20view0turn21view0turn4view0 | Fix the event indexer / event query / contract ID alignment first. Add a visible “last indexed ledger” field. | Critical | Medium |
| Standards interoperability | The system is hash-on-chain and record-based, but there is no visible W3C VC 2.0 or Open Badges 3.0 export/import layer. | In 2026, digital credentials are converging on interoperable standards. Without VC/Open Badges support, this stays chain-native and niche. citeturn35view0turn35view1turn35view2 | Add standards-based credential export first; later add verifiable presentations and issuer-signed JSON-LD/JWT envelopes. | Critical | Hard |
| Privacy model | The about page literally says “The proof is public by default.” | Public-by-default may work for hackathon demos; it is weak for real-world education/employment credentials, where selective disclosure and holder control matter. W3C VC 2.0 and career-wallet ecosystems explicitly formalize issuer-holder-verifier flows and user-controlled sharing. citeturn41view0turn35view0turn35view10 | Make proof visibility configurable: public, link-only, org-only, or holder-consented presentation. | Critical | Hard |
| Issuer trust layer | Current issuer trust is wallet self-registration followed by admin approval/suspension. No visible organization-domain verification, legal-entity verification, or third-party accreditation signal exists. | That means “trusted issuer” is mostly whatever the admin says. Modern trust systems increasingly expose verified companies, recruiters, and organizations as explicit credibility signals. citeturn18view1turn26view0turn30search2turn30search4turn30search14 | Add issuer verification workflow: domain verification, official website check, admin evidence, accreditation upload, and issuer profile page. | Critical | Medium |
| Retention | There is no clear reason for issuers/employers to return after the demo flow. | Credential products retain via issuer dashboards, analytics, automations, revocation tools, renewal reminders, and candidate pipelines—not just a proof page. Credly and Accredible both lean hard into management and insight layers. citeturn35view7turn35view8 | Add issuer dashboard KPIs, batch issuance, revocation queue, exports, and employer verification analytics. | High | Medium |
| Feedback loops | I found no public evidence of waitlists, contact-to-pilot forms, in-app feedback capture, issuer/admin notes, or user interview loops. | That is fatal if you want to move from demo to pilot. You cannot iterate on trust products blind. | Add product feedback events, contact-to-pilot funnel, and issuer/employer feedback prompts after key actions. | High | Easy |
| Monetization | The current site emphasizes “free public Stellar testnet demo” and “no purchase, subscription, or mainnet funds required.” | Good for a demo, bad for a product narrative. Without a paid admin layer, this remains a showcase. citeturn41view0 | Monetize issuers, not graduates. Charge for issuance volume, branded proof pages, analytics, API access, and compliance/reporting features. | High | Medium |
| Scalability as a real product | The talent passport page openly says automatic credential enumeration is not available until an index/search layer exists. | That means there is no off-chain operational substrate yet. Real products need searchable views, dashboards, reporting, and support operations. citeturn27view0turn19view1 | Add an event ingester + relational read model before building more front-end concepts. | High | Hard |

**Feature gap analysis**

| Feature | Why It Matters | Priority | Difficulty | Suggested Implementation |
|---|---|---|---|---|
| Batch credential issuance | Real issuers do not issue one certificate at a time. | Critical | Medium | CSV import + background validation + batched signing queue + preview before issuance. |
| Standards export | Buyers will want VC/Open Badges compatibility. Standards are moving toward interoperable verifiable credentials and Open Badges 3.0 ecosystems. citeturn35view0turn35view1turn35view2 | Critical | Hard | Export each issued credential as Open Badges 3.0 / VC 2.0 compatible JSON, signed by issuer. |
| Issuer profile pages | “Trusted issuer” needs to be inspectable. | Critical | Medium | Public issuer page with verified domain, org details, approval status, issue count, last activity, revocations. |
| Off-chain search index | The current talent page admits indexing is missing. citeturn27view0 | Critical | Hard | Build event ingester → Postgres read model → search by wallet, hash, issuer, cohort. |
| Revocation/suspension UX | Contract supports revoke/suspend, but the public UI story centers on register/verify/pay. citeturn18view1turn42view0 | High | Medium | Add explicit admin/issuer workflows, banners on proof pages, and revocation reasons. |
| Expiration / renewal flow | Credential lifecycle matters in real programs. | High | Medium | Add expiry date, renewal reminders, and reissue flow. |
| Branded proof pages | Issuers pay for trust and brand. | High | Easy | Per-issuer theming, logo, domain mapping, policy links, and custom OG images. |
| Verification analytics | Credly and Accredible both push analytics/insight value. citeturn35view7turn35view8 | High | Medium | Track proof views, shares, verification requests, issuer conversion to pilot, and employer actions. |
| Employer export pack | Recruiters need a PDF/link summary, not just a hash page. | High | Easy | Generate a recruiter-safe summary packet with issuer, proof status, timestamps, and metadata. |
| ATS/API integration | Enterprise adoption will come through existing hiring systems. | High | Hard | Offer read APIs/webhooks for verification checks, issuer sync, and credential updates. |
| Waitlist / pilot request flow | No visible go-to-market capture exists. | High | Easy | Add “Book an issuer pilot” and “Request employer integration” flows. |
| Role-based admin console | A single admin wallet is not a real operating model. | High | Medium | Add org admins, reviewers, viewers, support roles, and audit logs. |
| Fraud/risk dashboard | Trust products need anomaly detection. | Medium | Hard | Detect suspicious bursts, duplicate metadata patterns, brand/domain mismatches, rapid revocations. |
| Mobile wallet cards | Accredible already supports mobile wallet cards; portable mobile proof is expected. citeturn31search7turn31search15turn31search23 | Medium | Medium | Offer Apple Wallet / Google Wallet cards or pass-style proof links. |
| Collaboration notes | Issuers and reviewers need internal notes. | Medium | Easy | Internal issuer review notes, decision history, and evidence attachments. |
| Import existing credentials | Switching cost kills pilots. | Medium | Medium | CSV/API import from existing LMS/credential spreadsheets. |
| Accessibility hardening | WCAG 2.2 is the current standard; trust products should not fail basic accessibility. citeturn34search3turn34search7 | Medium | Medium | Keyboard-first flows, proper labels, focus states, reduced motion, error announcements, contrast audit. |
| Native mobile app | Freighter now spans mobile surfaces, but native should wait. citeturn33search26turn33search30 | Low | Hard | Defer until issuer pilot proves mobile-frequency demand. |

## Market and business landscape

**Latest market trends**

The market direction is not “put credentials on a blockchain and call it innovation.” The market direction is **portable, standards-based, machine-verifiable, employer-usable credentials**. W3C VC 2.0 formalizes the issuer-holder-verifier model, while Open Badges and Open Badges 3.0 implementation guidance push ecosystem compatibility for skill and achievement credentials. That means Stellaroid’s current hash-on-chain proof is directionally correct on tamper evidence, but incomplete on interoperability and holder control. citeturn35view0turn35view1turn35view2

On the hiring side, the signal is obvious: skilled credentials are becoming more common in recruiting. SHRM reports that in 2025, 87% of HR professionals encountered applicants with skilled credentials sometimes, often, or almost always, up from 77% in 2021. LinkedIn’s 2025 skills-based hiring report also shows that skills-based approaches expand talent pools for AI and green jobs, while LinkedIn’s 2026 product updates are pushing verified AI-tool proficiency onto profiles. Skills proof is moving from “nice badge” to “decision input.” citeturn35view5turn35view4turn35view6

User expectations in 2026 are also rising around trust signals. LinkedIn now supports workplace verification, page verification, and new skill-validation mechanisms, which means recruiter and issuer trust is becoming productized. If Stellaroid wants employers to believe an issuer, it cannot stop at “admin approved this wallet.” citeturn30search2turn30search4turn30search14turn35view6

For product patterns, incumbents are ahead on the boring stuff: Credly sells verified digital badges plus workforce insights; Accredible sells credential management, pathways, and measurement; Dock/Truvera sells standards-based APIs, issuance, verification, revocation, and wallet infrastructure; Velocity leans into career-wallet portability and user data control. Stellaroid currently wins only on simplicity and on-chain demo clarity. It loses on operational maturity. citeturn35view7turn35view8turn35view9turn35view10

For payments, the market standard is even harsher. Upwork Direct Contracts leads with escrow protection, disputes, and payment flows; Deel leads with onboarding, global payments, and compliance-heavy workforce operations. Stellaroid’s one-tap XLM payment is neat, but it is nowhere near enterprise-ready labor/payment infrastructure. citeturn35view11turn35view12

**Which trends are worth copying**

Copy these hard:
- **VC/Open Badges interoperability**
- **issuer/admin analytics**
- **walletless public proof plus portable wallet export**
- **verified issuer/company trust signals**
- **ATS/API integrations**
- **skills-first, recruiter-usable summaries**

**Which trends are hype**

Mostly hype for this project:
- NFT badge layers
- tokenized marketplaces
- broad “on-chain talent graph” narratives
- AI chatbots that do nothing except restate proof data
- mainnet launch before pilot discipline

The project’s own roadmap already warns against marketplace, NFT, and premature mainnet scope. That instinct is correct. citeturn19view1

**Which trends this project should ignore**

Ignore native app expansion, full payroll, generic agent frameworks, and consumer social growth loops until issuer pilots exist. You are not losing because you lack an agent. You are losing because the trust layer is incomplete.

**Competitor and benchmark analysis**

| Competitor | Strength | Weakness | Feature to Learn From | Differentiation Opportunity |
|---|---|---|---|---|
| Credly | Massive network positioning, verified badges, workforce insights, strategic workforce planning. citeturn35view7 | Enterprise-heavy; can feel broad and top-down. | Issuer analytics + network-facing credential utility. | Be radically faster and cheaper for small training providers and bootcamps. |
| Accredible | Strong credential lifecycle management, learning-path visibility, measurement, mobile-wallet patterns. citeturn35view8turn31search7 | Less differentiated on on-chain proof or payment rails. | Branded proof pages, analytics, recipient UX, wallet cards. | Win on cryptographic proof transparency and public no-login verification. |
| Dock / Truvera | Enterprise-grade issuance/verification/revocation APIs, wallet infra, standards-based integration. citeturn35view9 | Less emotionally simple for a small issuer pilot. | API-first lifecycle management and standards compliance. | Win on a narrower education-to-employment wedge with cleaner public proof UX. |
| Velocity Career Wallet | Holder-controlled data, multi-issuer career-wallet vision, interoperable career records. citeturn35view10 | Ecosystem coordination is slow and enterprise/network heavy. | Career wallet + user-controlled sharing. | Start with walletless proof now, then add wallet portability later instead of forcing wallet-first UX. |
| Upwork Direct Contracts | Escrow, dispute assistance, milestone model, payment trust. citeturn35view11 | Not a credential product. | Escrow UX and milestone clarity. | Partner or imitate the workflow patterns, not the whole marketplace. |
| Deel | Onboarding, compliance, global payments, contractor ops at scale. citeturn35view12 | Heavyweight for the current Stellaroid scope. | Compliance-aware worker onboarding and admin surfaces. | Do not build Deel. Integrate or abstract payments later if real demand shows up. |

**Business and monetization analysis**

The best target user is **not the student**. The best first paying user is the **issuer**: bootcamps, training providers, student organizations, campus career centers, or niche certification programs that need fast, inspectable skill proof. Employers are the second buyer, but only after the proof layer is good enough to integrate into hiring workflows. That matches the market’s move toward skills-first hiring, skilled credentials, and verified skills signals. citeturn35view5turn35view6

The pain points worth monetizing are straightforward:
- “We issue certificates but employers do not trust them.”
- “We need branded proof pages, issuer trust signals, and shareability.”
- “We need revocation, reissue, analytics, and reporting.”
- “We want lightweight integrations, not a giant LMS replacement.”

The wrong monetization path is B2C wallet fees, ads, or trying to take payment margin before you even have compliance-grade flows. The right path is **B2B SaaS**:
- **Free**: demo/testnet, limited credentials, public proof pages, sample issuer profile
- **Starter**: branded proof pages, CSV import, basic analytics, revocation, support
- **Growth**: VC/Open Badges export, domain-verified issuer pages, API/webhooks, ATS export pack
- **Enterprise**: SSO, audit logs, approval workflows, custom contracts, private proof modes, SLA

If payments survive into production, monetize them as an **optional module** or partner integration, not as the core business. Upwork and Deel are useful reminders that real payment infrastructure is operationally expensive and compliance-heavy. citeturn35view11turn35view12

## Technology and architecture audit

**Technology stack audit**

| Area | Current state | Is it good enough? | What is missing | What should be upgraded | What should not be overengineered |
|---|---|---|---|---|---|
| Frontend | Next.js 15 + React 19. citeturn13view0turn26view0 | Yes. Good choice. | Better route hierarchy, stronger state/flow design, better component docs. | Keep the stack; fix product structure, not framework choice. | Do not rewrite in another frontend framework. |
| Smart contract | Rust + soroban-sdk 22; 12 public functions; typed errors. citeturn18view0turn18view1turn41view0 | Good foundation. | Stronger test depth, event/indexing discipline, role model beyond one admin. | Freeze surface and harden tests. | Do not add more contract functions yet. |
| Database | None for product read models; contract state only. | No. | Search, issuer ops, event analytics, audit history, feedback history. | Add Postgres read model + event ingester. | Do not force all product operations on-chain. |
| Authentication | Wallet-based auth only; public proof pages need no login. citeturn26view0turn33search2 | Fine for demo, not for real issuer ops. | Org auth, admin RBAC, reviewer roles, non-crypto admin users. | Add app auth for dashboard users while keeping wallet signing for critical chain actions. | Do not make every viewer create an account. |
| API structure | Light Next.js routes for fee sponsorship, health, events. citeturn15view3turn16view2turn16view3 | Minimal but incomplete. | Read-model APIs, issuer admin APIs, audit APIs, webhooks. | Add versioned internal API layer once DB exists. | Do not split into microservices yet. |
| Hosting/deployment | Vercel for frontend, release workflow for contract. citeturn26view0turn15view2turn43view0 | Good enough now. | Worker/runtime for indexing and jobs. | Add background job runner and DB-backed ingestion pipeline. | Do not add Kubernetes. |
| State management | Mostly local/route/client-side + contract reads. | Fine for current size. | Centralized domain-state boundaries for issuer/employer flows. | Add lightweight server state patterns only if read model grows. | Avoid Redux unless product complexity actually demands it. |
| UI component system | Inconsistent docs: one README says “no utility framework,” but package includes Tailwind, shadcn, CVA, and tailwind-merge; architecture doc says Tailwind v4. citeturn12view0turn13view0turn26view0 | Not clean enough. | Single source of truth for tokens/components. | Standardize on Tailwind v4 + shadcn/CVA + documented design tokens. | Do not build a giant custom design language before fixing UX. |
| Design system | Tokens exist in globals.css, but no public component workshop. citeturn12view0 | Partial. | Storybook, documented patterns, component states. | Add Storybook + visual regression. | Do not invent dozens of custom primitives. |
| Testing | Playwright E2E exists; contract tests exist; CI runs frontend checks. citeturn14view2turn25view0turn25view1turn25view2turn15view1turn41view0 | Better than average. | Contract CI on every change, unit/component tests, load tests, API tests. | Add contract CI + component tests. | Do not obsess over 100% coverage. |
| CI/CD | Frontend CI and tagged release workflow. citeturn15view1turn15view2 | Good start. | DB migrations, staged previews for issuer test data, smoke monitors. | Add smoke checks and environment promotion rules. | Do not add enterprise release machinery too early. |
| Monitoring/analytics | Health endpoint, metrics/events page, Vercel Analytics. citeturn10view5turn16view2turn20view0turn20view1 | Weak for a trust product. | Error monitoring, session replay, funnel analytics, audit logs. | Add Sentry + PostHog + structured audit trails. | Do not build custom BI before instrumenting basic events. |
| Security | CSP, HSTS, X-Frame-Options, fee-bump request validation, allow-listed methods. citeturn16view0turn15view3 | Good instincts. | Rate limiting, audit logs, secret rotation, org auth, abuse controls. | Add API hardening + logging + RBAC. | Do not assume CSP alone equals production security. |
| Performance/scalability | CDN-cached proof reads (`revalidate=60`) and client-side simulateTransaction. citeturn10view0turn26view0 | Fine for demo scale. | Indexed reads, pagination, backfill jobs, queueing, multi-issuer data volume handling. | Add read model + background jobs. | Do not prematurely shard or multi-region optimize. |
| Developer experience | Strong docs, runbooks, and release notes. citeturn19view0turn19view1turn26view2 | Strong. | Living architecture docs, fewer doc contradictions. | Make docs executable and synchronized with code. | Do not keep writing strategy docs instead of closing product gaps. |

**Latest technology recommendations**

| Area | Recommended Tool/Tech | Why | When to Use | Risk |
|---|---|---|---|---|
| Relational read model | Supabase Postgres or Neon Postgres | You need a real operational read layer; Supabase gives RLS-backed defense in depth, while Neon improves dev productivity with branching. citeturn40search0turn40search29 | As soon as you build search, issuer dashboards, analytics, and audit trails. | Moderate ops/schema complexity. |
| App auth/RBAC | Better Auth or Auth.js | You need non-wallet admin users, SSO-ready growth, and TypeScript-native auth/authorization. citeturn39search10turn39search14 | When dashboard users expand beyond one admin wallet. | Added auth surface; must design roles carefully. |
| Product analytics & flags | PostHog | Feature flags, staged rollouts, analytics, experiments. citeturn39search0turn39search4 | When you start piloting issuer workflows and need funnel evidence. | Event-spam if you instrument badly. |
| Error + UX debugging | Sentry | Error tracking, performance traces, session replay with privacy controls. citeturn39search1turn39search17 | Immediately after pilot traffic begins. | Privacy review required. |
| Background jobs | Trigger.dev | Durable long-running jobs with retries, queues, and TypeScript-friendly workflows. citeturn38search3 | For batch issuance, event ingestion, notifications, exports, and retryable syncing. | Another moving part. |
| Workflow automation | n8n | Useful for low-code issuer onboarding, CRM sync, email ops, and AI-assisted internal workflows. citeturn38search2turn38search6 | After you have repeatable operational processes worth automating. | Can become spaghetti if unmanaged. |
| AI layer | OpenAI Responses + MCP only for targeted workflows | OpenAI supports MCP/data apps; use it for narrow, high-value workflows, not generic chat. citeturn38search0turn38search4 | After structured issuer/proof data exists. | Prompt/authorization risks if scoped badly. |
| Design system | Storybook + Chromatic | Build, test, and document components in isolation with visual regression. citeturn39search3turn39search19 | Immediately if multiple dashboard surfaces remain. | Extra setup time; worth it once component reuse matters. |
| Email/notifications | Resend + React Email | Fast developer-friendly email stack with React templates. citeturn40search3turn40search11turn40search15 | For issuer approval notices, proof issuance emails, revocation alerts, and pilot ops. | Deliverability/domain setup required. |
| AI/app interoperability | MCP server for issuer/admin data later | MCP is becoming a standard way to expose tools/context to AI systems. citeturn38search1turn38search5 | Use only after you have stable read APIs and permissioning. | Premature adoption if core UX is still broken. |

**Architecture review**

**Current architecture**

The current architecture is basically:

```text
Student / Issuer / Employer
→ Next.js frontend
→ Freighter wallet for writes
→ Soroban RPC / simulateTransaction for reads
→ Stellar testnet contract
→ tiny API routes for health / events / fee sponsorship
→ Vercel Analytics
```

That is clean for a demo and excellent for a hackathon. It is not enough for a production credential product. citeturn26view0turn10view0turn15view3turn16view2turn16view3

**Ideal architecture**

```text
Student / Issuer / Employer / Admin
→ Web app
→ App auth + RBAC
→ API layer
→ Domain services
   → Credential issuance service
   → Issuer verification service
   → Proof rendering service
   → Employer verification pack service
→ Postgres read model
→ Background workers / queues
   → Stellar event ingestion
   → Metadata validation
   → Notification sending
   → Export generation
→ Stellar contract for trust-critical writes
→ Object storage for metadata/evidence
→ Analytics / audit logs / monitoring
→ Optional external integrations
   → ATS / LMS / CRM / email / payroll partner
```

**What is missing**

What is missing is not fancy architecture. It is the middle layer that makes products usable:
- off-chain read model
- issuer/admin operations
- audit logging
- consent/privacy controls
- org auth and roles
- notification workflows
- import/export pipelines
- standards serialization

Right now the system architecture is chain-first. It needs to become **product-first with chain-backed trust guarantees**. That is the real upgrade. citeturn27view0turn18view1turn35view0turn35view1

**AI and automation opportunities**

Only build AI where it removes actual work or increases trust.

| AI feature | User problem solved | Input | Processing | Output | Risk | Suggested model/tool | MVP version | Advanced version |
|---|---|---|---|---|---|---|---|---|
| Credential ingestion assistant | Issuers should not manually copy metadata from certificates. | PDF/image/URL + issuer schema | OCR + field extraction + schema validation + fraud heuristics | Draft credential record with confidence flags | PII leakage, OCR errors | Multimodal extraction + rules engine | Extract title/cohort/date into a draft form | Full issuer template learning + anomaly detection |
| Recruiter proof summary | Employers need readable proof, not chain jargon. | Credential hash + issuer profile + event history | Summarization + policy template | One-page verification summary | Hallucinated wording if data is thin | OpenAI Responses on structured data | “Explain this credential” summary card | Recruiter export pack with job-fit context |
| Skill-fit scoring | Employers need a quick relevance signal. | Structured skills from credential + job reqs | Taxonomy mapping + weighted scoring | Match score + rationale | Bias, weak taxonomy data | Rules first, model second | Keyword + taxonomy overlap | Learned scorer with human review |
| Issuer risk scoring | Admins need help spotting bad issuers. | Issuer registrations, event patterns, metadata domains | Rule engine + anomaly detection | Risk flags and review queue | False positives | Simple risk rules + analytics | Burst issuance / suspicious domain mismatch review | ML-assisted anomaly classification |
| Internal ops copilot | Small team needs faster support/admin ops. | Docs, policies, logs, issuer records | Retrieval + action suggestions | Support drafts, checklists, admin summaries | Over-trust, permission leaks | OpenAI + narrow internal RAG | Support answer assistant | MCP-backed admin assistant with role-scoped tools |

The key rule: **do not build a public AI chatbot first**. That is theater. Build structured data, then build AI on top of that structured data. citeturn38search0turn38search1turn38search2

## UX, security, and performance audit

**Top UX issues**

| Issue | Why it hurts | Fix |
|---|---|---|
| The hero tells three stories at once. | Visitors do not know whether this is for issuers, grads, or employers. | Rewrite hero around one wedge and route by persona. citeturn42view0turn41view0 |
| Navigation exposes unfinished or secondary surfaces. | “Employer,” “Status,” and sometimes “Talent” concepts appear before trust is built. | Hide or demote incomplete surfaces from primary nav. citeturn42view0turn27view0turn43view0 |
| “Live on-chain activity” shows zero activity. | This directly undercuts the core proof narrative. | Fix events/metrics first, or temporarily remove the block. citeturn42view0turn20view0turn21view0 |
| The talent passport page publicly admits key functionality is missing. | Honest, yes. Great UX, no. | Replace with waitlist/beta interstitial until indexing exists. citeturn27view0 |
| Employer flow is under-explained. | It promises escrowed opportunities but visible UI starts with a hash lookup and little context. | Give employers a 3-step checklist and clearer state machine. citeturn27view1turn18view1 |
| Chain jargon leaks too early. | Soroban, SAC, Freighter, testnet are implementation details, not user benefits. | Move technical depth behind expandable sections. citeturn42view0turn41view0 |
| No strong onboarding handrail. | First-time users need guided proof, issuer, and employer demo paths. | Add preset demos, dummy personas, and guided walkthroughs. |
| Doc/status copy drifts. | Inconsistent copy reduces trust in an already trust-sensitive product. | Make one source of truth for status, domain, and roadmap copy. citeturn19view1turn26view2turn43view0 |
| Trust signals are thin. | No issuer-verification explanation, no org evidence, no buyer-oriented assurance language. | Add issuer trust rubric and public issuer cards. |
| Dashboard value is not obvious before wallet connect. | That raises onboarding friction. | Show a read-only demo state before requiring Freighter. |

**Top UI improvements**

| UI improvement | Practical implementation |
|---|---|
| Strong persona cards on home | Three cards: “Issue credentials,” “Verify proof,” “Hire from proof.” |
| Tighter CTA hierarchy | One primary CTA per page; secondary links become less prominent text actions. |
| Status chips | Reusable status chips for Pending, Approved, Verified, Revoked, Suspended, Expired. |
| Better empty states | Replace “No events yet” with explanation + action + fallback proof example. |
| Consistent proof card | Make the proof card the visual anchor across web, embed, print/export, and social views. |
| Form scaffolding | Add helper text, inline validation, mask/formatting, and sample autofill states everywhere. |
| Trust blocks | Add issuer domain, approval source, contract ID, last verification time, policy links. |
| Mobile-first actions | Sticky bottom CTA for proof copy/share/verify on small screens. |
| Typographic cleanup | Reduce headline density and chain jargon on the landing page. |
| Beta labels | Anything incomplete gets a visible “Beta / Not live yet” tag instead of hidden surprise. |

**Top quick wins**

1. Remove or hide the talent passport from primary discovery until indexing exists. citeturn27view0  
2. Fix the events/metrics inconsistency before shipping anything else. citeturn20view0turn21view0turn42view0  
3. Split the home page into issuer / verifier / employer journeys.  
4. Add a read-only demo mode so users can understand the product before wallet setup.  
5. Standardize trust copy across About, Status, Roadmap, and README. citeturn19view1turn43view0turn41view0turn9view0

**Top design-system improvements**

1. Pick one truth: Tailwind-based component system with tokenized primitives, or fully custom CSS system. Right now the docs contradict the implementation. citeturn12view0turn13view0turn26view0  
2. Add Storybook for components, states, and documentation. citeturn39search3turn39search19  
3. Define canonical status, form, and empty/error/loading patterns.  
4. Add visual regression review before merge.  
5. Create reusable “artifact” components: issuer card, proof card, verification summary, audit trail row.

**Security, privacy, and abuse risk**

| Severity | Risk | Why it matters | Recommended fix |
|---|---|---|---|
| Critical | Issuer trust is weakly defined. | A wallet plus admin approval is not enough institutional trust for real credentialing. | Add org verification, domain checks, reviewer evidence, and issuer audit trails. |
| Critical | Public-by-default proof/privacy model. | Real employment/education records need holder control and selective sharing. W3C VC ecosystems explicitly account for issuer-holder-verifier exchange. citeturn41view0turn35view0 | Add proof visibility settings and holder-consented presentations. |
| Critical | Payment/compliance gap if moved beyond testnet. | Real contractor/payroll flows require onboarding, tax/compliance, disputes, and controlled release. Upwork and Deel make clear how much infrastructure lives here. citeturn35view11turn35view12 | Keep payments optional/pilot-only until a compliance strategy exists. |
| High | Single-admin trust/control model. | One admin address is brittle operationally and dangerous organizationally. citeturn18view1turn26view0 | Introduce multi-role admin governance and auditable approval actions. |
| High | Fee sponsor endpoint lacks visible rate limiting and audit logging. | The route validates shape, token, method, fees, and contract ID, which is good, but OWASP still expects strong authorization, abuse controls, and security logging for API surfaces. citeturn15view3turn16view1turn34search0turn34search1 | Add rate limits, request IDs, rotation, expiry, and security audit logs. |
| High | Incomplete monitoring for trust incidents. | Health exists, but there is no visible full incident/audit pipeline. OWASP treats logging and monitoring as core control areas. citeturn20view1turn34search1turn34search21 | Add audit logs, alerts, and immutable admin-action records. |
| Medium | Embedded proof route is intentionally frame-embeddable. | That is useful for portfolio embeds, but it expands framing surface. citeturn12view0turn16view0 | Restrict embed hosts for paid plans or add signed embed tokens. |
| Medium | No visible abuse controls for public verification/search. | Once search/indexing exists, enumeration and scraping risks rise. | Add IP throttling, query caps, bot detection, and privacy-aware read APIs. |
| Medium | File-upload security not yet designed. | If certificate uploads are added, unrestricted upload becomes a serious risk. OWASP explicitly warns here. citeturn34search2turn34search6 | Use allow-lists, AV scanning, content validation, isolated storage, expiring URLs. |
| Low | Documentation drift. | Operationally dangerous over time, but easy to fix now. | Tie docs to release/versioning and delete stale claims faster. |

**Performance and scalability**

This is an architectural performance audit, not a Lighthouse report. I did **not** run lab measurements. The important performance story is still clear.

| Area | Immediate fixes | Long-term fixes | Do not optimize yet |
|---|---|---|---|
| Proof/read performance | Keep proof pages cached, but fix events/metrics consistency first. citeturn10view0turn20view0 | Add indexed read model so dashboards and talent pages do not depend on heavy live RPC reads. | Do not chase edge-native DB complexity before you even have a read model. |
| Bundle size | Dynamically load QR, wallet, and chain-only code paths on app routes. | Split high-friction admin/employer surfaces into route-level chunks. | Do not spend weeks shaving micro-kilobytes while the UX is still unclear. |
| API response time | Add caching and throttling to public read APIs. `/api/health` already revalidates every 30s; `/api/events` is light but empty. citeturn16view2turn16view3 | Add queue-backed ingestion instead of querying RPC for every operational view. | Do not build a full custom event bus yet. |
| Data volume | Introduce pagination, issuer filters, cohort filters, and search once indexed. | Partition read models logically by issuer/org if data grows. | Do not shard anything today. |
| Background work | Move issuance imports, exports, and notifications into background jobs. | Durable workers with retries and observability. | Do not create a microservice fleet. |
| Mobile performance | Prioritize walletless proof and summary views as the mobile-first path. | Add pass-style proof cards if usage proves it. | Do not build native mobile first. |

## Roadmap and final recommendations

**Practical roadmap**

| Phase | Tasks | Priority | Difficulty | Expected impact |
|---|---|---|---|---|
| Fix the foundation | Fix metrics/events inconsistency; remove unfinished talent/index features from primary flow; unify product copy; freeze new contract scope; add read-only demo mode. | Critical | Easy–Medium | Immediate trust recovery |
| Make it useful | Add Postgres read model + event ingester; batch issuance; issuer pages; revocation UX; proof summary export; analytics basics. | Critical | Medium–Hard | Turns demo into pilotable product |
| Make it competitive | Add VC/Open Badges export; issuer domain verification; ATS/API/webhooks; admin RBAC; recruiter summary pack. | High | Hard | Real differentiation vs hackathon demos |
| Make it marketable | Rewrite landing page around issuer wedge; add pilot capture funnel; publish one real issuer case study; tighten SEO/social proof; create demo scripts for issuer and employer personas. | High | Medium | Distribution and conversion |
| Make it scalable | Add monitoring, audit logs, feature flags, background jobs, environment workflows, docs automation, and partner-friendly API strategy. | Medium | Medium | Operational durability |

**MVP vs overengineering filter**

| Build Now | Build Later | Avoid |
|---|---|---|
| Events/indexing fix | MCP server for enterprise AI agents | NFT badge layer |
| Issuer dashboard | Native mobile app | Marketplace mechanics |
| Batch issuance | Production payment rails | Token gimmicks |
| Proof export pack | Advanced AI scoring | “Metaverse” talent passport nonsense |
| VC/Open Badges export | Selective disclosure presentations | Mainnet before pilot evidence |
| Issuer verification workflow | ATS integrations | Broad DAO/community features |
| Analytics + audit logs | Wallet cards | Rebuilding Deel/Upwork in-house |
| Read-only demo mode | Escrowed paid trials beyond pilot | Generic chatbot for the homepage |

**Top 5 biggest weaknesses**

- The product story is too broad and currently diluted.
- Trust/credibility is undermined by zero-event metrics and unfinished discovery/index features.
- There is no off-chain operational layer, so dashboards/search/reporting are fundamentally limited.
- The issuer trust model is still too weak for serious employers.
- The project is standards-light in a market moving toward VC/Open Badges interoperability. citeturn20view0turn21view0turn27view0turn35view0turn35view1turn35view2

**Top 5 highest-impact improvements**

- Narrow the product to **issuer-grade proof infrastructure**.
- Build the **event ingester + Postgres read model**.
- Add **issuer verification and public issuer trust profiles**.
- Ship **VC/Open Badges export**.
- Instrument **analytics, audit logs, and operational monitoring**. citeturn35view0turn35view1turn35view7turn35view8

**Top 5 features to build next**

- Batch issuance
- Issuer profile + verification flow
- Revocation/suspension UX
- Recruiter verification summary export
- Searchable read-model-backed talent/credential views

**Top 5 technologies to consider**

- Supabase Postgres or Neon Postgres for read models. citeturn40search0turn40search29
- Better Auth/Auth.js for app auth and RBAC. citeturn39search10turn39search14
- PostHog for analytics and feature flags. citeturn39search0turn39search4
- Sentry for errors/perf/replay. citeturn39search1turn39search17
- Trigger.dev for jobs and ingestion workflows. citeturn38search3

**Top 5 things to avoid**

- Building more contract surface before product surface catches up
- Pretending testnet payments equal market-ready labor payments
- Shipping a generic AI assistant before structured product data exists
- Expanding into marketplace/talent graph features before indexing and issuer ops exist
- Rewriting the stack instead of fixing scope and operations

**One brutally honest verdict**

Yes, this project is worth continuing **if** you kill the fake-productivity scope creep and commit to the boring path: issuer trust, standards, indexing, admin ops, and proof usability. If you keep chasing “proof + payments + opportunities + passports + AI” at once, you will turn a genuinely promising MVP into a permanently impressive demo.

**Open questions and limitations**

This audit is based on the public site, the public repository, and public market/standards sources. I did not have production analytics, private user interviews, private GitHub issues/PR discussions, or a full lab-based Core Web Vitals/accessibility scan. Where public evidence was incomplete, I labeled the gap instead of guessing.