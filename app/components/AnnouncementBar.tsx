import {Link} from 'react-router';
import {CAMPAIGN} from '~/lib/config';

/**
 * One-line campaign strip above the header. Rendered only while the campaign
 * runs (the root loader decides on the server, so there is no date logic on
 * the client and no hydration mismatch around midnight).
 */
export function AnnouncementBar({active}: {active: boolean}) {
  if (!active) return null;
  return (
    <div className="announcement-bar" role="region" aria-label="Akció">
      <p className="announcement-bar-text">
        <span className="announcement-bar-badge">{CAMPAIGN.shortLabel}</span>
        {CAMPAIGN.bannerText}{' '}
        <Link to={`/collections/${CAMPAIGN.collectionHandle}`} prefetch="intent">
          {CAMPAIGN.bannerCta}
        </Link>
      </p>
    </div>
  );
}
