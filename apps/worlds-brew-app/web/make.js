// Pixel Scape web build: one Make drawer for everything that makes something new (a real place, your own photo on
// the map, real buildings, the 3D library, a model file, a photo on a thing), and the links that open the Activity
// from Discord posts ("Open in Pixel Scape" on /terrain, "Add to my scene" on /model, "Remix in Pixel Scape" on renders).
import { isPhone } from "./phone.js";

const h = (tag, attrs, kids) => { const e = document.createElement(tag); for (const k in attrs || {}) { if (k === "text") e.textContent = attrs[k]; else if (k === "on") e.onclick = attrs[k]; else e.setAttribute(k, attrs[k]); } for (const c of kids || []) e.append(c); return e; };
const say = (m, err) => { try { window.__wb.setStatus(m, err); } catch (e) { /* not up */ } };
const hasSel = (W) => W.st.sel && W.st.sel !== W.NONE && W.st.scene.objs.includes(W.st.sel);

// "place|36.10000|-112.10000|10|Grand Canyon", "model|<id>", "scene|<id>" -> { kind, ... } (null when not ours)
export function parseIntent(s) {
  const p = String(s || "").split("|");
  if (p[0] === "place") { const lat = +p[1], lon = +p[2], km = +p[3]; if ([lat, lon, km].every(Number.isFinite) && Math.abs(lat) <= 85 && Math.abs(lon) <= 180 && km > 0 && km <= 60) return { kind: "place", lat, lon, km, name: (p.slice(4).join(" ") || "A place").slice(0, 80) }; return null; }
  if (p[0] === "model" && p[1]) return { kind: "model", id: p.slice(1).join("|").slice(0, 200) };
  if (p[0] === "scene" && /^\d+$/.test(p[1] || "")) return { kind: "scene", id: +p[1] };
  return null;
}

// a real place in Terrain Lab: centred, sized, previewed
export function openPlace(W, p) {
  W.openTerrainLab(); const TL = W.TL(); if (!TL) return false;
  TL.setPlace(p.name, p.lat, p.lon, p.km, p.km); TL.fitBox(); TL.preview(); return true;
}

async function wait(test, ms) { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = test(); if (v) return v; await new Promise((r) => setTimeout(r, 150)); } return test(); }

export async function runIntent(W, it) {
  if (!it) return false;
  if (it.kind === "place") {
    openPlace(W, it); say("Opened " + it.name + " in Terrain Lab");
    const net = await wait(() => window.__psNet && window.__psNet.ready && window.__psNet, 6000);   // a /terrain build opened here joins the server library
    if (net) net.sharePlace(it, true);
    return true;
  }
  if (it.kind === "model") {
    say("Finding the model in the 3D library...");
    try { const idx = await W.KIT.load(), m = idx.models.find((x) => x.id === it.id); if (!m) { say("That model is not in the 3D library any more", true); return false; } await W.addKitModel(m, null); return true; }
    catch (e) { say("3D library: " + (e.message || e), true); return false; }
  }
  if (it.kind === "scene") {
    const net = await wait(() => window.__psNet && window.__psNet.ready && window.__psNet, 10000);
    if (!net) { say("Remix works inside a Discord call in the server the render was posted in", true); return false; }
    net.send({ t: "open", id: it.id }); say("Opening the remix..."); return true;
  }
  return false;
}
export function startIntent() {
  const q = new URLSearchParams(location.search).get("open");   // ?open=place|... for local tests; Discord passes customId
  if (q) return parseIntent(q);
  return Promise.resolve(window.__psDiscord).then((d) => parseIntent(d && d.customId)).catch(() => null);
}

// pick a picture (on phones the picker offers the camera too) and wrap it on the selected thing
export function photoOnThing(W) {
  if (!hasSel(W) || W.st.sel.type === "light") { say("Select a thing first, then take or pick a photo to wrap on it", true); return; }
  const o = W.st.sel, inp = h("input", { type: "file", accept: "image/*" }); inp.style.display = "none";
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; inp.remove(); if (!f) return;
    try { o.img = await W.decodeImage(f.name || "photo.jpg", await f.arrayBuffer()); W.select(o); W.commit(); W.changed("val"); say("Photo on " + (o.type || "the thing")); }
    catch (e) { say("Could not read that photo: " + (e.message || e), true); }
  };
  document.body.appendChild(inp); inp.click();
}

export const MAKE = [
  { id: "place", title: "A real place", text: "Pick a spot on the map: real ground and satellite photo in 3D", run: (W) => W.openTerrainLab() },
  { id: "myphoto", title: "My photo on the map", text: "Your own aerial photo or drone shot draped over the real ground", run: (W) => { W.openTerrainLab(); const TL = W.TL(); TL.tl.photo = "my"; TL.changed(); TL.myp.pickAndLoad(); } },
  { id: "buildings", title: "Real buildings", text: "Terrain Lab with real building outlines and heights switched on", run: (W) => { W.openTerrainLab(); const TL = W.TL(); TL.tl.bld = "on"; TL.changed(); TL.ui.refreshAll(); } },
  { id: "kit", title: "3D library", text: "Thousands of free models: trees, ships, chairs, creatures...", run: (W, phone) => {
    if (phone && isPhone() && phone.open !== "lib") phone.show("lib");
    const q = document.querySelector('[data-key="view.kitQ"]'); if (q) { q.scrollIntoView({ block: "center" }); setTimeout(() => { try { q.focus(); } catch (e) { /* ok */ } }, 300); }
  } },
  { id: "import", title: "A model file", text: "Your own .glb, .gltf, .obj or .stl", run: (W) => W.importModel() },
  { id: "photo", title: "Photo on a thing", text: "Take or pick a photo and wrap it on the selected thing", run: (W) => photoOnThing(W) },
];

export function makeDrawer(W, phone) {
  const wrap = document.getElementById("vpwrap"); if (!wrap) return null;
  const btn = h("button", { type: "button", class: "ps-make-btn", title: "Make something new: a real place, your photo, buildings, a model..." }, ["Make"]);
  const box = h("div", { class: "ps-make", hidden: "", role: "dialog", "aria-label": "Make" });
  const close = () => { box.setAttribute("hidden", ""); btn.setAttribute("aria-pressed", "false"); };
  const open = () => { if (phone && phone.open && phone.open !== "pad") phone.show(phone.open); box.removeAttribute("hidden"); btn.setAttribute("aria-pressed", "true"); };
  btn.onclick = () => (box.hasAttribute("hidden") ? open() : close());
  const cards = MAKE.map((m) => h("button", { type: "button", class: "ps-make-card", "data-make": m.id, on: () => { close(); try { m.run(W, phone); } catch (e) { say(String(e.message || e), true); } } }, [h("b", { text: m.title }), h("span", { text: m.text })]));
  box.append(h("div", { class: "ps-make-head" }, [h("b", { text: "Make" }), h("button", { type: "button", class: "ps-make-x", title: "Close", on: close }, ["×"])]), h("div", { class: "ps-make-cards" }, cards));
  wrap.append(btn); (document.getElementById("app") || document.body).append(box);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !box.hasAttribute("hidden")) { e.stopImmediatePropagation(); close(); } }, true);
  return { open, close, box, btn };
}
