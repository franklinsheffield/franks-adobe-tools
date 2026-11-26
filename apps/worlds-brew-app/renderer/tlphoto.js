// Pixel Scape Terrain Lab 0.13 "My photo" (Frank 2026-11-26: "go"): put your own picture on the terrain.
//  - a GeoTIFF, or a JPG / PNG / TIFF with its world file (.jgw .pgw .tfw ... and .prj), lands at its real place by itself
//  - a drone photo looking straight down (DJI-style GPS, height, lens, heading) is placed from those, roughly
//  - any photo can be pinned: click a spot on the photo, then the same spot on the map (2 pins: move / turn / size,
//    3: also stretch, 4 or more: also perspective, for shots taken at an angle)
// The photo goes over the satellite picture (which still fills anything the photo doesn't cover).
const req = window.require;
const path = req("path"), fs = req("fs");
const M = req("../geo/myphoto.js"), P = req("../geo/proj.js");
const { el } = req("../engine/kit/ui.js");

const IMG = /\.(jpe?g|png|webp|tiff?)$/i, WF_EXT = { jpg: ["jgw", "jpgw", "wld"], jpeg: ["jgw", "jpgw", "wld"], png: ["pgw", "pngw", "wld"], webp: ["wld"], tif: ["tfw", "tifw", "wld"], tiff: ["tfw", "tifw", "wld"] };
const MAX = 8192;   // longest side kept in memory (bigger pictures are shrunk on loading)
const PIN_COL = ["#5effc8", "#ffd166", "#ff7aa2", "#7ab8ff", "#c38bff", "#ffb36b", "#9cff6b", "#ff6b6b"];

// a JPG / PNG / WebP -> RGBA (shrunk to MAX), and how much it was shrunk
async function decodeRaster(buf) {
  const bmp = await createImageBitmap(new Blob([buf]));
  const k = Math.max(1, Math.max(bmp.width, bmp.height) / MAX), w = Math.round(bmp.width / k), h = Math.round(bmp.height / k);
  const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.drawImage(bmp, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h); bmp.close && bmp.close();
  return { w, h, d: new Uint8Array(d.data.buffer), srcW: bmp.width || w * k, srcH: bmp.height || h * k };
}
// a world file for the full-size picture -> the same for the shrunk one (pixel centres move with the scale)
function scaleWF(wf, sx, sy) {
  const [A, D, B, E, C, F] = wf;
  return [A * sx, D * sx, B * sy, E * sy, C + A * (sx - 1) / 2 + B * (sy - 1) / 2, F + D * (sx - 1) / 2 + E * (sy - 1) / 2];
}
export const toCanvas = (pic) => { const c = document.createElement("canvas"); c.width = pic.w; c.height = pic.h; const g = c.getContext("2d"), im = g.createImageData(pic.w, pic.h); im.data.set(pic.d); g.putImageData(im, 0, 0); return c; };

export function createMyPhoto(T) {
  const { ui, btn, st, tl, say, glow } = T;
  st.my = null;
  let cache = { key: "", pic: null };

  // ---- loading
  async function pickAndLoad() {
    const r = await T.ipcRenderer.invoke("dlg:open", { title: "Your photo (with its world file and .prj, if it has them)", multi: true,
      filters: [{ name: "Pictures and world files", extensions: ["jpg", "jpeg", "png", "webp", "tif", "tiff", "jgw", "jpgw", "pgw", "pngw", "tfw", "tifw", "wld", "prj"] }] });
    if (r && r.length) await load(r);
  }
  async function load(paths) {
    const img = paths.find((p) => IMG.test(p)); if (!img) return say("Pick a picture: JPG, PNG, WebP or TIFF (GeoTIFF works best).", true);
    say("Reading " + path.basename(img) + "...");
    try {
      const buf = fs.readFileSync(img), name = path.basename(img), ext = path.extname(img).slice(1).toLowerCase(), stem = img.slice(0, -ext.length - 1);
      let pic, spec = null, notes = [], exif = null, crsNote = "";
      if (ext === "tif" || ext === "tiff") {
        const t = M.decodeTIFF(buf, MAX); pic = t;
        if (t.geo) { const crs = M.crsFromEPSG(t.geo.epsg); if (crs) { spec = { kind: "world", wf: t.geo.wf, crs }; crsNote = "EPSG " + t.geo.epsg; } else notes.push("its map projection (EPSG " + t.geo.epsg + ") isn't supported yet, so pin it"); }
      } else { pic = await decodeRaster(buf); if (ext === "jpg" || ext === "jpeg") exif = M.readEXIF(buf); }
      if (!spec) {   // a world file next to it (picked together, or in the same folder)
        const near = (exts) => { for (const e of exts) { const hit = paths.find((p) => p.toLowerCase() === (stem + "." + e).toLowerCase()) || [stem + "." + e, stem + "." + e.toUpperCase()].find((p) => fs.existsSync(p)); if (hit) return hit; } return null; };
        const wfp = near(WF_EXT[ext] || ["wld"]), prj = near(["prj"]);
        if (wfp) {
          const wf = M.worldFile(fs.readFileSync(wfp, "utf8"));
          if (wf) {
            let crs = prj ? M.crsFromPrj(fs.readFileSync(prj, "utf8")) : null; if (!crs) crs = M.guessCRS(wf[4], wf[5], tl.lon, tl.lat);
            if (crs) { spec = { kind: "world", wf: pic.srcW && pic.srcW !== pic.w ? scaleWF(wf, pic.srcW / pic.w, pic.srcH / pic.h) : wf, crs }; crsNote = path.basename(wfp) + (crs.guessed ? " (projection guessed: " + crs.kind.toUpperCase() + (crs.zone ? " zone " + crs.zone : "") + ")" : ""); }
          }
        }
      }
      if (!spec && exif) { const c = M.droneCorners(exif, pic.w, pic.h); if (c) spec = { kind: "pins", pins: c, auto: "drone" }; }
      const place = spec ? M.placement(spec, pic.w, pic.h) : null;
      st.my = { name, pic, spec, place, exif, crsNote, notes, canvas: null };
      tl.photo = "my"; cache.key = "";
      if (place) {
        const F = P.boxFrame(T.box()), c = F.local(place.centre.lon, place.centre.lat), inside = Math.abs(c.x) < T.box().w / 2 && Math.abs(c.z) < T.box().d / 2;
        say(name + ": " + describe() + ".");
        if (!inside) return boxToPhoto(stem);
        T.changed(); if (!st.data) T.preview();
      } else if (exif && exif.lat != null) {
        T.setPlace(path.basename(stem), exif.lat, exif.lon); T.changed(); await T.preview();
        say(name + " was taken here (its GPS). Press Pin... and match 3 spots on the photo and the map to lay it on the ground.");
      } else { T.changed(); say(name + " has no position" + (notes.length ? " (" + notes[0] + ")" : "") + ". Move the box to the place, press Preview, then Pin... to match spots on the photo and the map."); }
    } catch (err) { say("Couldn't use that picture: " + String(err.message || err), true); }
    ui.refreshAll();
  }
  function describe() {
    const m = st.my; if (!m) return "no photo loaded";
    if (!m.place) return "not placed yet: press Pin...";
    const res = m.place.mpp < 1 ? m.place.mpp.toFixed(2) + " m" : m.place.mpp.toFixed(1) + " m";
    if (m.spec.kind === "world") return "placed from its map position (" + m.crsNote + "), " + res + " pixels";
    if (m.spec.auto === "drone") return "placed from the drone's GPS, height, lens and heading (about right: pin it for a close fit), " + res + " pixels";
    return "pinned (" + m.spec.pins.length + " pins, " + ({ similar: "move, turn and size", affine: "stretch", perspective: "perspective" })[m.place.kind] + (m.place.rms != null ? ", pins miss by " + m.place.rms.toFixed(1) + " m on average" : "") + "), " + res + " pixels";
  }
  // the four photo corners on the ground
  function footprint() { const m = st.my; if (!m || !m.place) return null; const { w, h } = m.pic; return [[0, 0], [w, 0], [w, h], [0, h]].map(([u, v]) => m.place.pxToLonLat(u, v)); }
  function boxToPhoto(stem) {
    const fp = footprint(); if (!fp) return say("Place the photo first (Pin...).", true);
    const lons = fp.map((p) => p.lon), lats = fp.map((p) => p.lat), b = P.boxFromBounds(Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats));
    tl.turn = 0; T.setPlace(stem ? path.basename(stem) : null, b.lat, b.lon, Math.max(0.5, Math.min(50, b.w / 1000)), Math.max(0.5, Math.min(50, b.d / 1000)));
    T.changed(); return T.preview();
  }

  // ---- the texture: the photo over the satellite / height-colour picture
  function compose(base, box) {
    const m = st.my; if (tl.photo !== "my" || !m || !m.place || !base) return base;
    const key = [JSON.stringify(m.spec), box.lat, box.lon, box.w, box.d, box.turn, base.w, base.h, m.name].join("|");
    if (cache.key === key && cache.base === base) return cache.pic;
    const r = M.render(m.place, box, base.w, base.h, m.pic), out = new Uint8Array(base.d);
    for (let i = 0; i < out.length; i += 4) { const a = r.d[i + 3] / 255; if (!a) continue; for (let c = 0; c < 3; c++) out[i + c] = r.d[i + c] * a + out[i + c] * (1 - a); out[i + 3] = 255; }
    m.cover = r.cover; cache = { key, base, pic: { w: base.w, h: base.h, d: out, missing: 0 } };
    return cache.pic;
  }
  function info() {
    const m = st.my; if (tl.photo !== "my" || !m || !m.place) return null;
    return { file: m.name, placed: m.spec.kind === "world" ? "map position" : m.spec.auto === "drone" ? "drone GPS" : m.place.kind + " pins", metresPerPixel: +m.place.mpp.toFixed(3),
      pinsMissM: m.place.rms != null ? +m.place.rms.toFixed(2) : undefined, coversBox: m.cover != null ? +(m.cover * 100).toFixed(1) + "%" : undefined, spec: m.spec };
  }

  // ---- the card rows
  const myLine = el("div", { class: "hint" });
  ui.bind(() => { const m = st.my; myLine.textContent = !m ? "Load a photo: a GeoTIFF (or JPG / PNG with its world file) lands by itself; a drone shot uses its GPS; anything else can be pinned." : m.name + ": " + describe() + (m.cover != null && m.place ? ". Covers " + Math.round(m.cover * 100) + "% of the box." : "."); });
  const rows = el("div", { class: "tlmy" }, [
    el("div", { class: "row wrap" }, [btn("Load photo...", () => pickAndLoad()), btn("Pin...", () => openPins()), btn("Box to photo", () => boxToPhoto())]), myLine]);
  ui.showIf(rows, () => tl.photo === "my");

  // ---- the pin aligner: the photo on the left, the box (satellite / height colours) on the right
  let pin = null;
  function openPins() {
    const m = st.my; if (!m) return say("Load a photo first.", true);
    if (!st.data) return say("Press Preview first, so there's a picture of the box to pin against.", true);
    const base = T.basePicture(); if (!base) return say("Press Preview first.", true);
    if (!m.canvas) m.canvas = toCanvas(m.pic);
    const pins = m.spec && m.spec.kind === "pins" && !m.spec.auto ? m.spec.pins.map((p) => Object.assign({}, p)) : [];
    const box = st.data.box, F = P.boxFrame(box), ref = toCanvas(base);
    const cL = el("canvas", { class: "tlpincv" }), cR = el("canvas", { class: "tlpincv" }), infoL = el("div", { class: "tlpininfo" });
    const views = { photo: { c: cL, img: m.canvas, s: 1, ox: 0, oy: 0 }, ref: { c: cR, img: ref, s: 1, ox: 0, oy: 0 } };
    let pending = null, overlay = true, warp = null, warpKey = "";
    const done = btn("Done", () => finish(true), "btn"), cancel = btn("Cancel", () => finish(false), "btn");
    const ovBtn = btn("Overlay", (b) => { overlay = !overlay; b.classList.toggle("on", overlay); draw(); }); ovBtn.classList.add("on");
    const node = el("div", { class: "tlpin" }, [
      el("div", { class: "tlpinbar" }, [el("div", { class: "ctitle", text: "PIN THE PHOTO  -  CLICK A SPOT ON THE PHOTO, THEN THE SAME SPOT ON THE MAP" }),
        el("div", { class: "tlpinbtns" }, [btn("Undo pin", () => { if (pending) pending = null; else pins.pop(); changedPins(); }), btn("Clear pins", () => { pins.length = 0; pending = null; changedPins(); }), ovBtn, done, cancel])]),
      el("div", { class: "tlpinpanes" }, [
        el("div", { class: "tlpane" }, [el("div", { class: "tlcap ctitle", text: "YOUR PHOTO  -  " + m.name.toUpperCase() }), el("div", { class: "tlcanvas" }, [cL])]),
        el("div", { class: "tlpane" }, [el("div", { class: "tlcap ctitle", text: "THE BOX  -  SCROLL TO ZOOM, DRAG TO MOVE" }), el("div", { class: "tlcanvas" }, [cR])])]),
      infoL]);
    T.root.appendChild(node);
    const fit = (v) => { const W = v.c.clientWidth, H = v.c.clientHeight; v.c.width = W; v.c.height = H; v.s = Math.min(W / v.img.width, H / v.img.height) * 0.96; v.ox = (W - v.img.width * v.s) / 2; v.oy = (H - v.img.height * v.s) / 2; };
    // box picture pixel <-> lon / lat
    const refToLL = (x, y) => F.at(x / ref.width, y / ref.height), llToRef = (lon, lat) => { const q = F.local(lon, lat); return [(q.x / box.w + 0.5) * ref.width, (q.z / box.d + 0.5) * ref.height]; };
    function current() { const spec = { kind: "pins", pins }; return pins.length >= 2 ? M.placement(spec, m.pic.w, m.pic.h) : null; }
    function changedPins() { const pl = current();
      infoL.textContent = (pending ? "Now click the same spot on the " + (pending.side === "photo" ? "map (right)." : "photo (left).") + "  " : "") +
        (pins.length < 2 ? pins.length + " pin" + (pins.length === 1 ? "" : "s") + ". Add at least 2 (3 or more is better; 4+ also fixes perspective for photos taken at an angle)."
          : pins.length + " pins: " + ({ similar: "move, turn and size", affine: "stretch", perspective: "perspective" })[pl ? pl.kind : "similar"] + (pl && pl.rms != null ? ". The pins miss by " + pl.rms.toFixed(1) + " m on average" + (pl.rms > 15 ? " (check for a pin in the wrong place)" : "") : "") + ". Done puts the photo on the terrain.");
      done.disabled = pins.length < 2 || !pl; draw(); }
    function draw() {
      for (const side of ["photo", "ref"]) {
        const v = views[side], g = v.c.getContext("2d"); g.fillStyle = "#03060a"; g.fillRect(0, 0, v.c.width, v.c.height);
        g.imageSmoothingEnabled = v.s < 2; g.drawImage(v.img, v.ox, v.oy, v.img.width * v.s, v.img.height * v.s);
        if (side === "ref" && overlay && pins.length >= 2) {
          const key = JSON.stringify(pins); if (key !== warpKey) { const pl = current(); warp = pl ? toCanvas(M.render(pl, box, ref.width, ref.height, m.pic)) : null; warpKey = key; }
          if (warp) { g.globalAlpha = 0.55; g.drawImage(warp, v.ox, v.oy, ref.width * v.s, ref.height * v.s); g.globalAlpha = 1; }
        }
        const pt = (p) => { const [x, y] = side === "photo" ? [p.u, p.v] : llToRef(p.lon, p.lat); return [v.ox + x * v.s, v.oy + y * v.s]; };
        const mark = (xy, col, label) => { g.lineWidth = 2; g.strokeStyle = "#000"; g.beginPath(); g.arc(xy[0], xy[1], 8, 0, 7); g.stroke(); g.strokeStyle = col; g.beginPath(); g.arc(xy[0], xy[1], 7, 0, 7); g.moveTo(xy[0] - 11, xy[1]); g.lineTo(xy[0] - 3, xy[1]); g.moveTo(xy[0] + 3, xy[1]); g.lineTo(xy[0] + 11, xy[1]); g.moveTo(xy[0], xy[1] - 11); g.lineTo(xy[0], xy[1] - 3); g.moveTo(xy[0], xy[1] + 3); g.lineTo(xy[0], xy[1] + 11); g.stroke();
          g.font = "bold 12px -apple-system, sans-serif"; g.fillStyle = "#000"; g.fillText(label, xy[0] + 10, xy[1] - 8); g.fillStyle = col; g.fillText(label, xy[0] + 9, xy[1] - 9); };
        pins.forEach((p, i) => mark(pt(p), PIN_COL[i % PIN_COL.length], String(i + 1)));
        if (pending && pending.side === side) mark(pt(pending), "#ffffff", String(pins.length + 1) + "?");
      }
    }
    for (const side of ["photo", "ref"]) {
      const v = views[side]; let down = null;
      v.c.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY, ox: v.ox, oy: v.oy, moved: false }; v.c.setPointerCapture(e.pointerId); });
      v.c.addEventListener("pointermove", (e) => { if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.abs(dx) + Math.abs(dy) > 4) down.moved = true; if (down.moved) { v.ox = down.ox + dx; v.oy = down.oy + dy; draw(); } });
      v.c.addEventListener("pointerup", (e) => {
        const d0 = down; down = null; if (!d0 || d0.moved) return;
        const r = v.c.getBoundingClientRect(), x = (e.clientX - r.left - v.ox) / v.s, y = (e.clientY - r.top - v.oy) / v.s;
        if (x < 0 || y < 0 || x > v.img.width || y > v.img.height) return;
        const here = side === "photo" ? { side, u: x * m.pic.w / v.img.width, v: y * m.pic.h / v.img.height } : Object.assign({ side }, refToLL(x, y));
        if (pending && pending.side !== side) { const a = pending.side === "photo" ? pending : here, b = pending.side === "photo" ? here : pending; pins.push({ u: +a.u.toFixed(2), v: +a.v.toFixed(2), lon: +b.lon.toFixed(7), lat: +b.lat.toFixed(7) }); pending = null; }
        else pending = here;
        changedPins();
      });
      v.c.addEventListener("wheel", (e) => { e.preventDefault(); const r = v.c.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, k = Math.exp(-e.deltaY * 0.0015), s = Math.max(0.02, Math.min(40, v.s * k));
        v.ox = mx - (mx - v.ox) * s / v.s; v.oy = my - (my - v.oy) * s / v.s; v.s = s; draw(); }, { passive: false });
    }
    function finish(ok) {
      if (ok) { const pl = current(); if (!pl) return; m.spec = { kind: "pins", pins: pins.slice() }; m.place = pl; cache.key = ""; }
      node.remove(); pin = null; if (ok) { T.changed(); say(m.name + ": " + describe() + "."); }
      ui.refreshAll();
    }
    pin = { node, finish, pins, views, refToLL, llToRef, add: (u, v, lon, lat) => { pins.push({ u, v, lon, lat }); changedPins(); } };
    requestAnimationFrame(() => { fit(views.photo); fit(views.ref); changedPins(); });
    return pin;
  }

  return { rows, load, pickAndLoad, openPins, boxToPhoto, compose, footprint, info, describe, get pin() { return pin; } };
}
