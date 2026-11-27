// Pixel Scape web build: markers drawn over the 3D view (pings, where the others are looking) and a hook that runs
// after every viewport draw. Markers are plain HTML placed at a world point's screen position, so they cost no GPU.
const after = [];
const marks = new Map();
let hooked = null, layer = null;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");

function hook() {
  const W = window.__wb; if (!W || !W.vp || hooked === W.vp) return !!hooked;
  const vp = W.vp, draw = vp.draw.bind(vp);
  vp.draw = function () { draw(); const t = performance.now(); for (const f of after) { try { f(t); } catch (e) { console.error("[marks]", e); } } };
  hooked = vp; return true;
}
// run f(time) after every draw of the 3D view
export function onDraw(f) { hook(); after.push(f); }

function place() {
  if (!layer || !marks.size) return;
  const vp = window.__wb.vp, r = layer.parentElement.getBoundingClientRect();
  for (const m of marks.values()) {
    const p = vp.project(m.x, m.y, m.z), on = p.z > -1 && p.z < 1;
    m.el.style.display = on ? "" : "none";
    if (on) m.el.style.transform = "translate(" + Math.round(p.x - r.left) + "px," + Math.round(p.y - r.top) + "px)";
  }
}

// set (or with m = null remove) a marker: { x, y, z, label, color, cls, ttl (ms) }
export function mark(key, m) {
  const W = window.__wb; if (!W || !W.vp) return;
  if (!layer) {
    const wrap = document.getElementById("vpwrap"); if (!wrap) return;
    layer = document.createElement("div"); layer.className = "ps-marks"; wrap.appendChild(layer); onDraw(place);
  }
  let r = marks.get(key);
  if (!m) { if (r) { clearTimeout(r.t); r.el.remove(); marks.delete(key); } W.vp.dirty = true; return; }
  if (!r) { r = { el: document.createElement("div") }; marks.set(key, r); layer.appendChild(r.el); }
  const html = '<i></i><span>' + esc(m.label || "") + "</span>";
  Object.assign(r, { x: m.x, y: m.y, z: m.z });
  r.el.className = "ps-mark " + (m.cls || ""); r.el.style.setProperty("--c", m.color || "#5effc8");
  if (r.html !== html) { r.el.innerHTML = html; r.html = html; }
  if (m.cls === "ping") { r.el.classList.remove("go"); void r.el.offsetWidth; r.el.classList.add("go"); }   // restart the pulse
  clearTimeout(r.t); if (m.ttl) r.t = setTimeout(() => mark(key, null), m.ttl);
  W.vp.dirty = true;
}
export const hasMark = (key) => marks.has(key);
