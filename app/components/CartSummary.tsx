import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, Money, type OptimisticCart} from '@shopify/hydrogen';
import {useEffect, useRef} from 'react';
import {useFetcher} from 'react-router';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';

  return (
    <div aria-labelledby="cart-summary" className={className}>
      <div className="cart-summary-content">
        <dl className="cart-subtotal">
          <dt>Részösszeg</dt>
          <dd>
            {cart?.cost?.subtotalAmount?.amount ? (
              (() => {
                const lines = (cart as any).lines?.nodes ?? [];
                const totalDiscount = lines.reduce((sum: number, line: any) =>
                  sum + (line.discountAllocations ?? []).reduce((s: number, a: any) =>
                    s + parseFloat(a.discountedAmount.amount), 0), 0);

                if (totalDiscount <= 0) {
                  return <Money data={cart.cost.subtotalAmount} />;
                }

                const currency = cart.cost.subtotalAmount.currencyCode;
                const discountedAmount = parseFloat(cart.cost.subtotalAmount.amount);
                const originalAmount = discountedAmount + totalDiscount;

                return (
                  <div className="cart-subtotal-with-discount">
                    <s className="cart-subtotal-original">
                      <Money data={{amount: String(originalAmount), currencyCode: currency}} />
                    </s>
                    <span className="cart-subtotal-discounted">
                      <Money data={cart.cost.subtotalAmount} />
                    </span>
                  </div>
                );
              })()
            ) : (
              '-'
            )}
          </dd>
        </dl>
        <p className="cart-shipping-note">Szállítási költség a pénztárnál kerül kiszámításra</p>
        <CartDiscounts discountCodes={cart?.discountCodes} />
        <CartGiftCard giftCardCodes={cart?.appliedGiftCards} />
      </div>
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />
    </div>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl?: string}) {
  if (!checkoutUrl) return null;

  return (
    <a href={checkoutUrl} target="_self" className="cart-checkout-btn">
      Tovább a fizetéshez
    </a>
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
          <dt>Kedvezmény</dt>
          <dd>
            <UpdateDiscountForm>
              <div className="cart-discount-code">
                <code>{codes?.join(', ')}</code>
                <button type="submit" aria-label="Kedvezmény eltávolítása">
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

      <UpdateDiscountForm discountCodes={codes}>
        <div className="cart-discount-form">
          <input
            id="discount-code-input"
            type="text"
            name="discountCode"
            placeholder="Kuponkód"
          />
          <button type="submit" aria-label="Kuponkód alkalmazása">
            Alkalmaz
          </button>
        </div>
      </UpdateDiscountForm>
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

function CartGiftCard({
  giftCardCodes,
}: {
  giftCardCodes: CartApiQueryFragment['appliedGiftCards'] | undefined;
}) {
  const giftCardCodeInput = useRef<HTMLInputElement>(null);
  const giftCardAddFetcher = useFetcher({key: 'gift-card-add'});

  useEffect(() => {
    if (giftCardAddFetcher.data) {
      giftCardCodeInput.current!.value = '';
    }
  }, [giftCardAddFetcher.data]);

  return (
    <div className="cart-gift-cards">
      {giftCardCodes && giftCardCodes.length > 0 && (
        <dl className="cart-gift-card-applied">
          <dt>Ajándékkártya</dt>
          {giftCardCodes.map((giftCard) => (
            <dd key={giftCard.id}>
              <RemoveGiftCardForm giftCardId={giftCard.id}>
                <div className="cart-discount-code">
                  <code>***{giftCard.lastCharacters}</code>
                  <span>-<Money data={giftCard.amountUsed} /></span>
                  <button type="submit" aria-label="Eltávolítás">
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
              </RemoveGiftCardForm>
            </dd>
          ))}
        </dl>
      )}

      <AddGiftCardForm fetcherKey="gift-card-add">
        <div className="cart-discount-form">
          <input
            type="text"
            name="giftCardCode"
            placeholder="Ajándékkártya kód"
            ref={giftCardCodeInput}
          />
          <button type="submit" disabled={giftCardAddFetcher.state !== 'idle'}>
            Alkalmaz
          </button>
        </div>
      </AddGiftCardForm>
    </div>
  );
}

function AddGiftCardForm({
  fetcherKey,
  children,
}: {
  fetcherKey?: string;
  children: React.ReactNode;
}) {
  return (
    <CartForm
      fetcherKey={fetcherKey}
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesAdd}
    >
      {children}
    </CartForm>
  );
}

function RemoveGiftCardForm({
  giftCardId,
  children,
}: {
  giftCardId: string;
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesRemove}
      inputs={{
        giftCardCodes: [giftCardId],
      }}
    >
      {children}
    </CartForm>
  );
}
