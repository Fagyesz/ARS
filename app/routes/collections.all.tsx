import type {Route} from './+types/collections.all';
import {useLoaderData, Link} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductItem} from '~/components/ProductItem';
import type {CollectionItemFragment} from 'storefrontapi.generated';
import {ARTISTS} from '~/lib/artists';
import {COLLECTION_TYPES} from '~/lib/config';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Katalógus | Ars Mosoris'}];
};

const ARTIST_NAMES = ['Ars Mosoris', ...ARTISTS.map((a) => a.name)];

const TYPE_FILTERS = [{label: 'Összes', value: ''}, ...COLLECTION_TYPES];

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

  const paginationVariables = getPaginationVariables(request, {
    pageBy: 12,
  });

  // Build search query from active filters
  const queryParts: string[] = [];
  if (artistFilter) queryParts.push(artistFilter);
  if (typeFilter) queryParts.push(typeFilter);
  const query = queryParts.join(' ');

  const [{products}] = await Promise.all([
    storefront.query(CATALOG_QUERY, {
      variables: {...paginationVariables, query},
    }),
  ]);

  return {products, artistFilter, typeFilter};
}

function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Collection() {
  const {products, artistFilter, typeFilter} =
    useLoaderData<typeof loader>();

  return (
    <div className="section">
      <div className="container">
        <div className="text-center mb-8">
          <h1>Katalógus</h1>
          <p className="text-muted">
            Válassz kedveseid közül — hat tehetséges művész munkái
          </p>
        </div>

        {/* Filter bar */}
        <div className="shop-filters">
          <div className="shop-filter-group">
            <span className="shop-filter-label">Típus</span>
            {TYPE_FILTERS.map((type) => (
              <Link
                key={type.value}
                to={buildFilterUrl({artist: artistFilter, type: type.value})}
                className={`shop-filter-pill${typeFilter === type.value ? ' active' : ''}`}
              >
                {type.label}
              </Link>
            ))}
          </div>
          <div className="shop-filter-group">
            <span className="shop-filter-label">Alkotó</span>
            <Link
              to={buildFilterUrl({artist: '', type: typeFilter})}
              className={`shop-filter-pill${!artistFilter ? ' active' : ''}`}
            >
              Összes
            </Link>
            {ARTIST_NAMES.map((artist) => (
              <Link
                key={artist}
                to={buildFilterUrl({artist, type: typeFilter})}
                className={`shop-filter-pill${artistFilter === artist ? ' active' : ''}`}
              >
                {artist}
              </Link>
            ))}
          </div>
        </div>

        {/* Product grid or empty state */}
        {products.nodes.length === 0 ? (
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

function buildFilterUrl({artist, type}: {artist: string; type: string}) {
  const params = new URLSearchParams();
  if (artist) params.set('artist', artist);
  if (type) params.set('type', type);
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
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor, query: $query) {
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
