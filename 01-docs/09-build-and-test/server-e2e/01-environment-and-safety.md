# Server E2E — Environment and Safety

## Emulator-only, fully offline

The suite runs exclusively inside `firebase emulators:exec` with the
project id `demo-aishop-e2e`. Firebase treats every `demo-*` project as
offline: emulators accept it, and no request can reach a real Firebase
project, real Storage bucket, real database, or billing surface.

## Isolated configuration

The run uses `firebase.e2e.json` at the repository root, not the
deployable `firebase.json`. It declares the same `server` functions
source plus the four required emulators (auth, functions, firestore,
storage) and a deny-all `e2e/server/storage.e2e.rules` file that mirrors
the production stance for client access; the server's Admin SDK
legitimately bypasses rules.

## Secrets

The function declares `OPENAI_API_KEY` and `AI_SHOP_CLIENT_TOKEN`, but an
E2E run must never use real provider credentials. `run.zsh` acquires an
exclusive lock, backs up an existing `server/.secret.local`, installs
nonempty local placeholders, and restores the original file on exit.

The script refuses symlinks and unsupported secret-file types. An
interrupted run also executes the restoration trap. If restoration fails,
the original remains inside `server/.secret.local.e2e-lock/` for recovery.

## Startup configuration under test

The emulator loads `server/.env`, so the fail-closed VISTA limit
configuration is exercised exactly as at deployment: a missing or
altered value must abort function loading, which the suite would surface
as a startup failure, not a silent fallback.

## Prerequisites

- `firebase-tools` CLI (14+) and a Java runtime (17+) on the machine.
- `npm install` completed inside `server/`.
- Ports 5001, 8080, 9099, and 9199 free.

## What a run may write

Emulator debug logs (`firestore-debug.log`, `firebase-debug.log`) in the
repository root are gitignored. During execution, the script temporarily
owns `server/.secret.local` and a lock directory; cleanup restores the
original state.
