import {Link} from 'react-router';
import type {Route} from './+types/artists._index';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Alkotóink | Ars Mosoris'},
    {
      name: 'description',
      content: 'Ismerd meg az Ars Mosoris alkotóit - hat tehetséges képzőművész, hat egyedi látásmód.',
    },
  ];
};

const ARTISTS = [
  {
    name: 'Ancsa',
    fullName: 'Kovács Ancsa',
    role: 'Képzőművész',
    image: 'https://img1.wsimg.com/isteam/ip/622be809-0590-404a-9e0d-39dd0c8ecd22/Ancsa-8be534d.jpg',
    handle: 'ancsa',
    bio: 'Ancsa munkáiban a női test és a természet kapcsolatát vizsgálja. Alkotásaiban az organikus formák és a figuratív ábrázolás találkozik, egyedi vizuális világot teremtve.',
    instagram: 'https://instagram.com/ancsa_art',
  },
  {
    name: 'Dóri',
    fullName: 'Nagy Dóri',
    role: 'Képzőművész',
    image: 'https://img1.wsimg.com/isteam/ip/622be809-0590-404a-9e0d-39dd0c8ecd22/D%C3%B3ri.jpg',
    handle: 'dori',
    bio: 'Dóri a rovarok és a természet apró csodáit emeli művészetté. Részletgazdag alkotásai a bogarak egyedi szépségét mutatják be, ötvözve a tudományos pontosságot a művészi expresszióval.',
    instagram: 'https://instagram.com/dori_art',
  },
  {
    name: 'Gábor',
    fullName: 'Kiss Gábor',
    role: 'Képzőművész',
    image: 'https://img1.wsimg.com/isteam/ip/622be809-0590-404a-9e0d-39dd0c8ecd22/Screenshot_20250526_105914_Drive.jpg',
    handle: 'gabor',
    bio: 'Gábor a víz alatti világ ihlette alkotásait jellemzi a fluid vonalvezetés és a kék árnyalatok játéka. Munkáiban a halak dinamikus mozgása elevenedik meg.',
    instagram: 'https://instagram.com/gabor_art',
  },
  {
    name: 'Emese',
    fullName: 'Tóth Emese',
    role: 'Képzőművész',
    image: 'https://img1.wsimg.com/isteam/ip/622be809-0590-404a-9e0d-39dd0c8ecd22/Emi.jpg',
    handle: 'emese',
    bio: 'Emese a grafikai technikák mestere. Szén, litográfia és linómetszet alkotásai a fény és árnyék kontrasztjára építenek, minimalista, mégis erőteljes vizuális hatást keltve.',
    instagram: 'https://instagram.com/emese_art',
  },
  {
    name: 'Zorka',
    fullName: 'Szabó Zorka',
    role: 'Képzőművész',
    image: 'https://img1.wsimg.com/isteam/ip/622be809-0590-404a-9e0d-39dd0c8ecd22/Zorka-1f0cb14.jpg',
    handle: 'zorka',
    bio: 'Zorka karakteres portrékat és spirális motívumokat alkot. Munkáiban az emberi arc és a geometrikus formák találkoznak, egyedi hangulatot teremtve.',
    instagram: 'https://instagram.com/zorka_art',
  },
  {
    name: 'Zsolt',
    fullName: 'Molnár Zsolt',
    role: 'Képzőművész',
    image: 'https://img1.wsimg.com/isteam/ip/622be809-0590-404a-9e0d-39dd0c8ecd22/Zsolt-99e1a3d.jpg',
    handle: 'zsolt',
    bio: 'Zsolt a cianotype és digitális technikákat ötvözi munkáiban. Alkotásaiban a test és az illúzió témáját dolgozza fel, játékos és gondolatébresztő vizuális megoldásokkal.',
    instagram: 'https://instagram.com/zsolt_art',
  },
];

export default function ArtistsIndex() {
  return (
    <div className="section">
      <div className="container">
        <div className="text-center mb-12">
          <h1>Alkotóink</h1>
          <p className="text-muted" style={{maxWidth: '600px', margin: '0 auto', fontSize: '1.125rem'}}>
            Hat tehetséges képzőművész hallgató, akik egyedi látásmódjukat viselhetővé varázsolják.
            Minden alkotó saját művészi világot képvisel, de közös bennük a kreativitás és a minőség iránti elkötelezettség.
          </p>
        </div>

        <div className="artists-page-grid">
          {ARTISTS.map((artist) => (
            <Link
              key={artist.handle}
              to={`/artists/${artist.handle}`}
              className="artist-page-card"
            >
              <div className="artist-page-card-image">
                <img
                  src={artist.image}
                  alt={artist.name}
                  loading="lazy"
                />
              </div>
              <div className="artist-page-card-content">
                <h2 className="artist-page-card-name">{artist.name}</h2>
                <p className="artist-page-card-bio">{artist.bio}</p>
                <span className="artist-page-card-link">
                  Profil megtekintése
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
