# Frank's Brew Suite for After Effects

> **⚠️ Please do not share.**
> These tools are private to Frank and his team. Do not post, forward, upload or resell the plug-ins, the files in this repo or the looks made with them. Do not add anyone to this repo or pass the download links on without Frank's OK.

**Using Photoshop instead?** See the [Photoshop readme](README.md).

Seven native After Effects effects, each with the same looks and controls as its Photoshop Brew, plus a **Motion** group that animates them. Add them from **Effect > Frank's Brew**. The optional **Brew Console** panel lets you browse the looks with thumbnails and apply them in one click.

| Effect | Version | What it does |
|---|---|---|
| Frank's Dithers Brew | 1.1 | Halftone, dither, line art, ASCII and print separations |
| Frank's Chrometone Brew | 1.1 | Liquid chrome, retro chrome type, 3D extrusion, glow |
| Frank's Depthtone Brew | 1.0 | Contours, terraces and lit relief from brightness |
| Frank's Mobglow Brew | 2.0 | Realistic dreamy glow and bloom |
| Frank's Decompressor Brew | 1.0 | JPEG damage, bit crush, datamosh, glitch |
| Frank's CRT Phaser Brew | 1.1 | Old TV tube plus Phase FX: waveform, linear and flux lines |
| Frank's Paint Brew | 1.1 | Oil, watercolour, impressionism, alcohol ink, spray paint and pastel |

---

## 1. What you need

| Software | Mac | Windows PC | Notes |
|---|---|---|---|
| **Adobe After Effects 2024 or newer** | [Download](https://www.adobe.com/products/aftereffects.html) | [Download](https://www.adobe.com/products/aftereffects.html) | Tested on After Effects 2027 (v27.0). |
| **Computer** | macOS 11 or newer, Apple Silicon or Intel | Windows 10 or 11, 64-bit | |
| **Night Machine font** (recommended) | Get the `.otf` file from Frank | Same | Used by the Brew Console for titles. The effects work without it. |

Everything is free to install. No Apple Developer account, licence key or extra software is needed.

---

## 2. Download

| | Mac | Windows PC |
|---|---|---|
| **Download** | [FranksBrew-AE-Mac.zip](https://github.com/user-attachments/files/35257189/FranksBrew-AE-Mac.zip) | [FranksBrew-AE-Windows.zip](https://github.com/franklinsheffield/franks-adobe-tools/releases/download/ae-v1.0.0/FranksBrew-AE-Windows.zip) |
| **What's inside** | 7 `.plugin` effects, `install-mac.command`, `install-console-mac.command`, `console/` | 7 `.aex` effects, `install-win.bat`, `install-console-win.bat`, `console/` |

Both are also on the [release page](https://github.com/franklinsheffield/franks-adobe-tools/releases/tag/ae-v1.0.0). Quit After Effects before you install.

## 3. Install on a Mac

1. Double-click **FranksBrew-AE-Mac.zip** to unzip it.
2. **Effects:** right-click **install-mac.command** > **Open** > **Open**. Type your Mac password when asked (it's needed once to copy into the shared Adobe folder). It installs to `/Library/Application Support/Adobe/Common/Plug-ins/7.0/MediaCore/Franks Brew` and clears the download flag so the free, unsigned effects load.
3. **Brew Console (optional):** right-click **install-console-mac.command** > **Open** > **Open**. No password needed.
4. Start After Effects. The effects are in **Effect > Frank's Brew**, and the panel is in **Window > Extensions > Frank's Brew Console**.

If macOS says a file "can't be opened because it is from an unidentified developer", open **System Settings > Privacy & Security**, scroll down and click **Open Anyway**, then run it again. The effects are only ad-hoc signed because proper signing needs a paid Apple account.

## 4. Install on Windows

> The Windows effects build cleanly, but they haven't been tested in After Effects on a Windows PC yet. Please tell Frank if anything goes wrong.

1. Right-click **FranksBrew-AE-Windows.zip** > **Extract All**.
2. **Effects:** right-click **install-win.bat** > **Run as administrator**. It copies the `.aex` files to `C:\Program Files\Common Files\Adobe\Plug-ins\7.0\MediaCore\Franks Brew`.
3. **Brew Console (optional):** double-click **install-console-win.bat**. No admin needed.
4. Start After Effects. The effects are in **Effect > Frank's Brew**, and the panel is in **Window > Extensions > Frank's Brew Console**.

If Windows SmartScreen warns you, click **More info** > **Run anyway**.

---

## 5. How the effects work

- **Look:** pick a look from the menu at the top of the effect and every control is set to match it. You can then change any control and keyframe it like any other After Effects control.
- **Motion:** each effect has the same Motion group: Animate, Speed, Loop, Seed, Boil, Drift, Spin, Pulse, Flicker, Jitter and Reveal. Turn on **Animate**, then raise the ones you want. **Loop** makes the motion repeat seamlessly over the length you set.
- **Look B + Morph:** choose a second look in **Look B**, then animate **Morph** from 0 to 100% to blend smoothly from one look to the other.
- **Tool motion:** some effects have their own extra motion controls too. For example, Paint Brew can paint the picture in over a set time and make the brush breathe.
- **Brew Console:** select layers, pick an effect, then click a look to apply it (or set it as Look B). It can also add motion in one click, link a control to the music, and save looks. Saved looks use the same file format as the Photoshop Brews, so **Export** / **Import** work in both directions.

The effects render the same pixels as the Photoshop versions when Motion is off.

## 6. Problems?

- **The effects aren't in the Effect menu:** quit After Effects completely, run the installer again, then restart.
- **Frank's Brew Console is missing from Window > Extensions:** run the console installer again and restart After Effects. It turns on Adobe's setting for free, unsigned panels.
- **Paint Brew is slow:** it is the heaviest effect, about 0.4 to 1.1 seconds per 1080p frame. Preview at half or quarter resolution.

---

## For developers

- All After Effects source is in [`ae/`](ae/): the shared engine core (`ae/core`), one folder per effect (`ae/effects/<tool>`), the Brew Console (`ae/console`), the build and install scripts (`ae/tools`), and the JS-vs-C++ parity tests (`ae/tests`).
- Build on a Mac with only the Command Line Tools: `ae/tools/build-mac.sh <AfterEffectsSDK folder> <tool>`. Build on Windows with Visual Studio: `ae\tools\build-win.bat <AfterEffectsSDK folder> all`.
- The **AE release** GitHub Action builds both platforms and updates the release zips whenever `ae/` changes on `main`.
- `ae/sdk` holds Adobe's After Effects SDK, which may not be redistributed. It's allowed here only because the repo is private. Remove it before the repo is ever made public.
