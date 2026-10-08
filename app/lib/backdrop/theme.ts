// Ars Mosoris backdrop theme: T-shirts, lino blocks, ink rollers and halftone dots in the brand palette.
// Motif names match the `data-motif` attributes on the home page and the artists page. Kept calm on
// purpose: few objects, slow movement, everything melts back into the band behind it.
import { clamp, frac, smooth01 } from "./math";
import type { BackdropTheme, MotifContext, MotifFn, Target } from "./types";
import { at, drift, pulse, stageZone, type Zone } from "./helpers";

export const palette = {
  cream: ["--color-ars-cream", "#F7EAD7"],
  creamDark: ["--color-ars-cream-dark", "#EDD9BC"],
  sand: ["--color-ars-gray-dark", "#D9C9A8"],
  red: ["--color-ars-red", "#C43F27"],
  dark: ["--color-ars-dark", "#231F20"],
  olive: ["--color-ars-olive", "#475223"],
  sage: ["--color-ars-sage", "#BABD92"],
} as const satisfies Record<string, readonly [string, string]>;

export const kinds = [
  { name: "tee", shape: { shape: "tee", depth: 0.07 }, count: { full: 22, lite: 10 } },
  // lino blocks, paper sheets and folded tees
  { name: "block", shape: { shape: "box", size: [1, 0.7, 0.09], radius: 0.03 }, count: { full: 14, lite: 8 } },
  // the ink roller (brayer)
  { name: "roller", shape: { shape: "capsule", ratio: 0.28 }, count: { full: 2, lite: 1 } },
  // halftone dots, rope knots
  { name: "dot", shape: { shape: "disc", depth: 0.18 }, count: { full: 60, lite: 30 } },
  // clothes pegs
  { name: "peg", shape: { shape: "box", size: [1, 0.3, 0.22], radius: 0.08 }, count: { full: 10, lite: 6 } },
] as const satisfies BackdropTheme["kinds"];

/** Sparse ambient drift; `calm` for sections full of text and products. */
function ambient(i: number, ctx: MotifContext, calm = false): Target {
  const energy = calm ? 0.45 : 0.7;
  const fade = calm ? 0.5 : 0.4;
  switch (ctx.kind) {
    case "tee":
      return drift(i, ctx, { color: "sand", accent: "red", accentEvery: 5, size: [34, 58], density: calm ? 0.22 : 0.32, fade, energy });
    case "block":
      return drift(i, ctx, { color: "sand", accent: "sage", accentEvery: 3, size: [28, 46], density: calm ? 0.14 : 0.2, fade, energy });
    case "dot":
      return drift(i, ctx, { color: "sand", accent: "red", accentEvery: 6, size: [6, 11], density: calm ? 0.3 : 0.4, fade, energy });
    default:
      return drift(i, ctx, { color: "sand", size: [20, 30], density: 0, fade, energy });
  }
}

/* ── clothesline (home hero, artists header) ─────────────────────────────── */

const LINE_COLORS = ["cream", "red", "sage", "creamDark", "red"] as const;

/** The rope: from x0 to x1, sagging in the middle. Wide screens keep it right of the headline. */
function rope(ctx: MotifContext) {
  const { w, h } = ctx;
  if (w >= 1100) return { x0: w * 0.5, x1: w * 0.99, y: h * 0.2, sag: h * 0.08, z: -0.6, tee: clamp(h * 0.15, 84, 124) };
  if (w >= 720) return { x0: w * 0.46, x1: w * 1.03, y: h * 0.16, sag: h * 0.06, z: -1.2, tee: clamp(h * 0.14, 76, 112) };
  return { x0: -w * 0.06, x1: w * 1.06, y: h * 0.1, sag: h * 0.04, z: -2.8, tee: 92 };
}

function clothesline(count: { full: number; lite: number }): MotifFn {
  return (i, _n, ctx) => {
    const r = rope(ctx);
    const t = ctx.t;
    const sway = Math.sin(t * 0.35) * 5;
    const ropeAt = (u: number): [number, number] => [r.x0 + (r.x1 - r.x0) * u, r.y + r.sag * 4 * u * (1 - u) + sway * Math.sin(u * Math.PI)];
    const m = ctx.lite ? count.lite : count.full;
    const slot = (k: number) => (k + 0.6) / (m + 0.2);

    if (ctx.kind === "tee") {
      if (i >= m) return null;
      const [x, y] = ropeAt(slot(i));
      const s = r.tee * (0.92 + ctx.rand(i, 1) * 0.16);
      const ph = i * 1.7;
      return {
        x: x + Math.sin(t * 0.6 + ph) * 3,
        y: y + s * 0.47,
        z: r.z,
        rx: 0.05,
        ry: Math.sin(t * 0.3 + ph) * 0.32,
        rz: Math.sin(t * 0.55 + ph) * 0.05,
        s,
        color: LINE_COLORS[i % LINE_COLORS.length]!,
        fade: 0.08,
      };
    }
    if (ctx.kind === "peg") {
      if (i >= m * 2) return null;
      const k = Math.floor(i / 2);
      const side = i % 2 ? 1 : -1;
      const u = slot(k) + (side * 0.3 * r.tee) / Math.max(1, r.x1 - r.x0);
      const [x, y] = ropeAt(u);
      return { x, y: y + 4, z: r.z + 0.1, rz: Math.PI / 2 + side * 0.12, s: r.tee * 0.17, color: "sand", fade: 0.1 };
    }
    if (ctx.kind === "dot") {
      const knots = ctx.lite ? 18 : 30;
      if (i >= knots) return null;
      const [x, y] = ropeAt(i / (knots - 1));
      return { x, y, z: r.z - 0.05, s: 4.5, color: "sand", fade: 0.3 };
    }
    return null;
  };
}

/* ── section headings: motifs that flank a centred heading and scroll with it ── */

/**
 * Two zones left and right of a centred section heading (desktop and tablet only; on phones the heading
 * takes the width and the section falls back to the ambient drift). Null when the section is off screen.
 */
function besideHeading(ctx: MotifContext): { left: Zone; right: Zone } | null {
  if (!Number.isFinite(ctx.secTop) || ctx.w < 900) return null;
  const pad = ctx.w >= 768 ? 96 : 64;
  const cy = ctx.secTop + pad + 26;
  const off = clamp(ctx.w * 0.3, 330, 520);
  const R = clamp(ctx.w * 0.06, 58, 84);
  return {
    left: { cx: ctx.w / 2 - off, cy, R, z: 0 },
    right: { cx: ctx.w / 2 + off, cy, R, z: 0 },
  };
}

/**
 * Print studio (home collections band): left of the heading a lino block with the ink roller going
 * back and forth over it, right of it a sheet where the halftone print builds up row by row.
 */
const print: MotifFn = (i, _n, ctx) => {
  const zones = besideHeading(ctx);
  if (!zones) return null;
  const {left, right} = zones;
  const t = ctx.t;
  const tilt = -0.55;
  if (ctx.kind === "block") {
    if (i === 0) return at(left, 0, 0, -0.2, 1.7, "olive", { rx: tilt, rz: -0.08, fade: 0.05 });
    if (i === 1) return at(right, 0, 0, -0.3, 1.8, "cream", { rx: tilt, rz: 0.06, sz: 0.25, fade: 0.1 });
    return null;
  }
  if (ctx.kind === "roller") {
    if (i > 0) return null;
    // lies across the block and rolls up and down over it
    return at(left, 0.04, Math.sin(t * 0.7) * 0.32, 0.45, 1.25, "red", { rz: 0.05, rx: tilt, fade: 0.04 });
  }
  if (ctx.kind === "dot") {
    const cols = ctx.lite ? 5 : 7;
    const rows = ctx.lite ? 4 : 5;
    if (i >= cols * rows) return null;
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    // the print builds up over the cycle, then lifts away before the next pull
    const cycle = frac(t / 12);
    const shown = smooth01((cycle * 1.5 - cy / rows) * 4) * (1 - smooth01((cycle - 0.88) / 0.1));
    const du = (cx - (cols - 1) / 2) / (cols - 1);
    const dv = (cy - (rows - 1) / 2) / (rows - 1);
    const tone = 1 - Math.min(1, Math.hypot(du, dv) * 1.3);
    return at(right, du * 1.3, -dv * 0.5, 0.05, 0.08 + 0.12 * tone, "red", { rx: tilt, fade: 0.06, visible: shown });
  }
  return null;
};

/* ── artists band (home): one tee per artist, two each side of the heading, turning slowly ── */

const ARTIST_COLORS = ["red", "olive", "sage", "dark"] as const;

const artists: MotifFn = (i, _n, ctx) => {
  if (ctx.kind !== "tee" || i >= 4) return null;
  const zones = besideHeading(ctx);
  if (!zones) return null;
  const side = i % 2 ? zones.right : zones.left;
  const outer = i >= 2;
  const dir = i % 2 ? 1 : -1;
  return at(side, (outer ? 1.45 : 0) * dir, (outer ? -0.3 : 0.12) + Math.sin(ctx.t * 0.5 + i) * 0.06, -0.2, outer ? 0.9 : 1.1, ARTIST_COLORS[i]!, {
    rx: 0.06,
    ry: ctx.t * 0.35 + i * 1.6,
    fade: 0.1,
  });
};

/* ── folded stack (newsletter band) ──────────────────────────────────────── */

const STACK_COLORS = ["cream", "dark", "sage", "creamDark", "cream"] as const;

const stack: MotifFn = (i, _n, ctx) => {
  const z0 = stageZone(ctx);
  const z = ctx.w >= 1100 ? { ...z0, cx: ctx.w * 0.82, R: z0.R * 0.62 } : { ...z0, R: z0.R * 0.55, z: z0.z - 1.5 };
  const t = ctx.t;
  if (ctx.kind === "block") {
    const m = ctx.lite ? 4 : 5;
    if (i >= m) return null;
    const lift = i === m - 1 ? pulse(t, 8) * 0.22 : 0;
    return at(z, 0.02 * Math.sin(i * 2.1), -0.55 + i * 0.16 + lift, 0, 1, STACK_COLORS[i]!, {
      rx: -1.15,
      rz: (ctx.rand(i, 3) - 0.5) * 0.12,
      sz: 1.6,
      fade: 0.06,
    });
  }
  if (ctx.kind === "tee") {
    if (i > 0) return null;
    return at(z, 0.05, 0.62 + Math.sin(t * 0.5) * 0.05, 0.3, 0.85, "cream", { ry: Math.sin(t * 0.4) * 0.45, rz: 0.05, fade: 0.05 });
  }
  return null;
};

export const theme: BackdropTheme = {
  palette,
  kinds,
  motifs: {
    drift: (i, _n, ctx) => ambient(i, ctx),
    calm: (i, _n, ctx) => ambient(i, ctx, true),
    line: clothesline({ full: 5, lite: 3 }),
    "artists-line": clothesline({ full: 4, lite: 3 }),
    print,
    artists,
    stack,
  },
  burstSelector: "a.btn, button.btn, .newsletter-btn",
  columnSelector: ".container",
};
