import {useOptimisticCart, type OptimisticCartLine} from '@shopify/hydrogen';
import {Link, useFetcher} from 'react-router';
import {useEffect, useState} from 'react';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem, type CartLine} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';

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

  return (
    <div className={className}>
      <CartEmpty hidden={linesCount} layout={layout} />
      <div className="cart-details">
        <div aria-labelledby="cart-lines">
          <ul>
            {(cart?.lines?.nodes ?? []).map((line) => {
              if (
                'parentRelationship' in line &&
                line.parentRelationship?.parent
              ) {
                return null;
              }
              return (
                <CartLineItem
                  key={line.id}
                  line={line}
                  layout={layout}
                  childrenMap={childrenMap}
                />
              );
            })}
          </ul>
        </div>
        {cartHasItems && <CartSummary cart={cart} layout={layout} />}
      </div>
    </div>
  );
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
