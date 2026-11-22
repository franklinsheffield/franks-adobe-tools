"use strict";
// ======================================================================
// "Hardware Console" panel brand (Frank picked concept C, 2026-11-22).
// Opt-in per tool with createToolPanel({ brand: "console", code: "PB-09", glow: "#4d7cff" }).
//   header(): rack unit with screw corners, FRANK'S · <code>, the wordmark
//             in the tool's neon and a status LED (READY / BUSY / ERROR)
//   dial():   rotary knob for a number setting with a value box beside it.
//             Click the knob or its box to select it (white glow, one per panel);
//             Up/Down arrows step it (Shift = 10 steps), the mouse wheel turns it,
//             drag up/down (Shift = fine), or type a value (Frank, 2026-11-22).
//   toggle(): on/off switch for a boolean setting
//   miniToggle(): inline switch for panel options outside state (Auto-update, Pin on top)
//   meter():  12-segment LED render meter for Apply
// createUI({ onLive(path) }) is called while a dial is being dragged (Dithers live frames).
// Knobs are drawn as small PNGs (shared/png.js) because UXP's SVG and
// canvas support is patchy; images are cached per position and colour.
// Styles live in panel.css under #app.brand-console.
// ======================================================================
const PNG = require("./png.js");

function hexRGB(h) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(h || "").trim());
  const n = m ? parseInt(m[1], 16) : 0x8fd8ff;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ---- knob image: 270 degree arc from bottom-left to bottom-right
const DIAL_PX = 96, STEPS = 120;
const dialCache = new Map();
function dialImage(frac, glow, sel) {
  frac = Math.max(0, Math.min(1, frac || 0));
  const q = Math.round(frac * STEPS);
  const key = glow + "|" + q + (sel ? "|s" : "");
  if (dialCache.has(key)) return dialCache.get(key);
  const f = q / STEPS, S = DIAL_PX, c = S / 2, rgb = new Uint8Array(S * S * 3);
  const neon = hexRGB(glow), track = [58, 58, 58], white = [255, 255, 255];
  const R1 = S * 0.36, R2 = S * 0.45;              // arc ring
  const K = S * 0.27;                               // knob radius
  const a0 = 135, sweep = 270, aEnd = a0 + sweep * f;
  const pa = aEnd * Math.PI / 180, px = Math.cos(pa), py = Math.sin(pa);
  const cov = (d) => Math.max(0, Math.min(1, 0.5 - d));   // 1px anti-alias
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = x + 0.5 - c, dy = y + 0.5 - c, r = Math.hypot(dx, dy);
      let col = [0, 0, 0];
      const mix = (k, t) => { if (t > 0) col = [col[0] + (k[0] - col[0]) * t, col[1] + (k[1] - col[1]) * t, col[2] + (k[2] - col[2]) * t]; };
      let ang = Math.atan2(dy, dx) * 180 / Math.PI; if (ang < 0) ang += 360;
      const rel = (ang - a0 + 360) % 360;
      if (rel <= sweep) {
        const t = Math.min(cov(R1 - r), cov(r - R2));
        mix(rel <= sweep * f ? neon : track, t);
      }
      // soft glow just outside the lit arc
      if (rel <= sweep * f && r > R2 && r < R2 + 4) mix(neon, 0.18 * (1 - (r - R2) / 4));
      // selected: white halo around the knob
      if (sel && r > K - 1 && r < K + 7) mix(white, 0.55 * Math.pow(1 - (r - K + 1) / 8, 1.5));
      if (sel && r < K - 2) mix([24, 24, 24], 1);
      // knob: black disc, white rim, white pointer
      mix(white, Math.min(cov(r - K), cov(K - (sel ? 3 : 2) - r)) );
      const along = dx * px + dy * py, perp = Math.abs(dx * py - dy * px);
      if (along > 0 && along < K - 5) mix(white, cov(perp - 1.6));
      const i = (y * S + x) * 3;
      rgb[i] = col[0]; rgb[i + 1] = col[1]; rgb[i + 2] = col[2];
    }
  }
  const url = PNG.dataURL(rgb, S, S, 3);
  dialCache.set(key, url);
  return url;
}

function createConsoleKit(env) {
  // env: { el, bind, getState, getPath, setPath, onChange, glow }
  const { el, bind } = env;
  const glow = () => env.glow || "#8fd8ff";

  function header(cfg) {
    const screw = (pos, v) => el("div", { class: "screw " + pos }, [el("div", { class: "slot" + (v ? " v" : "") })]);
    const name = String(cfg.title || "").replace(/^Frank's\s+/i, "").toUpperCase();
    const led = el("div", { class: "led" });
    const ledTxt = el("span", { class: "ledtxt", text: "READY" });
    const node = el("div", { class: "rack" }, [
      screw("tl"), screw("tr", true), screw("bl", true), screw("br"),
      el("div", { class: "rackl" }, [
        el("div", { class: "sub rackcode", text: "FRANK'S  -  " + (cfg.code || "BREW") }),
        el("div", { class: "title", text: name })
      ]),
      el("div", { class: "rackr" }, [led, ledTxt])
    ]);
    function set(mode) {
      led.className = "led" + (mode === "busy" ? " busy" : mode === "err" ? " err" : "");
      ledTxt.textContent = mode === "busy" ? "BUSY" : mode === "err" ? "ERROR" : "READY";
    }
    return { node, set };
  }

  let selected = null;   // the one selected dial in this panel
  function select(d) {
    if (selected === d) return;
    const old = selected;
    selected = d;
    if (old) old.redraw();
    if (d) d.redraw();
  }

  function dial(label, path, min, max, step, unit) {
    const S = env.getState;
    const fmt = (v) => (step >= 1 ? String(Math.round(v)) : Number(v).toFixed(step < 0.1 ? 2 : 1));
    const snap = (v) => {
      v = Math.max(min, Math.min(max, v));
      v = min + Math.round((v - min) / step) * step;
      return parseFloat(v.toFixed(6));
    };
    const tip = label + (unit ? " (" + String(unit).trim() + ")" : "") + ": click to select, then Up/Down arrows (Shift = x10), mouse wheel, drag, or type a value";
    const img = el("img", { class: "knob", title: tip });
    const val = el("input", { type: "text", class: "dialval", title: tip });
    const lab = el("div", { class: "dlabel", text: label });
    const node = el("div", { class: "dial" }, [el("div", { class: "dialrow" }, [img, val]), lab]);
    const me = {
      node,
      redraw() {
        const on = selected === me;
        if (on) node.classList.add("sel"); else node.classList.remove("sel");
        draw(env.getPath(S(), path));
      }
    };
    const draw = (v) => {
      img.src = dialImage((v - min) / (max - min || 1), glow(), selected === me);
      if (document.activeElement !== val || !val.__typing) val.value = fmt(v);
    };
    const set = (v, commit) => {
      v = snap(v);
      if (v !== env.getPath(S(), path)) env.setPath(S(), path, v);
      draw(v);
      if (commit) env.onChange();
    };
    const pick = () => { select(me); try { if (document.activeElement !== val) val.focus(); } catch (e) { /* host without focus() */ } };
    let drag = null;
    const move = (e) => {
      if (!drag) return;
      const k = (e.shiftKey ? 0.2 : 1) * (max - min) / 160;
      set(drag.v + (drag.y - e.clientY) * k, false);
      if (env.onLive) env.onLive(path);   // optional: tools that render live frames while a knob turns
    };
    const up = () => {
      if (!drag) return;
      drag = null;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      node.classList.remove("turning");
      env.onChange();
    };
    img.addEventListener("mousedown", (e) => {
      pick();
      drag = { y: e.clientY, v: env.getPath(S(), path) };
      node.classList.add("turning");
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
      if (e.preventDefault) e.preventDefault();
    });
    img.addEventListener("mousemove", move);
    img.addEventListener("mouseup", up);
    const wheel = (e) => {
      const dir = e.deltaY < 0 ? 1 : -1;
      pick();
      set(env.getPath(S(), path) + dir * Math.max(step, (max - min) / 50), true);
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    };
    img.addEventListener("wheel", wheel);
    val.addEventListener("wheel", wheel);
    val.addEventListener("focus", () => select(me));
    val.addEventListener("mousedown", () => select(me));
    val.addEventListener("keydown", (e) => {
      const k = e.key || e.code;
      if (k === "ArrowUp" || k === "ArrowDown" || e.keyCode === 38 || e.keyCode === 40) {
        const dir = (k === "ArrowUp" || e.keyCode === 38) ? 1 : -1;
        val.__typing = false;
        set(env.getPath(S(), path) + dir * step * (e.shiftKey ? 10 : 1), true);
        if (e.preventDefault) e.preventDefault();
        return;
      }
      if (k === "Enter" || e.keyCode === 13) { commitTyped(); return; }
      if (k === "Escape" || e.keyCode === 27) { val.__typing = false; draw(env.getPath(S(), path)); return; }
      val.__typing = true;
    });
    function commitTyped() {
      val.__typing = false;
      const v = parseFloat(String(val.value).replace(",", "."));
      if (isNaN(v)) { draw(env.getPath(S(), path)); return; }
      set(v, true);
    }
    val.addEventListener("change", commitTyped);
    val.addEventListener("blur", () => { if (val.__typing) commitTyped(); });
    bind(() => draw(env.getPath(S(), path)));
    node.__dial = { set: (v) => set(v, true), select: () => pick(), get selected() { return selected === me; } };
    return node;
  }

  function toggle(label, path, after) {
    const S = env.getState;
    const knob = el("div", { class: "swknob" });
    const sw = el("div", { class: "switch", role: "switch", title: label }, [knob]);
    sw.addEventListener("click", () => {
      const v = !env.getPath(S(), path);
      env.setPath(S(), path, v);
      if (after) after(v);
      env.onChange();
    });
    bind(() => { if (env.getPath(S(), path)) sw.classList.add("on"); else sw.classList.remove("on"); });
    return el("div", { class: "row chk swrow" }, [el("span", { class: "lbl2 swlbl", text: label }), sw]);
  }

  // small inline switch for panel-level options (Auto-update, Pin on top) that are not in state
  function miniToggle(label, initial, onSet, title) {
    let v = !!initial;
    const sw = el("div", { class: "switch" + (v ? " on" : ""), role: "switch", title: title || label }, [el("div", { class: "swknob" })]);
    const show = () => { if (v) sw.classList.add("on"); else sw.classList.remove("on"); };
    const set = (nv) => { v = !!nv; show(); onSet(v); };
    sw.addEventListener("click", () => set(!v));
    const node = el("span", { class: "minisw" }, [el("span", { class: "lbl2", text: label }), sw]);
    node.__sw = { get: () => v, set };
    return node;
  }

  function meter(n) {
    n = n || 12;
    const segs = [];
    for (let i = 0; i < n; i++) segs.push(el("div", { class: "seg8" }));
    const pct = el("span", { class: "mpct", text: "" });
    const node = el("div", { class: "meter" }, [el("span", { class: "sub mlbl", text: "RENDER" }), el("div", { class: "segs" }, segs), pct]);
    let timer = null, pos = 0;
    const light = (k, chase) => segs.forEach((s, i) => {
      const on = chase ? (i <= k && i > k - 4) : i < k;
      if (on) s.classList.add("on"); else s.classList.remove("on");
    });
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    return {
      node,
      run() { stop(); pos = 0; pct.textContent = ""; timer = setInterval(() => { pos = (pos + 1) % (n + 3); light(pos, true); }, 90); },
      done(sec) { stop(); light(n, false); pct.textContent = sec != null ? sec.toFixed(1) + " S" : ""; },
      idle() { stop(); light(0, false); pct.textContent = ""; }
    };
  }

  return { header, dial, toggle, miniToggle, meter, get selectedDial() { return selected ? selected.node : null; } };
}

module.exports = { createConsoleKit, dialImage };
