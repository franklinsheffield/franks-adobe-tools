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

// Titles, card headings and labels use the suite display font (Night Machine).
// Runs of characters outside ARCADE_OK (the glyphs the font draws) are wrapped
// in <span class="sym"> so they fall back to the UI font.
const ARCADE = /(^|\s)(title|sub|ctitle|lbl|lbl2|lbl3)(\s|$)/;
const ARCADE_OK = /[ -~]/; // Night Machine has every printable ASCII glyph
function arcadeText(e, v) {
  e.textContent = "";
  let run = "", sym = false;
  const flush = () => {
    if (!run) return;
    if (sym) { const s = document.createElement("span"); s.className = "sym"; s.textContent = run; e.appendChild(s); }
    else e.appendChild(document.createTextNode(run));
    run = "";
  };
  for (const ch of String(v)) {
    const isSym = !ARCADE_OK.test(ch);
    if (isSym !== sym) { flush(); sym = isSym; }
    run += ch;
  }
  flush();
}

// Buttons are drawn as <div class="ub"> because UXP renders a real <button>
// as a native grey Spectrum button that ignores the suite theme.
// A [disabled] attribute still blocks clicks.
// Brew 3.0 Night Arcade: display text (titles, headings, labels) is drawn with the
// suite's own sprite fonts (shared/pixfont.js) instead of an installed font.
let ARCADE_SPRITES = null;   // set by createUI({ arcade: true }); one panel per plugin
function arcadePaint(e, cls, v) {
  const PF = require("./pixfont.js");
  if (/(^|\s)title(\s|$)/.test(cls)) return PF.paint(e, v, { font: "pixel", scale: 2, glow: 1, color: ARCADE_SPRITES.glow });
  if (/(^|\s)(sub)(\s|$)/.test(cls)) return PF.paint(e, v, { font: "pixel", scale: 1, color: "#b9b6cc" });
  return PF.paint(e, v, { font: "label", color: /ctitle/.test(cls) ? "#ffffff" : "#e9e7f5" });
}
function el(tag, props, kids) {
  const isBtn = tag === "button";
  const e = document.createElement(isBtn ? "div" : tag);
  if (isBtn) e.addEventListener("click", (ev) => { if (e.hasAttribute("disabled")) { ev.stopImmediatePropagation(); ev.preventDefault(); } });
  if (props) {
    for (const k of Object.keys(props)) {
      const v = props[k];
      if (k === "class") e.className = v;
      else if (k === "text") { if (ARCADE.test(props.class || "")) { if (ARCADE_SPRITES) arcadePaint(e, props.class || "", v); else arcadeText(e, v); } else e.textContent = v; }
      else if (k === "style") { for (const s of Object.keys(v)) e.style[s] = v[s]; }
      else e.setAttribute(k, v);
    }
  }
  if (isBtn) { e.classList.add("ub"); e.setAttribute("role", "button"); }
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
  ARCADE_SPRITES = opts.arcade ? { glow: opts.glow || "#5cf2ff" } : null;
  // Brew 3.0 hover help (shared/help.js): opts.helpText = { key: text } from the plugin,
  // merged over shared/help-text.js. Every control attaches itself; sweep() catches the rest.
  const help = opts.helpText ? require("./help.js").createHelp({
    el, storeKey: opts.storeKey,
    lookup: (key, info) => {
      const T = Object.assign({}, require("./help-text.js").TEXT, opts.helpText);
      let t = T[key];
      if (t == null && info && info.alias) t = T[info.alias];
      if (typeof t === "function") t = t(info);
      return t || "";
    },
    paintName: opts.arcade ? (n, txt) => require("./pixfont.js").paint(n, txt, { font: "label", color: "#ffffff" }) : null
  }) : null;
  const helpAt = (node, info) => { if (help && node) help.attach(node, info); return node; };
  function bind(fn) { binders.push(fn); fn(); }
  function showIf(node, fn) { rules.push(() => { node.style.display = fn() ? "" : "none"; }); }
  function refreshAll() { binders.forEach((f) => f()); rules.forEach((f) => f()); }
  // Optional "Hardware Console" brand: dials and switches instead of sliders and checkboxes.
  const brand = opts.brand === "console"
    ? require("./console.js").createConsoleKit({ el, bind, getState: S, getPath, setPath, onChange: () => onChange(), onLive: opts.onLive, glow: opts.glow, getDefault: opts.getDefault, onSelect: (i) => { if (opts.onSelect) opts.onSelect(i); }, help, lcd: !!opts.arcade })
    : null;

  function row(label, ...controls) {
    return el("div", { class: "row" }, [label ? el("span", { class: "lbl", text: label }) : null].concat(controls));
  }

  function sliderRow(label, path, min, max, step, unit) {
    if (brand) return brand.dial(label, path, min, max, step, unit);
    const val = el("span", { class: "val" });
    const input = el("input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(getPath(S(), path)) });
    const fmt = (v) => (step >= 1 ? String(Math.round(v)) : Number(v).toFixed(step < 0.1 ? 2 : 1)) + (unit || "");
    input.addEventListener("input", () => { const v = parseFloat(input.value); setPath(S(), path, v); val.textContent = fmt(v); });
    input.addEventListener("change", () => { setPath(S(), path, parseFloat(input.value)); onChange(); });
    bind(() => { const v = getPath(S(), path); input.value = String(v); val.textContent = fmt(v); });
    return row(label, input, val);
  }

  // Brew 3.0 controls (shared/controls.js); without the console brand they fall back to sliders
  function fader(label, path, min, max, step, unit) { return brand ? brand.fader(label, path, min, max, step, unit) : sliderRow(label, path, min, max, step, unit); }
  function stepper(label, path, min, max, step, unit) { return brand ? brand.stepper(label, path, min, max, step, unit) : sliderRow(label, path, min, max, step, unit); }
  function angle(label, path, min, max, step) { return brand ? brand.angle(label, path, min, max, step) : sliderRow(label, path, min == null ? 0 : min, max == null ? 360 : max, step || 1, " deg"); }
  function range(label, lo, hi, min, max, step, unit) { return brand ? brand.range(label, lo, hi, min, max, step, unit) : el("div", {}, [sliderRow(label + " low", lo, min, max, step, unit), sliderRow(label + " high", hi, min, max, step, unit)]); }
  function grid(path, options, o) { return brand ? brand.grid(path, options, o) : segGroup(path, options); }

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
    return helpAt(row(label, sel), { key: path, name: label, kind: "select" });
  }

  function checkRow(label, path, after) {
    if (brand) return brand.toggle(label, path, after);
    const cb = el("input", { type: "checkbox" });
    cb.addEventListener("change", () => { setPath(S(), path, !!cb.checked); if (after) after(!!cb.checked); onChange(); });
    bind(() => { cb.checked = !!getPath(S(), path); });
    return helpAt(el("div", { class: "row chk" }, [cb, el("span", { class: "lbl2", text: label })]), { key: path, name: label, kind: "switch" });
  }

  function segGroup(path, options, cls) {
    const wrap = el("div", { class: "seg " + (cls || "") });
    const btns = options.map((o) => {
      const b = el("button", { class: "segbtn", text: o.l, title: o.t || "" });
      b.addEventListener("click", () => { setPath(S(), path, o.v); onChange(); });
      helpAt(b, { key: path, name: o.l, kind: "seg", note: o.t || "" });
      wrap.appendChild(b);
      return b;
    });
    bind(() => { const cur = getPath(S(), path); btns.forEach((b, i) => { if (options[i].v === cur) b.classList.add("on"); else b.classList.remove("on"); }); });
    return wrap;
  }

  function pill(label, path, dotColor, title) {
    const b = el("button", { class: "pill", title: title || "" });
    if (dotColor) b.appendChild(el("span", { class: "dot", style: { backgroundColor: dotColor } }));
    b.appendChild(el("span", { text: label }));
    b.addEventListener("click", () => { setPath(S(), path, !getPath(S(), path)); onChange(); });
    bind(() => { if (getPath(S(), path)) b.classList.add("on"); else b.classList.remove("on"); });
    return helpAt(b, { key: path, name: label, kind: "switch" });
  }

  function textRow(label, path, placeholder, after) {
    const input = el("input", { type: "text", placeholder: placeholder || "" });
    input.addEventListener("change", () => { setPath(S(), path, input.value); if (after) after(); onChange(); });
    bind(() => { input.value = String(getPath(S(), path)); });
    return helpAt(row(label, input), { key: path, name: label, kind: "info" });
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

  // ---- cards (Frank, 2026-11-22: organized panel system)
  // card(title, kids, { hint, section, bypass, fold, open })
  //   section: "look" | "controls" | "colour" | "output" (toolpanel places it)
  //   bypass:  { path: neutralValue } - the card can be switched off in the
  //            Effects tabs; while off the engine sees these values instead
  //   fold:    false = no fold toggle (e.g. Preview); open: false = folded on first launch
  // Click a card's title to fold it; the fold state is remembered per plugin.
  const foldKey = "brew.fold." + (opts.storeKey || "panel");
  let foldMem = {};
  try { foldMem = JSON.parse((typeof localStorage !== "undefined" && localStorage.getItem(foldKey)) || "{}") || {}; } catch (e) { foldMem = {}; }
  function saveFold() { try { if (typeof localStorage !== "undefined") localStorage.setItem(foldKey, JSON.stringify(foldMem)); } catch (e) { /* storage blocked */ } }
  const allCards = [];
  function summary(body) {
    const vals = Array.from(body.querySelectorAll(".dialval")).slice(0, 4).map((i) => i.value);
    return vals.join(" | ");
  }
  function card(title, kids, o) {
    o = o || {};
    const body = el("div", { class: "cardbody" }, kids);
    const head = el("div", { class: "cardhead" }, [el("span", { class: "ctitle", text: title })]);
    const c = el("div", { class: "card" }, [head, body]);
    helpAt(head, { key: "card:" + title, name: title, kind: "card", alias: o.help });
    // 3.0 rule 11: max 6 primary controls per effect; the rest go in a folded Advanced card
    if (o.advanced && o.advanced.length) {
      const adv = card(o.advancedTitle || "Advanced", o.advanced, { open: false, foldKey: title + " / Advanced", help: "card:Advanced" });
      adv.classList.add("advcard");
      body.appendChild(adv);
      // hide the Advanced card when none of its controls apply in the current mode (rule 12)
      rules.push(() => { adv.style.display = o.advanced.some((n) => n && n.style.display !== "none") ? "" : "none"; });
    }
    if (o.hint) body.insertBefore(el("div", { class: "hint", text: o.hint }), body.firstChild);
    const info = { title, opts: o, head, body, node: c, foldable: o.fold !== false };
    c.__card = info;
    if (brand && info.foldable) {
      c.classList.add("foldable");
      const chev = el("span", { class: "chev", text: "-" });
      const sum = el("span", { class: "csum" });
      head.insertBefore(chev, head.firstChild);
      head.appendChild(sum);
      info.setOpen = (open, remember) => {
        if (open) { c.classList.remove("shut"); chev.textContent = "-"; sum.textContent = ""; }
        else { c.classList.add("shut"); chev.textContent = "+"; sum.textContent = summary(body); }
        if (remember) { foldMem[o.foldKey || title] = open ? 1 : 0; saveFold(); }
      };
      info.isOpen = () => !c.classList.contains("shut");
      head.addEventListener("click", () => info.setOpen(!info.isOpen(), true));
      const fk = o.foldKey || title;
      const start = fk in foldMem ? !!foldMem[fk] : o.open !== false;
      info.setOpen(start, false);
      allCards.push(info);
    }
    return c;
  }
  function foldAll(open) { allCards.forEach((i) => { if (i.node.parentNode && !i.inTabs) i.setOpen(open, true); }); }
  function anyOpen() { return allCards.some((i) => !i.inTabs && i.node.parentNode && i.isOpen()); }

  // section bar: a glow marker, "LOOK" and a thin rule (no A-D letters, Frank 2026-11-22)
  function section(letter, name, id) {
    const n = el("div", { class: "section", id: "sec-" + id }, [el("span", { class: "secl" }), el("span", { class: "secn", text: name }), el("div", { class: "secrule" })]);
    n.__section = id;
    return n;
  }

  // jump strip pinned under the preview: one button per section + fold all.
  // sections: [{ letter, name, id, node }] (node = the section bar in `scroller`)
  // UXP (PS 28) draws a programmatic scroll but keeps hit-testing at the old position until a
  // real scroll happens, so keys below the jump target (Apply) got no clicks (Colour Deck thread,
  // 2026-11-22). Two 1 px moves on later frames make it re-sync, as one wheel tick does.
  function nudgeScroll(scroller) {
    const step = (d) => { try { scroller.scrollTop = scroller.scrollTop + d; } catch (e) { /* no scroller */ } };
    setTimeout(() => {
      const atEnd = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;
      step(atEnd ? -1 : 1);
      setTimeout(() => step(atEnd ? 1 : -1), 40);
    }, 40);
  }
  function jumpStrip(sections, scroller) {
    const btns = [];
    const row = el("div", { class: "jump" });
    sections.forEach((sec) => {
      const b = el("button", { class: "jumpbtn", text: sec.name, title: "Jump to " + sec.name.toLowerCase() });
      b.addEventListener("click", () => {
        const top = sec.node.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
        scroller.scrollTop = Math.max(0, scroller.scrollTop + top - 2);
        nudgeScroll(scroller);
        mark(sec.id);
      });
      b.__sec = sec.id;
      btns.push(b); row.appendChild(b);
    });
    const fold = el("button", { class: "jumpbtn fold", text: "+/-", title: "Fold or open every card" });
    fold.addEventListener("click", () => foldAll(!anyOpen()));
    row.appendChild(fold);
    function mark(id) { btns.forEach((b) => { if (b.__sec === id) b.classList.add("on"); else b.classList.remove("on"); }); }
    scroller.addEventListener("scroll", () => {
      const top0 = scroller.getBoundingClientRect().top;
      let cur = sections[0] ? sections[0].id : null;
      sections.forEach((sec) => { if (sec.node.style.display !== "none" && sec.node.getBoundingClientRect().top - top0 <= 30) cur = sec.id; });
      mark(cur);
    });
    mark(sections[0] && sections[0].id);
    return row;
  }

  // Effects tabs: one card whose body shows one of `cards` at a time.
  // A card made with { bypass } gets an on/off dot; effects that are on stack
  // in tab order. o: { isOn(title), setOn(title, on), title }
  function tabs(cards, o) {
    o = o || {};
    const row = el("div", { class: "tabrow" });
    const stack = el("div", { class: "stackline" });
    const panes = el("div", { class: "tabpanes" });
    const tabKey = "brew.tab." + (opts.storeKey || "panel");
    let cur = null;
    try { cur = typeof localStorage !== "undefined" ? localStorage.getItem(tabKey) : null; } catch (e) { cur = null; }
    const items = cards.map((c) => {
      const info = c.__card || { title: "?", opts: {} };
      info.inTabs = true;
      c.classList.add("intab");
      if (info.setOpen) info.setOpen(true, false);
      const canOff = !!(info.opts && info.opts.bypass);
      const dot = canOff ? el("span", { class: "tabdot", title: "Switch this effect on or off" }) : null;
      const btn = el("div", { class: "tabbtn", role: "tab", title: info.title }, [dot, el("span", { class: "tabtxt", text: info.title })]);
      helpAt(btn, { key: "tab:" + info.title, name: info.title, kind: "tab", alias: "card:" + info.title });
      const wrap = el("div", { class: "tabpane" }, [c]);
      row.appendChild(btn);
      panes.appendChild(wrap);
      const it = { title: info.title, btn, wrap, card: c, dot, canOff };
      btn.addEventListener("click", (e) => {
        if (dot && (e.target === dot)) { o.setOn(it.title, !o.isOn(it.title)); onChange(); return; }
        choose(it.title, true);
      });
      return it;
    });
    function visible(it) { return it.card.style.display !== "none"; }
    function choose(title, remember) {
      let it = items.find((x) => x.title === title && visible(x)) || items.find(visible) || items[0];
      cur = it ? it.title : null;
      items.forEach((x) => {
        const on = x === it;
        if (on) x.btn.classList.add("cur"); else x.btn.classList.remove("cur");
        x.wrap.style.display = on ? "" : "none";
      });
      if (remember) { try { if (typeof localStorage !== "undefined") localStorage.setItem(tabKey, cur); } catch (e) { /* storage blocked */ } }
    }
    rules.push(() => {
      items.forEach((x) => {
        x.btn.style.display = visible(x) ? "" : "none";
        const on = !x.canOff || o.isOn(x.title);
        if (on) { x.btn.classList.add("live"); x.card.classList.remove("bypassed"); }
        else { x.btn.classList.remove("live"); x.card.classList.add("bypassed"); }
      });
      const anyOff = items.some((x) => x.canOff);
      stack.style.display = anyOff ? "" : "none";
      stack.textContent = "Stack: " + (items.filter((x) => visible(x) && (!x.canOff || o.isOn(x.title))).map((x) => x.title).join("  >  ") || "nothing on") + "   (dot = on / off)";
      choose(cur, false);
    });
    const api = { choose: (t) => choose(t, true), items, get current() { return cur; } };
    // 3.0: the tab row is pinned under the preview and the panes scroll (o.split)
    if (o.split) { row.classList.add("fxbar"); panes.classList.add("fxpanes"); panes.__tabs = api; row.__tabs = api; return { bar: row, panes, api }; }
    const node = card(o.title || "Effects", [row, stack, panes], { open: true });
    node.classList.add("tabcard");
    node.__tabs = api;
    return node;
  }

  function sweep(rootNode) {
    if (!help || !rootNode) return;
    const txt = (n) => String((n.__pxStr != null ? n.__pxStr : n.textContent) || "").replace(/\s+/g, " ").trim();
    rootNode.querySelectorAll(".ub, select, .switch, .sw.pick, .look, .tile, input").forEach((n) => {
      for (let p = n; p && p !== rootNode; p = p.parentNode) if (p.__help) return;
      if (n.classList.contains("ub")) helpAt(n, { key: "btn:" + txt(n), name: txt(n), kind: "button" });
      else if (n.classList.contains("look")) helpAt(n, { key: "look", name: txt(n), kind: "grid" });
      else if (n.classList.contains("sw")) helpAt(n, { key: "swatch", name: "Colour", kind: "swatch" });
      else if (n.classList.contains("hex")) helpAt(n, { key: "swatch", name: "Hex colour", kind: "swatch" });
      else if (n.getAttribute("data-key")) helpAt(n, { key: n.getAttribute("data-key"), name: n.getAttribute("placeholder") || "", kind: n.tagName === "SELECT" ? "select" : "info" });
      else if (n.closest && n.closest(".stops")) helpAt(n, { key: "grad.pos", name: "Stop position", kind: "info", min: 0, max: 100, unit: "%" });
      else helpAt(n, { key: "ctl:" + (n.className || n.tagName), name: n.getAttribute("title") || "", kind: "info" });
    });
  }

  return {
    help, helpAt, sweep,
    el, clear, bind, showIf, refreshAll, getPath, setPath,
    row, sliderRow, fader, stepper, angle, range, grid, selectRow, checkRow, segGroup, pill, textRow, numInput, hexField, card, brand,
    section, tabs, jumpStrip, foldAll, anyOpen
  };
}

module.exports = { createUI, el, clear, getPath, setPath, normHex, arcadeText };
