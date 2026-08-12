#!/bin/zsh
# Runs the pure-HTTP server-side end-to-end suite against local
# Firebase emulators only. The demo- project id keeps every emulator
# fully offline; no real Firebase project is ever contacted.
set -euo pipefail
cd "${0:a:h}/../.."
exec firebase emulators:exec \
  --config firebase.e2e.json \
  --project demo-aishop-e2e \
  --only auth,functions,firestore,storage \
  "node e2e/server/step-01-golden-receipt.mjs && node e2e/server/step-02-manifest-conflict.mjs && node e2e/server/step-03-persisted-evidence.mjs"
