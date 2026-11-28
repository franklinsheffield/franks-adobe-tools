// Pixel Scape web build: the 3.1 ease-of-use layer (browser + Discord only; the desktop app is unchanged).
//  - start screen: a real place, a blank world, something from a library, or the call's shared build
//  - bigger move / turn / size handles on touch screens
//  - auto quality: if the view stutters while you move around, it renders fewer pixels; it sharpens again when it can
//  - Explore mode: hides the panels, then fly or walk through the world (WASD / Q E / arrows, or the on-screen pad)
//  - long-press the ground to ping a spot for everyone in the call
//  - three first-time tips (remembered in this browser)
import { isPhone, lightRender } from "./phone.js";
import { mark, onDraw } from "./marks.js";
import { makeDrawer, startIntent, runIntent } from "./make.js";
import { startSeer } from "./seer.js";

const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private window */ } } };
const coarse = () => window.matchMedia("(pointer: coarse)").matches;
const q = () => new URLSearchParams(location.search);
const h = (tag, attrs, kids) => { const e = document.createElement(tag); for (const k in attrs || {}) { if (k === "text") e.textContent = attrs[k]; else if (k === "on") e.onclick = attrs[k]; else e.setAttribute(k, attrs[k]); } for (const c of kids || []) e.append(c); return e; };
const say = (m, err) => { try { window.__wb.setStatus(m, err); } catch (e) { /* not up */ } };

// ---- bigger gizmo handles on touch screens
export function bigHandles(W) {
  const mq = window.matchMedia("(pointer: coarse)"), set = () => { W.vp.tc.setSize(mq.matches ? 1.6 : 0.9); W.vp.dirty = true; };
  mq.addEventListener ? mq.addEventListener("change", set) : mq.addListener(set); set();
}

// ---- auto quality: watch the frame gaps while the view is redrawing every frame
export const Q_STEPS = [1, 0.8, 0.65, 0.5];
export function autoQuality(W, opt = {}) {
  let i = 0, last = 0, gaps = [], calmUntil = 0;
  const apply = () => { window.__psQ = Q_STEPS[i]; lightRender(window, isPhone()); W.vp.dirty = true; };
  const st = { get level() { return i; }, set(n) { i = Math.max(0, Math.min(Q_STEPS.length - 1, n)); apply(); } };
  onDraw((t) => {
    const gap = t - last; last = t;
    if (gap > 250) { gaps = []; return; }   // the view was idle: not a frame rate
    gaps.push(gap); if (gaps.length < (opt.frames || 40)) return;
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length; gaps = [];
    if (avg > (opt.slow || 45) && i < Q_STEPS.length - 1) { i++; apply(); calmUntil = performance.now() + 8000; say("Auto quality: fewer pixels for smoother motion (" + Math.round(Q_STEPS[i] * 100) + "% sharpness)"); }
    else if (avg < (opt.fast || 20) && i > 0 && performance.now() > calmUntil) { i--; apply(); calmUntil = performance.now() + 8000; }
  });
  window.__psQuality = st; return st;
}

// ---- Explore mode
export function explore(W, phone) {
  const body = document.body, held = new Set(); let on = false, walk = false, lastT = 0, raf = 0;
  const wrap = document.getElementById("vpwrap");
  const modeBtn = h("button", { type: "button", class: "ps-mode", title: "Explore: hide the panels and fly or walk through your world", on: () => set(!on) }, ["Explore"]);
  const pad = h("div", { class: "ps-xpad", hidden: "" });
  const hold = (key, label, title) => {
    const b = h("button", { type: "button", "data-k": key, title }, [label]);
    const up = () => { held.delete(key); }; b.addEventListener("pointerdown", (e) => { e.preventDefault(); held.add(key); tick(); });
    b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("pointerleave", up); return b;
  };
  const kind = h("button", { type: "button", class: "ps-xkind", title: "Walk on the ground, or fly freely", on: () => setWalk(!walk) }, ["Fly"]);
  pad.append(kind, h("div", { class: "ps-xgrid" }, [hold("q", "⤓", "Down (Q)"), hold("w", "▲", "Forward (W)"), hold("e", "⤒", "Up (E)"),
    hold("arrowleft", "↺", "Turn left (arrow)"), hold("s", "▼", "Back (S)"), hold("arrowright", "↻", "Turn right (arrow)")]),
  h("div", { class: "ps-xhint", text: coarse() ? "Hold to move. Drag the view to look around." : "WASD to move, Q / E down and up, arrows to turn, drag to look." }));
  if (wrap) wrap.append(modeBtn, pad);

  const cam = () => W.st.scene.cam, rad = Math.PI / 180;
  const eye = (c) => ({ x: c.tx + Math.sin(c.yaw * rad) * Math.cos(c.pitch * rad) * c.dist, y: c.ty + Math.sin(c.pitch * rad) * c.dist, z: c.tz + Math.cos(c.yaw * rad) * Math.cos(c.pitch * rad) * c.dist });
  const lookFrom = (c, e) => { c.tx = e.x - Math.sin(c.yaw * rad) * Math.cos(c.pitch * rad) * c.dist; c.ty = e.y - Math.sin(c.pitch * rad) * c.dist; c.tz = e.z - Math.cos(c.yaw * rad) * Math.cos(c.pitch * rad) * c.dist; };
  const groundAt = (x, z) => { const g = W.CT.groundHit(W.st.scene, { ox: x, oy: 300, oz: z, dx: 0, dy: -1, dz: 0 }, null); return g ? g.y : 0; };
  const keepOnGround = (c) => { const e = eye(c); e.y = groundAt(e.x, e.z) + 1.6; lookFrom(c, e); };

  function setWalk(v) {
    walk = v; kind.textContent = walk ? "Walk" : "Fly"; pad.classList.toggle("walk", walk);
    const c = cam();
    if (walk) { const g = { x: c.tx, z: c.tz }; c.pitch = 4; c.dist = 2.5; lookFrom(c, { x: g.x, y: 0, z: g.z }); keepOnGround(c); say("Walk: you are on the ground"); }
    else say("Fly: move freely");
    W.changed("view");
  }
  function set(v) {
    on = v; body.classList.toggle("ps-explore", on); modeBtn.textContent = on ? "Build" : "Explore"; modeBtn.setAttribute("aria-pressed", String(on));
    if (on) { pad.removeAttribute("hidden"); if (phone && phone.open) phone.show(phone.open); W.select(null); say("Explore: panels hidden. Build brings them back."); }
    else { pad.setAttribute("hidden", ""); held.clear(); if (walk) setWalk(false); }
    window.dispatchEvent(new Event("resize")); requestAnimationFrame(() => W.changed("view"));
  }
  function tick() {
    if (raf) return; lastT = performance.now();
    const step = (t) => {
      raf = 0; if (!on || !held.size) return;
      const dt = Math.min(0.25, (t - lastT) / 1000); lastT = t;
      const c = cam(), sp = walk ? 4 : Math.max(3, c.dist * 0.8), f = (held.has("w") ? 1 : 0) - (held.has("s") ? 1 : 0), r = (held.has("d") ? 1 : 0) - (held.has("a") ? 1 : 0);
      const u = walk ? 0 : (held.has("e") ? 1 : 0) - (held.has("q") ? 1 : 0), turn = (held.has("arrowleft") ? 1 : 0) - (held.has("arrowright") ? 1 : 0);
      if (turn) { const e = eye(c); c.yaw = +(c.yaw + turn * 70 * dt).toFixed(2); lookFrom(c, e); }
      if (f || r || u) W.CT.camPan(c, r * sp * dt, f * sp * dt, u * sp * dt);
      if (walk) keepOnGround(c);
      W.changed("view"); raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  const KEYS = new Set(["w", "a", "s", "d", "q", "e", "arrowleft", "arrowright", "arrowup", "arrowdown"]);
  const keyOf = (e) => { const k = String(e.key || "").toLowerCase(); return k === "arrowup" ? "w" : k === "arrowdown" ? "s" : k; };
  window.addEventListener("keydown", (e) => {
    if (!on || e.metaKey || e.ctrlKey || /INPUT|SELECT|TEXTAREA/.test((e.target && e.target.tagName) || "")) return;
    if (e.key === "Escape") { set(false); e.stopImmediatePropagation(); return; }
    const k = String(e.key || "").toLowerCase(); if (!KEYS.has(k)) return;
    e.preventDefault(); e.stopImmediatePropagation(); held.add(keyOf(e)); tick();
  }, true);
  window.addEventListener("keyup", (e) => { held.delete(keyOf(e)); }, true);
  window.addEventListener("blur", () => held.clear());
  return { set, setWalk, get on() { return on; }, get walk() { return walk; }, held };
}

// ---- long-press the ground to ping it for everyone in the call
export function longPressPing(W, ms = 550) {
  const cv = document.getElementById("vp"); if (!cv) return;
  let t = null, at = null, n = 0;
  const cancel = () => { clearTimeout(t); t = null; };
  cv.addEventListener("pointerdown", (e) => {
    n++; cancel(); if (n > 1 || e.button > 0) return;
    at = { x: e.clientX, y: e.clientY };
    t = setTimeout(() => {
      t = null; const hit = W.vp.pick(at.x, at.y), p = hit && hit.obj.type !== "terrain" ? hit.point : W.CT.groundHit(W.st.scene, W.vp.rayAt(at.x, at.y), null);
      if (!p) return;
      const net = window.__psNet;
      if (navigator.vibrate) try { navigator.vibrate(15); } catch (err) { /* ok */ }
      if (net && net.ping(p)) return;
      mark("ping:me", { x: p.x, y: p.y, z: p.z, label: "You", color: "#5effc8", cls: "ping", ttl: 4000 }); say("Pings show for everyone when you build together in a Discord call");
    }, ms);
  }, true);
  cv.addEventListener("pointermove", (e) => { if (t && at && Math.hypot(e.clientX - at.x, e.clientY - at.y) > 8) cancel(); }, true);
  const up = () => { n = Math.max(0, n - 1); cancel(); };
  cv.addEventListener("pointerup", up, true); cv.addEventListener("pointercancel", up, true);
}

// ---- start screen
export function startScreen(W, phone, opts = {}) {
  return new Promise((done) => {
    const net = window.__psNet, together = !!(net && net.ready && net.peers.size);
    const box = h("div", { class: "ps-start", role: "dialog", "aria-label": "Start" });
    const close = (why) => { box.remove(); document.removeEventListener("keydown", esc, true); done(why); };
    const esc = (e) => { if (e.key === "Escape") { e.stopImmediatePropagation(); close("sample"); } };
    const card = (id, title, text, fn, cls) => h("button", { type: "button", class: "ps-start-card" + (cls ? " " + cls : ""), "data-start": id, on: () => { close(id); fn(); } }, [h("b", { text: title }), h("span", { text: text })]);
    const lib = () => {
      if (net && net.ready) { if (!net.ui.libOpen) net.toggleLib(); say("Scenes saved by this server. Pick one to open it for everyone."); return; }
      if (phone && isPhone()) phone.show("lib");
      say("Pick a ready-made scene under Scenes, or a model from the 3D library");
      const s = document.getElementById("lib"); if (s) { s.classList.add("ps-flash"); setTimeout(() => s.classList.remove("ps-flash"), 1600); }
    };
    const rep = together ? " (replaces the shared scene)" : "";
    const cards = [];
    if (together) cards.push(card("join", "Join the build", "Carry on with " + [...net.peers.values()].map((p) => p.name).join(", ") + " in this call's shared scene", () => {}, "main"));
    cards.push(card("place", "A real place", "Pick a spot on the map and build its real ground, photo and buildings in 3D" + rep, () => W.openTerrainLab()));
    cards.push(card("blank", "Blank world", "An empty world with sky and ground, ready for shapes and models" + rep, () => { W.newScene(); }));
    cards.push(card("library", "From a library", net && net.ready ? "Open a scene saved by this server" : "Ready-made scenes and thousands of free 3D models", lib));
    if (!together) cards.push(card("sample", "Sample scene", "Start from the Chrome Garden scene that is open now", () => {}));
    box.append(h("div", { class: "ps-start-box" }, [h("div", { class: "ps-start-title", text: "Pixel Scape" }), h("div", { class: "ps-start-sub", text: "What do you want to build?" }),
      h("div", { class: "ps-start-cards" }, cards), h("button", { type: "button", class: "ps-start-x", title: "Close", on: () => close("sample") }, ["×"])]));
    (opts.parent || document.getElementById("app") || document.body).appendChild(box);
    document.addEventListener("keydown", esc, true);
  });
}

// ---- first-time tips
export const TIPS = () => [
  coarse() ? "Drag the view with one finger to look around. Pinch with two fingers to zoom, and drag with two to slide." : "Drag the view to look around, right-drag to slide, scroll to zoom.",
  isPhone() ? "Add has shapes, models and real places. Tap a thing to select it, then drag its big handles to move it." : "The Library on the left has shapes, models and real places. Click a thing to select it, then drag its handles.",
  "Long-press the ground to ping a spot for everyone in the call. Explore hides the panels so you can fly or walk through your world.",
];
export function coachMarks(force) {
  if (!force && store.get("ps.tips.v1")) return null;
  const tips = TIPS(); let i = 0;
  const wrap = document.getElementById("vpwrap") || document.body;
  const text = h("div", { class: "ps-tip-text" }), count = h("span", { class: "ps-tip-n" });
  const next = h("button", { type: "button", on: () => { i++; if (i >= tips.length) end(); else show(); } }, ["Next"]);
  const skip = h("button", { type: "button", class: "ghost", on: () => end() }, ["Skip tips"]);
  const tip = h("div", { class: "ps-tip", role: "status" }, [text, h("div", { class: "ps-tip-row" }, [count, skip, next])]);
  const show = () => { text.textContent = tips[i]; count.textContent = (i + 1) + " / " + tips.length; next.textContent = i === tips.length - 1 ? "Got it" : "Next"; };
  const end = () => { tip.remove(); store.set("ps.tips.v1", "1"); };
  show(); wrap.appendChild(tip); return { tip, end };
}

export async function startExtras(phone) {
  const W = window.__wb; if (!W || !W.vp) return null;
  bigHandles(W); const quality = autoQuality(W); const ex = explore(W, phone); longPressPing(W);
  const quiet = q().has("nostart");   // automated tests: Flint stays put until a test asks him
  const out = { quality, explore: ex, make: makeDrawer(W, phone), seer: startSeer(W, phone, quiet ? { mode: "off", hello: false } : {}) };
  window.__psExtras = out;
  const intent = await startIntent();   // opened from a Discord post's link: go straight there, no start screen
  if (intent) { out.intent = intent; out.choice = "link"; await runIntent(W, intent); coachMarks(); return out; }
  if (q().has("nostart")) return out;
  if (q().has("room") || q().has("frame_id")) {   // in a call: wait briefly for the room, so the screen can offer the shared build
    const t0 = Date.now(); while (Date.now() - t0 < 4000 && !(window.__psNet && (window.__psNet.ready || window.__psNet.closed))) await new Promise((r) => setTimeout(r, 150));
  }
  out.choice = await startScreen(W, phone);
  coachMarks();
  return out;
}
