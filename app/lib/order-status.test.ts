import {describe, expect, it} from 'vitest';
import {displayTotal, orderStatus, refundSummary} from './order-status';

const money = (amount: string) => ({presentmentMoney: {amount, currencyCode: 'HUF'}});
const sale = {kind: 'SALE', status: 'SUCCESS', transactionAmount: money('1301.0')};

describe('orderStatus', () => {
  it('a paid order waiting for shipping', () => {
    expect(orderStatus({financialStatus: 'PAID', fulfillmentStatus: 'UNFULFILLED', transactions: [sale]})).toEqual({
      label: 'Feldolgozás alatt',
      tone: 'paid',
      step: 1,
    });
  });

  it('a shipped order', () => {
    expect(orderStatus({financialStatus: 'PAID', fulfillmentStatus: 'FULFILLED'}).label).toBe('Feladva');
  });

  it('a cancelled order with the refund still on its way is not "paid"', () => {
    const s = orderStatus({
      cancelledAt: '2026-10-26T15:00:00Z',
      financialStatus: 'PAID',
      fulfillmentStatus: 'FULFILLED',
      transactions: [sale, {kind: 'REFUND', status: 'PENDING', transactionAmount: money('1301.0')}],
    });
    expect(s).toEqual({label: 'Lemondva, visszatérítés folyamatban', tone: 'pending', step: 0});
  });

  it('a cancelled, refunded order', () => {
    expect(
      orderStatus({
        cancelledAt: '2026-10-26T15:00:00Z',
        financialStatus: 'REFUNDED',
        transactions: [sale, {kind: 'REFUND', status: 'SUCCESS', transactionAmount: money('1301.0')}],
      }).label,
    ).toBe('Lemondva, visszatérítve');
  });

  it('a failed refund does not count', () => {
    expect(refundSummary([{kind: 'REFUND', status: 'FAILURE', transactionAmount: money('5')}])).toEqual({
      amount: 0,
      pending: false,
    });
  });

  it('waits for payment', () => {
    expect(orderStatus({financialStatus: 'PENDING'}).label).toBe('Fizetésre vár');
  });
});

describe('displayTotal', () => {
  it('keeps the paid amount after a refund zeroed totalPrice', () => {
    expect(displayTotal({amount: '0.0', currencyCode: 'HUF'}, [sale])).toBe(1301);
    expect(displayTotal({amount: '8000.0', currencyCode: 'HUF'}, [])).toBe(8000);
  });
});
