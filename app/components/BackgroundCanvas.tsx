import {useEffect, useRef} from 'react';
import type {SceneKind} from '~/lib/bg-scenes';

/**
 * Decorative three.js background for the dark page headers (home hero, about,
 * artists). Nothing is rendered on the server and three.js is only fetched
 * once the browser is idle, so it never delays the first paint. Visitors who
 * ask for reduced motion, or whose browser has no WebGL, keep the plain
 * background.
 */
export function BackgroundCanvas({
  scene,
  className = '',
}: {
  scene: SceneKind;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!hasWebGL()) return;

    let dispose: (() => void) | undefined;
    let cancelled = false;
    const start = () => {
      import('~/lib/bg-scenes')
        .then(({mountScene}) => {
          if (!cancelled) dispose = mountScene(el, scene);
        })
        .catch(() => {
          // decorative only: a failed chunk load leaves the plain background
        });
    };
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, {timeout: 2000})
      : window.setTimeout(start, 300);

    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      dispose?.();
    };
  }, [scene]);

  return <div ref={ref} className={`bg-canvas ${className}`} aria-hidden="true" />;
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2');
  } catch {
    return false;
  }
}
