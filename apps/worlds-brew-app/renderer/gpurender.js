// Pixel Scape app: the GPU renderer (phase 2).
// Renders a scene offscreen with the same Three.js world as the live view, at full output size:
//   Draft = 1 sample per pixel with MSAA; Final = 2x2 supersampling, sharper shadows, and reflections of the
//   scene itself (a cube map taken at the camera's aim point) on metals and glossy surfaces.
// Passes (Depth, Object mask, Sky mask) come from one extra float pass that stores distance + object id per pixel,
// in the same form as the ray tracer, so engine.layers() turns either result into the same pictures.
import * as THREE from "three";
import { World, placeCamera } from "./view3d.js";

const E = window.require("../engine/engine.js");
let R = null, canvas = null;
function renderer() {
  if (R) return R;
  canvas = document.createElement("canvas");
  R = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  R.toneMapping = THREE.NeutralToneMapping; R.toneMappingExposure = 1.0; R.outputColorSpace = THREE.SRGBColorSpace; R.setPixelRatio(1);
  return R;
}
const ID_VERT = `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const ID_FRAG = `uniform float id; varying vec3 vW; void main() { gl_FragColor = vec4(distance(vW, cameraPosition), id + 10.0, 0.0, 1.0); }`;
const idMat = (id, side) => new THREE.ShaderMaterial({ vertexShader: ID_VERT, fragmentShader: ID_FRAG, uniforms: { id: { value: id } }, side: side || THREE.FrontSide, fog: false });
const wait = () => new Promise((r) => setTimeout(r, 0));

/* data = scene, cam = camera, W x H output, opt = { quality: "draft" | "final", passes: bool }, hooks = { status(text) }
   returns { w, h, rgba, depth, ids, ms } like the ray tracer */
export async function renderGPU(data, cam, W, H, opt, hooks) {
  opt = opt || {}; hooks = hooks || {};
  const t0 = performance.now(), r = renderer(), gl = r.getContext(), final = opt.quality === "final";
  const maxSide = Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), gl.getParameter(gl.MAX_TEXTURE_SIZE), 16384);
  const ss = final ? Math.max(1, Math.min(2, Math.floor(maxSide / Math.max(W, H)))) : 1;
  if (Math.max(W, H) > maxSide) throw new Error("This size is larger than the graphics card can draw (" + maxSide + " px). Try a smaller output or the ray tracer.");
  const world = new World(), camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 2000);
  const extras = [];
  try {
    world.sync(data, r); placeCamera(camera, cam, W / H);
    // Final: sharper shadows and scene reflections
    if (final) {
      world.sun.shadow.mapSize.set(4096, 4096);
      for (const rec of world.nodes.values()) if (rec.node.userData.pl) rec.node.userData.pl.shadow.mapSize.set(1024, 1024);
      const metals = [];
      for (const rec of world.nodes.values()) { const m = rec.node.material; if (m && m.isMeshStandardMaterial && (m.metalness > 0.3 || m.clearcoat > 0.5)) metals.push(m); }
      if (metals.length) {
        hooks.status && hooks.status("Reflections..."); await wait();
        const crt = new THREE.WebGLCubeRenderTarget(512, { type: THREE.HalfFloatType }), cc = new THREE.CubeCamera(0.1, 1200, crt);
        cc.position.set(cam.tx, Math.max(cam.ty, (data.waterLvl || 0) + 0.3), cam.tz);
        const hide = []; for (const rec of world.nodes.values()) { const m = rec.node.material; if (metals.includes(m)) { rec.node.visible = false; hide.push(rec.node); } }
        world.scene.add(cc); cc.update(r, world.scene); world.scene.remove(cc); hide.forEach((n) => { n.visible = true; });
        const pm = new THREE.PMREMGenerator(r), env = pm.fromCubemap(crt.texture); pm.dispose(); crt.dispose(); extras.push(env);
        metals.forEach((m) => { m.envMap = env.texture; m.needsUpdate = true; });
      }
    }
    hooks.status && hooks.status("Drawing " + W * ss + " x " + H * ss + "..."); await wait();
    r.setSize(W * ss, H * ss, false); r.setRenderTarget(null); r.render(world.scene, camera);
    // down to the output size (2x2 box average when supersampled)
    const out = document.createElement("canvas"); out.width = W; out.height = H;
    const g = out.getContext("2d", { willReadFrequently: true }); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(canvas, 0, 0, W, H);
    const rgba = new Uint8Array(g.getImageData(0, 0, W, H).data.buffer);
    let depth = null, ids = null;
    if (opt.passes) {
      hooks.status && hooks.status("Passes..."); await wait();
      const objs = data.objs.filter((o) => o.type !== "light"), swaps = [];
      for (const [o, rec] of world.nodes) { const n = rec.node; if (o.type === "light") { n.visible = false; swaps.push([n, null]); continue; } const m = idMat(objs.indexOf(o), n.material.side); swaps.push([n, n.material]); n.material = m; }
      const keep = [world.water.material, world.ground.material]; world.water.material = idMat(-3, THREE.DoubleSide); world.ground.material = idMat(-4); world.sky.visible = false;
      const fog = world.scene.fog; world.scene.fog = null;
      const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType, format: THREE.RGBAFormat, depthBuffer: true });
      r.setSize(W, H, false); r.setClearColor(0x000000, 0); r.setRenderTarget(rt); r.clear(); r.render(world.scene, camera); r.setRenderTarget(null);
      const f = new Float32Array(W * H * 4); r.readRenderTargetPixels(rt, 0, 0, W, H, f); rt.dispose();
      depth = new Float32Array(W * H); ids = new Int16Array(W * H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const s = ((H - 1 - y) * W + x) * 4, p = y * W + x; if (f[s + 1] < 1) { depth[p] = -1; ids[p] = -1; } else { depth[p] = f[s]; ids[p] = Math.round(f[s + 1] - 10); } }
      for (const [n, m] of swaps) { if (m) { n.material.dispose(); n.material = m; } else n.visible = true; }
      world.water.material.dispose(); world.ground.material.dispose(); world.water.material = keep[0]; world.ground.material = keep[1]; world.sky.visible = true; world.scene.fog = fog;
    }
    return { w: W, h: H, rgba, depth, ids, ms: performance.now() - t0, ss };
  } finally {
    world.dispose(); extras.forEach((e) => e.dispose()); r.setSize(1, 1, false);
  }
}
export const passPictures = (res, want) => E.layers(res, want);
