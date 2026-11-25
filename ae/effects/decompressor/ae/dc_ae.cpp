// Frank's Decompressor Brew - After Effects effect (AE SDK glue). JPEG decay, bit crush,
// block mosh, glitch slices + a real temporal datamosh (earlier frames of the layer).
#include "AEConfig.h"
#include "entry.h"
#include "AE_Effect.h"
#include "AE_EffectCB.h"
#include "AE_Macros.h"
#include "Param_Utils.h"
#include "String_Utils.h"
#include "AE_EffectCBSuites.h"
#include "brew_ae.h"
#include "../dc_params_io.h"
#include "../dc_motion.h"
#include "../dc_presets.h"
#include "brew_ae_version.h"
#include "param_order.h"

using namespace brew;
using namespace brewae;

enum {
  P_INPUT = 0,
  T_LOOK_START, P_LOOK, P_LOOKB, P_MORPH, T_LOOK_END,
  T_JPEG_START, P_JPEG_ON, P_QUALITY, P_GENS, P_CHROMA, T_JPEG_END,
  T_CRUSH_START, P_BITS, T_CRUSH_END,
  T_MOSH_START, P_MOSH_AMT, P_MOSH_DIR, P_MOSH_BLOCK, T_MOSH_END,
  T_GL_START, P_SLICES, P_OFFSET, P_GSEED, T_GL_END,
  T_FIN_START, P_MIX, T_FIN_END,
  P_MO_BASE, P_MO_LAST = P_MO_BASE + MO_COUNT - 1,
  T_DM_START, P_DM_IEVERY, P_DM_BLEED, P_DM_SEARCH, P_DM_QWAVE, P_DM_QRATE, P_DM_ROLL, T_DM_END,
  P_NUM
};
static const char* CHROMAS = "4:4:4 (no bleed)|4:2:0 (JPEG)|4:1:1 (video smear)";
static const int MAX_HOLD = 48;          // frames the temporal datamosh looks back (render cost)

static PF_Err About(PF_InData* in_data, PF_OutData* out_data) {
  PF_SPRINTF(out_data->return_msg, "%s v%d.%d\rDEC-05  Lab suite\rDigital decay + real temporal datamosh.", "Decompressor Lab", BREW_MAJOR, BREW_MINOR);
  return PF_Err_NONE;
}
static PF_Err GlobalSetup(PF_InData* in_data, PF_OutData* out_data) {
  out_data->my_version = BREW_VERSION_PACKED; out_data->out_flags = BREW_OUT_FLAGS; out_data->out_flags2 = BREW_OUT_FLAGS2;
  return PF_Err_NONE;
}

// Lab 3.0 Effect Controls order: Motion, tool motion, Look + Primary, Advanced, Colour.
static const int BLOCK_ORDER[] = { P_MO_BASE, T_DM_START, T_LOOK_START, T_JPEG_START, T_CRUSH_START, T_MOSH_START, T_GL_START, T_FIN_START };
static const brew::ParamOrder PO(BLOCK_ORDER, (int)(sizeof BLOCK_ORDER / sizeof BLOCK_ORDER[0]), P_NUM);

static PF_Err ParamsSetup(PF_InData* in_data, PF_OutData* out_data) {
  PF_Err err = PF_Err_NONE; PF_ParamDef def;
  dc::Params D; dc::parseParams(D, dc::LOOKS[0].text);
  static std::string looks = lookMenu(dc::LOOKS, dc::LOOK_COUNT, false), looksB = lookMenu(dc::LOOKS, dc::LOOK_COUNT, true);

  for (int block : BLOCK_ORDER) switch (block) {
  case P_MO_BASE: {  // Motion
    if (!err) err = addMotion(in_data, P_MO_BASE, "Spin: mosh direction (deg/s)", "Drift X: block crawl (px/s)", "Drift Y: block crawl (px/s)");
  } break;
  case T_DM_START: {  // Decay motion
    BREW_TOPIC("Decay motion", T_DM_START, false);
    BREW_FS("Datamosh I-frame every (fr)", 0, MAX_HOLD, 0, MAX_HOLD, 0, 0, P_DM_IEVERY);
    BREW_FS("Datamosh bleed (%)", 0, 100, 0, 50, 0, 0, P_DM_BLEED);
    BREW_FS("Datamosh search (px)", 4, 64, 4, 32, 16, 0, P_DM_SEARCH);
    BREW_FS("Quality wave (%)", 0, 100, 0, 100, 0, 0, P_DM_QWAVE);
    BREW_FS("Quality wave rate (Hz)", 0, 10, 0, 4, 0.5, 2, P_DM_QRATE);
    BREW_FS("Slice roll (px/s)", -1000, 1000, -300, 300, 0, 0, P_DM_ROLL);
    BREW_ENDTOPIC(T_DM_END);
  } break;
  case T_LOOK_START: {  // Look
    BREW_TOPIC("Look", T_LOOK_START, false);
    AEFX_CLR_STRUCT(def); def.flags = PF_ParamFlag_SUPERVISE | PF_ParamFlag_CANNOT_TIME_VARY;
    PF_ADD_POPUP("Look", dc::LOOK_COUNT, 1, looks.c_str(), P_LOOK);
    AEFX_CLR_STRUCT(def); PF_ADD_POPUP("Look B (morph to)", dc::LOOK_COUNT + 2, 1, looksB.c_str(), P_LOOKB);
    BREW_FS("Morph to Look B", 0, 100, 0, 100, 0, 1, P_MORPH);
    BREW_ENDTOPIC(T_LOOK_END);
  } break;
  case T_JPEG_START: {  // JPEG
    BREW_TOPIC("JPEG", T_JPEG_START, false);
    AEFX_CLR_STRUCT(def); PF_ADD_CHECKBOXX("Compress", D.jpegOn, 0, P_JPEG_ON);
    BREW_FS("Quality", 1, 100, 1, 100, D.quality, 0, P_QUALITY);
    BREW_FS("Generations", 1, 20, 1, 20, D.generations, 0, P_GENS);
    AEFX_CLR_STRUCT(def); PF_ADD_POPUP("Chroma", 3, D.chroma + 1, CHROMAS, P_CHROMA);
    BREW_ENDTOPIC(T_JPEG_END);
  } break;
  case T_CRUSH_START: {  // Bit crush
    BREW_TOPIC("Bit crush", T_CRUSH_START, false);
    BREW_FS("Bits per channel", 1, 8, 1, 8, D.bits, 0, P_BITS);
    BREW_ENDTOPIC(T_CRUSH_END);
  } break;
  case T_MOSH_START: {  // Block mosh
    BREW_TOPIC("Block mosh", T_MOSH_START, false);
    BREW_FS("Amount (%)", 0, 100, 0, 100, D.moshAmount, 0, P_MOSH_AMT);
    AEFX_CLR_STRUCT(def); PF_ADD_ANGLE("Direction", D.moshDir, P_MOSH_DIR);
    AEFX_CLR_STRUCT(def); PF_ADD_POPUP("Block", 2, D.moshBlock <= 8 ? 1 : 2, "8 px|16 px", P_MOSH_BLOCK);
    BREW_ENDTOPIC(T_MOSH_END);
  } break;
  case T_GL_START: {  // Glitch slices
    BREW_TOPIC("Glitch slices", T_GL_START, false);
    BREW_FS("Slices", 0, 40, 0, 40, D.slices, 0, P_SLICES);
    BREW_FS("Max offset (px)", 0, 300, 0, 300, D.offset, 0, P_OFFSET);
    BREW_FS("Seed", 1, 99, 1, 99, D.seed, 0, P_GSEED);
    BREW_ENDTOPIC(T_GL_END);
  } break;
  case T_FIN_START: {  // Finish
    BREW_TOPIC("Finish", T_FIN_START, false);
    BREW_FS("Effect mix (%)", 0, 100, 0, 100, D.mix, 0, P_MIX);
    BREW_ENDTOPIC(T_FIN_END);
  } break;
  default: break;
  }

  out_data->num_params = P_NUM;
  return err;
}

static dc::Params readLook(PF_ParamDef* p[]) {
  dc::Params P;
  P.jpegOn = bv(p, P_JPEG_ON); P.quality = fv(p, P_QUALITY); P.generations = std::round(fv(p, P_GENS)); P.chroma = iclamp(pv(p, P_CHROMA) - 1, 0, 2);
  P.bits = std::round(fv(p, P_BITS));
  P.moshAmount = fv(p, P_MOSH_AMT); P.moshDir = std::fmod(av(p, P_MOSH_DIR) + 3600, 360); P.moshBlock = pv(p, P_MOSH_BLOCK) == 1 ? 8 : 16;
  P.slices = std::round(fv(p, P_SLICES)); P.offset = fv(p, P_OFFSET); P.seed = std::round(fv(p, P_GSEED));
  P.mix = fv(p, P_MIX);
  return P;
}
static void applyLook(PF_ParamDef* p[], int idx) {
  dc::Params P; dc::parseParams(P, dc::LOOKS[iclamp(idx, 0, dc::LOOK_COUNT - 1)].text);
  setB(p, P_JPEG_ON, P.jpegOn); setF(p, P_QUALITY, P.quality); setF(p, P_GENS, P.generations); setP(p, P_CHROMA, P.chroma + 1);
  setF(p, P_BITS, P.bits);
  setF(p, P_MOSH_AMT, P.moshAmount); setA(p, P_MOSH_DIR, P.moshDir); setP(p, P_MOSH_BLOCK, P.moshBlock <= 8 ? 1 : 2);
  setF(p, P_SLICES, P.slices); setF(p, P_OFFSET, P.offset); setF(p, P_GSEED, P.seed);
  setF(p, P_MIX, P.mix);
}
static PF_Err UserChangedParam(PF_InData* in_data, PF_OutData* out_data, PF_ParamDef* params[], const PF_UserChangedParamExtra* which) {
  if (which->param_index == PO(P_LOOK)) applyLook(params, params[P_LOOK]->u.pd.value - 1);
  return PF_Err_NONE;
}

static PF_Err Render(PF_InData* in_data, PF_OutData* out_data, PF_ParamDef* params[], PF_LayerDef* output) {
  PF_Err err = PF_Err_NONE;
  const int w = output->width, h = output->height;
  Image cur; readWorld(&params[P_INPUT]->u.ld, w, h, cur);
  const double sc = renderScale(in_data);
  dc::Params A = readLook(params); A.scale = sc; A.fullH = h / std::max(1e-6, sc);
  dc::Params B; const dc::Params* Bp = nullptr;
  int lb = params[P_LOOKB]->u.pd.value;
  if (lb >= 3) { dc::parseParams(B, dc::LOOKS[iclamp(lb - 3, 0, dc::LOOK_COUNT - 1)].text); B.scale = sc; B.fullH = A.fullH; Bp = &B; }
  Motion m = readMotion(params, P_MO_BASE, P_MORPH);
  dc::DcMotion dm; dm.iEvery = std::round(fv(params, P_DM_IEVERY)); dm.bleed = fv(params, P_DM_BLEED); dm.search = fv(params, P_DM_SEARCH);
  dm.qualityWave = fv(params, P_DM_QWAVE); dm.qualityRate = fv(params, P_DM_QRATE); dm.sliceRoll = fv(params, P_DM_ROLL);
  Clock c = makeClock(in_data, m);
  Prog pr = { in_data };

  // Real temporal datamosh: walk from the last I-frame to now, applying each frame's block
  // motion to the stale picture. Frames come from the layer itself (checkout at earlier times).
  Image moshed = cur;
  if (c.on && dm.iEvery >= 2) {
    const A_long step = in_data->time_step ? in_data->time_step : 1;
    const A_long frameIdx = in_data->current_time / step;
    const long back = std::min<long>((long)(frameIdx % (A_long)dm.iEvery), MAX_HOLD);
    if (back > 0) {
      std::vector<Image> frames((size_t)back + 1);
      for (long k = back; k >= 1 && !err; k--) {
        A_long t = in_data->current_time - (A_long)k * step;
        if (t < 0) t = 0;
        PF_ParamDef def; AEFX_CLR_STRUCT(def);
        err = PF_CHECKOUT_PARAM(in_data, P_INPUT, t, step, in_data->time_scale, &def);
        if (!err) { readWorld(&def.u.ld, w, h, frames[(size_t)(back - k)]); PF_CHECKIN_PARAM(in_data, &def); }
        if (!err && PF_ABORT(in_data)) err = PF_Interrupt_CANCEL;
      }
      if (err) return err;
      frames[(size_t)back] = cur;
      std::vector<const Image*> fp; for (auto& f : frames) fp.push_back(&f);
      dc::temporalMosh(fp, std::max(8, (int)std::round(16 * sc)), std::max(4, (int)std::round(dm.search * sc)), dm.bleed / 100, moshed);
    }
  }
  OutImage out;
  if (!dc::renderFrame(moshed, cur, A, Bp, dm, m, c, out, progressCb, &pr)) return PF_Interrupt_CANCEL;
  writeWorld(out, output);
  return err;
}

extern "C" DllExport PF_Err PluginDataEntryFunction2(PF_PluginDataPtr inPtr, PF_PluginDataCB2 inPluginDataCallBackPtr,
    SPBasicSuite* inSPBasicSuitePtr, const char* inHostName, const char* inHostVersion) {
  PF_Err result = PF_Err_NONE;
  PF_REGISTER_EFFECT_EXT2(inPtr, inPluginDataCallBackPtr, "Decompressor Lab", "com.franks.decompressor.ae",
                          "Lab", AE_RESERVED_INFO, "EffectMain", "https://github.com/franklinsheffield/franks-adobe-tools");
  return result;
}

extern "C" DllExport PF_Err EffectMain(PF_Cmd cmd, PF_InData* in_data, PF_OutData* out_data, PF_ParamDef* params[], PF_LayerDef* output, void* extra) {
  PF_Err err = PF_Err_NONE;
  PF_ParamDef* PB[P_NUM];                     // params by id (see param_order.h)
  try {
    switch (cmd) {
      case PF_Cmd_ABOUT: err = About(in_data, out_data); break;
      case PF_Cmd_GLOBAL_SETUP: err = GlobalSetup(in_data, out_data); break;
      case PF_Cmd_PARAMS_SETUP: err = ParamsSetup(in_data, out_data); break;
      case PF_Cmd_USER_CHANGED_PARAM: err = UserChangedParam(in_data, out_data, PO.byId(params, PB), (const PF_UserChangedParamExtra*)extra); break;
      case PF_Cmd_RENDER: err = Render(in_data, out_data, PO.byId(params, PB), output); break;
      default: break;
    }
  } catch (PF_Err& thrown) { err = thrown; }
  catch (...) { err = PF_Err_OUT_OF_MEMORY; }
  return err;
}
