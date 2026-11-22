"use strict";
// ======================================================================
// "Hardware Console" panel brand (Frank picked concept C, 2026-11-22).
// Opt-in per tool with createToolPanel({ brand: "console", code: "PB-09", glow: "#4d7cff" }).
//   header(): rack unit with screw corners, FRANK'S · <code>, the wordmark
//             in the tool's neon and a status LED (READY / BUSY / ERROR)
//   dial():   rotary knob for a number setting (drag up/down, Shift = fine,
//             mouse wheel, or type the value under it)
//   toggle(): on/off switch for a boolean setting
//   meter():  12-segment LED render meter for Apply
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
function dialImage(frac, glow) {
  frac = Math.max(0, Math.min(1, frac || 0));
  const q = Math.round(frac * STEPS);
  const key = glow + "|" + q;
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
      // knob: black disc, white rim, white pointer
      mix(white, Math.min(cov(r - K), cov(K - 2 - r)) );
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

  function dial(label, path, min, max, step, unit) {
    const S = env.getState;
    // the unit is left off the readout so it fits under the knob; it is in the tooltip
    const fmt = (v) => (step >= 1 ? String(Math.round(v)) : Number(v).toFixed(step < 0.1 ? 2 : 1));
    const snap = (v) => {
      v = Math.max(min, Math.min(max, v));
      v = min + Math.round((v - min) / step) * step;
      return parseFloat(v.toFixed(6));
    };
    const tip = label + (unit ? " (" + String(unit).trim() + ")" : "") + ": drag up or down (Shift = fine), scroll, or type a value";
    const img = el("img", { class: "knob", title: tip });
    const val = el("input", { type: "text", class: "dialval", title: tip });
    const lab = el("div", { class: "dlabel", text: label });
    const node = el("div", { class: "dial" }, [img, val, lab]);
    const draw = (v) => { img.src = dialImage((v - min) / (max - min || 1), glow()); val.value = fmt(v); };
    const set = (v, commit) => {
      v = snap(v);
      if (v !== env.getPath(S(), path)) env.setPath(S(), path, v);
      draw(v);
      if (commit) env.onChange();
    };
    let drag = null;
    const move = (e) => {
      if (!drag) return;
      const k = (e.shiftKey ? 0.2 : 1) * (max - min) / 160;
      set(drag.v + (drag.y - e.clientY) * k, false);
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
      drag = { y: e.clientY, v: env.getPath(S(), path) };
      node.classList.add("turning");
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
      if (e.preventDefault) e.preventDefault();
    });
    img.addEventListener("mousemove", move);
    img.addEventListener("mouseup", up);
    img.addEventListener("wheel", (e) => {
      const dir = e.deltaY < 0 ? 1 : -1;
      set(env.getPath(S(), path) + dir * Math.max(step, (max - min) / 50), true);
      if (e.preventDefault) e.preventDefault();
    });
    val.addEventListener("change", () => {
      const v = parseFloat(val.value);
      if (isNaN(v)) { draw(env.getPath(S(), path)); return; }
      set(v, true);
    });
    bind(() => draw(env.getPath(S(), path)));
    node.__dial = { set: (v) => set(v, true) };
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

  return { header, dial, toggle, meter };
}

module.exports = { createConsoleKit, dialImage };
