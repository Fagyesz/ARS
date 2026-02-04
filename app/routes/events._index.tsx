import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/events._index';
import {Image} from '@shopify/hydrogen';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Események | Ars Mosoris'},
    {
      name: 'description',
      content: 'Ars Mosoris események, popup shopok és kiállítások. Találkozz velünk személyesen!',
    },
  ];
};

export async function loader({context}: Route.LoaderArgs) {
  const {storefront} = context;

  // Fetch blog articles for events
  const {blogs} = await storefront.query(EVENTS_QUERY);

  // Get the first blog (events blog)
  const eventsBlog = blogs.nodes[0];
  const articles = eventsBlog?.articles?.nodes || [];

  return {
    articles,
  };
}

export default function EventsIndex() {
  const {articles} = useLoaderData<typeof loader>();

  // Sample events data for demo if no blog articles exist
  const sampleEvents = [
    {
      id: '1',
      title: 'Popup Shop - Gólyabál',
      date: '2026. Február 15.',
      location: 'Budapest, Műegyetem',
      description: 'Gyere és nézd meg legújabb kollekcióinkat a Gólyabálon! Exkluzív kedvezmények helyszínen.',
      image: null,
      handle: 'popup-shop-golyabal',
    },
    {
      id: '2',
      title: 'Kiállítás - Art Market',
      date: '2026. Március 8-10.',
      location: 'Budapest, Millenáris',
      description: 'Az Ars Mosoris kollektíva standjánál találkozhatsz alkotóinkkal és megvásárolhatod kedvenc darabjaidat.',
      image: null,
      handle: 'art-market-kiallitas',
    },
    {
      id: '3',
      title: 'Workshop - Szitanyomás alapok',
      date: '2026. Április 5.',
      location: 'Budapest, Tűzraktér',
      description: 'Tanuld meg a szitanyomás alapjait és készítsd el saját egyedi pólódat velünk!',
      image: null,
      handle: 'szitanyomas-workshop',
    },
  ];

  const displayEvents = articles.length > 0 ? articles : sampleEvents;

  return (
    <div className="events-page">
      {/* Hero section */}
      <section className="events-hero">
        <div className="container">
          <h1>Események</h1>
          <p className="text-muted">
            Popup shopok, kiállítások és workshopok. Találkozz velünk személyesen!
          </p>
        </div>
      </section>

      {/* Events grid */}
      <section className="section">
        <div className="container">
          {/* Upcoming events */}
          <div className="events-section">
            <h2 className="events-section-title">Közelgő események</h2>
            <div className="events-grid">
              {displayEvents.map((event: any) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>

          {/* Past events section (could be added later) */}
          <div className="events-section mt-12">
            <h2 className="events-section-title">Korábbi események</h2>
            <p className="text-center text-muted">
              Hamarosan itt találod korábbi eseményeinket!
            </p>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="events-newsletter">
        <div className="container">
          <h2>Ne maradj le!</h2>
          <p>Iratkozz fel hírlevelünkre, hogy elsőként értesülj új eseményeinkről.</p>
          <Link to="/#newsletter" className="btn btn-primary">
            Feliratkozás
          </Link>
        </div>
      </section>
    </div>
  );
}

function EventCard({event}: {event: any}) {
  const isArticle = 'content' in event || 'contentHtml' in event;

  return (
    <article className="event-card">
      <div className="event-card-image">
        {isArticle ? (
          <Link to={`/blogs/event/${event.handle}`} className="event-card-image-link">
            {event.image ? (
              <Image
                data={event.image}
                aspectRatio="16/9"
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            ) : (
              <div className="event-card-placeholder">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
            )}
          </Link>
        ) : event.image ? (
          <Image
            data={event.image}
            aspectRatio="16/9"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        ) : (
          <div className="event-card-placeholder">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        )}
      </div>
      <div className="event-card-content">
        <div className="event-card-meta">
          <span className="event-card-date">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {isArticle ? formatDate(event.publishedAt) : event.date}
          </span>
          {event.location && (
            <span className="event-card-location">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {event.location}
            </span>
          )}
        </div>
        <h3 className="event-card-title">{event.title}</h3>
        <p className="event-card-description">
          {isArticle ? event.excerpt || event.content?.substring(0, 150) + '...' : event.description}
        </p>
        {isArticle && (
          <Link to={`/blogs/event/${event.handle}`} className="event-card-link">
            Részletek
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        )}
      </div>
    </article>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const EVENTS_QUERY = `#graphql
  query EventsBlog(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    blogs(first: 1, query: "handle:event") {
      nodes {
        id
        title
        handle
        articles(first: 10, sortKey: PUBLISHED_AT, reverse: true) {
          nodes {
            id
            title
            handle
            publishedAt
            excerpt
            content
            image {
              id
              altText
              url
              width
              height
            }
          }
        }
      }
    }
  }
` as const;
