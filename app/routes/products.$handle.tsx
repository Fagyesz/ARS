import {Await, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/products.$handle';
import {Suspense} from 'react';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductImage} from '~/components/ProductImage';
import {ProductForm} from '~/components/ProductForm';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import type {ProductItemFragment} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `${data?.product.title ?? 'Termék'} | Ars Mosoris`},
    {
      name: 'description',
      content: data?.product.description || 'Ars Mosoris termék',
    },
    {
      rel: 'canonical',
      href: `/products/${data?.product.handle}`,
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const {context, params, request} = args;
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
      cache: storefront.CacheShort(),
    }),
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle, data: product});

  // Kick off related products without awaiting — streams in via Suspense
  const relatedProducts = product.vendor
    ? storefront
        .query(RELATED_PRODUCTS_QUERY, {
          variables: {vendor: product.vendor},
          cache: storefront.CacheLong(),
        })
        .then((result) =>
          result?.products.nodes.filter(
            (p: ProductItemFragment) => p.id !== product.id,
          ),
        )
        .catch(() => [])
    : Promise.resolve([]);

  return {product, relatedProducts};
}

export default function Product() {
  const {product, relatedProducts} = useLoaderData<typeof loader>();

  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, descriptionHtml, vendor} = product;

  return (
    <>
      <div className="section">
        <div className="container">
          <nav className="breadcrumb">
            <Link to="/collections/all">Bolt</Link>
            <span className="breadcrumb-sep">/</span>
            {vendor && (
              <>
                <Link to={`/collections/${vendor.toLowerCase()}`}>{vendor}</Link>
                <span className="breadcrumb-sep">/</span>
              </>
            )}
            <span className="breadcrumb-current">{title}</span>
          </nav>

          <div className="product">
            <ProductImage image={selectedVariant?.image} />
            <div className="product-main">
              {vendor && (
                <Link to={`/collections/${vendor.toLowerCase()}`} className="product-artist">
                  {vendor}
                </Link>
              )}
              <h1>{title}</h1>
              <ProductPrice
                price={selectedVariant?.price}
                compareAtPrice={selectedVariant?.compareAtPrice}
              />
              <ProductForm
                productOptions={productOptions}
                selectedVariant={selectedVariant}
              />
              {descriptionHtml && (
                <div className="product-description">
                  <div dangerouslySetInnerHTML={{__html: descriptionHtml}} />
                </div>
              )}
              <SizeGuide />
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <Await resolve={relatedProducts}>
          {(products) =>
            products && products.length > 0 ? (
              <RelatedProducts products={products} artistName={vendor} />
            ) : null
          }
        </Await>
      </Suspense>

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </>
  );
}

function SizeGuide() {
  return (
    <details className="size-guide">
      <summary className="size-guide-trigger">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Mérettáblázat
      </summary>
      <div className="size-guide-content">
        <table className="size-guide-table">
          <thead>
            <tr>
              <th>Méret</th>
              <th>Mellbőség</th>
              <th>Hossz</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>S</td>
              <td>96 cm</td>
              <td>68 cm</td>
            </tr>
            <tr>
              <td>M</td>
              <td>102 cm</td>
              <td>71 cm</td>
            </tr>
            <tr>
              <td>L</td>
              <td>108 cm</td>
              <td>74 cm</td>
            </tr>
            <tr>
              <td>XL</td>
              <td>114 cm</td>
              <td>76 cm</td>
            </tr>
            <tr>
              <td>XXL</td>
              <td>120 cm</td>
              <td>78 cm</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  );
}

function RelatedProducts({
  products,
  artistName,
}: {
  products: ProductItemFragment[];
  artistName?: string | null;
}) {
  return (
    <section className="section" style={{backgroundColor: 'var(--color-background-alt)'}}>
      <div className="container">
        <div className="text-center mb-8">
          <h2>{artistName ? `Még ${artistName}-tól` : 'Kapcsolódó termékek'}</h2>
          <p className="text-muted">További alkotások ugyanattól a művésztől</p>
        </div>
        <div className="products-grid">
          {products.slice(0, 4).map((product) => (
            <ProductItem
              key={product.id}
              product={product}
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;

const RELATED_PRODUCT_FRAGMENT = `#graphql
  fragment RelatedProduct on Product {
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
` as const;

const RELATED_PRODUCTS_QUERY = `#graphql
  ${RELATED_PRODUCT_FRAGMENT}
  query RelatedProducts(
    $country: CountryCode
    $language: LanguageCode
    $vendor: String!
  ) @inContext(country: $country, language: $language) {
    products(first: 5, query: $vendor) {
      nodes {
        ...RelatedProduct
      }
    }
  }
` as const;
