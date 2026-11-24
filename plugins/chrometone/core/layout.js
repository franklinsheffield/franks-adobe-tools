"use strict";
// ======================================================================
// Shared panel layout: a "pinned" strip at the top (header + preview)
// that never scrolls, and a "scroller" below it with all the controls.
// The preview stays in sight while you adjust (Frank, 2026-11-21).
// Unpinning moves the pinned cards to the top of the scroller instead.
//
//   const lay = splitLayout(root, el);
//   lay.pinned.appendChild(header); lay.pinned.appendChild(previewCard);
//   lay.scroller.appendChild(...controls);
//   lay.setPinned(false);  // preview scrolls with everything else
// ======================================================================

// Press glow: buttons and colour swatches light up blue for a moment when
// pressed (CSS .pressed in panel.css). Done in JS because UXP's :active
// support is patchy. Installed once per panel root.
function pressGlow(root) {
  if (root.__pressGlow) return;
  root.__pressGlow = true;
  const SEL = ".btn, .segbtn, .pill, .apply, .sw.pick, .stepb, .tile, .lookbtn, .tbtn";
  const find = (t) => { while (t && t !== root) { if (t.matches && t.matches(SEL)) return t; t = t.parentNode; } return null; };
  const on = (e) => {
    const b = find(e.target);
    if (!b) return;
    b.classList.add("pressed");
    clearTimeout(b.__glowT);
    b.__glowT = setTimeout(() => b.classList.remove("pressed"), 350);
  };
  root.addEventListener("mousedown", on);
  root.addEventListener("click", on);
}

// opts.footer (Brew 3.0): a pinned footer under the scroller for the render meter and Apply key
function splitLayout(root, el, opts) {
  root.classList.add("split");
  pressGlow(root);
  const pinned = el("div", { class: "pinned" });
  const scroller = el("div", { class: "scroller" });
  root.appendChild(pinned);
  root.appendChild(scroller);
  const footer = opts && opts.footer ? el("div", { class: "pfoot" }) : null;
  if (footer) root.appendChild(footer);
  let isPinned = true;

  function setPinned(on) {
    on = !!on;
    if (on === isPinned) return;
    isPinned = on;
    if (on) {
      // move the cards that were pinned back out of the scroller
      const back = Array.from(scroller.children).filter((n) => n.__pinnable);
      back.forEach((n) => pinned.appendChild(n));
      pinned.style.display = "";
    } else {
      const kids = Array.from(pinned.children);
      kids.reverse().forEach((n) => { n.__pinnable = true; scroller.insertBefore(n, scroller.firstChild); });
      pinned.style.display = "none";
      scroller.scrollTop = 0;
    }
  }
  // Height the pinned preview may use, so the controls keep room below it.
  function previewMaxHeight(fraction) {
    if (!isPinned) return Infinity;
    const h = root.clientHeight || 820;
    return Math.max(120, Math.round(h * (fraction || 0.38)));
  }
  return { pinned, scroller, footer, setPinned, previewMaxHeight, get isPinned() { return isPinned; } };
}

module.exports = { splitLayout, pressGlow };
