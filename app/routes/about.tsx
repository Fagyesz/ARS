import {Link} from 'react-router';
import type {Route} from './+types/about';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Rólunk | Ars Mosoris'},
    {
      name: 'description',
      content: 'Az Ars Mosoris négy fiatal művészből álló alkotócsapat és márka, ami a tradicionális grafikai technikákat a mindennapi viselettel kapcsolja össze.',
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'Rólunk | Ars Mosoris'},
    {property: 'og:description', content: 'Az Ars Mosoris story — képzőművészet találkozik a mindennapi divattárgyakkal.'},
    {property: 'og:image', content: '/og-default.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};

export default function About() {
  return (
    <div className="about-page">
      {/* Dark editorial hero */}
      <section className="about-hero">
        <div className="container">
          <span className="about-hero-eyebrow">Ars Mosoris</span>
          <h1 className="about-hero-title">Rólunk</h1>
          <p className="about-hero-lead">
            Ahol a képzőművészet hordható formát kap.
          </p>
        </div>
      </section>

      {/* Main manifesto */}
      <section className="section">
        <div className="container">
          <div className="about-manifesto">
            <p className="about-manifesto-text">
              Az Ars Mosoris négy fiatal művészből álló alkotócsapat és márka,
              ami a tradicionális grafikai technikákat a mindennapi viselettel
              kapcsolja össze. Sokszorosító grafikai eljárásokkal, valamint
              manuális művészeti technikákkal dolgozunk, és olyan ruhákat
              készítünk, ahol a képzőművészet hordható formát kap.
            </p>
          </div>
        </div>
      </section>

      {/* Technique callout — dark section */}
      <section className="about-technique">
        <div className="container">
          <div className="about-technique-inner">
            <div className="about-technique-question">
              <span className="about-technique-label">Technika</span>
              <h2>Mi az a sokszorosító grafika?</h2>
            </div>
            <div className="about-technique-answer">
              <p>
                Olyan képzőművészeti eljárás, aminél a művész több eredeti
                lenyomatot hoz létre egy adott anyagból készült nyomóformáról.
                Az anyag amivel mi elsősorban dolgozunk az a linóleum, amiből
                metszeteket készítünk, majd azt kézzel nyomtatjuk rá a ruhákra.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Personal statement + timeline */}
      <section className="section">
        <div className="container">
          <div className="about-statement">
            <p>
              Számunkra az Ars Mosoris egyszerre közös alkotói tér és
              folyamatosan épülő márka. A kézzel készítés, a kísérletezés és
              a vizuális történetmesélés áll a munkáink középpontjában.
            </p>
            <div className="about-timeline">
              <div className="about-timeline-item">
                <span className="about-timeline-year">2024</span>
                <span className="about-timeline-desc">Alapítás</span>
              </div>
              <div className="about-timeline-divider" />
              <div className="about-timeline-item">
                <span className="about-timeline-year">2025</span>
                <span className="about-timeline-desc">
                  Webshop megnyitó
                  <br />
                  Pilot kollekció
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission quote */}
      <section className="about-mission">
        <div className="container">
          <blockquote className="about-mission-quote">
            A célunk egyszerű: közelebb hozni a kortárs művészetet a
            hétköznapokhoz, és olyan dolgokat létrehozni, amik egyszerre
            személyesek, vizuálisan erősek és viselhetőek.
          </blockquote>
        </div>
      </section>

      {/* CTA */}
      <section className="about-contact-cta">
        <div className="container">
          <h2>Ismerd meg alkotóinkat</h2>
          <p>Négy tehetséges képzőművész, négy egyedi látásmód.</p>
          <Link to="/artists" className="btn btn-primary">
            Alkotóink
          </Link>
        </div>
      </section>
    </div>
  );
}
