// PiPL for Frank's CRT Phaser Brew (After Effects). Numbers must match brew_ae_version.h.
#include "AEConfig.h"
#include "AE_EffectVers.h"
#ifndef AE_OS_WIN
  #include "AE_General.r"
#endif
resource 'PiPL' (16000) {
  {
    Kind { AEEffect },
    Name { "Scanline Lab" },
    Category { "Lab" },
#ifdef AE_OS_WIN
  #if defined(AE_PROC_ARM64)
    CodeWinARM64 { "EffectMain" },
  #else
    CodeWin64X86 { "EffectMain" },
  #endif
#else
    CodeMacIntel64 { "EffectMain" },
    CodeMacARM64 { "EffectMain" },
#endif
    AE_PiPL_Version { 2, 0 },
    AE_Effect_Spec_Version { PF_PLUG_IN_VERSION, PF_PLUG_IN_SUBVERS },
    AE_Effect_Version { 1572865 },
    AE_Effect_Info_Flags { 0 },
    AE_Effect_Global_OutFlags { 33554436 },
    AE_Effect_Global_OutFlags_2 { 134217736 },
    AE_Effect_Match_Name { "com.franks.crtphaser.ae" },
    AE_Reserved_Info { 0 },
    AE_Effect_Support_URL { "https://github.com/franklinsheffield/franks-adobe-tools" }
  }
};
