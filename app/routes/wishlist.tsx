import {useEffect, useState} from 'react';
import {Link, useFetcher} from 'react-router';
import type {Route} from './+types/wishlist';
import {useWishlist} from '~/hooks/useWishlist';
import {ProductItem} from '~/components/ProductItem';

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

type WishlistProduct = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  availableForSale: boolean;
  featuredImage: {
    id: string;
    altText: string | null;
    url: string;
    width: number;
    height: number;
  } | null;
  priceRange: {
    minVariantPrice: {amount: string; currencyCode: string};
    maxVariantPrice: {amount: string; currencyCode: string};
  };
};

export default function Wishlist() {
  const {handles} = useWishlist();
  const fetcher = useFetcher<{products: WishlistProduct[]}>();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || handles.length === 0) return;
    const params = new URLSearchParams({handles: handles.join(',')});
    fetcher.load(`/api/wishlist-products?${params}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, handles.join(',')]);

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
