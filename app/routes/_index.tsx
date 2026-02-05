import {Await, useLoaderData, useActionData, useNavigation, Link, Form} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import {ARTISTS} from '~/lib/artists';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Ars Mosoris | Kortárs Művészet & Divat'},
    {
      name: 'description',
      content:
        'Öt képzőművész hallgató által alapított márka, ahol a mindennapi viselet és a kortárs művészet találkozik.',
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  return loadDeferredData(args);
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error: Error) => {
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;

  try {
    const storeDomain = context.env.PUBLIC_STORE_DOMAIN;
    const token = context.env.PUBLIC_STOREFRONT_API_TOKEN;

    const response = await fetch(
      `https://${storeDomain}/api/2025-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Storefront-Access-Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: NEWSLETTER_SUBSCRIBE_MUTATION,
          variables: {
            input: {
              email,
              password: crypto.randomUUID(),
              acceptsMarketing: true,
            },
          },
        }),
      },
    );

    const json = (await response.json()) as {
      data?: {customerCreate?: {userErrors: {message: string}[]}};
      errors?: {message: string}[];
    };

    if (json.errors?.length) {
      return {success: false};
    }

    const errors = json.data?.customerCreate?.userErrors ?? [];
    if (errors.length > 0) {
      // "already been taken" means customer exists — treat as success
      const alreadyExists = errors.some((err) =>
        err.message.toLowerCase().includes('already been taken'),
      );
      return {success: alreadyExists};
    }

    return {success: true};
  } catch {
    return {success: false};
  }
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home">
      <HeroSection />
      <FeaturedProducts products={data.recommendedProducts} />
      <ArtistsPreview />
      <NewsletterSection />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-background">
        <div
          style={{
            width: '100%',
            height: '100%',
            background:
              'linear-gradient(135deg, #1B1B1B 0%, #451442 50%, #FC0004 100%)',
          }}
        />
      </div>
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1 className="hero-title">Ars Mosoris</h1>
        <p className="hero-subtitle">Ahol a művészet viselhetővé válik</p>
        <div className="hero-cta">
          <Link to="/collections/all" className="btn btn-primary">
            Shop megtekintése
          </Link>
          <Link to="/artists" className="btn btn-outline" style={{color: 'white', borderColor: 'white'}}>
            Alkotóink
          </Link>
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
                  <ProductCard key={product.id} product={product} />
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

function ProductCard({
  product,
}: {
  product: RecommendedProductsQuery['products']['nodes'][0];
}) {
  const isAvailable = product.availableForSale !== false;

  return (
    <Link to={`/products/${product.handle}`} className="product-card">
      <div className="product-card-image">
        {product.featuredImage && (
          <Image
            data={product.featuredImage}
            aspectRatio="1/1"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          />
        )}
        {!isAvailable && (
          <span className="product-card-badge sold-out">Elfogyott</span>
        )}
      </div>
      <div className="product-card-info">
        {product.vendor && (
          <span className="product-card-artist">{product.vendor}</span>
        )}
        <h3 className="product-card-title">{product.title}</h3>
        <div className="product-card-price">
          <Money data={product.priceRange.minVariantPrice} />
        </div>
      </div>
    </Link>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="products-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="product-card">
          <div
            className="product-card-image"
            style={{background: '#f0f0f0', aspectRatio: '1'}}
          />
          <div className="product-card-info">
            <div
              style={{
                height: '12px',
                width: '60px',
                background: '#f0f0f0',
                margin: '0 auto 8px',
              }}
            />
            <div
              style={{
                height: '16px',
                width: '120px',
                background: '#f0f0f0',
                margin: '0 auto 8px',
              }}
            />
            <div
              style={{
                height: '14px',
                width: '80px',
                background: '#f0f0f0',
                margin: '0 auto',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ArtistsPreview() {
  return (
    <section className="section" style={{backgroundColor: 'var(--color-background-alt)'}}>
      <div className="container">
        <div className="text-center mb-8">
          <h2>Alkotóink</h2>
          <p className="text-muted">
            Hat tehetséges művész, hat egyedi látásmód
          </p>
        </div>
        <div className="artists-grid">
          {ARTISTS.map((artist) => (
            <Link
              key={artist.handle}
              to={`/artists/${artist.handle}`}
              className="artist-card"
            >
              {artist.image && (
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="artist-card-image"
                  loading="lazy"
                />
              )}
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

const NEWSLETTER_SUBSCRIBE_MUTATION = `#graphql
  mutation NewsletterSubscribe($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
      }
      userErrors {
        field
        message
      }
    }
  }
` as const;
