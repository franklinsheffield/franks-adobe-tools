"use strict";
// ======================================================================
// "Hardware Console" panel brand (Frank picked concept C, 2026-11-22).
// Opt-in per tool with createToolPanel({ brand: "console", code: "PB-09", glow: "#6c96ff" }).
//   header(): rack unit with screw corners, FRANK'S · <code>, the wordmark
//             in the tool's neon and a status LED (READY / BUSY / ERROR)
//   dial():   rotary knob for a number setting with a value box beside it.
//             Click the knob or its box to select it (white glow, one per panel);
//             Up/Down arrows step it (Shift = 10 steps), drag up/down (Shift = fine),
//             or type a value (Frank, 2026-11-22). 3.0: no mouse wheel (rule 1).
//             Research quick wins (2026-11-23): drag the label too (Adobe "scrubby"
//             labels), double-click the knob or label to reset it to the look's
//             value, the unit shows beside the box, and env.onSelect(info) lets the
//             panel show live key hints for the selected knob.
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
        el("div", { class: "sub rackcode", text: (env.lcd ? "FRANK'S " : "FRANK'S  -  ") + (cfg.code || "BREW") }),
        el("div", { class: "title", text: name })
      ]),
      el("div", { class: "rackr" }, [env.help ? env.help.switchNode() : null, led, ledTxt])
    ]);
    if (env.help) env.help.attach(led.parentNode, { key: "help.led", name: "Status light", kind: "info" });
    function set(mode) {
      led.className = "led" + (mode === "busy" ? " busy" : mode === "err" ? " err" : "");
      ledTxt.textContent = mode === "busy" ? "BUSY" : mode === "err" ? "ERROR" : "READY";
    }
    return { node, set };
  }

  let selected = null;   // the one selected control in this panel (knob, fader, stepper, ...)
  function select(d) {
    if (selected === d) return;
    const old = selected;
    selected = d;
    if (old && old.redraw) old.redraw();
    if (d && d.redraw) d.redraw();
  }
  const selection = { select, get: () => selected };
  const C = require("./controls.js").createControls(env, selection);

  // Rule 1 (Brew 3.0, Frank 2026-11-24): NO mouse-wheel input on any control. The wheel
  // always scrolls the panel, even with the pointer over a knob. (Panel system 2 turned
  // knobs with the wheel; that is gone.) Values change by drag, arrows, typing or label drag.
  function dial(label, path, min, max, step, unit) {
    let me = null;
    const img = el("img", { class: "knob" });
    me = C.numeric({ label, path, min, max, step, unit, kind: "knob", cls: "dial",
      visual: () => ({ node: img, draw: (v, sel) => { img.src = dialImage((v - min) / (max - min || 1), glow(), sel); } }) });
    // pressing the knob selects it and focuses its box so the arrow keys reach it
    const focusBox = () => { const i = me.node.querySelector(".dialval"); try { if (document.activeElement !== i) i.focus(); } catch (e) { /* host without focus() */ } };
    let drag = null, lastTap = 0;
    const move = (e) => {
      if (!drag) return;
      const k = (e.shiftKey ? 0.2 : 1) * (max - min) / 160;
      me.set(drag.v + (drag.y - e.clientY) * k, false);
    };
    // a press-release that didn't move is a tap; two taps within 400 ms reset too
    // (UXP on the Mac can swallow the second mousedown, 2026-11-24)
    const up = (e) => {
      if (!drag) return;
      const still = !e || e.clientX == null || (Math.abs(e.clientX - drag.x) < 3 && Math.abs(e.clientY - drag.y) < 3);
      drag = null;
      if (still) { const t = Date.now(); if (t - lastTap < 400) { lastTap = 0; me.reset(); } else lastTap = t; }
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      me.node.classList.remove("turning");
      env.onChange();
    };
    img.addEventListener("mousedown", (e) => {
      me.pick(); focusBox();
      if (me.doublePress()) { me.reset(); if (e.preventDefault) e.preventDefault(); return; }
      drag = { x: e.clientX, y: e.clientY, v: me.get() };
      me.node.classList.add("turning");
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
      if (e.preventDefault) e.preventDefault();
    });
    img.addEventListener("mousemove", move); img.addEventListener("mouseup", up);
    img.addEventListener("dblclick", (e) => { me.reset(); if (e.preventDefault) e.preventDefault(); });
    return me.node;
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
    // the whole row is the click target, not just the small switch (WCAG 2.5.8 target size)
    const lab = el("span", { class: "lbl2 swlbl", text: label });
    lab.addEventListener("click", () => sw.click());
    const rowN = el("div", { class: "row chk swrow" }, [lab, sw]);
    if (env.help) env.help.attach(rowN, { key: path, name: label, kind: "switch" });
    return rowN;
  }

  // small inline switch for panel-level options (Auto-update, Pin on top) that are not in state
  function miniToggle(label, initial, onSet, title, helpKey) {
    let v = !!initial;
    const sw = el("div", { class: "switch" + (v ? " on" : ""), role: "switch", title: title || label }, [el("div", { class: "swknob" })]);
    const show = () => { if (v) sw.classList.add("on"); else sw.classList.remove("on"); };
    const set = (nv) => { v = !!nv; show(); onSet(v); };
    sw.addEventListener("click", () => set(!v));
    const node = el("span", { class: "minisw" }, [el("span", { class: "lbl2", text: label }), sw]);
    node.__sw = { get: () => v, set };
    if (env.help) env.help.attach(node, { key: helpKey || ("opt:" + label), name: label, kind: "switch" });
    return node;
  }

  function meter(n) {
    n = n || 12;
    const segs = [];
    for (let i = 0; i < n; i++) segs.push(el("div", { class: "seg8" }));
    const pct = el("span", { class: "mpct", text: "" });
    const node = el("div", { class: "meter" }, [el("span", { class: "sub mlbl", text: "RENDER" }), el("div", { class: "segs" }, segs), pct]);
    if (env.help) env.help.attach(node, { key: "apply.meter", name: "Render meter", kind: "info" });
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

  return { header, dial, toggle, miniToggle, meter, fader: C.fader, stepper: C.stepper, angle: C.angle, range: C.range, grid: C.grid, valueBox: C.valueBox,
    get selectedDial() { return selected ? selected.node : null; } };
}

module.exports = { createConsoleKit, dialImage };
