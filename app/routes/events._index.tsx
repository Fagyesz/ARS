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
  const [featuredEvent, ...moreUpcoming] = upcoming;

  return (
    <div className="events-page">
      <section className="events-upcoming-section">
        <div className="container">
          <p className="events-section-label">Közelgő események</p>
          {upcoming.length === 0 ? (
            <p className="events-empty">Hamarosan új eseményeket hirdetünk.</p>
          ) : (
            <>
              <EventFeatured event={featuredEvent} />
              {moreUpcoming.length > 0 && (
                <div className="events-more-grid">
                  {moreUpcoming.map((event: any) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section className="events-past-section">
          <div className="container">
            <p className="events-section-label">Korábbi események</p>
            <div className="events-past-cards">
              {past.map((event: any, i: number) => (
                <PastEventCard key={event.id} event={event} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

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

function EventFeatured({event}: {event: any}) {
  const eventDate = getEventDate(event);
  const excerpt = event.excerpt
    || (event.content ? event.content.replace(/<[^>]+>/g, '').substring(0, 220) + '...' : '');

  return (
    <article className="event-featured">
      <Link to={`/blogs/event/${event.handle}`} className="event-featured-link">
        <div className="event-featured-image-wrap">
          {event.image ? (
            <Image
              data={event.image}
              aspectRatio="4/3"
              sizes="(min-width: 1024px) 55vw, 100vw"
            />
          ) : (
            <div className="event-featured-placeholder">
              <CalendarSvg size={56} />
            </div>
          )}
        </div>
        <div className="event-featured-content">
          <div className="event-featured-date-block">
            <span className="event-featured-day">{eventDate.getDate()}</span>
            <span className="event-featured-month-year">
              {eventDate.toLocaleDateString('hu-HU', {month: 'long'})}
              <br />
              {eventDate.getFullYear()}
            </span>
          </div>
          <span className="event-featured-eyebrow">Közelgő esemény</span>
          <h2 className="event-featured-title">{event.title}</h2>
          {excerpt && <p className="event-featured-excerpt">{excerpt}</p>}
          <span className="event-featured-cta">
            Részletek
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>
      </Link>
    </article>
  );
}

function EventCard({event}: {event: any}) {
  const eventDate = getEventDate(event);
  const excerpt = event.excerpt
    || (event.content ? event.content.replace(/<[^>]+>/g, '').substring(0, 120) + '...' : '');

  return (
    <article className="event-card">
      <Link to={`/blogs/event/${event.handle}`} className="event-card-inner">
        <div className="event-card-image">
          {event.image ? (
            <Image data={event.image} aspectRatio="16/9" sizes="(min-width: 768px) 40vw, 100vw" />
          ) : (
            <div className="event-card-placeholder"><CalendarSvg size={36} /></div>
          )}
        </div>
        <div className="event-card-content">
          <span className="event-card-date">{formatDate(eventDate.toISOString())}</span>
          <h3 className="event-card-title">{event.title}</h3>
          {excerpt && <p className="event-card-excerpt">{excerpt}</p>}
          <span className="event-card-cta">
            Részletek
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>
      </Link>
    </article>
  );
}

function PastEventCard({event, index: _index}: {event: any; index: number}) {
  const eventDate = getEventDate(event);
  return (
    <article className="past-event-card">
      <Link to={`/blogs/event/${event.handle}`} className="past-event-card-link">
        <div className="past-event-card-image">
          {event.image ? (
            <Image data={event.image} aspectRatio="16/9" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
          ) : (
            <div className="past-event-card-placeholder"><CalendarSvg size={36} /></div>
          )}
          <span className="past-event-card-badge">Lezárult</span>
        </div>
        <div className="past-event-card-content">
          <span className="past-event-card-date">{formatDate(eventDate.toISOString())}</span>
          <h3 className="past-event-card-title">{event.title}</h3>
        </div>
      </Link>
    </article>
  );
}

function CalendarSvg({size = 48}: {size?: number}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('hu-HU', {year: 'numeric', month: 'long', day: 'numeric'});
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
