# Compliance & Trust Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GDPR-compliant Hungarian cookie consent banner and complete OG/social meta tags across all routes that are missing them.

**Architecture:** Two independent features. Cookie consent is a new `CookieConsent.tsx` component with React context + Shopify's Customer Privacy API integration, wired into `root.tsx`. OG meta tags are pure `meta` function replacements per-route — no shared utility, no new logic.

**Tech Stack:** React Router v7, Shopify Hydrogen, TypeScript, CSS custom properties. No new dependencies.

---

## File Structure

**Created:**
- `app/components/CookieConsent.tsx` — context, provider, banner UI, Window type declaration

**Modified:**
- `app/root.tsx` — wrap App() with CookieConsentProvider, render CookieConsentBanner
- `app/styles/app.css` — cookie banner styles (append at end)
- `app/routes/events._index.tsx` — add OG meta tags
- `app/routes/collections.all.tsx` — add OG meta tags
- `app/routes/collections.$handle.tsx` — add `image` to GraphQL query + dynamic OG meta
- `app/routes/wishlist.tsx` — add OG meta tags + noindex
- `app/routes/blogs._index.tsx` — add OG meta tags
- `app/routes/blogs.$blogHandle._index.tsx` — add dynamic OG meta tags
- `app/routes/blogs.$blogHandle.$articleHandle.tsx` — add dynamic OG meta tags
- `app/routes/search.tsx` — add OG meta tags + noindex
- `app/routes/policies._index.tsx` — add OG meta tags
- `app/routes/policies.$handle.tsx` — add dynamic OG meta tags

---

## Task 1: CookieConsent Component

**Files:**
- Create: `app/components/CookieConsent.tsx`

- [ ] **Step 1: Create `app/components/CookieConsent.tsx` with this exact content**

```tsx
import {createContext, useContext, useState, useEffect} from 'react';
import {Link} from 'react-router';

declare global {
  interface Window {
    Shopify?: {
      customerPrivacy?: {
        setTrackingConsent: (
          consent: {
            analytics: boolean;
            marketing: boolean;
            preferences: boolean;
            sale_of_data: boolean;
          },
          callback: () => void,
        ) => void;
      };
    };
  }
}

type ConsentChoice = 'accepted' | 'rejected';

type CookieConsentContextValue = {
  choice: ConsentChoice | null;
  accept: () => void;
  reject: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue>({
  choice: null,
  accept: () => {},
  reject: () => {},
});

export function CookieConsentProvider({children}: {children: React.ReactNode}) {
  const [choice, setChoice] = useState<ConsentChoice | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('ars-cookie-consent');
    if (stored === 'accepted' || stored === 'rejected') {
      setChoice(stored);
    }
  }, []);

  function accept() {
    localStorage.setItem('ars-cookie-consent', 'accepted');
    setChoice('accepted');
    window.Shopify?.customerPrivacy?.setTrackingConsent(
      {analytics: true, marketing: true, preferences: true, sale_of_data: false},
      () => {},
    );
  }

  function reject() {
    localStorage.setItem('ars-cookie-consent', 'rejected');
    setChoice('rejected');
    window.Shopify?.customerPrivacy?.setTrackingConsent(
      {analytics: false, marketing: false, preferences: false, sale_of_data: false},
      () => {},
    );
  }

  return (
    <CookieConsentContext.Provider value={{choice, accept, reject}}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function CookieConsentBanner() {
  const {choice, accept, reject} = useContext(CookieConsentContext);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (choice === null) {
      const timer = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, [choice]);

  if (choice !== null) return null;

  return (
    <div
      className={`cookie-banner${visible ? ' cookie-banner--visible' : ''}`}
      role="dialog"
      aria-label="Cookie hozzájárulás"
      aria-live="polite"
    >
      <p className="cookie-banner-text">
        Ez az oldal sütiket (cookie-kat) használ a jobb felhasználói élmény és a látogatói
        statisztikák érdekében. Elutasítás esetén csak az oldal működéséhez szükséges sütik
        kerülnek alkalmazásra.{' '}
        <Link to="/policies/privacy-policy">Adatkezelési tájékoztató</Link>
      </p>
      <div className="cookie-banner-actions">
        <button type="button" className="btn btn-outline" onClick={reject}>
          Csak szükséges
        </button>
        <button type="button" className="btn btn-primary" onClick={accept}>
          Elfogadom
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd e:/GIT/ARS && npm run typecheck`
Expected: no errors related to `CookieConsent.tsx`

- [ ] **Step 3: Commit**

```bash
git add app/components/CookieConsent.tsx
git commit -m "feat: add CookieConsent component with Shopify Customer Privacy integration"
```

---

## Task 2: Wire Cookie Consent into Root + Add CSS

**Files:**
- Modify: `app/root.tsx` — lines 192–210 (the `App()` function)
- Modify: `app/styles/app.css` — append at end (currently line 4735)

- [ ] **Step 1: Add import to `app/root.tsx`**

At the top of `app/root.tsx`, after the existing imports, add:

```tsx
import {CookieConsentProvider, CookieConsentBanner} from '~/components/CookieConsent';
```

- [ ] **Step 2: Update `App()` in `app/root.tsx`**

Replace the entire `App()` function (lines 192–210):

```tsx
export default function App() {
  const data = useRouteLoaderData<RootLoader>('root');

  if (!data) {
    return <Outlet />;
  }

  return (
    <Analytics.Provider
      cart={data.cart}
      shop={data.shop}
      consent={data.consent}
    >
      <CookieConsentProvider>
        <PageLayout {...data}>
          <Outlet />
        </PageLayout>
        <CookieConsentBanner />
      </CookieConsentProvider>
    </Analytics.Provider>
  );
}
```

- [ ] **Step 3: Append cookie banner CSS to `app/styles/app.css`**

Append at the very end of the file (after line 4735):

```css

/* ── Cookie Consent Banner ──────────────────────────────────────── */
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 200;
  background: var(--color-foreground);
  color: var(--color-background);
  padding: 1.25rem 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  transform: translateY(100%);
  transition: transform 0.3s ease-out;
}

.cookie-banner--visible {
  transform: translateY(0);
}

.cookie-banner-text {
  flex: 1;
  min-width: 200px;
  font-size: 0.85rem;
  line-height: 1.5;
}

.cookie-banner-text a {
  color: inherit;
  text-decoration: underline;
  opacity: 0.75;
}

.cookie-banner-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .cookie-banner {
    flex-direction: column;
    align-items: stretch;
  }
  .cookie-banner-actions {
    flex-direction: column;
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd e:/GIT/ARS && npm run typecheck`
Expected: no errors

- [ ] **Step 5: Manual smoke test**

Run: `cd e:/GIT/ARS && npm run dev`
Open the site. Expected:
- Cookie banner slides up from bottom after ~300ms on first visit
- "Csak szükséges" and "Elfogadom" buttons both visible
- Clicking either button hides the banner
- Refreshing the page: banner does NOT reappear
- To reset: open DevTools → Application → Local Storage → delete `ars-cookie-consent` → reload

- [ ] **Step 6: Commit**

```bash
git add app/root.tsx app/styles/app.css
git commit -m "feat: integrate cookie consent banner into root layout"
```

---

## Task 3: Static OG Meta Tags — 6 Routes

These 6 routes only need their `meta` function replaced. No loader or query changes.

**Files:**
- Modify: `app/routes/events._index.tsx`
- Modify: `app/routes/collections.all.tsx`
- Modify: `app/routes/wishlist.tsx`
- Modify: `app/routes/blogs._index.tsx`
- Modify: `app/routes/search.tsx`
- Modify: `app/routes/policies._index.tsx`

- [ ] **Step 1: Replace `meta` in `app/routes/events._index.tsx`**

Find and replace the existing `export const meta` function:

```ts
export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Események | Ars Mosoris'},
    {name: 'description', content: 'Ars Mosoris események, popup shopok és kiállítások. Találkozz velünk személyesen!'},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'Események | Ars Mosoris'},
    {property: 'og:description', content: 'Ars Mosoris események, popup shopok és kiállítások. Találkozz velünk személyesen!'},
    {property: 'og:image', content: '/og-default.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};
```

- [ ] **Step 2: Replace `meta` in `app/routes/collections.all.tsx`**

Find and replace the existing `export const meta` function:

```ts
export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Katalógus | Ars Mosoris'},
    {name: 'description', content: 'Fedezd fel a teljes Ars Mosoris kollekcióját — egyedi póló és táska dizájnok magyar képzőművészektől.'},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'Katalógus | Ars Mosoris'},
    {property: 'og:description', content: 'Fedezd fel a teljes Ars Mosoris kollekcióját — egyedi póló és táska dizájnok magyar képzőművészektől.'},
    {property: 'og:image', content: '/og-default.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};
```

- [ ] **Step 3: Replace `meta` in `app/routes/wishlist.tsx`**

Find and replace the existing `export const meta` function:

```ts
export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Kívánságlista | Ars Mosoris'},
    {name: 'description', content: 'A mentett termékeim az Ars Mosoris boltban.'},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'Kívánságlista | Ars Mosoris'},
    {property: 'og:description', content: 'A mentett termékeim az Ars Mosoris boltban.'},
    {property: 'og:image', content: '/og-default.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'robots', content: 'noindex'},
  ];
};
```

- [ ] **Step 4: Replace `meta` in `app/routes/blogs._index.tsx`**

Find and replace the existing `export const meta` function:

```ts
export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Blog | Ars Mosoris'},
    {name: 'description', content: 'Az Ars Mosoris blogja — hírek, történetek és inspiráció a magyar képzőművészet világából.'},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'Blog | Ars Mosoris'},
    {property: 'og:description', content: 'Az Ars Mosoris blogja — hírek, történetek és inspiráció a magyar képzőművészet világából.'},
    {property: 'og:image', content: '/og-default.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};
```

- [ ] **Step 5: Replace `meta` in `app/routes/search.tsx`**

Find and replace the existing `export const meta` function:

```ts
export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Keresés | Ars Mosoris'},
    {name: 'description', content: 'Keresés az Ars Mosoris termékek és tartalmak között.'},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'Keresés | Ars Mosoris'},
    {property: 'og:description', content: 'Keresés az Ars Mosoris termékek és tartalmak között.'},
    {property: 'og:image', content: '/og-default.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'robots', content: 'noindex'},
  ];
};
```

- [ ] **Step 6: Replace `meta` in `app/routes/policies._index.tsx`**

Find and replace the existing `export const meta` function:

```ts
export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Jogi feltételek | Ars Mosoris'},
    {name: 'description', content: 'Ars Mosoris jogi feltételek — adatvédelem, szállítás, visszaküldés és általános feltételek.'},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'Jogi feltételek | Ars Mosoris'},
    {property: 'og:description', content: 'Ars Mosoris jogi feltételek — adatvédelem, szállítás, visszaküldés és általános feltételek.'},
    {property: 'og:image', content: '/og-default.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `cd e:/GIT/ARS && npm run typecheck`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add app/routes/events._index.tsx app/routes/collections.all.tsx app/routes/wishlist.tsx app/routes/blogs._index.tsx app/routes/search.tsx app/routes/policies._index.tsx
git commit -m "feat: add OG meta tags to 6 static routes"
```

---

## Task 4: Dynamic OG Meta — `collections.$handle.tsx`

This route needs an `image` field added to the GraphQL query so the OG image can be the collection's own image, and the `meta` function updated to use loader data.

**Files:**
- Modify: `app/routes/collections.$handle.tsx`

- [ ] **Step 1: Add `image` field to `COLLECTION_QUERY` in `app/routes/collections.$handle.tsx`**

The current query (around line 206) selects `collection(handle: $handle) { id handle title description products(...) }`.

Replace the collection selection block:

```graphql
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        url
        altText
      }
      products(
```

(The rest of the `products(...)` block stays unchanged.)

- [ ] **Step 2: Update `meta` function in `app/routes/collections.$handle.tsx`**

Replace the current `meta` function at the top of the file (lines 9–17):

```ts
export const meta: Route.MetaFunction<typeof loader> = ({data}) => {
  const title = `${data?.collection.title ?? 'Kollekció'} | Ars Mosoris`;
  const description = data?.collection.description || 'Ars Mosoris kollekció';
  const image = data?.collection.image?.url ?? '/og-default.png';
  return [
    {title},
    {name: 'description', content: description},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:image', content: image},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};
```

Note: the generic `<typeof loader>` on `Route.MetaFunction` gives TypeScript access to the loader return type so `data?.collection.image` is properly typed.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd e:/GIT/ARS && npm run typecheck`
Expected: no errors. If you see `Property 'image' does not exist on type`, verify the GraphQL change in Step 1 was saved — codegen will pick it up on next `npm run dev` or `npm run build --codegen`.

If `typecheck` alone doesn't regenerate types, run: `cd e:/GIT/ARS && npm run codegen && npm run typecheck`

- [ ] **Step 4: Commit**

```bash
git add app/routes/collections.\$handle.tsx
git commit -m "feat: add collection image to query and dynamic OG meta on collection pages"
```

---

## Task 5: Dynamic OG Meta — `blogs.$blogHandle._index.tsx`

This route has `data?.blog.title` and `data?.blog.seo?.description` available from the loader.

**Files:**
- Modify: `app/routes/blogs.$blogHandle._index.tsx`

- [ ] **Step 1: Replace `meta` function in `app/routes/blogs.$blogHandle._index.tsx`**

The current meta function (lines 11–16) uses dynamic `data?.blog.title`. Replace it:

```ts
export const meta: Route.MetaFunction<typeof loader> = ({data}) => {
  const title = `${data?.blog.title ?? 'Blog'} | Ars Mosoris`;
  const description = data?.blog.seo?.description || 'Az Ars Mosoris blogja — hírek, történetek és inspiráció a magyar képzőművészet világából.';
  return [
    {title},
    {name: 'description', content: description},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:image', content: '/og-default.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd e:/GIT/ARS && npm run typecheck`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/routes/blogs.\$blogHandle._index.tsx"
git commit -m "feat: add dynamic OG meta to blog handle index route"
```

---

## Task 6: Dynamic OG Meta — `blogs.$blogHandle.$articleHandle.tsx`

The loader already returns `article` (with `seo.title` and `seo.description`) and `firstImageUrl`. No query or loader changes needed.

**Files:**
- Modify: `app/routes/blogs.$blogHandle.$articleHandle.tsx`

- [ ] **Step 1: Replace `meta` function in `app/routes/blogs.$blogHandle.$articleHandle.tsx`**

The current meta function (lines 6–8) only has `{title: ...}`. Replace it:

```ts
export const meta: Route.MetaFunction<typeof loader> = ({data}) => {
  const title = `${data?.article.seo?.title ?? data?.article.title ?? ''} | Ars Mosoris`;
  const description = data?.article.seo?.description || 'Ars Mosoris blog cikk';
  const image = data?.firstImageUrl ?? '/og-default.png';
  return [
    {title},
    {name: 'description', content: description},
    {property: 'og:type', content: 'article'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:image', content: image},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd e:/GIT/ARS && npm run typecheck`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/routes/blogs.\$blogHandle.\$articleHandle.tsx"
git commit -m "feat: add dynamic OG meta to blog article route"
```

---

## Task 7: Dynamic OG Meta — `policies.$handle.tsx`

The loader returns `policy` with a `title` field.

**Files:**
- Modify: `app/routes/policies.$handle.tsx`

- [ ] **Step 1: Replace `meta` function in `app/routes/policies.$handle.tsx`**

The current meta function (lines 13–17) uses `Route.MetaFunction` without the generic. Replace it:

```ts
export const meta: Route.MetaFunction<typeof loader> = ({data}) => {
  const title = `${data?.policy.title ?? 'Szabályzat'} | Ars Mosoris`;
  const description = data?.policy.title ?? 'Ars Mosoris szabályzat';
  return [
    {title},
    {name: 'description', content: description},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:image', content: '/og-default.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd e:/GIT/ARS && npm run typecheck`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/routes/policies.\$handle.tsx"
git commit -m "feat: add dynamic OG meta to policy detail route"
```

---

## Final Verification

- [ ] **Run full build**

Run: `cd e:/GIT/ARS && npm run build`
Expected: builds successfully with no TypeScript or Vite errors

- [ ] **Manual check with Open Graph debugger**

Deploy to staging or use `npm run dev`. Use [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) or browser DevTools to inspect `<head>` on:
- `/` — existing OG tags should still be there
- `/collections/all` — should now have `og:title`, `og:image`
- `/collections/ancsa` (or any artist collection) — should show collection-specific image if one exists, otherwise `/og-default.png`
- `/blogs/events/any-article` — should show `og:type: article`
- Any product page — existing OG tags unchanged

- [ ] **Manual check: Cookie banner**

1. Clear `ars-cookie-consent` from localStorage
2. Load any page — banner slides up after 300ms
3. Click "Csak szükséges" — banner disappears, `ars-cookie-consent: rejected` in localStorage
4. Reload — banner does not reappear
5. Clear localStorage, reload, click "Elfogadom" — `ars-cookie-consent: accepted` in localStorage
6. Reload — banner does not reappear
