#!/usr/bin/env bash
# Focused real composition: local persistence/auth, simulated provider and queue.
# Does not replace the full server E2E gate or load any real provider credential.
set -euo pipefail
firebase emulators:exec --config firebase.sprint015.e2e.json \
  --project demo-aishop-e2e --only auth,firestore,storage \
  'node e2e/server/step-07-agent-programmatic.mjs'
