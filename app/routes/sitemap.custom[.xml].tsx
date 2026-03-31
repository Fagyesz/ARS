import type {LoaderFunctionArgs} from 'react-router';

export async function loader({request}: LoaderFunctionArgs) {
  const baseUrl = new URL(request.url).origin;

  const urls = [
    '/about',
    '/contact',
    '/events',
    '/artists',
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(path => `  <url>
    <loc>${baseUrl}${path}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
