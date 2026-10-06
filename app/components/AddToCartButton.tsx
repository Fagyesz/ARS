import {type FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import {useCartFeedback} from '~/hooks/useCartFeedback';

function AddToCartInner({
  fetcher,
  analytics,
  children,
  disabled,
  onClick,
  successToast,
}: {
  fetcher: FetcherWithComponents<any>;
  analytics?: unknown;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  successToast: boolean;
}) {
  useCartFeedback(fetcher, {
    errorMessage: 'Nem sikerült a kosárba tenni. Próbáld újra!',
    successMessage: successToast ? 'Kosárba helyezve!' : undefined,
  });

  return (
    <>
      <input name="analytics" type="hidden" value={JSON.stringify(analytics)} />
      <button
        type="submit"
        onClick={onClick}
        disabled={disabled ?? fetcher.state !== 'idle'}
        className="add-to-cart-btn"
      >
        {fetcher.state === 'submitting' ? 'Hozzáadás...' : children}
      </button>
    </>
  );
}

export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
  successToast = true,
}: {
  analytics?: unknown;
  children: React.ReactNode;
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
  onClick?: () => void;
  /** Set to false where the cart drawer opens anyway, so the shopper gets one signal, not two */
  successToast?: boolean;
}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<any>) => (
        <AddToCartInner
          fetcher={fetcher}
          analytics={analytics}
          disabled={disabled}
          onClick={onClick}
          successToast={successToast}
        >
          {children}
        </AddToCartInner>
      )}
    </CartForm>
  );
}
