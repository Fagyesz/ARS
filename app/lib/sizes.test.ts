import {describe, expect, it} from 'vitest';
import {
  availableSizes,
  compareSizes,
  expandSize,
  filterBySize,
  parseSizeParam,
  sizeOptions,
} from './sizes';

const product = (...variants: Array<[size: string, available: boolean]>) => ({
  variants: {
    nodes: variants.map(([size, availableForSale]) => ({
      availableForSale,
      selectedOptions: [
        {name: 'Méret', value: size},
        {name: 'Szín', value: 'Fehér'},
      ],
    })),
  },
});

describe('expandSize', () => {
  it('expands ranges of standard sizes, in either order and with any dash', () => {
    expect(expandSize('M-L')).toEqual(['M', 'L']);
    expect(expandSize('xs–s')).toEqual(['XS', 'S']);
    expect(expandSize('L-S')).toEqual(['S', 'M', 'L']);
  });

  it('leaves other values alone', () => {
    expect(expandSize('Egy méret')).toEqual(['Egy méret']);
    expect(expandSize('42')).toEqual(['42']);
  });
});

describe('availableSizes, sizeOptions, filterBySize', () => {
  const tee = product(['S', true], ['M', false], ['L', true]);
  const jacket = product(['M-L', true]);
  const soldOut = product(['XL', false]);

  it('only counts in-stock variants and expands ranges', () => {
    expect(availableSizes(tee)).toEqual(['S', 'L']);
    expect(availableSizes(jacket)).toEqual(['M', 'L']);
    expect(availableSizes(soldOut)).toEqual([]);
  });

  it('lists the filter chips in XS–XXL order', () => {
    expect(sizeOptions([jacket, tee, soldOut])).toEqual(['S', 'M', 'L']);
  });

  it('keeps the products buyable in the size (any case), or all for no size', () => {
    expect(filterBySize([tee, jacket, soldOut], 'm')).toEqual([jacket]);
    expect(filterBySize([tee, jacket], '')).toEqual([tee, jacket]);
  });

  it('orders standard sizes before one-off sizes', () => {
    expect(['Egy méret', 'XL', 'S'].sort(compareSizes)).toEqual(['S', 'XL', 'Egy méret']);
  });

  it('trims and caps the ?size= value', () => {
    expect(parseSizeParam('  M ')).toBe('M');
    expect(parseSizeParam(null)).toBe('');
    expect(parseSizeParam('x'.repeat(50))).toHaveLength(12);
  });
});
