import {redirect, useLoaderData, useRouteLoaderData, Link, useNavigation} from 'react-router';
import type {RootLoader} from '~/root';
import type {Route} from './+types/collections.$handle';
import {Analytics, getPaginationVariables} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductItem} from '~/components/ProductItem';
import {SizeFilter} from '~/components/SizeFilter';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import type {ProductItemFragment} from 'storefrontapi.generated';
import {breadcrumbJsonLd, jsonLd, productListJsonLd, seoMeta} from '~/lib/seo';
import {filterBySize, parseSizeParam, sizeOptions} from '~/lib/sizes';

export const meta: Route.MetaFunction = ({data, location}) =>
  seoMeta({
    title: data?.collection.seo?.title || data?.collection.title || 'Kollekció',
    description:
      data?.collection.seo?.description ||
      data?.collection.description ||
      `${data?.collection.title ?? 'Kollekció'}: egyedi darabok az Ars Mosoris alkotóitól.`,
    // sorting is a query string; the canonical stays the collection URL
    path: location.pathname,
    image: data?.collection.image?.url,
  });

const SORT_OPTIONS = [
  {label: 'Legújabb', value: ''},
  {label: 'Ár ↑', value: 'price-asc'},
  {label: 'Ár ↓', value: 'price-desc'},
  {label: 'A–Z', value: 'title-asc'},
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

function parseSortKey(sort: string): {sortKey: 'PRICE' | 'TITLE' | 'CREATED'; reverse: boolean} {
  switch (sort) {
    case 'price-asc': return {sortKey: 'PRICE', reverse: false};
    case 'price-desc': return {sortKey: 'PRICE', reverse: true};
    case 'title-asc': return {sortKey: 'TITLE', reverse: false};
    default: return {sortKey: 'CREATED', reverse: true};
  }
}

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;
  const url = new URL(request.url);
  const sortParam = (url.searchParams.get('sort') || '') as SortValue;
  const sizeParam = parseSizeParam(url.searchParams.get('size'));
  const {sortKey, reverse} = parseSortKey(sortParam);

  if (!handle) {
    throw redirect('/collections');
  }

  // The grid is paginated (24 cards, "Több termék" loads the next page). The
  // size filter needs every product's variants, so a separate lean query reads
  // just those: it drives the size chips and the product count, and only its
  // result (not 250 × 20 variants) reaches the page. With a size chosen the
  // matching products are shown on one page, since Shopify's cursors cannot
  // page through a filter it does not know about ("M-L" counts as M and L).
  const [{collection}, {collection: sizeData}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {
        handle,
        sortKey,
        reverse,
        ...(sizeParam ? {first: 250} : getPaginationVariables(request, {pageBy: 24})),
      },
      cache: storefront.CacheShort(),
    }),
    storefront.query(COLLECTION_SIZES_QUERY, {
      variables: {handle},
      cache: storefront.CacheShort(),
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle, data: collection});

  // Size chips list every size the collection is in stock in; the grid keeps
  // only the products available in the chosen one.
  const sizeNodes = sizeData?.products.nodes ?? [];
  const sizes = sizeOptions(sizeNodes);
  const matching = new Set(filterBySize(sizeNodes, sizeParam).map((p) => p.id));
  const products = sizeParam
    ? {
        nodes: collection.products.nodes.filter((p) => matching.has(p.id)),
        pageInfo: {hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null},
      }
    : collection.products;

  return {
    collection: {...collection, products},
    productCount: sizeParam ? products.nodes.length : sizeNodes.length,
    sortParam,
    sizeParam,
    sizes,
  };
}

function loadDeferredData(_args: Route.LoaderArgs) {
  return {};
}

function ProductGridSkeleton() {
  return (
    <div className="products-grid">
      {Array.from({length: 12}).map((_, i) => (
        // identical placeholders: the position is the identity
        // eslint-disable-next-line react/no-array-index-key
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

/** Ask Shopify's image CDN for a resized rendition instead of the original upload */
function sized(url: string, width: number) {
  return `${url}${url.includes('?') ? '&' : '?'}width=${width}`;
}

function buildSortUrl(handle: string, sort: string, size = '') {
  const params = new URLSearchParams();
  if (sort) params.set('sort', sort);
  if (size) params.set('size', size);
  return `/collections/${handle}${params.toString() ? `?${params}` : ''}`;
}

export default function Collection() {
  const {collection, productCount, sortParam, sizeParam, sizes} =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  // "Több termék" appends the next page in place; only a new sort or size
  // swaps the grid for the skeleton
  const isLoading =
    navigation.state === 'loading' &&
    !new URLSearchParams(navigation.location?.search).has('cursor');
  // sibling categories = the shop's published collections (root loader)
  const siblings = useRouteLoaderData<RootLoader>('root')?.content?.collections ?? [];

  return (
    <div className="collection-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([
            breadcrumbJsonLd([
              {name: 'Katalógus', path: '/collections/all'},
              {name: collection.title},
            ]),
            productListJsonLd(collection.products.nodes),
          ]),
        }}
      />
      {/* Hero */}
      {collection.image ? (
        <div className="collection-hero">
          <img
            src={sized(collection.image.url, 1600)}
            srcSet={[800, 1200, 1600, 2000]
              .map((w) => `${sized(collection.image!.url, w)} ${w}w`)
              .join(', ')}
            sizes="100vw"
            alt={collection.image.altText || collection.title}
            className="collection-hero-image"
            width={collection.image.width ?? undefined}
            height={collection.image.height ?? undefined}
            loading="eager"
            fetchPriority="high"
          />
          <div className="collection-hero-overlay">
            <nav className="collection-hero-breadcrumb" aria-label="Morzsamenü">
              <Link to="/collections/all">Katalógus</Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page">{collection.title}</span>
            </nav>
            <h1 className="collection-hero-title">{collection.title}</h1>
            {collection.description && (
              <p className="collection-hero-desc">{collection.description}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="collection-text-header container">
          <nav className="breadcrumb" aria-label="Morzsamenü">
            <Link to="/collections/all">Katalógus</Link>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current" aria-current="page">{collection.title}</span>
          </nav>
          <h1>{collection.title}</h1>
          {collection.description && (
            <p className="text-muted" style={{maxWidth: '600px', margin: '0 auto'}}>
              {collection.description}
            </p>
          )}
        </div>
      )}

      {/* Sort bar with links to the sibling categories */}
      <div className="catalog-filters">
        <div className="catalog-filters-inner container">
          <nav className="catalog-filter-section" aria-label="Kategóriák">
            <Link to="/collections/all" className="catalog-type-chip">
              Minden termék
            </Link>
            {siblings.map((c) => (
              <Link
                key={c.handle}
                to={`/collections/${c.handle}`}
                className={`catalog-type-chip${c.handle === collection.handle ? ' active' : ''}`}
                aria-current={c.handle === collection.handle ? 'page' : undefined}
              >
                {c.title}
              </Link>
            ))}
          </nav>
          <span className="catalog-filter-divider" aria-hidden="true" />
          <div className="catalog-filter-section catalog-sort-section" style={{marginLeft: 'auto', paddingLeft: 0}}>
            <span className="catalog-sort-label">Rendezés:</span>
            {SORT_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                to={buildSortUrl(collection.handle, opt.value, sizeParam)}
                className={`catalog-sort-btn${sortParam === opt.value ? ' active' : ''}`}
                aria-current={sortParam === opt.value ? 'true' : undefined}
                preventScrollReset
              >
                {opt.label}
              </Link>
            ))}
          </div>
          {/* Size chips after the sort buttons: only sizes something is in stock in */}
          <SizeFilter
            sizes={sizes}
            active={sizeParam}
            hrefFor={(size) => buildSortUrl(collection.handle, sortParam, size)}
          />
        </div>
      </div>

      <div className="container" style={{paddingTop: '1.5rem'}}>
        {!isLoading && collection.products.nodes.length > 0 && (
          <div className="catalog-meta">
            <span className="catalog-meta-count">
              {productCount} termék
              {sizeParam && <span className="catalog-meta-filters"> · {sizeParam} méret</span>}
            </span>
            {sizeParam && (
              <Link
                to={buildSortUrl(collection.handle, sortParam)}
                className="catalog-clear-btn"
                preventScrollReset
              >
                Szűrők törlése
              </Link>
            )}
          </div>
        )}
        <h2 className="sr-only">Termékek</h2>
        {isLoading ? (
          <ProductGridSkeleton />
        ) : collection.products.nodes.length === 0 ? (
          <div className="catalog-empty">
            <p className="catalog-empty-title">Nincs találat</p>
            <p className="catalog-empty-text">
              {sizeParam
                ? `Ebben a méretben (${sizeParam}) most nincs elérhető darab.`
                : 'Ebben a kollekcióban jelenleg nincs termék.'}
            </p>
            <Link
              to={sizeParam ? buildSortUrl(collection.handle, sortParam) : '/collections/all'}
              className="btn btn-outline"
            >
              {sizeParam ? 'Minden méret' : 'Összes termék'}
            </Link>
          </div>
        ) : (
          <PaginatedResourceSection<ProductItemFragment>
            connection={collection.products}
            resourcesClassName="products-grid"
          >
            {({node: product, index}) => (
              <ProductItem
                key={product.id}
                product={product}
                loading={index < 8 ? 'eager' : undefined}
              />
            )}
          </PaginatedResourceSection>
        )}
        <Analytics.CollectionView
          data={{
            collection: {
              id: collection.id,
              handle: collection.handle,
            },
          }}
        />
      </div>
    </div>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
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
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
    }
  }
` as const;

const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      seo {
        title
        description
      }
      image {
        url
        altText
        width
        height
      }
      products(
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
        sortKey: $sortKey
        reverse: $reverse
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
      }
    }
  }
` as const;

/** For the size filter: which sizes each product is in stock in (app/lib/sizes.ts) */
const COLLECTION_SIZES_QUERY = `#graphql
  query CollectionSizes(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: 250) {
        nodes {
          id
          variants(first: 20) {
            nodes {
              availableForSale
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
  }
` as const;
