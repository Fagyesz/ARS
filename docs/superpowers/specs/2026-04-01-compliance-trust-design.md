# Compliance & Trust Design — Ars Mosoris

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add GDPR-compliant Hungarian cookie consent banner and complete OG/social meta tags across all routes.

**Architecture:** Two independent features. Cookie consent uses a custom React context + Shopify's Customer Privacy API (already loaded by `Analytics.Provider`). OG meta tags are added per-route using React Router's `meta` export — no shared utility needed at this scale.

**Tech Stack:** React Router v7, Shopify Hydrogen, TypeScript. No new dependencies.

---

## Feature 1: Cookie Consent Banner

### Files
- Create: `app/components/CookieConsent.tsx` — context, provider, banner UI
- Modify: `app/root.tsx` — render `<CookieConsentBanner>` inside `App()`
- Modify: `app/styles/app.css` — banner styles

### How it works

Shopify Hydrogen's `Analytics.Provider` loads Shopify's Customer Privacy JS automatically (because `checkoutDomain` and `storefrontAccessToken` are set in the `consent` prop). That script exposes `window.Shopify.customerPrivacy.setTrackingConsent(...)`. When called with `analytics: false`, Hydrogen stops firing analytics events. When called with `analytics: true`, analytics resumes. This is the correct integration point — we do not need to conditionally render `Analytics.Provider`.

Our custom context layer exists purely to track whether the banner has been shown/dismissed, so it doesn't reappear on subsequent visits.

### Context API

```ts
type ConsentChoice = 'accepted' | 'rejected';

type CookieConsentContextValue = {
  choice: ConsentChoice | null; // null = not yet decided
  accept: () => void;
  reject: () => void;
};
```

localStorage key: `'ars-cookie-consent'` — value: `'accepted'` | `'rejected'`

### SSR safety

`useEffect` reads localStorage on client mount. Server-side renders as `choice: null` (banner hidden during SSR, shown after hydration if no prior choice).

### Banner UI

- Fixed position: `bottom: 0; left: 0; right: 0; z-index: 200`
- Slides up from bottom on mount (CSS transform animation, 300ms ease-out)
- Only visible when `choice === null` (no prior decision)
- Hungarian copy:

```
"Ez az oldal sütiket (cookie-kat) használ a jobb felhasználói élmény és
a látogatói statisztikák érdekében. Elutasítás esetén csak az oldal
működéséhez szükséges sütik kerülnek alkalmazásra."
```

- Two buttons:
  - **"Elfogadom"** — `btn btn-primary` style, calls `accept()`
  - **"Csak szükséges"** — `btn btn-outline` style, calls `reject()`
- A small "Adatkezelési tájékoztató" link → `/policies/privacy-policy` opens in same tab

### accept() and reject() implementation

```ts
function accept() {
  localStorage.setItem('ars-cookie-consent', 'accepted');
  setChoice('accepted');
  window.Shopify?.customerPrivacy?.setTrackingConsent(
    { analytics: true, marketing: true, preferences: true, sale_of_data: false },
    () => {} // callback required by API, no-op
  );
}

function reject() {
  localStorage.setItem('ars-cookie-consent', 'rejected');
  setChoice('rejected');
  window.Shopify?.customerPrivacy?.setTrackingConsent(
    { analytics: false, marketing: false, preferences: false, sale_of_data: false },
    () => {}
  );
}
```

The `?.` optional chaining is required because the Shopify Customer Privacy script may not be loaded yet on the very first render.

### Integration in root.tsx

`CookieConsentProvider` wraps `Analytics.Provider` (or is placed inside `App()` alongside it — either works since they are independent). The `<CookieConsentBanner />` component is rendered as the last child inside `App()`, after `<PageLayout>`.

```tsx
// In App() in root.tsx:
return (
  <Analytics.Provider cart={data.cart} shop={data.shop} consent={data.consent}>
    <CookieConsentProvider>
      <PageLayout {...data}>
        <Outlet />
      </PageLayout>
      <CookieConsentBanner />
    </CookieConsentProvider>
  </Analytics.Provider>
);
```

### CSS

```css
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

/* On mobile: stack vertically */
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

---

## Feature 2: OG Meta Tags — All Routes

### Standard tag set

Every page gets these tags (values vary per route):
```
og:type        = "website" (or "article" for blog posts)
og:title       = {page title, same as <title>}
og:description = {page description}
og:image       = {page-specific image or /og-default.png}
twitter:card   = "summary_large_image"
```

`og:url` is only added to routes where the canonical URL is available from loader data (dynamic routes). Static pages omit it.

### Routes needing changes

All pages below are **missing** OG tags. Pages already complete are not listed.

---

#### `app/routes/events._index.tsx`
Static copy. No loader changes needed.

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

---

#### `app/routes/collections.all.tsx`
Static copy. No loader changes needed.

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

---

#### `app/routes/collections.$handle.tsx`
Dynamic — uses collection title, description, and image. Requires adding `image { url altText }` to `COLLECTION_QUERY`.

**GraphQL change** — add to the `collection(handle: $handle)` selection:
```graphql
image {
  url
  altText
}
```

**Meta function:**
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

---

#### `app/routes/wishlist.tsx`
Static copy. Include `robots: noindex` since this is a personal, client-side page.

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

---

#### `app/routes/blogs._index.tsx`
Static copy.

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

---

#### `app/routes/blogs.$blogHandle.$articleHandle.tsx`
Dynamic — uses article title, excerpt/contentHtml summary, and the `firstImageUrl` already in loader data.

The loader already returns `article` (which includes `seo.description` and `seo.title`) and `firstImageUrl`. No query or loader changes required.

**Meta function:**
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

---

#### `app/routes/search.tsx`
Static copy with noindex (search result pages should not be indexed).

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

---

#### `app/routes/policies._index.tsx`
Static copy.

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

---

#### `app/routes/policies.$handle.tsx`
Dynamic — policy title from loader. Use `/og-default.png` for image.

Check what the `policies.$handle.tsx` loader returns. Add `og:` tags using `data?.policy.title`.

```ts
export const meta: Route.MetaFunction<typeof loader> = ({data}) => {
  const title = `${data?.policy.title ?? 'Szabályzat'} | Ars Mosoris`;
  return [
    {title},
    {name: 'description', content: data?.policy.title ?? 'Ars Mosoris szabályzat'},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: data?.policy.title ?? 'Ars Mosoris szabályzat'},
    {property: 'og:image', content: '/og-default.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};
```

---

#### `app/routes/contact.tsx`
Static copy — add missing OG tags to the existing `meta` export.

```ts
export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Kapcsolat | Ars Mosoris'},
    {name: 'description', content: 'Lépj kapcsolatba az Ars Mosoris csapatával — kérdések, együttműködések, sajtó.'},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'Kapcsolat | Ars Mosoris'},
    {property: 'og:description', content: 'Lépj kapcsolatba az Ars Mosoris csapatával — kérdések, együttműködések, sajtó.'},
    {property: 'og:image', content: '/og-default.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};
```

---

### `blogs.$blogHandle._index.tsx`
Static fallback copy (no single article image available at blog index level).

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
