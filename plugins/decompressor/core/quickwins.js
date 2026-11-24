"use strict";
// Shared research quick wins (2026-11-23/24) so hand-built panels (Dithers,
// Batch Mock) behave like the toolpanel tools: plain-English errors, live key
// hints for the selected knob, Before/After split painting and the flyout menu.

// UX-16: say what happened and what to do next.
function plainError(msg) {
  const m = String(msg || "");
  if (/modal state/i.test(m)) return "Photoshop is busy (a dialog or another plugin is working). Finish that, then try again.";
  if (/out of memory|memory/i.test(m)) return "Not enough memory for this size. Try Detail view, a smaller document, or close other documents.";
  if (/(no|invalid) (active )?document|document is closed/i.test(m)) return "The document was closed. Open or select a document, then try again.";
  if (/locked/i.test(m)) return "That layer is locked. Unlock it in the Layers panel, then try again.";
  if (/timed? ?out/i.test(m)) return "Photoshop took too long to answer. Try again; if it repeats, restart Photoshop.";
  return m;
}

// ID-13: Blender-style status line. `esc` says what Esc cancels (omit when nothing can be cancelled).
function keysIdle(esc) {
  return "Drag a knob or its name to turn it  |  double-click resets" + (esc ? "  |  Esc cancels " + esc : "");
}
function keysFor(i) {
  const range = i.min + "-" + i.max + (i.unit ? " " + i.unit : "");
  return String(i.label).toUpperCase() + " " + range + "  |  drag turns, Shift = fine  |  Up/Down steps, Shift = x10  |  double-click resets";
}

// ID-09: left of `pos` % shows `before`, right shows `rgb`, with a 2 px white line. RGB, 3 channels.
function splitRGB(rgb, before, w, h, pos) {
  if (!pos || !before || before.length !== rgb.length) return rgb;
  const out = Uint8Array.from(rgb), cut = Math.round(w * pos / 100);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const j = (y * w + x) * 3;
    if (x === cut || x === cut - 1) { out[j] = out[j + 1] = out[j + 2] = 255; }
    else if (x < cut) { out[j] = before[j]; out[j + 1] = before[j + 1]; out[j + 2] = before[j + 2]; }
  }
  return out;
}

// Esc key listener; `fn` runs on Escape.
function onEscape(fn) {
  try {
    document.addEventListener("keydown", (e) => {
      const k = e.key || e.code;
      if (k === "Escape" || e.keyCode === 27) fn(e);
    });
  } catch (e) { /* no document events */ }
}

module.exports = { plainError, keysIdle, keysFor, splitRGB, onEscape };
