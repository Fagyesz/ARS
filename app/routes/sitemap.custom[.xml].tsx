import type {Route} from './+types/sitemap.custom[.xml]';
import {loadSiteContent} from '~/lib/content';
import {absoluteUrl} from '~/lib/seo';

/**
 * Pages that exist only in this app (no Shopify resource behind them), so
 * Hydrogen's generated sitemaps never list them. Served at /sitemap/custom.xml
 * and registered from the sitemap index in routes/[sitemap.xml].tsx.
 * Event articles are listed here too: the sitemap index leaves Shopify's
 * article sitemap out (see there), so this is where they get crawled.
 */
export async function loader({context}: Route.LoaderArgs) {
  const {storefront} = context;
  const [{artists}, events] = await Promise.all([
    loadSiteContent(storefront),
    storefront
      .query(EVENT_ARTICLES_QUERY, {cache: storefront.CacheLong()})
      .then((data) => data.blog?.articles.nodes ?? [])
      .catch((error: Error) => {
        console.error('[sitemap] could not load event articles:', error);
        return [];
      }),
  ]);
  const urls: Array<{path: string; changefreq: string; priority: string; lastmod?: string}> = [
    {path: '/collections/all', changefreq: 'weekly', priority: '0.9'},
    {path: '/akcio', changefreq: 'weekly', priority: '0.6'},
    {path: '/artists', changefreq: 'monthly', priority: '0.7'},
    ...artists.map((artist) => ({
      path: `/artists/${artist.handle}`,
      changefreq: 'weekly',
      priority: '0.7',
    })),
    {path: '/about', changefreq: 'monthly', priority: '0.6'},
    {path: '/events', changefreq: 'weekly', priority: '0.6'},
    ...events.map((article) => ({
      path: `/blogs/event/${article.handle}`,
      changefreq: 'monthly',
      priority: '0.5',
      lastmod: article.publishedAt.slice(0, 10),
    })),
    {path: '/contact', changefreq: 'monthly', priority: '0.5'},
    {path: '/policies/shipping-policy', changefreq: 'yearly', priority: '0.3'},
    {path: '/policies/refund-policy', changefreq: 'yearly', priority: '0.3'},
    {path: '/policies/privacy-policy', changefreq: 'yearly', priority: '0.2'},
    {path: '/policies/terms-of-service', changefreq: 'yearly', priority: '0.2'},
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({path, changefreq, priority, lastmod}) => `  <url>
    <loc>${absoluteUrl(path)}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}

const EVENT_ARTICLES_QUERY = `#graphql
  query SitemapEventArticles($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    blog(handle: "event") {
      articles(first: 250, sortKey: PUBLISHED_AT, reverse: true) {
        nodes {
          handle
          publishedAt
        }
      }
    }
  }
` as const;
