#!/bin/zsh
set -euo pipefail
export SWIFTPM_MODULECACHE_OVERRIDE="$PWD/.cache/module-cache"
export CLANG_MODULE_CACHE_PATH="$PWD/.cache/clang"
mkdir -p "$SWIFTPM_MODULECACHE_OVERRIDE" "$CLANG_MODULE_CACHE_PATH"
swift build -c release
APP="dist/Banpet.app"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp .build/release/BanpetMac "$APP/Contents/MacOS/BanpetMac"
cp Info.plist "$APP/Contents/Info.plist"
codesign --force --deep --sign - --entitlements BanpetMac.entitlements "$APP"
echo "Built $APP"
