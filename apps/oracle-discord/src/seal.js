// AES-GCM sealing for interaction options passed from the Worker to GitHub Actions, so birth data never
// appears in plain text in workflow inputs or logs. Key: ORACLE_KEY, 32 random bytes as base64.
const b64 = (u8) => btoa(String.fromCharCode(...u8));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const key = (k) => crypto.subtle.importKey("raw", unb64(k), "AES-GCM", false, ["encrypt", "decrypt"]);

export async function seal(obj, k) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(k), new TextEncoder().encode(JSON.stringify(obj))));
  const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12);
  return b64(out);
}
export async function open(s, k) {
  const u = unb64(s);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: u.slice(0, 12) }, await key(k), u.slice(12));
  return JSON.parse(new TextDecoder().decode(pt));
}
