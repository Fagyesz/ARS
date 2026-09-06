import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/artists.$handle';
import {getPaginationVariables} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';
import type {ProductItemFragment} from 'storefrontapi.generated';
import {artistPortrait} from '~/lib/artists';
import {loadSiteContent} from '~/lib/content';
import {breadcrumbJsonLd, jsonLd, productListJsonLd, seoMeta} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, location}) => {
  const artist = data?.artist;
  return seoMeta({
    title: artist ? `${artist.name} (${artist.fullName})` : 'Alkotó',
    description: artist?.bio,
    path: location.pathname,
    image: artist?.image,
  });
};

export async function loader({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  // artists live in Shopify (artist metaobjects), with the built-in list as fallback
  const {artists} = await loadSiteContent(storefront);
  const artist = handle ? artists.find((a) => a.handle === handle) : undefined;

  if (!artist) {
    throw new Response('Artist not found', {status: 404});
  }

  // No artist has more than a dozen pieces, so one page covers them all
  const paginationVariables = getPaginationVariables(request, {pageBy: 50});

  const {products} = await storefront.query(ARTIST_PRODUCTS_QUERY, {
    variables: {
      // scope to the vendor field, not a free-text match on the name
      vendor: `vendor:"${(artist.vendor ?? artist.name).replace(/"/g, '')}"`,
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
  const portrait = artistPortrait(artist);

  return (
    <div className="artist-profile">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([
            breadcrumbJsonLd([
              {name: 'Alkotóink', path: '/artists'},
              {name: artist.name},
            ]),
            productListJsonLd(products),
          ]),
        }}
      />
      {/* Hero section with portrait */}
      <section className="artist-hero">
        <div className="container">
          <div className="artist-hero-grid">
            <div className="artist-hero-image">
              {portrait && (
                <img
                  src={portrait.src}
                  srcSet={portrait.srcSet}
                  sizes="(min-width: 768px) 40vw, 100vw"
                  width={portrait.width}
                  height={portrait.height}
                  alt={`${artist.fullName}, ${artist.role.toLowerCase()}`}
                  loading="eager"
                  fetchPriority="high"
                />
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
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
` as const;
