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
      // blog and article handles live under /blogs/, everything else under its type
      if (type === 'blogs' || type === 'articles') {
        return `${baseUrl}/blogs/${handle}`;
      }
      return `${baseUrl}/${type}/${handle}`;
    },
  });

  response.headers.set('Cache-Control', `max-age=${60 * 60 * 24}`);

  return response;
}
