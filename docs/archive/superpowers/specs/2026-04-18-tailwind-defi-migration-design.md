# Tailwind v4 + DeFi Redesign Migration

**Date:** 2026-04-18
**Branch:** dev
**Status:** Approved — ready for implementation planning

---

## Goal

Migrate the Stellaroid Earn frontend from CSS Modules to Tailwind CSS v4, while simultaneously upgrading the visual design to a full DeFi aesthetic — glassmorphism, glow effects, animated hero, Framer Motion entrance animations, and a font swap to Orbitron + Exo 2. The existing color palette (amber/violet/teal on dark navy) is preserved. shadcn/ui provides the primitive component layer.

---

## Approach: Layer-by-Layer (Bottom-Up)

CSS Modules coexist with Tailwind during migration. Each component is either 100% CSS Modules or 100% Tailwind — never both. Modules are deleted once their Tailwind rewrite is complete. The app stays buildable and deployable at every phase boundary.

---

## Section 1: Foundation Setup

### New Dependencies
- `tailwindcss` + `@tailwindcss/postcss` — Tailwind v4, config-in-CSS via `@theme`
- `framer-motion` — entrance animations, hover effects, pulsing indicators
- `lucide-react` — consistent SVG icon set, replaces all inline SVGs
- `shadcn/ui` — accessible primitive components (Button, Badge, Input, Skeleton, Toast, Dialog, Tooltip, Separator)

### Tailwind v4 Setup
No `tailwind.config.js`. Configuration lives in `globals.css` via `@theme {}` blocks. Next.js 15 uses `@tailwindcss/postcss` in `postcss.config.mjs`.

### Font Swap
Via `next/font/google` in `app/layout.tsx`:

| Role | Font | Weights | CSS Variable |
|------|------|---------|--------------|
| Heading | Orbitron | 400/500/600/700 | `--font-heading` |
| Body | Exo 2 | 300/400/500/600/700 | `--font-sans` |
| Mono | JetBrains Mono | 400/500 | `--font-mono` |
| Pixel | Share Tech Mono | 400 | `--font-pixel` |

All four registered in `@theme` and applied to `body` / heading elements in base layer.

---

## Section 2: Design Token Layer

All existing `:root` CSS variables migrate to `@theme {}`. Tailwind auto-generates utilities (`bg-primary`, `text-muted`, `rounded-md`, etc.).

### Color Tokens (existing + DeFi additions)

| Token | Value | Notes |
|-------|-------|-------|
| `--color-bg` | `#0F172A` | Page background |
| `--color-surface` | `#1E293B` | Solid surface |
| `--color-surface-2` | `#273549` | Elevated solid surface |
| `--color-surface-glass` | `rgba(30,41,59,0.6)` | **New** — frosted glass base |
| `--color-border` | `#334155` | Default border |
| `--color-border-glass` | `rgba(255,255,255,0.08)` | **New** — hairline glass border |
| `--color-text` | `#F8FAFC` | Primary text |
| `--color-text-muted` | `#94A3B8` | Secondary text |
| `--color-primary` | `#F59E0B` | Amber |
| `--color-primary-hover` | `#FBBF24` | Amber hover |
| `--color-on-primary` | `#0F172A` | Text on amber |
| `--color-accent` | `#8B5CF6` | Violet |
| `--color-verified` | `#2DD4BF` | Teal |
| `--color-verified-strong` | `#14B8A6` | Teal strong |
| `--color-verified-bg` | `rgba(45,212,191,0.12)` | Teal tint |
| `--color-success` | `#22C55E` | Green |
| `--color-warning` | `#F59E0B` | Amber |
| `--color-danger` | `#EF4444` | Red |
| `--color-glow-primary` | `rgba(245,158,11,0.35)` | **New** — amber glow |
| `--color-glow-accent` | `rgba(139,92,246,0.35)` | **New** — violet glow |
| `--color-glow-verified` | `rgba(45,212,191,0.35)` | **New** — teal glow |

### Shadow Scale (DeFi glows)

| Token | Value |
|-------|-------|
| `--shadow-glow-sm` | `0 0 12px rgba(245,158,11,0.25)` |
| `--shadow-glow-md` | `0 0 24px rgba(245,158,11,0.35)` |
| `--shadow-glow-lg` | `0 4px 32px rgba(245,158,11,0.45), 0 0 64px rgba(245,158,11,0.15)` |
| `--shadow-glow-accent` | `0 0 24px rgba(139,92,246,0.35)` |
| `--shadow-glow-verified` | `0 0 16px rgba(45,212,191,0.35)` |

### Animation Tokens

| Token | Value |
|-------|-------|
| `--ease-defi` | `cubic-bezier(0.16, 1, 0.3, 1)` — premium DeFi easing |
| `--animate-shimmer` | Moving gradient wash for skeleton loading |
| `--animate-float` | Subtle Y-axis oscillation for hero orbs |

### Border Radius
`--radius-sm: 6px` / `--radius-md: 8px` / `--radius-lg: 12px` stay for small UI elements. Cards and modals upgrade to `rounded-2xl` (16px). Buttons upgrade to `rounded-full` (pill).

---

## Section 3: DeFi Visual System

### Glassmorphism
Applied to nav, cards, modals, and overlays.

```
backdrop-blur-md bg-surface-glass border border-border-glass
```

- **Nav:** `backdrop-blur-xl` + top-edge 1px amber gradient hairline
- **Cards:** `bg-surface-glass rounded-2xl border border-border-glass hover:border-glow-accent`
- **Modals/Dialogs:** `backdrop-blur-lg bg-surface-glass`

### Hero Sections
- Background: radial gradient `#0F172A` → `#050912`
- 2–3 absolutely-positioned Framer Motion blur orbs (amber + violet), opacity 0.12, slow `animate-float` oscillation
- Noise texture: SVG `feTurbulence` filter at 3% opacity as a `::before` pseudo-element
- Headings: `font-heading bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent`

### CTA Buttons
- Shape: `rounded-full` (pill)
- Primary fill: `bg-gradient-to-r from-primary to-primary-hover`
- Hover: `shadow-glow-lg` + Framer Motion `scale: 1.02` spring
- Ghost: `border border-border-glass hover:border-primary hover:shadow-glow-sm`

### Cards
- `rounded-2xl bg-surface-glass border border-border-glass`
- Top-edge 2px gradient accent bar appears on hover
- Framer Motion `whileHover`: `shadow-glow-accent` + `y: -2`
- Entrance: fade-up via stagger parent

### Status / Pulsing Indicators
All verified/deployed/network dots use Framer Motion:
```js
animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
```

### Monospace Data
Hashes, contract IDs, amounts — JetBrains Mono, `text-primary`, subtle `text-shadow: 0 0 8px var(--color-glow-primary)`.

### Skeleton Loading
Shimmer animation — moving gradient wash (`animate-shimmer`) replaces static grey blocks.

### Page Entrance Animations
Framer Motion `staggerChildren` on section wrappers:
```js
// Parent
variants={{ visible: { transition: { staggerChildren: 0.04 } } }}

// Child
variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
```

---

## Section 4: Migration Phases

### Phase 1 — Foundation
**Files touched:** `package.json`, `postcss.config.mjs`, `globals.css`, `app/layout.tsx`
- Install Tailwind v4 + PostCSS, Framer Motion, Lucide React
- Migrate `globals.css` `:root` → `@theme`, add new DeFi tokens
- Swap fonts in `layout.tsx` via `next/font/google`
- Verify all existing CSS Modules still compile

### Phase 2a — shadcn Init + Theme Mapping
**Files touched:** `globals.css`, `components/ui/` (scaffolded)
- `npx shadcn@latest init` — dark mode, Tailwind v4, `src/` path
- Map shadcn CSS variables to DeFi palette:

| shadcn var | Maps to |
|------------|---------|
| `--primary` | `#F59E0B` |
| `--primary-foreground` | `#0F172A` |
| `--accent` | `#8B5CF6` |
| `--accent-foreground` | `#F8FAFC` |
| `--card` | `rgba(30,41,59,0.6)` |
| `--card-foreground` | `#F8FAFC` |
| `--border` | `rgba(255,255,255,0.08)` |
| `--destructive` | `#EF4444` |
| `--muted` | `#273549` |
| `--muted-foreground` | `#94A3B8` |
| `--background` | `#0F172A` |
| `--foreground` | `#F8FAFC` |
| `--radius` | `8px` |

- Install shadcn components: `Button`, `Badge`, `Input`, `Skeleton`, `Separator`, `Dialog`, `Tooltip`
- Add Sonner for toasts

### Phase 2b — Primitive Component Rewrites
**Files deleted:** `button.module.css`, `badge.module.css`, `input.module.css`, `skeleton.module.css`, `toast.module.css`, `copy-button.module.css`, `hash-reveal.module.css`
- Wrap / extend shadcn `Button` with DeFi pill + glow variants
- Wrap / extend shadcn `Badge` with DeFi tones (primary, accent, verified, neutral, danger)
- `CopyButton` and `HashReveal` rewritten as Tailwind-only custom components
- `JsonLd` has no CSS — no change needed

### Phase 3 — Layout Shell
**Files deleted:** `site-nav.module.css`, `site-footer.module.css`, `app-shell.module.css`, `locale-toggle.module.css`
- `SiteNav`: glassmorphism (`backdrop-blur-xl bg-surface-glass`), sticky amber hairline top border, Lucide icons
- `SiteFooter`: glass surface, gradient brand tagline
- `AppShell`: Tailwind layout utilities only
- `LocaleToggle`: Tailwind + shadcn `Button` ghost variant

### Phase 4 — Feature Components
**Files deleted:** 13 CSS module files across `proof/`, `activity/`, `actions/`, `wallet/`, `milestones/`, `onboarding/`, `demo/`

Order:
1. `proof-card` + `proof-block-preview` + `share-buttons`
2. `recent-activity` + `activity-snackbar`
3. `next-action-card` + `actions`
4. `wallet-connect-button` + `wallet-empty-state` + `network-banner`
5. `milestone-rail`
6. `freighter-welcome` + `demo-autofill-button`
7. `localized-hero` + `localized-about-copy`

All inline SVGs across these components swap to Lucide React equivalents.

### Phase 5 — Pages + Framer Motion
**Files deleted:** `app/page.module.css`, `app/about/page.module.css`, `app/app/page.module.css`, `app/proof/[hash]/loading.module.css`
- Home page: hero orbs, stagger entrance, full Tailwind layout
- About page: hero centered, stagger sections
- App page: Tailwind layout utilities
- Proof/loading: shimmer skeleton
- Framer Motion `AnimatePresence` wrappers added at page level
- All CSS module imports gone — `globals.css` is clean `@theme` + base resets only

---

## End State

| Metric | Before | After |
|--------|--------|-------|
| CSS Module files | 28 | 0 |
| Component library | None | shadcn/ui |
| Animation library | CSS only | Framer Motion |
| Icon system | Inline SVGs | Lucide React |
| Fonts | Space Grotesk / JetBrains Mono / Share Tech Mono | Orbitron / Exo 2 / JetBrains Mono / Share Tech Mono |
| Visual style | Dark flat | DeFi glassmorphism + glow |

---

## Constraints

- Color palette (amber/violet/teal on dark navy) is locked — do not change hex values
- All routes target Stellar **testnet** — no mainnet references
- No backend additions
- `prefers-reduced-motion` must be respected in all Framer Motion animations
- WCAG AA contrast maintained throughout (accent badge already fixed to `#C4B5FD`)
