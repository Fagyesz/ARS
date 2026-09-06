/**
 * Hand a Storefront-API cart over to kosR's checkout page.
 *
 * kosR renders its checkout as an Online Store app-proxy page (/apps/checkout) and
 * reads the Online Store's own cart, which knows nothing about our Hydrogen cart.
 * Shopify's cart URLs let us rebuild that cart with server-side redirects only:
 *
 *   /cart/clear → (/discount/CODE →) /cart/add?items[…] → /apps/checkout
 *
 * Each hop carries the next one in `return_to` / `redirect`, so the value must be
 * encoded once per nesting level.
 */
export type BridgeLine = {
  /** ProductVariant gid or bare numeric id */
  variantId: string;
  quantity: number;
};

export function numericVariantId(id: string): string {
  const match = /ProductVariant\/(\d+)/.exec(id);
  return match ? match[1] : id;
}

export function buildKosrCheckoutUrl({
  host,
  path,
  lines,
  discountCode,
}: {
  host: string;
  path: string;
  lines: BridgeLine[];
  discountCode?: string | null;
}): string | null {
  const items = lines.filter((line) => line.quantity > 0);
  if (!items.length) return null;

  const add = new URLSearchParams();
  items.forEach((line, i) => {
    add.set(`items[${i}][id]`, numericVariantId(line.variantId));
    add.set(`items[${i}][quantity]`, String(line.quantity));
  });
  add.set('return_to', path);
  const addUrl = `/cart/add?${add.toString()}`;

  // clear first so a stale Online Store cart cannot merge into the order; apply the
  // coupon before adding so it attaches to the fresh cart
  const afterClear = discountCode
    ? `/discount/${encodeURIComponent(discountCode)}?redirect=${encodeURIComponent(addUrl)}`
    : addUrl;
  const clearUrl = `/cart/clear?return_to=${encodeURIComponent(afterClear)}`;

  return `https://${host}${clearUrl}`;
}
