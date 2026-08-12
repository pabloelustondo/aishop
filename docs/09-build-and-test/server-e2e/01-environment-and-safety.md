# Server E2E — Environment and Safety

HumanReviewerInitials: PME

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

The function declares `OPENAI_API_KEY` and `AI_SHOP_CLIENT_TOKEN`.
The VISTA endpoint never reads them, but the emulator loads them from
`server/.secret.local`, which is gitignored. Populate it with dummy
values only; never place a real secret in it for end-to-end runs:

```text
OPENAI_API_KEY=e2e-dummy-openai-key
AI_SHOP_CLIENT_TOKEN=e2e-dummy-client-token
```

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
repository root; all are gitignored. No other repository file changes.
