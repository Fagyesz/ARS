import {
  useLoaderData,
  data,
  type HeadersFunction,
} from 'react-router';
import type {Route} from './+types/cart';
import {seoMeta} from '~/lib/seo';
import type {CartQueryDataReturn} from '@shopify/hydrogen';
import {CartForm} from '@shopify/hydrogen';
import {CartMain} from '~/components/CartMain';

export const meta: Route.MetaFunction = ({location}) =>
  seoMeta({
    title: 'Kosár',
    description: 'Kosár — Ars Mosoris',
    path: location.pathname,
    noindex: true,
  });

export const headers: HeadersFunction = ({actionHeaders}) => actionHeaders;

export async function action({request, context}: Route.ActionArgs) {
  const {cart} = context;

  const formData = await request.formData();

  let status = 200;
  let result: CartQueryDataReturn;

  // Custom: swap variant (size change in cart). Several line ids may arrive
  // comma-separated when the UI merged discount-split lines of one variant.
  const swapLineId = formData.get('swapLineId') as string | null;
  if (swapLineId) {
    const newVariantId = formData.get('swapVariantId') as string;
    const quantity = Number(formData.get('swapQuantity'));
    // Add the new size first and drop the old line only once that worked,
    // so a failed add (e.g. the size just sold out) never empties the line.
    const added = await cart.addLines([{merchandiseId: newVariantId, quantity}]);
    const addFailed =
      Boolean(added.errors?.length) ||
      Boolean(added.userErrors?.length) ||
      Boolean(
        added.warnings?.some((w) => w.code === 'MERCHANDISE_OUT_OF_STOCK'),
      );
    if (addFailed) {
      result = added;
    } else {
      const removed = await cart.removeLines(
        swapLineId.split(',').filter(Boolean),
      );
      result = {
        ...removed,
        warnings: [...(added.warnings ?? []), ...(removed.warnings ?? [])],
      };
    }
  } else {

  const {action, inputs} = CartForm.getFormInput(formData);

  if (!action) {
    throw new Error('No action provided');
  }

  switch (action) {
    case CartForm.ACTIONS.LinesAdd:
      result = await cart.addLines(inputs.lines);
      // a fresh add means the shopper is still shopping, not returning from checkout
      if (context.session.get('checkoutStartedAt')) {
        context.session.unset('checkoutStartedAt');
      }
      break;
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate: {
      const formDiscountCode = inputs.discountCode;

      // User inputted discount code
      const discountCodes = (
        formDiscountCode ? [formDiscountCode] : []
      ) as string[];

      // Combine discount codes already applied on cart
      discountCodes.push(...inputs.discountCodes);

      result = await cart.updateDiscountCodes(discountCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesAdd: {
      const formGiftCardCode = inputs.giftCardCode;

      const giftCardCodes = (
        formGiftCardCode ? [formGiftCardCode] : []
      ) as string[];

      result = await cart.addGiftCardCodes(giftCardCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesRemove: {
      const appliedGiftCardIds = inputs.giftCardCodes as string[];
      result = await cart.removeGiftCardCodes(appliedGiftCardIds);
      break;
    }
    case CartForm.ACTIONS.BuyerIdentityUpdate: {
      result = await cart.updateBuyerIdentity({
        ...inputs.buyerIdentity,
      });
      break;
    }
    default:
      throw new Error(`${action} cart action is not defined`);
  }

  } // end else (standard CartForm actions)

  const cartId = result?.cart?.id;
  const headers = cartId ? cart.setCartId(result.cart.id) : new Headers();
  const {cart: cartResult, errors, userErrors, warnings} = result;

  const redirectTo = formData.get('redirectTo') ?? null;
  if (typeof redirectTo === 'string') {
    status = 303;
    headers.set('Location', redirectTo);
  }

  return data(
    {
      cart: cartResult,
      errors,
      userErrors,
      warnings,
      analytics: {
        cartId,
      },
    },
    {status, headers},
  );
}

export async function loader({context}: Route.LoaderArgs) {
  const {cart} = context;
  return await cart.get();
}

export default function Cart() {
  const cart = useLoaderData<typeof loader>();

  return (
    <div className="cart">
      <h1>Kosár</h1>
      <CartMain layout="page" cart={cart} />
    </div>
  );
}
