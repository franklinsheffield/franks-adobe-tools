// Pixel Scape app: your own library (0.10, Frank 2026-11-25: "users add textures, terrain, and shaders",
// "a shaders importer, same for textures"). Everything lives in Documents/Pixel Scape/Library/:
//   Textures/  pictures (png jpg jpeg webp), imported one by one or as whole folders (sub-folders flattened)
//   Terrains/  heightmaps (png 8/16-bit, jpg) and terrains saved from the app (.wbterrain = { name, d: base64 float32 grid }),
//              and Terrain Lab builds (0.11): a folder with terrain.json, terrain.glb, height16.png, photo.jpg, thumb.jpg
//   Shaders/   GLSL files (.glsl .frag .fs: Shadertoy "mainImage" or GLSL-sandbox "main") and PBR material folders
//              (colour / height / normal / roughness / metal maps, found by file name)
// A GLSL shader is baked to a picture on the GPU and put on the object as a surface layer, so the live view,
// the ray tracer and Photoshop all show the same thing; the code stays on the layer so it can be baked again.
const req = window.require;
const fs = req("fs"), fsp = fs.promises, path = req("path"), { pathToFileURL } = req("url");
const S = req("../engine/scene.js");
const SF = req("../engine/surface.js");
const { decodePNG } = req("../engine/pngdec.js");

export const KINDS = ["Textures", "Terrains", "Shaders"];
const IMG = ["png", "jpg", "jpeg", "webp"], GLSL = ["glsl", "frag", "fs", "shader"];
const ext = (f) => path.extname(f).slice(1).toLowerCase();
let ROOT = null;
export function setRoot(documentsDir) {
  ROOT = path.join(documentsDir, "Pixel Scape", "Library");
  KINDS.forEach((k) => fs.mkdirSync(path.join(ROOT, k), { recursive: true }));
  return ROOT;
}
export const root = () => ROOT;
export const dir = (kind) => path.join(ROOT, kind);
export const fileURL = (p) => pathToFileURL(p).href;

// ---- what is in the library
const PBR_KEYS = { colour: /(albedo|base_?colou?r|diffuse|diff|_col|colou?r)/i, height: /(height|disp|displacement|bump)/i, normal: /(normal|nrm|_nor)/i, rough: /(rough)/i, metal: /(metal)/i };
function pbrMaps(folder) {
  const out = {}, files = fs.readdirSync(folder).filter((f) => IMG.includes(ext(f))).sort();
  for (const f of files) for (const [k, re] of Object.entries(PBR_KEYS)) if (!out[k] && re.test(f) && !(k === "colour" && /(normal|rough|metal|height|disp)/i.test(f))) { out[k] = path.join(folder, f); break; }
  if (!out.colour && files.length === 1) out.colour = path.join(folder, files[0]);
  return out;
}
export function list(kind) {
  if (!ROOT) return [];
  const d = dir(kind), out = [];
  for (const f of fs.readdirSync(d).sort((a, b) => a.localeCompare(b))) {
    if (f[0] === ".") continue;
    const p = path.join(d, f), st = fs.statSync(p), name = f.replace(/\.[^.]+$/, "");
    if (kind === "Textures" && st.isFile() && IMG.includes(ext(f))) out.push({ kind, type: "image", name, path: p, thumb: fileURL(p) });
    else if (kind === "Terrains" && st.isDirectory() && fs.existsSync(path.join(p, "terrain.json"))) out.push({ kind, type: "geo", name: f, path: p, thumb: fs.existsSync(path.join(p, "thumb.jpg")) ? fileURL(path.join(p, "thumb.jpg")) : null });   // Terrain Lab builds
    else if (kind === "Terrains" && st.isFile() && (IMG.includes(ext(f)) || ext(f) === "wbterrain")) out.push({ kind, type: ext(f) === "wbterrain" ? "terrain" : "heightmap", name, path: p, thumb: ext(f) === "wbterrain" ? null : fileURL(p) });
    else if (kind === "Shaders" && st.isFile() && GLSL.includes(ext(f))) out.push({ kind, type: "glsl", name, path: p, thumb: null });
    else if (kind === "Shaders" && st.isDirectory()) { const m = pbrMaps(p); if (m.colour || m.height) out.push({ kind, type: "pbr", name: f, path: p, maps: m, thumb: fileURL(m.colour || m.height) }); }
  }
  return out;
}

// ---- importing: files or whole folders, copied into the library (names never overwrite: "Rock 2")
function freeName(d, base, e) { let n = base, i = 2; while (fs.existsSync(path.join(d, n + e))) n = base + " " + i++; return n; }
function pbrFolders(folder, out, depth) {
  depth = depth || 0; const m = pbrMaps(folder); if (m.colour || m.height) out.push([folder, m]);
  if (depth < 4) for (const f of fs.readdirSync(folder).sort()) { if (f[0] === ".") continue; const p = path.join(folder, f); if (fs.statSync(p).isDirectory()) pbrFolders(p, out, depth + 1); }
  return out;
}
function walk(folder, test, out) {
  for (const f of fs.readdirSync(folder)) { if (f[0] === ".") continue; const p = path.join(folder, f), st = fs.statSync(p); if (st.isDirectory()) walk(p, test, out); else if (test(f)) out.push(p); }
  return out;
}
export async function importPaths(kind, paths) {
  const added = [], skipped = [], d = dir(kind);
  const copy = async (src) => { const e = path.extname(src), n = freeName(d, path.basename(src, e), e.toLowerCase()); await fsp.copyFile(src, path.join(d, n + e.toLowerCase())); added.push(n); };
  for (const src of paths) {
    const st = fs.statSync(src);
    if (kind === "Shaders" && st.isDirectory()) {
      // this folder and every folder inside it that holds maps becomes its own PBR set (a parent of many sets works too)
      const sets = pbrFolders(src, []), glsl = walk(src, (f) => GLSL.includes(ext(f)), []);
      for (const [folder, m] of sets) { const n = freeName(d, path.basename(folder), ""); await fsp.mkdir(path.join(d, n)); for (const p of Object.values(m)) await fsp.copyFile(p, path.join(d, n, path.basename(p))); added.push(n); }
      for (const g of glsl) await copy(g);
      if (!sets.length && !glsl.length) skipped.push(path.basename(src));
      continue;
    }
    const ok = (f) => (kind === "Shaders" ? GLSL : kind === "Terrains" ? IMG.concat(["wbterrain"]) : IMG).includes(ext(f));
    if (st.isDirectory()) { const files = walk(src, ok, []); if (!files.length) skipped.push(path.basename(src)); for (const f of files) await copy(f); }
    else if (ok(src)) await copy(src); else skipped.push(path.basename(src));
  }
  return { added, skipped };
}

// ---- pictures (decode = the app's image decoder: (name, ArrayBuffer, maxSize) -> { w, h, d, name })
async function readBuf(p) { const b = await fsp.readFile(p); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); }
export async function picture(p, decode, max) { return decode(path.basename(p), await readBuf(p), max); }

// ---- terrains
export async function loadTerrain(entry, decode) {
  if (entry.type === "terrain") { const j = JSON.parse(await fsp.readFile(entry.path, "utf8")); const raw = atob(j.d), u = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) u[i] = raw.charCodeAt(i); return { id: j.id || "h" + Date.now().toString(36), name: j.name || entry.name, d: new Float32Array(u.buffer) }; }
  const buf = await readBuf(entry.path);
  if (ext(entry.path) === "png") { try { const dec = decodePNG(new Uint8Array(buf)); return S.heightFromPic(dec, entry.name); } catch (e) { /* interlaced etc: the browser decoder below */ } }
  return S.heightFromPic(await decode(entry.name, buf, 1024), entry.name);
}
// the terrain's final heights (shape + sculpt), 0..1, as a new library terrain
export async function saveTerrain(o, name) {
  const a = S.heightmap(o), N = S.HM_N, d = new Float32Array(N * N); let lo = Infinity, hi = -Infinity;
  for (let p = 0; p < N * N; p++) { lo = Math.min(lo, a[p]); hi = Math.max(hi, a[p]); }
  for (let p = 0; p < N * N; p++) d[p] = Math.max(0, a[p]) / (hi > 0 ? hi : 1);
  const n = freeName(dir("Terrains"), String(name || "Terrain").replace(/[^\w\- ]+/g, "").trim().slice(0, 60) || "Terrain", ".wbterrain");
  const u = new Uint8Array(d.buffer); let bin = ""; for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  await fsp.writeFile(path.join(dir("Terrains"), n + ".wbterrain"), JSON.stringify({ name: n, n: N, id: "h" + Date.now().toString(36), d: btoa(bin) }));
  return n;
}
// a small grey picture of a height grid (for library thumbnails)
export function terrainThumb(hm) {
  const N = S.HM_N, c = document.createElement("canvas"); c.width = c.height = N; const g = c.getContext("2d"), im = g.createImageData(N, N);
  for (let p = 0; p < N * N; p++) { const v = Math.round(255 * Math.max(0, Math.min(1, hm.d[p]))); im.data[p * 4] = v; im.data[p * 4 + 1] = Math.round(v * 0.95 + 8); im.data[p * 4 + 2] = Math.round(v * 0.85 + 20); im.data[p * 4 + 3] = 255; }
  g.putImageData(im, 0, 0); return c.toDataURL();
}

// ---- GLSL shaders: bake to a picture on the GPU
let GL = null;
function gl() {
  if (GL) return GL;
  const c = document.createElement("canvas"); const g = c.getContext("webgl2", { preserveDrawingBuffer: true, premultipliedAlpha: false });
  if (!g) throw new Error("This computer's graphics can't run GLSL shaders.");
  const buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
  GL = { c, g, cache: new Map() }; return GL;
}
// Shadertoy code (mainImage) runs as GLSL ES 3.00; GLSL-sandbox code (void main + gl_FragColor) as GLSL ES 1.00
export function wrapGLSL(code) {
  const src = String(code).replace(/^\s*#version.*$/m, "").replace(/^\s*precision\s+\w+\s+float\s*;/m, "");
  // uniforms the wrapper already declares: drop the shader's own copies (GLSL refuses a second declaration)
  const OWN = ["iResolution", "iTime", "iTimeDelta", "iFrame", "iMouse", "iDate", "time", "resolution", "mouse", "surfaceSize"];
  const clean = (t) => t.replace(/\buniform\s+(?:(?:lowp|mediump|highp)\s+)?\w+\s+(\w+)\s*;/g, (m, n) => (OWN.includes(n) ? "" : m)).replace(/\bvarying\s+(?:(?:lowp|mediump|highp)\s+)?vec2\s+surfacePosition\s*;/g, "");
  if (/void\s+mainImage\s*\(/.test(src)) return { es3: true, frag: `#version 300 es
precision highp float; precision highp int;
uniform vec3 iResolution; uniform float iTime; uniform float iTimeDelta; uniform int iFrame; uniform vec4 iMouse; uniform vec4 iDate;
out vec4 wbOut;
${clean(src)}
void main() { vec4 c = vec4(0.0, 0.0, 0.0, 1.0); mainImage(c, gl_FragCoord.xy); wbOut = vec4(clamp(c.rgb, 0.0, 1.0), 1.0); }` };
  if (/void\s+main\s*\(/.test(src)) return { es3: false, frag: `precision highp float;
uniform float time; uniform vec2 resolution; uniform vec2 mouse; uniform vec2 surfaceSize;
varying vec2 surfacePosition;
${clean(src)}` };
  throw new Error("No mainImage() or main() found. Pixel Scape reads Shadertoy-style shaders (mainImage) and GLSL-sandbox shaders (main + gl_FragColor).");
}
function program(code) {
  const { g, cache } = gl();
  if (cache.has(code)) return cache.get(code);
  const W = wrapGLSL(code);
  const vs = W.es3 ? "#version 300 es\nin vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }" : "attribute vec2 p; varying vec2 surfacePosition; void main(){ surfacePosition = p; gl_Position = vec4(p, 0.0, 1.0); }";
  const sh = (type, s) => { const x = g.createShader(type); g.shaderSource(x, s); g.compileShader(x); if (!g.getShaderParameter(x, g.COMPILE_STATUS)) { const log = g.getShaderInfoLog(x) || "compile error"; g.deleteShader(x); throw new Error("Shader error: " + log.split("\n").filter(Boolean).slice(0, 3).join(" | ")); } return x; };
  const pr = g.createProgram(); g.attachShader(pr, sh(g.VERTEX_SHADER, vs)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, W.frag)); g.bindAttribLocation(pr, 0, "p"); g.linkProgram(pr);
  if (!g.getProgramParameter(pr, g.LINK_STATUS)) throw new Error("Shader error: " + (g.getProgramInfoLog(pr) || "link failed"));
  const P = { pr, es3: W.es3 }; if (cache.size > 24) cache.clear(); cache.set(code, P); return P;
}
// -> { w, h, d (RGBA, top row first), name }
export function bakeGLSL(code, size, t, name) {
  size = size || 512; t = t || 0;
  const G = gl(), { g, c } = G, P = program(code);
  c.width = c.height = size; g.viewport(0, 0, size, size); g.useProgram(P.pr);
  const u = (n) => g.getUniformLocation(P.pr, n);
  if (P.es3) { g.uniform3f(u("iResolution"), size, size, 1); g.uniform1f(u("iTime"), t); g.uniform1f(u("iTimeDelta"), 1 / 30); g.uniform1i(u("iFrame"), Math.round(t * 30)); g.uniform4f(u("iMouse"), 0, 0, 0, 0); const D = new Date(); g.uniform4f(u("iDate"), D.getFullYear(), D.getMonth(), D.getDate(), 0); }
  else { g.uniform1f(u("time"), t); g.uniform2f(u("resolution"), size, size); g.uniform2f(u("mouse"), 0.5, 0.5); g.uniform2f(u("surfaceSize"), 2, 2); }
  g.enableVertexAttribArray(0); g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0); g.drawArrays(g.TRIANGLES, 0, 3);
  const raw = new Uint8Array(size * size * 4); g.readPixels(0, 0, size, size, g.RGBA, g.UNSIGNED_BYTE, raw);
  const d = new Uint8Array(size * size * 4), row = size * 4;
  for (let y = 0; y < size; y++) d.set(raw.subarray((size - 1 - y) * row, (size - y) * row), y * row);   // GL is bottom-up
  for (let i = 3; i < d.length; i += 4) d[i] = 255;
  return { w: size, h: size, d, name: name || "Shader" };
}
export function picURL(pic) {
  const c = document.createElement("canvas"); c.width = pic.w; c.height = pic.h; const g = c.getContext("2d"), im = g.createImageData(pic.w, pic.h); im.data.set(pic.d); g.putImageData(im, 0, 0); return c.toDataURL();
}

// ---- a shader -> the surface layers that put it on an object
export async function shaderLayers(entry, decode, o) {
  const wrap = o && o.type === "mesh" && o.mesh && o.mesh.uv ? "UV" : "Box";
  if (entry.type === "glsl") {
    const code = await fsp.readFile(entry.path, "utf8"), img = bakeGLSL(code, 512, 0, entry.name);
    return [SF.layer({ name: entry.name.slice(0, 30), img, wrap, shader: { name: entry.name, code, t: 0, size: 512, bt: 0, bs: 512 } })];
  }
  // PBR folder: colour layer (+ average roughness / metal as its shine) and a Relief layer from the height map
  const m = entry.maps || pbrMaps(entry.path), out = [];
  const avg = async (p) => { const pic = await picture(p, decode, 64); let s = 0; for (let i = 0; i < pic.d.length; i += 4) s += pic.d[i]; return s / (pic.d.length / 4) / 255; };
  const rough = m.rough ? await avg(m.rough) : 0.6, metal = m.metal ? await avg(m.metal) : 0;
  if (m.colour) out.push(SF.layer({ name: entry.name.slice(0, 24) + " colour", img: await picture(m.colour, decode, 1024), wrap, shine: true, rough: +rough.toFixed(2), metal: +metal.toFixed(2) }));
  if (m.height) out.push(SF.layer({ name: entry.name.slice(0, 24) + " relief", img: await picture(m.height, decode, 1024), wrap, blend: "Relief", bump: 1 }));
  else if (m.normal && m.colour) out[0].bump = 0.4;   // no height map: a light relief from the colour
  return out;
}
// bake a layer's shader again (another time or size), keeping everything else
export function rebake(L, t, size) {
  if (!L || !L.shader) return L;
  const sh = L.shader; sh.t = t == null ? sh.t || 0 : t; sh.size = size || sh.size || 512;
  L.img = bakeGLSL(sh.code, sh.size, sh.t, sh.name); sh.bt = sh.t; sh.bs = sh.size; return L;
}
