import {HydratedRouter} from 'react-router/dom';
import {startTransition, StrictMode} from 'react';
import {hydrateRoot} from 'react-dom/client';
import {NonceProvider} from '@shopify/hydrogen';

if (!window.location.origin.includes('webcache.googleusercontent.com')) {
  startTransition(() => {
    // Extract nonce from existing script tags
    const existingNonce = document
      .querySelector<HTMLScriptElement>('script[nonce]')
      ?.nonce;

    hydrateRoot(
      document,
      <StrictMode>
        <NonceProvider value={existingNonce}>
          <HydratedRouter />
        </NonceProvider>
      </StrictMode>,
      {
        onRecoverableError(error) {
          // React #421: a still-streaming Suspense boundary (footer/cart) received a
          // context update — the analytics provider finishing its consent load — and
          // was client-rendered instead. Output is identical; keep the console clean.
          const message = error instanceof Error ? error.message : String(error);
          if (message.includes('#421') || message.includes('before it finished hydrating')) {
            console.debug('[hydration] boundary client-rendered after early update', error);
            return;
          }
          console.error(error);
        },
      },
    );
  });
}
