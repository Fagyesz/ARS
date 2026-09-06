import {redirect} from 'react-router';
import type {Route} from './+types/penztar';
import {KOSR_CHECKOUT_ENABLED, KOSR_CHECKOUT_PATH} from '~/lib/config';
import {buildKosrCheckoutUrl} from '~/lib/kosr';

/**
 * Checkout entry point for the cart's "Tovább a fizetéshez" button. Sends the
 * shopper to kosR's Hungarian checkout (parcel points, COD, invoicing) via the
 * Online Store, or straight to Shopify checkout when kosR is switched off.
 */
export async function loader({context}: Route.LoaderArgs) {
  const cart = await context.cart.get();
  const lines = cart?.lines?.nodes ?? [];
  if (!cart || !lines.length) return redirect('/cart');

  const host = context.env.PUBLIC_CHECKOUT_DOMAIN;
  if (!KOSR_CHECKOUT_ENABLED || !host) return redirect(cart.checkoutUrl);

  // The order will be placed in the Online Store cart, so this cart cannot know
  // it was bought. Remember the hand-off; the cart drawer offers a one-click
  // "already ordered? empty the cart" until new items are added.
  context.session.set('checkoutStartedAt', Date.now());

  const url = buildKosrCheckoutUrl({
    host,
    path: KOSR_CHECKOUT_PATH,
    lines: lines.map((line) => ({
      variantId: line.merchandise.id,
      quantity: line.quantity,
    })),
    discountCode: cart.discountCodes?.find((d) => d.applicable)?.code,
  });

  return redirect(url ?? cart.checkoutUrl);
}

export default function Penztar() {
  return null;
}
