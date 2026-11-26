# Pixel Scape web build (Discord phase D2)

The same app as the desktop window, running in a browser. It is the base for the Discord Activity (D3).

```
npm run web         # sync engine/, bundle into web/dist/
npm run web:serve   # http://localhost:8787
npm run web:smoke   # headless Chromium check
```

How it works: the renderer is unchanged desktop code that calls `window.require(...)` and Electron's `ipcRenderer`.
`web/build.js` finds every `window.require` id the renderer uses and bundles them (esbuild); `web/host.js` answers
`window.require` from that bundle. `web/shims/` stands in for Node and Electron:

| Desktop | Web |
|---|---|
| Open / Import dialogs | browser file picker; files copied into the in-page file system under /Uploads |
| Save dialogs, Save PNG, Export | browser downloads |
| Documents/Pixel Scape (My library, surface presets) | in-page file system, kept in IndexedDB |
| Terrain Lab downloads (main process, geo/*.js) | the same geo/*.js run in the page (AWS and Overture S3 allow CORS); no disk cache |
| Menu bar shortcuts | same shortcuts (Cmd/Ctrl+N, O, S, Shift+S, I, T, R, Z, Shift+Z, D) |
| Photoshop bridge | hidden |

Place search uses OpenStreetMap Nominatim straight from the browser. In Discord (D3) every outside address must be
added as a URL mapping in the Developer Portal, or proxied by our Worker.
