import {Link} from 'react-router';
import {CAMPAIGN_PATH, type Campaign} from '~/lib/campaigns';

/**
 * One-line strip above the header for the leading automatic discount. The
 * campaign comes from Shopify through the root loader, so a new discount in
 * the admin shows up here without a deploy.
 */
export function AnnouncementBar({campaign}: {campaign?: Campaign | null}) {
  if (!campaign) return null;
  const to = campaign.appliesToAll || campaign.kind === 'shipping' ? '/collections/all' : CAMPAIGN_PATH;
  return (
    <div className="announcement-bar" role="region" aria-label="Akció">
      <p className="announcement-bar-text">
        <span className="announcement-bar-badge">{campaign.copy.shortLabel}</span>
        {campaign.copy.banner}{' '}
        <Link to={to} prefetch="intent">
          {campaign.copy.cta}
        </Link>
      </p>
    </div>
  );
}
