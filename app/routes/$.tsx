import type {Route} from './+types/$';
import {seoMeta} from '~/lib/seo';

export const meta: Route.MetaFunction = ({location}) =>
  seoMeta({
    title: 'Az oldal nem található',
    description: 'A keresett oldal nem található az Ars Mosoris webshopban.',
    path: location.pathname,
    noindex: true,
  });

export async function loader({request}: Route.LoaderArgs) {
  throw new Response(`${new URL(request.url).pathname} not found`, {
    status: 404,
  });
}

// The root ErrorBoundary renders the branded 404 page inside the layout
export default function CatchAllPage() {
  return null;
}
