export interface Artist {
  name: string;
  fullName: string;
  role: string;
  image?: string;
  handle: string;
  bio: string;
  statement: string;
  instagram?: string;
  collectionHandle: string;
}

export const ARTISTS: Artist[] = [
  {
    name: 'Dóri',
    fullName: 'Kéringer Dóri',
    role: 'Képzőművész',
    image: '/artists/dori.jpg',
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
    handle: 'zsolt',
    bio: 'Zsolt a tervezőgrafikai és a magyar–angol fordítási feladatok egy részét végzi az Ars Mosorisnál. Általában tintával dolgozik, grunge-os, sokszor groteszk stílusban, és új életet lehel a használt ruhákba.',
    statement:
      'Zsolt vagyok, az Ars Mosorisnál a tervezőgrafikai és a magyar–angol fordítási feladatok egy részét végzem. Általában tintával dolgozok, egy grunge-os, sokszor groteszk stílusban. Szeretnék új életet lehelni használt ruhákba, illetve megtanulni varrógépet kezelni, és idővel vegyíteni a rajzolt és varrott vonalat a munkáimon.',
    instagram: 'https://instagram.com/unwise_dose_of_coffee',
    collectionHandle: 'zsolt',
  },
];
