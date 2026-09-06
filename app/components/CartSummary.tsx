import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, type OptimisticCart} from '@shopify/hydrogen';
import {Link, useRouteLoaderData} from 'react-router';
import {KOSR_CHECKOUT_ENABLED} from '~/lib/config';
import {CAMPAIGN_PATH, isEligible} from '~/lib/campaigns';
import {FALLBACK_SETTINGS, deliveryModes, shippingFacts, type SiteSettings} from '~/lib/content';
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
  const rootData = useRouteLoaderData<RootLoader>('root');
  const settings = rootData?.content?.settings ?? FALLBACK_SETTINGS;
  const {shipping} = settings;

  return (
    <div aria-labelledby="cart-summary" className={className}>
      <div className="cart-summary-content">
        <FreeShippingProgress subtotal={subtotal} currencyCode={currencyCode} threshold={shipping.freeOverFt} />
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
          Szállítás: {shippingFacts(shipping).join(' · ')}.{' '}
          {shipping.homeDeliveryFt > 0
            ? 'A pénztárban választhatsz.'
            : 'A csomagpontot a pénztárban választod ki.'}
        </p>
        <CartDiscounts discountCodes={cart?.discountCodes} />
      </div>
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} settings={settings} />
    </div>
  );
}

/** "Még 6 000 Ft, és ingyen szállítjuk": the free-shipping threshold as a bar */
function FreeShippingProgress({
  subtotal,
  currencyCode,
  threshold,
}: {
  subtotal: number;
  currencyCode: string;
  threshold: number;
}) {
  if (!threshold) return null;
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
 * A buy-X-get-Y discount with exactly the "buy" quantity of eligible items in
 * the cart: the next one would be discounted, so say so with a link to the
 * campaign page. Everything comes from the Shopify discount via the root loader.
 */
function CampaignNudge({lines}: {lines: CartLines}) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const {close} = useAside();
  const campaign = rootData?.campaigns?.find((c) => c.kind === 'bxgy' && c.copy.cartNudge);
  if (!campaign) return null;
  const units = lines.reduce(
    (sum, line) => (isEligible(campaign, line.merchandise.product.id) ? sum + line.quantity : sum),
    0,
  );
  if (units !== campaign.buysQuantity) return null;
  return (
    <div className="cart-nudge">
      <span className="cart-nudge-badge">{campaign.copy.shortLabel}</span>
      <p>
        {campaign.copy.cartNudge}{' '}
        <Link to={CAMPAIGN_PATH} onClick={close} prefetch="intent">
          {campaign.copy.cartNudgeCta}
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

function CartCheckoutActions({
  checkoutUrl,
  settings,
}: {
  checkoutUrl?: string;
  settings: SiteSettings;
}) {
  if (!checkoutUrl) return null;

  // /penztar hands the cart to kosR's Hungarian checkout (see routes/penztar.tsx)
  const href = KOSR_CHECKOUT_ENABLED ? '/penztar' : checkoutUrl;

  return (
    <div className="cart-checkout">
      <a href={href} target="_self" className="cart-checkout-btn">
        Tovább a fizetéshez
      </a>
      <p className="cart-checkout-note">
        {settings.paymentMethods} · {settings.shipping.carrier} {deliveryModes(settings.shipping)} ·{' '}
        {settings.shipping.returnDays} napos elállás
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
