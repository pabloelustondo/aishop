# Sprint 008 — Correction Set, Delivered Scope

Written by Claude, 2026-09-07. Nothing here is committed by me: the
working tree holds the proposal and the diff is the review.

## Environment

| | |
| --- | --- |
| Branch | `sprint-008-agent-upload` |
| Base commit | `82119ed` |
| Runtime | Node v22.23.2 |
| Host | Linux aarch64, a cloud-linked VM — **not** macOS |

## The eight tasks

Ordered as agreed in
[06-correction-tasks.md](../07-planning/sprints/sprint-008-agent-upload/06-correction-tasks.md).
Tasks 1, 2, 3 and 7 were committed by Pablo as `82119ed`; 4, 5, 6 and 8
are in the working tree.

| Task | Component | State |
| --- | --- | --- |
| 1 Retry preserves the note | `dashboard/scripts/agent.js` | committed |
| 2 Blank refinement refused | `dashboard/scripts/agent.js` | committed |
| 3 Reopened `analyzed` needs a note | `agent-analysis-store.js` | committed |
| 4 `context_required` contract | `agent-api-handler.js`, `agent-api-error.js` | working tree |
| 5 Log a route, never a path | `agent-api-handler.js` | working tree |
| 6 Emulator secrets local | `e2e/server/run.zsh` | working tree |
| 7 Previous-report comment | `agent-analysis-store.js` | committed |
| 8 Refinement persistence | `server/scripts/e2e-agent-refine-persistence.mjs` | working tree |

## Results as they came

`npm --prefix server test`:

```
# tests 229
# pass 209
# fail 20
```

Up from 218/198/20 before the corrections: 11 new tests, all passing.
The 20 failures are the same pre-existing `sharp` gap across the same 18
files — `test/firebase.test.js` and seventeen `test/vista-*`. No agent,
handler, router, page or hosting test is among them.

New coverage: 6 in `test/agent-page-behaviour.test.js`, 3 added to the
analysis store, 2 added to the API handler.

`git diff --check` — clean. No trailing whitespace in any changed file.
The handler no longer passes a caller-controlled path to any log call.

## Not verified here

- **`./e2e/server/run.zsh` was not run.** This host has no `firebase`
  CLI, and the functions emulator loads `sharp` through the VISTA
  decoder, which cannot load on linux-arm64. Task 6's whole point — no
  Secret Manager request, no provider call — and task 8's new step are
  therefore written but unexecuted. **Both need a run on macOS before
  this set can be called done.**
- `zsh -n e2e/server/run.zsh` was not run either; zsh is not installed
  on this host. The script was checked by reading.

## Judgement calls

1. **The page test lives in `server/test/`.** `npm --prefix server test`
   is the repository's only runner; a file under `dashboard/` would
   never execute. The file says so in its header.
2. **`agent.js` was made importable.** To get a failing test at all,
   `element()` now tolerates a missing `document` and the page wiring
   moved into a guarded `start()`. Mechanical; no behaviour change
   beyond task 1 itself.
3. **Tasks 3 and 7 landed in one edit.** Both are small changes to
   `agent-analysis-store.js`. That departs from one-task-one-change.
4. **Task 2's failing test was written with task 1's.** Both cover
   exported decisions of the same module, so the RED for `refinementNote`
   appeared during task 1 rather than at the start of task 2.
5. **Task 8 sits in `server/scripts/`, not `e2e/`.** It imports
   firebase-admin and there is no node_modules at the repository root.
6. **Empty secrets, not dummy ones.** A dummy key is truthy, so the
   composition would build a real analyzer and a run would reach the
   provider. Empty keeps the unconfigured path: no network either way.
