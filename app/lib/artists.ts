export interface Artist {
  name: string;
  fullName: string;
  role: string;
  /** Original portrait (JPEG) — used for share images; pages render the resized renditions */
  image?: string;
  /** Pixel size of the 960px rendition, for layout-stable <img> tags */
  imageSize?: [width: number, height: number];
  /** Portrait served from Shopify Files (artist metaobject); wins over `image` */
  portrait?: {src: string; srcSet: string; width?: number; height?: number};
  handle: string;
  bio: string;
  statement: string;
  instagram?: string;
  collectionHandle: string;
  /** product vendor name the artist's pieces carry in Shopify */
  vendor?: string;
}

/**
 * Responsive renditions of the portrait: from Shopify Files when the artist
 * comes from a metaobject, otherwise `public/artists/<name>-480.jpg` and
 * `<name>-960.jpg` resized from the original. (JPEG on purpose: Shopify's CDN
 * re-encodes static images itself, so WebP sources gain nothing here.)
 */
export function artistPortrait(artist: Artist) {
  if (artist.portrait) return artist.portrait;
  if (!artist.image) return null;
  const base = artist.image.replace(/\.jpe?g$/i, '');
  return {
    src: `${base}-960.jpg`,
    srcSet: `${base}-480.jpg 480w, ${base}-960.jpg 960w`,
    width: artist.imageSize?.[0],
    height: artist.imageSize?.[1],
  };
}

export const ARTISTS: Artist[] = [
  {
    name: 'Dóri',
    fullName: 'Kéringer Dóri',
    role: 'Képzőművész',
    image: '/artists/dori.jpg',
    imageSize: [900, 1600],
    handle: 'dori',
    bio: 'Dóri főleg linómetszettel dolgozik, visszatérő motívumai a bogarak. Az Ars Mosorisnál a social media és az adminisztratív háttérfeladatok tartoznak hozzá — röviden ő a bogaras lány.',
    statement:
      'Dóri vagyok, főleg linómetszettel dolgozom, visszatérő motívumaim pedig a bogarak. Az Ars Mosorisban a social media és az adminisztratív háttérfeladatok tartoznak hozzám, röviden én vagyok a bogaras lány.',
    instagram: 'https://instagram.com/keringerart',
    collectionHandle: 'dori',
  },
  {
    name: 'Emi',
    fullName: 'Nagy Emese',
    role: 'Képzőművész',
    image: '/artists/emi.jpg',
    imageSize: [960, 1440],
    handle: 'emi',
    bio: 'Emi sokféle anyaggal kísérletezik, és egy újrahasznosított, természetes irányba mozog. A Mosorisban egyfajta mindenes: felel a social mediáért, az anyagbeszerzésért és még jó sok mindenért.',
    statement:
      'Emi vagyok, sokféle anyaggal kísérletezem, próbálok egy újrahasznosított, természetes irányba mozgolódni. A Mosorisban egyfajta mindenes vagyok, felelek a socialért, az anyagbeszerzésért, meg jó sok mindenért.',
    instagram: 'https://instagram.com/emeseszarakszik',
    collectionHandle: 'emi',
  },
  {
    name: 'Zorka',
    fullName: 'Nagy Zorka Hanna',
    role: 'Képzőművész',
    image: '/artists/zorka.jpg',
    imageSize: [900, 1600],
    handle: 'zorka',
    bio: 'Zorka főként linóleummal dolgozik. Szereti az aprólékos motívumokat, és figurálisan ábrázol. Az Ars Mosorisnál a kommunikációért, valamint a szervezésért és a kivitelezésért felelős.',
    statement:
      'Zorka vagyok, főként linóleummal dolgozok. Szeretem az aprólékos motívumokat, figurálisan ábrázolok. Az Ars Mosorisban a kommunikációért és a szervezésért, kivitelezésért vagyok felelős.',
    instagram: 'https://instagram.com/zorka_n_',
    collectionHandle: 'zorka',
  },
  {
    name: 'Zsolt',
    fullName: 'Nagy Zsolt',
    role: 'Képzőművész',
    image: '/artists/zsolt.jpg',
    imageSize: [900, 1600],
    handle: 'zsolt',
    bio: 'Zsolt a tervezőgrafikai és a magyar–angol fordítási feladatok egy részét végzi az Ars Mosorisnál. Általában tintával dolgozik, grunge-os, sokszor groteszk stílusban, és új életet lehel a használt ruhákba.',
    statement:
      'Zsolt vagyok, az Ars Mosorisnál a tervezőgrafikai és a magyar–angol fordítási feladatok egy részét végzem. Általában tintával dolgozok, egy grunge-os, sokszor groteszk stílusban. Szeretnék új életet lehelni használt ruhákba, illetve megtanulni varrógépet kezelni, és idővel vegyíteni a rajzolt és varrott vonalat a munkáimon.',
    instagram: 'https://instagram.com/unwise_dose_of_coffee',
    collectionHandle: 'zsolt',
  },
];
