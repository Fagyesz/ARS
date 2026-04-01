import {useEffect, useRef} from 'react';
import {type FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import {useToast} from '~/components/Toast';

function AddToCartInner({
  fetcher,
  analytics,
  children,
  disabled,
  onClick,
}: {
  fetcher: FetcherWithComponents<any>;
  analytics?: unknown;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const {addToast} = useToast();
  const prevState = useRef(fetcher.state);

  useEffect(() => {
    if (
      prevState.current === 'submitting' &&
      fetcher.state === 'idle' &&
      !fetcher.data?.errors?.length
    ) {
      addToast('Kosárba helyezve!', 'success');
    }
    prevState.current = fetcher.state;
  }, [fetcher.state, addToast]);

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
}: {
  analytics?: unknown;
  children: React.ReactNode;
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
  onClick?: () => void;
}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<any>) => (
        <AddToCartInner
          fetcher={fetcher}
          analytics={analytics}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </AddToCartInner>
      )}
    </CartForm>
  );
}
