import {Suspense} from 'react';
import {Await, NavLink} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {EMAIL, SOCIAL_LINKS, COLLECTION_TYPES} from '~/lib/config';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
  env?: {
    contactEmail: string;
    storeName: string;
    storeAddress: string;
    storeCity: string;
    storePostalCode: string;
    storeCountry: string;
    storeMapLat: string;
    storeMapLng: string;
    instagramUrl: string;
    facebookUrl: string;
    tiktokUrl: string;
    youtubeUrl: string;
  };
}

export function Footer({
  footer: footerPromise,
  header,
  publicStoreDomain,
  env,
}: FooterProps) {
  // Use env variables with fallbacks to config constants
  const contactEmail = env?.contactEmail || EMAIL;
  const socialLinks = {
    instagram: env?.instagramUrl || SOCIAL_LINKS.instagram,
    facebook: env?.facebookUrl || SOCIAL_LINKS.facebook,
    tiktok: env?.tiktokUrl || SOCIAL_LINKS.tiktok,
    youtube: env?.youtubeUrl || SOCIAL_LINKS.youtube,
  };
  return (
    <Suspense>
      <Await resolve={footerPromise}>
        {(footer) => (
          <footer className="footer">
            <div className="container">
              <div className="footer-grid">
                {/* Brand Column */}
                <div className="footer-brand">
                  <div className="footer-logo">ARS MOSORIS</div>
                  <p className="footer-description">
                    Öt képzőművész hallgató által alapított márka, ahol a
                    mindennapi viselet és a kortárs művészet találkozik.
                  </p>
                  <div className="footer-social">
                    <a
                      href={socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                    >
                      <InstagramIcon />
                    </a>
                    <a
                      href={socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                    >
                      <FacebookIcon />
                    </a>
                    <a
                      href={socialLinks.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="TikTok"
                    >
                      <TikTokIcon />
                    </a>
                    <a
                      href={socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="YouTube"
                    >
                      <YouTubeIcon />
                    </a>
                  </div>
                </div>

                {/* Shop Column */}
                <div>
                  <h4 className="footer-heading">Shop</h4>
                  <nav className="footer-links">
                    <NavLink to="/collections/all">Minden termék</NavLink>
                    {COLLECTION_TYPES.map((type) => (
                      <NavLink key={type.value} to={`/collections/${type.value}`}>{type.label}</NavLink>
                    ))}
                  </nav>
                </div>

                {/* Artists Column */}
                <div>
                  <h4 className="footer-heading">Alkotók</h4>
                  <nav className="footer-links">
                    <NavLink to="/artists">Alkotóink</NavLink>
                    <NavLink to="/events">Események</NavLink>
                    <NavLink to="/about">Rólunk</NavLink>
                  </nav>
                </div>

                {/* Info Column */}
                <div>
                  <h4 className="footer-heading">Információ</h4>
                  <nav className="footer-links">
                    <NavLink to="/contact">Kapcsolat</NavLink>
                    <NavLink to="/policies/shipping-policy">Szállítás</NavLink>
                    <NavLink to="/policies/refund-policy">
                      Visszaküldés
                    </NavLink>
                    <NavLink to="/policies/privacy-policy">
                      Adatvédelem
                    </NavLink>
                    <NavLink to="/policies/terms-of-service">ÁSZF</NavLink>
                  </nav>
                </div>
              </div>

              <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Ars Mosoris. Minden jog fenntartva.</p>
                <p>
                  <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                  {' · '}
                  Budapest, Magyarország
                </p>
              </div>
            </div>
          </footer>
        )}
      </Await>
    </Suspense>
  );
}

// Social Icons
function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
    </svg>
  );
}
