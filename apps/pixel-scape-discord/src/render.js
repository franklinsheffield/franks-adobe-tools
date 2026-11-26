// Headless render of a terrain .glb with Three.js in Chromium (software GL works; GPU not required).
"use strict";
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto");
const THREE_DIR = path.join(path.dirname(require.resolve("three")), ".."), VIEW = path.join(__dirname, "..", "render", "view.html");
const TYPES = { ".js": "text/javascript", ".html": "text/html", ".glb": "model/gltf-binary" };

class Renderer {
  constructor() { this.blobs = new Map(); this.ready = null; }
  async start() {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      this.srv = http.createServer((q, s) => {
        const u = decodeURIComponent(q.url.split("?")[0]);
        let f = null, body = null;
        if (u === "/" || u === "/view.html") f = VIEW;
        else if (u.startsWith("/three/")) { f = path.join(THREE_DIR, path.normalize(u.slice(7)).replace(/^(\.\.[/\\])+/, "")); if (!f.startsWith(THREE_DIR)) f = null; }
        else if (u.startsWith("/blob/")) body = this.blobs.get(u.slice(6));
        if (!body && f) try { body = fs.readFileSync(f); } catch (e) { body = null; }
        if (!body) { s.statusCode = 404; return s.end(); }
        s.setHeader("content-type", TYPES[path.extname(u)] || (u.startsWith("/blob/") ? "model/gltf-binary" : "application/octet-stream")); s.end(body);
      });
      await new Promise((ok) => this.srv.listen(0, "127.0.0.1", ok));
      const { chromium } = (() => { try { return require("playwright-core"); } catch (e) { return require("playwright"); } })();
      this.browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"] });
    })();
    return this.ready;
  }
  // opts: { view: oblique|top|low, width, height, exaggeration }
  async render(glb, info, opts = {}) {
    await this.start();
    const id = crypto.randomBytes(8).toString("hex") + ".glb"; this.blobs.set(id, glb);
    const width = opts.width || 1600, height = opts.height || 900;
    const ex = opts.exaggeration || autoExaggeration(info);
    const page = await this.browser.newPage({ viewport: { width, height } });
    try {
      const errs = []; page.on("pageerror", (e) => errs.push(e.message));
      await page.goto(`http://127.0.0.1:${this.srv.address().port}/view.html`);
      await page.waitForFunction(() => document.title === "ready", null, { timeout: 30000 });
      await page.evaluate((o) => window.renderTerrain(o), { url: "/blob/" + id, info, view: opts.view || "oblique", width, height, exaggeration: ex });
      if (errs.length) throw new Error("render page: " + errs[0]);
      return await page.screenshot({ type: "png" });
    } finally { await page.close(); this.blobs.delete(id); }
  }
  async close() { if (this.browser) await this.browser.close(); if (this.srv) this.srv.close(); this.ready = null; }
}
// Flat places get more relief so the render reads as 3D; steep ones stay true scale.
function autoExaggeration(info) {
  const ratio = (info.maxElevationM - info.minElevationM) / info.widthM;
  return ratio > 0.12 ? 1 : ratio > 0.05 ? 1.5 : ratio > 0.02 ? 2 : 3;
}
module.exports = { Renderer, autoExaggeration };
