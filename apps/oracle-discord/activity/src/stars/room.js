// Star Lore Navigator: a room of the Oracle Chamber. The Oracle asks you to find a constellation somewhere in the
// whole sky and draw it star to star before the clock runs out. The reward for a finished figure is its lore: a fable from one of
// several cultures, then the real astronomy. Run out of time and the story stays sealed: she sends you to study instead.
// Then the real astronomy and one quiz question. Level 1 shows every constellation's stick figure, level 2 shows none,
// level 3 is a photo-real sky (every star to magnitude 6 and the Milky Way). Drag to roam, pinch, wheel or +/− to zoom.
// Rules and maths in engine.js, constellations and fables in lore.js. Mounted via main.js ROOMS; sells sky themes on
// the Essence store's "🔭 Star Lore" shelf (store.js registerShelf).
import { STARS, FAINT, MILKY_WAY, LINES } from "./sky.gen.js";
import { GUIDE } from "./guide.js";
import { domeOpen, ping, gutter, shimmer, discover, darkness, verdict } from "./sfx.js";
import { LEVELS, DECK, ALL, keyOf, room as starsOf, foundCount, titleOf, nextTitle, byId, nextTarget, start, attempt, hintEdge, starsFor, partsTold,
  pickFable, quizChoices, answer, settle, drawPts, quizPts, startView, figureEdges, figureStars, figureCentre, toScreen, toSky, pan, zoom, onScreen,
  nearestStar, starByHip, edgeKey, galacticEquator, bestMonth, seenFrom, conName, nameOf, sep, KIND, THEMES, themeOf, fablesHeard, FABLE_COUNT, spin, timeFor } from "./engine.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const reducedMotion = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };

// ---- looks ----
const PAL = {
  "st-classic": { bg: ["#16246a", "#070b24"], line: "rgba(127,149,255,.45)", grid: "rgba(90,110,200,.35)", gold: "#FADE8C", ink: null },
  "st-redlight": { bg: ["#2a0606", "#0b0101"], line: "rgba(190,40,46,.5)", grid: "rgba(120,24,28,.5)", gold: "#ff8a7a", ink: "#ff4a3d" },
  "st-chalk": { bg: ["#24342c", "#141e19"], line: "rgba(230,236,230,.45)", grid: "rgba(110,130,118,.45)", gold: "#fff6c9", ink: "#f2f2ea" },
  "st-atlas": { bg: ["#efe0b9", "#cdb27c"], line: "rgba(122,79,34,.6)", grid: "rgba(150,110,60,.45)", gold: "#9b1c0c", ink: "#2a1a0c" },
  photo: { bg: ["#0b1230", "#010208"], line: "rgba(140,160,255,.35)", grid: "rgba(90,110,200,.25)", gold: "#FADE8C", ink: null },
};
for (const k of ["st-twinkle", "st-grid", "st-meteors", "st-milkyway"]) PAL[k] = PAL["st-classic"];
const bvColour = (bv) => bv < 0 ? "#a9c4ff" : bv < 0.3 ? "#e8eeff" : bv < 0.6 ? "#fff6e0" : bv < 1.0 ? "#ffe3a8" : bv < 1.4 ? "#ffc47a" : "#ff9a5c";

/** One sky on a canvas: view, looks, drawing state and effects. Used by the room and the store's try-on. */
class Sky {
  constructor(host, o) {
    this.host = host; this.o = o; this.view = o.view; this.t0 = performance.now(); this.fx = []; this.alive = true;
    host.innerHTML = `<canvas class="sl-cv"></canvas>${o.controls ? `<div class="sl-ctl"><button type="button" data-z="0.8" aria-label="Zoom in">＋</button><button type="button" data-z="1.25" aria-label="Zoom out">－</button></div><div class="sl-arrow" hidden>➤</div><div class="sl-ballw"><canvas class="sl-ball" aria-label="Sky ball: drag to turn the sky"></canvas><span>drag to turn</span></div>` : ""}${o.timer ? `<div class="sl-time"><i></i><b></b></div>` : ""}`;
    this.cv = host.querySelector("canvas"); this.cv.sky = this; this.cx = this.cv.getContext("2d");
    this.mw = document.createElement("canvas"); this.ball = host.querySelector(".sl-ball"); if (this.ball) this.ballInput();
    const loop = () => { if (!this.alive || !this.cv.isConnected) { this.alive = false; return; } this.draw(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  size() { const r = this.cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = Math.max(50, r.width); this.h = Math.max(50, r.height);
    if (this.cv.width !== Math.round(this.w * dpr)) { this.cv.width = Math.round(this.w * dpr); this.cv.height = Math.round(this.h * dpr); }
    this.cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  P() { return PAL[this.o.photo ? "photo" : this.o.theme] || PAL["st-classic"]; }
  path(pts) { const c = this.cx; let pen = false;
    for (const [r, d] of pts) { const p = toScreen(this.view, this.w, this.h, r, d);
      if (!p.front || Math.abs(p.X) > 4 * this.w || Math.abs(p.Y) > 4 * this.h) { pen = false; continue; }
      if (pen) c.lineTo(p.X, p.Y); else c.moveTo(p.X, p.Y); pen = true; } }
  milkyWay(alpha) {
    const s = 0.5, m = this.mw, w = Math.round(this.w * s), h = Math.round(this.h * s);
    if (m.width !== w || m.height !== h) { m.width = w; m.height = h; }
    const c = m.getContext("2d"); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, h); c.setTransform(s, 0, 0, s, 0, 0);
    const keep = this.cx; this.cx = c;
    MILKY_WAY.forEach((rings, i) => { c.beginPath(); for (const ring of rings) { this.path([...ring, ring[0]]); c.closePath(); } c.fillStyle = `rgba(196,206,255,${(0.05 + i * 0.025) * alpha})`; c.fill("evenodd"); });
    this.cx = keep;
    const k = this.cx; k.save(); try { k.filter = `blur(${Math.max(2, 9 - (this.view.fov || 45) / 10)}px)`; } catch {} k.drawImage(m, 0, 0, this.w, this.h); k.restore();
  }
  draw() {
    this.size(); const c = this.cx, P = this.P(), v = this.view, now = performance.now(), t = (now - this.t0) / 1000, o = this.o, run = o.run;
    const g = c.createRadialGradient(this.w / 2, this.h * 0.45, 10, this.w / 2, this.h / 2, Math.hypot(this.w, this.h) * 0.6);
    g.addColorStop(0, P.bg[0]); g.addColorStop(1, P.bg[1]); c.fillStyle = g; c.fillRect(0, 0, this.w, this.h);
    if (o.photo) this.milkyWay(1);
    else if (o.theme === "st-milkyway") this.milkyWay(0.8);
    if (o.theme === "st-grid" || o.theme === "st-atlas") { c.beginPath();
      for (let d = -60; d <= 60; d += 30) this.path(Array.from({ length: 73 }, (_, i) => [i * 5, d]));
      for (let r = 0; r < 360; r += 30) this.path(Array.from({ length: 35 }, (_, i) => [r, -85 + i * 5]));
      c.strokeStyle = P.grid; c.lineWidth = 0.8; c.stroke(); }
    if (o.figures) { c.beginPath(); for (const ls of Object.values(LINES)) for (const l of ls) this.path(l); c.strokeStyle = P.line; c.lineWidth = 1; c.stroke(); }
    // stars
    const tw = o.photo || o.theme === "st-twinkle";
    if (o.photo) for (const s of FAINT) { const p = toScreen(v, this.w, this.h, s[0], s[1]); if (!p.front || p.X < -5 || p.Y < -5 || p.X > this.w + 5 || p.Y > this.h + 5) continue;
      c.globalAlpha = Math.max(0.15, Math.min(0.8, (6.6 - s[2]) / 3)); c.fillStyle = bvColour(s[3]); c.fillRect(p.X - 0.6, p.Y - 0.6, 1.2, 1.2); }
    c.globalAlpha = 1;
    this.vis = onScreen(v, this.w, this.h, STARS);
    const zf = Math.max(0.8, Math.min(1.5, 45 / (v.fov || 45)));
    for (const { s, X, Y } of this.vis) {
      let r = Math.max(0.7, 3.4 - 0.6 * s[2]) * zf, a = 1;
      if (tw && s[2] < 3.5) a = 0.75 + 0.25 * Math.sin(t * 3 + s[4]);
      const col = P.ink || bvColour(s[3]);
      if (o.photo && s[2] < 2.2) { const hr = r * 5; const hg = c.createRadialGradient(X, Y, 0, X, Y, hr); hg.addColorStop(0, col); hg.addColorStop(1, "rgba(0,0,0,0)");
        c.globalAlpha = 0.35 * a; c.fillStyle = hg; c.beginPath(); c.arc(X, Y, hr, 0, 7); c.fill(); }
      c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.arc(X, Y, r, 0, 7); c.fill();
    }
    c.globalAlpha = 1;
    if (run) this.drawRun(c, P, t);
    if (this.ball) this.drawBall(P);
    if (o.timer) this.drawTimer(now);
    // effects: miss flashes, hint edges, sparkles, meteors
    this.fx = this.fx.filter((f) => now - f.at < f.dur);
    for (const f of this.fx) { const k = (now - f.at) / f.dur;
      if (f.kind === "miss") { const A = toScreen(v, this.w, this.h, ...f.a), B = toScreen(v, this.w, this.h, ...f.b);
        c.strokeStyle = `rgba(255,90,122,${1 - k})`; c.lineWidth = 2.5; c.beginPath(); c.moveTo(A.X, A.Y); c.lineTo(B.X, B.Y); c.stroke(); }
      if (f.kind === "hint") { const A = toScreen(v, this.w, this.h, ...f.a), B = toScreen(v, this.w, this.h, ...f.b);
        c.setLineDash([6, 6]); c.lineDashOffset = -t * 30; c.strokeStyle = `rgba(250,222,140,${0.9 * (1 - k) * (0.6 + 0.4 * Math.sin(t * 8))})`; c.lineWidth = 2;
        c.beginPath(); c.moveTo(A.X, A.Y); c.lineTo(B.X, B.Y); c.stroke(); c.setLineDash([]); }
      if (f.kind === "spark") for (let i = 0; i < 18; i++) { const p = toScreen(v, this.w, this.h, ...f.at2), ang = (i / 18) * 6.283, d = (20 + (i % 3) * 14) * k;
        c.globalAlpha = 1 - k; c.fillStyle = P.gold; c.beginPath(); c.arc(p.X + Math.cos(ang) * d, p.Y + Math.sin(ang) * d, 2.2 * (1 - k) + 0.5, 0, 7); c.fill(); c.globalAlpha = 1; }
      if (f.kind === "meteor") { const x = f.x - k * 260, y = f.y + k * 104; const mg = c.createLinearGradient(x, y, x + 60, y - 24);
        mg.addColorStop(0, `rgba(255,255,255,${1 - k})`); mg.addColorStop(1, "rgba(255,255,255,0)"); c.strokeStyle = mg; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 60, y - 24); c.stroke(); }
    }
    if ((o.theme === "st-meteors" || o.photo) && Math.random() < (o.photo ? 0.002 : 0.006) && !reducedMotion()) this.meteor();
    // the dome opening
    const dk = Math.min(1, (now - this.t0) / 1300);
    if (o.dome && dk < 1 && !reducedMotion()) { const e = 1 - Math.pow(1 - dk, 3), half = this.w / 2; c.fillStyle = "#05030c";
      c.fillRect(-half * e, 0, half, this.h); c.fillRect(half + half * e, 0, half, this.h); }
    // arrow toward the target when asked for a hint and it's off screen
    const ar = this.host.querySelector(".sl-arrow");
    if (ar) { const show = o.arrowUntil && now < o.arrowUntil && o.g;
      if (show) { const [ra, de] = figureCentre(o.g), p = toScreen(v, this.w, this.h, ra, de), off = !p.front || p.X < 0 || p.Y < 0 || p.X > this.w || p.Y > this.h;
        if (off) { const sky = toSky(v, this.w, this.h, this.w / 2, this.h / 2); let ang;
          if (p.front) ang = Math.atan2(p.Y - this.h / 2, p.X - this.w / 2); else { let dra = ra - sky[0]; if (dra > 180) dra -= 360; if (dra < -180) dra += 360; ang = Math.atan2(-(de - sky[1]), -dra); }
          const R = Math.min(this.w, this.h) / 2 - 26; ar.hidden = false; ar.style.left = `${this.w / 2 + Math.cos(ang) * R - 12}px`; ar.style.top = `${this.h / 2 + Math.sin(ang) * R - 12}px`; ar.style.transform = `rotate(${ang}rad)`;
        } else ar.hidden = true; } else ar.hidden = true; }
  }
  drawRun(c, P, t) {
    const o = this.o, run = o.run, g = o.g, v = this.view, scr = (h) => { const s = starByHip(h); return toScreen(v, this.w, this.h, s[0], s[1]); };
    c.save(); c.shadowColor = P.gold; c.shadowBlur = 8; c.strokeStyle = P.gold; c.lineWidth = run.done ? 2.6 + 0.6 * Math.sin(t * 3) : 2.2; c.beginPath();
    for (const k of run.drawn) { const [a, b] = k.split("-").map(Number), A = scr(a), B = scr(b); if (!A.front || !B.front) continue; c.moveTo(A.X, A.Y); c.lineTo(B.X, B.Y); }
    c.stroke(); c.restore();
    if (o.sel) { const A = scr(o.sel); if (A.front) { c.strokeStyle = P.gold; c.lineWidth = 1.5; c.beginPath(); c.arc(A.X, A.Y, 9 + 2 * Math.sin(t * 6), 0, 7); c.stroke();
      if (o.rubber) { c.setLineDash([4, 5]); c.beginPath(); c.moveTo(A.X, A.Y); c.lineTo(o.rubber[0], o.rubber[1]); c.stroke(); c.setLineDash([]); } } }
    if (run.done && o.label) { const [ra, de] = figureCentre(g), p = toScreen(v, this.w, this.h, ra, de); c.font = "600 14px Cinzel, Georgia, serif"; c.textAlign = "center";
      const w = c.measureText(o.label).width + 20, y = Math.min(this.h - 30, p.Y + 40); c.fillStyle = "rgba(11,8,32,.82)"; c.strokeStyle = P.gold; c.lineWidth = 1;
      c.beginPath(); c.roundRect ? c.roundRect(p.X - w / 2, y - 16, w, 24, 6) : c.rect(p.X - w / 2, y - 16, w, 24); c.fill(); c.stroke(); c.fillStyle = P.gold; c.fillText(o.label, p.X, y + 1); }
  }
  /** The perspective ball: the celestial sphere seen from outside, turned to match the view. */
  drawBall(P) {
    const b = this.ball, dpr = Math.min(2, window.devicePixelRatio || 1), S = 92;
    if (b.width !== S * dpr) { b.width = b.height = S * dpr; }
    const c = b.getContext("2d"), R = S / 2 - 4, cx = S / 2, v = this.view, R0 = Math.PI / 180, ra0 = v.ra * R0, d0 = v.dec * R0;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, S, S);
    const g = c.createRadialGradient(cx - R * 0.35, cx - R * 0.35, R * 0.1, cx, cx, R); g.addColorStop(0, "#2a3f8f"); g.addColorStop(1, "#060a24");
    c.fillStyle = g; c.beginPath(); c.arc(cx, cx, R, 0, 7); c.fill();
    const pt = (ra, de) => { const a = ra * R0 - ra0, cd = Math.cos(de * R0), z = Math.sin(d0) * Math.sin(de * R0) + Math.cos(d0) * cd * Math.cos(a);
      return { x: cx - R * cd * Math.sin(a), y: cx - R * (Math.cos(d0) * Math.sin(de * R0) - Math.sin(d0) * cd * Math.cos(a)), z }; };
    const line = (pts, col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); let pen = false;
      for (const [r, d] of pts) { const q = pt(r, d); if (q.z < 0) { pen = false; continue; } if (pen) c.lineTo(q.x, q.y); else c.moveTo(q.x, q.y); pen = true; } c.stroke(); };
    for (let d = -60; d <= 60; d += 30) line(Array.from({ length: 73 }, (_, i) => [i * 5, d]), d ? "rgba(140,170,255,.35)" : "rgba(250,222,140,.7)", d ? 0.8 : 1.2);
    for (let r = 0; r < 360; r += 30) line(Array.from({ length: 37 }, (_, i) => [r, -90 + i * 5]), "rgba(140,170,255,.3)", 0.8);
    for (const [txt, de] of [["N", 90], ["S", -90]]) { const q = pt(0, de); if (q.z > 0.05) { c.fillStyle = "#FADE8C"; c.font = "700 10px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, q.x, q.y); } }
    const f = Math.min(0.9, Math.tan(((v.fov || 45) * R0) / 2)) * R; c.strokeStyle = P.gold; c.lineWidth = 1.4; c.strokeRect(cx - f * 0.66, cx - f * 0.5, f * 1.32, f);
    c.strokeStyle = "rgba(250,222,140,.8)"; c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cx, R, 0, 7); c.stroke();
    const hl = c.createRadialGradient(cx - R * 0.4, cx - R * 0.45, 0, cx - R * 0.4, cx - R * 0.45, R * 0.6); hl.addColorStop(0, "rgba(255,255,255,.25)"); hl.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = hl; c.beginPath(); c.arc(cx, cx, R, 0, 7); c.fill();
  }
  /** Drag the ball to turn the sky; it keeps a little spin when let go. */
  ballInput() {
    const b = this.ball; let last = null, vel = [0, 0], tLast = 0;
    b.addEventListener("pointerdown", (e) => { e.stopPropagation(); b.setPointerCapture(e.pointerId); last = [e.clientX, e.clientY]; vel = [0, 0]; tLast = performance.now(); this.spinning = false; });
    b.addEventListener("pointermove", (e) => { if (!last) return; const dx = e.clientX - last[0], dy = e.clientY - last[1], now = performance.now();
      this.view = spin(this.view, dx, dy); vel = [(dx / Math.max(8, now - tLast)) * 16, (dy / Math.max(8, now - tLast)) * 16]; last = [e.clientX, e.clientY]; tLast = now; });
    const up = () => { if (!last) return; last = null; if (reducedMotion() || Math.hypot(...vel) < 1.5) return;
      this.spinning = true; const step = () => { if (!this.spinning || !this.alive) return; vel = [vel[0] * 0.9, vel[1] * 0.9]; this.view = spin(this.view, vel[0], vel[1]);
        if (Math.hypot(...vel) > 0.2) requestAnimationFrame(step); else this.spinning = false; }; step(); };
    b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up);
  }
  /** The countdown bar along the top of the sky. */
  drawTimer(now) {
    const T = this.o.timer, el = this.host.querySelector(".sl-time"); if (!el) return;
    const left = Math.max(0, T.paused != null ? T.paused : (T.end - now) / 1000), k = left / T.total;
    el.querySelector("i").style.width = `${k * 100}%`; el.querySelector("b").textContent = `⏳ ${Math.ceil(left)}s`;
    el.classList.toggle("low", left <= 15 && T.paused == null);
  }
  meteor() { this.fx.push({ kind: "meteor", at: performance.now(), dur: 900, x: this.w * (0.5 + Math.random() * 0.5), y: this.h * Math.random() * 0.4 }); }
  /** Glide the view to a new centre and zoom. */
  glide(to, ms = 1100, done) { const from = { ...this.view }, t0 = performance.now(); let dra = to.ra - from.ra; if (dra > 180) dra -= 360; if (dra < -180) dra += 360;
    const step = () => { const k = Math.min(1, (performance.now() - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      this.view = { ra: (from.ra + dra * e + 360) % 360, dec: from.dec + (to.dec - from.dec) * e, fov: from.fov + ((to.fov || from.fov) - from.fov) * e };
      if (k < 1 && this.alive) requestAnimationFrame(step); else if (done) done(); };
    if (reducedMotion()) { this.view = { ...to }; if (done) done(); } else step(); }
  /** Pointer handling on the sky itself: drawing (drag or tap star to star) and zoom (wheel or pinch) only. Turning the sky is the ball's job, so a stray drag never moves it. Without a ball (the store preview) empty-sky drags still pan. */
  input(onTapStar, onDragLine) {
    const cv = this.cv, pts = new Map(); let mode = null, startStar = null, last = null, moved = 0, pinch = null;
    const at = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener("pointerdown", (e) => { cv.setPointerCapture(e.pointerId); const p = at(e); pts.set(e.pointerId, p);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), fov: this.view.fov }; mode = "pinch"; this.o.rubber = null; return; }
      const st = nearestStar(this.vis || [], p[0], p[1], 16); startStar = st; mode = st ? "draw" : this.ball ? "idle" : "pan"; last = p; moved = 0; });
    cv.addEventListener("pointermove", (e) => { if (!pts.has(e.pointerId)) return; const p = at(e); pts.set(e.pointerId, p);
      if (mode === "pinch" && pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); this.view = zoom({ ...this.view, fov: pinch.fov }, pinch.d / Math.max(10, d)); return; }
      moved += Math.hypot(p[0] - last[0], p[1] - last[1]);
      if (mode === "pan") { this.view = pan(this.view, this.w, this.h, last[0], last[1], p[0], p[1]); last = p; }
      else if (mode === "draw" && moved > 8) { if (this.o.sel !== startStar.s[4]) this.o.sel = startStar.s[4]; this.o.rubber = p; last = p; } });
    const up = (e) => { if (!pts.has(e.pointerId)) return; const p = at(e); pts.delete(e.pointerId);
      if (mode === "pinch") { if (!pts.size) mode = null; return; }
      if (mode === "draw") { const end = nearestStar(this.vis || [], p[0], p[1], 22); this.o.rubber = null;
        if (moved > 8 && end && end.s[4] !== startStar.s[4]) onDragLine(startStar.s, end.s); else if (moved <= 8) onTapStar(startStar.s); }
      else if ((mode === "pan" || mode === "idle") && moved <= 6) onTapStar(null);
      mode = null; };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    cv.addEventListener("wheel", (e) => { e.preventDefault(); this.view = zoom(this.view, e.deltaY > 0 ? 1.1 : 0.9); }, { passive: false });
    this.host.querySelectorAll("[data-z]").forEach((b) => (b.onclick = () => this.glide(zoom(this.view, +b.dataset.z), 250)));
  }
}

const CSS = `
.table.stars{background:#070b24;pointer-events:auto;touch-action:none}.table.stars .sl-cv{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:none}
.table.stars .sl-cv:active{cursor:grabbing}
.sl-ctl{position:absolute;right:8px;top:8px;display:flex;flex-direction:column;gap:6px;z-index:2}
.sl-ctl button{width:34px;height:34px;border-radius:50%;border:1px solid rgba(250,222,140,.6);background:rgba(11,8,32,.75);color:#FADE8C;font-size:18px;cursor:pointer}
.sl-ctl button:active{box-shadow:0 0 12px rgba(120,200,255,.8)}
.sl-ballw{position:absolute;left:8px;bottom:30px;z-index:2;display:flex;flex-direction:column;align-items:center;gap:2px}
.sl-ball{width:92px;height:92px;cursor:grab;touch-action:none;border-radius:50%;box-shadow:0 0 14px rgba(250,222,140,.35)}.sl-ball:active{cursor:grabbing;box-shadow:0 0 18px rgba(120,200,255,.8)}
.sl-ballw span{font-size:10px;color:#FADE8C;opacity:.8;text-shadow:0 0 4px #000;pointer-events:none}
.sl-time{position:absolute;left:8px;right:52px;top:8px;height:18px;z-index:2;border:1px solid rgba(250,222,140,.6);border-radius:9px;background:rgba(11,8,32,.7);overflow:hidden;pointer-events:none}
.sl-time i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#c9a24a,#FADE8C);opacity:.55;transition:width .2s linear}
.sl-time b{position:relative;display:block;text-align:center;font:600 11px/18px sans-serif;color:#fff;text-shadow:0 0 3px #000}
.sl-time.low{border-color:#ff5a7a;animation:sl-pulse .6s ease-in-out infinite}.sl-time.low i{background:#ff5a7a}
.sl-arrow{position:absolute;z-index:2;width:24px;height:24px;color:#FADE8C;font-size:22px;line-height:24px;text-align:center;text-shadow:0 0 8px #FADE8C;animation:sl-pulse 1s ease-in-out infinite;pointer-events:none}
@keyframes sl-pulse{50%{opacity:.45}}
.sl-shape{display:flex;align-items:center;gap:10px;margin:6px 0}.sl-shape svg{width:96px;height:72px;border:1px solid var(--line,#3a2f6a);border-radius:8px;background:rgba(7,11,36,.8)}
.sl-lant{display:inline-block;animation:sl-flick 1.3s ease-in-out infinite}@keyframes sl-flick{0%,100%{transform:scale(1)}40%{transform:scale(1.15)}}
.sl-shake{animation:sl-shake .45s ease-in-out}@keyframes sl-shake{20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
.sl-facts{display:grid;gap:4px;margin:6px 0;font-size:.85rem}.sl-facts span{border:1px solid var(--line,#3a2f6a);border-radius:8px;padding:5px 8px;background:rgba(22,16,48,.6)}
.sl-fable{font-style:italic;color:var(--muted,#b9b2cc);font-size:.85rem;margin:4px 0}
@media (prefers-reduced-motion: reduce){.sl-time.low,.sl-arrow,.sl-lant,.sl-shake{animation:none}}
`;
function styleOnce() { if (document.getElementById("sl-style")) return; const st = document.createElement("style"); st.id = "sl-style"; st.textContent = CSS; document.head.append(st); }

/** A small picture of the figure to draw (its shape only, no names). */
function shapeSvg(g) {
  const [ra, de] = figureCentre(g), v = { ra, dec: de, fov: 30 }, pts = {}, hs = figureStars(g);
  for (const h of hs) { const s = starByHip(h), p = toScreen(v, 100, 100, s[0], s[1]); pts[h] = [p.X, p.Y]; }
  const xs = Object.values(pts).map((p) => p[0]), ys = Object.values(pts).map((p) => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys);
  const sc = Math.min(80 / Math.max(1, Math.max(...xs) - x0), 56 / Math.max(1, Math.max(...ys) - y0)), ox = (96 - (Math.max(...xs) - x0) * sc) / 2, oy = (72 - (Math.max(...ys) - y0) * sc) / 2;
  const P = (h) => [ox + (pts[h][0] - x0) * sc, oy + (pts[h][1] - y0) * sc];
  return `<svg viewBox="0 0 96 72" aria-label="The shape to draw">${figureEdges(g).map(([a, b]) => `<line x1="${P(a)[0].toFixed(1)}" y1="${P(a)[1].toFixed(1)}" x2="${P(b)[0].toFixed(1)}" y2="${P(b)[1].toFixed(1)}" stroke="#FADE8C" stroke-width="1.4" opacity=".8"/>`).join("")}
    ${hs.map((h) => `<circle cx="${P(h)[0].toFixed(1)}" cy="${P(h)[1].toFixed(1)}" r="${Math.max(1.4, 3 - 0.45 * starByHip(h)[2]).toFixed(1)}" fill="#fff"/>`).join("")}</svg>`;
}

export function guideHtml() {
  return `<div class="dec-guide sl-guide"><h3>📖 ${esc(GUIDE.title)}</h3>${GUIDE.sections.map((s, i) => `<details${i === 0 ? " open" : ""}><summary>${esc(s.h)}</summary>${s.p.map((t) => `<p>${t}</p>`).join("")}</details>`).join("")}</div>`;
}

// ---- the store shelf ----
export const shop = {
  kind: KIND, label: "🔭 Star Lore", items: THEMES,
  talk: {
    open: ["Sky charts! I collect them. The stars never complain about the frame.", "Dress the heavens, darling. They've worn the same outfit for 4 billion years."],
    tryon: ["The {item}. Even Ptolemy would approve.", "Ooh, the {item}. The constellations look thinner already."],
    buy: ["The {item} is yours. The cosmos thanks you for your patronage.", "Sold! The {item}. Carry it to the Star Lore room and look up."],
  },
  preview(id, ctx) { styleOnce(); const t = ctx.tableEl; t.className = "table stars"; const g = DECK[0], [ra, dec] = figureCentre(g);
    new Sky(t, { view: { ra, dec, fov: 40 }, theme: id, figures: true }); if (ctx.cap) ctx.cap("🔭 " + (THEMES.find((x) => x.id === id) || {}).name); },
};

export const stars = {
  id: "stars", label: "Star Lore Navigator", emoji: "🔭", blurb: "Find and draw the constellations while the Oracle tells their fables", shop,
  open(ctx) {
    const { $, say, ui, talkThrough, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const prog = () => starsOf(state.prog), theme = () => themeOf(state.prog);
    const stats = () => { const n = foundCount(state.prog), t = titleOf(n), nx = nextTitle(n);
      return `<div class="cx-top"><b>🔭 ${esc(t.name)}</b> · ${n} / ${ALL.length} drawn · 📜 ${fablesHeard(state.prog)} / ${FABLE_COUNT} fables heard${nx ? ` · ${nx.at - n} more to ${esc(nx.name)}` : ""}</div>`; };
    const toggleGuide = (btn) => { const rb = $("reading-body"), on = !rb.querySelector(".sl-guide"); rb.innerHTML = on ? guideHtml() : "";
      if (btn) btn.textContent = on ? "📖 Close study guide" : "📖 Study guide"; if (on) rb.querySelector(".sl-guide").scrollIntoView({ behavior: "smooth", block: "start" }); };
    const guideBtn = `<button class="c" type="button" id="sl-guide">📖 Study guide</button>`;
    const wireGuide = () => { const b = $("sl-guide"); if (b) b.onclick = () => toggleGuide(b); };
    const mount = (o) => { tableEl.className = "table stars"; return new Sky(tableEl, { theme: theme(), ...o }); };

    function lobby(first) {
      clearReading(); cap("🔭 Star Lore Navigator");
      const sky = mount({ view: { ra: 84, dec: 10, fov: 50 }, figures: true }); sky.input(() => {}, () => {});
      say(first && !prog().plays
        ? `Welcome to the observatory, ${state.name}. The whole sky is yours: drag to roam, pinch or use the buttons to zoom. I'll ask you to find a constellation and draw it, star to star. Finish before dawn and your reward is its lore: a story people have told about it for thousands of years.`
        : foundCount(state.prog) >= ALL.length ? `You've drawn the whole sky, ${state.name}. Draw again any time: there are more fables to hear.` : `Clear skies tonight, ${state.name}. Which sky shall we open?`);
      const lvl = (L) => { const n = foundCount(state.prog, L);
        return `<button class="c level" type="button" data-l="${L.n}"><b>${"⭐".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${n} / ${DECK.length} drawn · points ×${L.mult}</span></button>`; };
      ui(`${stats()}<div class="levels">${LEVELS.map(lvl).join("")}</div>
        <div class="note">Level 1 shows every constellation's stick figure. Level 2 shows none. Level 3 is the real-looking sky: thousands of stars and the Milky Way.</div>
        <div class="choices">${guideBtn}<button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => { const L = LEVELS[+b.dataset.l - 1]; search(L, nextTarget(state.prog, L, prog().last)); }));
      $("back").onclick = greet; wireGuide();
    }

    function search(L, g) {
      const run = start(g, L), fi = pickFable(state.prog, g), fable = g.fables[fi];
      const total = timeFor(g, L), timer = { total, end: performance.now() + total * 1000 + 1300, paused: null };
      const sky = mount({ view: startView(g, run.seed), figures: L.guide === "lines", photo: L.n === 3, run, g, dome: true, controls: true, timer });
      const stopClock = () => { if (timer.paused == null) timer.paused = Math.max(0, (timer.end - performance.now()) / 1000); clearInterval(tick); };
      let warned = false;
      const tick = setInterval(() => { if (!sky.alive) return clearInterval(tick); if (timer.paused != null) return;
        const left = (timer.end - performance.now()) / 1000;
        if (left <= 15 && !warned) { warned = true; say(pick(["The stars are fading. Hurry.", "Fifteen breaths left before dawn.", "Quickly now, the night is ending."])); }
        if (left <= 0) timeUp(); }, 250);
      domeOpen(); clearReading(); cap(`${g.emoji} Find and draw ${g.name}`);
      let told = 0;
      const status = (extra) => {
        const st = starsFor(run.mistakes);
        ui(`<div class="cx-top">Level ${L.n} · lines ${run.drawn.length} / ${run.total} · ${"<span class=\"sl-lant\">★</span>".repeat(st)}${"☆".repeat(3 - st)} · mistakes ${run.mistakes}</div>
          <div class="sl-shape">${shapeSvg(g)}<div class="note">${esc(g.find)}<br>Turn the sky with the ball (bottom left). Tap a star, then the next star of the figure, or drag from star to star. Beat the clock.</div></div>
          <div class="sl-fable">📜 Your reward: a sealed story from ${esc(fable.c)}. Finish the figure to unseal it.</div>${extra || ""}
          <div class="choices"><button class="c" type="button" id="sl-hint">🏮 Hint (counts as a mistake)</button>${guideBtn}<button class="c small" type="button" id="sl-reveal">Show me</button><button class="c small" type="button" id="sl-leave">↩ Levels</button></div>`);
        $("sl-hint").onclick = () => { const [ra, de] = figureCentre(g), p = toScreen(sky.view, sky.w, sky.h, ra, de), inView = p.front && p.X > 0 && p.Y > 0 && p.X < sky.w && p.Y < sky.h;
          shimmer();
          if (!inView || !run.drawn.length && sep(ra, de, sky.view.ra, sky.view.dec) > (sky.view.fov || 45) * 0.8) { run.mistakes++; run.hints++; sky.o.arrowUntil = performance.now() + 5000;
            status(); say(pick(["Follow the golden arrow.", "That way, traveller. The arrow knows.", "Not here. Follow my arrow across the sky."])); return; }
          const e = hintEdge(run, g); if (!e) return; const A = starByHip(e[0]), B = starByHip(e[1]);
          sky.fx.push({ kind: "hint", a: [A[0], A[1]], b: [B[0], B[1]], at: performance.now(), dur: 3500 }); status(); };
        $("sl-reveal").onclick = () => { stopClock(); reveal(); };
        $("sl-leave").onclick = () => { stopClock(); lobby(false); }; wireGuide();
      };
      const tell = () => { const half = run.drawn.length * 2 >= run.total;
        if (!told) { told = 1; say(`${pick(["You've found it.", "Yes, there it is.", "Good eyes."])} Keep going. A story from ${fable.c} waits for you at the end.`); }
        else if (half && told === 1) { told = 2; say(pick(["Halfway. The story is stirring.", "More than half drawn. I can almost hear the story.", "Keep going, the lore is close."])); } };
      const line = (a, b) => {
        const r = attempt(run, g, a[4], b[4]);
        if (r === "miss") { gutter(); sky.fx.push({ kind: "miss", a: [a[0], a[1]], b: [b[0], b[1]], at: performance.now(), dur: 700 }); sky.o.sel = null;
          const sv = tableEl; sv.classList.remove("sl-shake"); void sv.offsetWidth; sv.classList.add("sl-shake");
          status(); if (!told) say(pick([`Hmm. ${nameOf(b) ? nameOf(b) + " is" : "That star is"} in ${conName(b[5])}. Keep looking.`, "Not that line. The stars shake their heads.", "That isn't part of it. Look again."])); return; }
        ping(b[2]); sky.o.sel = b[4]; sky.o.chain = true;
        if (r === "again") return;
        if (r === "done") { stopClock(); return complete(); }
        tell(); status();
      };
      sky.input((s) => {
        if (!s) { sky.o.sel = null; return; }
        if (sky.o.sel && sky.o.sel !== s[4]) {
          // after a line, the end star stays selected to chain the next one; tapping a star that doesn't continue it just starts afresh there
          const k = edgeKey(sky.o.sel, s[4]), fits = figureEdges(g).some(([x, y]) => edgeKey(x, y) === k);
          if (sky.o.chain && !fits) { sky.o.sel = s[4]; sky.o.chain = false; ping(s[2]); return; }
          sky.o.chain = false; return line(starByHip(sky.o.sel), s); }
        if (sky.o.sel === s[4]) { if (sky.o.chain) sky.o.chain = false; else sky.o.sel = null; return; }
        sky.o.sel = s[4]; sky.o.chain = false; ping(s[2]);
      }, (a, b) => line(a, b));
      say(`${pick(["The dome opens. Look up.", "Let your eyes adjust to the dark…", "Clear skies. Here is your task."])} Find ${g.name} somewhere in this sky, and draw it for me. ${g.find}`);
      status();

      function centreOn(done) { const [ra, dec] = figureCentre(g), span = Math.max(...figureStars(g).map((h) => { const s = starByHip(h); return sep(s[0], s[1], ra, dec); }));
        sky.glide({ ra, dec, fov: Math.max(16, Math.min(60, span * 1.5)) }, 1100, done); }
      function complete() {
        discover(); sky.o.sel = null; sky.o.label = g.name; centreOn(() => { const [ra, de] = figureCentre(g); sky.fx.push({ kind: "spark", at2: [ra, de], at: performance.now(), dur: 1200 }); sky.meteor(); });
        cap(`${g.emoji} ${g.name}`);
        run.lore = true;
        const pages = [`Drawn! Your reward, as promised: a story from ${fable.c}, “${fable.t}”.`, fable.parts.join(" "), "And now, what astronomers know.", ...g.science];
        status(); talkThrough(pages, () => facts());
      }
      function timeUp() {
        stopClock(); timer.paused = 0; run.lost = true; sky.o.sel = null; sky.o.rubber = null;
        const sv = tableEl; sv.classList.remove("sl-shake"); void sv.offsetWidth; sv.classList.add("sl-shake");
        darkness(); sky.o.label = g.name;
        for (const [a, b] of figureEdges(g)) { const k = edgeKey(a, b); if (!run.drawn.includes(k)) run.drawn.push(k); }
        centreOn(); cap(`${g.emoji} ${g.name}: time's up`);
        talkThrough([`Dawn breaks and the stars fade. Time's up. Here is ${g.name}, so you'll know it next time.`, `Its story stays sealed until you draw it. Study the guide, learn the shape, and come back before dawn.`], () => facts(true));
      }
      function reveal() {
        run.done = false; darkness(); sky.o.sel = null; sky.o.label = g.name;
        for (const [a, b] of figureEdges(g)) { const k = edgeKey(a, b); if (!run.drawn.includes(k)) run.drawn.push(k); }
        centreOn(); cap(`${g.emoji} ${g.name}`);
        talkThrough([`Here it is: ${g.name}. Learn its shape: the story stays sealed until you draw it yourself.`, ...g.science], () => facts(true));
      }
      function facts(gaveUp) {
        const [ra, de] = figureCentre(g);
        $("reading-body").innerHTML = `<div class="sl-facts"><span>🗓️ Best seen in the evening: around <b>${bestMonth(ra)}</b></span><span>🌍 ${esc(seenFrom(de))}</span><span>✳️ IAU constellation: <b>${esc(conName(g.con))}</b></span><span>📜 ${run.lore ? `Fable: ${esc(fable.c)}, “${esc(fable.t)}”` : "Fable: sealed until you draw it"}</span></div>`;
        if (gaveUp) { run.revealed = true; return finish(L, g, run, null, run.lost ? "Time to study. The guide has every shape and story clue; then try again." : "Try it again when you're ready, or study first."); }
        say(`One question before you go. ${g.quiz.q}`);
        const cs = quizChoices(g);
        ui(`<div class="choices col">${cs.map((c, i) => `<button class="c" type="button" data-q="${i}">${esc(c)}</button>`).join("")}</div><div class="note">+${Math.round(5 * L.mult)} for the right answer.</div>`);
        $("ui").querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => { const ok = answer(run, g, cs[+b.dataset.q]); verdict(ok);
          finish(L, g, run, fi, ok ? `Correct: ${g.quiz.a}.` : `Not quite. The answer is: ${g.quiz.a}.`); }));
      }
    }

    function finish(L, g, run, fi, line) {
      if (run.revealed) run.done = false;
      const before = foundCount(state.prog), r = settle(state.prog, run, fi);
      const aw = award(r.xp, r.essence); saveProgress(); showStats();
      ctx.trophy?.("stars", L.n, { won: !!run.done, perfect: !!run.done && starsFor(run.mistakes) === 3 }); // Trophy Case (trophies.js)
      const t = titleOf(foundCount(state.prog)), titled = titleOf(before).name !== t.name;
      say(line);
      const bits = [`<b>+${r.xp} ✦${r.essence ? ` · +${r.essence} 💎` : ""}</b>`];
      if (run.done) bits.push(`${"★".repeat(starsFor(run.mistakes))}${"☆".repeat(3 - starsFor(run.mistakes))} drawing ${drawPts(run)} + quiz ${quizPts(run)} = ${r.score}${r.first ? "" : r.best ? " · new best" : ` · best stays ${prog().found[keyOf(L, g)]}`}`);
      else bits.push(run.lost ? "⏳ time ran out" : "revealed, not drawn");
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${titled ? `<div class="up">🔭 Star title: <b>${esc(t.name)}</b></div>` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>
        <div class="choices">${run.done ? "" : `<button class="c main" type="button" id="sl-study">📖 Study Star Lore</button>`}<button class="c${run.done ? " main" : ""}" type="button" id="sl-go">🔭 Next constellation</button><button class="c" type="button" id="sl-again">↻ ${run.done ? "Draw it again (another fable)" : "Try this one again"}</button><button class="c" type="button" id="sl-lobby">📜 Choose a level</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      if (titled || aw.rankUp) chime(2);
      $("sl-go").onclick = () => search(L, nextTarget(state.prog, L, g.id));
      $("sl-again").onclick = () => search(L, g);
      $("sl-lobby").onclick = () => lobby(false); $("back").onclick = greet;
      if ($("sl-study")) $("sl-study").onclick = () => (ctx.study ? ctx.study("stars", () => lobby(false)) : toggleGuide());
    }

    lobby(true);
  },
};

/** For the Codex page: constellations drawn per level, and fables heard. */
export function starsCodex(p, e = esc) {
  const r = starsOf(p);
  return LEVELS.map((L) => { const got = DECK.filter((g) => r.found[keyOf(L, g)]);
    return `<div class="cx"><div class="cx-h"><span>🔭 Star Lore level ${L.n}: ${e(L.what)}</span><span class="note">${got.length} / ${DECK.length}</span></div>
    <div class="bar"><i style="width:${(got.length / DECK.length) * 100}%"></i></div>${got.length ? `<div class="chips">${got.map((g) => `<span>${g.emoji} ${e(g.name)}</span>`).join("")}</div>` : ""}</div>`; }).join("")
    + `<div class="cx"><div class="cx-h"><span>📜 Star fables heard</span><span class="note">${r.heard.length} / ${FABLE_COUNT}</span></div><div class="bar"><i style="width:${(r.heard.length / FABLE_COUNT) * 100}%"></i></div></div>`;
}
