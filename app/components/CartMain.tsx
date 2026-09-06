import {CartForm, useOptimisticCart, type OptimisticCartLine} from '@shopify/hydrogen';
import {Link, useFetcher, useRouteLoaderData} from 'react-router';
import type {RootLoader} from '~/root';
import {useEffect, useState} from 'react';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem, type CartLine} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';
import {formatMoney} from '~/lib/money';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

export type LineItemChildrenMap = {[parentId: string]: CartLine[]};

function getLineItemChildrenMap(lines: CartLine[]): LineItemChildrenMap {
  const children: LineItemChildrenMap = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const children = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childIds] of Object.entries(children)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childIds);
      }
    }
  }
  return children;
}

export function CartMain({layout, cart: originalCart}: CartMainProps) {
  const cart = useOptimisticCart(originalCart);

  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length);
  const className = `cart-main ${withDiscount ? 'with-discount' : ''}`;
  const cartHasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;
  const childrenMap = getLineItemChildrenMap(cart?.lines?.nodes ?? []);

  const groups = groupCartLines(cart?.lines?.nodes ?? []);

  return (
    <div className={className}>
      <CartEmpty hidden={linesCount} layout={layout} />
      <div className="cart-details">
        {cartHasItems && <AlreadyOrderedNotice lineIds={(cart?.lines?.nodes ?? []).map((l) => l.id)} />}
        <div aria-labelledby="cart-lines">
          <ul>
            {groups.map((group) => (
              <CartLineItem
                key={group.line.id}
                line={group.line}
                lines={group.lines}
                layout={layout}
                childrenMap={childrenMap}
              />
            ))}
          </ul>
        </div>
        {cartHasItems && <CartSummary cart={cart} layout={layout} />}
      </div>
    </div>
  );
}

/**
 * The kosR checkout places the order from a separate (Online Store) cart, so
 * after a purchase this cart still lists the bought items. Once the shopper
 * has been handed to the checkout, offer a one-click way to empty it.
 */
function AlreadyOrderedNotice({lineIds}: {lineIds: string[]}) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  if (!rootData?.checkoutStartedAt || !lineIds.length) return null;
  return (
    <div className="cart-ordered-notice">
      <p>Már leadtad a rendelésed a pénztárban? Akkor ezek a tételek már nem kellenek ide.</p>
      <CartForm route="/cart" action={CartForm.ACTIONS.LinesRemove} inputs={{lineIds}}>
        <button type="submit" className="cart-ordered-clear">
          Kosár ürítése
        </button>
      </CartForm>
    </div>
  );
}

export type CartLineGroup = {
  /** merged view of the group: summed quantity, cost and discounts */
  line: CartLine;
  /** the underlying Shopify lines, in cart order */
  lines: CartLine[];
};

/**
 * Buy-X-get-Y discounts make Shopify split one variant into several lines
 * (discounted units vs. full-price units), and further adds of that variant
 * may land on new lines. Show one row per variant; controls act on the group.
 */
export function groupCartLines(lines: CartLine[]): CartLineGroup[] {
  const groups: CartLineGroup[] = [];
  const byMerchandise = new Map<string, CartLineGroup>();
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      continue; // bundle components are rendered under their parent
    }
    const existing = byMerchandise.get(line.merchandise.id);
    if (!existing) {
      const group = {line, lines: [line]};
      byMerchandise.set(line.merchandise.id, group);
      groups.push(group);
      continue;
    }
    existing.lines.push(line);
    existing.line = mergeLines(existing.line, line);
  }
  return groups;
}

type Money = {amount: string; currencyCode: string};
const addMoney = (a?: Money | null, b?: Money | null): Money | null | undefined =>
  a && b ? {...a, amount: String(parseFloat(a.amount) + parseFloat(b.amount))} : (a ?? b);

function mergeLines(a: CartLine, b: CartLine): CartLine {
  return {
    ...a,
    quantity: a.quantity + b.quantity,
    isOptimistic: Boolean(a.isOptimistic || b.isOptimistic),
    cost: {
      ...a.cost,
      totalAmount: addMoney(a.cost?.totalAmount, b.cost?.totalAmount),
    },
    discountAllocations: [
      ...(a.discountAllocations ?? []),
      ...(b.discountAllocations ?? []),
    ],
  } as CartLine;
}

type FeaturedProduct = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  featuredImage: {url: string; altText: string | null} | null;
  priceRange: {minVariantPrice: {amount: string; currencyCode: string}};
};

function CartEmpty({
  hidden = false,
}: {
  hidden: boolean;
  layout?: CartMainProps['layout'];
}) {
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
                    {formatMoney(
                      p.priceRange.minVariantPrice.amount,
                      p.priceRange.minVariantPrice.currencyCode,
                    )}
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
