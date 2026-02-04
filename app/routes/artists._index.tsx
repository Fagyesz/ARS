import {Link} from 'react-router';
import type {Route} from './+types/artists._index';
import {ARTISTS} from '~/lib/artists';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Alkotóink | Ars Mosoris'},
    {
      name: 'description',
      content: 'Ismerd meg az Ars Mosoris alkotóit - hat tehetséges képzőművész, hat egyedi látásmód.',
    },
  ];
};

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
                {artist.image && (
                  <img
                    src={artist.image}
                    alt={artist.name}
                    loading="lazy"
                  />
                )}
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
