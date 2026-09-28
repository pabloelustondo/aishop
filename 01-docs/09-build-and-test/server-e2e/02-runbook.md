# Server E2E Runbook

## Run the gate

From the repository root:

```zsh
./e2e/server/run.zsh
```

The command starts the Auth, Functions, Firestore, and Storage emulators,
runs every step, and shuts them down. Exit code `0` means every assertion
passed. A failing step aborts the run with a nonzero exit code.

## Current sequence

| Step | Main behavior covered |
|---|---|
| 01 | Golden inspection package, idempotent retry, missing authentication |
| 02 | Conflicting manifest rejection and owner isolation |
| 03 | Firestore receipt and byte-identical Storage evidence |
| 04 | Agent photograph upload, owner isolation, durable failure state |
| 05 | Successful refinement history persisted in Firestore |
| 06 | Queue failure, reconciliation, collection, and diagnostics |
| 07 | Agent role tool, sign-in, photograph `/run`, refinement, revocation |
| 08 | Admin list, filters, paging, detail, source, and read-only controls |
| 09 | MOV upload, FFmpeg frames, background analysis, private source read |

## Test composition

Steps 01–04 call the function running in the Functions emulator. Later
steps combine real server handlers with emulator Auth, Firestore, and
Storage so task delivery and provider completion can be deterministic.
OpenAI is disabled or represented by a fixture response. Cloud Tasks is
represented by an in-process queue whose work is passed to real handlers.

## Expected evidence

Each script prints one `PASS` line. Firebase then reports that the command
exited successfully. The scripts also assert HTTP status, stable error
codes, durable records, access boundaries, and stored bytes.

## Prerequisites

- Firebase CLI and Java 17 or newer.
- Server dependencies installed.
- Ports `5001`, `8080`, `9099`, and `9199` available.

Implementation details: [`e2e/server/README.md`](../../../e2e/server/README.md).
