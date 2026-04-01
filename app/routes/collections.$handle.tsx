import {redirect, useLoaderData, Link, useNavigation} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductItem} from '~/components/ProductItem';
import type {ProductItemFragment} from 'storefrontapi.generated';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `${data?.collection.title ?? 'Kollekció'} | Ars Mosoris`},
    {
      name: 'description',
      content: data?.collection.description || 'Ars Mosoris kollekció',
    },
  ];
};

const SORT_OPTIONS = [
  {label: 'Legújabb', value: ''},
  {label: 'Ár: növekvő', value: 'price-asc'},
  {label: 'Ár: csökkenő', value: 'price-desc'},
  {label: 'Név: A–Z', value: 'title-asc'},
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

function parseSortKey(sort: string): {sortKey: string; reverse: boolean} {
  switch (sort) {
    case 'price-asc': return {sortKey: 'PRICE', reverse: false};
    case 'price-desc': return {sortKey: 'PRICE', reverse: true};
    case 'title-asc': return {sortKey: 'TITLE', reverse: false};
    default: return {sortKey: 'CREATED_AT', reverse: true};
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

function loadDeferredData({context}: Route.LoaderArgs) {
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

export default function Collection() {
  const {collection, sortParam} = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  return (
    <div className="section">
      <div className="container">
        <nav className="breadcrumb">
          <Link to="/collections/all">Bolt</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{collection.title}</span>
        </nav>

        <div className="text-center mb-8">
          <h1>{collection.title}</h1>
          {collection.description && (
            <p className="text-muted" style={{maxWidth: '600px', margin: '0 auto'}}>
              {collection.description}
            </p>
          )}
        </div>

        <div className="shop-filters">
          <div className="shop-filter-group shop-sort-group">
            <span className="shop-filter-label">Rendezés</span>
            <select
              className="shop-sort-select"
              title="Rendezési sorrend"
              value={sortParam}
              onChange={(e) => {
                const params = new URLSearchParams();
                if (e.target.value) params.set('sort', e.target.value);
                window.location.href = `/collections/${collection.handle}${params.toString() ? `?${params}` : ''}`;
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

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
