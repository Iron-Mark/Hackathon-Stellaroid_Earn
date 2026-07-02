# Tailwind v4 + DeFi Redesign Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Migrate all 28 CSS Module files to Tailwind CSS v4 while upgrading the visual design to a DeFi glassmorphism aesthetic with Framer Motion animations, shadcn/ui primitives, Lucide React icons, and an Orbitron/Exo 2 font swap.

**Architecture:** Layer-by-layer bottom-up migration — foundation tokens first, then primitive UI components, then layout shell, then feature components, then pages. CSS Modules coexist during migration; each component is either 100% CSS Modules or 100% Tailwind, never both. App stays buildable at every phase boundary.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4 (`@tailwindcss/postcss`), shadcn/ui, Framer Motion, Lucide React, `next/font/google` (Orbitron + Exo 2)

---

## File Map

### Created

- `frontend/postcss.config.mjs` — Tailwind v4 PostCSS plugin
- `frontend/src/lib/motion.ts` — reusable Framer Motion variants + DeFi easing

### Heavily Modified

- `frontend/src/styles/globals.css` — `:root` → `@theme`, DeFi tokens, shadcn vars, shimmer/float keyframes
- `frontend/src/app/layout.tsx` — `next/font/google` font setup, CSS variable injection

### Rewritten (CSS Module deleted, TSX updated)

Every component listed in Phases 2–5 below.

---

## Task 1 — Install Dependencies

**Files:** `frontend/package.json`

- [x] **Step 1: Install Tailwind v4 + PostCSS**

```bash
cd frontend
npm install tailwindcss@latest @tailwindcss/postcss@latest
```

- [x] **Step 2: Install Framer Motion + Lucide React**

```bash
npm install framer-motion lucide-react
```

- [x] **Step 3: Verify no peer-dep errors**

```bash
npm ls 2>&1 | grep -i "peer\|invalid" || echo "OK"
```

Expected: `OK` or no peer errors blocking build.

- [x] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install tailwindcss v4, framer-motion, lucide-react"
```

---

## Task 2 — PostCSS Config

**Files:**

- Create: `frontend/postcss.config.mjs`

- [x] **Step 1: Create the file**

```js
// frontend/postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [x] **Step 2: Verify dev server starts**

```bash
npm run dev
```

Expected: server starts on `http://localhost:3000` with no PostCSS errors. CSS Modules still work.

- [x] **Step 3: Commit**

```bash
git add postcss.config.mjs
git commit -m "chore: add tailwind v4 postcss config"
```

---

## Task 3 — Migrate globals.css to @theme with DeFi Tokens

**Files:**

- Modify: `frontend/src/styles/globals.css`

- [x] **Step 1: Replace `:root` with `@import "tailwindcss"` + `@theme` block**

Replace the entire file contents with:

```css
@import "tailwindcss";
@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Exo+2:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&family=Share+Tech+Mono&display=swap");

@theme {
  /* Colors — existing palette */
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-surface-2: #273549;
  --color-surface-glass: rgba(30, 41, 59, 0.6);
  --color-border: #334155;
  --color-border-glass: rgba(255, 255, 255, 0.08);
  --color-text: #f8fafc;
  --color-text-muted: #94a3b8;
  --color-primary: #f59e0b;
  --color-primary-hover: #fbbf24;
  --color-on-primary: #0f172a;
  --color-accent: #8b5cf6;
  --color-verified: #2dd4bf;
  --color-verified-strong: #14b8a6;
  --color-verified-bg: rgba(45, 212, 191, 0.12);
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;

  /* DeFi glow colors */
  --color-glow-primary: rgba(245, 158, 11, 0.35);
  --color-glow-accent: rgba(139, 92, 246, 0.35);
  --color-glow-verified: rgba(45, 212, 191, 0.35);

  /* Border radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Spacing */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 24px;
  --spacing-6: 32px;

  /* Fonts */
  --font-heading: "Orbitron", system-ui, sans-serif;
  --font-sans: "Exo 2", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --font-pixel: "Share Tech Mono", ui-monospace, monospace;

  /* Type scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-md: 1.125rem;
  --text-lg: 1.25rem;
  --text-xl: 1.5rem;
  --text-2xl: 1.875rem;
  --text-3xl: 2.5rem;
  --text-4xl: 3.25rem;

  /* DeFi shadow / glow scale */
  --shadow-glow-sm: 0 0 12px rgba(245, 158, 11, 0.25);
  --shadow-glow-md: 0 0 24px rgba(245, 158, 11, 0.35);
  --shadow-glow-lg:
    0 4px 32px rgba(245, 158, 11, 0.45), 0 0 64px rgba(245, 158, 11, 0.15);
  --shadow-glow-accent: 0 0 24px rgba(139, 92, 246, 0.35);
  --shadow-glow-verified: 0 0 16px rgba(45, 212, 191, 0.35);

  /* DeFi easing */
  --ease-defi: cubic-bezier(0.16, 1, 0.3, 1);

  /* Animations */
  --animate-shimmer: shimmer 1.8s linear infinite;
  --animate-float: float 6s ease-in-out infinite;
  --animate-pulse-glow: pulse-glow 2s ease-in-out infinite;
}

/* shadcn/ui CSS variable bridge */
@layer base {
  :root {
    --background: 15 23 42; /* #0F172A */
    --foreground: 248 250 252; /* #F8FAFC */
    --card: 30 41 59; /* #1E293B */
    --card-foreground: 248 250 252;
    --popover: 30 41 59;
    --popover-foreground: 248 250 252;
    --primary: 245 158 11; /* #F59E0B */
    --primary-foreground: 15 23 42; /* #0F172A */
    --secondary: 39 53 73; /* #273549 */
    --secondary-foreground: 248 250 252;
    --muted: 39 53 73;
    --muted-foreground: 148 163 184; /* #94A3B8 */
    --accent: 139 92 246; /* #8B5CF6 */
    --accent-foreground: 248 250 252;
    --destructive: 239 68 68; /* #EF4444 */
    --destructive-foreground: 248 250 252;
    --border: 51 65 85; /* #334155 */
    --input: 51 65 85;
    --ring: 245 158 11; /* #F59E0B */
    --radius: 0.5rem;
  }
}

/* CSS Reset */
*,
*::before,
*::after {
  box-sizing: border-box;
}

body,
h1,
h2,
h3,
h4,
h5,
h6,
p {
  margin: 0;
}

body {
  min-height: 100dvh;
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

main[id] {
  scroll-margin-top: 96px;
}

code,
pre {
  font-family: var(--font-mono);
}

:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

a {
  color: var(--color-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}

a:hover {
  color: var(--color-primary);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Keyframes */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-12px);
  }
}

@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 6px rgba(245, 158, 11, 0.4);
  }
  50% {
    box-shadow: 0 0 18px rgba(245, 158, 11, 0.8);
  }
}

/* Utility */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

- [x] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds. CSS Modules still work (they don't use `@theme`).

- [x] **Step 3: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat: migrate globals.css to tailwind v4 @theme with DeFi tokens"
```

---

## Task 4 — Swap Fonts in layout.tsx

**Files:**

- Modify: `frontend/src/app/layout.tsx`

- [x] **Step 1: Update layout.tsx to use next/font/google**

```tsx
// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { cookies } from "next/headers";
import {
  Orbitron,
  Exo_2,
  JetBrains_Mono,
  Share_Tech_Mono,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ToastProvider } from "@/components/ui";
import { JsonLd } from "@/components/ui/json-ld";
import "../styles/globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const exo2 = Exo_2({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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

const BASE_URL = "https://stellaroid-earn-demo.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Stellaroid Earn",
    template: "%s — Stellaroid Earn",
  },
  description:
    "Stellaroid Earn links proof and payment on Stellar so teams can check the record and pay with confidence.",
  alternates: { canonical: BASE_URL },
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Stellaroid Earn",
    description: "Check the record and pay with confidence on Stellar.",
    locale: "en_US",
    alternateLocale: "tl_PH",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stellaroid Earn",
    description: "Check the record and pay with confidence on Stellar.",
  },
};

const webAppJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Stellaroid Earn",
    url: BASE_URL,
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
  },
];

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const lang =
    cookieStore.get("stellaroid:locale")?.value === "tl" ? "tl" : "en";

  return (
    <html
      lang={lang}
      className={`${orbitron.variable} ${exo2.variable} ${jetbrainsMono.variable} ${shareTechMono.variable}`}
    >
      <body suppressHydrationWarning>
        {webAppJsonLd.map((schema, i) => (
          <JsonLd key={i} data={schema} />
        ))}
        <ToastProvider>
          {children}
          <Analytics />
        </ToastProvider>
      </body>
    </html>
  );
}
```

- [x] **Step 2: Remove the Google Fonts `@import` from globals.css** (next/font replaces it)

In `globals.css`, delete the line:

```css
@import url("https://fonts.googleapis.com/css2?family=Orbitron...");
```

- [x] **Step 3: Verify build + fonts load**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds. Fonts switch to Orbitron/Exo 2 in browser.

- [x] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/styles/globals.css
git commit -m "feat: swap fonts to Orbitron + Exo 2 via next/font"
```

---

## Task 5 — shadcn Init + Install Components

**Files:**

- Create: `frontend/components.json` (auto-generated)
- Modify: `frontend/src/components/ui/` (scaffolded)

- [x] **Step 1: Install shadcn peer deps**

```bash
npm install class-variance-authority clsx tailwind-merge
```

- [x] **Step 2: Run shadcn init**

```bash
npx shadcn@latest init
```

Answer the prompts:

- Style: **New York**
- Base color: **Neutral**
- CSS variables: **Yes**
- When asked for globals CSS path: `src/styles/globals.css`
- Components path: `src/components/ui`
- Utils path: `src/lib/utils`

- [x] **Step 3: Install required shadcn components**

```bash
npx shadcn@latest add button badge input skeleton separator dialog tooltip
```

- [x] **Step 4: Install Sonner (toast)**

```bash
npm install sonner
```

- [x] **Step 5: Verify shadcn lib/utils.ts was created**

```bash
cat src/lib/utils.ts
```

Expected output:

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [x] **Step 6: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [x] **Step 7: Commit**

```bash
git add .
git commit -m "feat: init shadcn/ui with DeFi theme mapping"
```

---

## Task 6 — Create Motion Variants Library

**Files:**

- Create: `frontend/src/lib/motion.ts`

- [x] **Step 1: Create motion.ts**

```ts
// frontend/src/lib/motion.ts
// Reusable Framer Motion variants + DeFi easing for consistent animations.

export const EASE_DEFI = [0.16, 1, 0.3, 1] as const;

export const fadeUp = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { ease: EASE_DEFI, duration: 0.5 } },
};

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { ease: EASE_DEFI, duration: 0.4 } },
};

export const scaleIn = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { ease: EASE_DEFI, duration: 0.4 },
  },
};

export const cardHover = {
  rest: { y: 0, boxShadow: "none" },
  hover: {
    y: -2,
    boxShadow: "0 0 24px rgba(139, 92, 246, 0.35)",
    transition: { ease: EASE_DEFI, duration: 0.25 },
  },
};

export const glowPulse = {
  animate: {
    scale: [1, 1.4, 1],
    opacity: [1, 0.5, 1],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

export const ctaHover = {
  rest: { scale: 1, boxShadow: "0 4px 14px rgba(245,158,11,0.15)" },
  hover: {
    scale: 1.02,
    boxShadow:
      "0 4px 32px rgba(245,158,11,0.45), 0 0 64px rgba(245,158,11,0.15)",
    transition: { ease: EASE_DEFI, duration: 0.2 },
  },
};
```

- [x] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/lib/motion.ts
git commit -m "feat: add framer motion variants library"
```

---

## Task 7 — Rewrite Button Component

**Files:**

- Modify: `frontend/src/components/ui/button.tsx`
- Delete: `frontend/src/components/ui/button.module.css`

The shadcn `button.tsx` uses `cva` (class-variance-authority). We extend it with DeFi pill shape, gradient primary, and glow hover via Framer Motion.

- [x] **Step 1: Replace button.tsx**

```tsx
// frontend/src/components/ui/button.tsx
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ctaHover } from "@/lib/motion";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "rounded-full font-sans font-semibold text-[15px] whitespace-nowrap",
    "border transition-colors duration-200",
    "cursor-pointer no-underline",
    "min-h-11 px-5",
    "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
    "disabled:opacity-45 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-linear-to-r from-primary to-primary-hover",
          "text-on-primary border-primary",
        ],
        secondary: ["bg-surface-2 text-text border-border", "hover:bg-border"],
        ghost: [
          "bg-transparent text-text border-transparent",
          "hover:bg-surface-2",
        ],
        outline: [
          "bg-transparent text-text border-border-glass",
          "hover:border-primary",
        ],
        danger: ["bg-danger text-text border-danger", "hover:opacity-85"],
      },
      size: {
        default: "min-h-11 px-5 text-[15px]",
        sm: "min-h-9 px-3 text-[13px]",
        icon: "min-h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  href?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading, disabled, children, href, ...props },
    ref,
  ) => {
    const classes = cn(buttonVariants({ variant, size }), className);
    const isDisabled = disabled || loading;

    const inner = (
      <>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </>
    );

    if (href) {
      return (
        <motion.a
          href={href}
          className={classes}
          initial="rest"
          whileHover={isDisabled ? "rest" : "hover"}
          variants={variant === "primary" ? ctaHover : undefined}
        >
          {inner}
        </motion.a>
      );
    }

    return (
      <motion.button
        ref={ref}
        className={classes}
        disabled={isDisabled}
        initial="rest"
        whileHover={isDisabled ? "rest" : "hover"}
        variants={variant === "primary" ? ctaHover : undefined}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {inner}
      </motion.button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

- [x] **Step 2: Delete the old CSS module**

```bash
rm src/components/ui/button.module.css
```

- [x] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [x] **Step 4: Commit**

```bash
git add src/components/ui/button.tsx
git rm src/components/ui/button.module.css
git commit -m "feat: rewrite Button with Tailwind v4 + DeFi pill + Framer Motion glow"
```

---

## Task 8 — Rewrite Badge Component

**Files:**

- Modify: `frontend/src/components/ui/badge.tsx`
- Delete: `frontend/src/components/ui/badge.module.css`

- [x] **Step 1: Replace badge.tsx**

```tsx
// frontend/src/components/ui/badge.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { glowPulse } from "@/lib/motion";

const toneClasses: Record<string, string> = {
  neutral: "bg-text-muted/15 text-text-muted border-transparent",
  primary: "bg-primary/10 text-primary border-primary/30",
  accent: "bg-accent/20 text-violet-300 border-accent/30",
  verified: "bg-verified-bg text-verified border-verified/30",
  success: "bg-success/12 text-success border-success/30",
  warning: "bg-warning/12 text-warning border-warning/30",
  danger: "bg-danger/12 text-danger border-danger/30",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof toneClasses;
  dot?: boolean;
}

export function Badge({
  tone = "neutral",
  dot,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        "h-6 px-2.5 rounded-full",
        "font-pixel text-xs font-medium leading-none whitespace-nowrap",
        "border",
        toneClasses[tone] ?? toneClasses.neutral,
        className,
      )}
      {...props}
    >
      {dot && (
        <motion.span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            tone === "verified"
              ? "bg-verified"
              : tone === "primary"
                ? "bg-primary"
                : tone === "accent"
                  ? "bg-violet-300"
                  : "bg-current",
          )}
          animate={glowPulse.animate}
        />
      )}
      {children}
    </span>
  );
}
```

- [x] **Step 2: Delete old CSS module**

```bash
rm src/components/ui/badge.module.css
```

- [x] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [x] **Step 4: Commit**

```bash
git add src/components/ui/badge.tsx
git rm src/components/ui/badge.module.css
git commit -m "feat: rewrite Badge with Tailwind v4 + DeFi tones"
```

---

## Task 9 — Rewrite Input, Skeleton, CopyButton, HashReveal; Add Sonner Toast

**Files:**

- Modify: `frontend/src/components/ui/input.tsx`
- Modify: `frontend/src/components/ui/skeleton.tsx`
- Modify: `frontend/src/components/ui/copy-button.tsx`
- Modify: `frontend/src/components/ui/hash-reveal.tsx`
- Delete: `input.module.css`, `skeleton.module.css`, `copy-button.module.css`, `hash-reveal.module.css`, `toast.module.css`
- Modify: `frontend/src/components/ui/index.ts` (replace ToastProvider with Sonner)

- [x] **Step 1: Rewrite input.tsx**

```tsx
// frontend/src/components/ui/input.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex w-full min-h-11 px-3 py-2",
        "rounded-lg bg-surface-2 border",
        "font-sans text-[15px] text-text placeholder:text-text-muted/60",
        "transition-colors duration-150",
        error
          ? "border-danger focus-visible:outline-danger"
          : "border-border focus-visible:border-primary focus-visible:outline-primary",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-45 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
```

- [x] **Step 2: Rewrite skeleton.tsx**

```tsx
// frontend/src/components/ui/skeleton.tsx
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md",
        "bg-size-[200%_100%] bg-linear-to-r",
        "from-surface-2 via-surface to-surface-2",
        "animate-[shimmer_1.8s_linear_infinite]",
        className,
      )}
      {...props}
    />
  );
}
```

- [x] **Step 3: Rewrite copy-button.tsx**

```tsx
// frontend/src/components/ui/copy-button.tsx
"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  ariaLabel?: string;
  className?: string;
}

export function CopyButton({
  value,
  ariaLabel = "Copy",
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied!" : ariaLabel}
      className={cn(
        "inline-flex items-center justify-center",
        "w-7 h-7 rounded-md",
        "text-text-muted hover:text-primary",
        "bg-transparent hover:bg-primary/10",
        "transition-colors duration-150 cursor-pointer",
        className,
      )}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-success" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
```

- [x] **Step 4: Rewrite hash-reveal.tsx**

```tsx
// frontend/src/components/ui/hash-reveal.tsx
"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface HashRevealProps {
  hash: string;
  short?: string;
  className?: string;
}

export function HashReveal({ hash, short, className }: HashRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const display = revealed
    ? hash
    : (short ?? `${hash.slice(0, 8)}…${hash.slice(-8)}`);

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <code className="font-mono text-[13px] text-primary [text-shadow:0_0_8px_rgba(245,158,11,0.35)]">
        {display}
      </code>
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        aria-label={revealed ? "Hide full hash" : "Show full hash"}
        className="inline-flex items-center justify-center w-5 h-5 text-text-muted hover:text-primary transition-colors cursor-pointer"
      >
        {revealed ? (
          <EyeOff className="w-3.5 h-3.5" />
        ) : (
          <Eye className="w-3.5 h-3.5" />
        )}
      </button>
    </span>
  );
}
```

- [x] **Step 5: Update ui/index.ts — replace ToastProvider with Sonner**

```ts
// frontend/src/components/ui/index.ts
export { Button, buttonVariants } from "./button";
export type { ButtonProps } from "./button";
export { Badge } from "./badge";
export type { BadgeProps } from "./badge";
export { Input } from "./input";
export { Skeleton } from "./skeleton";
export { CopyButton } from "./copy-button";
export { HashReveal } from "./hash-reveal";
export { Separator } from "./separator";
export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./dialog";
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

// Toast via Sonner
export { Toaster as ToastProvider } from "sonner";
export { toast } from "sonner";
```

- [x] **Step 6: Delete old CSS modules**

```bash
rm src/components/ui/input.module.css
rm src/components/ui/skeleton.module.css
rm src/components/ui/copy-button.module.css
rm src/components/ui/hash-reveal.module.css
rm src/components/ui/toast.module.css
```

- [x] **Step 7: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [x] **Step 8: Commit**

```bash
git add src/components/ui/
git commit -m "feat: rewrite UI primitives + swap to Sonner toast"
```

---

## Task 10 — Rewrite SiteNav (Glassmorphism)

**Files:**

- Modify: `frontend/src/components/layout/site-nav.tsx`
- Delete: `frontend/src/components/layout/site-nav.module.css`

- [x] **Step 1: Read current site-nav.tsx**

```bash
cat src/components/layout/site-nav.tsx
```

- [x] **Step 2: Rewrite site-nav.tsx**

```tsx
// frontend/src/components/layout/site-nav.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Github } from "lucide-react";
import { LocaleToggle } from "./locale-toggle";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/proof", label: "Verify" },
  { href: "/app", label: "App" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <a
        href="#main"
        className="absolute left-4 -top-12 z-11 focus:top-3 px-3 py-2 rounded-md bg-primary text-on-primary font-semibold text-sm transition-[top] no-underline"
      >
        Skip to content
      </a>

      {/* Glassmorphism nav */}
      <nav
        className={cn(
          "sticky top-0 z-10",
          "border-b border-border-glass",
          "backdrop-blur-xl bg-surface-glass",
          /* amber hairline top edge */
          "before:absolute before:inset-x-0 before:top-0 before:h-px",
          "before:bg-linear-to-r before:from-transparent before:via-primary/60 before:to-transparent",
          "relative",
        )}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between max-w-260 mx-auto px-7 py-4 gap-4">
          {/* Brand */}
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-text no-underline font-bold text-[17px] tracking-[-0.2px] shrink-0 hover:opacity-80 transition-opacity focus-visible:outline-primary"
          >
            <Image src="/logo.svg" alt="" width={28} height={28} />
            <span className="font-heading">Stellaroid Earn</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex gap-6 text-sm flex-1 ml-6">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-text-muted hover:text-text no-underline transition-colors focus-visible:outline-primary rounded-sm"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            <LocaleToggle />
            <Button
              href="https://github.com/Iron-Mark/Stellar-Bootcamp-2026"
              variant="primary"
              size="sm"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub
            </Button>
          </div>

          {/* Mobile burger */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-border text-text bg-transparent cursor-pointer hover:bg-surface-2 transition-colors"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-x-0 top-16.25 bottom-0 z-9 bg-bg flex flex-col gap-1 p-6 md:hidden">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3.5 text-text text-[17px] border-b border-border no-underline hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2">
            <LocaleToggle />
            <Button
              href="https://github.com/Iron-Mark/Stellar-Bootcamp-2026"
              variant="outline"
              size="sm"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
```

- [x] **Step 3: Delete old CSS module**

```bash
rm src/components/layout/site-nav.module.css
```

- [x] **Step 4: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [x] **Step 5: Commit**

```bash
git add src/components/layout/site-nav.tsx
git rm src/components/layout/site-nav.module.css
git commit -m "feat: rewrite SiteNav with glassmorphism + amber hairline"
```

---

## Task 11 — Rewrite SiteFooter, AppShell, LocaleToggle

**Files:**

- Modify: `frontend/src/components/layout/site-footer.tsx`
- Modify: `frontend/src/components/layout/app-shell.tsx`
- Modify: `frontend/src/components/layout/locale-toggle.tsx`
- Delete: `site-footer.module.css`, `app-shell.module.css`, `locale-toggle.module.css`

- [x] **Step 1: Read current files**

```bash
cat src/components/layout/site-footer.tsx
cat src/components/layout/app-shell.tsx
cat src/components/layout/locale-toggle.tsx
```

- [x] **Step 2: Rewrite site-footer.tsx**

Keep the same content structure but replace all `styles.*` class references with Tailwind utilities. Key classes:

```tsx
// frontend/src/components/layout/site-footer.tsx
import Link from "next/link";
import Image from "next/image";
import { appConfig } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="border-t border-border-glass bg-surface-glass mt-20 px-6 py-8 text-sm text-text-muted text-center">
      <div className="max-w-260 mx-auto flex flex-col items-center gap-4">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="" width={22} height={22} />
          <span className="font-heading text-text font-semibold text-[15px]">
            Stellaroid Earn
          </span>
        </div>
        <p className="text-[13px] leading-relaxed max-w-sm">
          A thin piece of software around one idea:{" "}
          <em className="not-italic font-medium bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
            certificates should be verifiable in seconds, not emails.
          </em>
        </p>
        <nav
          className="flex flex-wrap justify-center gap-5 text-[13px]"
          aria-label="Footer navigation"
        >
          <Link
            href="/about"
            className="hover:text-text transition-colors no-underline"
          >
            About
          </Link>
          <Link
            href="/proof"
            className="hover:text-text transition-colors no-underline"
          >
            Verify
          </Link>
          <Link
            href="/app"
            className="hover:text-text transition-colors no-underline"
          >
            App
          </Link>
          {appConfig.contractId && (
            <a
              href={`${appConfig.explorerUrl}/contract/${appConfig.contractId}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary transition-colors no-underline"
            >
              Contract ↗
            </a>
          )}
        </nav>
        <p className="text-xs text-text-muted/60">
          Stellar PH Bootcamp · Built on testnet
        </p>
      </div>
    </footer>
  );
}
```

- [x] **Step 3: Rewrite app-shell.tsx**

```tsx
// frontend/src/components/layout/app-shell.tsx
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className={cn("min-h-dvh text-text font-sans", className)}>
      {children}
    </div>
  );
}
```

- [x] **Step 4: Read and rewrite locale-toggle.tsx** (keep existing locale logic, swap CSS Module to Tailwind)

```bash
cat src/components/layout/locale-toggle.tsx
```

Replace `styles.*` with inline Tailwind classes on the existing toggle logic. The toggle renders two buttons — active gets `text-primary font-semibold`, inactive gets `text-text-muted`.

- [x] **Step 5: Delete old CSS modules**

```bash
rm src/components/layout/site-footer.module.css
rm src/components/layout/app-shell.module.css
rm src/components/layout/locale-toggle.module.css
```

- [x] **Step 6: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [x] **Step 7: Commit**

```bash
git add src/components/layout/
git commit -m "feat: rewrite layout shell components with Tailwind + glass footer"
```

---

## Task 12 — Rewrite ProofCard, ProofBlockPreview, ShareButtons

**Files:**

- Modify: `frontend/src/components/proof/proof-card.tsx`
- Modify: `frontend/src/components/proof/proof-block-preview.tsx`
- Modify: `frontend/src/components/proof/share-buttons.tsx`
- Delete: `proof-card.module.css`, `proof-block-preview.module.css`

- [x] **Step 1: Read current files**

```bash
cat src/components/proof/proof-card.tsx
cat src/components/proof/proof-block-preview.tsx
cat src/components/proof/share-buttons.tsx
```

- [x] **Step 2: Rewrite proof-card.tsx**

Replace all `styles.*` references with Tailwind utilities. Key DeFi card pattern:

```tsx
// Card wrapper pattern:
<motion.div
  className="rounded-2xl bg-surface-glass border border-border-glass p-6"
  initial="rest"
  whileHover="hover"
  variants={cardHover}
>
  {/* top accent bar on hover via before: pseudo or conditional class */}
```

Keep all existing prop types and data rendering logic. Only replace the className sources from CSS Module to Tailwind. Import `motion` from `framer-motion`, `cardHover` from `@/lib/motion`, `cn` from `@/lib/utils`. Replace any inline SVG icons with Lucide equivalents (`CheckCircle`, `Clock`, `Hash`, `User`, etc.).

- [x] **Step 3: Rewrite proof-block-preview.tsx**

Replace CSS Module with Tailwind. Key classes: `rounded-2xl bg-surface border border-border overflow-hidden`. Keep all existing logic.

- [x] **Step 4: Rewrite share-buttons.tsx**

Replace CSS Module with Tailwind. Buttons use `Button` component from `@/components/ui`. LinkedIn/copy share buttons stay functionally identical. Replace any inline SVGs with Lucide (`Linkedin`, `Link2`, `Share2`).

- [x] **Step 5: Delete old CSS modules**

```bash
rm src/components/proof/proof-card.module.css
rm src/components/proof/proof-block-preview.module.css
```

(`share-buttons` had no module — nothing to delete.)

- [x] **Step 6: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [x] **Step 7: Commit**

```bash
git add src/components/proof/
git commit -m "feat: rewrite proof components with DeFi glass cards"
```

---

## Task 13 — Rewrite RecentActivity + ActivitySnackbar

**Files:**

- Modify: `frontend/src/components/activity/recent-activity.tsx`
- Modify: `frontend/src/components/activity/activity-snackbar.tsx`
- Delete: `recent-activity.module.css`, `activity-snackbar.module.css`

- [x] **Step 1: Read current files**

```bash
cat src/components/activity/recent-activity.tsx
cat src/components/activity/activity-snackbar.tsx
```

- [x] **Step 2: Rewrite recent-activity.tsx**

Replace all `styles.*` with Tailwind. Key patterns:

- Activity row: `flex items-center gap-3 py-3 border-b border-border-glass last:border-0`
- Event type label: `font-pixel text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded`
- Hash: `font-mono text-[13px] text-text-muted`
- Verified dot: use `<motion.span>` with `glowPulse` from `@/lib/motion` for the status dot

- [x] **Step 3: Rewrite activity-snackbar.tsx**

Replace CSS Module with Tailwind. The snackbar is a fixed sidebar panel on desktop:
`fixed right-4 top-24 z-20 w-72 rounded-2xl bg-surface-glass border border-border-glass backdrop-blur-md p-4 hidden xl:block`

- [x] **Step 4: Delete old CSS modules**

```bash
rm src/components/activity/recent-activity.module.css
rm src/components/activity/activity-snackbar.module.css
```

- [x] **Step 5: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [x] **Step 6: Commit**

```bash
git add src/components/activity/
git commit -m "feat: rewrite activity components with Tailwind + glass snackbar"
```

---

## Task 14 — Rewrite NextActionCard + Actions

**Files:**

- Modify: `frontend/src/components/actions/next-action-card.tsx`
- Modify: `frontend/src/components/actions/actions.module.css` (replace + delete)
- Delete: `next-action-card.module.css`, `actions.module.css`

- [x] **Step 1: Read current files**

```bash
cat src/components/actions/next-action-card.tsx
cat src/components/actions/verify-form.tsx
```

- [x] **Step 2: Rewrite next-action-card.tsx**

Replace CSS Module. DeFi card with gradient top-bar:

```tsx
<motion.article
  className="rounded-2xl bg-surface-glass border border-border-glass p-6 relative overflow-hidden"
  whileHover={{
    borderColor: "rgba(139,92,246,0.35)",
    transition: { duration: 0.2 },
  }}
>
  {/* gradient top accent bar */}
  <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-primary to-accent" />
  ...
</motion.article>
```

Replace inline SVG icons with Lucide equivalents. Keep all action logic.

- [x] **Step 3: Update any remaining component in `actions/` that imports CSS modules**

```bash
grep -r "module.css" src/components/actions/ --include="*.tsx"
```

For each match, replace with Tailwind utilities.

- [x] **Step 4: Delete old CSS modules**

```bash
rm src/components/actions/next-action-card.module.css
rm src/components/actions/actions.module.css
```

- [x] **Step 5: Verify build**

```bash
npm run build 2>&1 | tail -10
```

- [x] **Step 6: Commit**

```bash
git add src/components/actions/
git commit -m "feat: rewrite action components with DeFi cards"
```

---

## Task 15 — Rewrite Wallet + Network Components

**Files:**

- Modify: `frontend/src/components/wallet/wallet-connect-button.tsx`
- Modify: `frontend/src/components/app/wallet-empty-state.tsx`
- Modify: `frontend/src/components/app/network-banner.tsx`
- Delete: `wallet-connect-button.module.css`, `wallet-empty-state.module.css`, `network-banner.module.css`

- [x] **Step 1: Read current files**

```bash
cat src/components/wallet/wallet-connect-button.tsx
cat src/components/app/wallet-empty-state.tsx
cat src/components/app/network-banner.tsx
```

- [x] **Step 2: Rewrite wallet-connect-button.tsx**

Replace CSS Module. Use `Button` component with `variant="outline"` or `variant="primary"` based on connected state. Connected state shows truncated address in `font-mono text-[13px]`.

- [x] **Step 3: Rewrite wallet-empty-state.tsx**

Replace CSS Module with Tailwind. Empty state pattern:

```tsx
<div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
    <Wallet className="w-8 h-8 text-primary" />
  </div>
  <h3 className="font-heading text-lg font-semibold text-text">...</h3>
  <p className="text-text-muted text-sm max-w-xs">...</p>
  <Button variant="primary">Connect Freighter</Button>
</div>
```

- [x] **Step 4: Rewrite network-banner.tsx**

Replace CSS Module. Warning banner pattern:

```tsx
<div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-warning/10 border border-warning/25 text-warning text-sm">
  <AlertTriangle className="w-4 h-4 shrink-0" />
  ...
</div>
```

- [x] **Step 5: Delete old CSS modules**

```bash
rm src/components/wallet/wallet-connect-button.module.css
rm src/components/app/wallet-empty-state.module.css
rm src/components/app/network-banner.module.css
```

- [x] **Step 6: Verify build**

```bash
npm run build 2>&1 | tail -10
```

- [x] **Step 7: Commit**

```bash
git add src/components/wallet/ src/components/app/
git commit -m "feat: rewrite wallet + network components with Tailwind"
```

---

## Task 16 — Rewrite MilestoneRail, FreighterWelcome, DemoAutofillButton

**Files:**

- Modify: `frontend/src/components/milestones/milestone-rail.tsx`
- Modify: `frontend/src/components/onboarding/freighter-welcome.tsx`
- Modify: `frontend/src/components/demo/demo-autofill-button.tsx`
- Delete: `milestone-rail.module.css`, `freighter-welcome.module.css`, `demo-autofill-button.module.css`

- [x] **Step 1: Read current files**

```bash
cat src/components/milestones/milestone-rail.tsx
cat src/components/onboarding/freighter-welcome.tsx
cat src/components/demo/demo-autofill-button.tsx
```

- [x] **Step 2: Rewrite milestone-rail.tsx**

Replace CSS Module with Tailwind. Milestone steps use a vertical timeline pattern:

- Connector line: `absolute left-4.25 top-9 bottom-0 w-px bg-border`
- Step icon: `w-9 h-9 rounded-xl flex items-center justify-center relative z-10`
- Completed: `bg-primary/15 border border-primary/30 text-primary`
- Pending: `bg-surface-2 border border-border text-text-muted`

- [x] **Step 3: Rewrite freighter-welcome.tsx**

Replace CSS Module. Onboarding card with DeFi glass treatment. Keep existing step-by-step onboarding logic. Replace any inline SVGs with Lucide icons (`Download`, `Chrome`, `Key`, `CheckCircle`).

- [x] **Step 4: Rewrite demo-autofill-button.tsx**

Replace CSS Module. Small utility button — use `Button` with `variant="ghost"` and `size="sm"`.

- [x] **Step 5: Delete old CSS modules**

```bash
rm src/components/milestones/milestone-rail.module.css
rm src/components/onboarding/freighter-welcome.module.css
rm src/components/demo/demo-autofill-button.module.css
```

- [x] **Step 6: Verify build**

```bash
npm run build 2>&1 | tail -10
```

- [x] **Step 7: Commit**

```bash
git add src/components/milestones/ src/components/onboarding/ src/components/demo/
git commit -m "feat: rewrite milestone + onboarding + demo components"
```

---

## Task 17 — Rewrite LocalizedHero + LocalizedAboutCopy

**Files:**

- Modify: `frontend/src/components/landing/localized-hero.tsx`
- Modify: `frontend/src/components/about/localized-about-copy.tsx`

(Neither has its own module CSS currently — they use classes injected from parent pages. This task migrates any remaining inline style references and confirms they accept Tailwind className props cleanly.)

- [x] **Step 1: Read current files**

```bash
cat src/components/landing/localized-hero.tsx
cat src/components/about/localized-about-copy.tsx
```

- [x] **Step 2: Confirm className passthrough works**

Both components render a single element and accept a `className` prop. Verify they use `cn()` or direct className passthrough so parent pages can apply Tailwind classes:

```tsx
// Pattern to verify / add if missing:
import { cn } from "@/lib/utils";
// ...
<p className={cn("text-text-muted text-[17px] leading-relaxed", className)}>
```

- [x] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -10
```

- [x] **Step 4: Commit**

```bash
git add src/components/landing/ src/components/about/
git commit -m "feat: confirm localized components use cn() for Tailwind passthrough"
```

---

## Task 18 — Rewrite Home Page

**Files:**

- Modify: `frontend/src/app/page.tsx`
- Delete: `frontend/src/app/page.module.css`

- [x] **Step 1: Read current page.tsx**

```bash
cat src/app/page.tsx
```

- [x] **Step 2: Add hero orb component at top of page.tsx**

```tsx
// Floating blur orbs for DeFi hero atmosphere
function HeroOrbs() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/12 blur-3xl"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -top-16 right-0 w-80 h-80 rounded-full bg-accent/10 blur-3xl"
        animate={{ y: [0, 12, 0] }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      <motion.div
        className="absolute top-32 left-1/2 w-64 h-64 rounded-full bg-verified/8 blur-3xl"
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
    </div>
  );
}
```

- [x] **Step 3: Rewrite page.tsx layout with Tailwind**

Replace all `styles.*` references. Key layout patterns:

```tsx
// Page wrapper
<div className="text-text font-sans min-h-dvh">

// Hero section
<section className="relative overflow-hidden px-6 pt-24 pb-16 max-w-260 mx-auto text-center">
  <HeroOrbs />
  {/* content */}
</section>

// Section
<section className="max-w-260 mx-auto px-6 my-16">
  <div className="text-center mb-8">
    <h2 className="font-heading text-3xl font-semibold tracking-tight mb-2">...</h2>
  </div>
</section>

// Steps grid
<div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
  {/* step card */}
  <motion.div
    className="rounded-2xl bg-surface-glass border border-border-glass p-6"
    variants={fadeUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
  >
```

Wrap page sections in `<motion.div variants={staggerContainer} initial="hidden" animate="visible">` for stagger entrance. Import `staggerContainer`, `fadeUp` from `@/lib/motion`.

- [x] **Step 4: Delete old CSS module**

```bash
rm src/app/page.module.css
```

- [x] **Step 5: Verify build**

```bash
npm run build 2>&1 | tail -10
```

- [x] **Step 6: Commit**

```bash
git add src/app/page.tsx
git rm src/app/page.module.css
git commit -m "feat: rewrite home page with DeFi hero orbs + stagger entrance"
```

---

## Task 19 — Rewrite About Page

**Files:**

- Modify: `frontend/src/app/about/page.tsx`
- Delete: `frontend/src/app/about/page.module.css`

- [x] **Step 1: Rewrite about/page.tsx with Tailwind**

Replace all `styles.*` references. Key patterns:

```tsx
// Hero — centered, Orbitron gradient heading
<section className="max-w-260 mx-auto px-7 pt-18 pb-12 text-center">
  <span className="inline-block font-pixel text-xs tracking-widest uppercase text-primary border border-primary/30 bg-primary/8 px-3 py-1 rounded-full mb-4">
    About
  </span>
  <h1 className="font-heading text-5xl font-bold tracking-tight leading-tight mb-4">
    Why <em className="not-italic bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">Stellaroid Earn</em>
  </h1>
  <LocalizedAboutCopy id="lede" className="text-text-muted text-[17px] leading-relaxed max-w-155 mx-auto" />
</section>

// Stats bar
<div className="max-w-260 mx-auto px-7">
  <dl className="grid grid-cols-2 sm:grid-cols-4 rounded-xl bg-surface-glass border border-border-glass overflow-hidden mb-12">
    {/* stat cells with border-r border-border-glass last:border-r-0 */}
  </dl>
</div>

// Two-up story cards
<div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
  <motion.article variants={fadeUp} ... className="rounded-2xl bg-surface-glass border border-border-glass p-6 flex flex-col">

// Section with heading
<section className="my-14">
  <div className="text-center mb-7">
    <h2 className="font-heading text-3xl font-semibold tracking-tight mb-2">...</h2>
  </div>
</section>
```

Wrap each major section in `<motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>`.

- [x] **Step 2: Delete old CSS module**

```bash
rm src/app/about/page.module.css
```

- [x] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -10
```

- [x] **Step 4: Commit**

```bash
git add src/app/about/
git commit -m "feat: rewrite about page with Tailwind + DeFi centered hero"
```

---

## Task 20 — Rewrite App Page + Loading Skeleton

**Files:**

- Modify: `frontend/src/app/app/page.tsx`
- Delete: `frontend/src/app/app/page.module.css`
- Modify: `frontend/src/app/proof/[hash]/loading.tsx`
- Delete: `frontend/src/app/proof/[hash]/loading.module.css`

- [x] **Step 1: Read current files**

```bash
cat src/app/app/page.tsx
cat src/app/proof/\[hash\]/loading.tsx
```

- [x] **Step 2: Rewrite app/page.tsx**

Replace all `styles.*` with Tailwind. The app page is primarily a layout for the wallet + actions components. Key wrapper:

```tsx
<div className="max-w-260 mx-auto px-6 py-10">
  <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
    {/* sidebar */}
    <aside className="flex flex-col gap-4">...</aside>
    {/* main panel */}
    <main id="main" className="flex flex-col gap-6">
      ...
    </main>
  </div>
</div>
```

- [x] **Step 3: Rewrite proof/[hash]/loading.tsx**

```tsx
// frontend/src/app/proof/[hash]/loading.tsx
import { Skeleton } from "@/components/ui";

export default function ProofLoading() {
  return (
    <div className="max-w-190 mx-auto px-6 py-16 flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="rounded-2xl border border-border-glass p-6 flex flex-col gap-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-10 w-40 mt-2" />
      </div>
    </div>
  );
}
```

- [x] **Step 4: Delete old CSS modules**

```bash
rm src/app/app/page.module.css
rm src/app/proof/\[hash\]/loading.module.css
```

- [x] **Step 5: Verify build**

```bash
npm run build 2>&1 | tail -10
```

- [x] **Step 6: Commit**

```bash
git add src/app/app/ src/app/proof/
git commit -m "feat: rewrite app page + loading skeleton with Tailwind"
```

---

## Task 21 — Final Cleanup + Verification

**Files:**

- Verify: all `*.module.css` files gone
- Modify: `frontend/src/app/proof/page.tsx` (check for any remaining module imports)
- Modify: `frontend/src/app/proof/[hash]/page.tsx` (check for any remaining module imports)

- [x] **Step 1: Confirm zero CSS module files remain**

```bash
find src -name "*.module.css" | sort
```

Expected: empty output (no files).

- [x] **Step 2: Check for any remaining CSS module imports**

```bash
grep -r "\.module\.css" src/ --include="*.tsx" --include="*.ts"
```

Expected: no matches. If any found, replace with Tailwind utilities.

- [x] **Step 3: Check proof pages for module imports**

```bash
cat src/app/proof/page.tsx | grep -E "import|styles\."
cat src/app/proof/\[hash\]/page.tsx | grep -E "import|styles\."
```

Replace any remaining `styles.*` with Tailwind classes.

- [x] **Step 4: Run lint**

```bash
npm run lint 2>&1 | tail -20
```

Fix any warnings/errors reported.

- [x] **Step 5: Full production build**

```bash
npm run build
```

Expected: ✓ build completes with no errors.

- [x] **Step 6: Check bundle size**

```bash
npm run build 2>&1 | grep -E "First Load|Page"
```

Note the First Load JS sizes — Framer Motion adds ~40KB gzipped, acceptable for a DeFi dApp.

- [x] **Step 7: Commit cleanup**

```bash
git add -A
git commit -m "feat: final cleanup — zero CSS modules, full Tailwind v4 + DeFi"
```

---

## Task 22 — Push and Wrap Up

- [x] **Step 1: Push dev branch**

```bash
git push origin dev
```

- [x] **Step 2: Verify Vercel preview build passes** (if configured)

Check the Vercel dashboard for the dev branch preview URL. Confirm fonts, glass effects, and glow CTAs render correctly.

- [x] **Step 3: Mark migration complete**

All 28 CSS module files deleted. shadcn/ui primitives installed and themed. Framer Motion entrance animations on all pages. Lucide icons throughout. Orbitron + Exo 2 fonts active.

---

## Quick Reference: DeFi Class Patterns

| Pattern          | Tailwind Classes                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Glass card       | `rounded-2xl bg-surface-glass border border-border-glass backdrop-blur-md`                                               |
| Gradient heading | `font-heading bg-linear-to-r from-primary to-accent bg-clip-text text-transparent`                                       |
| Pill button      | `rounded-full bg-linear-to-r from-primary to-primary-hover text-on-primary`                                              |
| Glow on hover    | `hover:shadow-glow-md transition-shadow`                                                                                 |
| Mono data        | `font-mono text-primary [text-shadow:0_0_8px_rgba(245,158,11,0.35)]`                                                     |
| Eyebrow label    | `font-pixel text-xs tracking-widest uppercase text-primary border border-primary/30 bg-primary/8 px-3 py-1 rounded-full` |
| Section wrapper  | `max-w-260 mx-auto px-6 my-16`                                                                                           |
| Amber hairline   | `bg-linear-to-r from-transparent via-primary/60 to-transparent h-px`                                                     |
| Noise texture    | Add `.noise` utility to `globals.css` and apply to hero `::before`:                                                      |

```css
/* Add to globals.css @layer utilities: */
.noise::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
}
/* Usage: add `noise relative` to hero section wrapper */
```
