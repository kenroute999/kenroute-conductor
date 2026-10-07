#!/usr/bin/env bash
# Builds and installs the KenRoute Conductor Android shell with the SDK tools only (no Gradle).
# Usage (Git Bash, phone connected by USB):  bash android-shell/build.sh
set -euo pipefail

SDK="${ANDROID_HOME:-/d/tools/android-sdk}"
BT="$SDK/build-tools/36.0.0"
JAR="$SDK/platforms/android-36/android.jar"
KEYSTORE="$HOME/.android/debug.keystore" # debug key: fine for testing, not for the Play Store
HERE="$(cd "$(dirname "$0")" && pwd)"
# d8.bat and apksigner.bat break on paths with spaces, so build outside the project folder.
OUT="${TEMP:-/tmp}/kenroute-conductor-apk"

rm -rf "$OUT" && mkdir -p "$OUT/classes" "$OUT/dex"

"$BT/aapt2" compile --dir "$HERE/res" -o "$OUT/res.zip"
# targetSdk 34: from 35 Android forces the page to draw under the status bar.
"$BT/aapt2" link -o "$OUT/base.apk" -I "$JAR" --manifest "$HERE/AndroidManifest.xml" \
  --min-sdk-version 24 --target-sdk-version 34 --version-code 1 --version-name 0.1 "$OUT/res.zip"

javac -nowarn --release 11 -cp "$JAR" -d "$OUT/classes" "$HERE/src/com/kenroute/conductor/MainActivity.java"
"$BT/d8.bat" --lib "$JAR" --min-api 24 --output "$OUT/dex" "$OUT"/classes/com/kenroute/conductor/*.class
(cd "$OUT/dex" && "$BT/aapt" add ../base.apk classes.dex >/dev/null)

"$BT/zipalign" -f 4 "$OUT/base.apk" "$OUT/aligned.apk"
"$BT/apksigner.bat" sign --ks "$KEYSTORE" --ks-pass pass:android --out "$OUT/kenroute-conductor.apk" "$OUT/aligned.apk"

echo "Built: $OUT/kenroute-conductor.apk"
adb install -r "$OUT/kenroute-conductor.apk"
# The shell loads the laptop's dev server and backend through the cable.
adb reverse tcp:3003 tcp:3003
adb reverse tcp:5000 tcp:5000
adb shell am start -n com.kenroute.conductor/.MainActivity
