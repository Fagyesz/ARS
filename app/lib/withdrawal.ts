/**
 * The online withdrawal statement required by 45/2014. Korm. rendelet 22. §
 * (1a)-(1c): the fields to collect, and the receipt on a durable medium with
 * the content, date and time of the withdrawal.
 */

export type WithdrawalInput = {
  name: string;
  email: string;
  orderNumber: string;
  items: string;
};

const LINK = /https?:|www\.|\b[\w-]+\.(?:com|net|org|hu|io|ru|info|xyz|link|ly)\b/i;

export function parseWithdrawal(formData: FormData): WithdrawalInput {
  const text = (key: string) => String(formData.get(key) ?? '').trim();
  return {
    name: text('name'),
    email: text('email'),
    orderNumber: text('orderNumber'),
    items: text('items'),
  };
}

/** The first problem to show the shopper, or null when the statement is complete. */
export function withdrawalError(input: WithdrawalInput): string | null {
  if (!input.name) return 'Add meg a neved.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return 'Adj meg egy érvényes e-mail címet, ide küldjük a visszaigazolást.';
  }
  if (!input.orderNumber) return 'Add meg a rendelés számát.';
  // The form is open to anyone and the receipt goes to the address it names, so
  // the values must not be able to carry a message: short and plain, no links.
  // Free text, as a custom order has no Shopify number.
  if (input.orderNumber.length > 60 || LINK.test(input.orderNumber)) {
    return 'A rendelés számát a visszaigazoló e-mailben találod, például #1001.';
  }
  if (input.name.length > 100 || LINK.test(input.name)) return 'Csak a neved add meg.';
  if (input.items.length > 500 || LINK.test(input.items)) {
    return 'A termékeket rövidebben, link nélkül sorold fel.';
  }
  return null;
}

/**
 * The order number as Shopify names it ("1001" and "#1001" are the same order),
 * or null when it cannot be a Shopify order number, such as a custom order.
 */
export function orderName(orderNumber: string): string | null {
  return /^#?[\p{L}\d-]{1,30}$/u.test(orderNumber) ? `#${orderNumber.replace(/^#/, '')}` : null;
}

/** Whether the sender is the address on the order: information for the owners, never a condition. */
export function isOrderEmail(orderEmail: string | null, email: string): boolean {
  return orderEmail?.trim().toLowerCase() === email.trim().toLowerCase();
}

/** The owners' copy: the receipt, and whether the sender could be tied to the order. */
export function ownerNotice(receipt: string, verified: boolean): string {
  const status = verified
    ? 'Ellenőrzés: a rendelésszám és az e-mail cím egyezik.'
    : 'Ellenőrzés: a rendelésszám és az e-mail cím nem egyeztethető (elírás, 60 napnál régebbi vagy egyedi rendelés, más cím). A nyilatkozat ettől még érvényes lehet, ellenőrizd a rendelést.';
  return `${status}\n\n${receipt}`;
}

/** Tells the owners that the customer has no receipt, which the law requires them to get. */
export function receiptFailedNotice(receipt: string): string {
  return `A visszaigazolást NEM sikerült elküldeni a vásárlónak. Küldd el neki kézzel!\n\n${receipt}`;
}

/** Date and time of receipt in Hungarian time, as the receipt must state it. */
export function formatReceivedAt(date: Date): string {
  return new Intl.DateTimeFormat('hu-HU', {
    timeZone: 'Europe/Budapest',
    dateStyle: 'long',
    timeStyle: 'medium',
  }).format(date);
}

export function withdrawalReceipt(input: WithdrawalInput, receivedAt: string): string {
  return [
    'Az elállási nyilatkozatodat megkaptuk.',
    '',
    `Beérkezés időpontja: ${receivedAt}`,
    `Név: ${input.name}`,
    `E-mail: ${input.email}`,
    `Rendelés száma: ${input.orderNumber}`,
    `Érintett termékek: ${input.items || 'a rendelés összes terméke'}`,
    '',
    'Nyilatkozat: elállok a fenti szerződéstől.',
    '',
    'A terméket az elállás közlésétől számított 14 napon belül kell visszaküldened.',
    'A visszaküldés részleteit külön e-mailben küldjük el.',
  ].join('\n');
}
