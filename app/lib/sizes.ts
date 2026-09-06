/**
 * Garment sizes as the shop sells them. Used by the product form (the S–XL
 * row) and by the catalogue's size filter (`?size=M`), which keeps only the
 * products that can be bought in that size right now.
 */

export const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function isSizeOption(name: string) {
  const lower = name.toLowerCase();
  return lower === 'size' || lower === 'méret';
}

type Variant = {
  availableForSale: boolean;
  selectedOptions: Array<{name: string; value: string}>;
};

export type SizedProduct = {
  variants?: {nodes: Variant[]} | null;
};

/**
 * A one-off piece sized "M-L" fits an M and an L shopper alike, so a range of
 * standard sizes counts as every size in it: "S-L" → S, M, L. Anything else
 * ("Egy méret", "42") stays as it is.
 */
export function expandSize(value: string): string[] {
  const v = value.trim();
  const range = v.match(/^([a-z]{1,3})\s*[-–/]\s*([a-z]{1,3})$/i);
  if (range) {
    const from = STANDARD_SIZES.indexOf(range[1].toUpperCase());
    const to = STANDARD_SIZES.indexOf(range[2].toUpperCase());
    if (from !== -1 && to !== -1) {
      const [lo, hi] = from <= to ? [from, to] : [to, from];
      return STANDARD_SIZES.slice(lo, hi + 1);
    }
  }
  return [v];
}

/** Sizes the product can be bought in right now (an in-stock "M-L" counts as M and L) */
export function availableSizes(product: SizedProduct): string[] {
  const sizes = new Set<string>();
  for (const variant of product.variants?.nodes ?? []) {
    if (!variant.availableForSale) continue;
    const option = variant.selectedOptions.find((o) => isSizeOption(o.name));
    if (option?.value) for (const size of expandSize(option.value)) sizes.add(size);
  }
  return [...sizes];
}

/** Standard sizes in XS–XXL order, then one-off sizes alphabetically */
export function compareSizes(a: string, b: string) {
  const ia = STANDARD_SIZES.indexOf(a);
  const ib = STANDARD_SIZES.indexOf(b);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.localeCompare(b, 'hu');
}

/** Every size that at least one of the products is available in, for the filter chips */
export function sizeOptions(products: SizedProduct[]): string[] {
  const all = new Set<string>();
  for (const product of products) for (const size of availableSizes(product)) all.add(size);
  return [...all].sort(compareSizes);
}

/** The products available in `size` (ranges included); an empty size keeps everything */
export function filterBySize<T extends SizedProduct>(products: T[], size: string): T[] {
  const wanted = size.trim().toUpperCase();
  if (!wanted) return products;
  return products.filter((product) =>
    availableSizes(product).some((s) => s.toUpperCase() === wanted),
  );
}

/** `?size=` values are user input: keep them short and printable */
export function parseSizeParam(value: string | null): string {
  return (value ?? '').trim().slice(0, 12);
}
