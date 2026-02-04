import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/artists.$handle';
import {getPaginationVariables} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';
import type {ProductItemFragment} from 'storefrontapi.generated';
import {ARTISTS} from '~/lib/artists';

export const meta: Route.MetaFunction = ({data}) => {
  const artist = data?.artist;
  return [
    {title: `${artist?.name ?? 'Alkotó'} | Ars Mosoris`},
    {
      name: 'description',
      content: artist?.bio || 'Ars Mosoris alkotó',
    },
  ];
};

export async function loader({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  const artist = handle ? ARTISTS.find((a) => a.handle === handle) : undefined;

  if (!artist) {
    throw new Response('Artist not found', {status: 404});
  }

  const paginationVariables = getPaginationVariables(request, {pageBy: 8});

  const {products} = await storefront.query(ARTIST_PRODUCTS_QUERY, {
    variables: {
      vendor: artist.name,
      ...paginationVariables,
    },
  });

  return {
    artist,
    products: products.nodes,
  };
}

export default function ArtistProfile() {
  const {artist, products} = useLoaderData<typeof loader>();

  return (
    <div className="artist-profile">
      {/* Hero section with portrait */}
      <section className="artist-hero">
        <div className="container">
          <div className="artist-hero-grid">
            <div className="artist-hero-image">
              {artist.image && (
                <img src={artist.image} alt={artist.name} />
              )}
            </div>
            <div className="artist-hero-content">
              <Link to="/artists" className="artist-back-link">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Vissza az alkotókhoz
              </Link>
              <h1>{artist.name}</h1>
              <p className="artist-role">{artist.role}</p>
              <p className="artist-bio">{artist.bio}</p>
              {artist.instagram && (
                <a
                  href={artist.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="artist-social-link"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Artist statement */}
      <section className="section artist-statement-section">
        <div className="container">
          <div className="artist-statement">
            <h2>Művészi hitvallás</h2>
            <blockquote>"{artist.statement}"</blockquote>
          </div>
        </div>
      </section>

      {/* Products grid */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-8">
            <h2>{artist.name} alkotásai</h2>
            <p className="text-muted">Fedezd fel a művész viselhetővé vált munkáit</p>
          </div>
          {products.length > 0 ? (
            <div className="products-grid">
              {products.map((product: ProductItemFragment) => (
                <ProductItem
                  key={product.id}
                  product={product}
                  loading="lazy"
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted">
              Hamarosan érkeznek {artist.name} termékei!
            </p>
          )}
          <div className="text-center mt-8">
            <Link to="/collections/all" className="btn btn-outline">
              Összes termék megtekintése
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const ARTIST_PRODUCTS_QUERY = `#graphql
  query ArtistProducts(
    $country: CountryCode
    $language: LanguageCode
    $vendor: String!
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor,
      query: $vendor
    ) {
      nodes {
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
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
` as const;
