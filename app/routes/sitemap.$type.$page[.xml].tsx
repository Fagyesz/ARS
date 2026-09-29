import type {Route} from './+types/sitemap.$type.$page[.xml]';
import {getSitemap} from '@shopify/hydrogen';
import {requestOnPublicOrigin} from '~/lib/seo';

export async function loader({
  request,
  params,
  context: {storefront},
}: Route.LoaderArgs) {
  const response = await getSitemap({
    storefront,
    request: requestOnPublicOrigin(request),
    params,
    getLink: ({type, baseUrl, handle}) => {
      if (type === 'blogs') return `${baseUrl}/blogs/${handle}`;
      // Articles live at /blogs/{blog}/{article}. The index does not list them
      // today (sitemap.custom[.xml].tsx does); should it ever, a handle that
      // carries its blog is used as is, a bare one belongs to the events blog.
      if (type === 'articles') {
        return handle?.includes('/')
          ? `${baseUrl}/blogs/${handle}`
          : `${baseUrl}/blogs/event/${handle}`;
      }
      return `${baseUrl}/${type}/${handle}`;
    },
  });

  response.headers.set('Cache-Control', `max-age=${60 * 60 * 24}`);

  return response;
}
