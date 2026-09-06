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

// Tag-based quick filters on the catalogue page (/collections/all?type=…)
export const COLLECTION_TYPES = [
  {label: 'Pólók', value: 'polo'},
  {label: 'Pulóverek', value: 'pulover'},
  {label: 'Nadrágok', value: 'nadrag'},
  {label: 'Kabátok', value: 'kabat'},
];

// Real Shopify collections (smart collections by product type / tag); these are
// the crawlable category pages linked from the navigation and footer.
export const SHOP_COLLECTIONS = [
  {handle: 'polok', label: 'Pólók'},
  {handle: 'puloverek', label: 'Pulóverek'},
  {handle: 'kabatok', label: 'Kabátok és blézerek'},
  {handle: 'nadragok-es-szoknyak', label: 'Nadrágok és szoknyák'},
  {handle: 'egyedi-darabok', label: 'Egyedi darabok'},
];

// Promotions are not configured here: the storefront reads the shop's active
// automatic discounts through the Admin API (app/lib/campaigns.server.ts) and
// derives the banner, badges, product notes and cart nudge from them.

/**
 * Shipping facts shown on the product page, in the cart and in the footer.
 * Source: the shop's own shipping/return policy pages; keep them in sync.
 */
export const SHIPPING = {
  carrier: 'GLS',
  parcelPointFt: 1290,
  homeDeliveryFt: 1590,
  freeOverFt: 30000,
  handlingDays: '1–2 munkanap',
  transitDays: '2–3 munkanap',
  returnDays: 14,
};
