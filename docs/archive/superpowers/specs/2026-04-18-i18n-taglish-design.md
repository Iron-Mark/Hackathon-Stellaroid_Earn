# i18n: Taglish (Filipino English) site-wide — Design Spec

**Date:** 2026-04-18
**Status:** Approved
**Scope:** Frontend only (`frontend/src/`)

---

## Problem

The locale toggle fires a `stellaroid:locale-change` DOM event, but only `<LocalizedHero>` subscribes to it. Switching to Tagalog changes the homepage hero copy and nothing else. The rest of the site — footer, `/about`, `/app` action card — stays English regardless.

---

## Goal

When the user switches to Tagalog, every human-readable content section on the site switches to smart Filipino English (Taglish): English sentence rhythm, Tagalog connectors and punch words (`walang`, `agad`, `pero`, `lang`, `na`). Technical terms, nav links, form labels, error messages, and hash values stay English.

---

## Approach

**Lightweight hook + dictionary.** Extract the locale subscription logic from `LocalizedHero` into a shared `useLocale()` hook. Create a typed i18n dictionary. Each component that needs translation calls `useLocale()` and reads from the dictionary. No new context provider, no URL routing, no build-time i18n framework.

Server components (`/about/page.tsx`) stay server components. Translated text sections become small client islands that import `useLocale()`.

---

## Architecture

### `src/hooks/use-locale.ts` (new)

Extracts the pattern repeated in `LocalizedHero`:
- Reads initial locale from `localStorage` on mount
- Listens to `LOCALE_CHANGE_EVENT` window events
- Returns `locale: Locale`

```ts
export function useLocale(): Locale
```

All components that need translation import this hook. The `LocaleToggle` component continues to own the write path (localStorage + event dispatch) — no change there.

### `src/lib/i18n.ts` (new)

Typed flat-namespace dictionary. Structure:

```ts
type I18nDict = Record<Locale, {
  hero:    { eyebrow; h1a; h1b; lede; ctaPrimary; ctaGhost; scopeLabel };
  footer:  { tagline };
  about:   { lede; problemKicker; approachKicker };
  app:     {
    connectTitle; connectSubtitle;
    issuerLabel; issuerDesc;
    employerLabel; employerDesc;
    issuerRegisterTitle; issuerRegisterSubtitle;
    issuerDoneTitle; issuerDoneSubtitle;
    verifyTitle; verifySubtitle;
    payTitle; paySubtitle;
    doneTitle; doneSubtitle;
  };
}>
```

### Client islands (new/modified)

| Component | What it translates |
|---|---|
| `localized-hero.tsx` | Already translates hero. Switch to `useLocale()` hook; remove its own localStorage/event setup. Update scope label to "View this page in …" |
| `src/components/layout/footer-tagline.tsx` (new) | Single `<p>` with the brand description |
| `src/components/about/localized-about-copy.tsx` (new) | About hero lede, problem kicker, approach kicker |
| `src/components/actions/next-action-card.tsx` | Role labels + all `getContent()` strings |

### Server pages (modified, minimally)

| Page | Change |
|---|---|
| `site-footer.tsx` | Mount `<FooterTagline />` in place of hardcoded `<p>` |
| `about/page.tsx` | Mount `<LocalizedAboutCopy />` in place of the three translated strings |

---

## Copy dictionary

### `tl` (Taglish) — full values

**hero**
```
eyebrow:    "Stellar Testnet / Soroban / Freighter"   // same
h1a:        "I-verify ang credentials."
h1b:        "I-settle ang bayad sa iisang flow."
lede:       "I-anchor ang certificate hash sa Stellar. Employer verifies in seconds. Bayad agad — walang email thread, walang invoice delay, walang platform fee."
ctaPrimary: "Subukan ang demo ->"
ctaGhost:   "Tingnan ang sample Proof Block — walang wallet kailangan"
scopeLabel: "View this page in"
```

**footer**
```
tagline: "On-chain credential registry sa Stellar testnet. Ginawa para sa Stellar PH Bootcamp bootcamp."
```

**about**
```
lede:            "One idea lang: certificates should be verifiable in seconds — hindi sa pamamagitan ng email. Tapos mabayaran agad."
problemKicker:   "Real ang certificate niya. Pero proving it? Mas mahal pa kaysa mag-hire ng iba."
approachKicker:  "Hindi lang na-verify ang credential — na-pay na rin si Maria. Sa iisang session. Yun ang punto."
```

**app**
```
connectTitle:           "I-connect ang wallet mo para magsimula"
connectSubtitle:        "Mag-sign ng transactions gamit ang Freighter."
issuerLabel:            "Issuer"
issuerDesc:             "Mag-register ng certs"
employerLabel:          "Employer"
employerDesc:           "I-verify at bayaran"
issuerRegisterTitle:    "Mag-register ng certificate"
issuerRegisterSubtitle: "I-upload ang PDF o i-paste ang 64-char hex hash. Ikaw ang mag-sign bilang issuer."
issuerDoneTitle:        "Certificate registered na"
issuerDoneSubtitle:     "Lumipat sa Employer role para i-verify at bayaran."
verifyTitle:            "I-verify ang certificate"
verifySubtitle:         "Hanapin muna, tapos i-mark na verified on-chain."
payTitle:               "Bayaran ang verified student"
paySubtitle:            "I-send ang payment amount na naka-link sa certificate na ito."
doneTitle:              "Tapos na"
doneSubtitle:           "Handa na ang proof block para i-share."
```

---

## What stays English

- Navigation link labels (`Home`, `Demo`, `About`)
- Form field labels and placeholders
- Error messages and toasts
- Hash values, contract IDs, function signatures
- SEO metadata and OG tags
- Footer column headers (`Site`, `On-chain`, `Source`)
- Footer link text (`Contract on stellar.expert ↗`, etc.)
- `RecentActivity` event labels
- Badge and pill text

---

## Scope label

The toggle currently renders inside `LocalizedHero` with copy `"View this hero in Tagalog"`. Once translations cover the full site, this becomes:

```
"View this page in {nextLocaleLabel}"
```

The toggle itself (`LocaleToggle`) is unchanged.

---

## Not in scope

- More than two locales
- URL-based routing (`/tl/...`)
- Server-side locale detection
- SEO hreflang tags
- Any translation of `/proof/[hash]` page content (data-driven, not copy)

---

## Files changed

| File | Action |
|---|---|
| `src/hooks/use-locale.ts` | Create |
| `src/lib/i18n.ts` | Create |
| `src/components/landing/localized-hero.tsx` | Modify — use hook, import i18n, update scope label |
| `src/components/layout/footer-tagline.tsx` | Create |
| `src/components/layout/site-footer.tsx` | Modify — mount `<FooterTagline />` |
| `src/components/about/localized-about-copy.tsx` | Create |
| `src/app/about/page.tsx` | Modify — mount `<LocalizedAboutCopy />` |
| `src/components/actions/next-action-card.tsx` | Modify — `useLocale()` + i18n strings |
