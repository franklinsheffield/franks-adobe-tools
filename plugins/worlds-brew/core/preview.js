"use strict";
// ======================================================================
// Shared preview loop: debounced, never runs two renders at once, and
// re-runs once if settings changed mid-render. Pauses while a tool is
// writing to the document so the two never fight.
//
//   const loop = createPreviewLoop({ renderOnce: async () => {...}, onError });
//   loop.schedule(150); loop.setBusy(true); ...
// ======================================================================

function createPreviewLoop(opts) {
  const renderOnce = opts.renderOnce;
  const onError = opts.onError || ((e) => console.error(e));
  const defaultDelay = opts.defaultDelay == null ? 120 : opts.defaultDelay;
  let timer = null, rendering = false, rerun = false, busy = false;

  function schedule(delay) {
    clearTimeout(timer);
    if (busy) return;
    timer = setTimeout(run, delay == null ? defaultDelay : delay);
  }

  async function run() {
    if (rendering) { rerun = true; return; }
    rendering = true;
    do {
      rerun = false;
      try { await renderOnce(); } catch (e) { onError(e); }
    } while (rerun);
    rendering = false;
  }

  function cancel() { clearTimeout(timer); }
  function setBusy(b) { busy = !!b; if (busy) clearTimeout(timer); }

  return { schedule, run, cancel, setBusy, get busy() { return busy; }, get rendering() { return rendering; } };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

module.exports = { createPreviewLoop, tick };
