# Sprint 008 — Offline Emulator Follow-up

Proposal, Codex 2026-09-07. Supersedes task 6's empty-secret mechanism in
[06-correction-tasks.md](06-correction-tasks.md); does not authorize deployment.

## Problem and evidence

The [independent correction review](../../../09-build-and-test/sprint-008-corrections-independent-review.md)
reproduced two defects: empty local secret values still trigger Secret
Manager requests, and a failed backup can delete the original secret file.
All 243 unit tests and five emulator steps passed despite those defects.

## Ordered tasks

1. **Firebase composition — disable the provider in local emulation.**
   Configure the agent handler with its existing unconfigured analyzer
   when running under the Functions emulator for `demo-aishop-e2e`.
   Keep the deployed TEST provider selection unchanged. Verify both
   branches with composition tests; never log or embed real credentials.
2. **Emulator suite — safe local secrets and cleanup.**
   Supply non-secret, nonempty local values for both declared secrets
   so Firebase does not fall back to Secret Manager. Task 1 prevents
   the agent run from treating the placeholder as a live provider key.
   Preserve an existing `.secret.local` before replacing it; abort
   without changing it if backup fails. Track original-file presence,
   backup success and replacement separately. Make cleanup idempotent,
   preserve exit status, and handle interruption without double restore.
   Refuse concurrent ownership and unsupported file types rather than
   overwriting another process's file or following a symlink.

## Validation

- Task 1 tests distinguish emulator/demo configuration from deployed TEST.
- Task 2 uses fake secret files to test success, child-command failure,
  backup failure and interruption; original contents must survive.
- `zsh -n e2e/server/run.zsh` and `npm --prefix server test` pass.
- Run `./e2e/server/run.zsh`: all five steps pass; neither secret lookup
  appears in the log, and the agent uses the unconfigured provider path.
- Record the actual evidence and `git diff --check` result.

## Gate and deployment

Pablo's commit of this proposal is required before these implementation
tasks begin, unless he explicitly grants an exception to that gate.
After implementation and review, Pablo commits the corrected tree.
Deployment then names that exact commit and targets TEST `aishop-99d36`.
No agent commits, pushes, merges, or changes real secrets.
