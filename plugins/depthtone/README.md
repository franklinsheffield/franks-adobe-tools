# Frank's Depthtone Brew 2.0

Real depth, redrawn: contours, terraces, relief, ridge lines, depth heat, anaglyph 3D and depth haze. (UXP panel, Photoshop 24.4+.)

Install: double-click `dist/depthtone-2.0.0.ccx`, then open Plugins > Frank's Depthtone Brew.

## Depth source (first card)
- **Smart** (default): runs Photoshop's Select Subject, stands the subject on a floor plane and adds fine relief from the photo. Automatic. Your selection and history are left as they were. "Find subject again" re-runs it.
- **Depth layer**: best quality. Make a depth map with Filter > Neural Filters > Depth Blur > "Output depth map only", select that layer, press "Use active layer as depth map", then hide it.
- **Brightness**: the 1.0 behaviour (bright comes forward).

Tick "Show the depth map in the preview" to check the depth before styling.

## Looks
18 looks: Holo Contours, Topo over Photo, Ridge Lines, Neon Ridges, Paper Strata, Clay Relief 2, Chrome Relief, Depth Heat, Anaglyph 3D, Depth Haze, plus the 8 from 1.0.

## Styles
Contours, Terraces, Relief, Ridges, Heat, Anaglyph, Haze. Photo mix lets the picture show through.

Apply makes a group "Frank's Depthtone Brew - <look>". Output can also add the depth map as a hidden layer. One Cmd+Z undoes it.
