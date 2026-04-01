# Ars Mosoris — Full Project Audit: Performance & UX Fixes

**Date:** 2026-03-31  
**Stack:** Shopify Hydrogen 2026.1.0, React 18.3.1, React Router 7.13.0, Tailwind CSS v4, Oxygen (Cloudflare Workers)

---

## Scope

Comprehensive audit of the Ars Mosoris storefront covering:
- Critical runtime errors (React hydration)
- Broken functionality (navigation, links)
- Responsive layout issues (mobile 375px, tablet 768px, desktop 1280–1440px)
- UX polish (language consistency, active states, loading states)
- Performance (prefetching, Suspense fallbacks)

---

## Issues & Fixes (Priority Order)

### 1. React Hydration Errors — 16–18 per page (CRITICAL)

**Symptom:** React errors #418 (hydration mismatch) and #423 (entire root falls back to CSR) fire on every page load. SSR output is discarded; the entire app re-renders client-side. This breaks Core Web Vitals and harms SEO.

**Root causes identified:**

- `new Date().getFullYear()` in `Footer.tsx:129` — dynamic value at render time; server and client could diverge if a build is cached across a year boundary or timezone edge case.
- `<Suspense>` without `fallback` in `Footer.tsx:41` — renders `undefined` server-side while the client renders something, causing a tree mismatch.
- Deferred `cart` data in `PageLayout.tsx:77` — server renders `<p>Loading cart ...</p>` but client may have already resolved the cart promise, creating a mismatch in the Suspense boundary.

**Fixes:**
- Add `suppressHydrationWarning` to the `<p>` tag containing `new Date().getFullYear()` in `Footer.tsx`. This is the minimal safe fix — it silences the hydration warning for that specific element without removing the dynamic year.
- Add `fallback={null}` to `Footer`'s `<Suspense>`.
- Add `fallback={<p>Kosár betöltése...</p>}` to `CartAside`'s `<Suspense>` in `PageLayout.tsx`.

---

### 2. Cart Stays Open on Browser Back Navigation (CRITICAL)

**Symptom:** `AsideContext` in `Aside.tsx` is pure React state (`useState`). Browser back/forward navigations via React Router do not trigger any close logic, leaving the cart overlay active on the new page.

**Fix:** In `Aside.Provider`, add a `useEffect` that watches `useLocation()` from React Router. On any pathname change, call `close()`.

```
// pseudocode
const location = useLocation()
useEffect(() => { close() }, [location.pathname])
```

---

### 3. Header Logo Wraps on Mobile & Tablet (HIGH)

**Symptom:** At 375px (iPhone) and 768px (iPad), "ARS MOSORIS" wraps to two lines ("ARS\nMOSORIS"), causing the sticky header to double in height and push content down.

**Fix:** Add `white-space: nowrap` to `.header-logo` in `app.css`. Also reduce font-size slightly at small breakpoints if needed (e.g. `font-size: 1rem` below 480px).

---

### 4. Nav Overflow / "KAPCSOLAT" Clipped at 768px (HIGH)

**Symptom:** At exactly the 768px breakpoint, the desktop nav appears but the rightmost item "KAPCSOLAT" overflows and is clipped by the viewport edge. The header has 3rem padding and the nav items have 2.5rem gap — at 768px this leaves no room.

**Fix:** Change the desktop nav breakpoint in `app.css` from `min-width: 768px` to `min-width: 1024px`. This is the standard laptop breakpoint and gives the header enough room. Below 1024px, hide the desktop nav and show the mobile hamburger toggle instead.

---

### 5. Footer Links Show Wrong Color (HIGH)

**Symptom:** On mobile, footer `NavLink` elements appear teal/cyan (browser-default visited/active color) instead of the intended `rgba(255, 255, 255, 0.8)`. The custom CSS never overrides `:visited` state, and React Router's `.active` class is not styled in the footer context.

**Fix:** In `app.css`, add explicit `:visited` and `.active` color overrides for `.footer-links a`:
```css
.footer-links a:visited,
.footer-links a.active {
  color: rgba(255, 255, 255, 0.8);
}
```

---

### 6. Footer Shop Links → 404 (HIGH)

**Symptom:** `Footer.tsx:96` generates `/collections/polo` and `/collections/taska`. These Shopify collections don't exist. The catalog page correctly uses `?type=polo` and `?type=taska` as query params on `/collections/all`.

**Fix:** Change footer Shop nav links to use the correct URLs:
- `/collections/all?type=polo`
- `/collections/all?type=taska`

---

### 7. Active Nav Link Never Highlights (MEDIUM)

**Symptom:** `app.css` has `.header-menu-item[data-active="true"]` but React Router's `NavLink` applies a CSS class `active`, not a `data-active` attribute. The active page is never visually distinguished in the header navigation.

**Fix:** Change the CSS selector from `[data-active="true"]` to `.active`:
```css
.header-menu-item:hover,
.header-menu-item.active {
  color: var(--color-primary);
}
```

---

### 8. English Strings in a Hungarian Store (MEDIUM)

Five places have English UI text:

| File | Line | Current | Fix |
|------|------|---------|-----|
| `PageLayout.tsx` | 76 | `heading="CART"` | `heading="KOSÁR"` |
| `PageLayout.tsx` | 77 | `Loading cart ...` | `Kosár betöltése...` |
| `PageLayout.tsx` | 91 | `heading="SEARCH"` | `heading="KERESÉS"` |
| `PageLayout.tsx` | 180 | `heading="MENU"` | `heading="MENÜ"` |
| `PageLayout.tsx` | 106 | `<button>Search</button>` | `<button>Keresés</button>` |

---

### 9. Artist with No Image Shows Empty Gray Card (MEDIUM)

**Symptom:** Gábor (`lib/artists.ts:39`) has no `image` field. On the artists page and home page artists grid, this renders as a completely empty gray card — no fallback, no placeholder.

**Fix:** Add a CSS fallback background to `.artist-page-card-image` and `.artist-card-image` when empty (e.g. gradient using brand colors), or add a placeholder SVG. This is a pure CSS fix — no data changes needed.

---

### 10. No Prefetch on Product Cards (LOW)

**Symptom:** Product cards throughout the site use plain `<Link>` without `prefetch`. React Router supports `prefetch="intent"` (preload on hover) which makes product page navigation feel instant.

**Fix:** Add `prefetch="intent"` to `<Link>` in:
- `ProductItem.tsx` (used in catalog and related products)
- `_index.tsx` `ProductCard` component (homepage featured products)

---

## Files Changed

| File | Changes |
|------|---------|
| `app/components/Aside.tsx` | Add `useLocation` effect to close on navigation |
| `app/components/Footer.tsx` | Fix `<Suspense fallback>`, fix `new Date()`, fix collection URLs |
| `app/components/PageLayout.tsx` | Fix `<Suspense fallback>` for cart, translate 5 English strings |
| `app/components/ProductItem.tsx` | Add `prefetch="intent"` |
| `app/routes/_index.tsx` | Add `prefetch="intent"` to `ProductCard` |
| `app/styles/app.css` | Fix `.header-logo` wrap, nav breakpoint, active link selector, footer link visited/active colors, artist card empty state |

---

---

## SEO Fixes (added after full audit)

### S1. Wrong `lang` attribute on `<html>` (CRITICAL)
`root.tsx:162` has `lang="en"`. Entire site is Hungarian. Fix: `lang="hu"`.

### S2. "Hydrogen" boilerplate in page titles (CRITICAL)
Three routes display "Hydrogen | ..." in Google SERPs:
- `routes/blogs.$blogHandle._index.tsx:12` → `"${data?.blog.title} | Ars Mosoris"`
- `routes/pages.$handle.tsx:8` → use Shopify's `seo.title` field (already fetched, never applied)
- `routes/search.tsx:16` → `"Keresés | Ars Mosoris"`

### S3. Shopify page SEO fields fetched but unused (HIGH)
`routes/pages.$handle.tsx` fetches `seo { title description }` from Shopify GraphQL but the `meta()` function ignores them. Fix: use `data.page.seo.title` and `data.page.seo.description` in the meta return.

### S4. Broken canonical tag (HIGH)
`routes/products.$handle.tsx:27–29` returns `rel: 'canonical'` inside `meta()`. In React Router v7, canonical tags must go in `links()`, not `meta()`. This means no canonical tag is actually rendered on any product page. Fix: move to a `links()` export.

### S5. Open Graph meta tags — zero site-wide (HIGH)
No page has `og:title`, `og:description`, `og:image`, or `og:url`. Links shared on social media show no preview card. Fix:
- Product pages: add og tags using `product.title`, `product.description`, `selectedVariant.image.url`
- Other pages: add og tags using existing title/description meta values and a default OG image placeholder URL

### S6. Zero JSON-LD structured data (HIGH)
No schema.org markup anywhere. Fix:
- Add `Product` JSON-LD to `products.$handle.tsx` (name, description, image, price, availability, brand, sku)
- Add `Organization` JSON-LD to `root.tsx` or `about.tsx` (name, url, logo, sameAs for social links)
- Add `BreadcrumbList` JSON-LD to `products.$handle.tsx` (already has visual breadcrumb)

### S7. Custom routes missing from sitemap (HIGH)
`/about`, `/contact`, `/events`, `/artists`, `/artists/:handle` are not in any sitemap. Hydrogen's `getSitemap` only covers Shopify resources. Fix: add a static entries section to the sitemap route, or add a separate `/sitemap-custom.xml`.

### S8. Wrong sitemap locales (HIGH)
`sitemap.$type.$page[.xml].tsx:13` has `locales: ['EN-US', 'EN-CA', 'FR-CA']` — boilerplate placeholders. This generates dead URLs like `/EN-US/products/...` in the sitemap. Fix: remove locales array entirely or set to `['HU']`.

### S9. Missing `description` meta on key routes (MEDIUM)
Routes missing description: `collections.all`, `collections._index`, `blogs._index`, `cart`, all `policies.*`, `search`. Fix: add meaningful Hungarian descriptions to each.

### S10. `alt="Product Image"` fallback (MEDIUM)
`ProductImage.tsx:15` falls back to the generic string `'Product Image'`. Fix: accept a `productTitle` prop and use it as the fallback alt text.

### S11. Heading hierarchy violations (MEDIUM)
- `collections._index.tsx:90` — `<h5>` directly under `<h1>`, skipping h2–h4. Fix: change to `<h2>`.
- `blogs.$blogHandle._index.tsx` — article titles rendered as `<h3>` with no preceding `<h1>`. Fix: add `<h1>{blog.title}</h1>` above the article grid.
- `blogs._index.tsx:61` — `<h1>Blogs</h1>` is English. Fix: `<h1>Blog</h1>` (same in Hungarian) or `<h1>Bejegyzések</h1>`.

### S12. `lang="hu"` missing on html tag (already covered in S1)

---

## SEO Out of Scope (requires design assets or larger work)
- Default OG image asset — requires a 1200×630 brand image file. Open Graph added for product pages (use product image) and existing-image pages. A placeholder is used for pages without images.
- Review/rating schema — no review system exists
- `rel="prev"`/`rel="next"` — deprecated by Google; not needed

---

## Out of Scope

- Adding a real artist image for Gábor (requires asset from the team)
- i18n infrastructure (all strings are already Hungarian; this is targeted text fixes)
- Changing cart URL hash behavior
- Any new features
