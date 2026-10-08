// Ported from smallbiz-platform (packages/ui/src/backdrop/engine.ts), the Pöcc-style full-page backdrop.
// The backdrop's simulation, without three.js: blends the motif targets of every instance by the current
// scroll weights, adds idle drift, transition swirl and burst impulses, and follows the result with
// critically damped springs. The runtime turns the output into instance matrices and colours.
import { bgAt, clamp, depthFade, hash01, lerp, smooth01, springStep, type BgBand, type Weight } from "./math";
import type { BackdropTheme, KindSpec, MotifContext, Target } from "./types";

/** Spring channels per instance. */
export const CH = 11;
export const C = { X: 0, Y: 1, Z: 2, RX: 3, RY: 4, RZ: 5, SX: 6, SY: 7, SZ: 8, FADE: 9, VIS: 10 } as const;

export type RGB = readonly [number, number, number];

export interface FrameInput {
  t: number;
  dt: number;
  w: number;
  h: number;
  colLeft: number;
  colRight: number;
  weights: readonly Weight[];
  /** 0..1, how fast the visitor is scrolling (adds a little life). */
  energy: number;
  bands: readonly BgBand[];
  page: RGB;
  /** Viewport box of the section that owns each motif (see MotifContext.secTop). */
  owners?: ReadonlyMap<string, { top: number; bottom: number }>;
}

export interface KindState {
  spec: KindSpec;
  n: number;
  pos: Float32Array;
  vel: Float32Array;
  /** Final colour per instance (already melted into the background), linear RGB. */
  rgb: Float32Array;
  /** Blended palette colour per instance before the background melt (followed smoothly). */
  base: Float32Array;
  /** Burst impulse offset and velocity in px: ox, oy, vx, vy, spin, spinVel. */
  imp: Float32Array;
}

const OMEGA = { pos: 3.2, rot: 3.0, scale: 3.4, fade: 2.6 };
const IMP = 6;

export interface Engine {
  kinds: KindState[];
  step(input: FrameInput): void;
  /** Pushes everything away from a viewport point (px). */
  burst(x: number, y: number, strength?: number): void;
  /** True while bursts are still settling (the runtime keeps full frame rate then). */
  busy(): boolean;
}

export function createEngine(theme: BackdropTheme, lite: boolean, colors: Record<string, RGB>, seed = 7): Engine {
  const kinds: KindState[] = theme.kinds.map((spec) => {
    const n = Math.max(0, Math.floor(lite ? spec.count.lite : spec.count.full));
    return {
      spec,
      n,
      pos: new Float32Array(n * CH),
      vel: new Float32Array(n * CH),
      rgb: new Float32Array(n * 3),
      base: new Float32Array(n * 3),
      imp: new Float32Array(n * 6),
    };
  });

  let kindIndex = 0;
  const ctx: MotifContext = {
    kind: "",
    t: 0, w: 1, h: 1, lite, wide: false, colLeft: 0, colRight: 1, secTop: NaN, secBottom: NaN,
    rand: (i, slot) => hash01(seed, kindIndex, i, slot),
  };
  const fallback: RGB = colors[Object.keys(colors)[0] ?? ""] ?? [0.5, 0.5, 0.5];
  const acc = new Float32Array(CH + 3);
  const bg: [number, number, number] = [1, 1, 1];
  let started = false;
  let kickLeft = 0;

  /** Share of the current blend that came from the ambient "drift" (dark bands calm that part down). */
  let ambient = 0;
  let owners: FrameInput["owners"];
  const evalMotif = (name: string, i: number, n: number): [Target, boolean] => {
    const fn = theme.motifs[name];
    const box = owners?.get(name);
    ctx.secTop = box ? box.top : NaN;
    ctx.secBottom = box ? box.bottom : NaN;
    const o = name === "drift" || !fn ? null : fn(i, n, ctx);
    return o ? [o, false] : [theme.motifs.drift(i, n, ctx)!, true];
  };

  /** Weighted blend of every active motif's target for one instance into `acc`. */
  function blend(i: number, n: number, weights: readonly Weight[]): void {
    acc.fill(0);
    ambient = 0;
    for (const { motif, w } of weights) {
      const [o, isAmbient] = evalMotif(motif, i, n);
      if (isAmbient) ambient += w;
      const c = colors[o.color] ?? fallback;
      const s = Math.max(0, o.s);
      const vals = [o.x, o.y, o.z, o.rx ?? 0, o.ry ?? 0, o.rz ?? 0, s * (o.sx ?? 1), s * (o.sy ?? 1), s * (o.sz ?? 1),
        clamp(o.fade ?? 0, 0, 1), clamp(o.visible ?? 1, 0, 1), c[0], c[1], c[2]];
      for (let j = 0; j < vals.length; j++) acc[j] = (acc[j] ?? 0) + (Number.isFinite(vals[j]) ? vals[j]! : 0) * w;
    }
  }

  function step(input: FrameInput): void {
    const dt = clamp(Number.isFinite(input.dt) ? input.dt : 0, 0, 1 / 20);
    ctx.t = input.t; ctx.w = input.w; ctx.h = input.h; ctx.wide = input.w >= 1100;
    ctx.colLeft = input.colLeft; ctx.colRight = input.colRight;
    owners = input.owners;
    const weights = input.weights.length ? input.weights : [{ motif: "drift", w: 1 }];
    const wMax = weights[0]?.w ?? 1;
    const swirl = smooth01(2 * (1 - wMax));
    const live = clamp(swirl + input.energy, 0, 1);
    const wob = 3 + 14 * live;
    const colourK = started ? 1 - Math.exp(-3 * dt) : 1;
    const impDamp = Math.exp(-0.8 * dt);
    kickLeft = Math.max(0, kickLeft - dt);

    kinds.forEach((k, ki) => {
      kindIndex = ki;
      ctx.kind = k.spec.name;
      const { n, pos, vel, rgb, base, imp } = k;
      for (let i = 0; i < n; i++) {
        blend(i, n, weights);
        const r0 = ctx.rand(i, 90), r1 = ctx.rand(i, 91), r2 = ctx.rand(i, 92);
        const ph = r0 * 6.283;
        const t = input.t;
        // burst impulse: an under-damped spring back to the motif (a soft, organic bounce)
        const b = i * 6;
        imp[b + 2]! += (-IMP * imp[b]! - 2.6 * imp[b + 2]!) * dt;
        imp[b + 3]! += (-IMP * imp[b + 1]! - 2.6 * imp[b + 3]!) * dt;
        imp[b]! += imp[b + 2]! * dt;
        imp[b + 1]! += imp[b + 3]! * dt;
        imp[b + 4]! = (imp[b + 4]! + imp[b + 5]! * dt) * impDamp;
        imp[b + 5]! *= Math.exp(-2.2 * dt);

        const tx = acc[C.X]! + swirl * 70 * Math.cos(ph) + Math.sin(t * (0.5 + r1 * 0.4) + ph) * wob;
        const ty = acc[C.Y]! + swirl * 55 * Math.sin(ph) + Math.cos(t * (0.45 + r2 * 0.4) + ph) * wob;
        const tz = acc[C.Z]! + swirl * (r2 - 0.5) * 2;
        const trx = acc[C.RX]! + swirl * (r0 - 0.5) * 0.9;
        const try_ = acc[C.RY]! + swirl * (r1 - 0.5) * 0.9;
        const trz = acc[C.RZ]! + live * 0.08 * Math.sin(t * 1.3 + ph);
        const o = i * CH;
        if (!started) {
          pos[o + C.X] = tx; pos[o + C.Y] = ty; pos[o + C.Z] = tz;
          pos[o + C.RX] = trx; pos[o + C.RY] = try_; pos[o + C.RZ] = trz;
          pos[o + C.SX] = acc[C.SX]!; pos[o + C.SY] = acc[C.SY]!; pos[o + C.SZ] = acc[C.SZ]!;
          pos[o + C.FADE] = acc[C.FADE]!;
          pos[o + C.VIS] = 0; // fade in from nothing
        }
        springStep(pos, vel, o + C.X, tx, OMEGA.pos, dt);
        springStep(pos, vel, o + C.Y, ty, OMEGA.pos, dt);
        springStep(pos, vel, o + C.Z, tz, OMEGA.pos, dt);
        springStep(pos, vel, o + C.RX, trx, OMEGA.rot, dt);
        springStep(pos, vel, o + C.RY, try_, OMEGA.rot, dt);
        springStep(pos, vel, o + C.RZ, trz, OMEGA.rot, dt);
        springStep(pos, vel, o + C.SX, acc[C.SX]!, OMEGA.scale, dt);
        springStep(pos, vel, o + C.SY, acc[C.SY]!, OMEGA.scale, dt);
        springStep(pos, vel, o + C.SZ, acc[C.SZ]!, OMEGA.scale, dt);
        springStep(pos, vel, o + C.FADE, acc[C.FADE]!, OMEGA.fade, dt);
        springStep(pos, vel, o + C.VIS, acc[C.VIS]!, OMEGA.fade, dt);

        const c = i * 3;
        for (let j = 0; j < 3; j++) base[c + j] = lerp(base[c + j]!, acc[CH + j]!, colourK);
        // melt into whatever background sits behind the instance on screen (paper, mist or a dark band)
        bgAt(pos[o + C.Y]! + imp[b + 1]!, input.bands, input.page, bg);
        const vis = clamp(pos[o + C.VIS]!, 0, 1);
        const dark = 1 - smooth01((0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]) / 0.25);
        const fade = 1 - (1 - clamp(pos[o + C.FADE]! + depthFade(pos[o + C.Z]!) + dark * ambient * 0.5, 0, 0.97)) * vis;
        for (let j = 0; j < 3; j++) rgb[c + j] = lerp(base[c + j]!, bg[j]!, fade);
      }
    });
    started = true;
  }

  function burst(x: number, y: number, strength = 1): void {
    kickLeft = 2.5;
    for (const k of kinds) {
      for (let i = 0; i < k.n; i++) {
        const o = i * CH, b = i * 6;
        const dx = (k.pos[o + C.X] ?? 0) - x, dy = (k.pos[o + C.Y] ?? 0) - y;
        const d = Math.hypot(dx, dy) + 1;
        const push = (420 * strength) / (1 + d / 260);
        k.imp[b + 2]! += (dx / d) * push;
        k.imp[b + 3]! += (dy / d) * push;
        k.imp[b + 5]! += (hash01(3, i, Math.round(x)) - 0.5) * 4 * strength;
      }
    }
  }

  return { kinds, step, burst, busy: () => kickLeft > 0 };
}

/** Reads the final screen-space state of instance `i` (for the runtime and tests). */
export function readInstance(k: KindState, i: number) {
  const o = i * CH, b = i * 6;
  const vis = clamp(k.pos[o + C.VIS] ?? 0, 0, 1);
  const shrink = vis < 0.02 ? 0 : 0.3 + 0.7 * vis;
  return {
    x: (k.pos[o + C.X] ?? 0) + (k.imp[b] ?? 0),
    y: (k.pos[o + C.Y] ?? 0) + (k.imp[b + 1] ?? 0),
    z: k.pos[o + C.Z] ?? 0,
    rx: k.pos[o + C.RX] ?? 0,
    ry: (k.pos[o + C.RY] ?? 0) + (k.imp[b + 4] ?? 0),
    rz: k.pos[o + C.RZ] ?? 0,
    sx: Math.max(0, k.pos[o + C.SX] ?? 0) * shrink,
    sy: Math.max(0, k.pos[o + C.SY] ?? 0) * shrink,
    sz: Math.max(0, k.pos[o + C.SZ] ?? 0) * shrink,
  };
}
