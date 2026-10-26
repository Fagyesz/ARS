/**
 * One customer-facing status per order, shared by the dashboard, the order list and the order page.
 * Cancellation and refunds win over shipping progress: a cancelled, refunded order must not read
 * "Fizetve" or show the parcel's raw state ("SUCCESS").
 */

type Amount = {amount: string; currencyCode: string};

export type OrderTransactionLike = {
  kind?: string | null;
  status?: string | null;
  transactionAmount?: {presentmentMoney: Amount} | null;
};

export type OrderStatusInput = {
  cancelledAt?: string | null;
  financialStatus?: string | null;
  fulfillmentStatus?: string | null;
  transactions?: OrderTransactionLike[] | null;
};

export type OrderStatusTone = 'pending' | 'paid' | 'shipped' | 'refunded' | 'cancelled';

export type OrderStatus = {
  label: string;
  tone: OrderStatusTone;
  /** progress bar step (1–4); 0 hides the bar */
  step: number;
};

const LIVE = ['SUCCESS', 'PENDING', 'PENDING_AUTHENTICATION'];

/** Refund transactions that went through or are still on their way. */
export function refundSummary(transactions: OrderTransactionLike[] | null | undefined) {
  const refunds = (transactions ?? []).filter(
    (t) => t.kind === 'REFUND' && LIVE.includes(t.status ?? ''),
  );
  const amount = refunds.reduce(
    (sum, t) => sum + Number(t.transactionAmount?.presentmentMoney.amount ?? 0),
    0,
  );
  return {amount, pending: refunds.some((t) => t.status !== 'SUCCESS')};
}

/** What the customer actually paid: successful sales and captures. */
export function paidAmount(transactions: OrderTransactionLike[] | null | undefined) {
  return (transactions ?? [])
    .filter((t) => (t.kind === 'SALE' || t.kind === 'CAPTURE') && t.status === 'SUCCESS')
    .reduce((sum, t) => sum + Number(t.transactionAmount?.presentmentMoney.amount ?? 0), 0);
}

const SHIPPING: Record<string, OrderStatus> = {
  UNFULFILLED: {label: 'Feldolgozás alatt', tone: 'paid', step: 1},
  OPEN: {label: 'Feldolgozás alatt', tone: 'paid', step: 1},
  PENDING_FULFILLMENT: {label: 'Feldolgozás alatt', tone: 'paid', step: 1},
  SCHEDULED: {label: 'Feldolgozás alatt', tone: 'paid', step: 1},
  IN_PROGRESS: {label: 'Csomagolás', tone: 'paid', step: 2},
  ON_HOLD: {label: 'Várakoztatva', tone: 'paid', step: 2},
  PARTIALLY_FULFILLED: {label: 'Részben feladva', tone: 'shipped', step: 3},
  FULFILLED: {label: 'Feladva', tone: 'shipped', step: 4},
  READY_FOR_DELIVERY: {label: 'Feladva', tone: 'shipped', step: 4},
  READY_FOR_PICKUP: {label: 'Átvehető', tone: 'shipped', step: 4},
  RESTOCKED: {label: 'Visszavéve', tone: 'cancelled', step: 0},
};

export function orderStatus(order: OrderStatusInput): OrderStatus {
  const refund = refundSummary(order.transactions);
  const cancelled = Boolean(order.cancelledAt);

  if (refund.pending) {
    return {
      label: cancelled ? 'Lemondva, visszatérítés folyamatban' : 'Visszatérítés folyamatban',
      tone: 'pending',
      step: 0,
    };
  }
  if (order.financialStatus === 'REFUNDED') {
    return {label: cancelled ? 'Lemondva, visszatérítve' : 'Visszatérítve', tone: 'refunded', step: 0};
  }
  if (cancelled) return {label: 'Lemondva', tone: 'cancelled', step: 0};
  if (order.financialStatus === 'VOIDED') return {label: 'Érvénytelenítve', tone: 'cancelled', step: 0};
  if (order.financialStatus === 'PENDING' || order.financialStatus === 'AUTHORIZED') {
    return {label: 'Fizetésre vár', tone: 'pending', step: 1};
  }

  const shipping = SHIPPING[order.fulfillmentStatus ?? 'UNFULFILLED'] ?? SHIPPING.UNFULFILLED;
  if (order.financialStatus === 'PARTIALLY_REFUNDED') {
    return {...shipping, label: `${shipping.label}, részben visszatérítve`};
  }
  return shipping;
}

/** Shown as the order total: what was paid, even after a refund brought `totalPrice` down. */
export function displayTotal(totalPrice: Amount, transactions: OrderTransactionLike[] | null | undefined) {
  return Math.max(Number(totalPrice.amount), paidAmount(transactions));
}
