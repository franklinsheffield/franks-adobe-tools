"use strict";
// ======================================================================
// Brew 3.0 controls (spec "Control choice"): one control type per job.
//   fader(label, path, min, max, step, unit)   mix / opacity / blend %
//   stepper(label, path, min, max, step, unit) exact counts and sizes
//   angle(label, path, min, max, step)         angles, Shift snaps 15 deg
//   range(label, loPath, hiPath, min, max, step, unit)  low + high of one range
//   grid(path, options[{ v, l, img? }], o)     6-12 visual choices as tiles
// Shared by every numeric control (rules 1-7):
//   typed value box with unit, clamp, sums (50+10, *2, /2), drag the label (Shift = fine),
//   Up/Down arrows (Shift = 10 steps), double-click resets to the look, one selected
//   control per panel, NO mouse-wheel input (the wheel always scrolls the panel).
// In the Night Arcade style (env.lcd) value boxes show Brew LCD digits and turn
// into a text box while you type.
// ======================================================================
const PF = require("./pixfont.js");
const PNG = require("./png.js");

function hexRGB(h) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(h || "").trim());
  const n = m ? parseInt(m[1], 16) : 0x5cf2ff;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// "50+10", "*2", "/2", "+5", "12.5" -> number (null when it can't be read). No eval.
function evalBox(text, cur) {
  let s = String(text == null ? "" : text).replace(/,/g, ".").replace(/[^0-9.+\-*/() ]/g, "").trim();
  if (!s) return null;
  if (/^[*/]/.test(s) || (/^\+/.test(s) && cur != null)) s = String(cur) + s;
  let i = 0;
  const peek = () => s[i], eat = () => s[i++];
  const ws = () => { while (s[i] === " ") i++; };
  function num() {
    ws();
    if (peek() === "(") { eat(); const v = add(); ws(); if (peek() === ")") eat(); return v; }
    if (peek() === "-") { eat(); return -num(); }
    const m = /^[0-9]*\.?[0-9]+|^[0-9]+\.?/.exec(s.slice(i));
    if (!m) throw new Error("bad");
    i += m[0].length;
    return parseFloat(m[0]);
  }
  function mul() { let v = num(); for (;;) { ws(); const c = peek(); if (c === "*") { eat(); v *= num(); } else if (c === "/") { eat(); const d = num(); v = d ? v / d : v; } else return v; } }
  function add() { let v = mul(); for (;;) { ws(); const c = peek(); if (c === "+") { eat(); v += mul(); } else if (c === "-") { eat(); v -= mul(); } else return v; } }
  try { const v = add(); ws(); return i >= s.length && isFinite(v) ? v : null; } catch (e) { return null; }
}

// angle dial image: ring, tick marks every 45 deg, pointer from the centre
const angleCache = new Map();
function angleImage(deg, glow, sel) {
  const S = 80, c = S / 2, q = Math.round(((deg % 360) + 360) % 360);
  const key = glow + "|" + q + (sel ? "s" : "");
  if (angleCache.has(key)) return angleCache.get(key);
  const rgb = new Uint8Array(S * S * 3), neon = hexRGB(glow), white = [255, 255, 255];
  const R = S * 0.42, a = -q * Math.PI / 180, px = Math.cos(a), py = Math.sin(a);
  const cov = (d) => Math.max(0, Math.min(1, 0.5 - d));
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = x + 0.5 - c, dy = y + 0.5 - c, r = Math.hypot(dx, dy);
    let col = [5, 4, 12];
    const mix = (k, t) => { if (t > 0) col = [col[0] + (k[0] - col[0]) * t, col[1] + (k[1] - col[1]) * t, col[2] + (k[2] - col[2]) * t]; };
    if (sel && r > R && r < R + 5) mix(white, 0.5 * (1 - (r - R) / 5));
    mix(sel ? white : [200, 200, 210], Math.min(cov(r - R), cov(R - 1.5 - r)));
    let ang = Math.atan2(-dy, dx) * 180 / Math.PI; if (ang < 0) ang += 360;
    if (r > R - 7 && r < R - 2 && Math.abs(((ang + 22.5) % 45) - 22.5) < 2.2) mix([120, 120, 130], 1);
    const along = dx * px + dy * py, perp = Math.abs(dx * py - dy * px);
    if (along > -2 && along < R - 3) mix(neon, cov(perp - 1.4));
    if (r < 3.5) mix(neon, cov(r - 3));
    const i = (y * S + x) * 3; rgb[i] = col[0]; rgb[i + 1] = col[1]; rgb[i + 2] = col[2];
  }
  const url = PNG.dataURL(rgb, S, S, 3);
  if (angleCache.size > 800) angleCache.clear();
  angleCache.set(key, url);
  return url;
}

function createControls(env, selection) {
  const { el, bind } = env;
  const S = env.getState;
  const glow = () => env.glow || "#5cf2ff";
  const help = (n, info) => { if (env.help) env.help.attach(n, info); return n; };
  const paintLabel = (n, txt) => { if (env.lcd) PF.paint(n, txt, { font: "label", color: "#e9e7f5" }); else n.textContent = txt; return n; };

  function fmtFor(step) { return (v) => (step >= 1 ? String(Math.round(v)) : Number(v).toFixed(step < 0.1 ? 2 : 1)); }
  function snapFor(min, max, step) {
    return (v) => { v = Math.max(min, Math.min(max, v)); v = min + Math.round((v - min) / step) * step; return parseFloat(v.toFixed(6)); };
  }

  // value box: LCD digits (Night Arcade) over a text box that shows while typing
  function valueBox(o) {
    const input = el("input", { type: "text", class: "dialval" + (o.cls ? " " + o.cls : "") });
    if (!env.lcd) return { node: input, input, draw: (txt) => { if (document.activeElement !== input || !input.__typing) input.value = txt; } };
    const img = el("img", { class: "lcd" });
    const node = el("div", { class: "vbox" + (o.cls ? " " + o.cls : "") }, [img, input]);
    let last = "", lastSel = null;
    const draw = (txt, sel) => {
      if (document.activeElement !== input || !input.__typing) input.value = txt;
      if (txt === last && sel === lastSel) return;
      last = txt; lastSel = sel;
      const t = PF.text(txt, { font: "lcd", color: sel ? "#ffffff" : glow() });
      if (img.__u !== t.url) { img.__u = t.url; img.src = t.url; } img.style.width = t.w + "px"; img.style.height = t.h + "px";
    };
    input.addEventListener("focus", () => node.classList.add("typing"));
    input.addEventListener("blur", () => node.classList.remove("typing"));
    node.addEventListener("mousedown", () => { try { input.focus(); } catch (e) { /* no focus */ } });
    return { node, input, draw };
  }

  // shared numeric behaviour. o: { label, path, min, max, step, unit, kind, cls, visual(me) -> { node, draw(v, sel), press?(e) } }
  function numeric(o) {
    const { path, min, max, step } = o;
    const u = String(o.unit || "").trim();
    const fmt = fmtFor(step), snap = snapFor(min, max, step);
    const get = () => { const v = env.getPath(S(), path); return typeof v === "number" && isFinite(v) ? v : min; };   // missing array slot reads as min
    const startV = get();
    const baseline = () => { let v; try { v = env.getDefault ? env.getDefault(path) : undefined; } catch (e) { v = undefined; } return typeof v === "number" && isFinite(v) ? v : startV; };
    const box = valueBox({ cls: o.boxCls });
    const lab = paintLabel(el("div", { class: "dlabel scrub" }), o.label);
    const me = { path, label: o.label };
    const vis = o.visual(me);
    const isSel = () => selection.get() === me;
    const draw = (v) => { vis.draw(v, isSel()); box.draw(fmt(v), isSel()); };
    me.redraw = () => { if (isSel()) node.classList.add("sel"); else node.classList.remove("sel"); draw(get()); };
    const set = (v, commit) => {
      v = snap(v);
      if (v !== get()) env.setPath(S(), path, v);
      draw(v);
      if (commit) env.onChange(); else if (env.onLive) env.onLive(path);
    };
    me.set = set;
    me.reset = () => set(baseline(), true);
    const pick = () => {
      selection.select(me);
      if (env.onSelect) env.onSelect({ label: o.label, unit: u, min, max, step, kind: o.kind });
    };
    me.pick = pick;
    // double press within 350 ms = reset (UXP does not reliably send dblclick)
    let lastPress = 0;
    me.doublePress = () => { const t = Date.now(), d = t - lastPress < 350; lastPress = d ? 0 : t; return d; };
    const kids = [vis.node, box.node, u && !o.noUnit ? el("span", { class: "dunit", text: u }) : null];
    const node = el("div", { class: o.cls }, o.layout ? o.layout(vis.node, box.node, lab, kids) : [el("div", { class: "dialrow" }, kids), lab]);
    // label scrub: drag sideways or up/down, Shift = fine
    let drag = null;
    const move = (e) => {
      if (!drag) return;
      const k = (e.shiftKey ? 0.2 : 1) * (max - min) / 160;
      set(drag.v + ((e.clientX - drag.x) + (drag.y - e.clientY)) * k, false);
    };
    const up = () => { if (!drag) return; drag = null; document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); env.onChange(); };
    lab.addEventListener("mousedown", (e) => {
      pick();
      if (me.doublePress()) { me.reset(); if (e.preventDefault) e.preventDefault(); return; }
      drag = { x: e.clientX, y: e.clientY, v: get() };
      document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
      if (e.preventDefault) e.preventDefault();
    });
    lab.addEventListener("dblclick", () => me.reset());
    // keys + typing
    const inp = box.input;
    inp.addEventListener("focus", () => pick());
    inp.addEventListener("keydown", (e) => {
      const k = e.key || e.code;
      if (k === "ArrowUp" || k === "ArrowDown" || e.keyCode === 38 || e.keyCode === 40) {
        const dir = (k === "ArrowUp" || e.keyCode === 38) ? 1 : -1;
        inp.__typing = false;
        set(get() + dir * step * (e.shiftKey ? 10 : 1), true);
        if (e.preventDefault) e.preventDefault();
        return;
      }
      if (k === "Enter" || e.keyCode === 13) { commitTyped(); return; }
      if (k === "Escape" || e.keyCode === 27) { inp.__typing = false; draw(get()); return; }
      inp.__typing = true;
    });
    function commitTyped() {
      inp.__typing = false;
      const v = evalBox(inp.value, get());
      if (v == null) { draw(get()); return; }
      set(v, true);
    }
    inp.addEventListener("change", commitTyped);
    inp.addEventListener("blur", () => { if (inp.__typing) commitTyped(); });
    bind(() => draw(get()));
    help(node, { key: path, name: o.label, kind: o.kind, min, max, unit: u, def: () => baseline() });
    node.__ctl = me;
    node.__dial = { set: (v) => set(v, true), select: () => pick(), reset: () => me.reset(), get selected() { return isSel(); }, get value() { return get(); } };
    me.node = node;
    me.get = get;
    return me;
  }

  // drag helper on a visual: f(e, start) -> new value
  function dragOn(n, me, f, opts) {
    let d = null, lastTap = 0;
    const move = (e) => { if (d) me.set(f(e, d), false); };
    const up = (e) => {
      if (!d) return;
      const still = !e || e.clientX == null || (Math.abs(e.clientX - d.x) < 3 && Math.abs(e.clientY - d.y) < 3);
      d = null;
      document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up);
      me.node.classList.remove("turning");
      if (still && !(opts && opts.tapSets)) { const t = Date.now(); if (t - lastTap < 400) { lastTap = 0; me.reset(); return; } lastTap = t; }
      env.onChange();
    };
    n.addEventListener("mousedown", (e) => {
      me.pick();
      if (me.doublePress()) { me.reset(); if (e.preventDefault) e.preventDefault(); return; }
      d = { x: e.clientX, y: e.clientY, v: me.get() };
      if (opts && opts.tapSets) me.set(f(e, d), false);
      me.node.classList.add("turning");
      document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
      if (e.preventDefault) e.preventDefault();
    });
    n.addEventListener("dblclick", () => me.reset());
  }

  // ---- fader: position equals the value
  function fader(label, path, min, max, step, unit) {
    let me = null;
    const fill = el("div", { class: "ffill" }), thumb = el("div", { class: "fthumb" });
    const track = el("div", { class: "ftrack" }, [fill, thumb]);
    const frac = (v) => Math.max(0, Math.min(1, (v - min) / (max - min || 1)));
    me = numeric({ label, path, min, max, step, unit, kind: "fader", cls: "fader", boxCls: "fbox",
      layout: (vis, box, lab, kids) => [el("div", { class: "frow" }, [lab, kids[1], kids[2]]), vis],
      visual: () => ({ node: track, draw: (v) => { const p = (frac(v) * 100).toFixed(2) + "%"; fill.style.width = p; thumb.style.left = p; } }) });
    const at = (e, d) => {
      let r = null; try { r = track.getBoundingClientRect(); } catch (err) { r = null; }
      const W = (r && r.width) || track.clientWidth || 100;
      if (e.shiftKey && d) return d.v + (e.clientX - d.x) * 0.2 * (max - min) / W;   // fine
      const x = r ? e.clientX - r.left : (e.offsetX || 0);
      return min + Math.max(0, Math.min(1, x / W)) * (max - min);
    };
    dragOn(track, me, at, { tapSets: true });
    return me.node;
  }

  // ---- stepper: - [box] + ; hold to repeat
  function stepper(label, path, min, max, step, unit) {
    let me = null;
    const minus = el("button", { class: "stepb", text: "-" }), plus = el("button", { class: "stepb", text: "+" });
    const vis = el("span", { class: "stepvis" });
    me = numeric({ label, path, min, max, step, unit, kind: "stepper", cls: "stepper",
      layout: (v, box, lab, kids) => [el("div", { class: "srow" }, [lab, minus, box, plus, kids[2]])],
      visual: () => ({ node: vis, draw: () => {} }) });
    const hold = (btn, dir) => {
      let t1 = null, t2 = null;
      const stop = () => { clearTimeout(t1); clearInterval(t2); t1 = t2 = null; };
      btn.addEventListener("mousedown", (e) => {
        me.pick();
        me.set(me.get() + dir * step * (e.shiftKey ? 10 : 1), true);
        stop();
        t1 = setTimeout(() => { t2 = setInterval(() => me.set(me.get() + dir * step, true), 70); }, 420);
      });
      btn.addEventListener("mouseup", stop); btn.addEventListener("mouseleave", stop);
    };
    hold(minus, -1); hold(plus, 1);
    help(minus, { key: path, name: label + " -", kind: "stepper", min, max, unit });
    help(plus, { key: path, name: label + " +", kind: "stepper", min, max, unit });
    return me.node;
  }

  // ---- angle dial: drag round the centre, Shift snaps to 15 deg
  function angle(label, path, min, max, step) {
    let me = null;
    const img = el("img", { class: "adial" });
    min = min == null ? 0 : min; max = max == null ? 360 : max; step = step || 1;
    me = numeric({ label, path, min, max, step, unit: "°", kind: "angle", cls: "angle dial",
      visual: () => ({ node: img, draw: (v, sel) => { const u = angleImage(v, glow(), sel); if (img.__u !== u) { img.__u = u; img.src = u; } } }) });
    dragOn(img, me, (e, d) => {
      let r = null; try { r = img.getBoundingClientRect(); } catch (err) { r = null; }
      if (!r || !r.width) return d.v + (d.y - e.clientY);
      let a = Math.atan2(-(e.clientY - (r.top + r.height / 2)), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
      if (a < 0) a += 360;
      if (max <= 180 && a > 180) a -= 180;           // 0-180 controls (line angles) fold over
      if (e.shiftKey) a = Math.round(a / 15) * 15;
      return a;
    });
    return me.node;
  }

  // ---- range bar: two handles + two boxes
  function range(label, loPath, hiPath, min, max, step, unit) {
    const bar = el("div", { class: "rfill" }), h1 = el("div", { class: "rh" }), h2 = el("div", { class: "rh" });
    const track = el("div", { class: "rtrack" }, [bar, h1, h2]);
    let lo = null, hi = null;     // paint() runs while the boxes are being built
    lo = numeric({ label: label + " low", path: loPath, min, max, step, unit, kind: "range", cls: "rpart", noUnit: true, layout: (v, box) => [box], visual: () => ({ node: el("span"), draw: () => paint() }) });
    hi = numeric({ label: label + " high", path: hiPath, min, max, step, unit, kind: "range", cls: "rpart", layout: (v, box, l, kids) => [box, kids[2]], visual: () => ({ node: el("span"), draw: () => paint() }) });
    // keep low <= high
    const loSet = lo.set, hiSet = hi.set;
    lo.set = (v, c) => loSet(Math.min(v, hi.get()), c);
    hi.set = (v, c) => hiSet(Math.max(v, lo.get()), c);
    const frac = (v) => Math.max(0, Math.min(1, (v - min) / (max - min || 1)));
    function paint() {
      if (!lo || !hi) return;
      const a = frac(lo.get()) * 100, b = frac(hi.get()) * 100;
      h1.style.left = a + "%"; h2.style.left = b + "%";
      bar.style.left = a + "%"; bar.style.width = Math.max(0, b - a) + "%";
    }
    const pos = (e) => {
      let r = null; try { r = track.getBoundingClientRect(); } catch (err) { r = null; }
      const W = (r && r.width) || 100, x = r ? e.clientX - r.left : (e.offsetX || 0);
      return min + Math.max(0, Math.min(1, x / W)) * (max - min);
    };
    let d = null;
    const move = (e) => {
      if (!d) return;
      const v = pos(e);
      if (d.which === "both") { const dv = v - d.v0, w = d.hi - d.lo; const nl = Math.max(min, Math.min(max - w, d.lo + dv)); loSet(nl, false); hiSet(nl + w, false); }
      else if (d.which === "lo") lo.set(v, false); else hi.set(v, false);
    };
    const up = () => { if (!d) return; d = null; document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); env.onChange(); };
    track.addEventListener("mousedown", (e) => {
      const v = pos(e), l = lo.get(), h = hi.get();
      const which = e.target === bar ? "both" : (Math.abs(v - l) <= Math.abs(v - h) ? "lo" : "hi");
      (which === "hi" ? hi : lo).pick();
      if (lo.doublePress()) { lo.reset(); hi.reset(); return; }
      d = { which, v0: v, lo: l, hi: h };
      if (which !== "both") move(e);
      document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
      if (e.preventDefault) e.preventDefault();
    });
    const lab = paintLabel(el("div", { class: "dlabel" }), label);
    const node = el("div", { class: "rangebar" }, [el("div", { class: "frow" }, [lab, lo.node, el("span", { class: "rsep", text: "to" }), hi.node]), track]);
    help(node, { key: loPath, name: label, kind: "range", min, max, unit });
    help(track, { key: loPath, name: label, kind: "range", min, max, unit });
    bind(paint);
    return node;
  }

  // ---- thumbnail grid: 6-12 visual options, each a tile with its name
  function grid(path, options, o) {
    o = o || {};
    const wrap = el("div", { class: "tgrid" + (o.cls ? " " + o.cls : "") });
    const tiles = options.map((op) => {
      const img = op.img ? el("img", { class: "timg", src: typeof op.img === "function" ? op.img() : op.img }) : el("div", { class: "timg blank" });
      const name = paintLabel(el("div", { class: "tname" }), op.l);
      const t = el("div", { class: "tile" + (op.img ? "" : " noimg") }, [img, name]);
      t.addEventListener("click", () => { env.setPath(S(), path, op.v); if (o.after) o.after(op.v); env.onChange(); });
      help(t, { key: path + "=" + op.v, name: op.l, kind: "grid" });
      wrap.appendChild(t);
      return { t, op, img };
    });
    bind(() => { const cur = env.getPath(S(), path); tiles.forEach((x) => { if (x.op.v === cur) x.t.classList.add("on"); else x.t.classList.remove("on"); }); });
    wrap.__grid = { tiles, setImage: (v, url) => { const x = tiles.find((q) => q.op.v === v); if (x && x.img.tagName === "IMG") x.img.src = url; } };
    return wrap;
  }

  return { fader, stepper, angle, range, grid, numeric, valueBox };
}

module.exports = { createControls, evalBox, angleImage };
