#!/usr/bin/env node
// Screenshot a plugin panel in Chromium (no Photoshop):
//   node tools/ui-preview/shoot.js <plugin> <out.png> [width] [height] [script.js]
// The optional script runs in the page after the first preview (e.g. to hover a control).
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const [plugin, out, W, H, script] = process.argv.slice(2);
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split("?")[0]);
  if (u === "/") {
    const html = fs.readFileSync(path.join(ROOT, "plugins", plugin, "index.html"), "utf8")
      .replace(/href="/g, 'href="/plugins/' + plugin + '/').replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, "")
      .replace("</body>", '<script src="/tools/ui-preview/shim.js"></script><script>window.__loadPlugin("/plugins/' + plugin + '")</script></body>');
    r.writeHead(200, { "content-type": "text/html" }); return r.end(html);
  }
  const f = path.join(ROOT, u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "content-type": /\.css$/.test(f) ? "text/css" : /\.png$/.test(f) ? "image/png" : "application/javascript" });
  r.end(fs.readFileSync(f));
}).listen(0, async () => {
  const { chromium } = require("playwright");
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +W || 340, height: +H || 900 }, deviceScaleFactor: 2 });
  p.on("pageerror", (e) => console.error("pageerror", e.message));
  p.on("console", (m) => { if (m.type() === "error") console.error("console", m.text()); });
  await p.goto("http://localhost:" + srv.address().port + "/");
  await p.waitForFunction(() => /^Preview /.test((document.querySelector(".status") || {}).textContent || ""), null, { timeout: 30000 }).catch(() => console.error("no preview"));
  await p.waitForTimeout(1500);
  if (script) { await p.evaluate(fs.readFileSync(script, "utf8")); await p.waitForTimeout(+process.env.WAIT || 800); }
  await p.screenshot({ path: out });
  await b.close(); srv.close();
});
