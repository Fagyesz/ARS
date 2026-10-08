// Ported from smallbiz-platform (packages/ui/src/backdrop/runtime.ts), the Pöcc-style full-page backdrop.
/**
 * Backdrop runtime: lazy chunk (three.js is bundled with it, served from the site itself). Owns ONE fixed
 * canvas behind the whole page, one instanced mesh per object kind (one draw call each), and the frame loop:
 * full rate while something moves, ~30 fps when idle, stopped while the tab is hidden; disposed on pagehide,
 * a lost WebGL context, or when reduced motion is switched on.
 */
import {
  BufferGeometry,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  DynamicDrawUsage,
  Euler,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  PerspectiveCamera,
  Quaternion,
  Scene,
  ShaderMaterial,
  Shape,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createEngine, readInstance, type RGB } from "./engine";
import { clamp, zoneWeights, type BgBand, type SectionBox } from "./math";
import { theme } from "./theme";
import type { Quality, ShapeSpec } from "./types";

export interface BackdropController { dispose(): void }

/** CSS px per world unit on the z = 0 plane. */
const PX = 100;
const FOV = 35;
const TAN = Math.tan((FOV / 2) * (Math.PI / 180));
const MAX_DT = 1 / 20;
const IDLE_FPS = 30;
/**
 * ARS sections are taller than the screen and their motifs sit beside the heading, so a section takes over
 * once its heading is in the lower part of the viewport: focus line at 70 %, blend over 40 %.
 */
const FOCUS = 0.7;
const BLEND = 0.4;

const nextTask = () => new Promise<void>((r) => setTimeout(r, 0));

export function pixelRatioFor(win: Window = window): number {
  return Math.min(win.devicePixelRatio || 1, win.innerWidth < 720 ? 1.5 : 2);
}

/** Procedural geometry, normalised so the largest side is 1 and the face looks at the camera (+z). */
export function buildGeometry(spec: ShapeSpec, lite: boolean): BufferGeometry {
  switch (spec.shape) {
    case "box": {
      const m = Math.max(...spec.size);
      const [w, h, d] = spec.size.map((v) => v / m) as [number, number, number];
      return new RoundedBoxGeometry(w, h, d, lite ? 2 : 3, Math.min(spec.radius, d / 2 - 1e-3, Math.min(w, h) / 2));
    }
    case "disc": {
      const g = new CylinderGeometry(0.5, 0.5, spec.depth, lite ? 24 : 40);
      g.rotateX(Math.PI / 2);
      return g;
    }
    case "ring":
      return new TorusGeometry(0.5 - spec.tube / 2, spec.tube / 2, lite ? 6 : 10, lite ? 48 : 80);
    case "tee":
      return teeGeometry(spec.depth, lite);
    case "capsule": {
      const r = spec.ratio / 2;
      const g = new CapsuleGeometry(r, Math.max(0, 1 - 2 * r), lite ? 3 : 4, lite ? 10 : 16);
      g.rotateZ(Math.PI / 2);
      return g;
    }
    default:
      return new IcosahedronGeometry(0.5, lite ? 1 : 2);
  }
}

/** Extruded T-shirt outline (front view), centred, width 1. */
function teeGeometry(depth: number, lite: boolean): BufferGeometry {
  const s = new Shape();
  s.moveTo(-0.15, 0.47);
  s.quadraticCurveTo(0, 0.34, 0.15, 0.47); // neckline
  s.lineTo(0.33, 0.43); // shoulder
  s.lineTo(0.5, 0.22); // sleeve
  s.lineTo(0.39, 0.12);
  s.lineTo(0.3, 0.2); // armpit
  s.lineTo(0.31, -0.47); // side seam to hem
  s.quadraticCurveTo(0, -0.5, -0.31, -0.47);
  s.lineTo(-0.3, 0.2);
  s.lineTo(-0.39, 0.12);
  s.lineTo(-0.5, 0.22);
  s.lineTo(-0.33, 0.43);
  s.closePath();
  const bevel = depth * 0.25;
  const g = new ExtrudeGeometry(s, {
    depth: Math.max(0.005, depth - 2 * bevel),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: lite ? 1 : 2,
    curveSegments: lite ? 4 : 8,
  });
  g.center();
  g.computeVertexNormals();
  return g;
}

// Unlit colour with a gentle normal-based shade: the camera-facing face shows exactly the instance colour
// (so an object melted into the background really disappears), edges and turned faces get light and shadow.
const VERT = /* glsl */ `
varying vec3 vColor;
varying vec3 vNormal;
void main() {
  vec4 p = vec4(position, 1.0);
  vec3 n = normal;
  #ifdef USE_INSTANCING
    p = instanceMatrix * p;
    n = mat3(instanceMatrix) * n;
  #endif
  vColor = vec3(1.0);
  #ifdef USE_INSTANCING_COLOR
    vColor = instanceColor;
  #endif
  vNormal = normalize(normalMatrix * n);
  gl_Position = projectionMatrix * modelViewMatrix * p;
}`;
const FRAG = /* glsl */ `
uniform vec3 uLight;
uniform float uShade;
varying vec3 vColor;
varying vec3 vNormal;
void main() {
  vec3 n = normalize(vNormal);
  float k = 1.0 + uShade * (dot(n, uLight) - uLight.z);
  gl_FragColor = vec4(vColor * clamp(k, 0.6, 1.25), 1.0);
  #include <colorspace_fragment>
}`;

function readRGB(style: CSSStyleDeclaration, prop: string, fallback: string, c: Color): RGB {
  try { c.setStyle(style.getPropertyValue(prop).trim() || fallback); } catch { c.setStyle(fallback); }
  return [c.r, c.g, c.b];
}

/**
 * Opaque background of an element as linear RGB, or null when it is (mostly) transparent. A section whose
 * colour is painted by a child below the layer (the home hero's gradient) names it in `data-motif-bg`.
 */
function backgroundOf(el: Element, c: Color): RGB | null {
  const named = el instanceof HTMLElement ? el.dataset.motifBg : undefined;
  if (named) {
    try { c.setStyle(named); return [c.r, c.g, c.b]; } catch { /* fall through to the computed colour */ }
  }
  const bg = getComputedStyle(el).backgroundColor;
  const m = /rgba?\(([^)]+)\)/.exec(bg);
  if (!m) return null;
  const parts = m[1]!.split(/[ ,/]+/).filter(Boolean).map(Number);
  if (parts.length >= 4 && (parts[3] ?? 1) < 0.5) return null;
  c.setRGB((parts[0] ?? 255) / 255, (parts[1] ?? 255) / 255, (parts[2] ?? 255) / 255, SRGBColorSpace);
  return [c.r, c.g, c.b];
}

export async function startBackdrop(root: HTMLElement, quality: Quality): Promise<BackdropController | null> {
  if (!root.isConnected) return null;
  const win = window;
  const doc = document;
  const html = doc.documentElement;
  const lite = quality === "lite";

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: (win.devicePixelRatio || 1) < 2, alpha: true, powerPreference: "low-power" });
  } catch {
    return null; // WebGL went away between the probe and now: the page stays as it is
  }
  renderer.debug.checkShaderErrors = false;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.setAttribute("role", "presentation");

  // palette and page background (linear RGB)
  const tmp = new Color();
  const style = getComputedStyle(root);
  const colors: Record<string, RGB> = {};
  for (const [key, [prop, fallback]] of Object.entries(theme.palette)) colors[key] = readRGB(style, prop, fallback, tmp);
  let page: RGB = backgroundOf(doc.body, tmp) ?? backgroundOf(html, tmp) ?? [1, 1, 1];

  const engine = createEngine(theme, lite, colors);
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.5, 80);
  const material = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: { uLight: { value: new Vector3(-0.32, 0.5, 0.8).normalize() }, uShade: { value: 0.34 } },
  });
  // Set-up is split into short tasks (one per kind, then an async shader compile) so starting the layer
  // never blocks the main thread for long.
  const meshes: InstancedMesh[] = [];
  for (const k of engine.kinds) {
    const mesh = new InstancedMesh(buildGeometry(k.spec.shape, lite), material, Math.max(1, k.n));
    mesh.count = k.n;
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.instanceColor = new InstancedBufferAttribute(k.rgb, 3);
    mesh.instanceColor.setUsage(DynamicDrawUsage);
    mesh.frustumCulled = false;
    scene.add(mesh);
    meshes.push(mesh);
    await nextTask();
  }

  // layout: viewport, content column, motif sections and background bands (document coordinates)
  let W = 1, H = 1, camZ = 14;
  let colL = 0, colR = 1;
  let sections: { top: number; bottom: number; motif: string; rgb: RGB | null }[] = [];
  const colSel = theme.columnSelector ?? ".container";
  const measure = () => {
    W = Math.max(1, root.clientWidth || win.innerWidth);
    H = Math.max(1, root.clientHeight || win.innerHeight);
    renderer.setPixelRatio(pixelRatioFor(win));
    renderer.setSize(W, H, false);
    camZ = H / 2 / PX / TAN;
    camera.aspect = W / H;
    camera.near = 0.5;
    camera.far = camZ + 40;
    camera.updateProjectionMatrix();
    const col = doc.querySelector(`main ${colSel}`) ?? doc.querySelector(colSel);
    const cr = col?.getBoundingClientRect();
    colL = cr ? cr.left : 0;
    colR = cr ? cr.right : W;
    const y0 = win.scrollY;
    page = backgroundOf(doc.body, tmp) ?? backgroundOf(html, tmp) ?? page;
    sections = [...doc.querySelectorAll<HTMLElement>("[data-motif]")].map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top + y0, bottom: r.bottom + y0, motif: el.dataset.motif || "drift", rgb: backgroundOf(el, tmp) };
    });
  };

  // per-frame inputs
  const boxes: SectionBox[] = [];
  const bands: BgBand[] = [];
  const owners = new Map<string, { top: number; bottom: number }>();
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let energy = 0, lastY = win.scrollY, t = 0;
  const m4 = new Matrix4(), q = new Quaternion(), eul = new Euler(), pos = new Vector3(), scl = new Vector3();

  const step = (dt: number) => {
    t += dt;
    const y = win.scrollY;
    const v = Math.abs(y - lastY) / Math.max(dt, 1e-3);
    lastY = y;
    energy += (clamp(v / 1800, 0, 1) - energy) * Math.min(1, dt * 3);
    boxes.length = 0;
    bands.length = 0;
    owners.clear();
    for (const s of sections) {
      const top = s.top - y, bottom = s.bottom - y;
      boxes.push({ top, bottom, motif: s.motif });
      // the section of each motif nearest the focus line owns it
      const f = H * FOCUS;
      const dist = Math.max(0, top - f, f - bottom);
      const prev = owners.get(s.motif);
      if (!prev || dist < Math.max(0, prev.top - f, f - prev.bottom)) owners.set(s.motif, { top, bottom });
      if (s.rgb && bottom > -200 && top < H + 200) bands.push({ top, bottom, rgb: s.rgb });
    }
    engine.step({ t, dt, w: W, h: H, colLeft: colL, colRight: colR, weights: zoneWeights(boxes, H, H * BLEND, H * FOCUS), energy, bands, page, owners });

    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 2);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 2);
    camera.position.set(pointer.x * 0.3, pointer.y * 0.18, camZ);
    camera.lookAt(pointer.x * 0.1, pointer.y * 0.06, 0);

    engine.kinds.forEach((k, ki) => {
      const mesh = meshes[ki]!;
      for (let i = 0; i < k.n; i++) {
        const o = readInstance(k, i);
        const d = (camZ - o.z) / camZ; // keep the screen position whatever the depth
        pos.set(((o.x - W / 2) / PX) * d, (-(o.y - H / 2) / PX) * d, o.z);
        q.setFromEuler(eul.set(o.rx, o.ry, o.rz));
        scl.set(Math.max(o.sx / PX, 1e-5), Math.max(o.sy / PX, 1e-5), Math.max(o.sz / PX, 1e-5));
        mesh.setMatrixAt(i, m4.compose(pos, q, scl));
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor!.needsUpdate = true;
    });
  };

  // loop
  const motion = typeof win.matchMedia === "function" ? win.matchMedia("(prefers-reduced-motion: reduce)") : null;
  let visible = !doc.hidden;
  let disposed = false;
  let raf = 0, lastFrame = 0, lastAct = performance.now();
  const poke = () => {
    lastAct = performance.now();
    kick();
  };
  const frame = (now: number) => {
    raf = 0;
    if (disposed || !visible) return;
    raf = win.requestAnimationFrame(frame);
    const idle = now - lastAct > 1500 && !engine.busy() && energy < 0.01;
    if (idle && now - lastFrame < 1000 / IDLE_FPS - 2) return;
    const dt = clamp((now - lastFrame) / 1000, 0, MAX_DT);
    lastFrame = Math.max(now, lastFrame);
    step(dt);
    renderer.render(scene, camera);
  };
  function kick() {
    if (raf || disposed || !visible) return;
    lastFrame = performance.now();
    raf = win.requestAnimationFrame(frame);
  }
  const halt = () => {
    if (raf) win.cancelAnimationFrame(raf);
    raf = 0;
  };

  // events
  let sizeQueued = false;
  const queueMeasure = () => {
    if (sizeQueued || disposed) return;
    sizeQueued = true;
    win.requestAnimationFrame(() => {
      sizeQueued = false;
      if (disposed) return;
      measure();
      poke();
    });
  };
  const onVisibility = () => {
    visible = !doc.hidden;
    if (visible) poke();
    else halt();
  };
  const onPointer = (e: PointerEvent) => {
    pointer.tx = clamp((e.clientX / Math.max(1, win.innerWidth)) * 2 - 1, -1, 1);
    pointer.ty = clamp(-((e.clientY / Math.max(1, win.innerHeight)) * 2 - 1), -1, 1);
    poke();
  };
  const burstSel = theme.burstSelector ?? "a.btn, button, summary";
  const onClick = (e: MouseEvent) => {
    const el = e.target instanceof Element ? e.target.closest(burstSel) : null;
    if (!el) return;
    engine.burst(e.clientX, e.clientY, 1);
    poke();
  };
  const onBurst = (e: Event) => {
    const d = (e as CustomEvent<{ x?: number; y?: number; strength?: number }>).detail ?? {};
    engine.burst(d.x ?? W / 2, d.y ?? H / 2, d.strength ?? 1);
    poke();
  };
  const onReducedMotion = (e: MediaQueryListEvent) => { if (e.matches) dispose(); };
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(queueMeasure) : null;

  function dispose() {
    if (disposed) return;
    disposed = true;
    halt();
    ro?.disconnect();
    win.removeEventListener("scroll", poke);
    win.removeEventListener("resize", queueMeasure);
    win.removeEventListener("pointermove", onPointer);
    win.removeEventListener("click", onClick, true);
    win.removeEventListener("ars:backdrop-burst", onBurst);
    win.removeEventListener("pagehide", dispose);
    doc.removeEventListener("visibilitychange", onVisibility);
    motion?.removeEventListener?.("change", onReducedMotion);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    html.classList.remove("ars-backdrop-on");
    root.classList.remove("on");
    for (const m of meshes) m.geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }
  function onContextLost(e: Event) {
    e.preventDefault();
    dispose();
  }

  try {
    measure();
    step(0);
    await renderer.compileAsync(scene, camera);
    await nextTask();
    if (disposed || !root.isConnected) { dispose(); return null; }
    renderer.render(scene, camera);
  } catch {
    dispose();
    return null;
  }
  root.appendChild(canvas);
  ro?.observe(doc.body);
  ro?.observe(root);
  win.addEventListener("scroll", poke, { passive: true });
  win.addEventListener("resize", queueMeasure, { passive: true });
  win.addEventListener("pointermove", onPointer, { passive: true });
  win.addEventListener("click", onClick, { capture: true, passive: true });
  win.addEventListener("ars:backdrop-burst", onBurst);
  win.addEventListener("pagehide", dispose);
  doc.addEventListener("visibilitychange", onVisibility);
  motion?.addEventListener?.("change", onReducedMotion);
  canvas.addEventListener("webglcontextlost", onContextLost);

  html.classList.add("ars-backdrop-on");
  // next frame, so the opacity transition actually runs
  win.requestAnimationFrame(() => { if (!disposed) root.classList.add("on"); });
  kick();
  return { dispose };
}
