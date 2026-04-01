import {createContext, useContext, useState, useEffect} from 'react';
import {Link} from 'react-router';

type ConsentChoice = 'accepted' | 'rejected';

type CookieConsentContextValue = {
  choice: ConsentChoice | null;
  accept: () => void;
  reject: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue>({
  choice: null,
  accept: () => {},
  reject: () => {},
});

export function CookieConsentProvider({children}: {children: React.ReactNode}) {
  const [choice, setChoice] = useState<ConsentChoice | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('ars-cookie-consent');
    if (stored === 'accepted' || stored === 'rejected') {
      setChoice(stored);
    }
  }, []);

  function accept() {
    localStorage.setItem('ars-cookie-consent', 'accepted');
    setChoice('accepted');
    window.Shopify?.customerPrivacy?.setTrackingConsent(
      {analytics: true, marketing: true, preferences: true, sale_of_data: false},
      () => {},
    );
  }

  function reject() {
    localStorage.setItem('ars-cookie-consent', 'rejected');
    setChoice('rejected');
    window.Shopify?.customerPrivacy?.setTrackingConsent(
      {analytics: false, marketing: false, preferences: false, sale_of_data: false},
      () => {},
    );
  }

  return (
    <CookieConsentContext.Provider value={{choice, accept, reject}}>
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
      aria-label="Cookie hozzájárulás"
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
