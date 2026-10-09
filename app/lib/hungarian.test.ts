import {describe, expect, it} from 'vitest';
import {ablative} from './hungarian';

describe('ablative (-tól/-től)', () => {
  it('follows vowel harmony on the last word', () => {
    expect(ablative('Zsolt')).toBe('Zsolttól');
    expect(ablative('Emi')).toBe('Emitől');
    expect(ablative('Dóri')).toBe('Dóritól');
    expect(ablative('Nagy Emi')).toBe('Nagy Emitől');
  });

  it('lengthens a final a/e', () => {
    expect(ablative('Zorka')).toBe('Zorkától');
    expect(ablative('Bence')).toBe('Bencétől');
  });
});
