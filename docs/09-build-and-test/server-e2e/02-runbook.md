# Server E2E — Runbook

HumanReviewerInitials: PME

## Run everything

```zsh
./e2e/server/run.zsh
```

The script starts the auth, functions, firestore, and storage emulators
with the isolated configuration, executes every step, and shuts the
emulators down. Exit code 0 means every step passed.

## Expected output

Each step prints one `PASS step-NN: ...` line. The final lines report
`Script exited successfully (code 0)`. Any assertion failure aborts the
run with a non-zero exit code and the failing comparison.

## Current coverage

| Step | Proves | Status |
|---|---|---|
| `step-01-golden-receipt` | Golden package earns `201` with a receipt; an identical retry returns the identical receipt with `200`; a missing token earns `401 unauthorized`. | PASSING (2026-08-12) |
| `step-02-manifest-conflict` | The same run with different manifest bytes earns `409 run_manifest_conflict` (non-retryable); the original receipt is returned intact afterward; a fresh user proves owner isolation. | PASSING (2026-08-12) |
| `step-03-persisted-evidence` | Happy path: after a `201`, the database record says `received` with the same receipt, exactly three objects exist under the owner/run path, and the stored JPEG is byte-identical to the upload. | PASSING (2026-08-12) |

## How each step works

Steps are plain Node scripts in `e2e/server/`, run inside
`firebase emulators:exec`. They mint a real ID token from the Auth
emulator (`emulator-auth.mjs`), build the golden multipart package from
the vendored contract fixtures via `server/test-support/`, and make
plain `fetch` calls to the emulated function URL. Assertions use
`node:assert/strict` and fail loudly.

## Adding a step

1. Add one `step-NN-<concern>.mjs` file with exactly one concern,
   at most 50 lines, asserting on status, stable error code, and body.
2. Append it to the command list in `run.zsh`.
3. Register the step in the coverage table above with its date.
4. A step must consume vendored fixtures or derive corruption from
   them; never hand-craft a second copy of contract data.

## Troubleshooting

- Port in use: stop other emulator sessions first. `Java not found`:
  install a JRE 17+. The `node@22` version warning is expected locally.
