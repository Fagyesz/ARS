import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/events._index';
import {Image} from '@shopify/hydrogen';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Események | Ars Mosoris'},
    {name: 'description', content: 'Ars Mosoris események, popup shopok és kiállítások. Találkozz velünk személyesen!'},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'Események | Ars Mosoris'},
    {property: 'og:description', content: 'Ars Mosoris események, popup shopok és kiállítások. Találkozz velünk személyesen!'},
    {property: 'og:image', content: 'https://arsmosoris.vincze.app/og-default.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};

/** Parse event date from tag — accepts "event-date:2026-06-15" or plain "2026-06-15" */
function getEventDate(article: {tags: string[]; publishedAt: string}): Date {
  for (const tag of article.tags) {
    const dateStr = tag.startsWith('event-date:') ? tag.replace('event-date:', '') : tag;
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) return parsed;
  }
  return new Date(article.publishedAt);
}

export async function loader({context}: Route.LoaderArgs) {
  const {storefront} = context;

  const {blogs} = await storefront.query(EVENTS_QUERY);

  const eventsBlog = blogs.nodes[0];
  const articles: any[] = eventsBlog?.articles?.nodes || [];

  const now = new Date();
  const upcoming = articles
    .filter((a) => getEventDate(a) >= now)
    .sort((a, b) => getEventDate(a).getTime() - getEventDate(b).getTime());
  const past = articles
    .filter((a) => getEventDate(a) < now)
    .sort((a, b) => getEventDate(b).getTime() - getEventDate(a).getTime());

  return {upcoming, past};
}

export default function EventsIndex() {
  const {upcoming, past} = useLoaderData<typeof loader>();

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
            {upcoming.length > 0 ? (
              <div className="events-grid">
                {upcoming.map((event: any) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted">Hamarosan új eseményeket hirdetünk!</p>
            )}
          </div>

          {/* Past events */}
          {past.length > 0 && (
            <div className="events-section mt-12">
              <h2 className="events-section-title">Korábbi események</h2>
              <div className="events-grid">
                {past.map((event: any) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}
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
            {isArticle ? formatDate(getEventDate(event).toISOString()) : event.date}
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
        articles(first: 50, sortKey: PUBLISHED_AT, reverse: true) {
          nodes {
            id
            title
            handle
            publishedAt
            tags
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
