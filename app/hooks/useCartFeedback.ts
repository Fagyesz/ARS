import {useEffect, useRef} from 'react';
import type {FetcherWithComponents} from 'react-router';
import {useToast} from '~/components/Toast';

// Shopify accepted the request but capped or dropped the quantity
const STOCK_WARNINGS = new Set([
  'MERCHANDISE_NOT_ENOUGH_STOCK',
  'MERCHANDISE_OUT_OF_STOCK',
]);

type CartWarning = {code?: string; message?: string};

/**
 * Toasts for a finished cart request (the /cart action's errors, userErrors
 * and warnings): shared by the add-to-cart buttons and the cart line's +/−
 * buttons, so running out of stock reads the same everywhere.
 */
export function useCartFeedback(
  fetcher: FetcherWithComponents<any>,
  {
    errorMessage,
    successMessage,
    enabled = true,
  }: {
    errorMessage: string;
    /** omit where the UI already shows the result (drawer opens, quantity changes) */
    successMessage?: string;
    /** false when another hook already watches the same shared fetcher */
    enabled?: boolean;
  },
) {
  const {addToast} = useToast();
  const prevState = useRef(fetcher.state);

  useEffect(() => {
    if (enabled && prevState.current !== 'idle' && fetcher.state === 'idle' && fetcher.data) {
      const errors: unknown[] = [
        ...(fetcher.data.errors ?? []),
        ...(fetcher.data.userErrors ?? []),
      ];
      const warnings: CartWarning[] = fetcher.data.warnings ?? [];

      if (errors.length) {
        addToast(errorMessage, 'error');
      } else if (warnings.some((w) => w.code && STOCK_WARNINGS.has(w.code))) {
        addToast('Ebből a méretből nincs több készleten.', 'info');
      } else if (warnings.length) {
        addToast(warnings[0].message || 'A kosár frissült.', 'info');
      } else if (successMessage) {
        addToast(successMessage, 'success');
      }
    }
    prevState.current = fetcher.state;
  }, [fetcher.state, fetcher.data, addToast, errorMessage, successMessage, enabled]);
}
