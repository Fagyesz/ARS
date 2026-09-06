import {
  Await,
  useLoaderData,
  useActionData,
  useNavigation,
  useRouteLoaderData,
  Link,
  Form,
} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import type {RecommendedProductsQuery, HomepageCollectionsQuery} from 'storefrontapi.generated';
import {ARTISTS, artistPortrait} from '~/lib/artists';
import {ProductItem} from '~/components/ProductItem';
import {seoMeta} from '~/lib/seo';
import {SHOP_COLLECTIONS} from '~/lib/config';
import {CAMPAIGN_PATH, untilHu} from '~/lib/campaigns';
import type {RootLoader} from '~/root';

// The hero watermark is the largest paint on the home page; let the browser
// fetch it before it discovers the CSS background rule.
export const links: Route.LinksFunction = () => [
  {rel: 'preload', as: 'image', href: '/logo-820.png'},
];

export const meta: Route.MetaFunction = ({location}) =>
  seoMeta({
    title: 'Ars Mosoris | Kortárs művészet és divat',
    rawTitle: true,
    description:
      'Négy képzőművész által alapított márka, ahol a mindennapi viselet és a kortárs művészet találkozik. Kézzel nyomott pólók, pulóverek és egyedi darabok magyar alkotóktól.',
    path: location.pathname,
  });

export async function loader(args: Route.LoaderArgs) {
  return loadDeferredData(args);
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const {storefront} = context;
  // Curated picks carry the "kiemelt" tag in Shopify admin; fall back to the
  // most recently updated products if fewer than 4 are tagged.
  const recommendedProducts = storefront
    .query(RECOMMENDED_PRODUCTS_QUERY, {
      variables: {query: 'tag:kiemelt'},
      cache: storefront.CacheLong(),
    })
    .then((tagged) =>
      (tagged?.products.nodes.length ?? 0) >= 4
        ? tagged
        : storefront.query(RECOMMENDED_PRODUCTS_QUERY, {
            variables: {query: null},
            cache: storefront.CacheLong(),
          }),
    )
    .catch((error: Error) => {
      console.error(error);
      return null;
    });

  const collections = context.storefront
    .query(HOMEPAGE_COLLECTIONS_QUERY, {cache: context.storefront.CacheLong()})
    .catch((error: Error) => {
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
    collections,
  };
}

const CUSTOMER_CREATE_MUTATION = `#graphql
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer { id }
      customerUserErrors { code field message }
    }
  }
` as const;

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;

  // marketing consent must be an active choice (GDPR): the checkbox is required
  if (!email || formData.get('consent') !== 'on') return {success: false};

  try {
    // 1. Create customer in Shopify with marketing consent
    const randomPassword = crypto.randomUUID();
    const {data} = await context.storefront.mutate(CUSTOMER_CREATE_MUTATION, {
      variables: {
        input: {
          email,
          password: randomPassword,
          acceptsMarketing: true,
        },
      },
    });

    const errors = data?.customerCreate?.customerUserErrors ?? [];
    // "TAKEN" means customer already exists — that's fine
    if (errors.length > 0 && errors[0].code !== 'TAKEN') {
      console.error('[newsletter] Shopify error:', errors[0].message);
    }

    // 2. Send confirmation emails via Resend (non-blocking)
    const resendKey = context.env.RESEND_API_KEY;
    const fromEmail = context.env.FROM_EMAIL;
    const contactEmail = context.env.CONTACT_EMAIL;

    if (resendKey && fromEmail) {
      const origin = new URL(request.url).origin;
      const sendEmail = async (payload: object) => {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          console.error(`[newsletter] Resend ${res.status}: ${await res.text()}`);
        }
      };

      await Promise.all([
        sendEmail({
          from: fromEmail,
          to: [email],
          subject: 'Feliratkozás megerősítve – Ars Mosoris',
          text: [
            'Szia!',
            '',
            'Sikeres feliratkozás a hírlevelünkre! Hamarosan értesítünk az akciókról és az új termékekről.',
            '',
            `Termékek megtekintése: ${origin}`,
            '',
            'Üdvözlet,',
            'Ars Mosoris',
          ].join('\n'),
        }),
        sendEmail({
          from: fromEmail,
          to: [contactEmail],
          subject: 'Új hírlevél feliratkozó',
          text: `Új feliratkozó: ${email}`,
        }),
      ]);
    }

    return {success: true};
  } catch (err) {
    console.error('[newsletter] Exception:', err);
    return {success: false};
  }
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home">
      <HeroSection />
      <FeaturedProducts products={data.recommendedProducts} />
      <CollectionsSection collections={data.collections} />
      <ArtistsPreview />
      <NewsletterSection />
    </div>
  );
}

function HeroSection() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const campaign = rootData?.campaigns?.[0];
  const until = campaign ? untilHu(campaign.endsAt) : '';
  return (
    <section className="hero">
      <div className="hero-background" />
      <div className="hero-overlay" />
      <div className="hero-content">
        {campaign && (
          <Link to={CAMPAIGN_PATH} className="hero-meta hero-campaign" prefetch="intent">
            <span className="hero-meta-number">{campaign.copy.shortLabel}</span>
            <span className="hero-meta-sep" />
            <span className="hero-meta-city">
              {campaign.title}
              {until ? ` ${until}` : ''} →
            </span>
          </Link>
        )}
        <h1 className="hero-title">
          <span className="hero-title-line">Ars</span>
          <span className="hero-title-line hero-title-line--indent">Mosoris</span>
        </h1>
        <div className="hero-divider" />
        <p className="hero-subtitle">Ahol a művészet viselhetővé válik</p>
        <div className="hero-cta">
          <Link to="/collections/all" className="btn btn-primary">
            Irány a bolt
          </Link>
          <Link to="/artists" className="btn btn-outline hero-btn-ghost">
            Alkotóink
          </Link>
        </div>
      </div>
      <div className="hero-marquee-track">
        <div className="hero-marquee" aria-hidden="true">
          {[0,1,2,3,4,5].map((i) => (
            <span key={i} className="hero-marquee-set">
              <span>Kortárs Művészet</span>
              <span className="hero-marquee-dot">◆</span>
              <span>Magyar Design</span>
              <span className="hero-marquee-dot">◆</span>
              <span>Egyedi Ruházat</span>
              <span className="hero-marquee-dot">◆</span>
              <span>Képzőművészet</span>
              <span className="hero-marquee-dot">◆</span>
              <span>Kézzel Készített</span>
              <span className="hero-marquee-dot">◆</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  return (
    <section className="section">
      <div className="container">
        <div className="text-center mb-8">
          <h2>Kiemelt termékek</h2>
          <p className="text-muted">Válogatás alkotóink legújabb munkáiból</p>
        </div>
        <Suspense fallback={<ProductGridSkeleton />}>
          <Await resolve={products}>
            {(response) => (
              <div className="products-grid">
                {response?.products.nodes.map((product) => (
                  <ProductItem key={product.id} product={product} />
                ))}
              </div>
            )}
          </Await>
        </Suspense>
        <div className="text-center mt-8">
          <Link to="/collections/all" className="btn btn-secondary">
            Összes termék
          </Link>
        </div>
      </div>
    </section>
  );
}


function ProductGridSkeleton() {
  return (
    <div className="products-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="product-card skeleton-card">
          <div className="product-card-image skeleton-image" />
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

function CollectionsSection({
  collections,
}: {
  collections: Promise<HomepageCollectionsQuery | null>;
}) {
  return (
    <Suspense fallback={null}>
      <Await resolve={collections}>
        {(data) => {
          // Only curated, customer-facing collections: skip Shopify's default
          // "frontpage" collection and anything without a cover image, and show
          // the categories in navigation order.
          const order = SHOP_COLLECTIONS.map((c) => c.handle);
          const rank = (handle: string) => {
            const i = order.indexOf(handle);
            return i === -1 ? order.length : i;
          };
          const nodes = (data?.collections?.nodes ?? [])
            .filter((c) => c.handle !== 'frontpage' && c.image)
            .sort((a, b) => rank(a.handle) - rank(b.handle));
          if (!nodes.length) return null;
          return (
            <section className="collections-drops-section">
              <div className="container">
                <div className="collections-drops-header">
                  <span className="collections-drops-label">Kollekciók</span>
                  <h2>Válogatott sorozataink</h2>
                </div>
                <div className="collections-drops-grid">
                  {nodes.map((collection) => (
                    <Link
                      key={collection.id}
                      to={`/collections/${collection.handle}`}
                      className="collection-drop-card"
                    >
                      <div className="collection-drop-image">
                        <img
                          src={`${collection.image!.url}${collection.image!.url.includes('?') ? '&' : '?'}width=800`}
                          srcSet={[400, 800, 1200]
                            .map((w) => `${collection.image!.url}${collection.image!.url.includes('?') ? '&' : '?'}width=${w} ${w}w`)
                            .join(', ')}
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          width={collection.image!.width ?? undefined}
                          height={collection.image!.height ?? undefined}
                          alt={collection.image!.altText || collection.title}
                          loading="lazy"
                        />
                      </div>
                      <div className="collection-drop-overlay">
                        <h3 className="collection-drop-title">{collection.title}</h3>
                        <span className="collection-drop-cta">Megnézem →</span>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="text-center collections-cta">
                  <Link
                    to="/collections"
                    className="btn btn-outline btn-outline-on-dark"
                  >
                    Összes kollekció
                  </Link>
                </div>
              </div>
            </section>
          );
        }}
      </Await>
    </Suspense>
  );
}

function ArtistsPreview() {
  return (
    <section className="section section-alt">
      <div className="container">
        <div className="text-center mb-8">
          <h2>Alkotóink</h2>
          <p className="text-muted">
            Négy tehetséges művész, négy egyedi látásmód
          </p>
        </div>
        <div className="artists-grid">
          {ARTISTS.map((artist) => {
            const portrait = artistPortrait(artist);
            return (
            <Link
              key={artist.handle}
              to={`/artists/${artist.handle}`}
              className="artist-card"
            >
              <div className="artist-card-image">
                {portrait && (
                  <img
                    src={portrait.src}
                    srcSet={portrait.srcSet}
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    width={portrait.width}
                    height={portrait.height}
                    alt={artist.name}
                    loading="lazy"
                  />
                )}
              </div>
              <div className="artist-card-overlay">
                <span className="artist-card-name">{artist.name}</span>
                <span className="artist-card-role">{artist.role}</span>
              </div>
            </Link>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <Link to="/artists" className="btn btn-outline">
            Ismerd meg az alkotókat
          </Link>
        </div>
      </div>
    </section>
  );
}

function NewsletterSection() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  if (actionData?.success) {
    return (
      <section className="newsletter" id="newsletter">
        <h2 className="newsletter-title">Köszönjük!</h2>
        <p className="newsletter-subtitle">
          Feliratkoztál a hírlevelünkre. Az új darabokról és az akciókról elsőként értesítünk.
        </p>
      </section>
    );
  }

  return (
    <section className="newsletter" id="newsletter">
      <h2 className="newsletter-title">Első kézből az új darabokról</h2>
      <p className="newsletter-subtitle">
        Új kollekciók, események és akciók, havonta legfeljebb egyszer. Nincs spam.
      </p>
      <Form method="post" className="newsletter-form" id="newsletter-form-id">
        <input
          type="email"
          name="email"
          placeholder="E-mail címed"
          aria-label="E-mail cím"
          className="newsletter-input"
          required
        />
        <button type="submit" className="newsletter-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Feldolgozás...' : 'Feliratkozás'}
        </button>
      </Form>
      <label className="newsletter-consent">
        <input type="checkbox" name="consent" form="newsletter-form-id" required />
        <span>
          Kérem a hírlevelet, és elfogadom az{' '}
          <Link to="/policies/privacy-policy">adatkezelési tájékoztatót</Link>.
        </span>
      </label>
      {actionData && !actionData.success && (
        <p className="newsletter-error">
          Nem sikerült a feliratkozás. Ellenőrizd az e-mail címet és a hozzájárulást, majd próbáld újra!
        </p>
      )}
    </section>
  );
}

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    vendor
    tags
    availableForSale
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode, $query: String)
    @inContext(country: $country, language: $language) {
    products(first: 8, query: $query, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;

const HOMEPAGE_COLLECTIONS_QUERY = `#graphql
  fragment HomepageCollection on Collection {
    id
    title
    handle
    image {
      url
      altText
      width
      height
    }
  }
  query HomepageCollections($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 10, sortKey: UPDATED_AT) {
      nodes {
        ...HomepageCollection
      }
    }
  }
` as const;

