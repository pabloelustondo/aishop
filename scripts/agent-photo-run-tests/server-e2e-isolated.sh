#!/usr/bin/env bash
# Same gate, separate local ports; leaves other running emulators alone.
set -euo pipefail
export FIREBASE_E2E_CONFIG=firebase.sprint015.e2e.json
export VISTA_E2E_FUNCTION_URL=http://127.0.0.1:15001/demo-aishop-e2e/northamerica-northeast2/api
./e2e/server/run.zsh
