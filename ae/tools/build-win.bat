@echo off
rem Build Frank's Brew After Effects effects on Windows (.aex) with free Visual Studio
rem Build Tools. Run from an "x64 Native Tools Command Prompt":
rem   ae\tools\build-win.bat <path-to-AfterEffectsSDK> [tool]
setlocal enabledelayedexpansion
set SDK=%~1
set TOOL=%~2
if "%TOOL%"=="" set TOOL=crt-phaser
set HERE=%~dp0..
for /d /r "%SDK%" %%D in (Headers) do if exist "%%D\AE_Effect.h" set EXH=%%D
if not defined EXH ( echo AE SDK headers not found under %SDK% & exit /b 1 )
for %%E in ("%EXH%\..") do set EX=%%~fE
if "%TOOL%"=="crt-phaser" (
  set NAME=Franks CRT Phaser Brew
  set SRC=%HERE%\effects\crt-phaser
  set MAIN=!SRC!\ae\crt_ae.cpp
  set PIPL=!SRC!\ae\crt_pipl.r
  set ENG=!SRC!\crt_engine.cpp
)
if "%TOOL%"=="mobglow" (
  set NAME=Franks Mobglow Brew
  set SRC=%HERE%\effects\mobglow
  set MAIN=!SRC!\ae\mob_ae.cpp
  set PIPL=!SRC!\ae\mob_pipl.r
  set ENG=!SRC!\mob_engine.cpp
)
if "%TOOL%"=="depthtone" (
  set NAME=Franks Depthtone Brew
  set SRC=%HERE%\effects\depthtone
  set MAIN=!SRC!\ae\dt_ae.cpp
  set PIPL=!SRC!\ae\dt_pipl.r
  set ENG=!SRC!\dt_engine.cpp
)
if "%TOOL%"=="decompressor" (
  set NAME=Franks Decompressor Brew
  set SRC=%HERE%\effects\decompressor
  set MAIN=!SRC!\ae\dc_ae.cpp
  set PIPL=!SRC!\ae\dc_pipl.r
  set ENG=!SRC!\dc_engine.cpp
)
if "%TOOL%"=="all" (
  for %%T in (crt-phaser mobglow depthtone decompressor) do call "%~f0" "%SDK%" %%T || exit /b 1
  exit /b 0
)
if not defined NAME ( echo unknown tool %TOOL% & exit /b 1 )
set OUT=%HERE%\dist\win
set OBJ=%TEMP%\brew-%TOOL%
if not exist "%OUT%" mkdir "%OUT%"
if not exist "%OBJ%" mkdir "%OBJ%"
set INC=/I"%EX%\Headers" /I"%EX%\Headers\SP" /I"%EX%\Headers\Win" /I"%EX%\Util" /I"%EX%\Resources" /I"%HERE%\core" /I"!SRC!" /I"!SRC!\ae"
rem PiPL: preprocess, PiPLtool, preprocess again, resource compile
cl /nologo /I"%EX%\Headers" /I"%EX%\Resources" /I"!SRC!\ae" /EP /DMSWindows /DWIN32 /D_WINDOWS "!PIPL!" > "%OBJ%\pipl.rr" || exit /b 1
"%EX%\Resources\PiPLtool.exe" "%OBJ%\pipl.rr" "%OBJ%\pipl.rrc" || exit /b 1
cl /nologo /D "MSWindows" /EP "%OBJ%\pipl.rrc" > "%OBJ%\pipl.rc" || exit /b 1
rc /nologo /fo "%OBJ%\pipl.res" "%OBJ%\pipl.rc" || exit /b 1
cl /nologo /std:c++17 /O2 /EHsc /MT /LD /DMSWindows /DWIN32 /D_WINDOWS %INC% "!MAIN!" "!ENG!" "%OBJ%\pipl.res" /Fo"%OBJ%\\" /Fe"%OUT%\!NAME!.aex" /link /DLL || exit /b 1
echo built: %OUT%\!NAME!.aex
