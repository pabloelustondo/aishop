#!/bin/zsh
# Runs the pure-HTTP server-side end-to-end suite against local
# Firebase emulators only. The demo- project id keeps every emulator
# fully offline; no real Firebase project is ever contacted.
set -euo pipefail
cd "${0:a:h}/../.."

# The deployed function declares two secrets, OPENAI_API_KEY and
# AI_SHOP_CLIENT_TOKEN. In the emulator, firebase-functions resolves a secret
# from server/.secret.local and, failing that, asks Google Secret Manager —
# which is a network call to a real Google project, and is why this suite was
# not offline. Overriding one secret is not enough; the other still reaches
# out.
#
# The values are deliberately EMPTY rather than dummy strings. A dummy key is
# truthy, so the composition would build a real OpenAI analyzer and a run
# would try to reach the provider. Empty keeps it on its unconfigured path:
# no Secret Manager request, no provider call, and a run that settles `failed`
# with a provider reason — which is what step-04 already asserts.
#
# Any existing server/.secret.local is a developer's own file and is put back
# on every exit path, including a failed run or an interrupt.
SECRETS="server/.secret.local"
BACKUP="$(mktemp -t aishop-secret-local.XXXXXX)"
HAD_SECRETS=0

restore() {
  if (( HAD_SECRETS )); then
    mv -f "$BACKUP" "$SECRETS"
  else
    rm -f "$SECRETS"
  fi
  rm -f "$BACKUP"
}
trap restore EXIT INT TERM

if [[ -f "$SECRETS" ]]; then
  cp -p "$SECRETS" "$BACKUP"
  HAD_SECRETS=1
fi
printf 'OPENAI_API_KEY=\nAI_SHOP_CLIENT_TOKEN=\n' > "$SECRETS"

firebase emulators:exec \
  --config firebase.e2e.json \
  --project demo-aishop-e2e \
  --only auth,functions,firestore,storage \
  "node e2e/server/step-01-golden-receipt.mjs && node e2e/server/step-02-manifest-conflict.mjs && node e2e/server/step-03-persisted-evidence.mjs && node e2e/server/step-04-agent-upload.mjs && node server/scripts/e2e-agent-refine-persistence.mjs"
