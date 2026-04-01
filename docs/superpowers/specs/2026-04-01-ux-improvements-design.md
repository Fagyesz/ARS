# UX Improvements Design — Ars Mosoris

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** Add 8 UX features: toast notifications, sticky add-to-cart bar, product image gallery, predictive search images, mobile bottom nav, skeleton loading, sort on collection pages, and empty cart suggestions.

**Architecture:** All features are self-contained. Toast uses React context in PageLayout. Sticky cart uses IntersectionObserver on the product page. Gallery reuses ImageSlider. Bottom nav is a new component in PageLayout. No new npm dependencies.

**Tech Stack:** React Router v7, Shopify Hydrogen, TypeScript, CSS custom properties

---

## Feature 1: Toast Notification System

**Files:**
- Create: `app/components/Toast.tsx` — context + provider + UI component
- Modify: `app/components/PageLayout.tsx` — wrap with ToastProvider
- Modify: `app/components/ProductItem.tsx` — fire toast on wishlist toggle
- Modify: `app/components/AddToCartButton.tsx` — fire toast on successful add
- Modify: `app/styles/app.css`

### ToastContext API
```ts
type Toast = { id: string; message: string; type: 'success' | 'info' };
type ToastContextValue = { addToast: (message: string, type?: Toast['type']) => void };
```

### Toast component
- Fixed position: bottom-right on desktop, bottom-center on mobile
- Slides up from bottom, fades out after 3 seconds
- Stacks (max 3 visible)
- Z-index above everything

### Trigger points
- Wishlist toggle in `ProductItem`: "Kívánságlistához adva ♥" / "Eltávolítva a kívánságlistáról"
- Add to cart success in `AddToCartButton`: detect `fetcher.state` transition from `'submitting'` → `'idle'` with no errors, fire "Kosárba helyezve!"

### Implementation note
`AddToCartButton` renders inside `CartForm` which uses a fetcher. Detect success by watching `fetcher.state` transition from submitting to idle via `useEffect` comparing previous state.

---

## Feature 2: Sticky Add-to-Cart Bar

**Files:**
- Modify: `app/routes/products.$handle.tsx`
- Modify: `app/styles/app.css`

### Behaviour
- `IntersectionObserver` watches the `.add-to-cart-btn` element
- When the button scrolls out of view → `stickyVisible = true`
- A `<StickyCartBar>` fixed at the bottom of the viewport slides in
- Bar contains: product title (truncated) + selected variant title + price + KOSÁRBA button
- The sticky button wraps `<AddToCartButton>` with the same `lines` prop
- Dismisses when original button re-enters viewport

### StickyCartBar component (in products.$handle.tsx)
```tsx
function StickyCartBar({ visible, title, variantTitle, price, lines })
```
- `visible` controls CSS class `sticky-cart-bar--visible` which triggers slide-up animation
- Uses `position: fixed; bottom: 0; left: 0; right: 0; z-index: 50`
- On mobile: full width. On desktop: matches container width, centered.

---

## Feature 3: Product Image Gallery

**Files:**
- Modify: `app/routes/products.$handle.tsx` — add `images` to PRODUCT_FRAGMENT + pass to gallery
- Modify: `app/styles/app.css`

### Behaviour
- Add `images(first: 10) { nodes { id url altText width height } }` to `PRODUCT_FRAGMENT`
- In the `Product` component, build `gallerySlides` from `product.images.nodes`
- If `selectedVariant.image` exists and isn't already in the images list, prepend it
- Pass slides to `<ImageSlider>` (already imported via `ProductImage`) replacing the single `<ProductImage>`
- Single image → show as before (no slider chrome)
- Multiple images → full `ImageSlider` with thumbnails

### Change to Product component layout
Replace `<ProductImage image={selectedVariant?.image} productTitle={product.title} />` with:
```tsx
<ProductGallery images={product.images.nodes} selectedImage={selectedVariant?.image} productTitle={product.title} />
```

`ProductGallery` is a new small function in the same file that deduplicates images and delegates to `ImageSlider`.

---

## Feature 4: Predictive Search with Product Images

**Files:**
- Modify: `app/components/SearchResultsPredictive.tsx` — update `SearchResultsPredictiveProducts` to show images
- Modify: `app/lib/search.ts` — add `featuredImage` to predictive search product query
- Modify: `app/styles/app.css`

### Current state
`SearchResultsPredictiveProducts` renders product titles as plain text links. Products in the predictive search result type already have `featuredImage` if the query requests it.

### Change
- Add `featuredImage { url altText }` to the predictive products query in `app/lib/search.ts`
- In `SearchResultsPredictiveProducts`, render a 48×48 image thumbnail beside each result
- Style: flex row, image left, title + vendor right

---

## Feature 5: Mobile Bottom Navigation Bar

**Files:**
- Modify: `app/components/PageLayout.tsx` — add `<MobileBottomNav>` component
- Modify: `app/styles/app.css`

### Component
```tsx
function MobileBottomNav({ cart }: { cart: PageLayoutProps['cart'] })
```
- Fixed at bottom, `display: flex`, 5 equal-width items, only visible on `<768px`
- Items: Home (`/`), Shop (`/collections/all`), Search (opens search aside), Wishlist (`/wishlist`), Cart (opens cart aside with badge)
- Cart badge shows item count (reuse `useOptimisticCart` pattern from CartBadge in Header)
- Active state: current route highlighted in `--color-primary`
- Body gets `padding-bottom: 64px` on mobile to prevent content hiding

### Body padding
Add to CSS:
```css
@media (max-width: 767px) {
  body { padding-bottom: 64px; }
}
```
This must NOT conflict with the `overflow: hidden` body lock (only applies when nav is closed).

---

## Feature 6: Skeleton Loading on Collections

**Files:**
- Modify: `app/routes/collections.all.tsx`
- Modify: `app/routes/collections.$handle.tsx`
- Modify: `app/styles/app.css`

### Behaviour
- Import `useNavigation` from `react-router`
- When `navigation.state === 'loading'` and `navigation.location.pathname` starts with `/collections`, show `<ProductGridSkeleton>` instead of the product grid
- `ProductGridSkeleton` already exists on `_index.tsx` — copy the pattern (12 cards for collections)

### Skeleton card CSS
Add CSS animation `@keyframes skeleton-pulse` with opacity/background shimmer.

---

## Feature 7: Sort Controls on /collections/$handle

**Files:**
- Modify: `app/routes/collections.$handle.tsx`
- Modify: `app/styles/app.css` (already has `.shop-sort-select` from Task 1)

### Same pattern as collections.all.tsx
- Read `?sort=` param in loader
- Map to `sortKey` + `reverse` via `parseSortKey`
- Add `sortKey`/`reverse` variables to `COLLECTION_QUERY`
- Add sort `<select>` above the product grid
- `buildSortUrl` helper preserves existing pagination params

---

## Feature 8: Empty Cart Product Suggestions

**Files:**
- Modify: `app/components/CartMain.tsx`
- Modify: `app/styles/app.css`

### Behaviour
- In `CartEmpty`, use `useFetcher` to load `/api/wishlist-products?handles=` — no, wrong approach
- Use a new resource route approach: fetch 4 recommended products via `useFetcher` calling `/api/featured-products`
- Create `app/routes/api.featured-products.tsx` — returns 4 products sorted by UPDATED_AT
- `CartEmpty` renders a mini 2×2 product grid with images, titles, prices (no heart, no sold-out badge needed here)
- Only loads products after hydration (SSR-safe)

### api.featured-products.tsx
```ts
// Returns { products: ProductItem[] }
// Query: products(first: 4, sortKey: UPDATED_AT, reverse: true)
```
