// Worlds Lab app: UI helpers from the UI research quick wins (2026-11-23).
//  - axisGizmo: the view ball in the viewport corner: drag to orbit, click an axis end to snap, ZOOM / PAN / FRAME / HOME strip.
//  - palette:   a Cmd/Ctrl+K command palette over every action, with fuzzy search and keyboard control.
const SVGNS = "http://www.w3.org/2000/svg";
const D2R = Math.PI / 180;

// ---- axis gizmo (view ball)
// cam = { yaw, pitch } in degrees; eye = target + (sin yaw cos pitch, sin pitch, cos yaw cos pitch) * dist
// 0.10 (Frank 2026-11-25 "more dynamic"): drag the ball to orbit (with a little momentum), click an axis end for a
// smooth snap to that view, click it again for the opposite view, double-click the ball for Home; a button strip
// under it: drag ZOOM / drag PAN, FRAME, HOME. Snaps always land on exact angles.
// o = { change(name), locked(), zoom(f), pan(cam0, dx, dy), frame(), home(), help(node, info) }
const SNAP_MS = 260;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export function axisGizmo(host, getCam, o) {
  const R = 34, C = 44;   // arm length, centre of a 88 px box
  const wrap = document.createElement("div"); wrap.className = "axisnav";
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("class", "axisgizmo"); svg.setAttribute("width", "88"); svg.setAttribute("height", "88"); svg.setAttribute("viewBox", "0 0 88 88");
  const ring = document.createElementNS(SVGNS, "circle"); ring.setAttribute("cx", C); ring.setAttribute("cy", C); ring.setAttribute("r", 42); ring.setAttribute("class", "agring"); svg.appendChild(ring);
  // view: [yaw, pitch] the camera moves to when that axis end is clicked (looking back at the target); opp = the opposite end
  const AX = [
    { k: "+X", v: [1, 0, 0], c: "var(--ax-x)", view: [90, 6], opp: "-X", title: "Right view (+X)" },
    { k: "-X", v: [-1, 0, 0], c: "var(--ax-x)", view: [270, 6], opp: "+X", title: "Left view (-X)" },
    { k: "+Y", v: [0, 1, 0], c: "var(--ax-y)", view: [null, 89], opp: "-Y", title: "Top view (+Y)" },
    { k: "-Y", v: [0, -1, 0], c: "var(--ax-y)", view: [null, -4], opp: "+Y", title: "Low view (-Y)" },
    { k: "+Z", v: [0, 0, 1], c: "var(--ax-z)", view: [0, 6], opp: "-Z", title: "Front view (+Z)" },
    { k: "-Z", v: [0, 0, -1], c: "var(--ax-z)", view: [180, 6], opp: "+Z", title: "Back view (-Z)" }
  ];
  const byK = {}; AX.forEach((a) => { byK[a.k] = a; });
  AX.forEach((a) => {
    const g = document.createElementNS(SVGNS, "g"); g.setAttribute("class", "agaxis" + (a.k[0] === "-" ? " neg" : "")); g.dataset.axis = a.k;
    const line = document.createElementNS(SVGNS, "line"); line.setAttribute("x1", C); line.setAttribute("y1", C); line.setAttribute("stroke", a.c);
    const dot = document.createElementNS(SVGNS, "circle"); dot.setAttribute("r", a.k[0] === "+" ? 8 : 6); dot.setAttribute("fill", a.k[0] === "+" ? a.c : "#000"); dot.setAttribute("stroke", a.c);
    const tx = document.createElementNS(SVGNS, "text"); tx.textContent = a.k[0] === "+" ? a.k[1] : "-" + a.k[1]; tx.setAttribute("text-anchor", "middle"); tx.setAttribute("dominant-baseline", "central");
    const tt = document.createElementNS(SVGNS, "title"); tt.textContent = a.title;
    g.append(line, dot, tx, tt);
    a.g = g; a.line = line; a.dot = dot; a.tx = tx; svg.appendChild(g);
  });
  wrap.appendChild(svg);
  const locked = () => !!(o.locked && o.locked());

  // ---- smooth snaps
  let anim = 0, snapT = 0, last = null;
  const near = (a, b) => Math.abs(((a - b) % 360 + 540) % 360 - 180) < 0.6;
  function atView(a) { const c = getCam(); return (a.view[0] === null || near(c.yaw, a.view[0])) && Math.abs(c.pitch - a.view[1]) < 0.6; }
  function snapTo(a) {
    if (locked()) return;
    if (atView(a) && last === a.k) a = byK[a.opp];   // the same end again: the opposite view
    last = a.k; stopSpin(); cancelAnimationFrame(anim);
    const c = getCam(), y0 = c.yaw, p0 = c.pitch, y1 = a.view[0] === null ? c.yaw : a.view[0], p1 = a.view[1];
    const dy = ((y1 - y0) % 360 + 540) % 360 - 180, t0 = performance.now();   // the short way round
    const name = a.title.replace(/ \(.*/, "");
    let done = false;
    const step = (now) => {
      if (done) return;
      const t = Math.min(1, ((now || performance.now()) - t0) / SNAP_MS), k = ease(t);
      c.yaw = t < 1 ? +(((y0 + dy * k) % 360 + 360) % 360).toFixed(2) : ((y1 % 360) + 360) % 360; c.pitch = t < 1 ? +(p0 + (p1 - p0) * k).toFixed(2) : p1;
      if (t >= 1) { done = true; clearTimeout(snapT); }
      o.change(t < 1 ? null : name); if (t < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
    clearTimeout(snapT); snapT = setTimeout(() => { cancelAnimationFrame(anim); step(t0 + SNAP_MS); }, SNAP_MS + 40);   // always lands, even when frames are throttled
  }

  // ---- drag the ball to orbit, with momentum
  let spin = 0, vel = [0, 0];
  function stopSpin() { cancelAnimationFrame(spin); spin = 0; }
  function orbitBy(dx, dy) { const c = getCam(); c.yaw = +(((c.yaw - dx) % 360 + 360) % 360).toFixed(2); c.pitch = +Math.max(-10, Math.min(89, c.pitch + dy)).toFixed(2); }
  let drag = null;
  svg.addEventListener("pointerdown", (e) => {
    e.stopPropagation(); e.preventDefault(); stopSpin(); cancelAnimationFrame(anim); clearTimeout(snapT);
    const g = e.target.closest && e.target.closest(".agaxis");
    drag = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, lt: performance.now(), axis: g ? byK[g.dataset.axis] : null, moved: false };
    vel = [0, 0]; try { svg.setPointerCapture(e.pointerId); } catch (err) { /* synthetic event */ }
  });
  svg.addEventListener("pointermove", (e) => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 3) return;
    drag.moved = true; svg.classList.add("dragging");
    if (locked()) return;
    const now = performance.now(), dx = (e.clientX - drag.lx) * 2, dy = (e.clientY - drag.ly) * 1.5, dt = Math.max(1, now - drag.lt);   // the ball's width ~ 180 degrees
    orbitBy(dx, dy); vel = [dx / dt * 16, dy / dt * 16]; drag.lx = e.clientX; drag.ly = e.clientY; drag.lt = now; last = null; o.change(null);
  });
  const end = (e) => {
    if (!drag) return; const d = drag; drag = null; svg.classList.remove("dragging");
    if (!d.moved) { if (d.axis) snapTo(d.axis); return; }
    if (locked() || performance.now() - d.lt > 80 || Math.hypot(vel[0], vel[1]) < 0.4) { o.change("Orbit"); return; }
    const go = () => { vel = [vel[0] * 0.9, vel[1] * 0.9]; orbitBy(vel[0], vel[1]); if (Math.hypot(vel[0], vel[1]) < 0.05) { spin = 0; o.change("Orbit"); return; } o.change(null); spin = requestAnimationFrame(go); };
    spin = requestAnimationFrame(go);
  };
  svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);
  svg.addEventListener("dblclick", (e) => { e.stopPropagation(); if (!locked()) { stopSpin(); o.home(); } });
  if (o.help) o.help(svg, { key: "nav.ball", name: "View ball", kind: "info" });

  // ---- button strip: drag ZOOM, drag PAN, FRAME, HOME
  const strip = document.createElement("div"); strip.className = "agbtns";
  function nb(id, label, onClick, onDrag) {
    const b = document.createElement("div"); b.className = "agb"; b.dataset.nav = id; b.textContent = label;
    let d = null;
    b.addEventListener("pointerdown", (e) => { e.stopPropagation(); e.preventDefault(); stopSpin(); cancelAnimationFrame(anim); d = { x: e.clientX, y: e.clientY, moved: false, cam: Object.assign({}, getCam()) }; b.classList.add("on"); try { b.setPointerCapture(e.pointerId); } catch (err) { /* synthetic */ } });
    b.addEventListener("pointermove", (e) => { if (!d || !onDrag) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (!d.moved && Math.hypot(dx, dy) < 3) return; d.moved = true; if (!locked()) onDrag(d, dx, dy, e); });
    const up = () => { if (!d) return; const was = d; d = null; b.classList.remove("on"); if (!was.moved && !locked()) onClick(); else if (was.moved) o.change(label === "ZOOM" ? "Zoom" : "Pan"); };
    b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up);
    strip.appendChild(b); if (o.help) o.help(b, { key: "nav." + id, name: label, kind: "button" }); return b;
  }
  nb("zoom", "ZOOM", () => { o.zoom(0.85); o.change("Zoom in"); }, (d, dx, dy, e) => { const c = getCam(); c.dist = d.cam.dist; o.zoom(Math.pow(1.01, dy)); o.change(null); });
  nb("pan", "PAN", () => {}, (d, dx, dy) => { o.pan(d.cam, dx, dy); o.change(null); });
  nb("frame", "FRAME", () => { o.frame(); o.change("Frame"); });
  nb("home", "HOME", () => { o.home(); });
  wrap.appendChild(strip);
  host.appendChild(wrap);

  function update() {
    const c = getCam(), y = c.yaw * D2R, p = c.pitch * D2R;
    const f = [-Math.sin(y) * Math.cos(p), -Math.sin(p), -Math.cos(y) * Math.cos(p)];   // forward (eye -> target)
    const r = [Math.cos(y), 0, -Math.sin(y)];                                             // right
    const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];   // up = right x forward
    const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    AX.forEach((a) => { a.sx = C + dot3(a.v, r) * R; a.sy = C - dot3(a.v, u) * R; a.depth = -dot3(a.v, f); });
    AX.slice().sort((a, b) => a.depth - b.depth).forEach((a) => {   // far ends first, near ends on top
      a.line.setAttribute("x2", a.sx); a.line.setAttribute("y2", a.sy); a.dot.setAttribute("cx", a.sx); a.dot.setAttribute("cy", a.sy);
      a.tx.setAttribute("x", a.sx); a.tx.setAttribute("y", a.sy + 0.5); a.g.style.opacity = a.depth < -0.05 ? 0.55 : 1; a.g.classList.toggle("cur", atView(a)); svg.appendChild(a.g);
    });
  }
  update();
  return { node: wrap, svg, update, snap: (k) => snapTo(byK[k]) };
}

// ---- command palette
// commands: [{ id, label, group, keys, run }]; getCommands is called each time the palette opens (so lists stay current)
export function palette(getCommands, onRun) {
  const wrap = document.createElement("div"); wrap.id = "palette"; wrap.hidden = true;
  wrap.innerHTML = '<div class="palbox" role="dialog" aria-label="Command palette"><input class="palin" type="text" spellcheck="false" placeholder="Type a command: add a model, load a scene, render, view..."><div class="pallist" role="listbox"></div><div class="palfoot">Up / Down to choose, Return to run, Esc to close</div></div>';
  document.body.appendChild(wrap);
  const input = wrap.querySelector(".palin"), list = wrap.querySelector(".pallist");
  let cmds = [], shown = [], cur = 0;
  // fuzzy score: every typed character must appear in order; word starts and runs score higher
  function score(q, s) {
    if (!q) return 1; s = s.toLowerCase(); let i = 0, sc = 0, run = 0;
    for (const ch of q) { const j = s.indexOf(ch, i); if (j < 0) return 0; run = j === i ? run + 1 : 0; sc += 1 + run * 2 + (j === 0 || s[j - 1] === " " ? 3 : 0); i = j + 1; }
    return sc - s.length * 0.01;
  }
  function render() {
    const q = input.value.trim().toLowerCase();
    shown = cmds.map((c) => ({ c, s: score(q, c.group + " " + c.label) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 60).map((x) => x.c);
    if (!q) shown = cmds.filter((c) => c.top).concat(cmds.filter((c) => !c.top)).slice(0, 60);
    cur = Math.min(cur, Math.max(0, shown.length - 1));
    list.innerHTML = "";
    shown.forEach((c, i) => {
      const r = document.createElement("div"); r.className = "palrow" + (i === cur ? " on" : ""); r.setAttribute("role", "option");
      r.innerHTML = '<span class="palg"></span><span class="pall"></span><span class="palk"></span>';
      r.children[0].textContent = c.group; r.children[1].textContent = c.label; r.children[2].textContent = c.keys || "";
      r.addEventListener("mousemove", () => { if (cur !== i) { cur = i; mark(); } });
      r.addEventListener("mousedown", (e) => { e.preventDefault(); run(c); });
      list.appendChild(r);
    });
    if (!shown.length) list.innerHTML = '<div class="palnone">No matching command</div>';
  }
  function mark() { Array.from(list.children).forEach((r, i) => r.classList.toggle("on", i === cur)); const r = list.children[cur]; if (r && r.scrollIntoView) r.scrollIntoView({ block: "nearest" }); }
  function run(c) { close(); try { c.run(); if (onRun) onRun(c); } catch (err) { console.error(err); } }
  function open() { cmds = getCommands(); input.value = ""; cur = 0; wrap.hidden = false; render(); input.focus(); }
  function close() { wrap.hidden = true; input.blur(); }
  input.addEventListener("input", () => { cur = 0; render(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); cur = Math.min(shown.length - 1, cur + 1); mark(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); cur = Math.max(0, cur - 1); mark(); }
    else if (e.key === "Enter") { e.preventDefault(); if (shown[cur]) run(shown[cur]); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
    e.stopPropagation();
  });
  wrap.addEventListener("mousedown", (e) => { if (e.target === wrap) close(); });
  return { open, close, toggle: () => (wrap.hidden ? open() : close()), get isOpen() { return !wrap.hidden; } };
}
