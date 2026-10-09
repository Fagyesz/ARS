import {describe, expect, it} from 'vitest';
import {formatMoney} from './money';

describe('formatMoney', () => {
  it('keeps 4-digit amounts solid and groups larger ones with a space', () => {
    expect(formatMoney('8000.0')).toBe('8000 Ft');
    expect(formatMoney(12000)).toBe('12 000 Ft');
    expect(formatMoney('1234567')).toBe('1 234 567 Ft');
  });

  it('rounds to whole forints', () => {
    expect(formatMoney('6999.6')).toBe('7000 Ft');
  });

  it('uses a real minus sign, and the currency code for non-HUF', () => {
    expect(formatMoney(-1500)).toBe('−1500 Ft');
    expect(formatMoney(20, 'EUR')).toBe('20 EUR');
  });

  it('returns an empty string for junk', () => {
    expect(formatMoney('abc')).toBe('');
  });
});
