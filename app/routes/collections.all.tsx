import type {Route} from './+types/collections.all';
import {useLoaderData, Link, useNavigation} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductItem} from '~/components/ProductItem';
import type {CollectionItemFragment} from 'storefrontapi.generated';
import {ARTISTS} from '~/lib/artists';
import {COLLECTION_TYPES} from '~/lib/config';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Katalógus | Ars Mosoris'},
    {name: 'description', content: 'Fedezd fel a teljes Ars Mosoris kollekcióját — egyedi póló és táska dizájnok magyar képzőművészektől.'},
  ];
};

const ARTIST_NAMES = ['Ars Mosoris', ...ARTISTS.map((a) => a.name)];

const TYPE_FILTERS = [{label: 'Összes', value: ''}, ...COLLECTION_TYPES];

const SORT_OPTIONS = [
  {label: 'Legújabb', value: ''},
  {label: 'Ár: növekvő', value: 'price-asc'},
  {label: 'Ár: csökkenő', value: 'price-desc'},
  {label: 'Név: A–Z', value: 'title-asc'},
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

function parseSortKey(sort: string): {sortKey: string; reverse: boolean} {
  switch (sort) {
    case 'price-asc':
      return {sortKey: 'PRICE', reverse: false};
    case 'price-desc':
      return {sortKey: 'PRICE', reverse: true};
    case 'title-asc':
      return {sortKey: 'TITLE', reverse: false};
    default:
      return {sortKey: 'CREATED_AT', reverse: true};
  }
}

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  const url = new URL(request.url);
  const artistFilter = url.searchParams.get('artist') || '';
  const typeFilter = url.searchParams.get('type') || '';
  const sortParam = (url.searchParams.get('sort') || '') as SortValue;
  const {sortKey, reverse} = parseSortKey(sortParam);

  const paginationVariables = getPaginationVariables(request, {
    pageBy: 12,
  });

  const queryParts: string[] = [];
  if (artistFilter) queryParts.push(artistFilter);
  if (typeFilter) queryParts.push(typeFilter);
  const query = queryParts.join(' ');

  const [{products}] = await Promise.all([
    storefront.query(CATALOG_QUERY, {
      variables: {...paginationVariables, query, sortKey, reverse},
      cache: storefront.CacheShort(),
    }),
  ]);

  return {products, artistFilter, typeFilter, sortParam};
}

function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Collection() {
  const {products, artistFilter, typeFilter, sortParam} =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  return (
    <div className="section">
      <div className="container">
        <div className="text-center mb-8">
          <h1>Katalógus</h1>
          <p className="text-muted">
            Válassz kedveseid közül — hat tehetséges művész munkái
          </p>
        </div>

        {/* Filter + Sort bar */}
        <div className="shop-filters">
          <div className="shop-filter-group">
            <span className="shop-filter-label">Típus</span>
            {TYPE_FILTERS.map((type) => (
              <Link
                key={type.value}
                to={buildFilterUrl({artist: artistFilter, type: type.value, sort: sortParam})}
                className={`shop-filter-pill${typeFilter === type.value ? ' active' : ''}`}
              >
                {type.label}
              </Link>
            ))}
          </div>
          <div className="shop-filter-group">
            <span className="shop-filter-label">Alkotó</span>
            <Link
              to={buildFilterUrl({artist: '', type: typeFilter, sort: sortParam})}
              className={`shop-filter-pill${!artistFilter ? ' active' : ''}`}
            >
              Összes
            </Link>
            {ARTIST_NAMES.map((artist) => (
              <Link
                key={artist}
                to={buildFilterUrl({artist, type: typeFilter, sort: sortParam})}
                className={`shop-filter-pill${artistFilter === artist ? ' active' : ''}`}
              >
                {artist}
              </Link>
            ))}
          </div>
          <div className="shop-filter-group shop-sort-group">
            <span className="shop-filter-label">Rendezés</span>
            <select
              className="shop-sort-select"
              title="Rendezési sorrend"
              value={sortParam}
              onChange={(e) => {
                const url = buildFilterUrl({
                  artist: artistFilter,
                  type: typeFilter,
                  sort: e.target.value,
                });
                window.location.href = url;
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <ProductGridSkeleton />
        ) : products.nodes.length === 0 ? (
          <div className="shop-empty">
            <p>Nincs eredmény a kiválasztott szűrőkre.</p>
            <Link to="/collections/all" className="btn btn-outline">
              Szűrők törölése
            </Link>
          </div>
        ) : (
          <PaginatedResourceSection<CollectionItemFragment>
            connection={products}
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
      </div>
    </div>
  );
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

function buildFilterUrl({artist, type, sort}: {artist: string; type: string; sort: string}) {
  const params = new URLSearchParams();
  if (artist) params.set('artist', artist);
  if (type) params.set('type', type);
  if (sort) params.set('sort', sort);
  const query = params.toString();
  return `/collections/all${query ? `?${query}` : ''}`;
}

const COLLECTION_ITEM_FRAGMENT = `#graphql
  fragment MoneyCollectionItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment CollectionItem on Product {
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
        ...MoneyCollectionItem
      }
      maxVariantPrice {
        ...MoneyCollectionItem
      }
    }
  }
` as const;

const CATALOG_QUERY = `#graphql
  ${COLLECTION_ITEM_FRAGMENT}
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $query: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
      query: $query
      sortKey: $sortKey
      reverse: $reverse
    ) {
      nodes {
        ...CollectionItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
` as const;
