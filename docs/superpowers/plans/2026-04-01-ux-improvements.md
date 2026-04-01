# UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8 UX improvements: toast notifications, sticky cart bar, product image gallery, search polish, mobile bottom nav, skeleton loading, sort on collection pages, empty cart suggestions.

**Architecture:** Toast uses React context in PageLayout. Sticky cart uses IntersectionObserver. Gallery reuses existing ImageSlider. Bottom nav is a new component in PageLayout. No new npm dependencies.

**Tech Stack:** React Router v7, Shopify Hydrogen, TypeScript

**Note:** `npx tsc --noEmit` is the verification command. No test runner. Working directory: `e:/GIT/ARS`.

---

## File Map

| File | Action |
|------|--------|
| `app/components/Toast.tsx` | Create — context + provider + UI |
| `app/components/PageLayout.tsx` | Modify — ToastProvider wrap + MobileBottomNav |
| `app/components/ProductItem.tsx` | Modify — fire toast on wishlist toggle |
| `app/components/AddToCartButton.tsx` | Modify — fire toast on add success |
| `app/components/CartMain.tsx` | Modify — empty cart product suggestions |
| `app/routes/api.featured-products.tsx` | Create — returns 4 recommended products |
| `app/routes/products.$handle.tsx` | Modify — sticky cart bar + product gallery |
| `app/routes/collections.$handle.tsx` | Modify — sort controls |
| `app/routes/collections.all.tsx` | Modify — skeleton loading |
| `app/styles/app.css` | Modify — all new styles |

---

## Task 1: Toast Notification System

**Files:**
- Create: `app/components/Toast.tsx`
- Modify: `app/components/PageLayout.tsx`
- Modify: `app/components/ProductItem.tsx`
- Modify: `app/components/AddToCartButton.tsx`
- Modify: `app/styles/app.css`

- [ ] **Step 1: Create app/components/Toast.tsx**

```typescript
import {createContext, useContext, useState, useCallback, useEffect, useRef} from 'react';

export type ToastMessage = {
  id: string;
  message: string;
  type: 'success' | 'info';
};

type ToastContextValue = {
  addToast: (message: string, type?: ToastMessage['type']) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({children}: {children: React.ReactNode}) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-2), {id, message, type}]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{addToast}}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastContainer({toasts}: {toasts: ToastMessage[]}) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Wrap PageLayout with ToastProvider**

In `app/components/PageLayout.tsx`, add the import:
```typescript
import {ToastProvider} from '~/components/Toast';
```

In `PageLayout`, wrap `<Aside.Provider>` with `<ToastProvider>`:
```tsx
return (
  <ToastProvider>
    <Aside.Provider>
      ...existing content...
    </Aside.Provider>
  </ToastProvider>
);
```

- [ ] **Step 3: Fire toast in ProductItem on wishlist toggle**

In `app/components/ProductItem.tsx`, add import:
```typescript
import {useToast} from '~/components/Toast';
```

In the `ProductItem` component, add:
```typescript
const {addToast} = useToast();
```

Update the heart button `onClick`:
```tsx
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  toggle(product.handle);
  addToast(
    wishlisted ? 'Eltávolítva a kívánságlistáról' : 'Kívánságlistához adva ♥',
    'success',
  );
}}
```

- [ ] **Step 4: Fire toast in AddToCartButton on success**

In `app/components/AddToCartButton.tsx`, add imports:
```typescript
import {useEffect, useRef} from 'react';
import {useToast} from '~/components/Toast';
```

Inside the `AddToCartButton` component (before the return), add:
```typescript
const {addToast} = useToast();
```

Inside the `CartForm` render function, add a success detector:
```tsx
{(fetcher: FetcherWithComponents<any>) => {
  const prevState = useRef(fetcher.state);
  useEffect(() => {
    if (prevState.current === 'submitting' && fetcher.state === 'idle' && !fetcher.data?.errors?.length) {
      addToast('Kosárba helyezve!', 'success');
    }
    prevState.current = fetcher.state;
  }, [fetcher.state]);

  return (
    <>
      <input name="analytics" type="hidden" value={JSON.stringify(analytics)} />
      <button
        type="submit"
        onClick={onClick}
        disabled={disabled ?? fetcher.state !== 'idle'}
        className="add-to-cart-btn"
      >
        {fetcher.state === 'submitting' ? 'Hozzáadás...' : children}
      </button>
    </>
  );
}}
```

**Important:** `useRef` and `useEffect` cannot be called inside a render prop directly in older React rules. Instead, extract the inner content to a named component `AddToCartInner` that receives `fetcher` as a prop.

The corrected structure:

```typescript
import {useEffect, useRef} from 'react';
import {type FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import {useToast} from '~/components/Toast';

function AddToCartInner({
  fetcher,
  analytics,
  children,
  disabled,
  onClick,
}: {
  fetcher: FetcherWithComponents<any>;
  analytics?: unknown;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const {addToast} = useToast();
  const prevState = useRef(fetcher.state);

  useEffect(() => {
    if (
      prevState.current === 'submitting' &&
      fetcher.state === 'idle' &&
      !fetcher.data?.errors?.length
    ) {
      addToast('Kosárba helyezve!', 'success');
    }
    prevState.current = fetcher.state;
  }, [fetcher.state, addToast]);

  return (
    <>
      <input name="analytics" type="hidden" value={JSON.stringify(analytics)} />
      <button
        type="submit"
        onClick={onClick}
        disabled={disabled ?? fetcher.state !== 'idle'}
        className="add-to-cart-btn"
      >
        {fetcher.state === 'submitting' ? 'Hozzáadás...' : children}
      </button>
    </>
  );
}

export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
}: {
  analytics?: unknown;
  children: React.ReactNode;
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
  onClick?: () => void;
}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<any>) => (
        <AddToCartInner
          fetcher={fetcher}
          analytics={analytics}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </AddToCartInner>
      )}
    </CartForm>
  );
}
```

- [ ] **Step 5: Add toast CSS**

Append to `app/styles/app.css`:

```css
/* ============================================
   Toast Notifications
   ============================================ */
.toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

@media (max-width: 767px) {
  .toast-container {
    bottom: 5rem;
    right: 1rem;
    left: 1rem;
    align-items: center;
  }
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--color-ars-dark);
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: var(--font-sans);
  border-radius: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  animation: toast-in 0.25s ease;
  max-width: 320px;
}

.toast-success {
  background: var(--color-ars-dark);
  border-left: 3px solid var(--color-ars-red);
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 6: Type-check and commit**

```bash
cd /e/GIT/ARS && npx tsc --noEmit
git add app/components/Toast.tsx app/components/PageLayout.tsx app/components/ProductItem.tsx app/components/AddToCartButton.tsx app/styles/app.css
git commit -m "feat: toast notification system for wishlist and add-to-cart"
```

---

## Task 2: Sticky Add-to-Cart Bar

**Files:**
- Modify: `app/routes/products.$handle.tsx`
- Modify: `app/styles/app.css`

- [ ] **Step 1: Add StickyCartBar component and hook to products.$handle.tsx**

Read the current `app/routes/products.$handle.tsx`. Add `useState` and `useRef` to the existing React import. Then add this component before the GraphQL constants:

```typescript
function StickyCartBar({
  visible,
  title,
  variantTitle,
  price,
  currencyCode,
  lines,
  selectedVariant,
}: {
  visible: boolean;
  title: string;
  variantTitle: string;
  price: string;
  currencyCode: string;
  lines: Array<{merchandiseId: string; quantity: number}>;
  selectedVariant: {availableForSale: boolean};
}) {
  if (!selectedVariant.availableForSale) return null;

  return (
    <div className={`sticky-cart-bar${visible ? ' sticky-cart-bar--visible' : ''}`}>
      <div className="container sticky-cart-bar-inner">
        <div className="sticky-cart-bar-info">
          <span className="sticky-cart-bar-title">{title}</span>
          {variantTitle && variantTitle !== 'Default Title' && (
            <span className="sticky-cart-bar-variant">{variantTitle}</span>
          )}
          <span className="sticky-cart-bar-price">
            {parseFloat(price).toLocaleString('hu-HU')} {currencyCode}
          </span>
        </div>
        <AddToCartButton lines={lines} disabled={!selectedVariant.availableForSale}>
          KOSÁRBA
        </AddToCartButton>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire IntersectionObserver in the Product component**

In the `Product` component, add after the existing hooks:

```typescript
const [stickyVisible, setStickyVisible] = useState(false);
const addToCartRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const el = addToCartRef.current;
  if (!el) return;
  const observer = new IntersectionObserver(
    ([entry]) => setStickyVisible(!entry.isIntersecting),
    {threshold: 0},
  );
  observer.observe(el);
  return () => observer.disconnect();
}, []);
```

- [ ] **Step 3: Wrap ProductForm with a ref div and add StickyCartBar to JSX**

Wrap the `<ProductForm>` in a `<div ref={addToCartRef}>`:

```tsx
<div ref={addToCartRef}>
  <ProductForm
    productOptions={productOptions}
    selectedVariant={selectedVariant}
  />
  {!selectedVariant?.availableForSale && (
    <BackInStockForm ... />
  )}
</div>
```

Add `<StickyCartBar>` just before the closing `</>` of the Product component return:

```tsx
<StickyCartBar
  visible={stickyVisible}
  title={title}
  variantTitle={selectedVariant?.title ?? ''}
  price={selectedVariant?.price.amount ?? '0'}
  currencyCode={selectedVariant?.price.currencyCode ?? 'HUF'}
  lines={
    selectedVariant
      ? [{merchandiseId: selectedVariant.id, quantity: 1}]
      : []
  }
  selectedVariant={{availableForSale: selectedVariant?.availableForSale ?? false}}
/>
```

- [ ] **Step 4: Add sticky cart CSS**

Append to `app/styles/app.css`:

```css
/* ============================================
   Sticky Add-to-Cart Bar
   ============================================ */
.sticky-cart-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  background: white;
  border-top: 1px solid var(--color-border);
  box-shadow: 0 -4px 24px rgba(0,0,0,0.08);
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.sticky-cart-bar--visible {
  transform: translateY(0);
}

.sticky-cart-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

.sticky-cart-bar-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.sticky-cart-bar-title {
  font-weight: 600;
  font-size: 0.9375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

.sticky-cart-bar-variant {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.sticky-cart-bar-price {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-primary);
}

.sticky-cart-bar .add-to-cart-btn {
  white-space: nowrap;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
}

@media (max-width: 767px) {
  .sticky-cart-bar--visible {
    bottom: 64px;
  }
}
```

- [ ] **Step 5: Type-check and commit**

```bash
cd /e/GIT/ARS && npx tsc --noEmit
git add "app/routes/products.\$handle.tsx" app/styles/app.css
git commit -m "feat: sticky add-to-cart bar on product page"
```

---

## Task 3: Product Image Gallery

**Files:**
- Modify: `app/routes/products.$handle.tsx`
- Modify: `app/styles/app.css`

**Context:** `PRODUCT_FRAGMENT` currently requests no top-level `images` field. `ProductImage` component renders a single image. We'll add `images(first: 10)` to the fragment, then replace `<ProductImage>` with a `<ProductGallery>` component that reuses `<ImageSlider>`.

`ImageSlider` is already imported at the top of the article page. We need to import it in products.$handle.tsx too.

- [ ] **Step 1: Add images to PRODUCT_FRAGMENT**

In `app/routes/products.$handle.tsx`, find `PRODUCT_FRAGMENT`. It currently does not have an `images` field. Add it after the `seo` field:

```graphql
images(first: 10) {
  nodes {
    id
    url
    altText
    width
    height
  }
}
```

- [ ] **Step 2: Add ImageSlider import**

Add to the imports at the top of `app/routes/products.$handle.tsx`:

```typescript
import {ImageSlider} from '~/components/ImageSlider';
```

- [ ] **Step 3: Add ProductGallery component**

Add this function before the `SizeGuide` component:

```typescript
function ProductGallery({
  images,
  selectedImage,
  productTitle,
}: {
  images: Array<{id: string; url: string; altText: string | null; width: number | null; height: number | null}>;
  selectedImage: {url: string; altText: string | null} | null | undefined;
  productTitle: string;
}) {
  // Build deduplicated slide list: selected variant image first, then rest
  const seen = new Set<string>();
  const slides: {url: string; alt: string}[] = [];

  if (selectedImage?.url) {
    seen.add(selectedImage.url);
    slides.push({url: selectedImage.url, alt: selectedImage.altText || productTitle});
  }

  for (const img of images) {
    if (!seen.has(img.url)) {
      seen.add(img.url);
      slides.push({url: img.url, alt: img.altText || productTitle});
    }
  }

  if (slides.length === 0) return null;

  return (
    <div className="product-gallery">
      <ImageSlider slides={slides} />
    </div>
  );
}
```

- [ ] **Step 4: Replace ProductImage with ProductGallery in the Product component**

Find in the `Product` component:

```tsx
<ProductImage image={selectedVariant?.image} productTitle={product.title} />
```

Replace with:

```tsx
<ProductGallery
  images={product.images.nodes}
  selectedImage={selectedVariant?.image}
  productTitle={product.title}
/>
```

- [ ] **Step 5: Add gallery CSS**

Append to `app/styles/app.css`:

```css
/* ============================================
   Product Gallery
   ============================================ */
.product-gallery {
  width: 100%;
}

.product-gallery .slider-single img,
.product-gallery .slider-slide img {
  object-fit: contain;
  background: var(--color-background-alt);
}
```

- [ ] **Step 6: Type-check and commit**

The TypeScript compiler may warn about `product.images` not existing on the fragment type until codegen runs. If you get an error about `images` not existing on the `Product` type, add `// @ts-ignore` above the line as a temporary workaround.

```bash
cd /e/GIT/ARS && npx tsc --noEmit
git add "app/routes/products.\$handle.tsx" app/styles/app.css
git commit -m "feat: product image gallery using ImageSlider"
```

---

## Task 4: Mobile Bottom Navigation Bar

**Files:**
- Modify: `app/components/PageLayout.tsx`
- Modify: `app/styles/app.css`

- [ ] **Step 1: Add MobileBottomNav component to PageLayout.tsx**

Add the following imports to `app/components/PageLayout.tsx`:

```typescript
import {Suspense} from 'react';
import {Await, Link, NavLink, useLocation} from 'react-router';
import {useOptimisticCart} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
```

Note: some of these may already be imported — only add what's missing.

Add the `MobileBottomNav` component:

```typescript
function MobileBottomNavInner({cart: originalCart}: {cart: CartApiQueryFragment | null}) {
  const cart = useOptimisticCart(originalCart);
  const count = cart?.totalQuantity ?? 0;
  const {open} = useAside();
  const location = useLocation();

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobil navigáció">
      <NavLink to="/" end className={({isActive}) => `mobile-nav-item${isActive ? ' active' : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Főoldal</span>
      </NavLink>
      <NavLink to="/collections/all" className={({isActive}) => `mobile-nav-item${isActive ? ' active' : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="7" height="7"/><rect x="15" y="3" width="7" height="7"/>
          <rect x="15" y="15" width="7" height="7"/><rect x="2" y="15" width="7" height="7"/>
        </svg>
        <span>Shop</span>
      </NavLink>
      <button
        className="mobile-nav-item"
        onClick={() => open('search')}
        aria-label="Keresés"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span>Keresés</span>
      </button>
      <NavLink to="/wishlist" className={({isActive}) => `mobile-nav-item${isActive ? ' active' : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <span>Kedvencek</span>
      </NavLink>
      <button
        className="mobile-nav-item"
        onClick={() => open('cart')}
        aria-label="Kosár"
      >
        <span className="mobile-nav-cart-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          {count > 0 && <span className="mobile-nav-badge">{count}</span>}
        </span>
        <span>Kosár</span>
      </button>
    </nav>
  );
}

function MobileBottomNav({cart}: {cart: Promise<CartApiQueryFragment | null>}) {
  return (
    <Suspense fallback={<MobileBottomNavInner cart={null} />}>
      <Await resolve={cart}>
        {(resolvedCart) => <MobileBottomNavInner cart={resolvedCart} />}
      </Await>
    </Suspense>
  );
}
```

- [ ] **Step 2: Add MobileBottomNav to PageLayout JSX**

In the `PageLayout` function, add `<MobileBottomNav cart={cart} />` after `<Footer>`:

```tsx
<Footer footer={footer} header={header} publicStoreDomain={publicStoreDomain} env={env} />
<MobileBottomNav cart={cart} />
```

- [ ] **Step 3: Add mobile bottom nav CSS**

Append to `app/styles/app.css`:

```css
/* ============================================
   Mobile Bottom Navigation
   ============================================ */
.mobile-bottom-nav {
  display: none;
}

@media (max-width: 767px) {
  .mobile-bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 30;
    background: white;
    border-top: 1px solid var(--color-border);
    height: 64px;
    align-items: stretch;
  }

  body {
    padding-bottom: 64px;
  }
}

.mobile-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  font-size: 0.625rem;
  font-family: var(--font-sans);
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s ease;
  padding: 0.25rem 0;
}

.mobile-nav-item:hover,
.mobile-nav-item.active {
  color: var(--color-ars-dark);
}

.mobile-nav-item.active svg {
  stroke: var(--color-ars-red);
}

.mobile-nav-cart-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-nav-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background: var(--color-ars-red);
  color: white;
  font-size: 0.5625rem;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
}
```

- [ ] **Step 4: Type-check and commit**

```bash
cd /e/GIT/ARS && npx tsc --noEmit
git add app/components/PageLayout.tsx app/styles/app.css
git commit -m "feat: mobile bottom navigation bar"
```

---

## Task 5: Skeleton Loading + Sort on /collections/$handle

**Files:**
- Modify: `app/routes/collections.all.tsx`
- Modify: `app/routes/collections.$handle.tsx`
- Modify: `app/styles/app.css`

### Part A: Skeleton loading on collections pages

- [ ] **Step 1: Add skeleton to collections.all.tsx**

In `app/routes/collections.all.tsx`, add `useNavigation` to the react-router import:
```typescript
import {type useNavigation} from 'react-router';
```
Actually import it:
```typescript
import {useLoaderData, Link, useNavigation} from 'react-router';
```

Add `ProductGridSkeleton` component (12 items):

```typescript
function ProductGridSkeleton() {
  return (
    <div className="products-grid">
      {Array.from({length: 12}).map((_, i) => (
        <div key={i} className="product-card skeleton-card">
          <div className="skeleton-image" />
          <div className="product-card-info">
            <div className="skeleton-line skeleton-line-short" />
            <div className="skeleton-line skeleton-line-medium" />
            <div className="skeleton-line skeleton-line-short" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

In the `Collection` component, add:
```typescript
const navigation = useNavigation();
const isLoading = navigation.state === 'loading';
```

Replace the product grid section with:
```tsx
{isLoading ? (
  <ProductGridSkeleton />
) : products.nodes.length === 0 ? (
  <div className="shop-empty">
    <p>Nincs eredmény a kiválasztott szűrőkre.</p>
    <Link to="/collections/all" className="btn btn-outline">Szűrők törölése</Link>
  </div>
) : (
  <PaginatedResourceSection<CollectionItemFragment>
    connection={products}
    resourcesClassName="products-grid"
  >
    {({node: product, index}) => (
      <ProductItem key={product.id} product={product} loading={index < 8 ? 'eager' : undefined} />
    )}
  </PaginatedResourceSection>
)}
```

### Part B: Sort controls on /collections/$handle

- [ ] **Step 2: Add sort to collections.$handle.tsx**

Read `app/routes/collections.$handle.tsx`. The current loader reads only `handle` and pagination. Add the same `parseSortKey` and `SORT_OPTIONS` pattern from `collections.all.tsx`.

Add after existing imports:
```typescript
const SORT_OPTIONS = [
  {label: 'Legújabb', value: ''},
  {label: 'Ár: növekvő', value: 'price-asc'},
  {label: 'Ár: csökkenő', value: 'price-desc'},
  {label: 'Név: A–Z', value: 'title-asc'},
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

function parseSortKey(sort: string): {sortKey: string; reverse: boolean} {
  switch (sort) {
    case 'price-asc': return {sortKey: 'PRICE', reverse: false};
    case 'price-desc': return {sortKey: 'PRICE', reverse: true};
    case 'title-asc': return {sortKey: 'TITLE', reverse: false};
    default: return {sortKey: 'CREATED_AT', reverse: true};
  }
}
```

Update `loadCriticalData` to read sort param:
```typescript
async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;
  const url = new URL(request.url);
  const sortParam = (url.searchParams.get('sort') || '') as SortValue;
  const {sortKey, reverse} = parseSortKey(sortParam);
  const paginationVariables = getPaginationVariables(request, {pageBy: 12});

  if (!handle) throw redirect('/collections');

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, ...paginationVariables, sortKey, reverse},
      cache: storefront.CacheShort(),
    }),
  ]);

  if (!collection) throw new Response(`Collection ${handle} not found`, {status: 404});
  redirectIfHandleIsLocalized(request, {handle, data: collection});
  return {collection, sortParam};
}
```

Update `COLLECTION_QUERY` to accept sort variables:
```graphql
query Collection(
  $handle: String!
  $country: CountryCode
  $language: LanguageCode
  $first: Int
  $last: Int
  $startCursor: String
  $endCursor: String
  $sortKey: ProductCollectionSortKeys
  $reverse: Boolean
) @inContext(country: $country, language: $language) {
  collection(handle: $handle) {
    id
    handle
    title
    description
    products(
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
      sortKey: $sortKey
      reverse: $reverse
    ) { ... }
  }
}
```

Note: Collections use `ProductCollectionSortKeys` (not `ProductSortKeys`). Valid values: `TITLE`, `PRICE`, `CREATED`, `COLLECTION_DEFAULT`, `ID`, `MANUAL`, `BEST_SELLING`, `RELEVANCE`.

Update `Collection` component to show sort select and skeleton:
```typescript
import {useLoaderData, Link, redirect, useNavigation} from 'react-router';
```

```tsx
export default function Collection() {
  const {collection, sortParam} = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  return (
    <div className="section">
      <div className="container">
        <nav className="breadcrumb">
          <Link to="/collections/all">Bolt</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{collection.title}</span>
        </nav>
        <div className="text-center mb-8">
          <h1>{collection.title}</h1>
          {collection.description && (
            <p className="text-muted" style={{maxWidth: '600px', margin: '0 auto'}}>
              {collection.description}
            </p>
          )}
        </div>

        <div className="shop-filters">
          <div className="shop-filter-group shop-sort-group" style={{marginLeft: 'auto'}}>
            <span className="shop-filter-label">Rendezés</span>
            <select
              className="shop-sort-select"
              value={sortParam}
              onChange={(e) => {
                const params = new URLSearchParams();
                if (e.target.value) params.set('sort', e.target.value);
                window.location.href = `/collections/${collection.handle}${params.toString() ? `?${params}` : ''}`;
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <ProductGridSkeleton />
        ) : (
          <PaginatedResourceSection<ProductItemFragment>
            connection={collection.products}
            resourcesClassName="products-grid"
          >
            {({node: product, index}) => (
              <ProductItem key={product.id} product={product} loading={index < 8 ? 'eager' : undefined} />
            )}
          </PaginatedResourceSection>
        )}
        <Analytics.CollectionView data={{collection: {id: collection.id, handle: collection.handle}}} />
      </div>
    </div>
  );
}
```

Add `ProductGridSkeleton` (same as collections.all version):
```typescript
function ProductGridSkeleton() {
  return (
    <div className="products-grid">
      {Array.from({length: 12}).map((_, i) => (
        <div key={i} className="product-card skeleton-card">
          <div className="skeleton-image" />
          <div className="product-card-info">
            <div className="skeleton-line skeleton-line-short" />
            <div className="skeleton-line skeleton-line-medium" />
            <div className="skeleton-line skeleton-line-short" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Add skeleton CSS**

Append to `app/styles/app.css`:

```css
/* ============================================
   Skeleton Loading
   ============================================ */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.skeleton-card {
  pointer-events: none;
}

.skeleton-image {
  aspect-ratio: 1;
  background: var(--color-border);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-line {
  height: 12px;
  background: var(--color-border);
  border-radius: 2px;
  margin: 6px auto;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-line-short { width: 60%; }
.skeleton-line-medium { width: 80%; }
```

- [ ] **Step 4: Type-check and commit**

```bash
cd /e/GIT/ARS && npx tsc --noEmit
git add app/routes/collections.all.tsx app/routes/collections.\$handle.tsx app/styles/app.css
git commit -m "feat: skeleton loading + sort controls on collection pages"
```

---

## Task 6: Empty Cart Product Suggestions

**Files:**
- Create: `app/routes/api.featured-products.tsx`
- Modify: `app/components/CartMain.tsx`
- Modify: `app/styles/app.css`

- [ ] **Step 1: Create api.featured-products.tsx**

```typescript
import type {Route} from './+types/api.featured-products';

export async function loader({context}: Route.LoaderArgs) {
  const {storefront} = context;
  const {products} = await storefront.query(FEATURED_PRODUCTS_QUERY, {
    cache: storefront.CacheLong(),
  });
  return Response.json({products: products.nodes});
}

const FEATURED_PRODUCTS_QUERY = `#graphql
  query FeaturedProducts($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        id
        handle
        title
        vendor
        featuredImage {
          url
          altText
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
` as const;
```

- [ ] **Step 2: Update CartEmpty in CartMain.tsx**

Read `app/components/CartMain.tsx`. Import `useEffect`, `useState`, `useFetcher`:

```typescript
import {useEffect, useState} from 'react';
import {Link, useFetcher} from 'react-router';
```

Replace the `CartEmpty` function:

```typescript
type FeaturedProduct = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  featuredImage: {url: string; altText: string | null} | null;
  priceRange: {minVariantPrice: {amount: string; currencyCode: string}};
};

function CartEmpty({hidden = false}: {hidden: boolean; layout?: CartMainProps['layout']}) {
  const {close} = useAside();
  const fetcher = useFetcher<{products: FeaturedProduct[]}>();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || hidden) return;
    fetcher.load('/api/featured-products');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, hidden]);

  const suggestions = fetcher.data?.products ?? [];

  return (
    <div hidden={hidden} className="cart-empty">
      <p>A kosarad üres</p>
      <p className="text-muted">Úgy tűnik, még nem választottál ki semmit.</p>
      <Link to="/collections/all" onClick={close} prefetch="viewport" className="btn btn-primary">
        Vásárlás folytatása
      </Link>
      {suggestions.length > 0 && (
        <div className="cart-empty-suggestions">
          <p className="cart-empty-suggestions-title">Talán ezek érdekelnek</p>
          <div className="cart-empty-suggestions-grid">
            {suggestions.map((p) => (
              <Link
                key={p.id}
                to={`/products/${p.handle}`}
                onClick={close}
                className="cart-empty-product"
                prefetch="intent"
              >
                {p.featuredImage && (
                  <img
                    src={`${p.featuredImage.url}${p.featuredImage.url.includes('?') ? '&' : '?'}width=120`}
                    alt={p.featuredImage.altText || p.title}
                    loading="lazy"
                  />
                )}
                <div className="cart-empty-product-info">
                  <span className="cart-empty-product-title">{p.title}</span>
                  <span className="cart-empty-product-price">
                    {parseFloat(p.priceRange.minVariantPrice.amount).toLocaleString('hu-HU')} {p.priceRange.minVariantPrice.currencyCode}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add empty cart CSS**

Append to `app/styles/app.css`:

```css
/* ============================================
   Empty Cart Suggestions
   ============================================ */
.cart-empty-suggestions {
  margin-top: 2rem;
  width: 100%;
}

.cart-empty-suggestions-title {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
  text-align: left;
}

.cart-empty-suggestions-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cart-empty-product {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s ease;
}

.cart-empty-product:hover {
  opacity: 0.7;
}

.cart-empty-product img {
  width: 56px;
  height: 56px;
  object-fit: cover;
  flex-shrink: 0;
  background: var(--color-border);
}

.cart-empty-product-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.cart-empty-product-title {
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cart-empty-product-price {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
```

- [ ] **Step 4: Type-check and commit**

```bash
cd /e/GIT/ARS && npx tsc --noEmit
git add app/routes/api.featured-products.tsx app/components/CartMain.tsx app/styles/app.css
git commit -m "feat: product suggestions in empty cart"
```
