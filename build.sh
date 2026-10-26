#!/bin/bash
# Assembles the two builds into dist/ and zips the public one for the Chrome Web Store.
#
#   public — what gets published. Adds a link from each player name on
#            live-tennis.eu to that player's own page on tennistonic.com.
#            It copies no page content and touches no other site.
#
#   full   — the local build. Everything in public, plus the sortable
#            points-and-expiry table and the in-page rewrite of
#            tennistonic's breakdown. Load this one unpacked.
set -euo pipefail
cd "$(dirname "$0")"

VERSION=$(python3 -c "import json;print(json.load(open('manifest.public.json'))['version'])")
rm -rf dist
mkdir -p dist/public/src/lib dist/public/icons dist/full/src/lib

# ---- public build -----------------------------------------------------------
cp manifest.public.json dist/public/manifest.json
cp go.html dist/public/
cp icons/icon-16.png icons/icon-48.png icons/icon-128.png dist/public/icons/
cp src/go.js src/target-public.js src/inject-livetennis.js dist/public/src/
cp src/inject.css src/table.css src/viewer.css dist/public/src/
cp src/lib/parse.js dist/public/src/lib/

# ---- full build -------------------------------------------------------------
cp manifest.json dist/full/manifest.json
cp viewer.html dist/full/
cp src/viewer.js src/target-full.js src/inject-livetennis.js src/enhance-tennistonic.js dist/full/src/
cp src/inject.css src/table.css src/viewer.css dist/full/src/
cp src/lib/parse.js src/lib/render.js dist/full/src/lib/

# ---- package ----------------------------------------------------------------
ZIP="dist/tennis-ranking-points-breakdown-v${VERSION}.zip"
( cd dist/public && zip -qr "../$(basename "$ZIP")" . -x '.*' -x '__MACOSX/*' )

echo "public build : dist/public"
echo "full build   : dist/full"
echo "store package: $ZIP ($(du -h "$ZIP" | cut -f1))"
echo
echo "Files in the store package:"
unzip -Z1 "$ZIP" | sed 's/^/  /'
