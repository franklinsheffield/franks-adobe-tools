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

function splitLayout(root, el) {
  root.classList.add("split");
  const pinned = el("div", { class: "pinned" });
  const scroller = el("div", { class: "scroller" });
  root.appendChild(pinned);
  root.appendChild(scroller);
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
  return { pinned, scroller, setPinned, previewMaxHeight, get isPinned() { return isPinned; } };
}

module.exports = { splitLayout };
