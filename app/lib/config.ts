// IMPORTANT: Most configuration is now in environment variables (.env file)
// These constants are fallback values only. Routes and components should read from env.

// Email configuration - prefer context.env.FROM_EMAIL and context.env.CONTACT_EMAIL
export const EMAIL = 'arsmosoris@gmail.com'; // fallback only

// Canonical public origin of the storefront. Used for canonical/og/schema URLs so they
// never follow the request Host (preview hosts, old subdomains) — update on domain changes.
export const SITE_URL = 'https://arsmosoris.art';

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
