import {useEffect, useRef} from 'react';
import type {BackdropController} from '~/lib/backdrop/runtime';
import type {Quality} from '~/lib/backdrop/types';

/**
 * Full-page 3D backdrop (Pöcc-style): one fixed canvas behind the page whose objects arrange into a
 * motif per `[data-motif]` section and blend between them as you scroll. Engine and runtime are ported
 * from smallbiz-platform; the theme is `~/lib/backdrop/theme`.
 *
 * Nothing heavy ships with the page: after the first paint and an idle moment the browser checks
 * reduced motion, Save-Data and WebGL, waits for the visitor's first interaction (mouse move, scroll,
 * touch, key; lab tests never interact), and only then loads three.js in its own chunk. Disposed when
 * the route unmounts.
 */
export function Backdrop() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || !prefsAllow()) return;

    let ctl: BackdropController | null = null;
    let stopped = false;
    let pending = false;
    const undo: Array<() => void> = [];

    const start = () => {
      if (stopped || ctl || pending) return;
      pending = true;
      afterFirstPaintIdle(undo, () =>
        firstInteraction(undo, () => {
          if (stopped || !prefsAllow() || !hasWebGL()) {
            pending = false;
            return;
          }
          import('~/lib/backdrop/runtime')
            .then(({startBackdrop}) => startBackdrop(root, pickQuality()))
            .then(
              (c) => {
                pending = false;
                if (stopped) c?.dispose();
                else ctl = c;
              },
              () => {
                // decorative only: a failed chunk load leaves the page as it is
                pending = false;
              },
            );
        }),
      );
    };

    // the runtime disposes itself on pagehide; start again after a back/forward cache restore
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      ctl = null;
      start();
    };
    window.addEventListener('pageshow', onPageShow);
    start();

    return () => {
      stopped = true;
      window.removeEventListener('pageshow', onPageShow);
      undo.forEach((fn) => fn());
      ctl?.dispose();
    };
  }, []);

  return <div ref={ref} className="ars-backdrop" aria-hidden="true" />;
}

function prefsAllow() {
  const nav = navigator as Navigator & {connection?: {saveData?: boolean}};
  return (
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    nav.connection?.saveData !== true
  );
}

/** True when a WebGL context can be created; the probe context is released straight away. */
function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Phones, touch-first and low-end devices get the lighter object pool. */
function pickQuality(): Quality {
  const nav = navigator as Navigator & {deviceMemory?: number};
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (window.innerWidth < 720 || coarse) return 'lite';
  if ((nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4) return 'lite';
  return 'full';
}

/** After the first paint, then when the main thread is idle (with a timeout so it always happens). */
function afterFirstPaintIdle(undo: Array<() => void>, cb: () => void) {
  let cancelled = false;
  undo.push(() => {
    cancelled = true;
  });
  const run = () => {
    if (!cancelled) cb();
  };
  const idle = () => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(run, {timeout: 2500});
    } else window.setTimeout(run, 200);
  };
  const paint = () => window.requestAnimationFrame(() => window.setTimeout(idle, 0));
  if (document.readyState === 'complete') paint();
  else {
    window.addEventListener('load', paint, {once: true});
    undo.push(() => window.removeEventListener('load', paint));
  }
}

const INTERACTIONS = ['pointermove', 'pointerdown', 'scroll', 'wheel', 'touchstart', 'keydown'] as const;

/** Calls `cb` once, on the visitor's first mouse move / press / scroll / wheel / touch / key. */
function firstInteraction(undo: Array<() => void>, cb: () => void) {
  const remove = () => {
    for (const type of INTERACTIONS) window.removeEventListener(type, go, true);
  };
  const go = () => {
    remove();
    cb();
  };
  for (const type of INTERACTIONS) {
    window.addEventListener(type, go, {capture: true, passive: true});
  }
  undo.push(remove);
}
