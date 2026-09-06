import {useEffect, useRef} from 'react';
import {type FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import {useToast} from '~/components/Toast';

// Shopify accepted the request but capped or dropped the quantity
const STOCK_WARNINGS = new Set([
  'MERCHANDISE_NOT_ENOUGH_STOCK',
  'MERCHANDISE_OUT_OF_STOCK',
]);

type CartWarning = {code?: string; message?: string};

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
  const {addToast} = useToast();
  const prevState = useRef(fetcher.state);

  useEffect(() => {
    if (prevState.current === 'submitting' && fetcher.state === 'idle') {
      const errors: unknown[] = fetcher.data?.errors ?? [];
      const warnings: CartWarning[] = fetcher.data?.warnings ?? [];

      if (errors.length) {
        addToast('Nem sikerült a kosárba tenni. Próbáld újra!', 'info');
      } else if (warnings.some((w) => w.code && STOCK_WARNINGS.has(w.code))) {
        addToast('Ebből a méretből nincs több készleten.', 'info');
      } else if (warnings.length) {
        addToast(warnings[0].message || 'A kosár frissült.', 'info');
      } else if (successToast) {
        addToast('Kosárba helyezve!', 'success');
      }
    }
    prevState.current = fetcher.state;
  }, [fetcher.state, fetcher.data, addToast, successToast]);

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
