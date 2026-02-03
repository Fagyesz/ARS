import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/artists.$handle';
import {getPaginationVariables} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';
import type {ProductItemFragment} from 'storefrontapi.generated';

// Artist data - in production this could come from Shopify Metaobjects
const ARTISTS_DATA: Record<string, {
  name: string;
  fullName: string;
  role: string;
  image: string;
  bio: string;
  statement: string;
  instagram?: string;
  collectionHandle: string;
}> = {
  ancsa: {
    name: 'Ancsa',
    fullName: 'Kovács Ancsa',
    role: 'Képzőművész',
    image: 'https://img1.wsimg.com/isteam/ip/622be809-0590-404a-9e0d-39dd0c8ecd22/Ancsa-8be534d.jpg',
    bio: 'Ancsa munkáiban a női test és a természet kapcsolatát vizsgálja. Alkotásaiban az organikus formák és a figuratív ábrázolás találkozik, egyedi vizuális világot teremtve.',
    statement: 'A művészetem a női test és a természet kapcsolatának felfedezéséről szól. Minden alkotásomban arra törekszem, hogy megmutassam az organikus formák és az emberi test közötti harmóniát. A "Női test", "Bogár" és "Napvilág/Holdvilág" sorozataim ezt a kapcsolatot különböző perspektívákból közelítik meg.',
    instagram: 'https://instagram.com/ancsa_art',
    collectionHandle: 'ancsa',
  },
  dori: {
    name: 'Dóri',
    fullName: 'Nagy Dóri',
    role: 'Képzőművész',
    image: 'https://img1.wsimg.com/isteam/ip/622be809-0590-404a-9e0d-39dd0c8ecd22/D%C3%B3ri.jpg',
    bio: 'Dóri a rovarok és a természet apró csodáit emeli művészetté. Részletgazdag alkotásai a bogarak egyedi szépségét mutatják be.',
    statement: 'A rovarok világa végtelenül lenyűgöz. A "Dongó", "Góliátbogár" és "Cserebogár" munkáimban ezeket az apró lényeket próbálom nagyítólencsén keresztül bemutatni, feltárva részleteik és mintázataik szépségét. A tarot kártyák inspirálta táskáim, mint a "The Tower" és "The Lovers", a misztikum és a természet találkozását képviselik.',
    instagram: 'https://instagram.com/dori_art',
    collectionHandle: 'dori',
  },
  gabor: {
    name: 'Gábor',
    fullName: 'Kiss Gábor',
    role: 'Képzőművész',
    image: 'https://img1.wsimg.com/isteam/ip/622be809-0590-404a-9e0d-39dd0c8ecd22/Screenshot_20250526_105914_Drive.jpg',
    bio: 'Gábor a víz alatti világ ihlette alkotásait jellemzi a fluid vonalvezetés és a kék árnyalatok játéka.',
    statement: 'A víz és a halak mozgása örök inspirációm. A "Hal" sorozatomban a tengeri élőlények dinamikus mozgását és a víz alatti fények játékát próbálom megragadni. A kék árnyalatok végtelen palettája lehetővé teszi, hogy minden munkámban új mélységeket fedezzek fel.',
    instagram: 'https://instagram.com/gabor_art',
    collectionHandle: 'gabor',
  },
  emese: {
    name: 'Emese',
    fullName: 'Tóth Emese',
    role: 'Képzőművész',
    image: 'https://img1.wsimg.com/isteam/ip/622be809-0590-404a-9e0d-39dd0c8ecd22/Emi.jpg',
    bio: 'Emese a grafikai technikák mestere. Szén, litográfia és linómetszet alkotásai a fény és árnyék kontrasztjára építenek.',
    statement: 'A hagyományos grafikai technikák - szén, litográfia, linómetszet - a kifejezésem alapjai. A "Szén", "Litó" és "Linó" munkáim a fény és árnyék drámai kontrasztját helyezik előtérbe. A minimalista megközelítés lehetővé teszi, hogy a lényegre koncentráljak.',
    instagram: 'https://instagram.com/emese_art',
    collectionHandle: 'emese',
  },
  zorka: {
    name: 'Zorka',
    fullName: 'Szabó Zorka',
    role: 'Képzőművész',
    image: 'https://img1.wsimg.com/isteam/ip/622be809-0590-404a-9e0d-39dd0c8ecd22/Zorka-1f0cb14.jpg',
    bio: 'Zorka karakteres portrékat és spirális motívumokat alkot. Munkáiban az emberi arc és a geometrikus formák találkoznak.',
    statement: 'Az emberi arc és a geometria kölcsönhatása foglalkoztat. A "Bácsi", "Tus" és "Festett" portréim karakteres arcokat ábrázolnak, míg a "Spirál" sorozatom a geometrikus formák és az organikus vonalak találkozását vizsgálja.',
    instagram: 'https://instagram.com/zorka_art',
    collectionHandle: 'zorka',
  },
  zsolt: {
    name: 'Zsolt',
    fullName: 'Molnár Zsolt',
    role: 'Képzőművész',
    image: 'https://img1.wsimg.com/isteam/ip/622be809-0590-404a-9e0d-39dd0c8ecd22/Zsolt-99e1a3d.jpg',
    bio: 'Zsolt a cianotype és digitális technikákat ötvözi munkáiban. Alkotásaiban a test és az illúzió témáját dolgozza fel.',
    statement: 'A cianotype technika és a digitális művészet ötvözése különleges lehetőségeket nyit meg számomra. A "Ciano", "Star", "Backturner", "Unravel" és "Illusion" munkáim a test és a fény kapcsolatát vizsgálják, játékos és gondolatébresztő módon.',
    instagram: 'https://instagram.com/zsolt_art',
    collectionHandle: 'zsolt',
  },
};

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

  if (!handle || !ARTISTS_DATA[handle]) {
    throw new Response('Artist not found', {status: 404});
  }

  const artist = ARTISTS_DATA[handle];
  const paginationVariables = getPaginationVariables(request, {pageBy: 8});

  // Fetch products by the artist (using vendor field or collection)
  const {products} = await storefront.query(ARTIST_PRODUCTS_QUERY, {
    variables: {
      vendor: artist.name,
      ...paginationVariables,
    },
  });

  return {
    artist: {...artist, handle},
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
              <img src={artist.image} alt={artist.name} />
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
              {products.map((product: ProductItemFragment, index: number) => (
                <ProductItem
                  key={product.id}
                  product={product}
                  loading={index < 4 ? 'eager' : undefined}
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
