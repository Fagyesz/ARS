// Ported from smallbiz-platform (packages/ui/src/backdrop/themes/helpers.ts), the Pöcc-style full-page backdrop.
// Layout helpers shared by the backdrop themes. Motifs are drawn in a local "zone": u to the right and v up,
// both roughly in [-1, 1], scaled by the zone radius R (CSS px). Sizes passed to `at` are in R units too.
import { clamp, frac, smooth01 } from "./math";
import type { MotifContext, Target } from "./types";

export interface Zone { cx: number; cy: number; R: number; z: number }

/**
 * The stage a section motif is drawn in. Wide screens: right of centre, where section headings leave room
 * (they are left-aligned and at most ~46rem wide). Tablets: a little further right. Phones: centred and
 * pushed back, so it reads as texture behind the text.
 */
export function stageZone(ctx: MotifContext): Zone {
  const { w, h } = ctx;
  if (w >= 1100) return { cx: w * 0.73, cy: h * 0.5, R: clamp(Math.min(w * 0.19, h * 0.33), 150, 300), z: 0 };
  if (w >= 720) return { cx: w * 0.66, cy: h * 0.5, R: Math.min(w * 0.27, h * 0.3), z: -1 };
  return { cx: w * 0.5, cy: h * 0.52, R: Math.min(w * 0.44, h * 0.3), z: -2.5 };
}

/**
 * Two-column sections with a sticky heading on the left (from 1024 px): the free space under that heading,
 * at the bottom of the left column. Below 1024 px the layout stacks, so this falls back to `stageZone`.
 */
export function underHeadZone(ctx: MotifContext, share = 0.38): Zone {
  if (ctx.w < 1024) return stageZone(ctx);
  const colW = Math.max(1, ctx.colRight - ctx.colLeft);
  const R = clamp(Math.min(colW * share * 0.42, ctx.h * 0.2), 100, 190);
  return { cx: ctx.colLeft + colW * share * 0.5, cy: ctx.h - R * 1.35, R, z: 0 };
}

/** Next to a left-aligned section heading (top right of the viewport), smaller than the stage. */
export function besideHeadZone(ctx: MotifContext): Zone {
  const z = stageZone(ctx);
  if (ctx.w < 1100) return z;
  return { ...z, cy: ctx.h * 0.36, R: z.R * 0.82 };
}

/** Full-width zone (grids that span the screen): centred, R = half the usable width. */
export function wideZone(ctx: MotifContext, maxHalf = 560): Zone {
  const { w, h } = ctx;
  return { cx: w / 2, cy: h * 0.46, R: Math.min(w * 0.46, maxHalf), z: w < 720 ? -2.5 : -1.5 };
}

/** A target at zone coordinates (u right, v up), size in R units. */
export function at(z: Zone, u: number, v: number, dz: number, size: number, color: string, more?: Partial<Target>): Target {
  return { x: z.cx + u * z.R, y: z.cy - v * z.R, z: z.z + dz, s: size * z.R, color, ...more };
}

export interface DriftOptions {
  /** Share of the instances that show at all (the rest melt away). */
  density?: number;
  /** Size range in px [min, max]. */
  size?: readonly [number, number];
  /** Colour for most instances, and an accent for one in `accentEvery`. */
  color: string;
  accent?: string;
  accentEvery?: number;
  /** Extra fade (0..1). */
  fade?: number;
  /** 0..1: lower is calmer (slower, smaller sway). */
  energy?: number;
}

/**
 * Ambient drift: instances scattered over the whole viewport, deep in z, slowly swaying. On wide screens
 * they prefer the margins and the gaps beside the content column.
 */
export function drift(i: number, ctx: MotifContext, o: DriftOptions): Target {
  const r = (k: number) => ctx.rand(i, k);
  const { w, h, t } = ctx;
  const density = o.density ?? 0.35;
  const energy = o.energy ?? 1;
  const [s0, s1] = o.size ?? [24, 48];
  let x = r(1) * w;
  if (ctx.wide) {
    const left = Math.max(0, ctx.colLeft), right = Math.max(0, w - ctx.colRight);
    // one in two prefers a margin when there is one worth the name
    if (left + right > 160 && r(5) < 0.5) x = r(1) < left / (left + right) ? r(6) * left : ctx.colRight + r(6) * right;
  }
  const f = (0.12 + r(3) * 0.18) * energy;
  const ph = r(4) * 6.283;
  return {
    x: x + Math.cos(t * f + ph) * 22 * energy,
    y: r(2) * h + Math.sin(t * f * 0.8 + ph) * 26 * energy,
    z: -3 - r(3) * 6,
    // mostly facing the camera: thin pieces seen edge-on read as shards, not as calm objects
    rx: (r(4) - 0.5) * 0.7 + Math.sin(t * f + r(0) * 6) * 0.14 * energy,
    ry: (r(3) - 0.5) * 0.8 + Math.cos(t * f * 0.9 + r(1) * 6) * 0.18 * energy,
    rz: (r(2) - 0.5) * 1.4,
    s: s0 + r(0) * (s1 - s0),
    color: o.accent && i % (o.accentEvery ?? 7) === 0 ? o.accent : o.color,
    fade: o.fade ?? 0.3,
    visible: r(7) < density ? 1 : 0,
  };
}

/** Points along a polyline (closed or open), evenly spaced by length: [x, y, angle]. */
export function alongPath(pts: readonly (readonly [number, number])[], n: number, closed: boolean): [number, number, number][] {
  const segs: [readonly [number, number], readonly [number, number], number][] = [];
  let total = 0;
  const m = closed ? pts.length : pts.length - 1;
  for (let k = 0; k < m; k++) {
    const a = pts[k]!, b = pts[(k + 1) % pts.length]!;
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push([a, b, d]);
    total += d;
  }
  const out: [number, number, number][] = [];
  for (let j = 0; j < n; j++) {
    let u = (closed ? j / n : j / Math.max(1, n - 1)) * total;
    let placed = false;
    for (const [a, b, d] of segs) {
      if (u <= d + 1e-6) {
        const k = d ? u / d : 0;
        out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[1] - a[1], b[0] - a[0])]);
        placed = true;
        break;
      }
      u -= d;
    }
    if (!placed) { const last = pts[pts.length - 1]!; out.push([last[0], last[1], 0]); }
  }
  return out;
}

/** A 0..1 pulse that rises and falls once per `period` seconds, offset by `phase` (0..1). */
export function pulse(t: number, period: number, phase = 0): number {
  const a = frac(t / period + phase);
  return smooth01(a / 0.2) * (1 - smooth01((a - 0.6) / 0.4));
}
