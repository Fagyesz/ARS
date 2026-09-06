import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import {
  Link,
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from 'react-router';
import type {Route} from './+types/root';
import favicon from '~/assets/favicon.svg';
import {FOOTER_QUERY, HEADER_QUERY} from '~/lib/fragments';
import {SITE_URL, SOCIAL_LINKS} from '~/lib/config';
import {jsonLd, seoMeta} from '~/lib/seo';
import resetStyles from '~/styles/reset.css?inline';
import appStyles from '~/styles/app.css?url';
import {PageLayout} from './components/PageLayout';
import {CookieConsentProvider, CookieConsentBanner} from '~/components/CookieConsent';

export type RootLoader = typeof loader;

/**
 * Fallback head tags: used by routes without their own `meta` export and,
 * more importantly, for error pages, where the failing route's meta never runs.
 */
export const meta: Route.MetaFunction = ({error, location}) => {
  if (error) {
    const status = isRouteErrorResponse(error) ? error.status : 500;
    return seoMeta({
      title: status === 404 ? 'Az oldal nem található' : 'Hiba történt',
      description:
        status === 404
          ? 'A keresett oldal nem található az Ars Mosoris webshopban.'
          : 'Átmeneti hiba történt az Ars Mosoris webshopban.',
      path: location.pathname,
      noindex: true,
    });
  }
  return seoMeta({
    title: 'Ars Mosoris | Kortárs művészet és divat',
    rawTitle: true,
    path: location.pathname,
  });
};

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') return true;

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) return true;

  // Defaulting to no revalidation for root loader data to improve performance.
  // When using this feature, you risk your UI getting out of sync with your server.
  // Use with caution. If you are uncomfortable with this optimization, update the
  // line below to `return defaultShouldRevalidate` instead.
  // For more details see: https://remix.run/docs/en/main/route/should-revalidate
  return false;
};

/**
 * The main stylesheet is added in the Layout component to prevent a bug in
 * development HMR updates ("failed to execute 'insertBefore' on 'Node'").
 * https://github.com/remix-run/remix/issues/9242
 */
export function links() {
  return [
    {rel: 'preconnect', href: 'https://cdn.shopify.com'},
    {rel: 'preconnect', href: 'https://shop.app'},
    // Grandstander is self-hosted (public/fonts) so first paint no longer waits
    // for a Google Fonts round trip; both subsets are needed for Hungarian text.
    {
      rel: 'preload',
      as: 'font',
      type: 'font/woff2',
      href: '/fonts/grandstander-latin.woff2',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'preload',
      as: 'font',
      type: 'font/woff2',
      href: '/fonts/grandstander-latin-ext.woff2',
      crossOrigin: 'anonymous',
    },
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
    {rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png'},
  ];
}

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  const {storefront, env} = args.context;

  return {
    ...deferredData,
    ...criticalData,
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      // localize the privacy banner
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
    env: {
      contactEmail: env.CONTACT_EMAIL,
      storeName: env.STORE_NAME,
      instagramUrl: env.INSTAGRAM_URL,
      facebookUrl: env.FACEBOOK_URL,
      tiktokUrl: env.TIKTOK_URL,
      youtubeUrl: env.YOUTUBE_URL,
    },
  };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: Route.LoaderArgs) {
  const {storefront} = context;

  const [header] = await Promise.all([
    storefront.query(HEADER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        headerMenuHandle: 'main-menu', // Adjust to your header menu handle
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {header};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const {storefront, customerAccount, cart} = context;

  // defer the footer query (below the fold)
  const footer = storefront
    .query(FOOTER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        footerMenuHandle: 'footer', // Adjust to your footer menu handle
      },
    })
    .catch((error: Error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });
  return {
    cart: cart.get(),
    isLoggedIn: customerAccount.isLoggedIn(),
    footer,
  };
}

const ORGANIZATION_JSON_LD = jsonLd([
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ars Mosoris',
    url: SITE_URL,
    logo: `${SITE_URL}/logo-512.png`,
    sameAs: Object.values(SOCIAL_LINKS),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Ars Mosoris',
    url: SITE_URL,
    inLanguage: 'hu',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  },
]);

export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();

  return (
    <html lang="hu">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="theme-color" content="#231F20" />
        <meta property="og:site_name" content="Ars Mosoris" />
        <meta property="og:locale" content="hu_HU" />
        {/* The reset is tiny: inlining it removes one render-blocking request */}
        <style dangerouslySetInnerHTML={{__html: resetStyles}} />
        <link rel="stylesheet" href={appStyles}></link>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{__html: ORGANIZATION_JSON_LD}}
        />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  const data = useRouteLoaderData<RootLoader>('root');

  if (!data) {
    return <Outlet />;
  }

  return (
    <Analytics.Provider
      cart={data.cart}
      shop={data.shop}
      consent={data.consent}
    >
      <CookieConsentProvider>
        <PageLayout {...data}>
          <Outlet />
        </PageLayout>
        <CookieConsentBanner />
      </CookieConsentProvider>
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const data = useRouteLoaderData<RootLoader>('root');

  let errorMessage = 'Ismeretlen hiba';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const content =
    errorStatus === 404 ? (
      <NotFoundPage />
    ) : (
      <ErrorPage status={errorStatus} message={errorMessage} />
    );

  // Keep header, footer and drawers when the root loader itself succeeded
  if (!data) return content;

  return (
    <Analytics.Provider cart={data.cart} shop={data.shop} consent={data.consent}>
      <CookieConsentProvider>
        <PageLayout {...data}>{content}</PageLayout>
      </CookieConsentProvider>
    </Analytics.Provider>
  );
}

function NotFoundPage() {
  return (
    <section className="not-found">
      <div className="container not-found-inner">
        <span className="not-found-code">404</span>
        <h1>Ezt az oldalt nem találjuk</h1>
        <p className="not-found-lead">
          Lehet, hogy a termék már elfogyott, vagy a link elírt. Nézz körül a
          boltban, vagy keress rá arra, ami érdekel.
        </p>
        <form action="/search" method="get" className="not-found-search" role="search">
          <input
            type="search"
            name="q"
            placeholder="Mit keresel? Pl. póló, pulóver…"
            aria-label="Keresés"
          />
          <button type="submit" className="btn btn-primary">
            Keresés
          </button>
        </form>
        <nav className="not-found-links" aria-label="Hasznos oldalak">
          <Link to="/collections/all" className="btn btn-outline">
            Bolt
          </Link>
          <Link to="/artists" className="btn btn-outline">
            Alkotók
          </Link>
          <Link to="/" className="btn btn-outline">
            Kezdőlap
          </Link>
        </nav>
      </div>
    </section>
  );
}

function ErrorPage({status, message}: {status: number; message: string}) {
  return (
    <section className="not-found">
      <div className="container not-found-inner">
        <span className="not-found-code">{status}</span>
        <h1>Valami hiba történt</h1>
        <p className="not-found-lead">
          Próbáld újra egy kicsit később. Ha a hiba nem múlik el, írj nekünk a
          Kapcsolat oldalon.
        </p>
        {process.env.NODE_ENV !== 'production' && message && (
          <pre className="not-found-debug">{message}</pre>
        )}
        <nav className="not-found-links" aria-label="Hasznos oldalak">
          <Link to="/" className="btn btn-outline">
            Kezdőlap
          </Link>
          <Link to="/contact" className="btn btn-outline">
            Kapcsolat
          </Link>
        </nav>
      </div>
    </section>
  );
}
