type Allocation = {
  discountedAmount: {amount: string; currencyCode: string};
  title?: string | null;
  code?: string | null;
};

/** Customer-facing name of a cart discount allocation (automatic title or entered code). */
export function discountLabel(allocation: Allocation): string {
  if (allocation.title) return allocation.title;
  if (allocation.code) return allocation.code;
  return 'Kedvezmény';
}

/** Sum the discount allocations on a cart's lines, grouped by label. */
export function summarizeLineDiscounts(
  lines: Array<{discountAllocations?: Allocation[] | null}>,
): Array<{label: string; amount: number; currencyCode: string}> {
  const byLabel = new Map<string, {amount: number; currencyCode: string}>();
  for (const line of lines) {
    for (const a of line.discountAllocations ?? []) {
      const amount = parseFloat(a.discountedAmount.amount);
      if (!(amount > 0)) continue;
      const label = discountLabel(a);
      const entry = byLabel.get(label) ?? {amount: 0, currencyCode: a.discountedAmount.currencyCode};
      entry.amount += amount;
      byLabel.set(label, entry);
    }
  }
  return [...byLabel].map(([label, v]) => ({label, ...v}));
}
