// Frank's Brew suite - shared After Effects glue: the Motion group, look menus,
// world <-> float planes, render clock, progress. Include after the AE SDK headers.
#pragma once
#include "motion.h"
#include "brew_layers.h"
#include <string>

namespace brewae {
using namespace brew;

static const char* BOILS = "Off|Every frame|On 2s|On 3s|On 4s|On 6s|On 12s";
static const int BOIL_N[] = { 0, 1, 2, 3, 4, 6, 12 };
static const char* REVEALS = "Fade|Wipe|Dissolve|Scan down";

#define BREW_FS(NAME, VMIN, VMAX, SMIN, SMAX, DFLT, PREC, ID) \
  AEFX_CLR_STRUCT(def); PF_ADD_FLOAT_SLIDERX(NAME, VMIN, VMAX, SMIN, SMAX, DFLT, PREC, 0, 0, ID);
#define BREW_TOPIC(NAME, ID, COLLAPSED) \
  AEFX_CLR_STRUCT(def); def.flags = (COLLAPSED) ? PF_ParamFlag_START_COLLAPSED : 0; PF_ADD_TOPIC(NAME, ID);
#define BREW_ENDTOPIC(ID) AEFX_CLR_STRUCT(def); PF_END_TOPIC(ID);

// Motion group ids are consecutive from `base`: topic, 17 controls, end topic (19 ids).
enum { MO_TOPIC = 0, MO_ANIMATE, MO_SPEED, MO_LOOP, MO_SEED, MO_BOIL, MO_DRIFTX, MO_DRIFTY, MO_SPIN,
       MO_PULSE, MO_PULSER, MO_FLICK, MO_FLICKR, MO_JIT, MO_JITR, MO_REVEAL, MO_REVMODE, MO_REVANG, MO_END, MO_COUNT };

inline PF_Err addMotion(PF_InData* in_data, int base, const char* spinName, const char* driftXName, const char* driftYName) {
  PF_Err err = PF_Err_NONE; PF_ParamDef def;
  BREW_TOPIC("Motion", base + MO_TOPIC, false);
  AEFX_CLR_STRUCT(def); PF_ADD_CHECKBOXX("Animate", 0, 0, base + MO_ANIMATE);
  BREW_FS("Speed (%)", 0, 400, 0, 400, 100, 0, base + MO_SPEED);
  BREW_FS("Loop (frames, 0 = endless)", 0, 600, 0, 600, 0, 0, base + MO_LOOP);
  BREW_FS("Seed", 0, 9999, 0, 999, 0, 0, base + MO_SEED);
  AEFX_CLR_STRUCT(def); PF_ADD_POPUP("Boil", 7, 1, BOILS, base + MO_BOIL);
  BREW_FS(driftXName, -500, 500, -200, 200, 0, 1, base + MO_DRIFTX);
  BREW_FS(driftYName, -500, 500, -200, 200, 0, 1, base + MO_DRIFTY);
  BREW_FS(spinName, -360, 360, -90, 90, 0, 1, base + MO_SPIN);
  BREW_FS("Pulse (%)", 0, 100, 0, 100, 0, 0, base + MO_PULSE);
  BREW_FS("Pulse rate (Hz)", 0, 10, 0, 4, 1, 2, base + MO_PULSER);
  BREW_FS("Flicker (%)", 0, 100, 0, 100, 0, 0, base + MO_FLICK);
  BREW_FS("Flicker rate (Hz)", 0, 30, 0, 30, 12, 1, base + MO_FLICKR);
  BREW_FS("Jitter (px)", 0, 50, 0, 20, 0, 1, base + MO_JIT);
  BREW_FS("Jitter rate (Hz)", 0, 30, 0, 30, 12, 1, base + MO_JITR);
  BREW_FS("Reveal (%)", 0, 100, 0, 100, 100, 1, base + MO_REVEAL);
  AEFX_CLR_STRUCT(def); PF_ADD_POPUP("Reveal mode", 4, 1, REVEALS, base + MO_REVMODE);
  AEFX_CLR_STRUCT(def); PF_ADD_ANGLE("Wipe angle", 0, base + MO_REVANG);
  BREW_ENDTOPIC(base + MO_END);
  return err;
}

inline double fv(PF_ParamDef* p[], int i) { return p[i]->u.fs_d.value; }
inline int pv(PF_ParamDef* p[], int i) { return p[i]->u.pd.value; }
inline double av(PF_ParamDef* p[], int i) { return FIX_2_FLOAT(p[i]->u.ad.value); }
inline bool bv(PF_ParamDef* p[], int i) { return p[i]->u.bd.value != 0; }
inline std::string hexOf(const PF_Pixel& c) { char b[8]; snprintf(b, sizeof b, "#%02X%02X%02X", c.red, c.green, c.blue); return b; }
inline std::string cv(PF_ParamDef* p[], int i) { return hexOf(p[i]->u.cd.value); }

inline Motion readMotion(PF_ParamDef* p[], int base, int morphIdx) {
  Motion m;
  m.animate = bv(p, base + MO_ANIMATE); m.speed = fv(p, base + MO_SPEED); m.loopFrames = std::round(fv(p, base + MO_LOOP));
  m.seed = std::round(fv(p, base + MO_SEED)); m.boil = BOIL_N[iclamp(pv(p, base + MO_BOIL) - 1, 0, 6)];
  m.driftX = fv(p, base + MO_DRIFTX); m.driftY = fv(p, base + MO_DRIFTY); m.spin = fv(p, base + MO_SPIN);
  m.pulse = fv(p, base + MO_PULSE); m.pulseRate = fv(p, base + MO_PULSER); m.flicker = fv(p, base + MO_FLICK); m.flickerRate = fv(p, base + MO_FLICKR);
  m.jitter = fv(p, base + MO_JIT); m.jitterRate = fv(p, base + MO_JITR);
  m.reveal = fv(p, base + MO_REVEAL); m.revealMode = pv(p, base + MO_REVMODE) - 1; m.revealAngle = av(p, base + MO_REVANG);
  m.morph = fv(p, morphIdx);
  return m;
}

// "Look" menu; with None: "None|(-|look1|look2..." (1 = None, 2 = separator, 3.. = looks)
template <class L> std::string lookMenu(const L* looks, int count, bool withNone) {
  std::string s = withNone ? "None|(-|" : "";
  for (int i = 0; i < count; i++) { if (i) s += "|"; s += looks[i].name; }
  return s;
}

// setters used when the Look popup fills every control
inline void setF(PF_ParamDef* p[], int i, double v) { p[i]->u.fs_d.value = v; p[i]->uu.change_flags = PF_ChangeFlag_CHANGED_VALUE; }
inline void setP(PF_ParamDef* p[], int i, int v) { p[i]->u.pd.value = v; p[i]->uu.change_flags = PF_ChangeFlag_CHANGED_VALUE; }
inline void setB(PF_ParamDef* p[], int i, bool v) { p[i]->u.bd.value = v ? 1 : 0; p[i]->uu.change_flags = PF_ChangeFlag_CHANGED_VALUE; }
inline void setA(PF_ParamDef* p[], int i, double deg) { p[i]->u.ad.value = FLOAT2FIX(deg); p[i]->uu.change_flags = PF_ChangeFlag_CHANGED_VALUE; }
inline void setC(PF_ParamDef* p[], int i, const std::string& hex) {
  RGB c = hexToRgb(isHex(hex) ? hex : "#000000");
  p[i]->u.cd.value.red = (A_u_char)c.r; p[i]->u.cd.value.green = (A_u_char)c.g; p[i]->u.cd.value.blue = (A_u_char)c.b; p[i]->u.cd.value.alpha = 255;
  p[i]->uu.change_flags = PF_ChangeFlag_CHANGED_VALUE;
}

// world (8 or 16 bpc) -> float planes 0..255, sized w x h
inline void readWorld(const PF_EffectWorld* in, int w, int h, Image& src) {
  src.resize(w, h);
  const bool deep = PF_WORLD_IS_DEEP(in);
  const int iw = std::min(w, (int)in->width), ih = std::min(h, (int)in->height);
  for (int y = 0; y < ih; y++) {
    if (deep) {
      const PF_Pixel16* row = (const PF_Pixel16*)((const char*)in->data + (size_t)y * in->rowbytes); const float k = 255.f / PF_MAX_CHAN16;
      for (int x = 0; x < iw; x++) { size_t i = (size_t)y * w + x; src.R[i] = row[x].red * k; src.G[i] = row[x].green * k; src.B[i] = row[x].blue * k; src.A[i] = row[x].alpha * k; }
    } else {
      const PF_Pixel8* row = (const PF_Pixel8*)((const char*)in->data + (size_t)y * in->rowbytes);
      for (int x = 0; x < iw; x++) { size_t i = (size_t)y * w + x; src.R[i] = row[x].red; src.G[i] = row[x].green; src.B[i] = row[x].blue; src.A[i] = row[x].alpha; }
    }
  }
}
// float RGBA 0..255 -> output world (8-bit truncates like the Photoshop engines)
inline void writeWorld(const OutImage& out, PF_EffectWorld* o) {
  const bool deep = PF_WORLD_IS_DEEP(o); const int w = std::min(out.w, (int)o->width), h = std::min(out.h, (int)o->height);
  for (int y = 0; y < h; y++) {
    const float* s = &out.px[(size_t)y * out.w * 4];
    if (deep) {
      PF_Pixel16* row = (PF_Pixel16*)((char*)o->data + (size_t)y * o->rowbytes); const double k = PF_MAX_CHAN16 / 255.0;
      for (int x = 0; x < w; x++) {
        row[x].red = (A_u_short)clamp(s[x * 4] * k + 0.5, 0, PF_MAX_CHAN16); row[x].green = (A_u_short)clamp(s[x * 4 + 1] * k + 0.5, 0, PF_MAX_CHAN16);
        row[x].blue = (A_u_short)clamp(s[x * 4 + 2] * k + 0.5, 0, PF_MAX_CHAN16); row[x].alpha = (A_u_short)clamp(s[x * 4 + 3] * k + 0.5, 0, PF_MAX_CHAN16); }
    } else {
      PF_Pixel8* row = (PF_Pixel8*)((char*)o->data + (size_t)y * o->rowbytes);
      for (int x = 0; x < w; x++) {
        row[x].red = (A_u_char)(int)clamp(s[x * 4], 0, 255); row[x].green = (A_u_char)(int)clamp(s[x * 4 + 1], 0, 255);
        row[x].blue = (A_u_char)(int)clamp(s[x * 4 + 2], 0, 255); row[x].alpha = (A_u_char)(int)clamp(s[x * 4 + 3], 0, 255); }
    }
  }
}

inline double renderScale(const PF_InData* in_data) { return (double)in_data->downsample_y.num / std::max(1, (int)in_data->downsample_y.den); }
inline double compFps(const PF_InData* in_data) {
  const double step = in_data->local_time_step ? std::fabs((double)in_data->local_time_step) : (double)in_data->time_step;
  return step > 0 ? (double)in_data->time_scale / step : 30;
}
inline Clock makeClock(const PF_InData* in_data, const Motion& m) {
  const double tsec = in_data->time_scale ? (double)in_data->current_time / in_data->time_scale : 0;
  return Clock::make(m, tsec, compFps(in_data));
}

struct Prog { PF_InData* in_data; };
inline bool progressCb(void* ctx, int done, int total) {
  PF_InData* in_data = ((Prog*)ctx)->in_data;
  if (PF_ABORT(in_data)) return false;
  PF_PROGRESS(in_data, done, total);
  return true;
}

} // namespace brewae
