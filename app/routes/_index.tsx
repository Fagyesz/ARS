import {Await, useLoaderData, useActionData, useNavigation, Link, Form} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import type {RecommendedProductsQuery, StoreCollectionsQuery} from 'storefrontapi.generated';
import {ARTISTS} from '~/lib/artists';
import {ProductItem} from '~/components/ProductItem';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Ars Mosoris | Kortárs Művészet & Divat'},
    {
      name: 'description',
      content:
        'Négy képzőművész által alapított márka, ahol a mindennapi viselet és a kortárs művészet találkozik.',
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'Ars Mosoris — Magyar Képzőművészeti Bolt'},
    {property: 'og:description', content: 'Fedezd fel egyedi póló és táska dizájnjainkat, magyar képzőművészek alkotásaival.'},
    {property: 'og:image', content: '/og-default.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};

export async function loader(args: Route.LoaderArgs) {
  return loadDeferredData(args);
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY, {cache: context.storefront.CacheLong()})
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

  if (!email) return {success: false};

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
  return (
    <section className="hero">
      <div className="hero-background" />
      <div className="hero-overlay" />
      <div className="hero-content">
        
        <h1 className="hero-title">
          <span className="hero-title-line">Ars</span>
          <span className="hero-title-line hero-title-line--indent">Mosoris</span>
        </h1>
        <div className="hero-divider" />
        <p className="hero-subtitle">Ahol a művészet viselhetővé válik</p>
        <div className="hero-cta">
          <Link to="/collections/all" className="btn btn-primary">
            Shop megtekintése
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
  collections: Promise<StoreCollectionsQuery | null>;
}) {
  return (
    <section className="collections-drops-section">
      <div className="container">
        <div className="collections-drops-header">
          <span className="collections-drops-label">Kollekciók</span>
          <h2>Válogatott sorozataink</h2>
        </div>
        <Suspense fallback={<div className="collections-drops-skeleton" />}>
          <Await resolve={collections}>
            {(data) => {
              const nodes = data?.collections?.nodes ?? [];
              if (!nodes.length) return null;
              return (
                <div className="collections-drops-grid">
                  {nodes.map((collection) => (
                    <Link
                      key={collection.id}
                      to={`/collections/${collection.handle}`}
                      className="collection-drop-card"
                    >
                      <div className="collection-drop-image">
                        {collection.image ? (
                          <img
                            src={collection.image.url}
                            alt={collection.image.altText || collection.title}
                          />
                        ) : (
                          <div className="collection-drop-placeholder" />
                        )}
                      </div>
                      <div className="collection-drop-overlay">
                        <h3 className="collection-drop-title">{collection.title}</h3>
                        <span className="collection-drop-cta">Megnézem →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            }}
          </Await>
        </Suspense>
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
          {ARTISTS.map((artist) => (
            <Link
              key={artist.handle}
              to={`/artists/${artist.handle}`}
              className="artist-card"
            >
              <div className="artist-card-image">
                {artist.image && (
                  <img
                    src={artist.image}
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
          ))}
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
      <section className="newsletter">
        <h2 className="newsletter-title">Köszönjük!</h2>
        <p className="newsletter-subtitle">
          Feliratkoztál a hírlevelünkre. Hamarosan értesíted lesz az akciókról!
        </p>
      </section>
    );
  }

  return (
    <section className="newsletter">
      <h2 className="newsletter-title">Nyerj havonta ingyenes ruhát!</h2>
      <p className="newsletter-subtitle">
        Iratkozz fel hírlevelünkre és vegyél részt havi sorsolásunkon + exkluzív
        akciók, új termékek
      </p>
      <Form method="post" className="newsletter-form">
        <input
          type="email"
          name="email"
          placeholder="E-mail címed"
          className="newsletter-input"
          required
        />
        <button type="submit" className="newsletter-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Feldolgozás...' : 'Feliratkozás'}
        </button>
      </Form>
      {actionData && !actionData.success && (
        <p className="newsletter-error">Valami hiba történt. Próbáld újra!</p>
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
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 8, sortKey: UPDATED_AT, reverse: true) {
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
    }
  }
  query HomepageCollections($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 6, sortKey: UPDATED_AT) {
      nodes {
        ...HomepageCollection
      }
    }
  }
` as const;

