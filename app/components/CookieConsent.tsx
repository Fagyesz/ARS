import {createContext, useContext, useState, useEffect} from 'react';
import {Link} from 'react-router';

type ConsentChoice = 'accepted' | 'rejected';

type CookieConsentContextValue = {
  choice: ConsentChoice | null;
  accept: () => void;
  reject: () => void;
};

const STORAGE_KEY = 'ars-cookie-consent';

const CookieConsentContext = createContext<CookieConsentContextValue>({
  choice: null,
  accept: () => {},
  reject: () => {},
});

/**
 * Hand the visitor's choice to Shopify's Customer Privacy API, which gates the
 * analytics/marketing pixels. The API script loads asynchronously, so retry for
 * a few seconds instead of silently dropping the choice when it isn't there yet.
 */
function applyConsent(choice: ConsentChoice, attempt = 0) {
  const privacy = window.Shopify?.customerPrivacy;
  if (!privacy) {
    if (attempt < 20) setTimeout(() => applyConsent(choice, attempt + 1), 500);
    return;
  }
  const granted = choice === 'accepted';
  privacy.setTrackingConsent(
    {
      analytics: granted,
      marketing: granted,
      preferences: granted,
      sale_of_data: false,
    },
    () => {},
  );
}

function readStoredChoice(): ConsentChoice | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'accepted' || stored === 'rejected' ? stored : null;
  } catch {
    return null;
  }
}

export function CookieConsentProvider({children}: {children: React.ReactNode}) {
  const [choice, setChoice] = useState<ConsentChoice | null>(null);

  // Returning visitors: re-apply the stored choice on every page load, since
  // Shopify only remembers consent for the current session/cookie lifetime.
  useEffect(() => {
    const stored = readStoredChoice();
    if (stored) {
      setChoice(stored);
      applyConsent(stored);
    }
  }, []);

  function decide(next: ConsentChoice) {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // private mode: the banner will simply show again next visit
    }
    setChoice(next);
    applyConsent(next);
  }

  return (
    <CookieConsentContext.Provider
      value={{choice, accept: () => decide('accepted'), reject: () => decide('rejected')}}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function CookieConsentBanner() {
  const {choice, accept, reject} = useContext(CookieConsentContext);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (choice === null) {
      const timer = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, [choice]);

  if (choice !== null) return null;

  return (
    <div
      className={`cookie-banner${visible ? ' cookie-banner--visible' : ''}`}
      role="dialog"
      aria-label="Sütik használata"
      aria-live="polite"
    >
      <p className="cookie-banner-text">
        Ez az oldal sütiket (cookie-kat) használ a jobb felhasználói élmény és a látogatói
        statisztikák érdekében. Elutasítás esetén csak az oldal működéséhez szükséges sütik
        kerülnek alkalmazásra.{' '}
        <Link to="/policies/privacy-policy">Adatkezelési tájékoztató</Link>
      </p>
      <div className="cookie-banner-actions">
        <button type="button" className="btn btn-outline" onClick={reject}>
          Csak szükséges
        </button>
        <button type="button" className="btn btn-primary" onClick={accept}>
          Elfogadom
        </button>
      </div>
    </div>
  );
}
