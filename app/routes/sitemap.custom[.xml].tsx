import {ARTISTS} from '~/lib/artists';
import {absoluteUrl} from '~/lib/seo';

/**
 * Pages that exist only in this app (no Shopify resource behind them), so
 * Hydrogen's generated sitemaps never list them. Served at /sitemap/custom.xml
 * and registered from the sitemap index in routes/[sitemap.xml].tsx.
 */
export async function loader() {
  const urls: Array<{path: string; changefreq: string; priority: string}> = [
    {path: '/collections/all', changefreq: 'weekly', priority: '0.9'},
    {path: '/artists', changefreq: 'monthly', priority: '0.7'},
    ...ARTISTS.map((artist) => ({
      path: `/artists/${artist.handle}`,
      changefreq: 'weekly',
      priority: '0.7',
    })),
    {path: '/about', changefreq: 'monthly', priority: '0.6'},
    {path: '/events', changefreq: 'weekly', priority: '0.6'},
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
    ({path, changefreq, priority}) => `  <url>
    <loc>${absoluteUrl(path)}</loc>
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
