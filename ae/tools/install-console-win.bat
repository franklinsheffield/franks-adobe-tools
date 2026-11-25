@echo off
rem Lab Console (After Effects panel) - free Windows installer. No admin needed.
rem Copies the panel to your CEP extensions folder and turns on PlayerDebugMode so the unsigned panel loads.
set "SRC=%~dp0console"
if not exist "%SRC%" set "SRC=%~dp0..\console"
set "DEST=%APPDATA%\Adobe\CEP\extensions\com.franks.brewconsole"
if exist "%DEST%" rmdir /s /q "%DEST%"
xcopy "%SRC%" "%DEST%\" /e /i /q /y >nul
reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul
reg add "HKCU\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul
echo Installed Lab Console to %DEST%
echo Restart After Effects, then open Window ^> Extensions ^> Lab Console.
pause
