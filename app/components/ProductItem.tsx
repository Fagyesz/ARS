import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import {useWishlist} from '~/hooks/useWishlist';
import {useToast} from '~/components/Toast';

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
  const {addToast} = useToast();

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
              aspectRatio="4/5"
              data={image}
              loading={loading}
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 50vw"
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
          addToast(
            wishlisted ? 'Eltávolítva a kívánságlistáról' : 'Kívánságlistához adva ♥',
            'success',
          );
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
