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
  // The form is open to anyone and these values reach the owners and the
  // receipt, so they must not be able to carry a message: short plain values, no links.
  if (!/^#?[\p{L}\d-]{1,30}$/u.test(input.orderNumber)) {
    return 'A rendelés számát a visszaigazoló e-mailben találod, például #1001.';
  }
  if (input.name.length > 100 || LINK.test(input.name)) return 'Csak a neved add meg.';
  if (input.items.length > 500 || LINK.test(input.items)) {
    return 'A termékeket rövidebben, link nélkül sorold fel.';
  }
  return null;
}

/** The order number as Shopify names it: "1001" and "#1001" are the same order. */
export function orderName(orderNumber: string): string {
  return `#${orderNumber.replace(/^#/, '')}`;
}

/**
 * The receipt is e-mailed only to the address on the order, so the form cannot
 * send mail to a stranger. A mismatch never rejects the withdrawal itself.
 */
export function isOrderEmail(orderEmail: string | null, email: string): boolean {
  return orderEmail?.trim().toLowerCase() === email.trim().toLowerCase();
}

/** The owners' copy: the receipt, and whether the sender could be tied to the order. */
export function ownerNotice(receipt: string, verified: boolean): string {
  const status = verified
    ? 'Ellenőrzés: a rendelésszám és az e-mail cím egyezik, a visszaigazolást elküldtük a vásárlónak.'
    : 'Ellenőrzés: a rendelésszám és az e-mail cím nem egyeztethető (elírás, 60 napnál régebbi rendelés vagy más cím). A vásárló NEM kapott e-mailt, csak a képernyőn látta a visszaigazolást. A nyilatkozat ettől még érvényes lehet, ellenőrizd a rendelést, és válaszolj neki.';
  return `${status}\n\n${receipt}`;
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
