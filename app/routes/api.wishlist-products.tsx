import type {Route} from './+types/api.wishlist-products';

/** Each handle is one Storefront query: cap how many a single request can fan out to */
const MAX_HANDLES = 50;

export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const handlesParam = url.searchParams.get('handles') || '';
  const handles = handlesParam
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)
    .slice(0, MAX_HANDLES);

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
      compareAtPriceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
    }
  }
` as const;
