# Ars Mosoris Full Audit Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 21 identified issues (10 UX/performance + 11 SEO) across the Ars Mosoris Hydrogen storefront.

**Architecture:** Targeted edits across existing files — no new components, no structural changes. Each task is self-contained and independently verifiable via TypeScript type-check and browser inspection.

**Tech Stack:** Shopify Hydrogen 2026.1.0, React 18.3.1, React Router 7.13.0, Tailwind CSS v4, TypeScript 5.9

---

## File Map

| File | Tasks |
|------|-------|
| `app/components/Aside.tsx` | Task 2 |
| `app/components/Footer.tsx` | Task 1, Task 5 |
| `app/components/PageLayout.tsx` | Task 1, Task 4 |
| `app/components/ProductImage.tsx` | Task 12 |
| `app/routes/_index.tsx` | Task 4, Task 9 |
| `app/routes/products.$handle.tsx` | Task 8, Task 9, Task 10 |
| `app/routes/pages.$handle.tsx` | Task 6, Task 7 |
| `app/routes/search.tsx` | Task 6, Task 7 |
| `app/routes/blogs.$blogHandle._index.tsx` | Task 6, Task 7, Task 12 |
| `app/routes/blogs._index.tsx` | Task 7 |
| `app/routes/collections._index.tsx` | Task 7, Task 12 |
| `app/routes/collections.all.tsx` | Task 7 |
| `app/routes/cart.tsx` | Task 7 |
| `app/routes/policies.privacy-policy.tsx` | Task 7 |
| `app/routes/policies.refund-policy.tsx` | Task 7 |
| `app/routes/policies.shipping-policy.tsx` | Task 7 |
| `app/routes/policies.terms-of-service.tsx` | Task 7 |
| `app/routes/about.tsx` | Task 9 |
| `app/routes/contact.tsx` | Task 9 |
| `app/routes/artists._index.tsx` | Task 9 |
| `app/routes/artists.$handle.tsx` | Task 9 |
| `app/routes/sitemap.$type.$page[.xml].tsx` | Task 11 |
| `app/routes/[sitemap.xml].tsx` | Task 11 |
| `app/styles/app.css` | Task 3 |
| `root.tsx` | Task 6, Task 10 |

---

## Task 1: Fix React Hydration Errors

**Files:**
- Modify: `app/components/Footer.tsx:41,129`
- Modify: `app/components/PageLayout.tsx:77`

**What:** 16–18 React #418/#423 errors on every page. Three causes: `<Suspense>` without fallback in Footer, `new Date()` mismatch, and cart `<Suspense>` fallback mismatch.

- [ ] **Step 1: Fix Footer `<Suspense>` missing fallback**

In `app/components/Footer.tsx`, line 41, change:
```tsx
<Suspense>
```
to:
```tsx
<Suspense fallback={null}>
```

- [ ] **Step 2: Add `suppressHydrationWarning` to the year paragraph in Footer**

In `app/components/Footer.tsx`, line 129, change:
```tsx
<p>&copy; {new Date().getFullYear()} Ars Mosoris. Minden jog fenntartva.</p>
```
to:
```tsx
<p suppressHydrationWarning>&copy; {new Date().getFullYear()} Ars Mosoris. Minden jog fenntartva.</p>
```

- [ ] **Step 3: Fix cart `<Suspense>` fallback in PageLayout**

In `app/components/PageLayout.tsx`, inside `CartAside` (around line 77), change:
```tsx
<Suspense fallback={<p>Loading cart ...</p>}>
```
to:
```tsx
<Suspense fallback={<p>Kosár betöltése...</p>}>
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd e:/GIT/ARS && npm run typecheck
```
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
cd e:/GIT/ARS
git add app/components/Footer.tsx app/components/PageLayout.tsx
git commit -m "fix: resolve React hydration errors (#418/#423) — Suspense fallbacks and suppressHydrationWarning"
```

---

## Task 2: Close Cart/Aside on Browser Navigation

**Files:**
- Modify: `app/components/Aside.tsx:77–91`

**What:** `AsideContext` state persists across React Router navigations. Browser back leaves the cart drawer open on the new page.

- [ ] **Step 1: Add `useLocation` import and navigation-close effect**

Replace the entire `Aside.Provider` function in `app/components/Aside.tsx`:

```tsx
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import {useLocation} from 'react-router';
```

Then replace the `Aside.Provider` function body:
```tsx
Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');
  const location = useLocation();

  useEffect(() => {
    setType('closed');
  }, [location.pathname]);

  return (
    <AsideContext.Provider
      value={{
        type,
        open: setType,
        close: () => setType('closed'),
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd e:/GIT/ARS && npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd e:/GIT/ARS
git add app/components/Aside.tsx
git commit -m "fix: close cart/aside drawer on browser navigation"
```

---

## Task 3: CSS Responsive Layout Fixes

**Files:**
- Modify: `app/styles/app.css`

**What:** Five CSS fixes — header logo wrap on mobile/tablet, nav overflow at 768px, active nav link never highlights, footer visited link color, artist card empty fallback.

- [ ] **Step 1: Fix header logo wrapping**

In `app/styles/app.css`, find `.header-logo` and add `white-space: nowrap`:
```css
.header-logo {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ars-dark);
  white-space: nowrap;
}
```

- [ ] **Step 2: Change desktop nav breakpoint from 768px to 1024px**

Find the two `@media (min-width: 768px)` blocks that control `.header-menu-desktop` and `.header-menu-mobile-toggle`:

Change:
```css
@media (min-width: 768px) {
  .header-menu-desktop {
    display: flex;
  }
}
```
to:
```css
@media (min-width: 1024px) {
  .header-menu-desktop {
    display: flex;
  }
}
```

And change:
```css
@media (min-width: 768px) {
  .header-menu-mobile-toggle {
    display: none;
  }
}
```
to:
```css
@media (min-width: 1024px) {
  .header-menu-mobile-toggle {
    display: none;
  }
}
```

- [ ] **Step 3: Fix active nav link selector**

Find:
```css
.header-menu-item:hover,
.header-menu-item[data-active="true"] {
  color: var(--color-primary);
}
```
Change to:
```css
.header-menu-item:hover,
.header-menu-item.active {
  color: var(--color-primary);
}
```

- [ ] **Step 4: Fix footer link visited/active color**

Find the `.footer-links a` block and add `:visited` and `.active` states:
```css
.footer-links a {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  transition: color 0.2s ease;
}

.footer-links a:visited,
.footer-links a.active {
  color: rgba(255, 255, 255, 0.8);
}

.footer-links a:hover {
  color: var(--color-primary);
}
```

- [ ] **Step 5: Add artist card empty-image fallback background**

Find the `.artist-card` section in `app.css` and add a fallback for `.artist-card-image` when no image is present. Add after the existing `.artist-card-image` rule:
```css
.artist-card-image:empty {
  background: linear-gradient(135deg, var(--color-ars-dark) 0%, var(--color-ars-burgundy) 100%);
  min-height: 280px;
}

.artist-page-card-image:empty {
  background: linear-gradient(135deg, var(--color-ars-dark) 0%, var(--color-ars-burgundy) 100%);
  min-height: 280px;
}
```

- [ ] **Step 6: Commit**

```bash
cd e:/GIT/ARS
git add app/styles/app.css
git commit -m "fix: responsive layout — logo nowrap, nav breakpoint 1024px, active nav link, footer link colors, artist card fallback"
```

---

## Task 4: Hungarian Strings + Homepage Prefetch

**Files:**
- Modify: `app/components/PageLayout.tsx:76,91,106,180`
- Modify: `app/routes/_index.tsx` (ProductCard component)

**What:** Five English strings in a Hungarian UI, and the homepage ProductCard link has no prefetch.

- [ ] **Step 1: Fix English strings in PageLayout**

In `app/components/PageLayout.tsx`, make these four changes:

1. `CartAside` heading — change `heading="CART"` to `heading="KOSÁR"`
2. `SearchAside` heading — change `heading="SEARCH"` to `heading="KERESÉS"`  
3. `SearchAside` button — change `<button onClick={goToSearch}>Search</button>` to `<button onClick={goToSearch}>Keresés</button>`
4. `MobileMenuAside` heading — change `heading="MENU"` to `heading="MENÜ"`

- [ ] **Step 2: Add prefetch to ProductCard in homepage**

In `app/routes/_index.tsx`, find the `ProductCard` component's `<Link>`:
```tsx
<Link to={`/products/${product.handle}`} className="product-card">
```
Change to:
```tsx
<Link to={`/products/${product.handle}`} className="product-card" prefetch="intent">
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd e:/GIT/ARS && npm run typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd e:/GIT/ARS
git add app/components/PageLayout.tsx app/routes/_index.tsx
git commit -m "fix: Hungarian strings in UI (CART→KOSÁR, SEARCH→KERESÉS, MENU→MENÜ) and add prefetch to homepage product cards"
```

---

## Task 5: Fix Footer Broken Links

**Files:**
- Modify: `app/components/Footer.tsx:96`

**What:** Footer Shop nav generates `/collections/polo` and `/collections/taska` (404). Should use `/collections/all?type=polo` and `/collections/all?type=taska`.

- [ ] **Step 1: Fix the footer Shop collection links**

In `app/components/Footer.tsx`, find the Shop column nav:
```tsx
{COLLECTION_TYPES.map((type) => (
  <NavLink key={type.value} to={`/collections/${type.value}`}>{type.label}</NavLink>
))}
```
Change to:
```tsx
{COLLECTION_TYPES.map((type) => (
  <NavLink key={type.value} to={`/collections/all?type=${type.value}`}>{type.label}</NavLink>
))}
```

- [ ] **Step 2: Commit**

```bash
cd e:/GIT/ARS
git add app/components/Footer.tsx
git commit -m "fix: footer shop links pointed to non-existent /collections/:type, now use /collections/all?type= query params"
```

---

## Task 6: SEO Critical — lang Attribute + Boilerplate Titles

**Files:**
- Modify: `app/root.tsx:162`
- Modify: `app/routes/search.tsx:16`
- Modify: `app/routes/pages.$handle.tsx:7–8`
- Modify: `app/routes/blogs.$blogHandle._index.tsx:11–12`

**What:** Site declares `lang="en"` but is Hungarian. Three routes show "Hydrogen | ..." as their title in Google search results.

- [ ] **Step 1: Fix lang attribute**

In `app/root.tsx`, find:
```tsx
<html lang="en">
```
Change to:
```tsx
<html lang="hu">
```

- [ ] **Step 2: Fix search page title**

In `app/routes/search.tsx`, change:
```tsx
export const meta: Route.MetaFunction = () => {
  return [{title: `Hydrogen | Search`}];
};
```
to:
```tsx
export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Keresés | Ars Mosoris'},
    {name: 'description', content: 'Keress termékeket az Ars Mosoris kínálatában.'},
  ];
};
```

- [ ] **Step 3: Fix pages.$handle title — use Shopify SEO fields**

In `app/routes/pages.$handle.tsx`, change:
```tsx
export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `Hydrogen | ${data?.page.title ?? ''}`}];
};
```
to:
```tsx
export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `${data?.page.seo?.title || data?.page.title || 'Oldal'} | Ars Mosoris`},
    ...(data?.page.seo?.description
      ? [{name: 'description', content: data.page.seo.description}]
      : []),
  ];
};
```

Note: verify that the `pages.$handle` GraphQL query fetches `seo { title description }`. If not, add it to the query in that file.

- [ ] **Step 4: Fix blog handle index title**

In `app/routes/blogs.$blogHandle._index.tsx`, change:
```tsx
export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `Hydrogen | ${data?.blog.title ?? ''} blog`}];
};
```
to:
```tsx
export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `${data?.blog.title ?? 'Blog'} | Ars Mosoris`},
    {name: 'description', content: `Olvasd el az Ars Mosoris legújabb bejegyzéseit a ${data?.blog.title ?? 'blog'} kategóriában.`},
  ];
};
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd e:/GIT/ARS && npm run typecheck
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd e:/GIT/ARS
git add app/root.tsx app/routes/search.tsx app/routes/pages.\$handle.tsx app/routes/blogs.\$blogHandle._index.tsx
git commit -m "fix(seo): lang='hu', remove Hydrogen boilerplate titles from search/pages/blog routes"
```

---

## Task 7: Add Missing Meta Descriptions

**Files:**
- Modify: `app/routes/collections.all.tsx`
- Modify: `app/routes/collections._index.tsx`
- Modify: `app/routes/blogs._index.tsx`
- Modify: `app/routes/cart.tsx`
- Modify: `app/routes/policies.privacy-policy.tsx`
- Modify: `app/routes/policies.refund-policy.tsx`
- Modify: `app/routes/policies.shipping-policy.tsx`
- Modify: `app/routes/policies.terms-of-service.tsx`

**What:** These routes have title-only meta or no description. Descriptions are needed for SERP snippets.

- [ ] **Step 1: Add description to collections.all**

In `app/routes/collections.all.tsx`, change:
```tsx
export const meta: Route.MetaFunction = () => {
  return [{title: 'Katalógus | Ars Mosoris'}];
};
```
to:
```tsx
export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Katalógus | Ars Mosoris'},
    {name: 'description', content: 'Fedezd fel az Ars Mosoris teljes termékválasztékát — pólók és táskák hat tehetséges képzőművésztől.'},
  ];
};
```

- [ ] **Step 2: Add description to collections._index**

In `app/routes/collections._index.tsx`, find the `meta` export (title only) and change to:
```tsx
export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Kollekcióink | Ars Mosoris'},
    {name: 'description', content: 'Böngészd az Ars Mosoris kollekcióit — hat képzőművész egyedi alkotásai viselhetővé téve.'},
  ];
};
```

- [ ] **Step 3: Fix blogs._index title and add description**

In `app/routes/blogs._index.tsx`, find the meta export and change to:
```tsx
export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Blog | Ars Mosoris'},
    {name: 'description', content: 'Olvasd el az Ars Mosoris legújabb bejegyzéseit — alkotók, mögöttes tartalmak, események.'},
  ];
};
```

- [ ] **Step 4: Add description to cart**

In `app/routes/cart.tsx`, find the meta export and change to:
```tsx
export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Kosár | Ars Mosoris'},
    {name: 'robots', content: 'noindex'},
  ];
};
```
(Cart pages should not be indexed — adding `noindex` is correct practice.)

- [ ] **Step 5: Add descriptions to policy pages**

In `app/routes/policies.privacy-policy.tsx`:
```tsx
export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Adatvédelmi tájékoztató | Ars Mosoris'},
    {name: 'description', content: 'Az Ars Mosoris adatvédelmi tájékoztatója — hogyan kezeljük személyes adataidat.'},
  ];
};
```

In `app/routes/policies.refund-policy.tsx`:
```tsx
export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Visszaküldési szabályzat | Ars Mosoris'},
    {name: 'description', content: 'Az Ars Mosoris visszaküldési és csere szabályzata.'},
  ];
};
```

In `app/routes/policies.shipping-policy.tsx`:
```tsx
export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Szállítási információk | Ars Mosoris'},
    {name: 'description', content: 'Szállítási feltételek és díjak az Ars Mosoris megrendelésekhez.'},
  ];
};
```

In `app/routes/policies.terms-of-service.tsx`:
```tsx
export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Általános Szerződési Feltételek | Ars Mosoris'},
    {name: 'description', content: 'Az Ars Mosoris általános szerződési feltételei (ÁSZF).'},
  ];
};
```

- [ ] **Step 6: Verify TypeScript**

```bash
cd e:/GIT/ARS && npm run typecheck
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
cd e:/GIT/ARS
git add app/routes/collections.all.tsx app/routes/collections._index.tsx app/routes/blogs._index.tsx app/routes/cart.tsx app/routes/policies.privacy-policy.tsx app/routes/policies.refund-policy.tsx app/routes/policies.shipping-policy.tsx app/routes/policies.terms-of-service.tsx
git commit -m "fix(seo): add missing meta descriptions and noindex to cart"
```

---

## Task 8: Fix Canonical Tag on Product Pages

**Files:**
- Modify: `app/routes/products.$handle.tsx`

**What:** `rel: 'canonical'` in the `meta()` array does not render a `<link>` tag. Must be in `links()`.

- [ ] **Step 1: Add `links()` export and remove `rel` from `meta()`**

In `app/routes/products.$handle.tsx`, add a `links` export after the `meta` export:
```tsx
export function links({data}: Route.LinksArgs) {
  if (!data?.product?.handle) return [];
  return [
    {
      rel: 'canonical' as const,
      href: `/products/${data.product.handle}`,
    },
  ];
}
```

Then in the `meta` function, remove the canonical entry:
```tsx
export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `${data?.product.title ?? 'Termék'} | Ars Mosoris`},
    {
      name: 'description',
      content: data?.product.description || 'Ars Mosoris termék',
    },
  ];
};
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd e:/GIT/ARS && npm run typecheck
```
Expected: no errors. If `Route.LinksArgs` doesn't exist, use `{data: {product: {handle: string} | null} | undefined}` as the type.

- [ ] **Step 3: Commit**

```bash
cd e:/GIT/ARS
git add app/routes/products.\$handle.tsx
git commit -m "fix(seo): move canonical tag from meta() to links() on product pages"
```

---

## Task 9: Open Graph Meta Tags

**Files:**
- Modify: `app/routes/products.$handle.tsx`
- Modify: `app/routes/_index.tsx`
- Modify: `app/routes/about.tsx`
- Modify: `app/routes/contact.tsx`
- Modify: `app/routes/artists._index.tsx`
- Modify: `app/routes/artists.$handle.tsx`

**What:** Zero OG tags site-wide. Social shares show no preview card.

- [ ] **Step 1: Add Open Graph to product pages**

In `app/routes/products.$handle.tsx`, update the `meta` function to include OG tags:
```tsx
export const meta: Route.MetaFunction = ({data}) => {
  const title = `${data?.product.title ?? 'Termék'} | Ars Mosoris`;
  const description = data?.product.description || 'Ars Mosoris termék';
  const image = data?.product.selectedOrFirstAvailableVariant?.image?.url
    ?? data?.product.featuredImage?.url
    ?? '';

  return [
    {title},
    {name: 'description', content: description},
    {property: 'og:type', content: 'product'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    ...(image ? [{property: 'og:image', content: image}] : []),
    {property: 'og:site_name', content: 'Ars Mosoris'},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
    ...(image ? [{name: 'twitter:image', content: image}] : []),
  ];
};
```

Note: `data?.product.featuredImage` may need to be added to the `PRODUCT_FRAGMENT` GraphQL query if not already present. Check that the query includes `featuredImage { url }`.

- [ ] **Step 2: Add Open Graph to homepage**

In `app/routes/_index.tsx`, update or add `meta` export:
```tsx
export const meta: Route.MetaFunction = () => {
  const title = 'Ars Mosoris | Kortárs Művészet & Divat';
  const description = 'Öt képzőművész hallgató által alapított márka, ahol a mindennapi viselet és a kortárs művészet találkozik.';
  return [
    {title},
    {name: 'description', content: description},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:site_name', content: 'Ars Mosoris'},
    {name: 'twitter:card', content: 'summary'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
  ];
};
```

- [ ] **Step 3: Add Open Graph to about page**

In `app/routes/about.tsx`, update the meta export:
```tsx
export const meta: Route.MetaFunction = () => {
  const title = 'Rólunk | Ars Mosoris';
  const description = 'Az Ars Mosoris öt képzőművész hallgató által alapított brand, ahol a kortárs művészet és a mindennapi divat találkozik.';
  return [
    {title},
    {name: 'description', content: description},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:site_name', content: 'Ars Mosoris'},
    {name: 'twitter:card', content: 'summary'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
  ];
};
```

- [ ] **Step 4: Add Open Graph to contact page**

In `app/routes/contact.tsx`, update the meta export:
```tsx
export const meta: Route.MetaFunction = () => {
  const title = 'Kapcsolat | Ars Mosoris';
  const description = 'Vedd fel velünk a kapcsolatot! E-mail, helyszín és nyitvatartási információk az Ars Mosoris csapatával.';
  return [
    {title},
    {name: 'description', content: description},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:site_name', content: 'Ars Mosoris'},
    {name: 'twitter:card', content: 'summary'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
  ];
};
```

- [ ] **Step 5: Add Open Graph to artists index**

In `app/routes/artists._index.tsx`, update the meta export:
```tsx
export const meta: Route.MetaFunction = () => {
  const title = 'Alkotóink | Ars Mosoris';
  const description = 'Ismerd meg az Ars Mosoris alkotóit — hat tehetséges képzőművész hallgató, hat egyedi látásmód.';
  return [
    {title},
    {name: 'description', content: description},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:site_name', content: 'Ars Mosoris'},
    {name: 'twitter:card', content: 'summary'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
  ];
};
```

- [ ] **Step 6: Add Open Graph to individual artist pages**

In `app/routes/artists.$handle.tsx`, update the meta export:
```tsx
export const meta: Route.MetaFunction = ({data}) => {
  const artist = data?.artist;
  const title = artist ? `${artist.name} | Ars Mosoris Alkotó` : 'Alkotó | Ars Mosoris';
  const description = artist?.bio ?? 'Ismerd meg az Ars Mosoris alkotóját.';
  return [
    {title},
    {name: 'description', content: description},
    {property: 'og:type', content: 'profile'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    ...(artist?.image ? [{property: 'og:image', content: artist.image}] : []),
    {property: 'og:site_name', content: 'Ars Mosoris'},
    {name: 'twitter:card', content: artist?.image ? 'summary_large_image' : 'summary'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
    ...(artist?.image ? [{name: 'twitter:image', content: artist.image}] : []),
  ];
};
```

Note: verify that `artists.$handle.tsx` loader returns `{artist}`. If the loader returns the artist data under a different key, adjust accordingly.

- [ ] **Step 7: Verify TypeScript**

```bash
cd e:/GIT/ARS && npm run typecheck
```
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
cd e:/GIT/ARS
git add app/routes/products.\$handle.tsx app/routes/_index.tsx app/routes/about.tsx app/routes/contact.tsx app/routes/artists._index.tsx app/routes/artists.\$handle.tsx
git commit -m "feat(seo): add Open Graph and Twitter Card meta tags to all key pages"
```

---

## Task 10: JSON-LD Structured Data

**Files:**
- Modify: `app/routes/products.$handle.tsx`
- Modify: `app/root.tsx`

**What:** No schema.org markup anywhere. Add Product schema on product pages and Organization schema in root.

- [ ] **Step 1: Add Product + BreadcrumbList JSON-LD to product pages**

In `app/routes/products.$handle.tsx`, inside the `Product` component's return, add a `<script>` tag with JSON-LD **before** the main `<div className="section">`:

```tsx
export default function Product() {
  const {product, relatedProducts} = useLoaderData<typeof loader>();
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });
  const {title, descriptionHtml, vendor} = product;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: vendor || 'Ars Mosoris',
    },
    image: selectedVariant?.image?.url ? [selectedVariant.image.url] : [],
    offers: {
      '@type': 'Offer',
      price: selectedVariant?.price?.amount ?? '0',
      priceCurrency: selectedVariant?.price?.currencyCode ?? 'HUF',
      availability: selectedVariant?.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `/products/${product.handle}`,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Bolt',
        item: '/collections/all',
      },
      ...(vendor
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: vendor,
              item: `/collections/${vendor.toLowerCase()}`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: product.title,
            },
          ]
        : [
            {
              '@type': 'ListItem',
              position: 2,
              name: product.title,
            },
          ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(productJsonLd)}}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(breadcrumbJsonLd)}}
      />
      <div className="section">
        {/* ... rest of existing JSX unchanged ... */}
      </div>
      {/* ... rest of existing JSX unchanged ... */}
    </>
  );
}
```

Important: do NOT change any existing JSX below the opening `<div className="section">`. Only prepend the two `<script>` tags.

- [ ] **Step 2: Add Organization JSON-LD to root**

In `app/root.tsx`, inside the `App` function, add an Organization schema script tag. Import `SOCIAL_LINKS` at the top:
```tsx
import {SOCIAL_LINKS} from '~/lib/config';
```

Then in the `App` function, add the script before `<PageLayout>`:
```tsx
export default function App() {
  const data = useRouteLoaderData<RootLoader>('root');

  if (!data) {
    return <Outlet />;
  }

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ars Mosoris',
    url: 'https://arsmosoris.vincze.app',
    logo: 'https://arsmosoris.vincze.app/favicon.svg',
    sameAs: [
      SOCIAL_LINKS.instagram,
      SOCIAL_LINKS.facebook,
      SOCIAL_LINKS.tiktok,
      SOCIAL_LINKS.youtube,
    ].filter(Boolean),
  };

  return (
    <Analytics.Provider
      cart={data.cart}
      shop={data.shop}
      consent={data.consent}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(organizationJsonLd)}}
      />
      <PageLayout {...data}>
        <Outlet />
      </PageLayout>
    </Analytics.Provider>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd e:/GIT/ARS && npm run typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd e:/GIT/ARS
git add app/routes/products.\$handle.tsx app/root.tsx
git commit -m "feat(seo): add Product + BreadcrumbList JSON-LD on product pages, Organization JSON-LD in root"
```

---

## Task 11: Fix Sitemap

**Files:**
- Modify: `app/routes/sitemap.$type.$page[.xml].tsx`
- Modify: `app/routes/[sitemap.xml].tsx`

**What:** Sitemap uses wrong locales (EN-US/CA/FR-CA) generating dead URLs. Custom routes (/about, /contact, /events, /artists) are not indexed.

- [ ] **Step 1: Remove wrong locales from sitemap**

In `app/routes/sitemap.$type.$page[.xml].tsx`, replace the entire file:
```tsx
import type {Route} from './+types/sitemap.$type.$page[.xml]';
import {getSitemap} from '@shopify/hydrogen';

export async function loader({
  request,
  params,
  context: {storefront},
}: Route.LoaderArgs) {
  const response = await getSitemap({
    storefront,
    request,
    params,
    locales: [],
    getLink: ({type, baseUrl, handle}) => `${baseUrl}/${type}/${handle}`,
  });

  response.headers.set('Cache-Control', `max-age=${60 * 60 * 24}`);

  return response;
}
```

- [ ] **Step 2: Create custom pages sitemap route**

Create new file `app/routes/sitemap.custom[.xml].tsx`:
```tsx
import type {Route} from './+types/sitemap.custom[.xml]';

const CUSTOM_PAGES = [
  {url: '/', changefreq: 'weekly', priority: '1.0'},
  {url: '/collections/all', changefreq: 'daily', priority: '0.9'},
  {url: '/artists', changefreq: 'weekly', priority: '0.8'},
  {url: '/artists/ancsa', changefreq: 'weekly', priority: '0.7'},
  {url: '/artists/dori', changefreq: 'weekly', priority: '0.7'},
  {url: '/artists/gabor', changefreq: 'weekly', priority: '0.7'},
  {url: '/artists/emese', changefreq: 'weekly', priority: '0.7'},
  {url: '/artists/zorka', changefreq: 'weekly', priority: '0.7'},
  {url: '/artists/zsolt', changefreq: 'weekly', priority: '0.7'},
  {url: '/events', changefreq: 'weekly', priority: '0.7'},
  {url: '/about', changefreq: 'monthly', priority: '0.6'},
  {url: '/contact', changefreq: 'monthly', priority: '0.6'},
];

export async function loader({request}: Route.LoaderArgs) {
  const baseUrl = new URL(request.url).origin;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${CUSTOM_PAGES.map(
  (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}
```

- [ ] **Step 3: Add custom sitemap to the sitemap index**

In `app/routes/[sitemap.xml].tsx`, replace the file to include the custom sitemap in the index:
```tsx
import type {Route} from './+types/[sitemap.xml]';
import {getSitemapIndex} from '@shopify/hydrogen';

export async function loader({
  request,
  context: {storefront},
}: Route.LoaderArgs) {
  const response = await getSitemapIndex({
    storefront,
    request,
  });

  // Append our custom pages sitemap to the index
  const baseUrl = new URL(request.url).origin;
  const originalText = await response.text();
  const customEntry = `  <sitemap>\n    <loc>${baseUrl}/sitemap/custom.xml</loc>\n  </sitemap>\n</sitemapindex>`;
  const merged = originalText.replace('</sitemapindex>', customEntry);

  return new Response(merged, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd e:/GIT/ARS && npm run typecheck
```
Expected: no errors. If the `sitemap.custom[.xml]` route type is not auto-generated, typecheck may warn — this is acceptable; proceed.

- [ ] **Step 5: Commit**

```bash
cd e:/GIT/ARS
git add "app/routes/sitemap.\$type.\$page[.xml].tsx" "app/routes/[sitemap.xml].tsx" "app/routes/sitemap.custom[.xml].tsx"
git commit -m "fix(seo): remove wrong EN-US/CA/FR locales from sitemap, add custom pages sitemap (/about /contact /events /artists)"
```

---

## Task 12: Heading Hierarchy + Alt Text Fixes

**Files:**
- Modify: `app/routes/collections._index.tsx:90`
- Modify: `app/routes/blogs.$blogHandle._index.tsx`
- Modify: `app/components/ProductImage.tsx:15`

**What:** `<h5>` under `<h1>` in collections, missing `<h1>` in blog index, generic alt text fallback.

- [ ] **Step 1: Fix h5 → h2 in collections index**

In `app/routes/collections._index.tsx`, line 90, change:
```tsx
<h5>{collection.title}</h5>
```
to:
```tsx
<h2>{collection.title}</h2>
```

- [ ] **Step 2: Add h1 to blog handle index**

In `app/routes/blogs.$blogHandle._index.tsx`, find where the blog page content renders and add an `<h1>` for the blog title. Find the return statement with the blog content and add:
```tsx
<h1 className="blog-title">{blog.title}</h1>
```
above the `<PaginatedResourceSection>` call. The exact location depends on the existing JSX — place it at the top of the main content container.

- [ ] **Step 3: Fix `alt="Product Image"` fallback in ProductImage**

In `app/components/ProductImage.tsx`, change the fallback:
```tsx
alt={image.altText || 'Product Image'}
```
to:
```tsx
alt={image.altText || productTitle || ''}
```

This requires adding `productTitle` as a prop. Update the component signature:
```tsx
export function ProductImage({
  image,
  productTitle,
}: {
  image?: ProductFragment['selectedOrFirstAvailableVariant']['image'];
  productTitle?: string;
}) {
```

Then update the call site in `products.$handle.tsx` to pass the title:
```tsx
<ProductImage image={selectedVariant?.image} productTitle={title} />
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd e:/GIT/ARS && npm run typecheck
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd e:/GIT/ARS
git add app/routes/collections._index.tsx app/routes/blogs.\$blogHandle._index.tsx app/components/ProductImage.tsx app/routes/products.\$handle.tsx
git commit -m "fix(seo): h5→h2 in collections, add h1 to blog index, improve ProductImage alt text fallback"
```

---

## Self-Review

**Spec coverage check:**

| Spec issue | Task |
|---|---|
| React hydration errors | Task 1 ✓ |
| Cart open on back nav | Task 2 ✓ |
| Header logo wraps | Task 3 ✓ |
| Nav overflow at 768px | Task 3 ✓ |
| Footer links wrong color | Task 3 ✓ |
| Footer shop links → 404 | Task 5 ✓ |
| Active nav link CSS | Task 3 ✓ |
| English strings in HU store | Task 4 ✓ |
| Artist card empty state | Task 3 ✓ |
| Product card prefetch | Task 4 ✓ (homepage _index.tsx; ProductItem.tsx already has prefetch="intent") |
| lang="en" on HU site | Task 6 ✓ |
| "Hydrogen" boilerplate titles | Task 6 ✓ |
| Shopify page SEO unused | Task 6 ✓ |
| Broken canonical tag | Task 8 ✓ |
| Open Graph tags | Task 9 ✓ |
| JSON-LD structured data | Task 10 ✓ |
| Custom routes in sitemap | Task 11 ✓ |
| Wrong sitemap locales | Task 11 ✓ |
| Missing meta descriptions | Task 7 ✓ |
| alt="Product Image" fallback | Task 12 ✓ |
| Heading hierarchy violations | Task 12 ✓ |

All 21 spec items covered. ✓
