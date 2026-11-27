// Pixel Scape web build: phone layout. On small screens the 3D view fills the screen and the side panels become
// slide-up drawers opened from a bottom tab bar. Desktop and the Electron app are unchanged.
const QUERY = "(max-width: 820px), (max-height: 520px) and (pointer: coarse)";
const TABS = [
  { id: "lib", label: "Add", icon: "＋", el: "#lib" },
  { id: "insp", label: "Edit", icon: "✎", el: "#insp" },
  { id: "pad", label: "Move", icon: "✥", el: "#pad" },
  { id: "bar", label: "Render", icon: "◉", el: "#bar" },
  { id: "menu", label: "File", icon: "☰", el: "#top .menu" },
];
export const isPhone = () => window.matchMedia(QUERY).matches;

// phones: render at up to 1.5x pixels instead of 2x (about 45% fewer pixels to shade) and with cheaper shadows
export function lightRender(win, on) {
  const r = win.__wb && win.__wb.vp && win.__wb.vp.renderer; if (!r) return false;
  r.setPixelRatio(Math.min(on ? 1.5 : 2, win.devicePixelRatio || 1) * (win.__psQ || 1));   // __psQ: auto quality (extras.js)
  if (r.shadowMap) { const T = on ? 1 : 2; if (r.shadowMap.type !== T) { r.shadowMap.type = T; r.shadowMap.needsUpdate = true; } }   // 1 = PCF, 2 = PCF soft
  return true;
}

const redraw = (win) => { const W = win.__wb; if (W && W.changed) win.requestAnimationFrame(() => W.changed("view")); };

export function startPhone(doc = document, win = window) {
  const mq = win.matchMedia(QUERY), body = doc.body;
  const tabs = doc.createElement("nav"); tabs.id = "ps-tabs"; tabs.setAttribute("aria-label", "Panels");
  let open = null;
  const show = (id) => {
    open = open === id ? null : id;
    for (const t of TABS) {
      const panel = doc.querySelector(t.el); if (panel) panel.classList.toggle("ps-open", open === t.id);
      const b = tabs.querySelector('[data-tab="' + t.id + '"]'); if (b) b.setAttribute("aria-pressed", String(open === t.id));
    }
    body.classList.toggle("ps-drawer", !!open); body.classList.toggle("ps-pad", open === "pad");
    redraw(win);
  };
  for (const t of TABS) {
    const b = doc.createElement("button"); b.type = "button"; b.dataset.tab = t.id; b.setAttribute("aria-pressed", "false");
    b.innerHTML = '<span class="ps-tab-ic">' + t.icon + '</span><span class="ps-tab-lb">' + t.label + "</span>";
    b.onclick = () => show(t.id); tabs.appendChild(b);
  }
  const app = doc.getElementById("app") || body; app.appendChild(tabs);
  // tapping the 3D view closes an open drawer (except Move, which you use while looking at the view)
  const vp = doc.getElementById("vpwrap");
  if (vp) vp.addEventListener("pointerdown", () => { if (open && open !== "pad" && body.classList.contains("ps-phone")) show(open); }, true);
  const apply = () => {
    const on = mq.matches; body.classList.toggle("ps-phone", on);
    // the Move pad lives under the 3D view on desktop; on phones it is its own grid row of the app, docked under the view
    const pad = doc.getElementById("pad"), centre = doc.getElementById("centre");
    if (pad && centre) { if (on && pad.parentElement === centre) app.insertBefore(pad, tabs); else if (!on && pad.parentElement !== centre) centre.appendChild(pad); }
    if (!on && open) show(open);
    lightRender(win, on);
    win.dispatchEvent(new Event("resize"));
    redraw(win);
  };
  mq.addEventListener ? mq.addEventListener("change", apply) : mq.addListener(apply);
  apply();
  return { show, get open() { return open; } };
}
