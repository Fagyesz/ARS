import {Link} from 'react-router';
import type {Route} from './+types/artists._index';
import {ARTISTS} from '~/lib/artists';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Alkotóink | Ars Mosoris'},
    {
      name: 'description',
      content: 'Ismerd meg az Ars Mosoris alkotóit - négy tehetséges képzőművész, négy egyedi látásmód.',
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'Művészeink | Ars Mosoris'},
    {property: 'og:description', content: 'Ismerd meg az Ars Mosoris képzőművészeit — tehetséges magyar alkotók.'},
    {property: 'og:image', content: '/og-default.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};

export default function ArtistsIndex() {
  return (
    <div className="artists-index-page">
      {/* Editorial dark header */}
      <div className="artists-index-hero">
        <div className="container">
          <span className="artists-index-eyebrow">Ars Mosoris</span>
          <h1 className="artists-index-title">Alkotóink</h1>
          <p className="artists-index-lead">
            Négy tehetséges képzőművész, akik egyedi látásmódjukat viselhetővé varázsolják.
            Minden alkotó saját művészi világot képvisel.
          </p>
        </div>
      </div>

      <div className="container">
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
