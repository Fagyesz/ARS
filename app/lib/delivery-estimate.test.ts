import {describe, expect, it} from 'vitest';
import {deliveryEstimate, parseDayRange} from './delivery-estimate';

const handling = {min: 1, max: 2};
const transit = {min: 2, max: 3};

describe('parseDayRange', () => {
  it('reads the numbers out of the settings text', () => {
    expect(parseDayRange('1–2 munkanap')).toEqual({min: 1, max: 2});
    expect(parseDayRange('3 nap')).toEqual({min: 3, max: 3});
    expect(parseDayRange('hamarosan')).toBeNull();
  });
});

describe('deliveryEstimate', () => {
  it('counts working days only', () => {
    // Thursday 8 Oct 2026, noon in Budapest
    expect(deliveryEstimate(new Date('2026-10-08T10:00:00Z'), handling, transit)).toBe(
      'okt. 13–15.',
    );
    // Friday: the weekend is skipped
    expect(deliveryEstimate(new Date('2026-10-09T10:00:00Z'), handling, transit)).toBe(
      'okt. 14–16.',
    );
  });

  it('uses the Budapest calendar day', () => {
    // 23:30 UTC on Friday 30 Oct is already Saturday 31 Oct in Budapest
    expect(deliveryEstimate(new Date('2026-10-30T23:30:00Z'), handling, transit)).toBe(
      'nov. 4–6.',
    );
  });

  it('spells out both months across a month boundary', () => {
    expect(
      deliveryEstimate(new Date('2026-10-28T10:00:00Z'), {min: 1, max: 1}, {min: 1, max: 3}),
    ).toBe('okt. 30. – nov. 3.');
  });

  it('shows a single day when the window has no width', () => {
    expect(
      deliveryEstimate(new Date('2026-10-08T10:00:00Z'), {min: 1, max: 1}, {min: 1, max: 1}),
    ).toBe('okt. 12.');
  });
});
