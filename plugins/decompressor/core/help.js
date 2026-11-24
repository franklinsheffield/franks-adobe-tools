"use strict";
// ======================================================================
// Brew 3.0 hover help (Frank, 2026-11-24; spec section "Hover help").
//   Rest the pointer on a control: a short hint after 0.6 s (name, range,
//   keys), the full help pop-up after 5 s (setting: 2 / 5 / 10 s). Once a
//   pop-up has shown, a neighbouring control shows its help after 0.5 s.
//   Closes on pointer away, any click or key press, or Esc.
//   Assistance switch (rack header + flyout menu) turns every bubble off.
//   Both settings are remembered per plugin; Assistance starts on.
//
//   const help = createHelp({ el, storeKey, lookup(key) -> text, root: () => appNode });
//   help.attach(node, { key, name, kind, min, max, unit, def })
//   help.missing() -> [{ key, name }] controls without help text (tests fail on these)
// Text comes from the plugin's help.js plus shared/help-text.js.
// ======================================================================

const KEYS = {
  knob: "Drag up/down or drag the name. Shift = fine. Up/Down arrows step (Shift x10). Type a value or sum (50+10, *2). Double-click resets to the look.",
  fader: "Click or drag along the bar. Shift = fine. Up/Down arrows step (Shift x10). Type a value. Double-click resets to the look.",
  stepper: "Press - / + (hold to repeat) or drag the name. Up/Down arrows step (Shift x10). Type a value or sum. Double-click resets to the look.",
  angle: "Drag around the dial. Shift snaps to 15°. Up/Down arrows step (Shift x10). Type a value. Double-click resets to the look.",
  range: "Drag either handle, or drag the bar between them to move both. Type values in the boxes. Double-click resets to the look.",
  seg: "Click a button to choose.",
  grid: "Click a tile to choose.",
  select: "Click to open the list and pick one.",
  switch: "Click the switch or its name to turn it on or off.",
  button: "Click to run.",
  tab: "Click to show this effect's controls. Click the dot to switch the effect on or off without losing its values.",
  card: "Click the title to fold or open the card.",
  swatch: "Click the swatch to open Photoshop's colour picker, or type a hex value.",
  preview: "",
  info: ""
};

function createHelp(o) {
  const el = o.el;
  const KEY = "brew.help." + (o.storeKey || "panel");
  let on = true, delay = 5;
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (typeof s.on === "boolean") on = s.on;
    if ([2, 5, 10].indexOf(s.delay) >= 0) delay = s.delay;
  } catch (e) { /* no storage */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ on, delay })); } catch (e) { /* no storage */ } };
  const listeners = [];
  const nodes = [];

  let tip = null, pop = null, cur = null, tHint = null, tPop = null, warmUntil = 0;
  function root() { return (o.root && o.root()) || document.getElementById("app") || document.body; }
  function clearTimers() { clearTimeout(tHint); clearTimeout(tPop); tHint = tPop = null; }
  function hideAll() {
    if (tip && tip.parentNode) tip.parentNode.removeChild(tip);
    if (pop && pop.parentNode) { pop.parentNode.removeChild(pop); warmUntil = Date.now() + 1200; }
    tip = pop = null;
  }
  function close() { clearTimers(); hideAll(); cur = null; }

  function textFor(info) {
    let t = "";
    try { t = o.lookup ? o.lookup(info.key, info) : ""; } catch (e) { t = ""; }
    return String(t || "").trim();
  }
  function rangeLine(info) {
    if (info.min == null || info.max == null) return "";
    const u = info.unit ? " " + String(info.unit).trim() : "";
    let s = "Range " + info.min + " to " + info.max + u;
    let d = null;
    try { d = typeof info.def === "function" ? info.def() : info.def; } catch (e) { d = null; }
    if (d != null && d !== "") s += ". This look: " + (typeof d === "number" ? +d.toFixed(2) : d) + u;
    return s + ".";
  }
  function shortLine(info) {
    const k = info.kind || "";
    const bits = [String(info.name || "").toUpperCase()];
    if (info.min != null) bits.push(info.min + "-" + info.max + (info.unit ? " " + String(info.unit).trim() : ""));
    if (k === "knob") bits.push("drag / arrows / dbl-click reset");
    else if (k === "fader") bits.push("click or drag / arrows");
    else if (k === "stepper") bits.push("- / + / arrows");
    else if (k === "angle") bits.push("drag round, Shift snaps 15°");
    else if (k === "range") bits.push("drag handles");
    return bits.join("  |  ");
  }

  // place a bubble beside the control (never over it), inside the panel
  function place(b, node) {
    const R = root();
    let rr = null, nr = null;
    try { rr = R.getBoundingClientRect(); nr = node.getBoundingClientRect(); } catch (e) { /* no layout */ }
    R.appendChild(b);
    if (!rr || !nr) return;
    const bw = Math.min(260, Math.max(120, (rr.width || 300) - 16));
    b.style.maxWidth = bw + "px";
    const bh = b.offsetHeight || 60;
    let top = nr.bottom - rr.top + 4;
    if (top + bh > (rr.height || 800) - 4) top = nr.top - rr.top - bh - 4;   // flip above
    if (top < 4) top = 4;
    let left = nr.left - rr.left;
    if (left + bw > (rr.width || 300) - 8) left = Math.max(8, (rr.width || 300) - 8 - bw);
    b.style.top = Math.round(top) + "px";
    b.style.left = Math.round(Math.max(8, left)) + "px";
  }
  function showHint(node, info) {
    if (!on || pop) return;
    hideAll();
    tip = el("div", { class: "helptip" }, [el("span", { text: shortLine(info) })]);
    place(tip, node);
  }
  function showPop(node, info) {
    if (!on) return;
    hideAll();
    const body = textFor(info);
    const keys = info.keys || KEYS[info.kind] || "";
    const range = rangeLine(info);
    const head = el("div", { class: "helpname" });
    if (o.paintName) o.paintName(head, String(info.name || "")); else head.textContent = String(info.name || "");
    pop = el("div", { class: "helppop" }, [
      el("div", { class: "helpbar" }), head,
      body ? el("div", { class: "helptext", text: body }) : null,
      info.note ? el("div", { class: "helptext note", text: info.note }) : null,
      range ? el("div", { class: "helprange", text: range }) : null,
      keys ? el("div", { class: "helpkeys", text: keys }) : null
    ]);
    place(pop, node);
  }

  function attach(node, info) {
    if (!node || node.__help) return node;
    info = Object.assign({}, info);
    if (!info.name) info.name = info.key;
    node.__help = info;
    node.setAttribute("data-help", info.key || "");
    // the old native tooltips would double up with the bubbles (and ignore Assistance off)
    if (node.getAttribute && node.getAttribute("title")) { info.fallback = node.getAttribute("title"); node.removeAttribute("title"); }
    nodes.push(node);
    node.addEventListener("mouseover", (e) => {
      const from = e.relatedTarget;
      if (from && node.contains && node.contains(from)) return;
      if (cur === node) return;
      // a control inside another helped control (a knob inside a card) takes over
      clearTimers(); hideAll(); cur = node;
      if (!on) return;
      const warm = Date.now() < warmUntil;
      tHint = setTimeout(() => { if (cur === node) showHint(node, info); }, warm ? 250 : 600);
      tPop = setTimeout(() => { if (cur === node) showPop(node, info); }, warm ? 500 : delay * 1000);
      if (e.stopPropagation) e.stopPropagation();
    });
    node.addEventListener("mouseout", (e) => {
      const to = e.relatedTarget;
      if (to && node.contains && node.contains(to)) return;
      if (cur === node) close();
    });
    return node;
  }
  try {
    document.addEventListener("mousedown", () => close(), true);
    document.addEventListener("keydown", () => close(), true);
  } catch (e) { /* no document */ }

  function setOn(v) { on = !!v; if (!on) close(); save(); listeners.forEach((f) => { try { f(on, delay); } catch (e) { /* listener */ } }); }
  function setDelay(s) { if ([2, 5, 10].indexOf(s) >= 0) { delay = s; save(); listeners.forEach((f) => { try { f(on, delay); } catch (e) { /* listener */ } }); } }

  // Assistance switch for the rack header: LED lit while on, the word beside it
  function switchNode() {
    const led = el("div", { class: "aled" });
    const n = el("div", { class: "assist", role: "switch" }, [led, el("span", { class: "asstxt", text: "HELP" })]);
    const show = () => { if (on) n.classList.add("on"); else n.classList.remove("on"); };
    n.addEventListener("click", (e) => { setOn(!on); if (e.stopPropagation) e.stopPropagation(); });
    listeners.push(show); show();
    attach(n, { key: "help.assist", name: "Assistance", kind: "switch" });
    return n;
  }

  return {
    attach, close, setOn, setDelay, switchNode,
    onChange: (f) => listeners.push(f),
    get on() { return on; }, get delay() { return delay; },
    missing: () => nodes.filter((n) => !textFor(n.__help)).map((n) => ({ key: n.__help.key, name: n.__help.name })),
    nodes: () => nodes.slice(),
    _show: (node) => { if (node.__help) showPop(node, node.__help); return pop; },
    KEYS
  };
}

module.exports = { createHelp, KEYS };
