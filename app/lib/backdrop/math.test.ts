import {describe, expect, it} from 'vitest';
import {bgAt, hash01, springStep, zoneWeights} from './math';

describe('zoneWeights', () => {
  const H = 800;

  it('always sums to 1 and gives uncovered space to drift', () => {
    for (const scroll of [0, 300, 700, 1500, 3000]) {
      const sections = [
        {top: 0 - scroll, bottom: 800 - scroll, motif: 'line'},
        {top: 800 - scroll, bottom: 1900 - scroll, motif: 'print'},
      ];
      const sum = zoneWeights(sections, H).reduce((a, w) => a + w.w, 0);
      expect(sum).toBeCloseTo(1, 5);
    }
    expect(zoneWeights([], H)).toEqual([{motif: 'drift', w: 1}]);
  });

  it('hands the screen to a section once it covers the focus line', () => {
    expect(zoneWeights([{top: -200, bottom: 1200, motif: 'print'}], H)[0]).toEqual({
      motif: 'print',
      w: 1,
    });
  });

  it('lets a lower focus line take over earlier', () => {
    // starts at 450 px: below the default middle focus, above a focus at 70 %
    const sections = [{top: 450, bottom: 2000, motif: 'print'}];
    const weightOf = (ws: Array<{motif: string; w: number}>) =>
      ws.find((w) => w.motif === 'print')?.w ?? 0;
    expect(weightOf(zoneWeights(sections, H, H * 0.4, H * 0.7))).toBeGreaterThan(
      weightOf(zoneWeights(sections, H)),
    );
  });
});

describe('springStep', () => {
  it('settles on the target without overshooting', () => {
    const pos = new Float32Array([0]);
    const vel = new Float32Array([0]);
    let max = 0;
    for (let i = 0; i < 600; i++) {
      springStep(pos, vel, 0, 10, 3.2, 1 / 60);
      max = Math.max(max, pos[0]);
    }
    expect(pos[0]).toBeCloseTo(10, 2);
    expect(max).toBeLessThanOrEqual(10.001);
  });
});

describe('hash01 and bgAt', () => {
  it('hash01 is stable and in [0, 1)', () => {
    expect(hash01(7, 1, 2, 3)).toBe(hash01(7, 1, 2, 3));
    for (let i = 0; i < 100; i++) {
      const v = hash01(7, i);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('bgAt returns the band colour inside a band and the page colour outside', () => {
    const bands = [{top: 100, bottom: 500, rgb: [0, 0, 0] as const}];
    const out: [number, number, number] = [0, 0, 0];
    expect(bgAt(300, bands, [1, 1, 1], out)).toEqual([0, 0, 0]);
    expect(bgAt(900, bands, [1, 1, 1], out)).toEqual([1, 1, 1]);
  });
});
