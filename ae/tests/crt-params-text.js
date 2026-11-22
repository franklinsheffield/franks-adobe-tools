"use strict";
// crt::Params text form from a Photoshop look object (see crt_params_io.h)
module.exports = function toText(P) {
  const L = [];
  const put = (k, v) => { if (v !== undefined && v !== null) L.push(k + " " + v); };
  for (const g of ["screen", "conv", "mask", "scan", "tube", "signal", "finish"]) for (const k of Object.keys(P[g] || {})) put(g + "." + k, P[g][k]);
  const Q = P.phase || {};
  for (const k of Object.keys(Q)) { if (k === "ramp") put("phase.ramp", Q.ramp.map((s) => s.p + ":" + s.c).join(" ")); else put("phase." + k, Q[k]); }
  put("scale", P.scale); put("fullH", P.fullH);
  return L.join("\n") + "\n";
};
