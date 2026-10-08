// Ported from smallbiz-platform (packages/ui/src/backdrop/math.ts), the Pöcc-style full-page backdrop.
// Pure maths of the backdrop: scroll weights, springs, background lookup and stable randoms.
// No DOM, no three: unit-tested directly and shared by the runtime and the themes.

export const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));

/** Hermite smoothstep of x over [0, 1]. */
export function smooth01(x: number): number {
  const k = clamp(x, 0, 1);
  return k * k * (3 - 2 * k);
}

export const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;

/** Fractional part (always in [0, 1)). */
export const frac = (x: number): number => x - Math.floor(x);

/**
 * Stable pseudo-random number in [0, 1) for a tuple of integers. Same inputs, same output, on every device:
 * motifs use it for jitter so a layout never reshuffles between frames or reloads.
 */
export function hash01(seed: number, a: number, b = 0, c = 0): number {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  for (const v of [a, b, c]) {
    h = Math.imul(h ^ (v | 0), 0x85ebca6b) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35) >>> 0;
    h ^= h >>> 16;
  }
  return (h >>> 0) / 4294967296;
}

/** A section that asked for a motif, in viewport px (top/bottom as from getBoundingClientRect). */
export interface SectionBox { top: number; bottom: number; motif: string }

export interface Weight { motif: string; w: number }

/**
 * How much each motif owns the screen right now. The focus line sits at `focus` px (default the middle of
 * the viewport); a
 * section's weight ramps up with a smoothstep as its top passes the focus line and back down as its bottom
 * does, over `blend` px (default 70 % of the viewport height). Adjacent sections hand over exactly (their
 * weights sum to 1); whatever no section claims (gaps, the footer) goes to "drift". Result sums to 1.
 */
export function zoneWeights(sections: readonly SectionBox[], viewportH: number, blend = viewportH * 0.7, focus = viewportH * 0.5): Weight[] {
  const E = Math.max(1, blend);
  const acc = new Map<string, number>();
  let sum = 0;
  for (const s of sections) {
    if (!(s.bottom > s.top)) continue;
    const w = smooth01((focus - s.top) / E + 0.5) * (1 - smooth01((focus - s.bottom) / E + 0.5));
    if (!(w > 1e-4)) continue;
    acc.set(s.motif, (acc.get(s.motif) ?? 0) + w);
    sum += w;
  }
  const out: Weight[] = [];
  const norm = sum > 1 ? 1 / sum : 1;
  for (const [motif, w] of acc) if (motif !== "drift") out.push({ motif, w: w * norm });
  const rest = Math.max(0, 1 - Math.min(sum, 1)) + (acc.get("drift") ?? 0) * norm;
  if (rest > 1e-4) out.push({ motif: "drift", w: rest });
  out.sort((a, b) => b.w - a.w);
  return out;
}

/**
 * One step of a critically damped spring (no overshoot, never snappy), semi-implicit Euler.
 * Writes position and velocity back into the arrays at `i`. Stable for omega * dt < ~1.
 */
export function springStep(pos: Float32Array, vel: Float32Array, i: number, target: number, omega: number, dt: number): void {
  const x = pos[i] ?? 0;
  let v = vel[i] ?? 0;
  v += (omega * omega * (target - x) - 2 * omega * v) * dt;
  pos[i] = x + v * dt;
  vel[i] = v;
}

/** A background band in viewport px with its colour as linear-ish RGB floats. */
export interface BgBand { top: number; bottom: number; rgb: readonly [number, number, number] }

/**
 * The background colour behind a viewport y: the band that contains it, cross-faded with the neighbour over
 * `edge` px around each band edge (so an object drifting from a white band into a dark one changes tone softly).
 * Writes into `out` and returns it.
 */
export function bgAt(y: number, bands: readonly BgBand[], page: readonly [number, number, number], out: [number, number, number], edge = 48): [number, number, number] {
  out[0] = page[0]; out[1] = page[1]; out[2] = page[2];
  for (const b of bands) {
    if (y < b.top - edge || y > b.bottom + edge) continue;
    const k = smooth01((y - (b.top - edge)) / (2 * edge)) * (1 - smooth01((y - (b.bottom - edge)) / (2 * edge)));
    if (k <= 0) continue;
    out[0] = lerp(out[0], b.rgb[0], k);
    out[1] = lerp(out[1], b.rgb[1], k);
    out[2] = lerp(out[2], b.rgb[2], k);
  }
  return out;
}

/** Fade an object picks up from depth alone: none at the screen plane, `max` from `far` units back. */
export function depthFade(z: number, far = 10, max = 0.6): number {
  return smooth01(-z / far) * max;
}
