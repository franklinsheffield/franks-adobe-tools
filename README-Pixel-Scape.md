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

**0.15.0 (2026-11-27): Frank's 3D library inside Pixel Scape**

- **3D library card** (left side, under Add): search about 6,800 free models from the web-pipeline-kit library (CC0, CC BY and public domain), filter by kind, then click one to add it in front of the camera or drag it into the view. The status line shows the licence, and the credit line for CC BY models.
- **In Discord:** works in the Activity too. Everyone in the call sees the model, the same as any import. The list, files and pictures go through the Activity's own Worker (`/api/lib/...`), so no new URL mappings are needed. Scans over 40 MB and point clouds are left to the website.
- **Model reader:** now opens meshopt-compressed and quantised .glb files (EXT_meshopt_compression, KHR_mesh_quantization, KHR_texture_transform, EXT_texture_webp), which is how the library's files are stored. Any such file dropped or imported by hand works too.
- **Bot:** `/model find`, `/model random` and `/model show` in Science is Magic (see `apps/pixel-scape-discord/README.md`).

**0.14.0 (2026-11-26): sharper Terrain Lab pictures**

- **3D preview** in Terrain Lab now draws at full screen resolution on Retina displays (it was drawing at half and looked soft).
- **My photo keeps its own sharpness:** the terrain texture is now sized from your photo's pixel size, not from the satellite picture under it. A 25 cm drone or aerial photo over a 2 km box gives a 7680 px texture (the most a graphics card texture safely takes with the earth band); Preview uses up to 4096 px, Build up to 7680 px. The satellite picture is smoothly enlarged underneath.
- **Tip:** Preview always uses a light mesh (160) and a 640 px satellite photo. For the sharpest result set Photo detail 4096 and Mesh detail 2048 and press **Build**; render the scene at **Final** quality and 4K.
- The satellite photo is still Sentinel-2 (10 m pixels), so small boxes stay soft unless you load your own photo. Sharper US aerial photos (USDA NAIP, 0.6 m) are a candidate for a later update.

**0.13.0 (2026-11-26): My photo: your own aerial, drone or map picture on the terrain**

- **Photo: My photo** in Terrain Lab (next to Satellite and Heights). **Load photo...** takes a picture plus any side files picked with it (or found next to it):
  - **GeoTIFF** lands at its real place by itself (plain, LZW or Deflate; strips or tiles; 8 or 16-bit; palette). Map projections: lat/long, web mercator and UTM (WGS84, NAD83, ETRS89).
  - **JPG / PNG / WebP / TIFF with a world file** (`.jgw .pgw .tfw .wld` ...) lands by itself too. The `.prj` gives the projection; without one it is guessed from the numbers and the status line says so.
  - **Drone photo looking straight down** (DJI-style GPS, height above take-off, lens and heading) is placed roughly from those. Pin it for a close fit.
  - **Anything else** (a screenshot, a scan, a photo from a plane window) is pinned by hand.
- **Pin...** opens the pin aligner: your photo on the left, the box on the right (scroll to zoom, drag to move). Click a spot on the photo, then the same spot on the map. 2 pins = move / turn / size, 3 = also stretch, 4 or more = also perspective (shots taken at an angle). **Overlay** shows the photo laid over the map as you go; with spare pins it says how far they miss, in metres. **Undo pin**, **Clear pins**, **Done**, **Cancel**.
- **Box to photo** fits the box to the photo. If a placed photo is outside the box, the box moves to it.
- The photo goes over the satellite picture, which still fills anything the photo doesn't cover. Roof colours of buildings come from your photo where it covers them. The map shows the photo's outline (**MY PHOTO**).
- **Files:** `terrain.json` records the photo, how it was placed and the pins; the credits list your photo first.
- **Fix:** the third Photo button was cut off; it is now **Heights**.
- Big pictures are shrunk to 8192 px on the long side on loading; the placement is kept exact.

**0.12.0 (2026-11-26): real buildings in Terrain Lab**

- **Buildings card** in Terrain Lab (on by default):
  - Buildings come from **Overture Maps** (OpenStreetMap, Microsoft and Google open buildings merged). They are read straight from Overture's planet-wide tile archive with byte-range requests, so there is no key and no big download (a 2 x 2 km city box is about 4 tiles).
  - **Height:** the mapped height where there is one, else floors x 3.2 m, else an estimate from the building type and size. The status line says how many have a real height.
  - Each building sits on the terrain at the lowest ground under its outline, so none float on slopes. Towers with mapped parts (podium + tower) are built from their parts.
  - **Colours:** mapped roof / facade colours where known; otherwise the roof is taken from the satellite photo and walls get a light stone palette.
  - **Building height** 0.5 to 3x (on top of the terrain height scale) and **Smallest** (everything / no sheds / houses up / big buildings only).
- **Files:** `terrain.glb` gets the buildings as a second node (`<name> buildings`, vertex colours), so Blender, C4D and Unity see them as their own object. Library terrains also save `buildings.json`, and the buildings credit goes into `terrain.json`.
- **Scene:** Add to scene (and dropping a library terrain) adds the buildings as their own object, lined up with the terrain. It is a separate object, so move or scale it along with the terrain.
- **Quick picks:** Downtown Phoenix, Midtown Manhattan, San Francisco, Chicago Loop.
- **Fix:** the Terrain Lab map was blank after the 0.11 sea fix (the map tiles were drawn transparent).
- **Fix:** bad pixels in the elevation source (single spikes and whole garbage patches thousands of metres deep, e.g. the East River at full detail) are now repaired from the ground around them. Real cliffs and sea floor are left alone.

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
