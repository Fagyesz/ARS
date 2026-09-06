// IMPORTANT: Most configuration is now in environment variables (.env file)
// These constants are fallback values only. Routes and components should read from env.

// Email configuration - prefer context.env.FROM_EMAIL and context.env.CONTACT_EMAIL
export const EMAIL = 'arsmosoris@gmail.com'; // fallback only

// Canonical public origin of the storefront. Used for canonical/og/schema URLs so they
// never follow the request Host (preview hosts, old subdomains) — update on domain changes.
export const SITE_URL = 'https://arsmosoris.art';

// Hungarian checkout via the kosR app (parcel points, utánvét, Billingo invoicing).
// Its page is an Online Store app proxy on PUBLIC_CHECKOUT_DOMAIN; the /penztar route
// rebuilds the cart there. Set to false to fall back to Shopify's native checkout.
export const KOSR_CHECKOUT_ENABLED = true;
export const KOSR_CHECKOUT_PATH = '/apps/checkout?lng=hu';

// Social links - prefer reading from env (INSTAGRAM_URL, FACEBOOK_URL, etc.)
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/ars.mosoris/',
  facebook: 'https://www.facebook.com/profile.php?id=61574998793960',
  tiktok: 'https://www.tiktok.com/@ars.mosoris',
  youtube: 'https://www.youtube.com/@ars.mosoris',
};

export const COLLECTION_TYPES = [
  {label: 'Pólók', value: 'polo'},
  {label: 'Pulóverek', value: 'pulover'},
  {label: 'Nadrágok', value: 'nadrag'},
  {label: 'Kabátok', value: 'kabat'},
  {label: 'Táskák', value: 'taska'},
];
