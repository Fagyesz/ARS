import {
  Color,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  NoBlending,
  NormalBlending,
  OrthographicCamera,
  PlaneGeometry,
  Quaternion,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';

/**
 * Printmaking-themed background scenes, loaded on demand by BackgroundCanvas:
 * - `halftone` (home hero): a screen-print dot grid that breathes and ripples
 *   around the cursor
 * - `ink` (about): slowly drifting linocut gouge lines over a speckled ground
 * - `beetles` (artists): little linocut beetles wandering across the header
 *   and stepping away from the cursor (a nod to Dóri's prints)
 * Everything is drawn in the brand colours at low opacity, behind the text.
 */
export type SceneKind = 'halftone' | 'ink' | 'beetles';

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

export function mountScene(container: HTMLElement, kind: SceneKind): () => void {
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: 'low-power',
    premultipliedAlpha: true,
  });
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  container.appendChild(canvas);

  const handle =
    kind === 'halftone' ? halftoneScene() : kind === 'ink' ? inkScene() : beetleScene();

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

/** A full-canvas quad driven by a fragment shader (halftone and ink). */
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

/* ── halftone (home hero) ────────────────────────────────────────────────── */

function halftoneScene() {
  return fullscreenScene(/* glsl */ `
    uniform float uTime;
    uniform vec2 uRes;
    uniform float uDpr;
    uniform vec2 uMouse;
    uniform float uMouseOn;
    uniform vec3 uCream;
    uniform vec3 uRed;
    ${NOISE_GLSL}

    void main() {
      float cell = 16.0 * uDpr;
      // screen-print rasters sit at an angle
      float a = 0.26;
      mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
      vec2 p = rot * gl_FragCoord.xy;
      vec2 id = floor(p / cell);
      vec2 local = p - (id + 0.5) * cell;
      vec2 center = transpose(rot) * ((id + 0.5) * cell);

      // tone: a slow drifting cloud, darker toward the text on the left
      float tone = fbm(id * 0.07 + vec2(uTime * 0.04, -uTime * 0.025));
      float side = smoothstep(0.05, 0.85, center.x / uRes.x);
      tone = tone * (0.35 + 0.75 * side);

      // ripple rings spreading from the cursor
      float d = distance(center, uMouse) / uDpr;
      float ring = 0.5 + 0.5 * sin(d * 0.06 - uTime * 3.2);
      tone += uMouseOn * exp(-d / 220.0) * ring * 0.55;

      float radius = cell * 0.5 * clamp(tone, 0.0, 1.0);
      float dist = length(local);
      float dot = 1.0 - smoothstep(radius - 0.75 * uDpr, radius + 0.75 * uDpr, dist);

      // a sparse second "plate" printed in red
      float plate = step(0.86, noise(id * 0.21 + 31.0));
      vec3 color = mix(uCream, uRed, plate);
      float alpha = dot * mix(0.16, 0.34, plate);
      gl_FragColor = vec4(color * alpha, alpha);
    }
  `);
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

/* ── wandering beetles (artists) ─────────────────────────────────────────── */

type Beetle = {
  x: number;
  y: number;
  heading: number;
  speed: number;
  size: number;
  seed: number;
  gait: number;
  pause: number;
};

function beetleScene(): SceneHandle {
  const MAX = 18;
  const scene = new Scene();
  const camera = new OrthographicCamera(0, 1, 1, 0, -10, 10);
  const geometry = new PlaneGeometry(1, 1);
  const gaitAttr = new InstancedBufferAttribute(new Float32Array(MAX), 1);
  gaitAttr.setUsage(DynamicDrawUsage);
  const tintAttr = new InstancedBufferAttribute(new Float32Array(MAX), 1);
  geometry.setAttribute('aGait', gaitAttr);
  geometry.setAttribute('aTint', tintAttr);

  const material = new ShaderMaterial({
    uniforms: {uCream: {value: CREAM}, uRed: {value: RED}},
    vertexShader: /* glsl */ `
      attribute float aGait;
      attribute float aTint;
      varying vec2 vUv;
      varying float vGait;
      varying float vTint;
      void main() {
        vUv = uv - 0.5;
        vGait = aGait;
        vTint = aTint;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uCream;
      uniform vec3 uRed;
      varying vec2 vUv;
      varying float vGait;
      varying float vTint;

      float ellipse(vec2 p, vec2 r) {
        return (length(p / r) - 1.0) * min(r.x, r.y);
      }
      float segment(vec2 p, vec2 a, vec2 b) {
        vec2 pa = p - a, ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return length(pa - ba * h);
      }
      // one leg: hip on the body, knee out to the side, foot swinging with the gait
      float leg(vec2 p, float side, float y, float swing) {
        vec2 hip = vec2(0.1 * side, y);
        vec2 knee = vec2(0.27 * side, y + 0.05 + swing * 0.05);
        vec2 foot = vec2(0.36 * side, y + (y > 0.0 ? 0.12 : -0.08) + swing * 0.09);
        return min(segment(p, hip, knee), segment(p, knee, foot)) - 0.016;
      }

      void main() {
        vec2 p = vUv;
        float body = ellipse(p - vec2(0.0, -0.08), vec2(0.17, 0.25));
        float thorax = ellipse(p - vec2(0.0, 0.17), vec2(0.12, 0.07));
        float head = length(p - vec2(0.0, 0.27)) - 0.065;
        float shape = min(min(body, thorax), head);

        // tripod gait: legs 1 and 3 of one side move with leg 2 of the other
        float s = sin(vGait);
        float legs = 1e3;
        legs = min(legs, leg(p, -1.0, 0.14, s));
        legs = min(legs, leg(p, 1.0, 0.14, -s));
        legs = min(legs, leg(p, -1.0, 0.0, -s));
        legs = min(legs, leg(p, 1.0, 0.0, s));
        legs = min(legs, leg(p, -1.0, -0.14, s));
        legs = min(legs, leg(p, 1.0, -0.14, -s));
        float antennae = min(
          segment(p, vec2(-0.03, 0.31), vec2(-0.12, 0.44)),
          segment(p, vec2(0.03, 0.31), vec2(0.12, 0.44))
        ) - 0.012;
        shape = min(shape, min(legs, antennae));

        // carved details on the shell: the wing seam and short cross cuts
        if (body < 0.0) {
          float seam = abs(p.x) - 0.012;
          shape = max(shape, -seam);
          if (body < -0.04) {
            float cuts = abs(fract((p.y + 0.08) * 7.0) - 0.5) / 7.0 - 0.009;
            shape = max(shape, -cuts);
          }
        }

        float aa = fwidth(shape);
        float alpha = 1.0 - smoothstep(-aa, aa, shape);
        vec3 color = mix(uCream, uRed, vTint);
        alpha *= mix(0.26, 0.38, vTint);
        gl_FragColor = vec4(color * alpha, alpha);
      }
    `,
    transparent: true,
    blending: NormalBlending,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
  });

  const mesh = new InstancedMesh(geometry, material, MAX);
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  mesh.frustumCulled = false;
  scene.add(mesh);

  let width = 1;
  let height = 1;
  let beetles: Beetle[] = [];
  const matrix = new Matrix4();
  const position = new Vector3();
  const rotation = new Quaternion();
  const scale = new Vector3();
  const axis = new Vector3(0, 0, 1);

  const spawn = (index: number): Beetle => ({
    x: Math.random() * width,
    y: Math.random() * height,
    heading: Math.random() * Math.PI * 2,
    speed: 16 + Math.random() * 22,
    size: 34 + Math.random() * 22,
    seed: index * 13.7 + Math.random() * 100,
    gait: Math.random() * 6,
    pause: 0,
  });

  return {
    scene,
    camera,
    resize(w, h) {
      width = w;
      height = h;
      camera.right = w;
      camera.top = h;
      camera.updateProjectionMatrix();
      const count = Math.max(5, Math.min(MAX, Math.round((w * h) / 42000)));
      while (beetles.length < count) beetles.push(spawn(beetles.length));
      beetles = beetles.slice(0, count);
      beetles.forEach((_, i) => tintAttr.setX(i, i % 4 === 0 ? 1 : 0));
      tintAttr.needsUpdate = true;
      mesh.count = count;
    },
    update(time, dt, pointer) {
      const margin = 60;
      beetles.forEach((beetle, i) => {
        // wander: smooth random turning, with the odd pause to "look around"
        beetle.heading += Math.sin(time * 0.6 + beetle.seed) * 0.9 * dt;
        beetle.heading += Math.sin(time * 1.7 + beetle.seed * 2.1) * 0.5 * dt;
        if (beetle.pause > 0) beetle.pause -= dt;
        else if (Math.random() < dt * 0.08) beetle.pause = 0.6 + Math.random() * 1.6;

        // step away from the cursor
        const dx = beetle.x - pointer.x;
        const dy = beetle.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        let hurry = 1;
        if (pointer.active > 0.5 && dist < 150) {
          const away = Math.atan2(dy, dx);
          let diff = away - beetle.heading;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          beetle.heading += diff * Math.min(dt * 4, 1);
          beetle.pause = 0;
          hurry = 2.6;
        }

        const speed = beetle.pause > 0 ? 0 : beetle.speed * hurry;
        beetle.x += Math.cos(beetle.heading) * speed * dt;
        beetle.y += Math.sin(beetle.heading) * speed * dt;
        beetle.gait += speed * dt * 0.45;

        // walk off one edge, come back on the other
        if (beetle.x < -margin) beetle.x = width + margin;
        if (beetle.x > width + margin) beetle.x = -margin;
        if (beetle.y < -margin) beetle.y = height + margin;
        if (beetle.y > height + margin) beetle.y = -margin;

        position.set(beetle.x, beetle.y, 0);
        // the sprite faces +y; heading 0 is +x
        rotation.setFromAxisAngle(axis, beetle.heading - Math.PI / 2);
        scale.set(beetle.size, beetle.size, 1);
        matrix.compose(position, rotation, scale);
        mesh.setMatrixAt(i, matrix);
        gaitAttr.setX(i, beetle.gait);
      });
      mesh.instanceMatrix.needsUpdate = true;
      gaitAttr.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      mesh.dispose();
    },
  };
}
