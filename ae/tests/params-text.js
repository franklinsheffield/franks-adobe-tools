"use strict";
// Generic "key value" text form of a Photoshop look (nested groups -> "group.key").
// Gradient stop arrays become "p:#hex p:#hex"; view/out (panel-only) are skipped.
module.exports = function toText(P, skip = ["view", "out"]) {
  const L = [];
  const put = (k, v) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) { L.push(k + " " + v.map((s) => s.p + ":" + s.c).join(" ")); return; }
    if (typeof v === "object") { for (const kk of Object.keys(v)) put(k + "." + kk, v[kk]); return; }
    L.push(k + " " + v);
  };
  for (const k of Object.keys(P)) if (!skip.includes(k)) put(k, P[k]);
  return L.join("\n") + "\n";
};
