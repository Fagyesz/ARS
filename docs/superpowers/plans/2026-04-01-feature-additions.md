# Feature Additions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 e-commerce features to the Ars Mosoris Hydrogen storefront: sort controls on the catalog page, a local wishlist with heart icons, back-in-stock email notifications, and a recently viewed products strip.

**Architecture:** Feature 1 extends the existing server-side filter bar in `collections.all.tsx` by adding `sortKey`/`reverse` GraphQL variables. Features 2–4 are purely client-side using localStorage hooks (SSR-safe via useEffect hydration). The back-in-stock feature adds a resource route that reuses the existing Resend integration from `contact.tsx`. No new npm dependencies.

**Tech Stack:** React Router v7, Shopify Hydrogen, TypeScript, localStorage, Resend (already configured)

**Important context:**
- Artist profile live products are **already implemented** in `app/routes/artists.$handle.tsx` — skip Feature 2 from the spec.
- The catalog page at `app/routes/collections.all.tsx` already has artist/type filter pills. We are adding sort only.
- No test runner is configured. Use `npx tsc --noEmit` for type-checking after each task.
- Working directory: `e:/GIT/ARS` (Windows path, but use forward slashes in bash commands).

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `app/routes/collections.all.tsx` | Modify | Add sort select UI + sortKey/reverse GraphQL variables |
| `app/hooks/useWishlist.ts` | Create | localStorage wishlist hook |
| `app/components/ProductItem.tsx` | Modify | Add heart toggle button |
| `app/routes/products.$handle.tsx` | Modify | Add heart button near title + back-in-stock form + recently viewed strip |
| `app/routes/wishlist.tsx` | Create | Wishlist page |
| `app/routes/api.wishlist-products.tsx` | Create | Resource route: fetch products by handles |
| `app/routes/api.back-in-stock.tsx` | Create | Resource route: send back-in-stock emails |
| `app/hooks/useRecentlyViewed.ts` | Create | localStorage recently-viewed hook |
| `app/components/Footer.tsx` | Modify | Add Wishlist link to Shop column |
| `app/styles/app.css` | Modify | Styles for sort bar, heart button, back-in-stock form, recently viewed strip |

---

## Task 1: Sort Controls on Catalog Page

**Files:**
- Modify: `app/routes/collections.all.tsx`
- Modify: `app/styles/app.css`

**Context:** `collections.all.tsx` already reads `?artist=` and `?type=` params and builds a Shopify `query` string. The GraphQL query (`CATALOG_QUERY`) does not yet pass `sortKey` or `reverse`. We add a `?sort=` param, map it to Shopify sort values, and add a sort `<select>` to the existing filter bar.

- [ ] **Step 1: Add sort param reading to the loader**

In `app/routes/collections.all.tsx`, update `loadCriticalData` to read and map the `sort` URL param:

```typescript
// Add this mapping near the top of the file, before the loader functions:
const SORT_OPTIONS = [
  {label: 'Legújabb', value: ''},
  {label: 'Ár: növekvő', value: 'price-asc'},
  {label: 'Ár: csökkenő', value: 'price-desc'},
  {label: 'Név: A–Z', value: 'title-asc'},
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

function parseSortKey(sort: string): {sortKey: string; reverse: boolean} {
  switch (sort) {
    case 'price-asc':
      return {sortKey: 'PRICE', reverse: false};
    case 'price-desc':
      return {sortKey: 'PRICE', reverse: true};
    case 'title-asc':
      return {sortKey: 'TITLE', reverse: false};
    default:
      return {sortKey: 'CREATED_AT', reverse: true};
  }
}
```

- [ ] **Step 2: Pass sort variables through the loader**

Replace the `loadCriticalData` function body:

```typescript
async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  const url = new URL(request.url);
  const artistFilter = url.searchParams.get('artist') || '';
  const typeFilter = url.searchParams.get('type') || '';
  const sortParam = (url.searchParams.get('sort') || '') as SortValue;
  const {sortKey, reverse} = parseSortKey(sortParam);

  const paginationVariables = getPaginationVariables(request, {
    pageBy: 12,
  });

  const queryParts: string[] = [];
  if (artistFilter) queryParts.push(artistFilter);
  if (typeFilter) queryParts.push(typeFilter);
  const query = queryParts.join(' ');

  const [{products}] = await Promise.all([
    storefront.query(CATALOG_QUERY, {
      variables: {...paginationVariables, query, sortKey, reverse},
      cache: storefront.CacheShort(),
    }),
  ]);

  return {products, artistFilter, typeFilter, sortParam};
}
```

- [ ] **Step 3: Update the GraphQL query to accept sort variables**

Replace `CATALOG_QUERY` at the bottom of the file:

```typescript
const CATALOG_QUERY = `#graphql
  ${COLLECTION_ITEM_FRAGMENT}
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $query: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
      query: $query
      sortKey: $sortKey
      reverse: $reverse
    ) {
      nodes {
        ...CollectionItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
` as const;
```

- [ ] **Step 4: Add sort select UI to the Collection component**

In the `Collection` component, destructure `sortParam` from loader data and add the sort select to the filter bar. Replace the existing `export default function Collection()` function:

```typescript
export default function Collection() {
  const {products, artistFilter, typeFilter, sortParam} =
    useLoaderData<typeof loader>();

  return (
    <div className="section">
      <div className="container">
        <div className="text-center mb-8">
          <h1>Katalógus</h1>
          <p className="text-muted">
            Válassz kedveseid közül — hat tehetséges művész munkái
          </p>
        </div>

        {/* Filter + Sort bar */}
        <div className="shop-filters">
          <div className="shop-filter-group">
            <span className="shop-filter-label">Típus</span>
            {TYPE_FILTERS.map((type) => (
              <Link
                key={type.value}
                to={buildFilterUrl({artist: artistFilter, type: type.value, sort: sortParam})}
                className={`shop-filter-pill${typeFilter === type.value ? ' active' : ''}`}
              >
                {type.label}
              </Link>
            ))}
          </div>
          <div className="shop-filter-group">
            <span className="shop-filter-label">Alkotó</span>
            <Link
              to={buildFilterUrl({artist: '', type: typeFilter, sort: sortParam})}
              className={`shop-filter-pill${!artistFilter ? ' active' : ''}`}
            >
              Összes
            </Link>
            {ARTIST_NAMES.map((artist) => (
              <Link
                key={artist}
                to={buildFilterUrl({artist, type: typeFilter, sort: sortParam})}
                className={`shop-filter-pill${artistFilter === artist ? ' active' : ''}`}
              >
                {artist}
              </Link>
            ))}
          </div>
          <div className="shop-filter-group shop-sort-group">
            <span className="shop-filter-label">Rendezés</span>
            <select
              className="shop-sort-select"
              value={sortParam}
              onChange={(e) => {
                const url = buildFilterUrl({
                  artist: artistFilter,
                  type: typeFilter,
                  sort: e.target.value,
                });
                window.location.href = url;
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {products.nodes.length === 0 ? (
          <div className="shop-empty">
            <p>Nincs eredmény a kiválasztott szűrőkre.</p>
            <Link to="/collections/all" className="btn btn-outline">
              Szűrők törölése
            </Link>
          </div>
        ) : (
          <PaginatedResourceSection<CollectionItemFragment>
            connection={products}
            resourcesClassName="products-grid"
          >
            {({node: product, index}) => (
              <ProductItem
                key={product.id}
                product={product}
                loading={index < 8 ? 'eager' : undefined}
              />
            )}
          </PaginatedResourceSection>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update `buildFilterUrl` to include sort**

Replace the existing `buildFilterUrl` function:

```typescript
function buildFilterUrl({artist, type, sort}: {artist: string; type: string; sort: string}) {
  const params = new URLSearchParams();
  if (artist) params.set('artist', artist);
  if (type) params.set('type', type);
  if (sort) params.set('sort', sort);
  const query = params.toString();
  return `/collections/all${query ? `?${query}` : ''}`;
}
```

- [ ] **Step 6: Add sort select CSS to app.css**

Append after the `.shop-filter-pill.active` block (around line 590):

```css
.shop-sort-group {
  margin-left: auto;
}

.shop-sort-select {
  padding: 0.4375rem 2rem 0.4375rem 0.875rem;
  font-size: 0.8125rem;
  font-family: var(--font-sans);
  font-weight: 500;
  border: 1px solid var(--color-border);
  border-radius: 2rem;
  background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231B1B1B' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 0.75rem center;
  appearance: none;
  cursor: pointer;
  color: var(--color-text);
  transition: border-color 0.2s ease;
}

.shop-sort-select:hover,
.shop-sort-select:focus {
  border-color: var(--color-ars-dark);
  outline: none;
}

@media (max-width: 767px) {
  .shop-sort-group {
    margin-left: 0;
    width: 100%;
  }
  .shop-sort-select {
    width: 100%;
  }
}
```

- [ ] **Step 7: Type-check and commit**

```bash
cd /e/GIT/ARS && npx tsc --noEmit
```

Expected: no errors.

```bash
cd /e/GIT/ARS && git add app/routes/collections.all.tsx app/styles/app.css && git commit -m "feat: add sort controls to catalog page (newest, price, title)"
```

---

## Task 2: useWishlist Hook + Heart Icon on Product Cards

**Files:**
- Create: `app/hooks/useWishlist.ts`
- Modify: `app/components/ProductItem.tsx`
- Modify: `app/styles/app.css`

**Context:** The wishlist is stored in localStorage under key `ars-wishlist` as a JSON array of product handles (strings). The hook is SSR-safe: it initialises to `[]` on the server and hydrates from localStorage on the client via `useEffect`. The heart button overlays the product card image.

- [ ] **Step 1: Create the useWishlist hook**

Create `app/hooks/useWishlist.ts`:

```typescript
import {useState, useEffect, useCallback} from 'react';

const STORAGE_KEY = 'ars-wishlist';

function readStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(handles: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(handles));
  } catch {
    // localStorage unavailable (private mode, quota exceeded) — silently ignore
  }
}

export function useWishlist() {
  const [handles, setHandles] = useState<string[]>([]);

  // Hydrate from localStorage after mount (SSR-safe)
  useEffect(() => {
    setHandles(readStorage());
  }, []);

  const toggle = useCallback((handle: string) => {
    setHandles((prev) => {
      const next = prev.includes(handle)
        ? prev.filter((h) => h !== handle)
        : [...prev, handle];
      writeStorage(next);
      return next;
    });
  }, []);

  const has = useCallback(
    (handle: string) => handles.includes(handle),
    [handles],
  );

  return {handles, toggle, has};
}
```

- [ ] **Step 2: Add heart button to ProductItem**

Replace the full contents of `app/components/ProductItem.tsx`:

```typescript
import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import {useWishlist} from '~/hooks/useWishlist';

export function ProductItem({
  product,
  loading,
}: {
  product:
    | CollectionItemFragment
    | ProductItemFragment
    | RecommendedProductFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  const isAvailable = 'availableForSale' in product ? product.availableForSale : true;
  const {has, toggle} = useWishlist();
  const wishlisted = has(product.handle);

  return (
    <div className="product-card-wrapper">
      <Link
        className="product-card"
        key={product.id}
        prefetch="intent"
        to={variantUrl}
      >
        <div className="product-card-image">
          {image && (
            <Image
              alt={image.altText || product.title}
              aspectRatio="1/1"
              data={image}
              loading={loading}
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            />
          )}
          {!isAvailable && (
            <span className="product-card-badge sold-out">Elfogyott</span>
          )}
        </div>
        <div className="product-card-info">
          {'vendor' in product && product.vendor && (
            <span className="product-card-artist">{product.vendor}</span>
          )}
          <h3 className="product-card-title">{product.title}</h3>
          <div className="product-card-price">
            <Money data={product.priceRange.minVariantPrice} />
          </div>
        </div>
      </Link>
      <button
        type="button"
        className={`wishlist-heart${wishlisted ? ' active' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(product.handle);
        }}
        aria-label={wishlisted ? 'Eltávolítás a kívánságlistáról' : 'Hozzáadás a kívánságlistához'}
      >
        <HeartIcon filled={wishlisted} />
      </button>
    </div>
  );
}

function HeartIcon({filled}: {filled: boolean}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
```

- [ ] **Step 3: Add wishlist heart CSS to app.css**

Append after the `.shop-sort-select:focus` block:

```css
/* ============================================
   Wishlist Heart Button
   ============================================ */
.product-card-wrapper {
  position: relative;
}

.wishlist-heart {
  position: absolute;
  top: 0.625rem;
  right: 0.625rem;
  z-index: 2;
  background: rgba(255, 255, 255, 0.92);
  border: none;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: color 0.2s ease, transform 0.15s ease, background 0.2s ease;
  backdrop-filter: blur(4px);
}

.wishlist-heart:hover {
  color: var(--color-ars-red);
  transform: scale(1.1);
}

.wishlist-heart.active {
  color: var(--color-ars-red);
}
```

- [ ] **Step 4: Type-check and commit**

```bash
cd /e/GIT/ARS && npx tsc --noEmit
```

Expected: no errors.

```bash
cd /e/GIT/ARS && git add app/hooks/useWishlist.ts app/components/ProductItem.tsx app/styles/app.css && git commit -m "feat: wishlist hook + heart icon on product cards"
```

---

## Task 3: Wishlist Page + API Resource Route + Footer Link

**Files:**
- Create: `app/routes/wishlist.tsx`
- Create: `app/routes/api.wishlist-products.tsx`
- Modify: `app/components/Footer.tsx`
- Modify: `app/styles/app.css`

**Context:** The wishlist page reads handles from localStorage client-side, then fetches product data from the API resource route `/api/wishlist-products?handles=handle1,handle2`. The resource route queries the Shopify storefront API. The page uses `useFetcher` to avoid a full navigation.

- [ ] **Step 1: Create the API resource route**

Create `app/routes/api.wishlist-products.tsx`:

```typescript
import type {Route} from './+types/api.wishlist-products';

export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const handlesParam = url.searchParams.get('handles') || '';
  const handles = handlesParam
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);

  if (handles.length === 0) {
    return Response.json({products: []});
  }

  // Fetch all products in parallel
  const results = await Promise.all(
    handles.map((handle) =>
      context.storefront
        .query(WISHLIST_PRODUCT_QUERY, {
          variables: {handle},
          cache: context.storefront.CacheShort(),
        })
        .then((data) => data.product)
        .catch(() => null),
    ),
  );

  const products = results.filter(Boolean);
  return Response.json({products});
}

const WISHLIST_PRODUCT_QUERY = `#graphql
  query WishlistProduct(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      handle
      title
      vendor
      availableForSale
      featuredImage {
        id
        altText
        url
        width
        height
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
    }
  }
` as const;
```

- [ ] **Step 2: Create the wishlist page route**

Create `app/routes/wishlist.tsx`:

```typescript
import {useEffect, useState} from 'react';
import {Link, useFetcher} from 'react-router';
import type {Route} from './+types/wishlist';
import {useWishlist} from '~/hooks/useWishlist';
import {ProductItem} from '~/components/ProductItem';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Kívánságlista | Ars Mosoris'}];
};

type WishlistProduct = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  availableForSale: boolean;
  featuredImage: {id: string; altText: string | null; url: string; width: number; height: number} | null;
  priceRange: {
    minVariantPrice: {amount: string; currencyCode: string};
    maxVariantPrice: {amount: string; currencyCode: string};
  };
};

export default function Wishlist() {
  const {handles} = useWishlist();
  const fetcher = useFetcher<{products: WishlistProduct[]}>();
  const [hydrated, setHydrated] = useState(false);

  // Mark as hydrated after mount so we don't flash empty state on SSR
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Fetch products whenever handles change
  useEffect(() => {
    if (!hydrated || handles.length === 0) return;
    const params = new URLSearchParams({handles: handles.join(',')});
    fetcher.load(`/api/wishlist-products?${params}`);
  }, [hydrated, handles.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const products: WishlistProduct[] = fetcher.data?.products ?? [];

  if (!hydrated) {
    return (
      <div className="section">
        <div className="container">
          <div className="wishlist-page">
            <h1>Kívánságlista</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container">
        <div className="wishlist-page">
          <h1>Kívánságlista</h1>
          {handles.length === 0 ? (
            <div className="wishlist-empty">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <h2>Még nincs mentett termék</h2>
              <p className="text-muted">
                Kattints a szív ikonra bármely terméknél, hogy ide mentsd.
              </p>
              <Link to="/collections/all" className="btn btn-primary">
                Böngéssz a boltban
              </Link>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <ProductItem key={product.id} product={product} loading="lazy" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add wishlist link to Footer Shop column**

In `app/components/Footer.tsx`, find the Shop column nav and add the wishlist link. The current Shop column is:

```tsx
<nav className="footer-links">
  <NavLink to="/collections/all">Minden termék</NavLink>
  {COLLECTION_TYPES.map((type) => (
    <NavLink key={type.value} to={`/collections/all?type=${type.value}`}>{type.label}</NavLink>
  ))}
</nav>
```

Replace it with:

```tsx
<nav className="footer-links">
  <NavLink to="/collections/all">Minden termék</NavLink>
  {COLLECTION_TYPES.map((type) => (
    <NavLink key={type.value} to={`/collections/all?type=${type.value}`}>{type.label}</NavLink>
  ))}
  <NavLink to="/wishlist">Kívánságlista</NavLink>
</nav>
```

- [ ] **Step 4: Add wishlist page CSS to app.css**

Append after the `.wishlist-heart.active` block:

```css
/* ============================================
   Wishlist Page
   ============================================ */
.wishlist-page h1 {
  margin-bottom: 2rem;
}

.wishlist-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 1rem;
  text-align: center;
  color: var(--color-text-muted);
}

.wishlist-empty h2 {
  font-size: 1.5rem;
  color: var(--color-text);
  margin: 0;
}

.wishlist-empty .btn {
  margin-top: 0.5rem;
}
```

- [ ] **Step 5: Type-check and commit**

```bash
cd /e/GIT/ARS && npx tsc --noEmit
```

Expected: no errors.

```bash
cd /e/GIT/ARS && git add app/routes/wishlist.tsx "app/routes/api.wishlist-products.tsx" app/components/Footer.tsx app/styles/app.css && git commit -m "feat: wishlist page, API resource route, footer link"
```

---

## Task 4: Back-in-Stock Notification

**Files:**
- Create: `app/routes/api.back-in-stock.tsx`
- Modify: `app/routes/products.$handle.tsx`
- Modify: `app/styles/app.css`

**Context:** When the currently selected variant is sold out (`selectedVariant.availableForSale === false`), a small email form appears below the add-to-cart button. It submits via `useFetcher` to `/api/back-in-stock`. The resource route sends two emails via Resend: a notification to the admin and a confirmation to the customer. This follows the exact same Resend pattern used in `contact.tsx`.

The product page already imports `useLoaderData, Await, Link` from `react-router`. You need to also import `useFetcher`.

- [ ] **Step 1: Create the resource route**

Create `app/routes/api.back-in-stock.tsx`:

```typescript
import type {Route} from './+types/api.back-in-stock';

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const productTitle = formData.get('productTitle') as string;
  const variantTitle = formData.get('variantTitle') as string;
  const productUrl = formData.get('productUrl') as string;

  if (!email) {
    return Response.json({success: false, error: 'Email required'}, {status: 400});
  }

  const apiKey = context.env.RESEND_API_KEY;
  const fromEmail = context.env.FROM_EMAIL;
  const contactEmail = context.env.CONTACT_EMAIL;

  if (!apiKey || !fromEmail) {
    // Email not configured — silently succeed so UX isn't broken
    return Response.json({success: true});
  }

  const sendEmail = async (payload: object) => {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[back-in-stock] Resend ${res.status}: ${await res.text()}`);
    }
  };

  try {
    await Promise.all([
      // Admin notification
      sendEmail({
        from: fromEmail,
        to: [contactEmail],
        subject: `[Értesítési kérés] ${productTitle} – ${variantTitle}`,
        text: `Visszatérési értesítési kérés\n\nTermék: ${productTitle}\nVariáns: ${variantTitle}\nEmail: ${email}\nURL: ${productUrl}`,
      }),
      // Customer confirmation
      sendEmail({
        from: fromEmail,
        to: [email],
        subject: `Értesítést kértél – ${productTitle}`,
        text: `Szia!\n\nAmint a(z) "${productTitle}" (${variantTitle}) ismét elérhető lesz, értesítünk!\n\nTermék: ${productUrl}\n\nÜdvözlet,\nArs Mosoris`,
      }),
    ]);
    return Response.json({success: true});
  } catch (err) {
    console.error('[back-in-stock] Exception:', err);
    return Response.json({success: false, error: 'Hiba történt'}, {status: 500});
  }
}
```

- [ ] **Step 2: Add the BackInStockForm component to the product page**

In `app/routes/products.$handle.tsx`, add `useFetcher` to the existing react-router import:

```typescript
import {Await, useLoaderData, Link, useFetcher} from 'react-router';
```

Then add the `BackInStockForm` component at the bottom of the file (before the GraphQL queries):

```typescript
function BackInStockForm({
  productTitle,
  variantTitle,
  productUrl,
}: {
  productTitle: string;
  variantTitle: string;
  productUrl: string;
}) {
  const fetcher = useFetcher<{success: boolean; error?: string}>();
  const submitted = fetcher.data?.success === true;

  if (submitted) {
    return (
      <div className="back-in-stock-success">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        Értesítünk, amint elérhető lesz!
      </div>
    );
  }

  return (
    <fetcher.Form method="post" action="/api/back-in-stock" className="back-in-stock-form">
      <input type="hidden" name="productTitle" value={productTitle} />
      <input type="hidden" name="variantTitle" value={variantTitle} />
      <input type="hidden" name="productUrl" value={productUrl} />
      <p className="back-in-stock-label">Értesítést kérek, ha ismét elérhető:</p>
      <div className="back-in-stock-row">
        <input
          type="email"
          name="email"
          placeholder="E-mail címed"
          required
          className="back-in-stock-input"
        />
        <button
          type="submit"
          className="btn btn-primary back-in-stock-btn"
          disabled={fetcher.state === 'submitting'}
        >
          {fetcher.state === 'submitting' ? '...' : 'Értesíts'}
        </button>
      </div>
      {fetcher.data?.error && (
        <p className="back-in-stock-error">{fetcher.data.error}</p>
      )}
    </fetcher.Form>
  );
}
```

- [ ] **Step 3: Render BackInStockForm on the product page when sold out**

In `products.$handle.tsx`, find the `Product` component. The `ProductForm` is rendered inside `.product-main`. After `<ProductForm .../>`, add the back-in-stock form conditionally. 

Find this block inside the `Product` component:

```tsx
<ProductForm
  productOptions={productOptions}
  selectedVariant={selectedVariant}
/>
```

Replace it with:

```tsx
<ProductForm
  productOptions={productOptions}
  selectedVariant={selectedVariant}
/>
{!selectedVariant?.availableForSale && (
  <BackInStockForm
    productTitle={title}
    variantTitle={selectedVariant?.title ?? ''}
    productUrl={canonicalUrl}
  />
)}
```

- [ ] **Step 4: Add back-in-stock CSS to app.css**

Append after the `.wishlist-empty .btn` block:

```css
/* ============================================
   Back-in-Stock Form
   ============================================ */
.back-in-stock-form {
  margin-top: 1rem;
  padding: 1.25rem;
  background: var(--color-background-alt);
  border: 1px solid var(--color-border);
}

.back-in-stock-label {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
  color: var(--color-text);
}

.back-in-stock-row {
  display: flex;
  gap: 0.5rem;
}

.back-in-stock-input {
  flex: 1;
  padding: 0.75rem 1rem;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  border: 1px solid var(--color-border);
  background: white;
  outline: none;
  transition: border-color 0.2s ease;
}

.back-in-stock-input:focus {
  border-color: var(--color-ars-dark);
}

.back-in-stock-btn {
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  white-space: nowrap;
}

.back-in-stock-success {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 1rem 1.25rem;
  background: var(--color-background-alt);
  border: 1px solid var(--color-border);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.back-in-stock-error {
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-ars-red);
}

@media (max-width: 480px) {
  .back-in-stock-row {
    flex-direction: column;
  }
}
```

- [ ] **Step 5: Type-check and commit**

```bash
cd /e/GIT/ARS && npx tsc --noEmit
```

Expected: no errors.

```bash
cd /e/GIT/ARS && git add "app/routes/api.back-in-stock.tsx" app/routes/products.\$handle.tsx app/styles/app.css && git commit -m "feat: back-in-stock email notification for sold-out variants"
```

---

## Task 5: Recently Viewed Products

**Files:**
- Create: `app/hooks/useRecentlyViewed.ts`
- Modify: `app/routes/products.$handle.tsx`
- Modify: `app/styles/app.css`

**Context:** Recently viewed products are stored in localStorage under `ars-recently-viewed` as a JSON array of slim product objects (handle, title, image URL, price). On product page mount, the current product is added to the front of the list (deduplicated). A strip of up to 4 items (excluding the current product) is rendered below the product details, above the Related Products section. The strip uses horizontal scroll on mobile.

- [ ] **Step 1: Create the useRecentlyViewed hook**

Create `app/hooks/useRecentlyViewed.ts`:

```typescript
import {useState, useEffect, useCallback} from 'react';

const STORAGE_KEY = 'ars-recently-viewed';
const MAX_ITEMS = 8;

export type RecentProduct = {
  handle: string;
  title: string;
  vendor: string;
  imageUrl: string | null;
  imageAlt: string | null;
  price: string;
  currencyCode: string;
};

function readStorage(): RecentProduct[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentProduct[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: RecentProduct[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Silently ignore quota/private-mode errors
  }
}

export function useRecentlyViewed(currentHandle?: string) {
  const [items, setItems] = useState<RecentProduct[]>([]);

  // Hydrate from localStorage after mount
  useEffect(() => {
    setItems(readStorage());
  }, []);

  const addItem = useCallback((product: RecentProduct) => {
    setItems((prev) => {
      // Remove existing entry for this handle (dedup), prepend new, cap at MAX_ITEMS
      const filtered = prev.filter((p) => p.handle !== product.handle);
      const next = [product, ...filtered].slice(0, MAX_ITEMS);
      writeStorage(next);
      return next;
    });
  }, []);

  // Items to display: exclude current product, limit to 4
  const displayItems = items
    .filter((p) => p.handle !== currentHandle)
    .slice(0, 4);

  return {items, addItem, displayItems};
}
```

- [ ] **Step 2: Integrate useRecentlyViewed into the product page**

In `app/routes/products.$handle.tsx`, add the import:

```typescript
import {useRecentlyViewed, type RecentProduct} from '~/hooks/useRecentlyViewed';
```

In the `Product` component, after the `useSelectedOptionInUrlParam` call, add:

```typescript
const {addItem, displayItems: recentItems} = useRecentlyViewed(product.handle);

// Write current product to recently viewed on mount
useEffect(() => {
  const item: RecentProduct = {
    handle: product.handle,
    title: product.title,
    vendor: product.vendor ?? '',
    imageUrl: selectedVariant?.image?.url ?? product.selectedOrFirstAvailableVariant?.image?.url ?? null,
    imageAlt: selectedVariant?.image?.altText ?? null,
    price: selectedVariant?.price.amount ?? '0',
    currencyCode: selectedVariant?.price.currencyCode ?? 'HUF',
  };
  addItem(item);
}, [product.handle]); // eslint-disable-line react-hooks/exhaustive-deps
```

Also add `useEffect` to the react-router import line. The current import is:

```typescript
import {Await, useLoaderData, Link, useFetcher} from 'react-router';
```

Add `useEffect` from React:

```typescript
import {useEffect} from 'react';
```

- [ ] **Step 3: Add the RecentlyViewed section to the Product component JSX**

In the `Product` component, find the `<Suspense>` block that renders `<RelatedProducts>`. Add the recently viewed strip **before** that block:

```tsx
{recentItems.length >= 1 && (
  <RecentlyViewedStrip items={recentItems} />
)}

<Suspense fallback={null}>
  ...existing RelatedProducts...
</Suspense>
```

- [ ] **Step 4: Add the RecentlyViewedStrip component**

Add this component to `app/routes/products.$handle.tsx` (after the `RelatedProducts` function):

```typescript
function RecentlyViewedStrip({items}: {items: RecentProduct[]}) {
  return (
    <section className="section recently-viewed-section">
      <div className="container">
        <h2 className="recently-viewed-title">Nemrég megnézted</h2>
        <div className="recently-viewed-strip">
          {items.map((item) => (
            <Link
              key={item.handle}
              to={`/products/${item.handle}`}
              className="recently-viewed-card"
              prefetch="intent"
            >
              <div className="recently-viewed-image">
                {item.imageUrl ? (
                  <img
                    src={`${item.imageUrl}${item.imageUrl.includes('?') ? '&' : '?'}width=300`}
                    alt={item.imageAlt || item.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="recently-viewed-placeholder" />
                )}
              </div>
              <div className="recently-viewed-info">
                {item.vendor && (
                  <span className="recently-viewed-vendor">{item.vendor}</span>
                )}
                <p className="recently-viewed-name">{item.title}</p>
                <p className="recently-viewed-price">
                  {parseFloat(item.price).toLocaleString('hu-HU')} {item.currencyCode}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Add recently-viewed CSS to app.css**

Append after the `.back-in-stock-error` block:

```css
/* ============================================
   Recently Viewed Strip
   ============================================ */
.recently-viewed-section {
  background: var(--color-background-alt);
}

.recently-viewed-title {
  font-size: clamp(1.25rem, 2.5vw, 1.5rem);
  margin-bottom: 1.5rem;
}

.recently-viewed-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

@media (max-width: 767px) {
  .recently-viewed-strip {
    display: flex;
    gap: 1rem;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 0.5rem;
  }
  .recently-viewed-strip::-webkit-scrollbar {
    display: none;
  }
}

.recently-viewed-card {
  display: block;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s ease;
  scroll-snap-align: start;
  min-width: 160px;
}

.recently-viewed-card:hover {
  opacity: 0.8;
}

.recently-viewed-image {
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--color-border);
  margin-bottom: 0.75rem;
}

.recently-viewed-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recently-viewed-placeholder {
  width: 100%;
  height: 100%;
  background: var(--color-border);
}

.recently-viewed-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.recently-viewed-vendor {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.recently-viewed-name {
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0;
  line-height: 1.3;
}

.recently-viewed-price {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
}
```

- [ ] **Step 6: Type-check and commit**

```bash
cd /e/GIT/ARS && npx tsc --noEmit
```

Expected: no errors.

```bash
cd /e/GIT/ARS && git add app/hooks/useRecentlyViewed.ts app/routes/products.\$handle.tsx app/styles/app.css && git commit -m "feat: recently viewed products strip on product page"
```

---

## Self-Review Checklist

**Spec coverage:**
- Feature 1 (filter+sort): Tasks 1 covers sort. Filter already existed — ✓
- Feature 2 (artist live products): Already implemented before this plan — skipped intentionally ✓
- Feature 3 (wishlist): Tasks 2 (hook + heart icon) + Task 3 (page + API + footer) ✓
- Feature 4 (back-in-stock): Task 4 ✓
- Feature 5 (recently viewed): Task 5 ✓

**Type consistency check:**
- `useWishlist` exports `{handles, toggle, has}` — used consistently in `ProductItem` ✓
- `useRecentlyViewed` exports `{items, addItem, displayItems}` — destructured as `{addItem, displayItems: recentItems}` ✓
- `RecentProduct` type exported from hook and imported on product page ✓
- `WishlistProduct` type defined inline in `wishlist.tsx` — matches GraphQL response fields ✓
- `BackInStockForm` props match usage at call site ✓
