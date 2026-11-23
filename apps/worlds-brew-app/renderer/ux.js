// Frank's Worlds Brew app: UI helpers from the UI research quick wins (2026-11-23).
//  - axisGizmo: a ViewHelper-style axis cube in the viewport corner; click an axis end to snap the camera to it.
//  - palette:   a Cmd/Ctrl+K command palette over every action, with fuzzy search and keyboard control.
const SVGNS = "http://www.w3.org/2000/svg";
const D2R = Math.PI / 180;

// ---- axis gizmo
// cam = { yaw, pitch } in degrees; eye = target + (sin yaw cos pitch, sin pitch, cos yaw cos pitch) * dist
export function axisGizmo(host, getCam, onSnap) {
  const R = 34, C = 44;   // arm length, centre of a 88 px box
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("class", "axisgizmo"); svg.setAttribute("width", "88"); svg.setAttribute("height", "88"); svg.setAttribute("viewBox", "0 0 88 88");
  const ring = document.createElementNS(SVGNS, "circle"); ring.setAttribute("cx", C); ring.setAttribute("cy", C); ring.setAttribute("r", 42); ring.setAttribute("class", "agring"); svg.appendChild(ring);
  // view: [yaw, pitch] the camera moves to when that axis end is clicked (looking back at the target)
  const AX = [
    { k: "+X", v: [1, 0, 0], c: "var(--ax-x)", view: [90, 6], title: "Right view (+X)" },
    { k: "-X", v: [-1, 0, 0], c: "var(--ax-x)", view: [270, 6], title: "Left view (-X)" },
    { k: "+Y", v: [0, 1, 0], c: "var(--ax-y)", view: [null, 89], title: "Top view (+Y)" },
    { k: "-Y", v: [0, -1, 0], c: "var(--ax-y)", view: [null, -4], title: "Low view (-Y)" },
    { k: "+Z", v: [0, 0, 1], c: "var(--ax-z)", view: [0, 6], title: "Front view (+Z)" },
    { k: "-Z", v: [0, 0, -1], c: "var(--ax-z)", view: [180, 6], title: "Back view (-Z)" }
  ];
  AX.forEach((a) => {
    const g = document.createElementNS(SVGNS, "g"); g.setAttribute("class", "agaxis" + (a.k[0] === "-" ? " neg" : ""));
    const line = document.createElementNS(SVGNS, "line"); line.setAttribute("x1", C); line.setAttribute("y1", C); line.setAttribute("stroke", a.c);
    const dot = document.createElementNS(SVGNS, "circle"); dot.setAttribute("r", a.k[0] === "+" ? 8 : 5.5); dot.setAttribute("fill", a.k[0] === "+" ? a.c : "#000"); dot.setAttribute("stroke", a.c);
    const tx = document.createElementNS(SVGNS, "text"); tx.textContent = a.k[0] === "+" ? a.k[1] : ""; tx.setAttribute("text-anchor", "middle"); tx.setAttribute("dominant-baseline", "central");
    const tt = document.createElementNS(SVGNS, "title"); tt.textContent = a.title;
    g.append(line, dot, tx, tt);
    g.addEventListener("pointerdown", (e) => { e.stopPropagation(); e.preventDefault(); onSnap(a.view[0], a.view[1], a.title.replace(/ \(.*/, "")); });
    a.g = g; a.line = line; a.dot = dot; a.tx = tx; svg.appendChild(g);
  });
  host.appendChild(svg);
  function update() {
    const c = getCam(), y = c.yaw * D2R, p = c.pitch * D2R;
    const f = [-Math.sin(y) * Math.cos(p), -Math.sin(p), -Math.cos(y) * Math.cos(p)];   // forward (eye -> target)
    const r = [Math.cos(y), 0, -Math.sin(y)];                                             // right
    const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];   // up = right x forward
    const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    AX.forEach((a) => { a.sx = C + dot3(a.v, r) * R; a.sy = C - dot3(a.v, u) * R; a.depth = -dot3(a.v, f); });
    AX.slice().sort((a, b) => a.depth - b.depth).forEach((a) => {   // far ends first, near ends on top
      a.line.setAttribute("x2", a.sx); a.line.setAttribute("y2", a.sy); a.dot.setAttribute("cx", a.sx); a.dot.setAttribute("cy", a.sy);
      a.tx.setAttribute("x", a.sx); a.tx.setAttribute("y", a.sy + 0.5); a.g.style.opacity = a.depth < -0.05 ? 0.55 : 1; svg.appendChild(a.g);
    });
  }
  update();
  return { node: svg, update };
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
