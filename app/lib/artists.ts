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
    name: 'Ancsa',
    fullName: 'Kovács Ancsa',
    role: 'Képzőművész',
    image: '/artists/ancsa.jpg',
    handle: 'ancsa',
    bio: 'Ancsa munkáiban a női test és a természet kapcsolatát vizsgálja. Alkotásaiban az organikus formák és a figuratív ábrázolás találkozik, egyedi vizuális világot teremtve.',
    statement:
      'A művészetem a női test és a természet kapcsolatának felfedezéséről szól. Minden alkotásomban arra törekszem, hogy megmutassam az organikus formák és az emberi test közötti harmóniát. A "Női test", "Bogár" és "Napvilág/Holdvilág" sorozataim ezt a kapcsolatot különböző perspektívákból közelítik meg.',
    instagram: 'https://instagram.com/u.ancsa',
    collectionHandle: 'ancsa',
  },
  {
    name: 'Dóri',
    fullName: 'Nagy Dóri',
    role: 'Képzőművész',
    image: '/artists/dori.jpg',
    handle: 'dori',
    bio: 'Dóri a rovarok és a természet apró csodáit emeli művészetté. Részletgazdag alkotásai a bogarak egyedi szépségét mutatják be, ötvözve a tudományos pontosságot a művészi expresszióval.',
    statement:
      'A rovarok világa végtelenül lenyűgöz. A "Dongó", "Góliátbogár" és "Cserebogár" munkáimban ezeket az apró lényeket próbálom nagyítólencsén keresztül bemutatni, feltárva részleteik és mintázataik szépségét. A tarot kártyák inspirálta táskáim, mint a "The Tower" és "The Lovers", a misztikum és a természet találkozását képviselik.',
    instagram: 'https://instagram.com/keringerart',
    collectionHandle: 'dori',
  },
  {
    name: 'Gábor',
    fullName: 'Kiss Gábor',
    role: 'Képzőművész',
    handle: 'gabor',
    bio: 'Gábor a víz alatti világ ihlette alkotásait jellemzi a fluid vonalvezetés és a kék árnyalatok játéka. Munkáiban a halak dinamikus mozgása elevenedik meg.',
    statement:
      'A víz és a halak mozgása örök inspirációm. A "Hal" sorozatomban a tengeri élőlények dinamikus mozgását és a víz alatti fények játékát próbálom megragadni. A kék árnyalatok végtelen palettája lehetővé teszi, hogy minden munkámban új mélységeket fedezzek fel.',
    collectionHandle: 'gabor',
  },
  {
    name: 'Emese',
    fullName: 'Tóth Emese',
    role: 'Képzőművész',
    image: '/artists/emese.jpg',
    handle: 'emese',
    bio: 'Emese a grafikai technikák mestere. Szén, litográfia és linómetszet alkotásai a fény és árnyék kontrasztjára építenek, minimalista, mégis erőteljes vizuális hatást keltve.',
    statement:
      'A hagyományos grafikai technikák - szén, litográfia, linómetszet - a kifejezésem alapjai. A "Szén", "Litó" és "Linó" munkáim a fény és árnyék drámai kontrasztját helyezik előtérbe. A minimalista megközelítés lehetővé teszi, hogy a lényegre koncentráljok.',
    instagram: 'https://instagram.com/emeseszarakszik',
    collectionHandle: 'emese',
  },
  {
    name: 'Zorka',
    fullName: 'Szabó Zorka',
    role: 'Képzőművész',
    image: '/artists/zorka.jpg',
    handle: 'zorka',
    bio: 'Zorka karakteres portrékat és spirális motívumokat alkot. Munkáiban az emberi arc és a geometrikus formák találkoznak, egyedi hangulatot teremtve.',
    statement:
      'Az emberi arc és a geometria kölcsönhatása foglalkoztat. A "Bácsi", "Tus" és "Festett" portréim karakteres arcokat ábrázolnak, míg a "Spirál" sorozatom a geometrikus formák és az organikus vonalak találkozását vizsgálja.',
    instagram: 'https://instagram.com/zorka_n_',
    collectionHandle: 'zorka',
  },
  {
    name: 'Zsolt',
    fullName: 'Molnár Zsolt',
    role: 'Képzőművész',
    image: '/artists/zsolt.jpg',
    handle: 'zsolt',
    bio: 'Zsolt a cianotype és digitális technikákat ötvözi munkáiban. Alkotásaiban a test és az illúzió témáját dolgozza fel, játékos és gondolatébresztő vizuális megoldásokkal.',
    statement:
      'A cianotype technika és a digitális művészet ötvözése különleges lehetőségeket nyit meg számomra. A "Ciano", "Star", "Backturner", "Unravel" és "Illusion" munkáim a test és a fény kapcsolatát vizsgálják, játékos és gondolatébresztő módon.',
    instagram: 'https://instagram.com/unwise_dose_of_coffee',
    collectionHandle: 'zsolt',
  },
];
