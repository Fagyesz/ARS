import {Link} from 'react-router';
import type {Route} from './+types/about';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Rólunk | Ars Mosoris'},
    {
      name: 'description',
      content: 'Az Ars Mosoris története - hat képzőművész hallgató, akik viselhetővé teszik a művészetet.',
    },
  ];
};

export default function About() {
  return (
    <div className="about-page">
      {/* Hero section */}
      <section className="about-hero">
        <div className="container">
          <h1>Rólunk</h1>
          <p className="about-hero-subtitle">
            Ahol a művészet viselhetővé válik
          </p>
        </div>
      </section>

      {/* Story section */}
      <section className="section">
        <div className="container">
          <div className="about-story">
            <div className="about-story-content">
              <h2>A történetünk</h2>
              <p>
                Az Ars Mosoris 2024-ben alakult hat képzőművész hallgató közös víziójaként.
                Mindannyian a Moholy-Nagy Művészeti Egyetem (MOME) különböző szakjain tanulunk,
                és összeköt minket a művészet iránti szenvedély és az a vágy, hogy alkotásainkat
                minél több emberhez eljuttassuk.
              </p>
              <p>
                A név - "Ars Mosoris" - a latin "művészet" szóból és a MOME rövidítéséből
                származik, tükrözve gyökereinket és hitvallásunkat. Célunk, hogy a kortárs
                képzőművészetet a mindennapok részévé tegyük, viselhetővé és hozzáférhetővé
                téve alkotásainkat.
              </p>
              <p>
                Minden ruhadarabunk mögött egy egyedi alkotás áll, amit nagy gondossággal
                adaptálunk textilre. Nem tömegtermelésben gondolkodunk - minden darabunk
                limitált szériában készül, megőrizve az eredeti művek exkluzivitását.
              </p>
            </div>
            <div className="about-story-image">
              <img
                src="https://images.unsplash.com/photo-1558865869-c93f6f8482af?w=600"
                alt="Művészeti műhely"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values section */}
      <section className="section" style={{backgroundColor: 'var(--color-background-alt)'}}>
        <div className="container">
          <div className="text-center mb-8">
            <h2>Értékeink</h2>
            <p className="text-muted">Amiben hiszünk és amit képviselünk</p>
          </div>
          <div className="about-values-grid">
            <div className="about-value">
              <div className="about-value-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h3>Eredetiség</h3>
              <p>Minden alkotásunk egyedi, saját művészeink keze munkája. Nem másoljuk - alkotunk.</p>
            </div>
            <div className="about-value">
              <div className="about-value-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3>Minőség</h3>
              <p>Csak prémium alapanyagokkal és nyomtatási technikákkal dolgozunk. A ruháid évekig tartanak.</p>
            </div>
            <div className="about-value">
              <div className="about-value-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <h3>Fenntarthatóság</h3>
              <p>Tudatos termelés, limitált szériák. Nem gyártunk feleslegesen, csak megrendelésre.</p>
            </div>
            <div className="about-value">
              <div className="about-value-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>Közösség</h3>
              <p>Hat művész, egy csapat. Egymást támogatva alkotunk és fejlődünk együtt.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team section */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-8">
            <h2>A csapat</h2>
            <p className="text-muted">Ismerd meg alkotóinkat</p>
          </div>
          <div className="about-team-cta">
            <Link to="/artists" className="btn btn-primary">
              Alkotóink megismerése
            </Link>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="about-contact-cta">
        <div className="container">
          <h2>Kérdésed van?</h2>
          <p>
            Szívesen válaszolunk bármilyen kérdésre a termékekkel, rendelésekkel
            vagy együttműködési lehetőségekkel kapcsolatban.
          </p>
          <Link to="/contact" className="btn btn-primary">
            Kapcsolatfelvétel
          </Link>
        </div>
      </section>
    </div>
  );
}
