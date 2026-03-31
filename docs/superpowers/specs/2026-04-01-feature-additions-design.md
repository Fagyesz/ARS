# Feature Additions Design — Ars Mosoris

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 5 independent e-commerce features: collection filtering/sorting, artist profile live products, local wishlist, back-in-stock notifications, and recently viewed products.

**Architecture:** All features are self-contained. Features 3 and 5 use localStorage via custom hooks. Features 1 and 2 use Shopify Storefront API. Feature 4 uses the existing Resend integration. No new npm dependencies required.

**Tech Stack:** React Router v7, Shopify Hydrogen, TypeScript, Resend (already installed)

---

## Feature 1: Collection Filter + Sort Bar

**Files:**
- Modify: `app/routes/collections.$handle.tsx`
- Modify: `app/routes/collections.all.tsx`
- Modify: `app/styles/app.css`

### Behaviour
- A toolbar renders above the product grid with:
  - **Sort**: Newest (default), Price ↑, Price ↓, Title A–Z
  - **Filter**: Artist (vendor), Product type (Póló / Táska), In-stock only
- All state is in URL search params (`?sort=price-asc&vendor=Ancsa&type=polo&available=true`)
- Changing a control updates the URL and re-runs the loader (server-side filtering via Shopify API)
- On mobile: controls collapse into a single "Szűrés / Rendezés" button that expands them

### Shopify API mapping
```
sort param → sortKey + reverse
  newest        → CREATED_AT, reverse: true
  price-asc     → PRICE, reverse: false
  price-desc    → PRICE, reverse: true
  title-asc     → TITLE, reverse: false

filter params → filters array
  vendor=Ancsa  → { productVendor: "Ancsa" }
  type=polo     → { productType: "polo" }
  available=true → { available: true }
```

### GraphQL query change
Add `sortKey`, `reverse`, and `filters` variables to the existing `COLLECTION_QUERY`:
```graphql
products(
  first: $first
  last: $last
  before: $startCursor
  after: $endCursor
  sortKey: $sortKey
  reverse: $reverse
  filters: $filters
)
```

---

## Feature 2: Artist Profile — Live Products

**Files:**
- Modify: `app/routes/artists.$handle.tsx`

### Behaviour
- The loader reads `params.handle`, finds the matching artist from `ARTISTS` array, then queries Shopify for products where `vendor` matches `artist.fullName`
- Renders a product grid below the existing bio section using the existing `ProductItem` component
- If no products found, renders nothing (no empty state needed — artists always have products before go-live)

### GraphQL query (new, added to the file)
```graphql
query ArtistProducts($vendor: String!, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  products(first: 8, query: $vendor) {
    nodes {
      ...ProductItem
    }
  }
}
```

Use `cache: storefront.CacheLong()` since artist products change rarely.

---

## Feature 3: Local Wishlist

**Files:**
- Create: `app/hooks/useWishlist.ts`
- Create: `app/routes/wishlist.tsx`
- Modify: `app/components/ProductItem.tsx` (add heart icon)
- Modify: `app/routes/products.$handle.tsx` (add heart icon near title)
- Modify: `app/styles/app.css`

### Hook: `useWishlist`
```ts
// localStorage key: 'ars-wishlist'
// Returns: { handles: string[], toggle(handle): void, has(handle): boolean }
```
- Uses `useState` initialized from `localStorage.getItem('ars-wishlist')`
- On toggle: updates state + writes back to localStorage
- SSR-safe: initialize to `[]` on server, hydrate on client via `useEffect`

### Heart icon
- Rendered as an absolutely-positioned button on product card image (top-right corner)
- Filled red when wishlisted, outline when not
- Also shown next to the `<h1>` on the product detail page

### `/wishlist` route
- Loader: reads nothing (wishlist is client-side)
- Component: reads handles from localStorage via `useWishlist`, then uses `useFetcher` to load product data for each handle from a new resource route `app/routes/api.wishlist-products.tsx`
- The resource route accepts `?handles=handle1,handle2` and returns product data
- Empty state: "Még nincs mentett termék. Böngéssz a boltban!" with a link to `/collections/all`

### Footer nav
Add `<NavLink to="/wishlist">Kívánságlista</NavLink>` to the Shop column in `Footer.tsx`

---

## Feature 4: Back-in-Stock Notification

**Files:**
- Modify: `app/routes/products.$handle.tsx`
- Create: `app/routes/api.back-in-stock.tsx`

### Behaviour
- When `selectedVariant.availableForSale === false`, render a small form below the Add to Cart button:
  ```
  [email input] [Értesíts, ha elérhető]
  ```
- On submit: POST to `/api/back-in-stock` with `{ email, productTitle, variantTitle, productUrl }`
- The resource route sends two emails via Resend:
  1. To admin (`CONTACT_EMAIL`): "Back-in-stock request for [Product] / [Variant] from [email]"
  2. To user: "Értesítünk, amint [Product] elérhető lesz"
- Success state: replaces form with "Értesítünk, amint elérhető lesz!"
- Uses `useFetcher` so the form submits without a full page reload

### Resource route: `api.back-in-stock.tsx`
```ts
export async function action({ request, context }) {
  // parse formData: email, productTitle, variantTitle, productUrl
  // send two Resend emails (same pattern as contact.tsx)
  // return { success: true } or { success: false, error: string }
}
```

---

## Feature 5: Recently Viewed

**Files:**
- Create: `app/hooks/useRecentlyViewed.ts`
- Modify: `app/routes/products.$handle.tsx`
- Modify: `app/styles/app.css`

### Hook: `useRecentlyViewed`
```ts
// localStorage key: 'ars-recently-viewed'
// Stores: array of { handle, title, image, price } (last 8, most recent first)
// Returns: { items, addItem(product) }
```
- SSR-safe: `[]` on server, hydrates on client
- Max 8 items. Adding an existing handle moves it to front (deduplication).

### Integration on product page
- On mount: call `addItem({ handle, title, image: featuredImage, price: minVariantPrice })`
- Render a "Nemrég megnézted" horizontal strip below the product details, above Related Products
- Only shows if there are ≥ 2 items (current product excluded from display)
- Uses existing `ProductItem` component in a horizontal scroll container on mobile

---

## Shared CSS additions

All new UI elements follow the existing design system:
- Filter toolbar: `display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 2rem`
- Wishlist heart button: `position: absolute; top: 0.75rem; right: 0.75rem; background: white; border-radius: 50%; padding: 0.5rem`
- Back-in-stock form: inline form below the add-to-cart button, same input/button styles as newsletter form
- Recently viewed strip: horizontal scroll on mobile, grid on desktop (reuses `.products-grid` pattern)
