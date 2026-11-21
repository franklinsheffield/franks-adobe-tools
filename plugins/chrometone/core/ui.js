"use strict";
// ======================================================================
// Shared panel UI kit. Every tool in the suite builds its panel from these
// controls so they look and behave the same.
//
//   const ui = createUI({ getState: () => state, onChange: touch, pickColor: PS.pickColor });
//   ui.sliderRow("Amount", "fx.amount", 0, 100, 1, "%")
//
// Controls bind to a dotted path in the tool's state object. onChange runs
// after every committed edit (re-render, re-preview). ui.refreshAll() pushes
// state back into every control, e.g. after loading a preset.
// No Photoshop calls in here.
// ======================================================================

function getPath(o, p) { return p.split(".").reduce((a, k) => a[k], o); }
function setPath(o, p, v) {
  const ks = p.split(".");
  let a = o;
  for (let i = 0; i < ks.length - 1; i++) a = a[ks[i]];
  a[ks[ks.length - 1]] = v;
}

function el(tag, props, kids) {
  const e = document.createElement(tag);
  if (props) {
    for (const k of Object.keys(props)) {
      const v = props[k];
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k === "style") { for (const s of Object.keys(v)) e.style[s] = v[s]; }
      else e.setAttribute(k, v);
    }
  }
  (kids || []).forEach((c) => { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
  return e;
}
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

const HEX_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
function normHex(h) {
  h = String(h || "").trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return "#" + h.toUpperCase();
}

function createUI(opts) {
  const getState = opts.getState;
  const onChange = opts.onChange || (() => {});
  const binders = [];
  const rules = [];

  const S = () => getState();
  function bind(fn) { binders.push(fn); fn(); }
  function showIf(node, fn) { rules.push(() => { node.style.display = fn() ? "" : "none"; }); }
  function refreshAll() { binders.forEach((f) => f()); rules.forEach((f) => f()); }

  function row(label, ...controls) {
    return el("div", { class: "row" }, [label ? el("span", { class: "lbl", text: label }) : null].concat(controls));
  }

  function sliderRow(label, path, min, max, step, unit) {
    const val = el("span", { class: "val" });
    const input = el("input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(getPath(S(), path)) });
    const fmt = (v) => (step >= 1 ? String(Math.round(v)) : Number(v).toFixed(step < 0.1 ? 2 : 1)) + (unit || "");
    input.addEventListener("input", () => { const v = parseFloat(input.value); setPath(S(), path, v); val.textContent = fmt(v); });
    input.addEventListener("change", () => { setPath(S(), path, parseFloat(input.value)); onChange(); });
    bind(() => { const v = getPath(S(), path); input.value = String(v); val.textContent = fmt(v); });
    return row(label, input, val);
  }

  function selectRow(label, path, options, after) {
    const sel = el("select", {});
    options.forEach((o) => sel.appendChild(el("option", { value: String(o.v), text: o.l })));
    sel.addEventListener("change", () => {
      const o = options[sel.selectedIndex];
      if (!o) return;
      setPath(S(), path, o.v);
      if (after) after(o.v);
      onChange();
    });
    bind(() => {
      const cur = String(getPath(S(), path));
      let i = options.findIndex((o) => String(o.v) === cur);
      if (i < 0) i = 0;
      sel.selectedIndex = i;
    });
    return row(label, sel);
  }

  function checkRow(label, path, after) {
    const cb = el("input", { type: "checkbox" });
    cb.addEventListener("change", () => { setPath(S(), path, !!cb.checked); if (after) after(!!cb.checked); onChange(); });
    bind(() => { cb.checked = !!getPath(S(), path); });
    return el("div", { class: "row chk" }, [cb, el("span", { class: "lbl2", text: label })]);
  }

  function segGroup(path, options, cls) {
    const wrap = el("div", { class: "seg " + (cls || "") });
    const btns = options.map((o) => {
      const b = el("button", { class: "segbtn", text: o.l, title: o.t || "" });
      b.addEventListener("click", () => { setPath(S(), path, o.v); onChange(); });
      wrap.appendChild(b);
      return b;
    });
    bind(() => { const cur = getPath(S(), path); btns.forEach((b, i) => { b.className = "segbtn" + (options[i].v === cur ? " on" : ""); }); });
    return wrap;
  }

  function pill(label, path, dotColor, title) {
    const b = el("button", { class: "pill", title: title || "" });
    if (dotColor) b.appendChild(el("span", { class: "dot", style: { backgroundColor: dotColor } }));
    b.appendChild(el("span", { text: label }));
    b.addEventListener("click", () => { setPath(S(), path, !getPath(S(), path)); onChange(); });
    bind(() => { b.className = "pill" + (getPath(S(), path) ? " on" : ""); });
    return b;
  }

  function textRow(label, path, placeholder, after) {
    const input = el("input", { type: "text", placeholder: placeholder || "" });
    input.addEventListener("change", () => { setPath(S(), path, input.value); if (after) after(); onChange(); });
    bind(() => { input.value = String(getPath(S(), path)); });
    return row(label, input);
  }

  function numInput(path, min, max) {
    const input = el("input", { type: "text", class: "num" });
    input.addEventListener("change", () => {
      let v = parseFloat(input.value);
      if (isNaN(v)) v = getPath(S(), path);
      v = Math.max(min, Math.min(max, v));
      setPath(S(), path, v);
      onChange();
    });
    bind(() => { input.value = String(getPath(S(), path)); });
    return input;
  }

  // get/set closures rather than a path, so callers can target array slots
  // The swatch is a live colour preview; with opts.pickColor it opens the
  // host colour picker on click (Frank, 2026-11-21).
  function hexField(get, set, allowEmpty) {
    const sw = el("span", { class: "sw" + (opts.pickColor ? " pick" : ""), title: opts.pickColor ? "Click to pick a colour" : "" });
    if (opts.pickColor) {
      sw.addEventListener("click", async () => {
        try {
          const v = await opts.pickColor(get() || "#FFFFFF");
          if (v && HEX_RE.test(v)) { set(normHex(v)); onChange(); }
        } catch (e) { console.error(e); }
      });
    }
    const input = el("input", { type: "text", class: "hex", placeholder: allowEmpty ? "none" : "#RRGGBB" });
    input.addEventListener("change", () => {
      const t = input.value.trim();
      if (allowEmpty && t === "") { set(""); onChange(); return; }
      if (HEX_RE.test(t)) { set(normHex(t)); onChange(); } else input.value = get();
    });
    bind(() => {
      const v = get();
      input.value = v || "";
      sw.style.backgroundColor = v && HEX_RE.test(v) ? v : "transparent";
    });
    return el("span", { class: "hexwrap" }, [sw, input]);
  }

  function card(title, kids, o) {
    const body = el("div", { class: "cardbody" }, kids);
    const head = el("div", { class: "cardhead" }, [el("span", { class: "ctitle", text: title })]);
    const c = el("div", { class: "card" }, [head, body]);
    if (o && o.hint) body.insertBefore(el("div", { class: "hint", text: o.hint }), body.firstChild);
    return c;
  }

  return {
    el, clear, bind, showIf, refreshAll, getPath, setPath,
    row, sliderRow, selectRow, checkRow, segGroup, pill, textRow, numInput, hexField, card
  };
}

module.exports = { createUI, el, clear, getPath, setPath, normHex };
