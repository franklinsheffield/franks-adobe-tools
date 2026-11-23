#!/bin/bash
# Build Frank's Brew After Effects effects on macOS with only the Command Line Tools
# (no Xcode, no paid Apple account). Universal (Apple Silicon + Intel), ad-hoc signed.
#   ae/tools/build-mac.sh <path-to-AfterEffectsSDK> [tool]
# SDK path = the unzipped "AfterEffectsSDK" folder (it contains Examples/Headers).
set -euo pipefail
SDK="${1:?usage: build-mac.sh <AfterEffectsSDK folder> [tool]}"
TOOL="${2:-crt-phaser}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
EX="$(find "$SDK" -maxdepth 3 -type d -name Headers -path '*Examples*' | head -1)"; EX="${EX%/Headers}"
[ -d "$EX/Headers" ] || { echo "AE SDK headers not found under $SDK"; exit 1; }
case "$TOOL" in
  crt-phaser) NAME="Franks CRT Phaser Brew"; SRC="effects/crt-phaser"; MAIN="ae/crt_ae.cpp"; PIPL="ae/crt_pipl.r"; ENG="crt_engine.cpp";;
  mobglow) NAME="Franks Mobglow Brew"; SRC="effects/mobglow"; MAIN="ae/mob_ae.cpp"; PIPL="ae/mob_pipl.r"; ENG="mob_engine.cpp";;
  depthtone) NAME="Franks Depthtone Brew"; SRC="effects/depthtone"; MAIN="ae/dt_ae.cpp"; PIPL="ae/dt_pipl.r"; ENG="dt_engine.cpp";;
  decompressor) NAME="Franks Decompressor Brew"; SRC="effects/decompressor"; MAIN="ae/dc_ae.cpp"; PIPL="ae/dc_pipl.r"; ENG="dc_engine.cpp";;
  chrometone) NAME="Franks Chrometone Brew"; SRC="effects/chrometone"; MAIN="ae/ct_ae.cpp"; PIPL="ae/ct_pipl.r"; ENG="ct_engine.cpp";;
  dithers-brew) NAME="Franks Dithers Brew"; SRC="effects/dithers-brew"; MAIN="ae/di_ae.cpp"; PIPL="ae/di_pipl.r"; ENG="di_engine.cpp";;
  paint-brew) NAME="Franks Paint Brew"; SRC="effects/paint-brew"; MAIN="ae/pb_ae.cpp"; PIPL="ae/pb_pipl.r"; ENG="pb_engine.cpp";;
  all) for T in crt-phaser mobglow depthtone decompressor chrometone dithers-brew paint-brew; do "$0" "$SDK" "$T"; done; exit 0;;
  *) echo "unknown tool $TOOL"; exit 1;;
esac
OUT="$HERE/dist/mac"; B="$OUT/$NAME.plugin"; TMP="$(mktemp -d)"
rm -rf "$B"; mkdir -p "$B/Contents/MacOS" "$B/Contents/Resources"
INC=(-I"$EX/Headers" -I"$EX/Headers/SP" -I"$EX/Headers/Win" -I"$EX/Util" -I"$EX/Resources" -I"$HERE/core" -I"$HERE/$SRC" -I"$HERE/$SRC/ae")
for ARCH in arm64 x86_64; do
  clang++ -std=c++17 -O3 -arch $ARCH -mmacosx-version-min=11.0 -fvisibility=hidden -bundle \
    "${INC[@]}" "$HERE/$SRC/$MAIN" "$HERE/$SRC/$ENG" \
    -framework CoreFoundation -o "$TMP/bin-$ARCH"
done
lipo -create "$TMP/bin-arm64" "$TMP/bin-x86_64" -output "$B/Contents/MacOS/$NAME"
# PiPL resource (Rez ships with the Command Line Tools)
xcrun Rez -o "$B/Contents/Resources/$NAME.rsrc" -define __MACH__ -arch arm64 -arch x86_64 \
  -i "$EX/Headers" -i "$EX/Resources" -i "$HERE/$SRC/ae" -useDF "$HERE/$SRC/$PIPL"
cat > "$B/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleExecutable</key><string>$NAME</string>
  <key>CFBundleIdentifier</key><string>com.franks.$(echo $TOOL | tr -d -).ae</string>
  <key>CFBundleName</key><string>$NAME</string>
  <key>CFBundlePackageType</key><string>eFKT</string>
  <key>CFBundleSignature</key><string>FXTC</string>
  <key>CFBundleShortVersionString</key><string>1.0.0</string>
  <key>CFBundleVersion</key><string>1.0.0</string>
  <key>LSMinimumSystemVersion</key><string>11.0</string>
</dict></plist>
PLIST
printf 'eFKTFXTC' > "$B/Contents/PkgInfo"
codesign --force --deep -s - "$B"          # free ad-hoc signature (no Apple Developer ID)
rm -rf "$TMP"
echo "built: $B"
