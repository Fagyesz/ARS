import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, type OptimisticCart} from '@shopify/hydrogen';
import {Link, useRouteLoaderData} from 'react-router';
import {CAMPAIGN, KOSR_CHECKOUT_ENABLED, SHIPPING} from '~/lib/config';
import {summarizeLineDiscounts} from '~/lib/discounts';
import {formatMoney} from '~/lib/money';
import {useAside} from './Aside';
import type {RootLoader} from '~/root';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

type CartLines = CartApiQueryFragment['lines']['nodes'];

export function CartSummary({cart, layout}: CartSummaryProps) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';
  const lines = (cart?.lines?.nodes ?? []) as CartLines;
  const subtotal = parseFloat(cart?.cost?.subtotalAmount?.amount ?? '0');
  const currencyCode = cart?.cost?.subtotalAmount?.currencyCode ?? 'HUF';

  return (
    <div aria-labelledby="cart-summary" className={className}>
      <div className="cart-summary-content">
        <FreeShippingProgress subtotal={subtotal} currencyCode={currencyCode} />
        <CampaignNudge lines={lines} />
        <dl className="cart-subtotal">
          <dt>Részösszeg</dt>
          <dd>
            {cart?.cost?.subtotalAmount?.amount ? (
              (() => {
                const totalDiscount = lines.reduce(
                  (sum: number, line) =>
                    sum +
                    (line.discountAllocations ?? []).reduce(
                      (s: number, a) => s + parseFloat(a.discountedAmount.amount),
                      0,
                    ),
                  0,
                );

                if (totalDiscount <= 0) {
                  return formatMoney(subtotal, currencyCode);
                }

                return (
                  <div className="cart-subtotal-with-discount">
                    <s className="cart-subtotal-original">
                      {formatMoney(subtotal + totalDiscount, currencyCode)}
                    </s>
                    <span className="cart-subtotal-discounted">
                      {formatMoney(subtotal, currencyCode)}
                    </span>
                  </div>
                );
              })()
            ) : (
              '-'
            )}
          </dd>
        </dl>
        <CartDiscountRows cart={cart} />
        <p className="cart-shipping-note">
          Szállítás: {SHIPPING.carrier} csomagpont {formatMoney(SHIPPING.parcelPointFt)},
          házhoz {formatMoney(SHIPPING.homeDeliveryFt)}; a pénztárban választhatsz.
        </p>
        <CartDiscounts discountCodes={cart?.discountCodes} />
      </div>
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />
    </div>
  );
}

/** "Még 6 000 Ft, és ingyen szállítjuk": the free-shipping threshold as a bar */
function FreeShippingProgress({
  subtotal,
  currencyCode,
}: {
  subtotal: number;
  currencyCode: string;
}) {
  const threshold = SHIPPING.freeOverFt;
  const remaining = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
  const reached = remaining === 0;
  return (
    <div className={`free-shipping${reached ? ' free-shipping--reached' : ''}`}>
      <p className="free-shipping-text">
        {reached ? (
          <>
            <strong>Ingyenes szállítás</strong> jár ehhez a rendeléshez.
          </>
        ) : (
          <>
            Még <strong>{formatMoney(remaining, currencyCode)}</strong>, és ingyen szállítjuk.
          </>
        )}
      </p>
      <div
        className="free-shipping-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={threshold}
        aria-valuenow={Math.min(subtotal, threshold)}
        aria-label="Ingyenes szállításig"
      >
        <span style={{width: `${pct}%`}} />
      </div>
    </div>
  );
}

/**
 * One eligible tee in the cart means the next one would be half price:
 * say so, with a link straight to the campaign collection.
 */
function CampaignNudge({lines}: {lines: CartLines}) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const {close} = useAside();
  if (!rootData?.campaignActive) return null;
  const units = lines.reduce((sum, line) => {
    const tags = line.merchandise.product.tags ?? [];
    return tags.includes(CAMPAIGN.tag) ? sum + line.quantity : sum;
  }, 0);
  if (units !== 1) return null;
  return (
    <div className="cart-nudge">
      <span className="cart-nudge-badge">{CAMPAIGN.shortLabel}</span>
      <p>
        {CAMPAIGN.cartNudge}{' '}
        <Link to={`/collections/${CAMPAIGN.collectionHandle}`} onClick={close} prefetch="intent">
          {CAMPAIGN.cartNudgeCta}
        </Link>
      </p>
    </div>
  );
}

/** One row per applied discount (automatic or code), e.g. "Webshop_opening  −2 000 Ft" */
function CartDiscountRows({cart}: {cart: CartSummaryProps['cart']}) {
  const rows = summarizeLineDiscounts(cart?.lines?.nodes ?? []);
  if (!rows.length) return null;
  return (
    <>
      {rows.map((row) => (
        <dl className="cart-discount-row" key={row.label}>
          <dt>Kedvezmény · {row.label}</dt>
          <dd>−{formatMoney(row.amount, row.currencyCode)}</dd>
        </dl>
      ))}
    </>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl?: string}) {
  if (!checkoutUrl) return null;

  // /penztar hands the cart to kosR's Hungarian checkout (see routes/penztar.tsx)
  const href = KOSR_CHECKOUT_ENABLED ? '/penztar' : checkoutUrl;

  return (
    <div className="cart-checkout">
      <a href={href} target="_self" className="cart-checkout-btn">
        Tovább a fizetéshez
      </a>
      <p className="cart-checkout-note">
        Biztonságos online fizetés · {SHIPPING.carrier} csomagpont vagy házhoz szállítás ·{' '}
        {SHIPPING.returnDays} napos elállás
      </p>
    </div>
  );
}

function CartDiscounts({
  discountCodes,
}: {
  discountCodes?: CartApiQueryFragment['discountCodes'];
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <div className="cart-discounts">
      {codes.length > 0 && (
        <dl className="cart-discount-applied">
          <dt>Kuponkód</dt>
          <dd>
            <UpdateDiscountForm>
              <div className="cart-discount-code">
                <code>{codes?.join(', ')}</code>
                <button type="submit" aria-label="Kuponkód eltávolítása">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </UpdateDiscountForm>
          </dd>
        </dl>
      )}

      {/* Collapsed by default: an open coupon field invites shoppers to leave and hunt for codes */}
      <details className="cart-coupon">
        <summary>Van kuponkódod?</summary>
        <UpdateDiscountForm discountCodes={codes}>
          <div className="cart-discount-form">
            <input
              id="discount-code-input"
              type="text"
              name="discountCode"
              placeholder="Kuponkód"
              aria-label="Kuponkód"
            />
            <button type="submit">Alkalmaz</button>
          </div>
        </UpdateDiscountForm>
      </details>
    </div>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}
