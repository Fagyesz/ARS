import {describe, expect, it} from 'vitest';
import {
  formatReceivedAt,
  isOrderEmail,
  orderName,
  ownerNotice,
  parseWithdrawal,
  withdrawalError,
  withdrawalReceipt,
} from './withdrawal';

const valid = {name: 'Kovács Anna', email: 'anna@example.com', orderNumber: '#1001', items: ''};

describe('parseWithdrawal', () => {
  it('trims the values and treats missing fields as empty', () => {
    const form = new FormData();
    form.set('name', '  Kovács Anna ');
    expect(parseWithdrawal(form)).toEqual({name: 'Kovács Anna', email: '', orderNumber: '', items: ''});
  });
});

describe('withdrawalError', () => {
  it('accepts a complete statement without listed items', () => {
    expect(withdrawalError(valid)).toBeNull();
  });

  it('accepts an order reference that is not a Shopify number', () => {
    expect(withdrawalError({...valid, orderNumber: 'egyedi rendelés, május'})).toBeNull();
  });

  it.each([
    [{...valid, name: ''}, 'neved'],
    [{...valid, email: 'nem-email'}, 'e-mail'],
    [{...valid, orderNumber: ''}, 'rendelés'],
    [{...valid, orderNumber: 'Nyerj itt: evil.com'}, 'rendelés'],
    [{...valid, orderNumber: 'a'.repeat(61)}, 'rendelés'],
    [{...valid, name: 'Anna https://evil.example'}, 'neved'],
    [{...valid, name: 'a'.repeat(101)}, 'neved'],
    [{...valid, items: 'Katt ide: www.evil.example'}, 'link'],
    [{...valid, items: 'nyeremény a evil.com oldalon'}, 'link'],
    [{...valid, items: 'a'.repeat(501)}, 'link'],
  ])('rejects %j', (input, expected) => {
    expect(withdrawalError(input)).toContain(expected);
  });
});

describe('orderName', () => {
  it.each([
    ['1001', '#1001'],
    ['#1001', '#1001'],
    ['egyedi rendelés', null],
  ])('turns %s into the Shopify name', (input, expected) => {
    expect(orderName(input)).toBe(expected);
  });
});

describe('isOrderEmail', () => {
  it('ignores case and surrounding space', () => {
    expect(isOrderEmail(' Anna@Example.com', 'anna@example.com')).toBe(true);
  });

  it.each([[null], ['masik@example.com']])('refuses %s', (orderEmail) => {
    expect(isOrderEmail(orderEmail, 'anna@example.com')).toBe(false);
  });
});

describe('ownerNotice', () => {
  it('keeps the receipt and says whether the sender matches the order', () => {
    expect(ownerNotice('RECEIPT', true)).toContain('RECEIPT');
    expect(ownerNotice('RECEIPT', true)).toContain('egyezik');
    expect(ownerNotice('RECEIPT', false)).toContain('RECEIPT');
    expect(ownerNotice('RECEIPT', false)).toContain('nem egyeztethető');
  });
});

describe('formatReceivedAt', () => {
  it('uses Hungarian time, not UTC', () => {
    expect(formatReceivedAt(new Date('2026-11-01T23:30:00Z'))).toContain('november 2.');
  });
});

describe('withdrawalReceipt', () => {
  it('states the content, date and time', () => {
    const receipt = withdrawalReceipt(valid, '2026. november 2. 0:30:00');
    expect(receipt).toContain('2026. november 2. 0:30:00');
    expect(receipt).toContain('#1001');
    expect(receipt).toContain('elállok');
    expect(receipt).toContain('a rendelés összes terméke');
  });

  it('lists the items when only some are withdrawn', () => {
    expect(withdrawalReceipt({...valid, items: 'Dongó póló, M'}, 'x')).toContain('Dongó póló, M');
  });
});
