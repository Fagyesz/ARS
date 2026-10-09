import {describe, expect, it} from 'vitest';
import {buildCopy, eligibleCampaign, untilHu, type Campaign} from './campaigns';

const base: Omit<Campaign, 'copy'> = {
  id: 'gid://shopify/DiscountAutomaticNode/1',
  kind: 'bxgy',
  title: 'Nyitási akció',
  endsAt: '2026-09-30T21:59:00Z',
  percentage: 50,
  amount: null,
  buysQuantity: 1,
  getsQuantity: 1,
  usesPerOrderLimit: null,
  appliesToAll: false,
  productIds: ['p1'],
  productHandles: ['baseline-polo', 'visions-polo'],
  productTitles: ['Baseline póló', 'Visions póló'],
  productType: 'Póló',
  minimumSubtotal: null,
};

const campaign = (over: Partial<Campaign> = {}): Campaign => {
  const c = {...base, ...over};
  return {...c, copy: buildCopy(c)};
};

describe('untilHu', () => {
  it('formats the end date in Budapest time', () => {
    expect(untilHu('2026-09-30T21:59:00Z')).toBe('szeptember 30-ig');
    // 22:30 UTC on 30 Sept is already 1 Oct in Budapest
    expect(untilHu('2026-09-30T22:30:00Z')).toBe('október 1-jéig');
  });

  it('is empty without an end date', () => {
    expect(untilHu(null)).toBe('');
  });
});

describe('eligibleCampaign', () => {
  const shipping = campaign({kind: 'shipping', appliesToAll: true});
  const pairs = campaign();

  it('skips shipping discounts and returns the first one that covers the product', () => {
    expect(eligibleCampaign([shipping, pairs], 'p1')).toBe(pairs);
    expect(eligibleCampaign([shipping, pairs], 'p2')).toBeNull();
    expect(eligibleCampaign(null, 'p1')).toBeNull();
  });
});

describe('buildCopy', () => {
  it('second tee at half price', () => {
    const copy = buildCopy(base);
    expect(copy.shortLabel).toBe('2. póló féláron');
    expect(copy.banner).toBe(
      'Nyitási akció szeptember 30-ig: Baseline póló vagy Visions póló, a második féláron.',
    );
    expect(copy.cartNudge).toBe('Még egy akciós póló, és a másodikat féláron adjuk.');
  });

  it('percentage off everything above a minimum', () => {
    const copy = buildCopy({
      ...base,
      kind: 'basic',
      appliesToAll: true,
      percentage: 20,
      minimumSubtotal: 15000,
      endsAt: null,
    });
    expect(copy.shortLabel).toBe('−20%');
    expect(copy.banner).toBe(
      'Nyitási akció: 20% kedvezmény minden termékre, 15 000 Ft feletti rendelésnél. A kosárban automatikusan érvényesül.',
    );
    expect(copy.cartNudge).toBe('');
  });

  it('free shipping above a minimum', () => {
    const copy = buildCopy({...base, kind: 'shipping', minimumSubtotal: 30000, endsAt: null});
    expect(copy.shortLabel).toBe('Ingyenes szállítás');
    expect(copy.banner).toBe('Nyitási akció: ingyenes szállítás 30 000 Ft feletti rendelésnél.');
  });
});
