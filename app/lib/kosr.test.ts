import {describe, expect, it} from 'vitest';
import {buildKosrCheckoutUrl, numericVariantId} from './kosr';

/** Follows the redirect chain the way Shopify does: one decode per nesting level. */
function hops(url: string) {
  const out: string[] = [];
  let next: string | null = new URL(url).pathname + new URL(url).search;
  while (next) {
    const u: URL = new URL(next, 'https://shop.test');
    out.push(u.pathname);
    next = u.searchParams.get('return_to') ?? u.searchParams.get('redirect');
  }
  return out;
}

describe('numericVariantId', () => {
  it('takes the number out of a gid and passes bare ids through', () => {
    expect(numericVariantId('gid://shopify/ProductVariant/123456')).toBe('123456');
    expect(numericVariantId('987')).toBe('987');
  });
});

describe('buildKosrCheckoutUrl', () => {
  const lines = [
    {variantId: 'gid://shopify/ProductVariant/111', quantity: 2},
    {variantId: 'gid://shopify/ProductVariant/222', quantity: 0},
    {variantId: '333', quantity: 1},
  ];

  it('returns null for an empty cart', () => {
    expect(buildKosrCheckoutUrl({host: 'shop.test', path: '/apps/checkout', lines: []})).toBeNull();
  });

  it('clears, adds the non-zero lines, then lands on the checkout path', () => {
    const url = buildKosrCheckoutUrl({host: 'shop.test', path: '/apps/checkout', lines})!;
    expect(url.startsWith('https://shop.test/cart/clear?')).toBe(true);
    expect(hops(url)).toEqual(['/cart/clear', '/cart/add', '/apps/checkout']);

    const add = new URL(new URL(url).searchParams.get('return_to')!, 'https://shop.test');
    expect(add.searchParams.get('items[0][id]')).toBe('111');
    expect(add.searchParams.get('items[0][quantity]')).toBe('2');
    expect(add.searchParams.get('items[1][id]')).toBe('333');
    expect(add.searchParams.has('items[2][id]')).toBe(false);
  });

  it('applies the coupon between clearing and adding, encoded once per level', () => {
    const url = buildKosrCheckoutUrl({
      host: 'shop.test',
      path: '/apps/checkout',
      lines,
      discountCode: 'NYÁR 10%',
    })!;
    expect(hops(url)).toEqual([
      '/cart/clear',
      '/discount/NY%C3%81R%2010%25',
      '/cart/add',
      '/apps/checkout',
    ]);
  });
});
