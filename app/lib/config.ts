// IMPORTANT: Most configuration is now in environment variables (.env file)
// These constants are fallback values only. Routes and components should read from env.

// Email configuration - prefer context.env.FROM_EMAIL and context.env.CONTACT_EMAIL
export const EMAIL = 'arsmosoris@vincze.app'; // fallback only

// Social links - prefer reading from env (INSTAGRAM_URL, FACEBOOK_URL, etc.)
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/ars.mosoris/',
  facebook: 'https://www.facebook.com/profile.php?id=61574998793960',
  tiktok: 'https://www.tiktok.com/@ars.mosoris',
  youtube: 'https://www.youtube.com/@ars.mosoris',
};

export const COLLECTION_TYPES = [
  {label: 'Pólók', value: 'polo'},
  {label: 'Táskák', value: 'taska'},
];
