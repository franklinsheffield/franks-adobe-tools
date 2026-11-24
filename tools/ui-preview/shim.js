// Browser preview of a plugin panel (no Photoshop): a tiny synchronous CommonJS loader plus
// stub "photoshop" and "uxp" modules. Used by tools/ui-preview/shoot.js for screenshots.
(function () {
  const cache = {};
  const stubs = {
    photoshop: { app: { activeDocument: null, documents: [] }, action: { batchPlay: async () => [] }, core: { executeAsModal: async (f) => f({}) }, imaging: {} },
    uxp: { entrypoints: { setup() {} }, storage: { localFileSystem: { getDataFolder: async () => ({ getEntry: async () => { throw new Error("none"); }, createFile: async () => ({ write: async () => {} }) }) }, formats: { utf8: "utf8" } } }
  };
  function resolve(base, p) {
    const parts = (base + "/" + p).split("/"), out = [];
    parts.forEach((s) => { if (s === "..") out.pop(); else if (s && s !== ".") out.push(s); });
    let r = "/" + out.join("/");
    if (!/\.js(on)?$/.test(r)) r += ".js";
    return r;
  }
  function load(path) {
    if (cache[path]) return cache[path].exports;
    const x = new XMLHttpRequest(); x.open("GET", path, false); x.send();
    if (x.status !== 200) throw new Error("cannot load " + path);
    const module = { exports: {} };
    cache[path] = module;
    if (/\.json$/.test(path)) { module.exports = JSON.parse(x.responseText); return module.exports; }
    const dir = path.replace(/\/[^/]*$/, "");
    new Function("module", "exports", "require", x.responseText + "\n//# sourceURL=" + path)(module, module.exports, (p) => stubs[p] || load(resolve(dir, p)));
    return module.exports;
  }
  window.__loadPlugin = (dir) => (window.__panel = load(dir + "/main.js"));
})();
