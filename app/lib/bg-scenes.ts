import {
  Color,
  Mesh,
  NoBlending,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from 'three';

/**
 * Printmaking-themed header background, loaded on demand by BackgroundCanvas:
 * `ink` (about) draws slowly drifting linocut gouge lines over a speckled
 * ground, in the brand colours at low opacity, behind the text. (The home and
 * artists pages use the full-page backdrop in `~/lib/backdrop` instead.)
 */
export type SceneKind = 'ink';

const CREAM = new Color('#F7EAD7');
const RED = new Color('#C43F27');
const SAGE = new Color('#BABD92');

type SceneHandle = {
  scene: Scene;
  camera: OrthographicCamera;
  resize(width: number, height: number, dpr: number): void;
  update(time: number, dt: number, pointer: Pointer): void;
  dispose(): void;
};

type Pointer = {x: number; y: number; active: number};

export function mountScene(container: HTMLElement, _scene: SceneKind): () => void {
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: 'low-power',
    premultipliedAlpha: true,
  });
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  container.appendChild(canvas);

  const handle = inkScene();

  // pointer in CSS pixels, origin bottom-left of the container (GL convention)
  const pointer: Pointer = {x: -9999, y: -9999, active: 0};
  let pointerTarget = 0;
  const onPointerMove = (event: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = rect.height - (event.clientY - rect.top);
    const inside =
      pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height;
    pointerTarget = inside ? 1 : 0;
  };
  window.addEventListener('pointermove', onPointerMove, {passive: true});

  const resize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    // phones get 1x: the effect is soft anyway and the fill rate matters more
    const dpr = Math.min(window.devicePixelRatio || 1, width < 768 ? 1 : 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    handle.resize(width, height, dpr);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  // run only while the header is on screen and the tab is visible
  let onScreen = true;
  const intersection = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    schedule();
  });
  intersection.observe(container);
  const onVisibility = () => schedule();
  document.addEventListener('visibilitychange', onVisibility);

  let frame = 0;
  let last = performance.now();
  let elapsed = 0;
  let shown = false;
  const tick = (now: number) => {
    frame = 0;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;
    pointer.active += (pointerTarget - pointer.active) * Math.min(dt * 3, 1);
    handle.update(elapsed, dt, pointer);
    renderer.render(handle.scene, handle.camera);
    if (!shown) {
      shown = true;
      canvas.classList.add('is-visible');
    }
    schedule();
  };
  function schedule() {
    const running = onScreen && document.visibilityState === 'visible';
    if (running && !frame) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    } else if (!running && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }
  schedule();

  return () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    onScreen = false;
    window.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('visibilitychange', onVisibility);
    resizeObserver.disconnect();
    intersection.disconnect();
    handle.dispose();
    renderer.dispose();
    canvas.remove();
  };
}

/* ── shared GLSL ─────────────────────────────────────────────────────────── */

const NOISE_GLSL = /* glsl */ `
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float value = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amp * noise(p);
      p = p * 2.03 + vec2(17.1, 9.2);
      amp *= 0.5;
    }
    return value;
  }
`;

const FULLSCREEN_VERTEX = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/** A full-canvas quad driven by a fragment shader. */
function fullscreenScene(fragmentShader: string): SceneHandle {
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uTime: {value: 0},
    uRes: {value: new Vector2(1, 1)},
    uDpr: {value: 1},
    uMouse: {value: new Vector2(-9999, -9999)},
    uMouseOn: {value: 0},
    uCream: {value: CREAM},
    uRed: {value: RED},
    uSage: {value: SAGE},
  };
  const geometry = new PlaneGeometry(2, 2);
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: FULLSCREEN_VERTEX,
    fragmentShader,
    // the shader writes premultiplied colour straight into the cleared canvas
    blending: NoBlending,
    depthTest: false,
    depthWrite: false,
  });
  scene.add(new Mesh(geometry, material));

  return {
    scene,
    camera,
    resize(width, height, dpr) {
      uniforms.uRes.value.set(width * dpr, height * dpr);
      uniforms.uDpr.value = dpr;
    },
    update(time, _dt, pointer) {
      uniforms.uTime.value = time;
      uniforms.uMouse.value.set(pointer.x * uniforms.uDpr.value, pointer.y * uniforms.uDpr.value);
      uniforms.uMouseOn.value = pointer.active;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

/* ── ink / linocut lines (about) ─────────────────────────────────────────── */

function inkScene() {
  return fullscreenScene(/* glsl */ `
    uniform float uTime;
    uniform vec2 uRes;
    uniform float uDpr;
    uniform vec2 uMouse;
    uniform float uMouseOn;
    uniform vec3 uCream;
    uniform vec3 uRed;
    uniform vec3 uSage;
    ${NOISE_GLSL}

    void main() {
      vec2 uv = gl_FragCoord.xy / uRes.y;
      vec2 mouse = uMouse / uRes.y;
      float t = uTime * 0.035;

      // the cursor presses gently into the block
      vec2 away = uv - mouse;
      uv += normalize(away + 1e-5) * 0.05 * uMouseOn * exp(-length(away) * 7.0);

      // domain-warped field, carved into contour lines like gouge marks
      vec2 q = vec2(fbm(uv * 1.4 + t), fbm(uv * 1.4 + vec2(5.2, 1.3) - t));
      float field = fbm(uv * 1.1 + 1.6 * q + vec2(t * 0.6, 0.0));
      float bands = field * 16.0;
      float w = fwidth(bands);
      float edge = abs(fract(bands + 0.5) - 0.5);
      float line = 1.0 - smoothstep(0.0, w * 1.4, edge);

      // gouges thin out and break up, as on a real block
      float wear = smoothstep(0.25, 0.6, noise(uv * 9.0 + floor(bands)));
      line *= wear;

      // fixed paper speckle
      float speck = step(0.995, hash(floor(gl_FragCoord.xy / (2.0 * uDpr))));

      float redZone = smoothstep(0.62, 0.72, field);
      vec3 color = mix(uSage, uRed, redZone);
      float alpha = line * mix(0.19, 0.3, redZone) + speck * 0.14;
      color = mix(color, uCream, speck);
      gl_FragColor = vec4(color * alpha, alpha);
    }
  `);
}
