#!/bin/bash
# Frank's Brew for After Effects - free Mac installer.
# Double-click this file (or run it in Terminal). It copies every .plugin next to it
# into After Effects' shared plug-in folder and clears the download quarantine flag,
# so unsigned (free) plug-ins load without a paid Apple certificate.
cd "$(dirname "$0")"
DEST="/Library/Application Support/Adobe/Common/Plug-ins/7.0/MediaCore/Franks Brew"
echo "Installing Frank's Brew effects into: $DEST"
echo "(macOS will ask for your Mac password once.)"
sudo mkdir -p "$DEST"
for P in *.plugin; do
  [ -e "$P" ] || continue
  sudo rm -rf "$DEST/$P"
  sudo cp -R "$P" "$DEST/"
  sudo xattr -dr com.apple.quarantine "$DEST/$P" 2>/dev/null
  echo "  installed $P"
done
echo "Done. Restart After Effects, then look in Effect > Frank's Brew."
read -n 1 -s -r -p "Press any key to close."
