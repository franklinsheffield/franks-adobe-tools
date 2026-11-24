// Frank's Brew suite - After Effects shared Motion group.
// Every effect has these controls; each tool maps the evaluated values onto its
// own engine (see effects/<tool>/<tool>_motion.h). Motion off = still frame.
#pragma once
#include "brew_math.h"

namespace brew {

enum RevealMode { REVEAL_FADE = 0, REVEAL_WIPE, REVEAL_DISSOLVE, REVEAL_SCAN };

struct Motion {
  bool animate = false;
  double speed = 100;        // % of every built-in motion
  double loopFrames = 0;     // 0 = endless, else seamless loop length
  double seed = 0;           // 0 = the look's own randomness
  double boil = 0;           // re-roll random parts every N frames (0 = off)
  double driftX = 0, driftY = 0;   // px/s at full resolution
  double spin = 0;           // deg/s
  double pulse = 0, pulseRate = 1;       // %, Hz
  double flicker = 0, flickerRate = 12;  // %, Hz
  double jitter = 0, jitterRate = 12;    // px, Hz
  double reveal = 100; int revealMode = REVEAL_FADE; double revealAngle = 0;
  double morph = 0;          // % toward Look B (handled by the effect glue)
};

// Time base for one frame: loop-aware helpers so loops are seamless.
struct Clock {
  double te = 0;        // effective seconds (speed applied, wrapped to the loop)
  double loopSec = 0;   // 0 = endless
  double fps = 30;
  long frame = 0;       // effective frame index (wraps with the loop)
  bool on = false;

  static Clock make(const Motion& m, double timeSec, double fps) {
    Clock c; c.fps = fps > 0 ? fps : 30; c.on = m.animate;
    if (!m.animate) return c;
    double tc = timeSec;                       // comp seconds
    if (m.loopFrames > 0) {                    // the loop is counted in comp frames
      double L = m.loopFrames / c.fps;
      tc = std::fmod(tc, L); if (tc < 0) tc += L;
      c.loopSec = L * m.speed / 100;           // loop length in effective time
    }
    c.te = tc * m.speed / 100;
    c.frame = (long)std::floor(tc * c.fps + 1e-6);
    return c;
  }
  // cycles completed by a periodic motion of `hz`; whole cycles per loop when looping
  double cycles(double hz) const {
    if (!on) return 0;
    if (loopSec > 0) { double k = std::round(hz * loopSec); return k / loopSec * te; }
    return hz * te;
  }
  // distance travelled at `rate` units/s by a pattern repeating every `period` units
  double drift(double rate, double period) const {
    if (!on) return 0;
    if (loopSec > 0 && period > 0) { double k = std::round(rate * loopSec / period); return k * period / loopSec * te; }
    return rate * te;
  }
  // deterministic random 0..1 for an integer tick
  static double rnd(long tick, double salt, double seed) { return (hashNoise((double)tick, salt, seed + 101) + 1) / 2; }
  // the frame index used for random parts: boil steps every N frames, else every frame
  long randomTick(const Motion& m) const { if (!on) return 0; return m.boil > 0 ? frame / (long)std::max(1.0, m.boil) : frame; }
};

// Brightness multiplier from Pulse + Flicker
inline double motionGain(const Motion& m, const Clock& c) {
  if (!c.on) return 1;
  double g = 1;
  if (m.pulse > 0) g *= 1 + m.pulse / 100 * 0.5 * std::sin(2 * 3.14159265358979 * c.cycles(m.pulseRate));
  if (m.flicker > 0) {
    long tick = (long)std::floor(c.cycles(m.flickerRate));
    double r = Clock::rnd(tick, 7, m.seed);
    if (r > 0.5) g *= 1 - m.flicker / 100 * (r - 0.5) * 2;
  }
  return g;
}

// Post pass: Jitter (shift the effect) and Reveal (mix with the source). sc = render scale.
inline void motionPost(const Motion& m, const Clock& c, const Image& src, OutImage& out, double sc) {
  int w = out.w, h = out.h;
  if (c.on && m.jitter > 0) {
    long tick = (long)std::floor(c.cycles(m.jitterRate));
    int jx = (int)std::round((Clock::rnd(tick, 3, m.seed) * 2 - 1) * m.jitter * sc);
    int jy = (int)std::round((Clock::rnd(tick, 5, m.seed) * 2 - 1) * m.jitter * sc);
    if (jx || jy) {
      std::vector<float> o = out.px;
      for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
        int sx = iclamp(x - jx, 0, w - 1), sy = iclamp(y - jy, 0, h - 1);
        for (int k = 0; k < 4; k++) out.px[((size_t)y * w + x) * 4 + k] = o[((size_t)sy * w + sx) * 4 + k];
      }
    }
  }
  double a = clamp(m.reveal / 100, 0, 1);
  if (a >= 1) return;
  double ang = m.revealAngle * 3.14159265358979 / 180, ca = std::cos(ang), sa = std::sin(ang);
  double span = std::fabs(ca) * w + std::fabs(sa) * h, soft = 0.04;
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    double k;
    switch (m.revealMode) {
      case REVEAL_WIPE: { double t = ((x - w / 2.0) * ca + (y - h / 2.0) * sa) / span + 0.5; k = clamp((a * (1 + soft) - t) / soft, 0, 1); break; }
      case REVEAL_DISSOLVE: { double r = (hashNoise(std::floor(x / std::max(1.0, 2 * sc)), std::floor(y / std::max(1.0, 2 * sc)), 77 + m.seed) + 1) / 2; k = r < a ? 1 : 0; break; }
      case REVEAL_SCAN: { double t = (double)y / h; k = clamp((a * (1 + soft) - t) / soft, 0, 1); break; }
      default: k = a;
    }
    size_t i = (size_t)y * w + x; float* p = &out.px[i * 4];
    p[0] = (float)(src.R[i] + (p[0] - src.R[i]) * k); p[1] = (float)(src.G[i] + (p[1] - src.G[i]) * k);
    p[2] = (float)(src.B[i] + (p[2] - src.B[i]) * k); p[3] = (float)(src.A[i] + (p[3] - src.A[i]) * k);
  }
}

} // namespace brew
