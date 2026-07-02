# June Monthly Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public product path clearer and add a standards-alignment proof export preview.

**Architecture:** Keep the current Next.js App Router structure. Use server-rendered public routes where possible, small client islands only for existing interactive proof/share controls, and existing tokenized Tailwind classes.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4 tokens, Stellar/Soroban client helpers.

---

### Task 1: Persona-First Landing and Nav

**Files:**
- Modify: `frontend/src/components/layout/site-nav.tsx`
- Modify: `frontend/src/components/landing/localized-hero.tsx`
- Modify: `frontend/src/lib/i18n.ts`

- [x] Reduce primary nav to role-driven destinations: Verify, Issue, Hire, Pilot, Status.
- [x] Add three persona cards to the hero: Issue, Verify, Hire.
- [x] Keep CTAs keyboard-accessible, responsive, and at least 44px tall.

### Task 2: Standards-Alignment Export Preview

**Files:**
- Modify: `frontend/src/lib/proof-export.ts`
- Modify: `frontend/src/components/proof/recruiter-cta-panel.tsx`
- Add: `frontend/src/lib/proof-export.test.ts`
- Modify: `frontend/e2e/pilot-export.spec.ts`

- [x] Add an explicit unsigned standards preview section to the employer export JSON.
- [x] Map current proof fields toward W3C VC and Open Badges concepts without claiming conformance.
- [x] Add a proof-page action label that tells recruiters the download includes standards mapping.
- [x] Cover the new export shape in unit and E2E tests.

### Task 3: Proof Lookup Visual Cleanup

**Files:**
- Modify: `frontend/src/app/proof/page.tsx`
- Modify: `frontend/src/app/proof/[hash]/page.tsx`

- [x] Replace inline proof lookup page styles with tokenized Tailwind classes.
- [x] Replace proof detail main wrapper inline styles with classes.
- [x] Keep no-wallet proof lookup behavior and route cache behavior unchanged.

### Task 4: Documentation and Verification

**Files:**
- Modify: `frontend/TODO.md`
- Modify: `docs/planning/research-intake-status.md`

- [x] Mark the new standards-alignment preview and persona entry work in repo-local tracking docs.
- [x] Run unit tests, lint, build, and targeted Playwright checks.
- [x] Inspect final diff before committing.
