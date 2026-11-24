"use strict";
// ======================================================================
// modal.js - the ONLY way a Brew plugin enters Photoshop's modal state.
//
// Why: twice on 2026-11-24 a Brew plugin left Photoshop's "Progress" window
// open (Depthtone, then CRT Phaser). executeAsModal keeps that window and the
// modal lock until its callback settles, so any await inside that never
// settles (a pixel read on a closed document, a batchPlay that waits forever,
// a plugin reloaded mid-call) blocks EVERY plugin until someone clicks Cancel.
//
// runModal(name, fn, { timeoutMs, waitMs }) guarantees the callback settles:
//   - a watchdog rejects after timeoutMs (default 90 s), which ends the modal
//   - Photoshop's own Cancel button (ctl.onCancel / isCancelled) ends it at once
//   - a document check refuses to start on a closed document
//   - waitMs (Photoshop's timeOut) stops a call queueing forever behind another
//     modal; previews pass a short one so they skip instead of piling up
//   - a module-wide in-flight count: busy() lets previews skip while Apply runs
// tests/modal-guard.js fails if any plugin calls executeAsModal directly.
// ======================================================================

const DEFAULT_TIMEOUT_MS = 90000;
let inFlight = 0;
let PS = null;
try { PS = require("photoshop"); } catch (e) { PS = null; }   // absent in Node engine tests

function host() { if (!PS) throw new Error("Photoshop is not available"); return PS; }

function busy() { return inFlight > 0; }

function docOpen(docId) {
  if (docId == null) return true;
  try {
    const { app } = host();
    if (!app || !app.documents) return true;
    return Array.from(app.documents).some((d) => d.id === docId);
  } catch (e) { return true; }
}

async function runModal(name, fn, opts) {
  const o = opts || {};
  const timeoutMs = o.timeoutMs || DEFAULT_TIMEOUT_MS;
  if (o.docId != null && !docOpen(o.docId)) throw new Error("That document is closed.");
  const { core } = host();
  const emOpts = { commandName: name };
  if (o.waitMs) emOpts.timeOut = o.waitMs;
  inFlight++;
  try {
    return await core.executeAsModal(async (ctl) => {
      let timer = null;
      const stop = new Promise((_, rej) => {
        timer = setTimeout(() => rej(new Error(name + ": Photoshop did not finish in " + Math.round(timeoutMs / 1000) + " s, so it was stopped. Try again.")), timeoutMs);
        // Photoshop's Progress window Cancel button
        try { if (ctl) ctl.onCancel = () => rej(new Error("Cancelled.")); } catch (e) { /* older host */ }
      });
      try { return await Promise.race([Promise.resolve().then(() => fn(ctl)), stop]); }
      finally { clearTimeout(timer); }
    }, emOpts);
  } finally {
    inFlight--;
  }
}

module.exports = { runModal, busy, docOpen, DEFAULT_TIMEOUT_MS, _setHost(h) { PS = h; inFlight = 0; } };
