import {formatMoney} from './money';

/**
 * A running automatic discount, as the storefront shows it. Built on the
 * server from Shopify's discount data (see campaigns.server.ts); nothing here
 * is hand-maintained, so a new discount in the admin shows up on its own.
 */
export type CampaignKind = 'bxgy' | 'basic' | 'shipping';

export type Campaign = {
  id: string;
  kind: CampaignKind;
  /** The discount title as set in the admin; Shopify shows it at checkout too */
  title: string;
  endsAt: string | null;
  /** 0–100 for percentage discounts */
  percentage: number | null;
  /** fixed amount in the shop currency */
  amount: number | null;
  buysQuantity: number;
  getsQuantity: number;
  usesPerOrderLimit: number | null;
  appliesToAll: boolean;
  /** eligible ("customer gets") products; collections are expanded to product ids */
  productIds: string[];
  productHandles: string[];
  productTitles: string[];
  /** common product type of the eligible products, when they share one */
  productType: string | null;
  minimumSubtotal: number | null;
  copy: CampaignCopy;
};

export type CampaignCopy = {
  shortLabel: string;
  banner: string;
  cta: string;
  productNote: string;
  cartNudge: string;
  cartNudgeCta: string;
};

/** Landing page listing the eligible products of every running campaign */
export const CAMPAIGN_PATH = '/akcio';

export function isEligible(campaign: Campaign, productId: string): boolean {
  if (campaign.kind === 'shipping') return false;
  return campaign.appliesToAll || campaign.productIds.includes(productId);
}

/** First campaign that applies to the product, for badges and notes */
export function eligibleCampaign(
  campaigns: Campaign[] | null | undefined,
  productId: string,
): Campaign | null {
  return campaigns?.find((c) => isEligible(c, productId)) ?? null;
}

const MONTHS_HU = [
  'január', 'február', 'március', 'április', 'május', 'június',
  'július', 'augusztus', 'szeptember', 'október', 'november', 'december',
];

/** "szeptember 30-ig" for an ISO end date, in shop local time */
export function untilHu(endsAt: string | null): string {
  if (!endsAt) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Budapest',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date(endsAt));
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  if (!month || !day) return '';
  return `${MONTHS_HU[month - 1]} ${day === 1 ? '1-jé' : day}-ig`;
}

function listHu(titles: string[]): string {
  if (titles.length <= 3) return titles.join(' vagy ');
  return `${titles[0]}, ${titles[1]} és még ${titles.length - 2} termék`;
}

function reductionHu(campaign: Pick<Campaign, 'percentage' | 'amount'>): string {
  if (campaign.percentage === 50) return 'féláron';
  if (campaign.percentage) return `${campaign.percentage}% kedvezménnyel`;
  if (campaign.amount) return `${formatMoney(campaign.amount)} kedvezménnyel`;
  return 'kedvezménnyel';
}

/** Hungarian copy for every surface, derived only from the discount's facts */
export function buildCopy(campaign: Omit<Campaign, 'copy'>): CampaignCopy {
  const until = untilHu(campaign.endsAt);
  const titleUntil = `${campaign.title}${until ? ` ${until}` : ''}`;
  const typeWord = campaign.productType?.toLowerCase() || 'termék';
  const scope = campaign.appliesToAll
    ? `bármely ${typeWord}`
    : listHu(campaign.productTitles);
  const reduction = reductionHu(campaign);

  if (campaign.kind === 'shipping') {
    const min = campaign.minimumSubtotal
      ? ` ${formatMoney(campaign.minimumSubtotal)} feletti rendelésnél`
      : '';
    return {
      shortLabel: 'Ingyenes szállítás',
      banner: `${titleUntil}: ingyenes szállítás${min}.`,
      cta: 'Irány a bolt',
      productNote: `Ingyenes szállítás${min}${until ? `, ${until}` : ''}.`,
      cartNudge: '',
      cartNudgeCta: '',
    };
  }

  if (campaign.kind === 'bxgy') {
    const nth = campaign.buysQuantity + campaign.getsQuantity;
    const pair = campaign.buysQuantity === 1 && campaign.getsQuantity === 1;
    return {
      shortLabel: `${nth}. ${typeWord} ${reduction}`,
      banner: pair
        ? `${titleUntil}: ${scope}, a második ${reduction}.`
        : `${titleUntil}: ${scope}, ${campaign.buysQuantity} db mellé a ${nth}. ${reduction}.`,
      cta: 'Mutasd az akciós termékeket',
      productNote: `Tegyél ${nth} akciós darabot a kosárba (bármilyen szín és méret), és az olcsóbbat ${reduction} kapod.${
        campaign.usesPerOrderLimit ? ' Rendelésenként egyszer.' : ''
      }${until ? ` Az akció ${until} él.` : ''}`,
      cartNudge: pair
        ? `Még egy akciós ${typeWord}, és a másodikat ${reduction} adjuk.`
        : `Tegyél még akciós darabot a kosárba: ${campaign.buysQuantity} db mellé a ${nth}. ${reduction}.`,
      cartNudgeCta: 'Választok még egyet',
    };
  }

  const min = campaign.minimumSubtotal
    ? `, ${formatMoney(campaign.minimumSubtotal)} feletti rendelésnél`
    : '';
  const value = campaign.percentage
    ? `${campaign.percentage}% kedvezmény`
    : `${formatMoney(campaign.amount ?? 0)} kedvezmény`;
  return {
    shortLabel: campaign.percentage ? `−${campaign.percentage}%` : `−${formatMoney(campaign.amount ?? 0)}`,
    banner: `${titleUntil}: ${value} ${campaign.appliesToAll ? 'minden termékre' : 'a kiválasztott termékekre'}${min}. A kosárban automatikusan érvényesül.`,
    cta: campaign.appliesToAll ? 'Irány a bolt' : 'Mutasd az akciós termékeket',
    productNote: `Erre a termékre ${value} jár a kosárban${min}.${until ? ` Az akció ${until} él.` : ''}`,
    cartNudge: '',
    cartNudgeCta: '',
  };
}
