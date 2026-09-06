import {Await, useLoaderData, useRouteLoaderData, Link, useFetcher} from 'react-router';
import type {RootLoader} from '~/root';
import {SHIPPING} from '~/lib/config';
import {CAMPAIGN_PATH, eligibleCampaign} from '~/lib/campaigns';
import type {Route} from './+types/products.$handle';
import {Suspense, memo, startTransition, useEffect, useState, useRef} from 'react';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductForm} from '~/components/ProductForm';
import {AddToCartButton} from '~/components/AddToCartButton';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {SITE_URL} from '~/lib/config';
import {formatMoney} from '~/lib/money';
import {jsonLd, seoMeta} from '~/lib/seo';
import type {
  ProductItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';
import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';
import {ProductItem} from '~/components/ProductItem';
import {useRecentlyViewed, type RecentProduct} from '~/hooks/useRecentlyViewed';
import {ImageSlider} from '~/components/ImageSlider';

export const meta: Route.MetaFunction = ({data, location}) => {
  const product = data?.product;
  const variant = product?.selectedOrFirstAvailableVariant;
  const tags = seoMeta({
    title: product?.seo?.title || product?.title || 'Termék',
    description: product?.seo?.description || product?.description,
    // canonical is the product URL without the size/colour query string
    path: location.pathname,
    image: variant?.image?.url,
    type: 'product',
  });
  if (variant?.price) {
    tags.push(
      {property: 'product:price:amount', content: variant.price.amount},
      {property: 'product:price:currency', content: variant.price.currencyCode},
    );
  }
  return tags;
};

export const links: Route.LinksFunction = () => [];

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

  // Kick off related products without awaiting — streams in via Suspense.
  // Same artist first; when an artist has only a piece or two, fill the row
  // with the same product type so the section never shows a lone card.
  const related = async (query: string) =>
    ((await storefront.query(RELATED_PRODUCTS_QUERY, {
      variables: {query},
      cache: storefront.CacheLong(),
    }))?.products.nodes ?? []).filter((p: ProductItemFragment) => p.id !== product.id);
  const relatedProducts = (async () => {
    const byArtist = product.vendor
      ? await related(`vendor:"${product.vendor.replace(/"/g, '')}"`)
      : [];
    if (byArtist.length >= 4 || !product.productType) return byArtist.slice(0, 4);
    const byType = await related(`product_type:"${product.productType.replace(/"/g, '')}"`);
    const seen = new Set(byArtist.map((p: ProductItemFragment) => p.id));
    return [...byArtist, ...byType.filter((p: ProductItemFragment) => !seen.has(p.id))].slice(0, 4);
  })().catch(() => [] as ProductItemFragment[]);

  // Fixed public origin: canonical/OG/breadcrumb URLs must not follow the request Host
  const canonicalUrl = `${SITE_URL}/products/${product.handle}`;
  const origin = SITE_URL;

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
            {formatMoney(price, currencyCode)}
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
  const rootData = useRouteLoaderData<RootLoader>('root');
  const campaign = eligibleCampaign(rootData?.campaigns, product.id);

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
      ([entry]) => startTransition(() => setStickyVisible(!entry.isIntersecting)),
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
  const sizeValues =
    product.options
      .find((o) => o.name.toLowerCase() === 'méret' || o.name.toLowerCase() === 'size')
      ?.optionValues.map((v) => v.name) ?? [];

  return (
    <>
      <div className="section">
        <div className="container">
          <nav className="breadcrumb">
            <Link to="/collections/all">Bolt</Link>
            <span className="breadcrumb-sep">/</span>
            {vendor && (
              <>
                <Link to={`/collections/all?artist=${encodeURIComponent(vendor)}`}>{vendor}</Link>
                <span className="breadcrumb-sep">/</span>
              </>
            )}
            <span className="breadcrumb-current">{title}</span>
          </nav>

          <div className="product">
            <ProductGallery
              images={(product as any).images?.nodes ?? []}
              selectedImage={selectedVariant?.image ? {url: selectedVariant.image.url, altText: selectedVariant.image.altText ?? null} : null}
              productTitle={product.title}
            />
            <div className="product-main">
              {vendor && (
                <Link to={`/collections/all?artist=${encodeURIComponent(vendor)}`} className="product-artist">
                  {vendor}
                </Link>
              )}
              <h1>{title}</h1>
              <ProductPrice
                price={selectedVariant?.price}
                compareAtPrice={selectedVariant?.compareAtPrice}
              />
              {campaign && (
                <Link to={CAMPAIGN_PATH} className="product-campaign" prefetch="intent">
                  <span className="product-campaign-badge">{campaign.copy.shortLabel}</span>
                  <span className="product-campaign-text">{campaign.copy.productNote}</span>
                </Link>
              )}
              <div ref={addToCartRef}>
                <ProductForm
                  productOptions={productOptions}
                  selectedVariant={selectedVariant}
                />
                <StockNote
                  available={selectedVariant?.availableForSale ?? false}
                  quantity={selectedVariant?.quantityAvailable ?? null}
                />
                {!selectedVariant?.availableForSale && (
                  <BackInStockForm
                    productHandle={product.handle}
                    variantTitle={selectedVariant?.title ?? ''}
                  />
                )}
              </div>
              <TrustStrip />
              {descriptionHtml && (
                <div className="product-description">
                  <div dangerouslySetInnerHTML={{__html: descriptionHtml}} />
                </div>
              )}
              <SizeGuide productType={product.productType} sizes={sizeValues} />
            </div>
          </div>
        </div>
      </div>

      {/* one previously viewed card alone looks like a mistake; wait for two */}
      {recentItems.length >= 2 && (
        <RecentlyViewedStrip items={recentItems} />
      )}

      <RelatedProductsDeferred promise={relatedProducts} artistName={vendor} />

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
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            description: product.description,
            url: canonicalUrl,
            image: [
              selectedVariant?.image?.url,
              ...((product as any).images?.nodes ?? []).map((img: {url: string}) => img.url),
            ].filter((url, index, all) => url && all.indexOf(url) === index),
            brand: {
              '@type': 'Brand',
              name: product.vendor || 'Ars Mosoris',
            },
            sku: selectedVariant?.sku,
            offers: {
              '@type': 'Offer',
              price: selectedVariant?.price.amount,
              priceCurrency: selectedVariant?.price.currencyCode,
              priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
              itemCondition: 'https://schema.org/NewCondition',
              availability: selectedVariant?.availableForSale
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
              url: canonicalUrl,
              seller: {'@type': 'Organization', name: 'Ars Mosoris'},
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
          __html: jsonLd({
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
                      item: `${origin}/collections/all?artist=${encodeURIComponent(product.vendor)}`,
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

/**
 * The related products stream in after the shell. Memoized so state changes in
 * the product view (recently viewed, sticky bar) never re-render this Suspense
 * boundary while it is still dehydrated — React would otherwise bail out to
 * client rendering (error #421).
 */
const RelatedProductsDeferred = memo(function RelatedProductsDeferred({
  promise,
  artistName,
}: {
  promise: Promise<ProductItemFragment[]>;
  artistName?: string | null;
}) {
  return (
    <Suspense fallback={null}>
      <Await resolve={promise}>
        {(products) =>
          products && products.length > 0 ? (
            <RelatedProducts products={products} artistName={artistName} />
          ) : null
        }
      </Await>
    </Suspense>
  );
});

/**
 * "Már csak N db": only when Shopify exposes the number (needs the Storefront
 * API "read product inventory" permission on the Hydrogen channel) and stock
 * is low; silent otherwise, so nothing ever claims a false scarcity.
 */
function StockNote({available, quantity}: {available: boolean; quantity: number | null}) {
  if (!available || quantity === null || quantity < 1 || quantity > 3) return null;
  return (
    <p className="stock-note" aria-live="polite">
      {quantity === 1 ? 'Utolsó darab ebben a méretben' : `Már csak ${quantity} db ebben a méretben`}
    </p>
  );
}

const TRUST_ITEMS = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="1" y="3" width="15" height="13" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    title: `${SHIPPING.carrier} csomagpont ${formatMoney(SHIPPING.parcelPointFt)}`,
    text: `házhoz ${formatMoney(SHIPPING.homeDeliveryFt)}, ${formatMoney(SHIPPING.freeOverFt)} felett ingyenes`,
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: `Feladás ${SHIPPING.handlingDays} alatt`,
    text: `kézbesítés további ${SHIPPING.transitDays}`,
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
    ),
    title: `${SHIPPING.returnDays} napos elállás`,
    text: 'indoklás nélkül visszaküldheted',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Kézzel készül Budapesten',
    text: 'kis szériás, egyedi grafika',
  },
];

/** The four things a buyer asks before adding to cart; facts come from config.ts */
function TrustStrip() {
  return (
    <ul className="trust-strip" aria-label="Szállítás és garancia">
      {TRUST_ITEMS.map((item) => (
        <li key={item.title}>
          <span className="trust-strip-icon">{item.icon}</span>
          <span>
            <strong>{item.title}</strong>
            <span className="trust-strip-text">{item.text}</span>
          </span>
        </li>
      ))}
      <li className="trust-strip-more">
        <Link to="/policies/shipping-policy">Szállítási részletek</Link>
      </li>
    </ul>
  );
}

const TEE_SIZES: Array<[size: string, chest: string, length: string]> = [
  ['S', '96 cm', '68 cm'],
  ['M', '102 cm', '71 cm'],
  ['L', '108 cm', '74 cm'],
  ['XL', '114 cm', '76 cm'],
  ['XXL', '120 cm', '78 cm'],
];

/**
 * The measured table only applies to the tee blanks. Hoodies and the one-off
 * pieces get an honest note instead of numbers that would be wrong for them.
 */
function SizeGuide({productType, sizes}: {productType?: string | null; sizes: string[]}) {
  const type = (productType ?? '').toLowerCase();
  const isTee = type === 'póló';
  const isSweat = type.includes('pulóver');
  const sizeList = sizes.join(', ');

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
        {isTee ? 'Mérettáblázat' : 'Méretek és szabás'}
      </summary>
      <div className="size-guide-content">
        {isTee ? (
          <>
            <table className="size-guide-table">
              <thead>
                <tr>
                  <th>Méret</th>
                  <th>Mellbőség</th>
                  <th>Hossz</th>
                </tr>
              </thead>
              <tbody>
                {TEE_SIZES.filter(([size]) => !sizes.length || sizes.includes(size)).map(
                  ([size, chest, length]) => (
                    <tr key={size}>
                      <td>{size}</td>
                      <td>{chest}</td>
                      <td>{length}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
            <p className="size-guide-note">
              Unisex szabás; a mellbőség a hónaljnál mért teljes körméret. Ha két méret
              között vagy, a nagyobbat javasoljuk.
            </p>
          </>
        ) : isSweat ? (
          <p className="size-guide-note">
            Unisex, bő szabású pulóver, elérhető méretek: {sizeList}. Ha bizonytalan vagy,{' '}
            <Link to="/contact">írj nekünk</Link>, és lemérjük neked a konkrét darabot.
          </p>
        ) : (
          <p className="size-guide-note">
            Egyetlen példányban készült darab{sizeList ? `, mérete: ${sizeList}` : ''}. Pontos
            méreteket szívesen küldünk: <Link to="/contact">írj nekünk</Link> a termék nevével.
          </p>
        )}
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
  const sameArtist = Boolean(artistName) && products.every((p) => p.vendor === artistName);
  return (
    <section className="section" style={{backgroundColor: 'var(--color-background-alt)'}}>
      <div className="container">
        <div className="text-center mb-8">
          <h2>{sameArtist ? `Még ${artistName}-tól` : 'Ezek is tetszhetnek'}</h2>
          <p className="text-muted">
            {sameArtist
              ? 'További alkotások ugyanattól a művésztől'
              : 'Hasonló darabok az Ars Mosoris alkotóitól'}
          </p>
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
        <div className="text-center mb-8">
          <h2>Nemrég megnézted</h2>
          <p className="text-muted">Korábban megtekintett darabok</p>
        </div>
        <div className="products-grid">
          {items.map((item) => (
            <ProductItem
              key={item.handle}
              product={toProductCard(item)}
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Recently viewed entries live in localStorage; shape them like a catalog product so they share the card */
function toProductCard(item: RecentProduct): RecommendedProductFragment {
  return {
    id: `recent:${item.handle}`,
    handle: item.handle,
    title: item.title,
    vendor: item.vendor,
    tags: [],
    availableForSale: true,
    featuredImage: item.imageUrl
      ? {
          id: `recent-image:${item.handle}`,
          url: item.imageUrl,
          altText: item.imageAlt,
          width: null,
          height: null,
        }
      : null,
    priceRange: {
      minVariantPrice: {
        amount: item.price,
        currencyCode: item.currencyCode as CurrencyCode,
      },
    },
  };
}

function BackInStockForm({
  productHandle,
  variantTitle,
}: {
  productHandle: string;
  variantTitle: string;
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
      <input type="hidden" name="handle" value={productHandle} />
      <input type="hidden" name="variantTitle" value={variantTitle} />
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
    quantityAvailable
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
    productType
    tags
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
    tags
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
    $query: String!
  ) @inContext(country: $country, language: $language) {
    products(first: 8, query: $query) {
      nodes {
        ...RelatedProduct
      }
    }
  }
` as const;
