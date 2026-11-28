// Talk instead of type: one floating 🎤 rides on the text box in use (no layout change to any room). Speech is turned
// into text by the browser's own speech recognition, typed into the box live, and a single-box question is sent when
// you stop talking, so it feels like a spoken conversation with the host (whose voice answers). Shown only where the
// browser has speech recognition and the page may use the microphone; Discord's Activity frame and some desktop
// apps do not allow it, and then the button never appears (or hides itself after the first refusal).
export const MIC_SKIP = 'input[type="search"],input[type="date"],input[type="time"],input[type="number"],input[type="email"],input[type="password"],[data-nomic]';
/** Fields the mic can talk into. */
export const micField = (el) => !!el && el.matches && el.matches('input:not([type]),input[type="text"],textarea') && !el.matches(MIC_SKIP) && !el.disabled && !el.readOnly;
/** Send by itself only when the field is the one text box in its group (a question box, a guess box). */
export function soloField(el) {
  const g = el.closest(".bk-speak,.form,.choices,.ask,[id],section,div") || el.parentElement; if (!g) return false;
  return el.tagName !== "TEXTAREA" && [...g.querySelectorAll('input:not([type]),input[type="text"],textarea')].filter((x) => !x.matches(MIC_SKIP)).length === 1;
}
/** Can this page listen at all? */
export function micSupported(w = globalThis) {
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition; if (!SR) return false;
  const pol = w.document && (w.document.permissionsPolicy || w.document.featurePolicy);
  try { if (pol && pol.allowsFeature && !pol.allowsFeature("microphone")) return false; } catch { /* unknown: try */ }
  return true;
}
export const MIC_CSS = `
.mic-float{position:fixed;z-index:60;width:28px;height:28px;border-radius:50%;border:1px solid rgba(102,224,255,.75);background:rgba(10,6,26,.85);color:#e8f4ff;font-size:14px;line-height:1;display:grid;place-items:center;cursor:pointer;padding:0;transition:box-shadow .2s,transform .15s}
.mic-float[hidden]{display:none}.mic-float:hover,.mic-float:focus-visible{box-shadow:0 0 10px rgba(102,224,255,.8);outline:none}
.mic-float.on{border-color:#ff4fae;background:#ff4fae;color:#fff;animation:mic-pulse 1.1s ease-in-out infinite}
@keyframes mic-pulse{50%{box-shadow:0 0 0 8px rgba(255,79,174,0),0 0 14px #ff4fae}}
input.mic-live,textarea.mic-live{box-shadow:0 0 0 2px #ff4fae inset}
@media (prefers-reduced-motion:reduce){.mic-float.on{animation:none}}`;
/** Wire it up. hooks: { onStart(), onEnd(heard), onUnavailable(why), lang } */
export function installMic(hooks = {}) {
  if (!micSupported()) return null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const st = document.createElement("style"); st.textContent = MIC_CSS; document.head.append(st);
  const btn = document.createElement("button"); btn.type = "button"; btn.className = "mic-float"; btn.hidden = true; btn.textContent = "🎤";
  btn.setAttribute("aria-label", "Speak instead of typing"); btn.title = "Speak instead of typing"; document.body.append(btn);
  let target = null, rec = null, dead = false, base = "";
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 40 && r.height > 10 && r.bottom > 0 && r.top < innerHeight; };
  const place = () => {
    if (dead) { btn.hidden = true; return; }
    if (!(target && target.isConnected && visible(target))) { const a = document.activeElement; target = micField(a) && visible(a) ? a : [...document.querySelectorAll("#box input, #box textarea, #book input, #book textarea")].find((x) => micField(x) && visible(x)) || null; }
    if (!target) { if (!rec) btn.hidden = true; return; }
    const r = target.getBoundingClientRect(); btn.hidden = false; btn.style.left = `${Math.round(r.right - 32)}px`; btn.style.top = `${Math.round(r.top + (Math.min(r.height, 44) - 28) / 2)}px`;
  };
  const stop = () => { if (rec) try { rec.stop(); } catch { /* already */ } };
  btn.addEventListener("mousedown", (e) => e.preventDefault()); // keep the box focused
  btn.onclick = () => {
    if (rec) return stop(); if (!target) return;
    const el = target; base = el.value ? el.value.replace(/\s*$/, " ") : "";
    rec = new SR(); rec.lang = hooks.lang || navigator.language || "en-GB"; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    let heard = "";
    rec.onresult = (e) => { let t = ""; for (const r of e.results) t += r[0].transcript; heard = t.trim(); el.value = (base + heard).slice(0, el.maxLength > 0 ? el.maxLength : 2000); el.dispatchEvent(new Event("input", { bubbles: true })); };
    rec.onerror = (e) => { if (["not-allowed", "service-not-allowed", "network", "audio-capture"].includes(e.error)) { dead = true; btn.hidden = true; hooks.onUnavailable?.(e.error); } };
    rec.onend = () => { btn.classList.remove("on"); el.classList.remove("mic-live"); const said = heard; rec = null; place(); hooks.onEnd?.(said);
      if (said && soloField(el)) el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })); };
    try { rec.start(); } catch { rec = null; return; }
    btn.classList.add("on"); el.classList.add("mic-live"); el.focus(); hooks.onStart?.();
  };
  document.addEventListener("focusin", (e) => { if (micField(e.target)) { target = e.target; place(); } });
  let t = 0; const later = () => { cancelAnimationFrame(t); t = requestAnimationFrame(place); };
  new MutationObserver(later).observe(document.body, { childList: true, subtree: true });
  addEventListener("resize", later); addEventListener("scroll", later, true);
  place();
  return { place, stop };
}
