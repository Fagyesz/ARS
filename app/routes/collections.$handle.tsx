import {redirect, useLoaderData, Link, useNavigation} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductItem} from '~/components/ProductItem';
import type {ProductItemFragment} from 'storefrontapi.generated';

// eslint-disable-next-line @typescript-eslint/no-deprecated
export const meta: Route.MetaFunction = ({data}) => {
  const title = `${data?.collection.title ?? 'Kollekció'} | Ars Mosoris`;
  const description = data?.collection.description || 'Ars Mosoris kollekció';
  const image = data?.collection.image?.url ?? 'https://arsmosoris.vincze.app/og-default.png';
  return [
    {title},
    {name: 'description', content: description},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:image', content: image},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};

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
  const {sortKey, reverse} = parseSortKey(sortParam);
  const paginationVariables = getPaginationVariables(request, {pageBy: 12});

  if (!handle) {
    throw redirect('/collections');
  }

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, ...paginationVariables, sortKey, reverse},
      cache: storefront.CacheShort(),
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {collection, sortParam};
}

function loadDeferredData(_args: Route.LoaderArgs) {
  return {};
}

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

function buildSortUrl(handle: string, sort: string) {
  const params = new URLSearchParams();
  if (sort) params.set('sort', sort);
  return `/collections/${handle}${params.toString() ? `?${params}` : ''}`;
}

export default function Collection() {
  const {collection, sortParam} = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  return (
    <div className="collection-page">
      {/* Hero */}
      {collection.image ? (
        <div className="collection-hero">
          <img
            src={collection.image.url}
            alt={collection.image.altText || collection.title}
            className="collection-hero-image"
          />
          <div className="collection-hero-overlay">
            <nav className="collection-hero-breadcrumb">
              <Link to="/collections/all">Katalógus</Link>
              <span> / </span>
              <span>{collection.title}</span>
            </nav>
            <h1 className="collection-hero-title">{collection.title}</h1>
            {collection.description && (
              <p className="collection-hero-desc">{collection.description}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="collection-text-header container">
          <nav className="breadcrumb">
            <Link to="/collections/all">Katalógus</Link>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{collection.title}</span>
          </nav>
          <h1>{collection.title}</h1>
          {collection.description && (
            <p className="text-muted" style={{maxWidth: '600px', margin: '0 auto'}}>
              {collection.description}
            </p>
          )}
        </div>
      )}

      {/* Sort bar */}
      <div className="catalog-filters">
        <div className="catalog-filters-inner container">
          <div className="catalog-filter-section catalog-sort-section" style={{marginLeft: 'auto', paddingLeft: 0}}>
            <span className="catalog-sort-label">Rendezés:</span>
            {SORT_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                to={buildSortUrl(collection.handle, opt.value)}
                className={`catalog-sort-btn${sortParam === opt.value ? ' active' : ''}`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{paddingTop: '1.5rem'}}>
        {isLoading ? (
          <ProductGridSkeleton />
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
  }
` as const;

const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
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
      image {
        url
        altText
      }
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        sortKey: $sortKey,
        reverse: $reverse
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;
