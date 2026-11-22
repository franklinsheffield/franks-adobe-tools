#!/usr/bin/env node
"use strict";
// Prints a JSON fingerprint of a Dithers Brew panel: UI structure, the
// preview image for the defaults and every built-in preset, and the host
// calls made by Apply. Used to prove a refactor changed no behaviour:
//   node tests/fingerprint.js <pluginDir> > a.json
const crypto = require("crypto");
const path = require("path");
const { loadPanel } = require("./harness.js");

// wait for the debounced preview to start and finish (no fixed sleep: CI speed varies)
async function settled(P, d) {
  await P.settle(250);
  for (let i = 0; i < 100; i++) {
    const st = d.querySelector(".status").textContent;
    if (!/^Rendering/.test(st)) return;
    await P.settle(50);
  }
}
const h = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 12);

(async () => {
  const dir = path.resolve(process.argv[2]);
  const out = {};
  // 1. no document: demo image
  let P = await loadPanel(dir, { withDoc: false });
  const d = P.document;
  out.cards = Array.from(d.querySelectorAll(".ctitle")).map((e) => e.textContent);
  out.controls = ["input", "select", "button", "textarea"].map((t) => t + ":" + d.querySelectorAll(t === "button" ? "button, .ub" : t).length).join(" ");
  const img = d.querySelector("img.preview");
  for (let i = 0; i < 200 && !img.src; i++) await P.settle(50);   // first preview (panels with many dials take longer to build)
  out.previewDefault = h(img.src);
  const sel = d.querySelector(".card select"); // first select = built-in presets
  out.presets = [];
  for (let i = 1; i < sel.options.length; i++) {
    sel.selectedIndex = i; sel.value = sel.options[i].value;
    sel.dispatchEvent(new P.window.Event("change"));
    await settled(P, d);
    out.presets.push(sel.options[i].text + " = " + h(img.src));
  }
  out.statusAfterPresets = d.querySelector(".status").textContent.replace(/in \d+ ms/, "in N ms");
  // 2. with a document: apply defaults
  P = await loadPanel(dir, { withDoc: true });
  P.host.calls.length = 0;
  P.document.querySelector(".apply").dispatchEvent(new P.window.Event("click"));
  await P.settle(800);
  // long jobs (Paint Brew): wait until the Apply button is idle again
  const ab = P.document.querySelector(".apply");
  for (let i = 0; i < 1200 && /^(Working|Cancel$)/.test(ab.textContent); i++) await P.settle(100);
  out.applyCalls = P.host.calls.map((c) => c.join("|"));
  out.applyStatus = P.document.querySelector(".status").textContent;
  console.log(JSON.stringify(out, null, 1));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
