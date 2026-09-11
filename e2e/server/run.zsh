#!/bin/zsh
# Local demo integration gate. Nonempty placeholders prevent cloud secret
# lookups; Firebase composition disables agent provider calls in this emulator.
set -euo pipefail
cd "${0:a:h}/../.."
umask 077

SECRETS="server/.secret.local"
LOCK="server/.secret.local.e2e-lock"
# A concurrent run must not back up or restore another run's placeholders.
mkdir "$LOCK" || { print -u2 "Emulator secrets already owned; inspect $LOCK."; exit 1; }
BACKUP="$LOCK/original"
HAD_SECRETS=0
OVERRIDE_INSTALLED=0
EMULATOR_PID=""

restore() {
  local result=$?
  trap - EXIT INT TERM
  if (( OVERRIDE_INSTALLED )); then
    if (( HAD_SECRETS )); then
      if ! mv -f "$BACKUP" "$SECRETS"; then
        print -u2 "Restore failed; original preserved at $BACKUP."
        exit 1
      fi
    else
      rm -f "$SECRETS" || exit 1
    fi
  fi
  rm -f "$BACKUP" "$LOCK/override"
  rmdir "$LOCK"
  exit "$result"
}
interrupt() {
  local result=$1
  trap '' INT TERM
  if [[ -n "$EMULATOR_PID" ]]; then
    kill -TERM "$EMULATOR_PID" 2>/dev/null || true
    wait "$EMULATOR_PID" 2>/dev/null || true
  fi
  exit "$result"
}
trap restore EXIT
trap 'interrupt 130' INT
trap 'interrupt 143' TERM

if [[ -L "$SECRETS" || ( -e "$SECRETS" && ! -f "$SECRETS" ) ]]; then
  print -u2 "Refusing unsupported secret-file type."
  exit 1
fi
if [[ -f "$SECRETS" ]]; then
  HAD_SECRETS=1
  # Failure here leaves OVERRIDE_INSTALLED=0: cleanup never removes the original.
  cp -p "$SECRETS" "$BACKUP"
fi
printf 'OPENAI_API_KEY=local-emulator-disabled\nAI_SHOP_CLIENT_TOKEN=local-emulator-disabled\n' > "$LOCK/override"
# Set before atomic replacement so an interrupt cannot bypass restoration.
OVERRIDE_INSTALLED=1
mv -f "$LOCK/override" "$SECRETS"

firebase emulators:exec \
  --config firebase.e2e.json \
  --project demo-aishop-e2e \
  --only auth,functions,firestore,storage \
  "node e2e/server/step-01-golden-receipt.mjs && node e2e/server/step-02-manifest-conflict.mjs && node e2e/server/step-03-persisted-evidence.mjs && node e2e/server/step-04-agent-upload.mjs && node server/scripts/e2e-agent-refine-persistence.mjs && node server/scripts/e2e-agent-observability.mjs && node e2e/server/step-07-agent-programmatic.mjs && node e2e/server/step-08-admin-all-runs.mjs" &
EMULATOR_PID=$!
wait "$EMULATOR_PID"
