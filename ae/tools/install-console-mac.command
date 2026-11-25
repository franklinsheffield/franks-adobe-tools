#!/bin/bash
# Lab Console (After Effects panel) - free Mac installer. No password needed.
# 1) copies the panel into your user CEP extensions folder
# 2) turns on Adobe's PlayerDebugMode for CEP 11/12 so this unsigned (free) panel can load
cd "$(dirname "$0")"
SRC="console"; [ -d "$SRC" ] || SRC="../console"
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/com.franks.brewconsole"
mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
cp -R "$SRC" "$DEST"
xattr -dr com.apple.quarantine "$DEST" 2>/dev/null
for V in 11 12; do defaults write com.adobe.CSXS.$V PlayerDebugMode 1; done
echo "Installed Lab Console to: $DEST"
echo "Restart After Effects, then open Window > Extensions > Lab Console."
read -n 1 -s -r -p "Press any key to close."
