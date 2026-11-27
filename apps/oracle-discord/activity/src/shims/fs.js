// Browser stand-in for node:fs: modules read their small image assets at load; the build inlines them (assets.gen.js).
import { ASSETS } from "../assets.gen.js";
const base = (p) => String(p).split(/[\\/]/).pop();
export function readFileSync(p) {
  const b64 = ASSETS[base(p)];
  if (b64 === undefined) throw new Error("asset not bundled: " + base(p));
  return { toString: (enc) => (enc === "base64" ? b64 : atob(b64)), length: b64.length };
}
export default { readFileSync };
