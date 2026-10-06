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

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A slide-in drawer with an overlay. Closed drawers are not rendered at all:
 * a hidden dialog would still add landmarks and headings to every page for
 * crawlers and screen readers. While open, Tab and Shift+Tab stay inside it.
 * `initialFocus` is a selector for the element that gets focus on open (the
 * search input in the search drawer); the close button otherwise.
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
  initialFocus,
}: {
  children?: React.ReactNode;
  type: AsideType;
  heading: string;
  initialFocus?: string;
}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const asideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!expanded) return;

    // Move focus into the dialog and give it back to the opener on close
    const opener = document.activeElement as HTMLElement | null;
    const target = initialFocus
      ? asideRef.current?.querySelector<HTMLElement>(initialFocus)
      : null;
    (target ?? closeButtonRef.current)?.focus();

    const abortController = new AbortController();
    document.addEventListener(
      'keydown',
      function handler(event: KeyboardEvent) {
        if (event.key === 'Escape') {
          close();
          return;
        }
        // keep Tab inside the drawer: wrap from the last element to the first
        if (event.key !== 'Tab' || !asideRef.current) return;
        const focusable = [
          ...asideRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
        ];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const inside = asideRef.current.contains(document.activeElement);
        if (event.shiftKey && (document.activeElement === first || !inside)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !inside)) {
          event.preventDefault();
          first.focus();
        }
      },
      {signal: abortController.signal},
    );
    return () => {
      abortController.abort();
      opener?.focus?.();
    };
  }, [close, expanded, initialFocus]);

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
      <aside ref={asideRef}>
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
