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

// Categories, promotions and shop facts are not configured here:
// - categories are the published Shopify collections (app/lib/content.ts)
// - promotions are the shop's active automatic discounts (app/lib/campaigns.server.ts)
// - shipping/company facts come from the `shop_settings` metaobject (app/lib/content.ts)

/**
 * Fallback shipping facts, used only until the `shop_settings` metaobject
 * exists in Shopify. Source: the checkout's own delivery options (2026-09-06:
 * a single "FoxPost csomagpont" rate, no home delivery, no free threshold).
 */
export const SHIPPING = {
  carrier: 'FoxPost',
  parcelPointFt: 1300,
  homeDeliveryFt: 0, // 0 = not offered
  freeOverFt: 0, // 0 = no free-shipping threshold
  handlingDays: '1–2 munkanap',
  transitDays: '2–3 munkanap',
  returnDays: 14,
};
