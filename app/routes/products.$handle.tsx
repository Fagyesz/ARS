import {Await, useLoaderData, Link, useFetcher} from 'react-router';
import type {Route} from './+types/products.$handle';
import {Suspense, useEffect, useState, useRef} from 'react';
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
import {AddToCartButton} from '~/components/AddToCartButton';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import type {ProductItemFragment} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';
import {useRecentlyViewed, type RecentProduct} from '~/hooks/useRecentlyViewed';
import {ImageSlider} from '~/components/ImageSlider';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `${data?.product.title ?? 'Termék'} | Ars Mosoris`},
    {
      name: 'description',
      content: data?.product.description || 'Ars Mosoris termék',
    },
    {property: 'og:type', content: 'product'},
    {property: 'og:title', content: data?.product.title ?? 'Termék'},
    {property: 'og:description', content: data?.product.description || 'Ars Mosoris termék'},
    {property: 'og:image', content: data?.product.selectedOrFirstAvailableVariant?.image?.url ?? '/og-default.png'},
    {property: 'og:url', content: data?.canonicalUrl ?? `/products/${data?.product.handle}`},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};

export const links: Route.LinksFunction = (args) => {
  const handle = args?.data?.product?.handle;
  return handle ? [{rel: 'canonical', href: `/products/${handle}`}] : [];
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

  const url = new URL(request.url);
  const canonicalUrl = `${url.origin}/products/${product.handle}`;
  const origin = url.origin;

  return {product, relatedProducts, canonicalUrl, origin};
}

function ProductGallery({
  images,
  selectedImage,
  productTitle,
}: {
  images: Array<{id: string; url: string; altText: string | null; width: number | null; height: number | null}>;
  selectedImage: {url: string; altText: string | null} | null | undefined;
  productTitle: string;
}) {
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

export default function Product() {
  const {product, relatedProducts, canonicalUrl, origin} = useLoaderData<typeof loader>();

  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  const {addItem, displayItems: recentItems} = useRecentlyViewed(product.handle);

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

  useEffect(() => {
    const item: RecentProduct = {
      handle: product.handle,
      title: product.title,
      vendor: product.vendor ?? '',
      imageUrl: selectedVariant?.image?.url ?? null,
      imageAlt: selectedVariant?.image?.altText ?? null,
      price: selectedVariant?.price.amount ?? '0',
      currencyCode: selectedVariant?.price.currencyCode ?? 'HUF',
    };
    addItem(item);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.handle]);

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
            <ProductGallery
              images={(product as any).images?.nodes ?? []}
              selectedImage={selectedVariant?.image}
              productTitle={product.title}
            />
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
              <div ref={addToCartRef}>
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
              </div>
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

      {recentItems.length >= 1 && (
        <RecentlyViewedStrip items={recentItems} />
      )}

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            description: product.description,
            image: selectedVariant?.image?.url,
            brand: {
              '@type': 'Brand',
              name: product.vendor || 'Ars Mosoris',
            },
            sku: selectedVariant?.sku,
            offers: {
              '@type': 'Offer',
              price: selectedVariant?.price.amount,
              priceCurrency: selectedVariant?.price.currencyCode,
              availability: selectedVariant?.availableForSale
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
              url: canonicalUrl,
            },
          }),
        }}
      />
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Bolt',
                item: `${origin}/collections/all`,
              },
              ...(product.vendor
                ? [
                    {
                      '@type': 'ListItem',
                      position: 2,
                      name: product.vendor,
                      item: `${origin}/collections/${product.vendor.toLowerCase()}`,
                    },
                    {
                      '@type': 'ListItem',
                      position: 3,
                      name: product.title,
                    },
                  ]
                : [
                    {
                      '@type': 'ListItem',
                      position: 2,
                      name: product.title,
                    },
                  ]),
            ],
          }),
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
    images(first: 10) {
      nodes {
        id
        url
        altText
        width
        height
      }
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
