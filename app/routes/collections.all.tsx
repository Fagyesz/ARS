import type {Route} from './+types/collections.all';
import {useLoaderData, Link, useNavigation} from 'react-router';
import {ProductItem} from '~/components/ProductItem';
import type {CollectionItemFragment} from 'storefrontapi.generated';
import {ARTISTS} from '~/lib/artists';
import {COLLECTION_TYPES} from '~/lib/config';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Katalógus | Ars Mosoris'},
    {name: 'description', content: 'Fedezd fel a teljes Ars Mosoris kollekcióját — egyedi póló és táska dizájnok magyar képzőművészektől.'},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'Katalógus | Ars Mosoris'},
    {property: 'og:description', content: 'Fedezd fel a teljes Ars Mosoris kollekcióját — egyedi póló és táska dizájnok magyar képzőművészektől.'},
    {property: 'og:image', content: 'https://arsmosoris.vincze.app/og-default.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};

const TYPE_FILTERS = [{label: 'Összes', value: ''}, ...COLLECTION_TYPES];

const SORT_OPTIONS = [
  {label: 'Legújabb', value: ''},
  {label: 'Ár ↑', value: 'price-asc'},
  {label: 'Ár ↓', value: 'price-desc'},
  {label: 'A–Z', value: 'title-asc'},
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

  const queryParts: string[] = [];
  if (artistFilter) queryParts.push(artistFilter);
  if (typeFilter) queryParts.push(typeFilter);
  const query = queryParts.join(' ');

  const {products} = await storefront.query(CATALOG_QUERY, {
    variables: {query, sortKey: sortKey as any, reverse},
    cache: storefront.CacheShort(),
  });

  return {products, artistFilter, typeFilter, sortParam};
}

function loadDeferredData(_args: Route.LoaderArgs) {
  return {};
}

function buildFilterUrl({artist, type, sort}: {artist: string; type: string; sort: string}) {
  const params = new URLSearchParams();
  if (artist) params.set('artist', artist);
  if (type) params.set('type', type);
  if (sort) params.set('sort', sort);
  const query = params.toString();
  return `/collections/all${query ? `?${query}` : ''}`;
}

export default function Collection() {
  const {products, artistFilter, typeFilter, sortParam} = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  const hasFilters = !!(artistFilter || typeFilter);
  const activeFilterLabel = [
    artistFilter || null,
    typeFilter ? COLLECTION_TYPES.find((t) => t.value === typeFilter)?.label : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="catalog-page">
      {/* Page header */}
      <div className="catalog-header container">
        <h1>Katalógus</h1>
        <p className="catalog-header-sub">Négy tehetséges művész egyedi munkái</p>
      </div>

      {/* Sticky filter + sort bar */}
      <div className="catalog-filters">
        <div className="catalog-filters-inner container">
          {/* Artist chips */}
          <div className="catalog-filter-section">
            <Link
              to={buildFilterUrl({artist: '', type: typeFilter, sort: sortParam})}
              className={`catalog-artist-chip${!artistFilter ? ' active' : ''}`}
            >
              <span className="catalog-artist-name">Összes</span>
            </Link>
            {ARTISTS.map((artist) => (
              <Link
                key={artist.name}
                to={buildFilterUrl({artist: artist.name, type: typeFilter, sort: sortParam})}
                className={`catalog-artist-chip${artistFilter === artist.name ? ' active' : ''}`}
              >
                <span className="catalog-artist-initial">{artist.name[0]}</span>
                <span className="catalog-artist-name">{artist.name}</span>
              </Link>
            ))}
            <Link
              to={buildFilterUrl({artist: 'Ars Mosoris', type: typeFilter, sort: sortParam})}
              className={`catalog-artist-chip${artistFilter === 'Ars Mosoris' ? ' active' : ''}`}
            >
              <span className="catalog-artist-initial">A</span>
              <span className="catalog-artist-name">Ars Mosoris</span>
            </Link>
          </div>

          <span className="catalog-filter-divider" aria-hidden="true" />

          {/* Type chips */}
          <div className="catalog-filter-section">
            {TYPE_FILTERS.map((type) => (
              <Link
                key={type.value}
                to={buildFilterUrl({artist: artistFilter, type: type.value, sort: sortParam})}
                className={`catalog-type-chip${typeFilter === type.value ? ' active' : ''}`}
              >
                {type.label}
              </Link>
            ))}
          </div>

          <span className="catalog-filter-divider" aria-hidden="true" />

          {/* Sort buttons */}
          <div className="catalog-filter-section catalog-sort-section">
            {SORT_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                to={buildFilterUrl({artist: artistFilter, type: typeFilter, sort: opt.value})}
                className={`catalog-sort-btn${sortParam === opt.value ? ' active' : ''}`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        {products.nodes.length === 0 && !isLoading ? (
          <div className="catalog-empty">
            <p className="catalog-empty-title">Nincs találat</p>
            <p className="catalog-empty-text">
              Próbálj más szűrőkombinációt, vagy böngéssz a teljes kínálatban.
            </p>
            <Link to="/collections/all" className="btn btn-outline">
              Összes termék
            </Link>
          </div>
        ) : (
          <div className={isLoading ? 'shop-grid-loading' : undefined}>
            {(hasFilters || products.nodes.length > 0) && (
              <div className="catalog-meta">
                <span className="catalog-meta-count">
                  {products.nodes.length} termék
                  {activeFilterLabel && (
                    <span className="catalog-meta-filters"> · {activeFilterLabel}</span>
                  )}
                </span>
                {hasFilters && (
                  <Link to="/collections/all" className="catalog-clear-btn">
                    Szűrők törlése
                  </Link>
                )}
              </div>
            )}
            <div className="products-grid">
              {products.nodes.map((product, index) => (
                <ProductItem
                  key={product.id}
                  product={product}
                  loading={index < 8 ? 'eager' : undefined}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
    $query: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    products(
      first: 500
      query: $query
      sortKey: $sortKey
      reverse: $reverse
    ) {
      nodes {
        ...CollectionItem
      }
    }
  }
` as const;
