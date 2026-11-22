# Frank's Worlds Brew (WB-10)

A Bryce-inspired 3D scene builder for Photoshop: terrains, primitives, water, sky and fog, imported
3D models (.obj, .stl, .glb), a camera, and a raytraced render that lands as a layer group.
Classic mode keeps the quick build; Pro adds the Material, Terrain and Mesh labs, lights and extra layers.

Status: phase 1 (engine). The Photoshop panel (manifest.json, main.js) arrives in phase 2.

| File | Role |
|---|---|
| js/noise.js | Deterministic value noise and fbm |
| js/models.js | .obj / .stl / .glb / .gltf import, mesh normals, displacement, samples, .obj export |
| js/scene.js | Scene data, materials, skies, terrain heightmaps, camera, 12 built-in scenes, save/load |
| js/engine.js | Ray marcher + triangle BVH renderer; Render, Depth, Object mask, Sky mask layers |
| js/wire.js | Wireframe viewport into an RGBA buffer, picking, move / rotate / scale handles |

Contact sheet: `node tools/worlds-sheet.js <out-dir> [width]`.
Gate 1 spec: https://claude.ai/artifact/DhEBwvKKUv8hnN1gBN7JEL
