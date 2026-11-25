// Worlds Lab app: the app's end of the Photoshop bridge (phase 3). The file formats live in engine/bridge.js,
// shared with the Photoshop panel. Here: Node file I/O, sending a render, and watching for Photoshop's
// "Match document size" and "Send layer to Worlds Lab" files.
const req = window.require;
const fs = req("fs"), fsp = fs.promises, path = req("path");
const B = req("../engine/bridge.js");
const PNG = req("../engine/kit/png.js");

export const io = {
  read: async (p) => new Uint8Array(await fsp.readFile(p)),
  readText: (p) => fsp.readFile(p, "utf8"),
  write: (p, data) => fsp.writeFile(p, typeof data === "string" ? data : Buffer.from(data.buffer, data.byteOffset, data.byteLength)),
  mkdir: (p) => fsp.mkdir(p, { recursive: true }),
  list: (p) => fsp.readdir(p),
  stat: async (p) => { try { const s = await fsp.stat(p); return { mtime: s.mtimeMs }; } catch (e) { return null; } }
};
let ROOT = null;
export function setRoot(documentsDir) { ROOT = path.join(documentsDir, B.ROOT_NAME); return ROOT; }
export const root = () => ROOT;

/* res = { w, h, rgba, depth, ids } (a finished render), pics = engine.layers(res, ...) pictures; meta = { scene, engine, quality, app } */
export async function sendRender(pics, meta) {
  if (!ROOT) throw new Error("The bridge folder isn't set up yet.");
  const keyOf = { "Render": "render", "Depth": "depth", "Object mask": "mask", "Sky mask": "sky" };
  const files = pics.filter((p) => keyOf[p.name]).map((p) => ({ key: keyOf[p.name], png: p.png || PNG.encodePNG(p.rgba, meta.w, meta.h, 4) }));
  return B.writeRender(io, ROOT, meta, files);
}

/* Polls the bridge files (once a second) and calls back when Photoshop writes a new one.
   Existing files at start count as seen, so an old request is not replayed. */
export function watch(hooks) {
  const P = () => B.paths(ROOT), seen = {};
  let stopped = false, first = true;
  async function check(key, file, read, cb) {
    const s = await io.stat(file); if (!s) return;
    if (seen[key] === s.mtime) return; const was = seen[key]; seen[key] = s.mtime;
    if (first && was === undefined) return;
    const v = await read(); if (v && cb) cb(v);
  }
  async function poll() {
    if (stopped || !ROOT) return;
    try {
      await check("doc", P().docSize, () => B.readDocSize(io, ROOT), hooks.docSize);
      await check("pic", P().picture, () => B.readPicture(io, ROOT), hooks.picture);
    } catch (e) { /* a file mid-write: next poll */ }
    first = false;
    setTimeout(poll, hooks.every || 1000);
  }
  poll();
  return { stop() { stopped = true; }, poll };
}
// a picture Photoshop sent -> the { w, h, d, name } shape surface layers use
export async function loadPicture(p) {
  const dec = req("../engine/pngdec.js").decodePNG(await io.read(p.path));
  return { w: dec.w, h: dec.h, d: B.toRGBA(dec), name: p.name || "Photoshop layer" };
}
