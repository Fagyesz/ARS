// Ported from smallbiz-platform (packages/ui/src/backdrop/types.ts), the Pöcc-style full-page backdrop.
// Theme API of the full-page 3D backdrop. Pure data + pure functions: nothing here imports three, so a
// theme module can be unit-tested in jsdom and never drags three.js into the page's initial JavaScript.

/** Procedural shapes the runtime knows how to build. Every geometry is normalised so its largest side is 1. */
export type ShapeSpec =
  /** Rounded box (chips, tiles, cards). `size` is [w, h, d] (largest is scaled to 1), `radius` relative to that. */
  | { shape: "box"; size: readonly [number, number, number]; radius: number }
  /** Flat disc facing the camera (coins, plates). `depth` relative to the diameter. */
  | { shape: "disc"; depth: number }
  /** Torus facing the camera. `tube` relative to the outer diameter. */
  | { shape: "ring"; tube: number }
  /** Capsule lying along x. `ratio` = diameter / length. */
  | { shape: "capsule"; ratio: number }
  | { shape: "sphere" }
  /** Flat T-shirt silhouette facing the camera. `depth` relative to the width. */
  | { shape: "tee"; depth: number };

/** One instanced mesh = one draw call. `count.lite` is used on phones and low-end devices. */
export interface KindSpec {
  name: string;
  shape: ShapeSpec;
  count: { full: number; lite: number };
}

/**
 * Where one instance wants to be. Screen-space on purpose: x / y are CSS pixels of the viewport
 * (0,0 = top left, y down), so motifs are laid out against the page the visitor sees.
 */
export interface Target {
  x: number;
  y: number;
  /** Depth in world units: 0 is the screen plane, negative is further away (about -12 .. 2). */
  z: number;
  /** Euler rotation in radians. */
  rx?: number;
  ry?: number;
  rz?: number;
  /** Size of the largest side in CSS px at z = 0. */
  s: number;
  /** Optional per-axis stretch on top of `s` (1 = the kind's own proportions). */
  sx?: number;
  sy?: number;
  sz?: number;
  /** Palette key. */
  color: string;
  /** 0 = full colour, 1 = melted into the background behind it. Depth adds its own fade on top. */
  fade?: number;
  /** 0..1; 0 shrinks the instance away and melts it into the background (nothing ever pops). Default 1. */
  visible?: number;
}

/** Read-only frame context handed to every motif call (one object, reused: do not keep a reference). */
export interface MotifContext {
  /** Name of the kind being placed. */
  kind: string;
  /** Running time in seconds (paused time excluded). */
  t: number;
  /** Viewport size in CSS px. */
  w: number;
  h: number;
  /** Phone or low-end device: fewer instances, keep motifs simple. */
  lite: boolean;
  /** Viewport at least 1100 px wide. */
  wide: boolean;
  /** Horizontal extent of the page's content column in viewport px. */
  colLeft: number;
  colRight: number;
  /**
   * Viewport px of the section that owns the motif being evaluated (the one nearest the focus line), so a
   * motif can sit beside that section's heading and scroll with it. NaN for "drift" or when it is off screen.
   */
  secTop: number;
  secBottom: number;
  /** Stable pseudo-random number in [0, 1) for (instance, slot); same seed → same value. */
  rand(i: number, slot: number): number;
}

/** Places instance `i` of `n` (of `ctx.kind`). Return null to let the instance fall back to the "drift" motif. */
export type MotifFn = (i: number, n: number, ctx: MotifContext) => Target | null;

export interface BackdropTheme {
  /** CSS custom properties the colours come from: key -> [property, fallback #rrggbb]. */
  palette: Record<string, readonly [string, string]>;
  kinds: readonly KindSpec[];
  /** Keyed by the `data-motif` value of a section. Must contain "drift" (pages without motif sections). */
  motifs: Record<string, MotifFn> & { drift: MotifFn };
  /** Clicks on these elements send a soft burst through the objects. Default: "a.btn, button, summary". */
  burstSelector?: string;
  /** Selector of the content column (its left/right edges feed `ctx.colLeft/colRight`). Default ".container". */
  columnSelector?: string;
}

/** Phones, touch-first and low-end devices get the lighter pool. */
export type Quality = "full" | "lite";
