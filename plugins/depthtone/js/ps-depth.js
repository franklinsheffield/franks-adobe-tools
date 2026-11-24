"use strict";
// Depthtone's Photoshop-side depth inputs now live in the shared core (shared/depth.js).
const S = require("../core/depth.js");
module.exports = { addSubject: S.addSubject, addDepthLayer: S.addDepthLayer, layerById: S.layerById, clearCache: S.clearCache, fitToSource: S.fitToSource };
