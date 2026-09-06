import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {useLocation} from 'react-router';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
};

/**
 * A slide-in drawer with an overlay. Closed drawers are not rendered at all:
 * a hidden dialog would still add landmarks and headings to every page for
 * crawlers and screen readers.
 * @example
 * ```jsx
 * <Aside type="search" heading="KERESÉS">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 */
export function Aside({
  children,
  heading,
  type,
}: {
  children?: React.ReactNode;
  type: AsideType;
  heading: string;
}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!expanded) return;

    // Move focus into the dialog and give it back to the opener on close
    const opener = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const abortController = new AbortController();
    document.addEventListener(
      'keydown',
      function handler(event: KeyboardEvent) {
        if (event.key === 'Escape') {
          close();
        }
      },
      {signal: abortController.signal},
    );
    return () => {
      abortController.abort();
      opener?.focus?.();
    };
  }, [close, expanded]);

  if (!expanded) return null;

  return (
    <div
      aria-modal="true"
      aria-label={heading}
      className="overlay expanded"
      role="dialog"
    >
      <button
        className="close-outside"
        onClick={close}
        aria-label="Bezárás"
        tabIndex={-1}
      />
      <aside>
        <header>
          <h2>{heading}</h2>
          <button
            ref={closeButtonRef}
            className="close reset"
            onClick={close}
            aria-label="Bezárás"
          >
            &times;
          </button>
        </header>
        <div className="aside-body">{children}</div>
      </aside>
    </div>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');
  const location = useLocation();
  const close = useCallback(() => setType('closed'), []);

  useEffect(() => {
    setType('closed');
  }, [location.pathname]);

  useEffect(() => {
    if (type !== 'closed') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [type]);

  return (
    <AsideContext.Provider
      value={{
        type,
        open: setType,
        close,
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
