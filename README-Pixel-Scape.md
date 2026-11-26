# Pixel Scape (PX-10)

Pixel Scape (formerly Worlds Lab) is a standalone desktop app (Electron + Three.js) for building 3D scenes. It has terrains, shapes, models, water, sky and lights, plus a live GPU view and a ray tracer. **Terrain Lab (TL-11)** turns real places into 3D terrain assets from elevation data and satellite photos. Renders go to Photoshop through the **Pixel Scape Bridge** panel.

- **App:** `apps/worlds-brew-app`
  - `npm run sync` copies the engine and the shared 3.0 kit into `engine/`.
  - `npm test` runs host-free tests, then the real app under Playwright/xvfb.
  - `npm run dist:mac` makes unsigned arm64 + x64 zips.
- **Engine:** `plugins/worlds-brew/js`, shared with the Photoshop panel. The Bridge panel is `plugins/worlds-brew/main.js`.
- **Internal IDs stay as they were:**
  - bundle `com.franks.worldsbrew.app`
  - plugin `com.franks.worldsbrew`

## Update notes

**0.11.0 (2026-11-26): renamed to Pixel Scape; Terrain Lab (real places to 3D terrain); three .glb fixes**

- **Rename:** Worlds Lab is now **Pixel Scape** (app code PX-10; Bridge panel 1.1.0). `Documents/Worlds Lab` moves to `Documents/Pixel Scape` on first start; the Bridge panel still finds the old folder. Internal IDs are unchanged.
- **Terrain Lab** (header button **Terrain Lab...**, or Cmd/Ctrl+T):
  - **Place:** 16 quick picks, place search, or paste lat/long from Google Maps. A shaded-relief map: drag to pan, click to set the centre, double-click to zoom.
  - **Area:** width / depth 0.5 to 50 km, turn, Square, Half size, Double size.
  - **Height:** real ground heights from AWS Terrain Tiles (USGS 3DEP ~10 m in the USA, SRTM ~30 m elsewhere). Height scale (1x = true scale), smoothing, water level (off / sea / custom).
  - **Photo:** the clearest recent Sentinel-2 picture (10 m true colour, ESA Copernicus, free with credit). It checks clouds, shadows and gaps inside the box itself and prefers a high sun. Season filter; or colour by height instead.
  - **Mesh:** grid 256 to 2048, an earth-layer base (skirt) or none.
  - **Preview** (fast), **Build** (full detail; saved to `My library / Terrains / <name>`: `terrain.glb`, `height16.png`, `photo.jpg`, `thumb.jpg`, `terrain.json`), **Add to scene**, **Export...** (.glb in real metres, Y up, plus the 16-bit heightmap, photo and JSON).
  - Library terrains drop into any scene like other items. Downloads are cached, so rebuilding a place works offline.
- **.glb fixes:**
  - The centre (XYZ) scale handle no longer blows models up: it now sizes from up/down pointer travel (double per 150 px).
  - JPEG / WebP textures inside .glb / .gltf now import (they loaded flat before). A model with one texture also gets it as a full-detail UV surface layer.
  - **Import folder** on a folder holding several PBR sets now imports each set.

**0.10.0 (2026-11-25): dynamic view ball, My library, texture / terrain / shader importers**

- **View ball** (top right of the view):
  - Drag the ball to orbit. Let go while it is moving and it keeps turning a little.
  - Click an axis end for a smooth snap to that view. Click the same end again for the opposite view.
  - Double-click the ball for Home.
  - A button strip under the ball:
    - drag **ZOOM** up or down;
    - drag **PAN**;
    - **FRAME** fits the selection, or the whole scene when nothing is selected;
    - **HOME** returns to the scene's opening view.
  - Camera lock is respected.
- **My library** (left column). It lives in `Documents/Worlds Lab/Library/{Textures, Terrains, Shaders}`.
  - Use **Import files...** or **Import folder...** (sub-folders are included), or put files into the folder yourself (**Show folder**).
  - Click an item to use it on the selection, or drag it onto an object in the view.
  - Imports never overwrite a file with the same name: a copy becomes "Rock 2".
- **Textures:** PNG, JPG and WebP. Each texture goes on the object as a surface layer.
- **Terrains:**
  - Import a heightmap (white = high). 16-bit PNGs keep every step; JPG works too.
  - **Import heightmap...** and **Use generated shape** are on the terrain's Shape tab.
  - **Save to library** stores the terrain with its sculpting (`.wbterrain`).
  - Erosion, terraces and sculpting still work on imported maps. Scenes save the map inside the scene file.
- **Shaders:**
  - **GLSL files** (`.glsl`, `.frag`, `.fs`) are supported in two styles:
    - Shadertoy style (`mainImage`, iTime, iResolution);
    - GLSL-sandbox style (`main`, time, resolution).
  - A shader is baked into a surface layer, so the live view, the ray tracer and Photoshop all get the same picture. The code stays on the layer.
  - The Surfaces tab has **Time**, **Detail** (256 to 2048 px) and **Bake** for re-drawing it.
  - A shader that does not compile is marked in red, and the error shows in the status bar.
  - Shader files dropped from Finder are imported and put on the object under the pointer.
- **PBR material folders** (colour / height / normal / roughness / metal maps, found by file name) become one shader. The colour layer takes its shine from the roughness and metal maps. The height map becomes a layer in the new **Relief** blend mode, which shapes the bump and leaves the colour alone.
- **Engine:**
  - 16-bit PNG decoding (`pngdec.js`).
  - Heightmap terrains (`scene.js` `heightFromPic` / `o.hmap`).
  - The Relief blend mode works in both the CPU and GPU surface maths.
- **Bridge:** every Photoshop modal call goes through the shared `runModal` (watchdog, Cancel, closed-document check).
- **Tested:**
  - App tests in the cloud cover the view ball, all importers, GLSL pixel checks for both styles, a compile error, the PBR layers, a 16-bit heightmap, and saving a terrain.
  - Smoke-tested on the Mac: plasma shader, lava PBR set, 16-bit twin-peaks heightmap, view-ball drag / FRAME / HOME, and a ray-traced draft render.
- **Known gaps:**
  - On a Chrome sphere the ray tracer shows mostly the reflection, with only a faint shader, while the GPU view shows the shader strongly. Use a Matte or Glossy base material for shader colour that matches in both.
  - Normal maps are only used as a light relief when there is no height map.
  - GPU water still has no reflections.

**0.9.0 (2026-11-24): 3.0 interface**

- Night Arcade style, pixel type, LCD value boxes, hover help on every control, and one HELP switch. Matches the Lab 3.0 plugins.

**0.8.0 (2026-11-24): Photoshop bridge**

- Shared folder `Documents/Worlds Lab`:
  - Renders, plus depth, object mask and sky mask passes.
  - Match document size.
  - Send layer to Worlds Lab.
- The Worlds Lab Bridge panel places a render as one layer group in a single undo step.
