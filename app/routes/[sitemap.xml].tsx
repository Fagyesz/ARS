import type {Route} from './+types/[sitemap.xml]';
import {getSitemapIndex} from '@shopify/hydrogen';
import {requestOnPublicOrigin} from '~/lib/seo';

export async function loader({
  request,
  context: {storefront},
}: Route.LoaderArgs) {
  const response = await getSitemapIndex({
    storefront,
    // URLs are built from the request origin: pin them to the public domain
    request: requestOnPublicOrigin(request),
    // Articles are listed through the events/blog routes and Shopify's sitemap
    // resource gives no blog handle for them; metaobjects have no pages here.
    types: ['products', 'collections', 'pages', 'blogs'],
    // flat-route naming: sitemap.custom[.xml].tsx is served at /sitemap/custom.xml
    customChildSitemaps: ['/sitemap/custom.xml'],
  });

  response.headers.set('Cache-Control', `max-age=${60 * 60 * 24}`);

  return response;
}
