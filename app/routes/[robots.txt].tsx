import {SITE_URL} from '~/lib/config';

export function loader() {
  // Always advertise the public origin, never the preview host that served the request
  const body = robotsTxtData({sitemapUrl: `${SITE_URL}/sitemap.xml`});

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}

function robotsTxtData({sitemapUrl}: {sitemapUrl: string}) {
  return `
User-agent: *
${generalDisallowRules()}
Sitemap: ${sitemapUrl}

# Google adsbot ignores robots.txt unless specifically named!
User-agent: adsbot-google
Disallow: /cart
Disallow: /penztar
Disallow: /koszonjuk
Disallow: /account

User-agent: Nutch
Disallow: /

User-agent: AhrefsBot
Crawl-delay: 10
${generalDisallowRules()}

User-agent: AhrefsSiteAudit
Crawl-delay: 10
${generalDisallowRules()}

User-agent: MJ12bot
Crawl-Delay: 10

User-agent: Pinterest
Crawl-delay: 1
`.trim();
}

/**
 * Only this app's own URLs: the cart and the kosR checkout hand-off, the
 * thank-you page, account, search, wishlist and API routes. The Shopify Online
 * Store defaults (/checkouts, /collections/*+*, ?ls=, preview_theme_id…) are
 * left out: none of those URLs exist on this Hydrogen storefront.
 * Sorted and filtered catalogue views (`?sort=`, `?size=`, `?artist=`,
 * `?type=`) are duplicates of the unfiltered page or of an artist page.
 */
function generalDisallowRules() {
  return `Disallow: /cart
Disallow: /penztar
Disallow: /koszonjuk
Disallow: /discount/
Disallow: /api/
Disallow: /wishlist
Disallow: /account
Disallow: /search
Disallow: /*?*sort=
Disallow: /*?*size=
Disallow: /*?*artist=
Disallow: /*?*type=`;
}
