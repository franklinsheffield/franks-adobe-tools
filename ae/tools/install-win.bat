@echo off
rem Lab for After Effects - free Windows installer.
rem Right-click > Run as administrator. Copies every .aex next to this file into
rem After Effects' shared plug-in folder.
set DEST=%CommonProgramFiles%\Adobe\Plug-ins\7.0\MediaCore\Franks Brew
echo Installing the Lab effects into: %DEST%
if not exist "%DEST%" mkdir "%DEST%"
copy /Y "%~dp0*.aex" "%DEST%\" || (echo Run this as administrator. & pause & exit /b 1)
echo Done. Restart After Effects, then look in Effect ^> Lab.
pause
