# Sprint 008 — Offline Fix Validation

Codex, 2026-09-07. Local environment: macOS, `demo-aishop-e2e` emulators.
Pablo explicitly authorized implementing/testing before the plan commit.
HEAD advanced from `82119ed` to `dcfa34c` during this work; Codex made no commit.
The fixes below remain working-tree proposals on top of `dcfa34c`.

## Changes

- Firebase agent composition disables the provider only when both
  `FUNCTIONS_EMULATOR=true` and `GCLOUD_PROJECT=demo-aishop-e2e`.
  Deployed TEST still reads its configured secret and model normally.
- Both emulator secret overrides are nonempty, non-secret placeholders,
  satisfying the Firebase CLI without activating the demo agent provider.
- The launcher holds an exclusive lock, rejects symlinks/nonregular files,
  backs up before replacement, and tracks replacement separately.
  Backup failure leaves the original untouched; signal handling terminates
  the child and invokes cleanup once, preserving the exit status.
- Restoration failure retains the backup and lock for manual recovery;
  abrupt uncatchable termination still requires inspecting the retained lock.

## Verification

- Provider-selection tests: RED (module absent), then 3/3 GREEN.
- Secret-lifecycle tests: RED reproduced backup loss, interruption status,
  symlink and concurrency failures; then 7/7 GREEN with isolated fake files.
- `npm --prefix server test`: **253 tests, 253 passed, 0 failed/skipped**.
- `./e2e/server/run.zsh`: exit 0; **all five steps passed**, including
  successful-refinement persistence against Firestore emulation.
- Log checks: zero `Trying to access secret`, `secretmanager.googleapis.com`,
  or `api.openai.com` occurrences. Provider selection is also tested in code;
  log absence alone is not claimed as a complete network-egress audit.
- No local override existed before the real run; no override or lock remained.
- Shell syntax, `git diff --check`, and the predeploy startup check passed.
- Logs: `/private/tmp/sprint008-offline-fix-unit.log` and
  `/private/tmp/sprint008-offline-fix-e2e.log`.

## Boundary

The two reproduced task-6 blockers are resolved in the tested working tree.
No deployment, real-secret changes, paid provider call, or browser QA occurred.
Pablo reviews and commits the fixes before deployment of that exact commit.
