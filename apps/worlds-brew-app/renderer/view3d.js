// Frank's Worlds Brew app: the live GPU viewport (Three.js on WebGL2).
// A World mirrors one Worlds Brew scene (plain data from engine/scene.js) as Three objects;
// the Viewport adds the window's camera, picking, the move / rotate / scale handles and the brush ring.
// Renders: renderer/gpurender.js draws this same world offscreen at full size; the CPU ray tracer (engine/engine.js) is the other choice.
import * as THREE from "three";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { attachLayers, layersKey } from "./surfaces.js";

const req = window.require;
const S = req("../engine/scene.js");
const M = req("../engine/models.js");
const SF = req("../engine/surface.js");
const { vnoise, fbm } = req("../engine/noise.js");

const SRGB = THREE.SRGBColorSpace;
const col3 = (a) => new THREE.Color().setRGB(a[0], a[1], a[2], SRGB);
const hexCol = (h, fb) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || "")); return m ? new THREE.Color("#" + m[1]) : (fb || new THREE.Color(1, 1, 1)); };

// ---- shared textures (procedural, made once)
const texCache = new Map();
function canvasTex(key, size, paint, srgb) {
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement("canvas"); c.width = c.height = size;
  const g = c.getContext("2d"), img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const p = (y * size + x) * 4, v = paint(x / size, y / size); img.data[p] = v[0]; img.data[p + 1] = v[1]; img.data[p + 2] = v[2]; img.data[p + 3] = 255; }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb !== false) t.colorSpace = SRGB; t.anisotropy = 4;
  texCache.set(key, t); return t;
}
const grey = (k) => { const v = Math.max(0, Math.min(255, Math.round(k * 255))); return [v, v, v]; };
const PATTERNS = {
  stone: () => canvasTex("stone", 256, (u, v) => grey(0.7 + fbm(u * 8, v * 8, 4, 0.55) * 0.6 - 0.3)),
  checker: () => canvasTex("checker", 64, (u, v) => grey(((Math.floor(u * 2) + Math.floor(v * 2)) & 1) ? 1 : 0.15)),
  Marble: () => canvasTex("Marble", 256, (u, v) => { const lx = u * 4, ly = v * 4; return grey(0.3 + 0.7 * Math.pow(Math.abs(Math.sin(lx * 2.2 + ly * 1.3 + fbm(lx * 0.9 + 4, ly * 0.9, 5, 0.55) * 9)), 0.3)); }),
  Wood: () => canvasTex("Wood", 256, (u, v) => { const x = u * 2 - 1, y = v * 2 - 1, r = Math.hypot(x, y * 0.2) * 5 + fbm(x * 0.7, y * 0.25, 3, 0.5) * 2.5, g = r - Math.floor(r), m = 0.55 + 0.45 * (1 - g * g * g); return [Math.round(m * 242), Math.round(m * 158), Math.round(m * 92)]; }),
  Grid: () => canvasTex("Grid", 128, (u, v) => { const f = (q) => { const z = q * 2 - Math.floor(q * 2); return z < 0.07 || z > 0.93; }; return grey(f(u) || f(v) ? 0.15 : 1); }),
  Noise: () => canvasTex("Noise", 256, (u, v) => grey(0.45 + 1.1 * (fbm(u * 6 + 1, v * 6, 5, 0.55) - 0.5) + 0.25)),
  ground: () => canvasTex("ground", 512, (u, v) => { const n = fbm(u * 24, v * 24, 4, 0.5); return [Math.round((0.62 + n * 0.25) * 255), Math.round((0.52 + n * 0.2) * 255), Math.round((0.4 + n * 0.12) * 255)]; }),
  night: () => canvasTex("night", 64, (u, v) => grey(((Math.floor(u * 2) + Math.floor(v * 2)) & 1) ? 0.08 : 0.16))
};
// an object's own image texture (o.img = { w, h, d: RGBA }), cached per image
const imgTex = new WeakMap();
function imageTexture(img) {
  if (imgTex.has(img)) return imgTex.get(img);
  const t = new THREE.DataTexture(img.d, img.w, img.h, THREE.RGBAFormat); t.colorSpace = SRGB; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.flipY = true; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  imgTex.set(img, t); return t;
}

// ---- geometry: matches the ray tracer's shapes (scene units, before the object's size)
const UNIT = {};
function unitGeo(type) {
  if (UNIT[type]) return UNIT[type];
  let g;
  if (type === "sphere") g = new THREE.SphereGeometry(1, 64, 40);
  else if (type === "cube") g = new THREE.BoxGeometry(2, 2, 2);
  else if (type === "cylinder") g = new THREE.CylinderGeometry(1, 1, 2, 64, 1);
  else if (type === "cone") g = new THREE.ConeGeometry(1, 2, 64, 1);
  else if (type === "torus") { g = new THREE.TorusGeometry(0.72, 0.28, 32, 96); g.rotateX(-Math.PI / 2); }
  else if (type === "bulb") g = new THREE.SphereGeometry(1, 20, 14);
  UNIT[type] = g; return g;
}
// imported / pack models: one triangle list per (mesh, displacement, smooth, colours)
const meshGeoCache = new WeakMap();
function meshGeo(o) {
  const mv = M.meshVerts(o), f = o.mesh.f, tc = o.vc !== false ? o.mesh.tc : null, key = (o.disp || 0) + "|" + (o.smooth ? 1 : 0) + "|" + (tc ? 1 : 0);
  let per = meshGeoCache.get(o.mesh); if (!per) { per = new Map(); meshGeoCache.set(o.mesh, per); }
  if (per.has(key)) return per.get(key);
  const n = f.length, P = new Float32Array(n * 3), N = new Float32Array(n * 3), UV = new Float32Array(n * 2), C = tc ? new Float32Array(n * 3) : null, v = mv.v;
  for (let t = 0; t < n; t += 3) {
    const a = f[t] * 3, b = f[t + 1] * 3, c = f[t + 2] * 3;
    const ux = v[b] - v[a], uy = v[b + 1] - v[a + 1], uz = v[b + 2] - v[a + 2], wx = v[c] - v[a], wy = v[c + 1] - v[a + 1], wz = v[c + 2] - v[a + 2];
    let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);   // box-projected texture coordinates
    for (let j = 0; j < 3; j++) {
      const i = f[t + j] * 3, q = (t + j) * 3;
      P[q] = v[i]; P[q + 1] = v[i + 1]; P[q + 2] = v[i + 2];
      if (o.smooth) { N[q] = mv.n[i]; N[q + 1] = mv.n[i + 1]; N[q + 2] = mv.n[i + 2]; } else { N[q] = nx; N[q + 1] = ny; N[q + 2] = nz; }
      const u2 = (t + j) * 2; if (ax >= ay && ax >= az) { UV[u2] = v[i + 2] * 0.5; UV[u2 + 1] = v[i + 1] * 0.5; } else if (ay >= az) { UV[u2] = v[i] * 0.5; UV[u2 + 1] = v[i + 2] * 0.5; } else { UV[u2] = v[i] * 0.5; UV[u2 + 1] = v[i + 1] * 0.5; }
      if (C) { C[q] = tc[t] / 255 * 0.92; C[q + 1] = tc[t + 1] / 255 * 0.92; C[q + 2] = tc[t + 2] / 255 * 0.92; }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setAttribute("normal", new THREE.BufferAttribute(N, 3)); g.setAttribute("uv", new THREE.BufferAttribute(UV, 2));
  if (o.mesh.uv && o.mesh.uv.length === n * 2) g.setAttribute("wbuv", new THREE.BufferAttribute(o.mesh.uv, 2));
  if (C) { const lin = new Float32Array(C.length); const tmp = new THREE.Color(); for (let i = 0; i < C.length; i += 3) { tmp.setRGB(C[i], C[i + 1], C[i + 2], SRGB); lin[i] = tmp.r; lin[i + 1] = tmp.g; lin[i + 2] = tmp.b; } g.setAttribute("color", new THREE.BufferAttribute(lin, 3)); }
  g.computeBoundingSphere(); g.computeBoundingBox();
  per.set(key, g); return g;
}
// terrain: the height grid in local metres (x, z = -s..s, y = height), coloured by height and slope like the ray tracer
function terrainGeo(o, scene) {
  const hm = S.heightmap(o), N = S.HM_N, s = o.s, H = o.h, P = new Float32Array(N * N * 3), C = new Float32Array(N * N * 3), I = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const p = j * N + i; P[p * 3] = (i / (N - 1) * 2 - 1) * s; P[p * 3 + 1] = hm[p] * H; P[p * 3 + 2] = (j / (N - 1) * 2 - 1) * s; }
  for (let j = 0; j < N - 1; j++) for (let i = 0; i < N - 1; i++) { const a = j * N + i; I.push(a, a + N, a + 1, a + 1, a + N, a + N + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
  const Nn = g.getAttribute("normal").array, wl = scene.waterLvl || 0, tint = o.mat !== "Stone" ? (S.MATS[o.mat] || S.MATS.Matte).col : null, tmp = new THREE.Color();
  for (let p = 0; p < N * N; p++) {
    const px = P[p * 3], pz = P[p * 3 + 2], py = P[p * 3 + 1] + o.y, hn = hm[p], ny = Nn[p * 3 + 1], n = vnoise(px * 2.3, pz * 2.3);
    let c;
    if (scene.water && py < wl + 0.18) c = [0.78, 0.7, 0.52];
    else if (hn > 0.72 + n * 0.08 && ny > 0.55) c = [0.93, 0.95, 1.0];
    else if (ny > 0.78 - n * 0.08) c = [0.24 + n * 0.1, 0.38 + n * 0.12, 0.16];
    else c = [0.45 + n * 0.12, 0.4 + n * 0.1, 0.34 + n * 0.08];
    if (tint) c = [(c[0] + tint[0]) / 2, (c[1] + tint[1]) / 2, (c[2] + tint[2]) / 2];
    tmp.setRGB(c[0], c[1], c[2], SRGB); C[p * 3] = tmp.r; C[p * 3 + 1] = tmp.g; C[p * 3 + 2] = tmp.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(C, 3)); g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}

// ---- materials: the Worlds Brew presets as physically based materials
function hueCol(o, m) {
  if (!o.hue) return m.col;
  const h = o.hue / 360 * 6, s = 0.7, v = Math.max(...m.col), c = v * s, x = c * (1 - Math.abs(h % 2 - 1)), mm = v - c;
  const r = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h) % 6]; return [r[0] + mm, r[1] + mm, r[2] + mm];
}
function material(o) {
  const m = S.MATS[o.mat] || S.MATS.Matte, vc = o.type === "terrain" || (o.type === "mesh" && o.vc !== false && !!o.mesh.tc);
  const P = { Chrome: [1, 0.06], Gold: [1, 0.2], Glossy: [0, 0.18], Matte: [0, 0.92], Stone: [0, 1], Neon: [0, 0.5], Checker: [0, 0.4] }[o.mat] || [0, 0.8];
  const mat = new THREE.MeshPhysicalMaterial({ color: vc ? new THREE.Color(1, 1, 1) : col3(hueCol(o, m)), metalness: P[0], roughness: P[1], vertexColors: vc, side: o.type === "mesh" ? THREE.DoubleSide : THREE.FrontSide });
  if (o.mat === "Glossy") { mat.clearcoat = 1; mat.clearcoatRoughness = 0.08; }
  if (o.refl != null && o.type !== "terrain") { mat.metalness = Math.min(1, o.refl * 1.2); mat.roughness = Math.max(0.04, 1 - o.refl); }
  if (m.emit) { mat.emissive = col3(hueCol(o, m)); mat.emissiveIntensity = 1.2; }
  let map = null;
  if (o.type !== "terrain") {
    if (o.img) map = imageTexture(o.img);
    else if (o.pat && o.pat !== "None" && PATTERNS[o.pat]) map = PATTERNS[o.pat]();
    else if (m.tex === 1) map = PATTERNS.stone();
    else if (m.tex === 2) map = PATTERNS.checker();
  }
  if (map) { map = map.clone(); map.needsUpdate = true; const k = o.img ? (o.ts || 1) * o.s : m.tex === 2 && (!o.pat || o.pat === "None") ? 2 * o.s : (o.ts || 1) * 2 * o.s; map.repeat.set(k, k); mat.map = map; if (o.img) mat.color.setRGB(0.9, 0.9, 0.9); }
  mat.envMapIntensity = mat.metalness > 0.5 ? 1.1 : o.mat === "Glossy" ? 0.6 : 0.3;
  if (o.bump > 0) { mat.bumpMap = PATTERNS.Noise(); mat.bumpScale = o.bump * 3; }
  if (SF.active(o)) attachLayers(mat, o);   // surface layers (bitmaps over the base material)
  return mat;
}
function disposeMat(m) { if (!m) return; if (m.map) m.map.dispose(); m.dispose(); }

// what has to change for an object's geometry / material to be rebuilt (anything else is just a transform)
function texKey(o) { return o.img ? (o.img.name + o.img.w + "x" + o.img.h + "#" + (o.img.__k || (o.img.__k = Math.random().toString(36).slice(2)))) : ""; }
function lookKey(o) { const textured = o.img || (o.pat && o.pat !== "None"); return [o.mat, o.hue, o.refl, o.pat, texKey(o), o.ts, o.bump, o.vc, textured || (S.MATS[o.mat] || {}).tex ? o.s : "", layersKey(o)].join("|"); }
function geoKey(o, scene) {
  if (o.type === "terrain") return S.heightmap(o).key + "|" + (o.sculptV || 0) + "|" + o.s + "|" + o.h + "|" + o.y + "|" + o.mat + "|" + (scene.water ? scene.waterLvl : "-");
  if (o.type === "mesh") return o.mesh.id + "|" + o.disp + "|" + o.smooth + "|" + (o.vc !== false);
  return o.type;
}

// ---- sky dome: the ray tracer's sky gradient, sun glow and clouds
const SKY_VERT = `varying vec3 vDir; void main(){ vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`;
const SKY_FRAG = `uniform vec3 zen; uniform vec3 hor; uniform vec3 sunDir; uniform vec3 glowC; uniform float gk; uniform float clouds; varying vec3 vDir;
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h2(i), h2(i+vec2(1,0)), f.x), mix(h2(i+vec2(0,1)), h2(i+vec2(1,1)), f.x), f.y); }
float fb(vec2 p){ float a = 1.0, s = 0.0, n = 0.0; for (int o = 0; o < 5; o++) { s += a * vn(p); n += a; a *= 0.5; p *= 2.03; } return s / n; }
void main(){ vec3 d = normalize(vDir); float y = max(d.y, 0.0), k = pow(y, 0.45); vec3 c = mix(hor, zen, k);
  if (d.y < 0.0) c *= 1.0 - min(-d.y * 4.0, 1.0) * 0.35;
  float sd = max(dot(d, sunDir), 0.0); c += glowC * (pow(sd, 12.0) * 0.35 + pow(sd, 900.0) * 2.5) * gk;
  if (clouds > 0.0 && d.y > 0.02) { float t = 40.0 / d.y; vec2 q = d.xz * t * 0.025; float cl = clamp((fb(q + vec2(3.1, 7.7)) - (0.72 - clouds * 0.42)) * 3.2, 0.0, 1.0) * min(d.y * 6.0, 1.0); c = mix(c, vec3(1.0, 0.98, 0.95) * (0.55 + 0.45 * y) + glowC * 0.08, cl * 0.85); }
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const toLin = (a) => { const c = col3(a); return new THREE.Vector3(c.r, c.g, c.b); };

export class World {
  constructor() {
    this.scene = new THREE.Scene();
    this.nodes = new Map();          // engine object -> { node, key }
    this.sun = new THREE.DirectionalLight(0xffffff, 3); this.sun.castShadow = true;
    const sc = this.sun.shadow; sc.mapSize.set(2048, 2048); sc.bias = -0.0004; sc.normalBias = 0.03; sc.camera.near = 0.5; sc.camera.far = 220;
    this.scene.add(this.sun, this.sun.target);
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1); this.scene.add(this.hemi);
    this.skyMat = new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { zen: { value: new THREE.Vector3() }, hor: { value: new THREE.Vector3() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, glowC: { value: new THREE.Vector3(1, 1, 1) }, gk: { value: 1 }, clouds: { value: 0 } } });
    this.skyMat.toneMapped = true;
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), this.skyMat); this.sky.frustumCulled = false; this.sky.renderOrder = -1; this.scene.add(this.sky);
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }));
    this.ground.rotation.x = -Math.PI / 2; this.ground.receiveShadow = true; this.scene.add(this.ground);
    this.waterGeo = new THREE.PlaneGeometry(240, 240, 160, 160); this.waterGeo.rotateX(-Math.PI / 2); this.waterBase = Float32Array.from(this.waterGeo.getAttribute("position").array);
    this.waterMat = new THREE.MeshPhysicalMaterial({ color: 0x05171f, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.92, envMapIntensity: 1 });
    this.water = new THREE.Mesh(this.waterGeo, this.waterMat); this.water.receiveShadow = true; this.scene.add(this.water);
    this.skyKey = ""; this.envRT = null; this.waveT = 0;
  }
  // sky, sun, ambient, fog, ground and water from the scene settings
  syncEnv(sc, renderer) {
    const sk = S.SKIES[sc.sky] || S.SKIES.Noon, sunK = (sc.sunPow == null ? 100 : sc.sunPow) / 100, ambK = (sc.ambPow == null ? 100 : sc.ambPow) / 100;
    let sunC = sk.sun; if (sc.sunCol) { const c = hexCol(sc.sunCol, null); if (c) { const lv = Math.max(...sk.sun), m = Math.max(c.r, c.g, c.b) || 1; sunC = [c.r / m * lv, c.g / m * lv, c.b / m * lv]; } }
    const az = sc.sunAz * Math.PI / 180, al = sc.sunAlt * Math.PI / 180, L = new THREE.Vector3(Math.cos(al) * Math.sin(az), Math.sin(al), Math.cos(al) * Math.cos(az));
    const u = this.skyMat.uniforms; u.zen.value.copy(toLin(sk.zen)); u.hor.value.copy(toLin(sk.hor)); u.sunDir.value.copy(L); u.glowC.value.copy(toLin(sunC)); u.gk.value = Math.min(1.6, 0.25 + sunK * 0.75); u.clouds.value = (sc.clouds || 0) / 100;
    const lv = Math.max(...sunC) || 1; this.sun.color.copy(col3([sunC[0] / lv, sunC[1] / lv, sunC[2] / lv])); this.sun.intensity = Math.PI * lv * sunK * (sc.sunAlt < 0 ? 0 : 1) * 0.95;
    const cx = sc.cam ? sc.cam.tx : 0, cz = sc.cam ? sc.cam.tz : 0;
    this.sun.target.position.set(cx, 0, cz); this.sun.position.set(cx + L.x * 90, Math.max(2, L.y * 90), cz + L.z * 90);
    const ext = Math.min(90, Math.max(18, (sc.cam ? sc.cam.dist : 20) * 1.3)), scam = this.sun.shadow.camera; scam.left = -ext; scam.right = ext; scam.top = ext; scam.bottom = -ext; scam.updateProjectionMatrix();
    this.hemi.color.copy(col3(sk.amb)); this.hemi.groundColor.copy(col3(sk.amb.map((v) => v * 0.45))); this.hemi.intensity = Math.PI * ambK * 0.9;
    const hor = col3(sk.hor), dens = (sc.haze || 0) / 100 * 0.035 + (sc.fog || 0) / 100 * 0.05;
    this.scene.fog = dens > 0.0005 ? new THREE.FogExp2(hor, dens) : null;
    // ground plane
    this.ground.visible = !!sc.ground;
    const gm = this.ground.material, gmap = sc.sky === "Night" ? PATTERNS.night() : PATTERNS.ground();
    if (gm.map !== gmap) { gm.map = gmap.clone(); gm.map.needsUpdate = true; gm.map.repeat.set(800, 800); if (sc.sky !== "Night") gm.map.repeat.set(40, 40); gm.roughness = sc.sky === "Night" ? 0.5 : 0.95; gm.needsUpdate = true; }
    // water
    this.water.visible = !!sc.water; this.water.position.y = sc.waterLvl || 0;
    this.waterMat.color.copy(hexCol(sc.waterCol || "#05171F")); this.waterMat.opacity = 1 - (sc.clarity || 0) / 100 * 0.65;
    this.waterMat.envMapIntensity = (sc.waterRefl == null ? 100 : sc.waterRefl) / 100 * 1.2;
    this.waterMat.roughness = 0.03 + Math.min(0.2, (sc.ripple || 0) * 0.04);
    this.waveScene = sc; this.updateWaves(0);
    // sky reflections for metals and water
    const key = [sc.sky, sc.sunAz, sc.sunAlt, sc.sunCol, sc.sunPow, sc.clouds].join("|");
    if (renderer && key !== this.skyKey) {
      this.skyKey = key;
      const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene(), dome = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), this.skyMat); es.add(dome);
      const rt = pm.fromScene(es, 0.02); if (this.envRT) this.envRT.dispose(); this.envRT = rt; this.scene.environment = rt.texture; this.scene.environmentIntensity = 1; pm.dispose(); dome.geometry.dispose();
    }
  }
  updateWaves(dt) {
    const sc = this.waveScene; if (!sc || !sc.water) return false;
    const WH = Math.max(0, sc.waveH || 0), pos = this.waterGeo.getAttribute("position"), A = pos.array, B = this.waterBase;
    if (WH <= 0) { if (this._waved) { A.set(B); pos.needsUpdate = true; this.waterGeo.computeVertexNormals(); this._waved = false; } return false; }
    this.waveT += dt; const WK = 1 / Math.max(0.2, sc.waveSize || 1), wa = (sc.wind || 0) * Math.PI / 180, WC = Math.cos(wa), WS = Math.sin(wa), T = this.waveT * 0.6;
    for (let i = 0; i < A.length; i += 3) { const x = B[i], z = B[i + 2], a = (x * WC + z * WS) * WK, c = (-x * WS + z * WC) * WK;
      A[i + 1] = WH * (Math.sin(a * 1.6 + T + vnoise(a * 0.35, c * 0.35) * 4) * 0.5 + Math.sin(a * 3.1 + c * 1.3 + T * 1.3) * 0.22 + (vnoise(a * 1.9 + 7, c * 1.9) - 0.5) * 0.6); }
    pos.needsUpdate = true; this.waterGeo.computeVertexNormals(); this._waved = true; return true;
  }
  // objects: build what is new or changed, drop what was deleted, update every transform
  syncObjects(sc) {
    const seen = new Set();
    let lights = 0;
    for (const o of sc.objs) {
      seen.add(o);
      let rec = this.nodes.get(o);
      if (!rec) { rec = { node: this.build(o), gk: null, lk: null }; rec.node.userData.obj = o; rec.node.rotation.order = "YXZ"; this.scene.add(rec.node); this.nodes.set(o, rec); }
      const n = rec.node;
      if (o.type !== "light") {   // swap geometry / material in place, so the handles stay attached
        const gk = geoKey(o, sc), lk = lookKey(o);
        if (gk !== rec.gk) { if (n.userData.ownGeo) n.userData.ownGeo.dispose(); const g = o.type === "terrain" ? terrainGeo(o, sc) : o.type === "mesh" ? meshGeo(o) : unitGeo(o.type); n.geometry = g; n.userData.ownGeo = o.type === "terrain" ? g : null; rec.gk = gk; }
        if (lk !== rec.lk || rec.gk0 !== gk) { disposeMat(n.material); n.material = material(o); rec.lk = lk; rec.gk0 = gk; }
      }
      const lu = n.material && n.material.userData.wbUpdate;
      n.position.set(o.x, o.y, o.z); n.rotation.set(0, (o.ry || 0) * Math.PI / 180, 0);
      if (o.type === "terrain") n.scale.set(1, 1, 1);
      else if (o.type === "light") { const pl = n.userData.pl, c = hexCol(o.col, new THREE.Color(1, 0.9, 0.7)), R = Math.max(0.3, o.range || 6); pl.color.copy(c); pl.intensity = (o.pow == null ? 100 : o.pow) / 100 * 1.6 * R * R * 0.9; pl.distance = R * 3.2; pl.castShadow = o.shadow !== false && lights < 4; lights++;
        n.userData.bulb.scale.setScalar(Math.max(0.05, o.s || 0.25)); n.userData.bulb.material.color.copy(c); n.userData.bulb.visible = o.glow !== false; }
      else n.scale.set(o.s * (o.sx || 1), o.s * (o.sy || 1), o.s * (o.sz || 1));
      if (lu) lu(o, n);   // layer dials are uniforms: refresh every sync
    }
    for (const [o, rec] of this.nodes) if (!seen.has(o)) { this.drop(rec); this.nodes.delete(o); }
  }
  build(o) {
    if (o.type === "light") {
      const g = new THREE.Group(), pl = new THREE.PointLight(0xffffff, 1, 10, 2); pl.shadow.mapSize.set(512, 512); pl.shadow.bias = -0.002;
      const bulb = new THREE.Mesh(unitGeo("bulb"), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })); g.add(pl, bulb); g.userData.pl = pl; g.userData.bulb = bulb; return g;
    }
    const mesh = new THREE.Mesh(unitGeo("sphere"), new THREE.MeshBasicMaterial()); mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
  }
  drop(rec) { const n = rec.node; this.scene.remove(n); if (n.userData.bulb) n.userData.bulb.material.dispose(); else disposeMat(n.material); if (n.userData.ownGeo) n.userData.ownGeo.dispose(); if (n.userData.pl) n.userData.pl.dispose(); }
  sync(sc, renderer) { this.syncEnv(sc, renderer); this.syncObjects(sc); }
  dispose() { for (const rec of this.nodes.values()) this.drop(rec); this.nodes.clear(); if (this.envRT) this.envRT.dispose(); this.skyMat.dispose(); this.sky.geometry.dispose(); this.ground.material.dispose(); this.waterGeo.dispose(); this.waterMat.dispose(); }
}

// put a Three camera where the Worlds Brew camera is
export function placeCamera(camera, c, aspect) {
  const yw = c.yaw * Math.PI / 180, pt = c.pitch * Math.PI / 180;
  camera.position.set(c.tx + Math.sin(yw) * Math.cos(pt) * c.dist, c.ty + Math.sin(pt) * c.dist, c.tz + Math.cos(yw) * Math.cos(pt) * c.dist);
  camera.up.set(0, 1, 0); camera.lookAt(c.tx, c.ty, c.tz);
  camera.fov = c.fov; camera.aspect = aspect; camera.near = Math.max(0.05, c.dist / 400); camera.far = 2000; camera.updateProjectionMatrix();
}

function makeRenderer(canvas, opt) {
  const r = new THREE.WebGLRenderer(Object.assign({ canvas, antialias: true, powerPreference: "high-performance" }, opt || {}));
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.toneMapping = THREE.NeutralToneMapping; r.toneMappingExposure = 1.0; r.outputColorSpace = SRGB;
  return r;
}

export class Viewport {
  constructor(canvas, hooks) {
    this.canvas = canvas; this.hooks = hooks || {};
    this.renderer = makeRenderer(canvas); this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.world = new World();
    this.camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 2000);
    this.ray = new THREE.Raycaster();
    this.selBox = new THREE.BoxHelper(undefined, 0x5effc8); this.selBox.visible = false; this.selBox.material.depthTest = false; this.selBox.renderOrder = 10; this.world.scene.add(this.selBox);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x5effc8, transparent: true, opacity: 0.9, depthTest: false, fog: false }));
    this.ring.visible = false; this.ring.renderOrder = 11; this.world.scene.add(this.ring);
    this.tc = new TransformControls(this.camera, canvas); this.tc.setSize(0.9);
    this.tcHelper = this.tc.getHelper(); this.world.scene.add(this.tcHelper);
    this.tc.addEventListener("dragging-changed", (e) => { this.hooks.onGizmoDrag && this.hooks.onGizmoDrag(e.value, this.tc.object && this.tc.object.userData.obj); });
    this.tc.addEventListener("objectChange", () => { const n = this.tc.object; if (n && this.hooks.onGizmoChange) this.hooks.onGizmoChange(n.userData.obj, n, this.tc.mode); });
    this.data = null; this.sel = null; this.dirty = true; this.last = performance.now();
    const ro = new ResizeObserver(() => this.resize()); ro.observe(canvas.parentElement || canvas); this.resize();
    const loop = (t) => { const dt = Math.min(0.1, (t - this.last) / 1000); this.last = t; if (!this.paused) { if (this.world.updateWaves(dt)) this.dirty = true; if (this.dirty) this.draw(); } requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  resize() { const p = this.canvas.parentElement, w = Math.max(50, p.clientWidth), h = Math.max(50, p.clientHeight); this.renderer.setSize(w, h, false); this.dirty = true; }
  // scene data -> Three; gizmo = "move" | "rotate" | "scale" | "sculpt"
  sync(data, sel, gizmo) {
    this.data = data; this.sel = sel; this.world.sync(data, this.renderer);
    const rec = sel ? this.world.nodes.get(sel) : null;
    if (rec && gizmo !== "sculpt" && !(sel.type === "light" && gizmo === "scale")) {
      if (this.tc.object !== rec.node) this.tc.attach(rec.node);
      this.tc.setMode(gizmo === "rotate" ? "rotate" : gizmo === "scale" ? "scale" : "translate");
      this.tc.showX = gizmo !== "rotate"; this.tc.showZ = gizmo !== "rotate"; this.tc.showY = true;
    } else if (this.tc.object) this.tc.detach();
    this.selBox.visible = !!rec; if (rec) this.selBox.setFromObject(rec.node);
    this.dirty = true;
  }
  draw() {
    if (!this.data) return;
    const w = this.canvas.width, h = this.canvas.height; placeCamera(this.camera, this.data.cam, w / h);
    if (this.selBox.visible && this.sel) { const rec = this.world.nodes.get(this.sel); if (rec) this.selBox.setFromObject(rec.node); }
    this.renderer.render(this.world.scene, this.camera); this.dirty = false;
    if (this.hooks.onDraw) this.hooks.onDraw();
  }
  ndc(cx, cy) { const r = this.canvas.getBoundingClientRect(); return new THREE.Vector2((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); }
  // a ray in the shape the engine's helpers use ({ ox, oy, oz, dx, dy, dz })
  rayAt(cx, cy) { placeCamera(this.camera, this.data.cam, this.canvas.width / this.canvas.height); this.ray.setFromCamera(this.ndc(cx, cy), this.camera); const o = this.ray.ray.origin, d = this.ray.ray.direction; return { ox: o.x, oy: o.y, oz: o.z, dx: d.x, dy: d.y, dz: d.z }; }
  // the object under the pointer (or null)
  pick(cx, cy) {
    this.rayAt(cx, cy);
    const nodes = []; for (const rec of this.world.nodes.values()) nodes.push(rec.node);
    const hits = this.ray.intersectObjects(nodes, true);
    for (const h of hits) { let n = h.object; while (n && !(n.userData && n.userData.obj)) n = n.parent; if (n) return { obj: n.userData.obj, point: h.point }; }
    return null;
  }
  overGizmo() { return !!(this.tc.object && this.tc.axis); }
  setRing(p, radius) { if (!p) { if (this.ring.visible) { this.ring.visible = false; this.dirty = true; } return; } this.ring.visible = true; this.ring.position.set(p.x, p.y + 0.03, p.z); this.ring.scale.setScalar(radius); this.dirty = true; }
  // screen position (client px) of a world point, for drop previews and tests
  project(x, y, z) { const v = new THREE.Vector3(x, y, z).project(this.camera), r = this.canvas.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; }
  // a still of the viewport as a PNG data URL
  grab() { this.draw(); return this.canvas.toDataURL("image/png"); }
}

// small stills of a scene (library thumbnails and asset icons), drawn on one shared offscreen renderer
let snapR = null, snapCanvas = null;
export function snapshot(data, cam, w, h) {
  if (!snapR) { snapCanvas = document.createElement("canvas"); snapR = makeRenderer(snapCanvas, { preserveDrawingBuffer: true }); snapR.setPixelRatio(1); }
  snapR.setSize(w, h, false);
  const world = new World(), camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
  world.sync(Object.assign({ cam }, data), snapR); placeCamera(camera, cam, w / h);
  snapR.render(world.scene, camera);
  const url = snapCanvas.toDataURL("image/png"); world.dispose(); return url;
}
