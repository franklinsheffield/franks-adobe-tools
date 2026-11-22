# Frank's Brew Suite for Photoshop

> **⚠️ Please do not share.**
> These tools are private to Frank and his team. Do not post, forward, upload or resell the plugins, the files in this repo or the looks made with the presets. Do not add anyone to this repo or pass the download links on without Frank's OK.

Eight Photoshop panels for branding, print and merch work. They all share one look and one workflow: a live preview in the panel, a **Library** of presets you can save and share, and results written to **new layers in a new group**. Your original artwork is never changed, and **one Cmd+Z (Ctrl+Z on PC) undoes** an effect.

| Plugin | Version | What it does |
|---|---|---|
| Frank's Dithers Brew | 1.1 | Halftone, dither, line art, ASCII and print separations |
| Frank's Chrometone Brew | 1.1 | Liquid chrome, retro chrome type, 3D extrusion, glow |
| Frank's Depthtone Brew | 1.0 | Contours, terraces and lit relief from brightness |
| Frank's Mobglow Brew | 2.0 | Realistic dreamy glow and bloom |
| Frank's Decompressor Brew | 1.0 | JPEG damage, bit crush, datamosh, glitch |
| Frank's CRT Phaser Brew | 1.1 | Old TV tube plus Phase FX: waveform, linear and flux lines |
| Frank's Paint Brew | 1.1 | Oil, watercolour, impressionism, alcohol ink, spray paint and pastel |
| Frank's Batch Mock Brew | 1.0 | Batch Smart Object mockups (JPG, PNG, PSD, MP4) |

---

## 1. What you need

| Software | Mac | Windows PC | Notes |
|---|---|---|---|
| **Adobe Photoshop 2023 (v24.4) or newer** | [Download](https://www.adobe.com/products/photoshop.html) | [Download](https://www.adobe.com/products/photoshop.html) | Needs a Creative Cloud plan that includes Photoshop. Tested on Photoshop 2027 (v28). |
| **Adobe Creative Cloud desktop app** | [Download](https://creativecloud.adobe.com/apps/download/creative-cloud) | [Download](https://creativecloud.adobe.com/apps/download/creative-cloud) | Installs Photoshop and installs the plugins when you double-click a `.ccx` file. |
| **UXP Developer Tool** (only if double-click install fails) | Creative Cloud app > **Apps** > **All apps** > **Developer tools** | Same | Free Adobe app that loads plugins straight from a folder. [Adobe's guide](https://developer.adobe.com/photoshop/uxp/2022/guides/devtool/installation/) |
| **Night Machine font** (recommended) | Get the `.otf` file from Frank | Same | The panels use it for titles and labels. Without it they still work and show your system font. Mac: double-click the file > **Install Font**. PC: right-click > **Install for all users**. Then restart Photoshop. |

Nothing else is needed. Batch Mock Brew's MP4 export uses Photoshop's built-in video renderer.

---

## 2. Install

### Download

1. Open the **[downloads](downloads/)** folder in this repo.
2. Click the `.ccx` file for each plugin you want (for example `chrometone-1.1.0.ccx`), then click the **Download raw file** button (the down arrow at the top right of the file view).

| Plugin | File |
|---|---|
| Frank's Dithers Brew 1.1 | [dithers-brew-1.1.0.ccx](downloads/dithers-brew-1.1.0.ccx) |
| Frank's Chrometone Brew 1.1 | [chrometone-1.1.0.ccx](downloads/chrometone-1.1.0.ccx) |
| Frank's Depthtone Brew 1.0 | [depthtone-1.0.0.ccx](downloads/depthtone-1.0.0.ccx) |
| Frank's Mobglow Brew 2.0 | [mobglow-2.0.0.ccx](downloads/mobglow-2.0.0.ccx) |
| Frank's Decompressor Brew 1.0 | [decompressor-1.0.0.ccx](downloads/decompressor-1.0.0.ccx) |
| Frank's CRT Phaser Brew 1.1 | [crt-phaser-1.1.0.ccx](downloads/crt-phaser-1.1.0.ccx) |
| Frank's Paint Brew 1.1 | [paint-brew-1.1.0.ccx](downloads/paint-brew-1.1.0.ccx) |
| Frank's Batch Mock Brew 1.0 | [batch-mock-brew-1.0.0.ccx](downloads/batch-mock-brew-1.0.0.ccx) |

You can only see this private repo if Frank has added your GitHub account as a collaborator.

### Option A: double-click (try this first)

1. Quit Photoshop.
2. Double-click the `.ccx` file. The Creative Cloud app opens and asks to install it. Click **Install** and accept any warning about the plugin's source (it is ours and is not on the Adobe marketplace).
3. Start Photoshop and open the panel from **Plugins** > **Frank's … Brew**.

### Option B: Adobe's installer from the command line (if double-click does nothing or refuses)

**Mac** (Terminal, change the file path):

```
"/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS/UnifiedPluginInstallerAgent" --install ~/Downloads/chrometone-1.1.0.ccx
```

**Windows** (Command Prompt, change the file path):

```
"C:\Program Files\Common Files\Adobe\Adobe Desktop Common\RemoteComponents\UPI\UnifiedPluginInstallerAgent\UnifiedPluginInstallerAgent.exe" /install "%USERPROFILE%\Downloads\chrometone-1.1.0.ccx"
```

### Option C: UXP Developer Tool (always works)

1. In Photoshop: **Preferences** > **Plugins** > tick **Enable Developer Mode**, then restart Photoshop.
2. Download this repo (green **Code** button > **Download ZIP**) and unzip it.
3. Open **UXP Developer Tool**, click **Add Plugin** and pick `plugins/<tool>/manifest.json` (for example `plugins/chrometone/manifest.json`).
4. With Photoshop open, click **Load** next to the plugin. The panel is under **Plugins**.

With this option you must click **Load** again each time you restart Photoshop.

### Dock the panels (optional)

Drag each panel's tab into Photoshop's right-hand column (for example above **Properties**). Then save your layout with **Window** > **Workspace** > **New Workspace…** so it comes back every time.

---

## 3. How every tool works

Every panel has the same layout, with tabs at the top: **Look**, **Controls**, **Colour** and **Output**. Click a tab to jump to that section. The panel scrolls if there are more settings than fit, and you can fold away cards you don't use (the panel remembers).

1. Open your image in Photoshop.
2. Open the tool from **Plugins**.
3. **Look:** click a thumbnail in the look browser. The thumbnails show a sample picture, or switch to **My image** to see every look on your own artwork. The preview above updates as you change settings. **Whole** shows the full image and **Detail 1:1** shows real pixels.
4. **Controls:** turn the knobs. Click a knob's value box to select it (it glows white), then type a number, press the Up/Down arrow keys (hold Shift for bigger steps) or scroll the mouse wheel over the knob.
5. **Colour:** the Colour Deck recolours the result (see below).
6. **Output:** choose the source (whole image or the active layer) and click **Apply** (**Render** in Mobglow).

The result is a new layer group named after the tool and the look, for example `Frank's Mobglow Brew - Dreamy`. Hide it, change its blend mode or opacity, or delete it. Your image stays untouched underneath.

**Colour Deck** (all tools except Batch Mock Brew): choose **Off**, **Tone Map** or **Palette**.
- **Tone Map** paints up to 5 colours across the tones from dark to light. Drag the range bars to set where each colour sits, and add a background colour or knock it out.
- **Palette** limits the result to a set of colours. **Extract** pulls them from your image, and you can save your own palettes.

The colour goes on its own **Colour Deck** layer at the top of the group, so you can switch it off later.

**Share looks with the team:** in **Library**, type a name and click **Save look**. **Export all** writes your looks to one file that a teammate loads with **Import**.

**Tip:** if you tick **Hide source**, one Cmd+Z removes the effect but may leave the source hidden. Click its eye icon to show it again, or turn on Photoshop's **Preferences** > **Performance** > **Make Layer Visibility Changes Undoable**.

---

## 4. What pictures work best

The tools read the brightness and edges of your image, so strong, clean artwork gives the best results.

- **High contrast.** Clear darks and lights with bold shapes. Flat, grey, low-contrast photos give muddy results. Raise the contrast first if needed (or use Pre-process in Dithers Brew).
- **Black and white art.** Logos, line art, inked drawings and type are ideal for Dithers, Chrometone, Mobglow and CRT Phaser.
- **PNG with a transparent background.** Best for logos, type and merch graphics. Chrometone builds its bevel and 3D from the transparent outline, Mobglow glows around it, and Dithers keeps the paper transparent for DTF and screen print.
- **Size.** About 2500 to 3000 px on the long side, at 300 ppi for print. Very small images look soft. Paint Brew can make a print-ready upscaled copy for you.
- **Use the active layer** for a logo or type layer, so the effect covers only that artwork.

---

## 5. The tools

### Frank's Dithers Brew
**What:** turns artwork into halftone dots, dither patterns, line art (wave scan, engraving lines, contours, spiral, ripple, stipple, crosswave) or ASCII text. Output can be one ink or many: Tonal, Grade palettes, RGB or real CMYK plates. Extras include edge lines, DTF film prep, dot gain, misregister, speck clean-up and distress. There are 40 looks.
**How:** pick **Halftone**, **Dither** or **ASCII**, then click an algorithm in the thumbnail strip and pick a colour mode. Prepare the image in the **Image** card (levels, sharpen, noise, haze, invert) and fine-tune with the **Tune** card (threshold, strength, direction, spacing). Set the DPI for print, then click **Apply**. You get one layer per ink.
**Best pictures:** high-contrast photos and black and white art. Use a transparent PNG for DTF or screen print.

### Frank's Chrometone Brew
**What:** liquid chrome and 1980s retro chrome lettering, with bevels, horizon reflections, 3D extrusion, long shadow, stacked glows and sparkle. There are 24 looks.
**How:** choose a look (Classic or Retro chrome). Under **Surface**, Auto builds the chrome from the outline. Add **3D Extrusion**, **Glow** and **Shine FX** if you want them, then click **Apply**.
**Best pictures:** type and logos on a transparent PNG or on black. Use Source **Active layer** for a type layer.

### Frank's Depthtone Brew
**What:** treats brightness as height and draws topographic contours, stacked terraces or lit clay relief.
**How:** pick a style (**Contours**, **Terraces**, **Relief**). Set the number of levels, the far-to-near colours and the lines or light, then click **Apply**.
**Best pictures:** grayscale or photos with smooth light-to-dark shading, such as portraits, faces and landscapes. Busy, noisy images give messy lines.

### Frank's Mobglow Brew
**What:** a realistic, dreamy glow: the lights in your picture spill soft, coloured haze over the untouched original. There are 8 looks, including Dreamy, Fog City, Neon Rain, Soft Portrait and Blue Hour.
**How:** pick a look, then set **Radius** (how far the light spreads), **Strength**, **Threshold** (which lights glow), **Gamma**, **Saturation** and an optional **Color** tint. Use the eyedropper key and then click the preview to take the glow colour from the picture. Drag the **Before / After** line on the preview to compare, then click **Render**. Afterwards, the brush key adds a mask so you can paint glow away with black.
**Best pictures:** night scenes, neon, city lights, portraits with bright highlights, and logos or type on a dark or transparent background.

### Frank's Decompressor Brew
**What:** real JPEG damage (repeated saves), colour smear, bit crush, datamosh and glitch slices.
**How:** set the JPEG quality and number of generations, then add datamosh or glitch slices. Change the seed for a new variation, then click **Apply**. Big images with many generations take a while, and the panel warns you first.
**Best pictures:** colourful, detailed photos and graphics.

### Frank's CRT Phaser Brew
**What:** makes the image look like it's on an old TV or arcade screen, with scanlines, phosphor mask, colour fringing, bloom, curvature, noise and a roll band. **Phase FX** redraws the picture as moving signal lines: Waveform, Linear, Flux and Flux Dots, at any angle. There are 28 looks.
**How:** pick a look (Arcade Cabinet, Trinitron, Ember Trace, Dot Flux Ice…). Adjust the screen lines and the tube, or pick a Phase mode and set its angle with the 0/45/90/135 buttons or the dial, then click **Apply**. **Re-edit** reopens the last result's settings so you can change them and apply again.
**Best pictures:** bold, high-contrast graphics, pixel art and portraits. Very fine detail can shimmer, so raise the screen lines.

### Frank's Paint Brew
**What:** turns a photo into an editable painting in six styles: **Oil**, **Watercolour**, **Impressionism**, **Alcohol Ink**, **Spray Paint** and **Pastel**. Each painting is built from separate stroke and texture layers. There are 24 looks.
**How:** pick a style and a look, then set the brush size and detail. Choose paper, wall and ink colours from the swatches, the hex box or the colour picker in the panel. Spray Paint has a **Wall** card for the surface (brick, wood, stucco), grime, cracks, and the paint's blend and opacity. Optionally pick a selection or mask under **Focus** to keep the subject sharp, then click **Apply**. **Print-ready copy** upscales small photos to 300 ppi on a duplicate first.
**Best pictures:** photos with a clear subject and good light; bold, high-contrast subjects suit Spray Paint and Alcohol Ink. 2500 px or more is best for print.

### Frank's Batch Mock Brew
**What:** puts every artwork into every mockup automatically and exports JPG, PNG, PSD or MP4.
**How:**
1. Make three folders: **Mockups** (.psd or .psb), **Artwork** (JPG, PNG, PSD, PDF, TIFF, GIF, BMP) and **Export**.
2. In each mockup, name the Smart Object layer(s) to fill (default `artwork`; you can choose your own name).
3. In the panel, pick the three folders, the placement (**Fit**, **Fill/crop**, **Stretch**, **Center**), the export format and the file naming.
4. Click **Test first job** to check one result, then **Brew Batch**.

Settings are remembered. A log file is written to the Export folder. MP4 needs a mockup with a Video Timeline.
**Best pictures:** transparent PNG artwork for apparel and products, at the Smart Object's size or bigger.

---

## 6. Problems?

- **Panel missing:** check **Plugins** > **Frank's … Brew**. If it isn't there, reinstall it (Option A, B or C).
- **"Plugin can't be installed" on double-click:** use Option B or C. Our plugins aren't signed by the Adobe marketplace, and some setups block unsigned ones.
- **Titles look plain:** install the Night Machine font (ask Frank for the file) and restart Photoshop.
- **Apply is slow:** big images (6000 px or more) and heavy looks can take up to a minute. Work on a smaller copy while you experiment.
- Anything else: send Frank a screenshot of the panel and of what you expected.

---

## For developers

```
shared/            core every tool uses (edit here only)
plugins/<tool>/    one UXP plugin per tool; core/ is a synced copy of shared/
tools/             sync-core.js (copy shared/ into each plugin), build.js (.ccx files), make-icons.py
tests/             Node tests, incl. a headless panel run against a fake Photoshop
```

```
npm install        # jsdom, for the headless panel tests
npm run sync       # after editing anything in shared/
npm test
npm run build      # writes dist/<tool>-<version>.ccx
```

Style rules (black panels, thin white strokes, one neon per tool, Night Machine type, vertical scrolling) are enforced by the tests.
