"use strict";
// Depthtone's depth builder now lives in the shared core (shared/depth.js), so other tools
// (CRT Phaser Lidar) use the same Smart depth and Depth layer code.
const S = require("../core/depth.js");
module.exports = { build: S.build, smartDepth: S.smartDepth, range: S.range };
