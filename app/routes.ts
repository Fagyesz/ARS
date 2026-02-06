import {flatRoutes} from '@react-router/fs-routes';
import {type RouteConfig, route} from '@react-router/dev/routes';
import {hydrogenRoutes} from '@shopify/hydrogen';

export default hydrogenRoutes([
  ...(await flatRoutes()),
  // Shopify's password-reset email links to /en/account/reset/… — alias to our reset route
  route(
    '/en/account/reset/:id/:token',
    './routes/account_.reset.$id.$token.tsx',
    {id: 'en-account-reset'},
  ),
]) satisfies RouteConfig;
