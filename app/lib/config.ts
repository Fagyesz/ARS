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

/**
 * The running automatic discount ("Webshop_opening" in Shopify admin): buy one
 * of the tagged tees, get a second at 50 %, once per order. Products carry the
 * `akcio` tag; the banner, badges and cart nudge switch off after `endsAt`.
 */
export const CAMPAIGN = {
  tag: 'akcio',
  collectionHandle: 'nyitasi-akcio',
  /** last day of the offer (inclusive), Europe/Budapest */
  endsAt: '2026-09-30',
  shortLabel: '2. póló féláron',
  bannerText: 'Nyitási akció szeptember 30-ig: vegyél egy Baseline vagy Visions pólót, a másodikat féláron adjuk.',
  bannerCta: 'Mutasd a pólókat',
  productNote:
    'Tegyél két akciós pólót a kosárba (bármilyen szín és méret), és az olcsóbbat féláron kapod. Rendelésenként egy pár, szeptember 30-ig.',
  cartNudge: 'Még egy Baseline vagy Visions póló, és a másodikat féláron adjuk.',
  cartNudgeCta: 'Választok még egyet',
};

/** Is the campaign still running on the given day (server date)? */
export function campaignActive(now: Date = new Date()): boolean {
  return now.toISOString().slice(0, 10) <= CAMPAIGN.endsAt;
}

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
